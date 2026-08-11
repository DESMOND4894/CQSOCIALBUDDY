import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/require-auth";
import {
  createPausedMetaDraft,
  getMetaAdsReadiness,
} from "@/lib/ads-agent/meta-drafts";
import {
  CELTIC_QUEST_AD_PHOTOS,
  CELTIC_QUEST_PRIVATE_CHARTER_COPY_OPTIONS,
  photoMatchesFamilyCopy,
} from "@/lib/ads-agent/celtic-quest-context";

const fieldsSchema = z.object({
  name: z.string().min(3).max(120),
  destinationUrl: z.string().url().refine((url) => url.startsWith("https://")),
  dailyBudget: z.coerce.number().min(1).max(1000),
  approval: z.literal("approved"),
  campaignType: z.literal("private-charter-leads"),
  photoIds: z.string().min(2).max(2000),
  copyOptionIds: z.string().min(2).max(1000),
});

export async function GET() {
  const auth = await requireAuth();
  if (auth.response) return auth.response;
  return NextResponse.json(getMetaAdsReadiness());
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  const formData = await request.formData();
  const parsed = fieldsSchema.safeParse(Object.fromEntries(formData.entries()));
  const images = formData
    .getAll("images")
    .filter((image): image is File => image instanceof File);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Complete every required field and choose the photo bundle." },
      { status: 400 }
    );
  }

  let photoIds: string[];
  let copyOptionIds: string[];
  try {
    const decoded = JSON.parse(parsed.data.photoIds);
    const decodedCopyOptions = JSON.parse(parsed.data.copyOptionIds);
    photoIds =
      Array.isArray(decoded) && decoded.every((id) => typeof id === "string")
        ? [...new Set(decoded)]
        : [];
    copyOptionIds =
      Array.isArray(decodedCopyOptions) &&
      decodedCopyOptions.every((id) => typeof id === "string")
        ? [...new Set(decodedCopyOptions)]
        : [];
  } catch {
    photoIds = [];
    copyOptionIds = [];
  }
  if (photoIds.length < 4 || photoIds.length > 10 || images.length !== photoIds.length) {
    return NextResponse.json(
      { error: "Approve and submit between 4 and 10 exact photo variations." },
      { status: 400 }
    );
  }
  if (copyOptionIds.length < 1 || copyOptionIds.length > 4) {
    return NextResponse.json(
      { error: "Approve and submit between 1 and 4 exact copy versions." },
      { status: 400 }
    );
  }

  const approvedPhotos = photoIds.map((photoId) =>
    CELTIC_QUEST_AD_PHOTOS.find((photo) => photo.id === photoId)
  );
  const copyOptions = copyOptionIds.map((copyOptionId) =>
    CELTIC_QUEST_PRIVATE_CHARTER_COPY_OPTIONS.find(
      (option) => option.id === copyOptionId
    )
  );
  if (copyOptions.some((option) => !option)) {
    return NextResponse.json(
      { error: "Every copy version must match an approved CQ copy option." },
      { status: 400 }
    );
  }
  const approvedCopyOptions = copyOptions.filter(
    (option): option is NonNullable<typeof option> => Boolean(option)
  );
  const copy = approvedCopyOptions
    .map(
      (option) =>
        `${option.primaryText} ${option.headline} ${option.description}`
    )
    .join(" ");
  if (
    approvedPhotos.some(
      (photo, index) =>
        !photo ||
        !photoMatchesFamilyCopy(photoIds[index], copy) ||
        images[index]?.name !== photo.fileName
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Every submitted image must match the exact approved CQ family-photo bundle.",
      },
      { status: 400 }
    );
  }
  if (
    images.some(
      (image) =>
        !["image/jpeg", "image/png"].includes(image.type) ||
        image.size > 10_000_000
    )
  ) {
    return NextResponse.json(
      { error: "Every variation must be a JPG or PNG smaller than 10 MB." },
      { status: 400 }
    );
  }

  const idempotencyKey = createHash("sha256")
    .update(
      JSON.stringify({
        userId: auth.user.id,
        name: parsed.data.name,
        copyOptionIds,
        destinationUrl: parsed.data.destinationUrl,
        images: images.map((image) => ({
          name: image.name,
          size: image.size,
        })),
      })
    )
    .digest("hex");

  try {
    const result = await createPausedMetaDraft({
      ...parsed.data,
      dailyBudgetCents: Math.round(parsed.data.dailyBudget * 100),
      images,
      copyOptions: approvedCopyOptions,
      idempotencyKey,
    });
    return NextResponse.json({ result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Meta draft creation failed.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
