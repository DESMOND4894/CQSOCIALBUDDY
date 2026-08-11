"use client";

import { FormEvent, useMemo, useState } from "react";
import Image from "next/image";
import {
  CheckCircle2,
  Eye,
  Images,
  LockKeyhole,
  Send,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  CELTIC_QUEST_AD_PHOTOS,
  CELTIC_QUEST_CONTEXT,
  CELTIC_QUEST_PRIVATE_CHARTER_COPY_OPTIONS,
  CELTIC_QUEST_PRIVATE_CHARTER_PHOTO_IDS,
  photoMatchesFamilyCopy,
} from "@/lib/ads-agent/celtic-quest-context";

const DEFAULTS = {
  name: "Private Family and Group Charters",
  destinationUrl: CELTIC_QUEST_CONTEXT.privateChartersUrl,
  dailyBudget: "20",
};

export function AdDraftBuilder({ demoMode = false }: { demoMode?: boolean }) {
  const [values, setValues] = useState(DEFAULTS);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>(
    [...CELTIC_QUEST_PRIVATE_CHARTER_PHOTO_IDS]
  );
  const [focusedPhotoId, setFocusedPhotoId] = useState<string>(
    CELTIC_QUEST_PRIVATE_CHARTER_PHOTO_IDS[0]
  );
  const [selectedCopyIds, setSelectedCopyIds] = useState<string[]>(
    CELTIC_QUEST_PRIVATE_CHARTER_COPY_OPTIONS.map((option) => option.id)
  );
  const [focusedCopyId, setFocusedCopyId] = useState<string>(
    CELTIC_QUEST_PRIVATE_CHARTER_COPY_OPTIONS[0].id
  );
  const [approved, setApproved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const privateCharterPhotos = useMemo(
    () =>
      CELTIC_QUEST_AD_PHOTOS.filter((photo) =>
        CELTIC_QUEST_PRIVATE_CHARTER_PHOTO_IDS.includes(
          photo.id as (typeof CELTIC_QUEST_PRIVATE_CHARTER_PHOTO_IDS)[number]
        )
      ),
    []
  );
  const selectedPhotos = useMemo(
    () =>
      privateCharterPhotos.filter((photo) =>
        selectedPhotoIds.includes(photo.id)
      ),
    [privateCharterPhotos, selectedPhotoIds]
  );
  const focusedPhoto =
    privateCharterPhotos.find((photo) => photo.id === focusedPhotoId) ??
    selectedPhotos[0];
  const selectedCopyOptions = CELTIC_QUEST_PRIVATE_CHARTER_COPY_OPTIONS.filter(
    (option) => selectedCopyIds.includes(option.id)
  );
  const focusedCopy =
    CELTIC_QUEST_PRIVATE_CHARTER_COPY_OPTIONS.find(
      (option) => option.id === focusedCopyId
    ) ?? selectedCopyOptions[0];
  const combinedCopy = selectedCopyOptions
    .map(
      (option) =>
        `${option.primaryText} ${option.headline} ${option.description}`
    )
    .join(" ");
  const familyCreativeMatches =
    selectedPhotos.length >= 4 &&
    selectedCopyOptions.length >= 1 &&
    selectedPhotos.every((photo) =>
      photoMatchesFamilyCopy(photo.id, combinedCopy)
    );

  function togglePhoto(photoId: string, selected: boolean) {
    const nextIds = selected
      ? [...new Set([...selectedPhotoIds, photoId])]
      : selectedPhotoIds.filter((id) => id !== photoId);
    setSelectedPhotoIds(nextIds);
    if (!selected && focusedPhotoId === photoId && nextIds[0]) {
      setFocusedPhotoId(nextIds[0]);
    }
    setApproved(false);
    setMessage(null);
  }

  function toggleCopy(copyId: string, selected: boolean) {
    const nextIds = selected
      ? [...new Set([...selectedCopyIds, copyId])]
      : selectedCopyIds.filter((id) => id !== copyId);
    setSelectedCopyIds(nextIds);
    if (!selected && focusedCopyId === copyId && nextIds[0]) {
      setFocusedCopyId(nextIds[0]);
    }
    setApproved(false);
    setMessage(null);
  }

  function update(name: keyof typeof DEFAULTS, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
    setApproved(false);
    setMessage(null);
  }

  function approveBundle() {
    if (!familyCreativeMatches) return;
    setApproved(true);
    setMessage(
      `Approved locally: ${selectedCopyOptions.length} copy versions, ${selectedPhotos.length} exact CQ photos, audience, budget, destination, and tracking plan. Nothing has been sent to Meta.`
    );
  }

  async function createDraft(event: FormEvent) {
    event.preventDefault();
    if (!approved || !familyCreativeMatches) return;
    if (demoMode) {
      setMessage(
        "Bundle approved in preview. Nothing was sent to Meta. Sign in to the main Ads Agent only when you want to create the paused Meta draft."
      );
      return;
    }

    setSubmitting(true);
    setMessage(null);
    const body = new FormData();
    Object.entries(values).forEach(([key, value]) => body.set(key, value));
    body.set("campaignType", "private-charter-leads");
    body.set("photoIds", JSON.stringify(selectedPhotoIds));
    body.set("copyOptionIds", JSON.stringify(selectedCopyIds));
    body.set("approval", "approved");
    const imageFiles = await Promise.all(
      selectedPhotos.map(async (photo) => {
        const response = await fetch(photo.path);
        if (!response.ok) throw new Error(`Could not load ${photo.label}.`);
        const blob = await response.blob();
        return new File([blob], photo.fileName, { type: blob.type });
      })
    );
    imageFiles.forEach((image) => body.append("images", image));

    try {
      const response = await fetch("/api/ads-agent/meta-drafts", {
        method: "POST",
        body,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Draft creation failed.");
      setMessage(
        `Paused private-charter draft created with ${data.result.copyCount} copy versions, ${data.result.photoCount} CQ photos, and UTM tracking. Ad ID: ${data.result.adId}`
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Draft creation failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={createDraft} className="grid gap-6 xl:grid-cols-[1fr_420px]">
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5 text-sm font-medium">
            Draft name
            <Input
              value={values.name}
              onChange={(event) => update("name", event.target.value)}
              required
            />
          </label>
          <label className="space-y-1.5 text-sm font-medium">
            Daily budget
            <div className="relative">
              <span className="absolute left-3 top-2 text-sm text-muted-foreground">$</span>
              <Input
                className="pl-7"
                type="number"
                min="1"
                max="1000"
                step="1"
                value={values.dailyBudget}
                onChange={(event) => update("dailyBudget", event.target.value)}
                required
              />
            </div>
          </label>
        </div>
        <label className="block space-y-1.5 text-sm font-medium">
          Destination
          <Input
            type="url"
            value={values.destinationUrl}
            onChange={(event) => update("destinationUrl", event.target.value)}
            required
          />
        </label>
        <div className="space-y-2">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Copy iterations</p>
              <p className="text-xs text-muted-foreground">
                Choose 1–4 distinct angles. Click a card to preview its complete copy.
              </p>
            </div>
            <Badge variant="secondary">
              {selectedCopyOptions.length} selected
            </Badge>
          </div>
          <div className="grid gap-3">
            {CELTIC_QUEST_PRIVATE_CHARTER_COPY_OPTIONS.map((option) => {
              const isSelected = selectedCopyIds.includes(option.id);
              const isFocused = focusedCopyId === option.id;
              return (
                <div
                  key={option.id}
                  className={`rounded-lg border p-3 ${
                    isFocused
                      ? "border-indigo-500 ring-2 ring-indigo-200"
                      : "border-border"
                  } ${isSelected ? "" : "opacity-60"}`}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) =>
                        toggleCopy(option.id, checked === true)
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setFocusedCopyId(option.id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <span className="block text-sm font-semibold">
                        {option.label}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {option.angle}
                      </span>
                      <span className="mt-2 block whitespace-pre-line text-xs">
                        {option.primaryText}
                      </span>
                      <span className="mt-2 block text-xs font-semibold">
                        Headline: {option.headline}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Private-charter photo bundle</p>
              <p className="text-xs text-muted-foreground">
                Ten real CQ choices from the supplied photo library. Select 4–10.
              </p>
            </div>
            <Badge variant="secondary">{selectedPhotos.length} selected</Badge>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {privateCharterPhotos.map((photo) => {
              const isSelected = selectedPhotoIds.includes(photo.id);
              return (
                <div
                  key={photo.id}
                  className={`overflow-hidden rounded-lg border ${
                    isSelected
                      ? "border-indigo-500 ring-2 ring-indigo-200"
                      : "border-border opacity-60"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setFocusedPhotoId(photo.id)}
                    className="relative block w-full"
                    aria-label={`Preview ${photo.label}`}
                  >
                    <Image
                      src={photo.path}
                      alt={photo.label}
                      width={420}
                      height={300}
                      className="aspect-[1.4/1] w-full object-cover"
                    />
                    <span className="absolute bottom-2 right-2 rounded-full bg-black/70 p-1.5 text-white">
                      <Eye className="h-3.5 w-3.5" />
                    </span>
                  </button>
                  <label className="flex cursor-pointer items-start gap-2 p-2 text-xs">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) =>
                        togglePhoto(photo.id, checked === true)
                      }
                    />
                    <span>{photo.label}</span>
                  </label>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div>
              <p className="text-sm font-semibold">Celtic Quest Fishing Fleet</p>
              <p className="text-xs text-muted-foreground">Sponsored · Draft preview</p>
            </div>
            <Badge variant="outline">PAUSED</Badge>
          </div>
          <div className="whitespace-pre-line px-4 py-3 text-sm">
            {focusedCopy?.primaryText}
          </div>
          <div className="grid aspect-[1.91/1] place-items-center bg-muted">
            {focusedPhoto ? (
              <Image
                src={focusedPhoto.path}
                alt={focusedPhoto.label}
                width={1200}
                height={628}
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
          <div className="flex items-center justify-between gap-4 bg-muted/40 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-xs uppercase text-muted-foreground">celticquestfishing.com</p>
              <p className="truncate text-sm font-semibold">
                {focusedCopy?.headline}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {focusedCopy?.description}
              </p>
            </div>
            <Button type="button" variant="secondary" size="sm">Learn more</Button>
          </div>
        </div>

        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Images className="h-4 w-4" />
            Exact bundle to approve
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <dt className="text-muted-foreground">Photos</dt>
            <dd>{selectedPhotos.length} real CQ variations</dd>
            <dt className="text-muted-foreground">Copy</dt>
            <dd>{selectedCopyOptions.length} distinct angles</dd>
            <dt className="text-muted-foreground">Campaign</dt>
            <dd>Private family &amp; group charters</dd>
            <dt className="text-muted-foreground">Optimization</dt>
            <dd>Website leads</dd>
            <dt className="text-muted-foreground">Audience</dt>
            <dd>Age 25–65, 8 approved local areas</dd>
            <dt className="text-muted-foreground">Budget</dt>
            <dd>${values.dailyBudget}/day, paused</dd>
            <dt className="text-muted-foreground">Tracking</dt>
            <dd>CQ pixel Lead + dynamic UTMs (event unverified)</dd>
          </dl>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          {!familyCreativeMatches && (
            <p role="alert" className="mb-3 text-sm font-medium text-amber-950">
              Creative mismatch: family or kids copy requires a verified photo
              that visibly includes families or children. Select at least four
              matching photos and one copy option.
            </p>
          )}
          <div className="flex items-start gap-3 text-sm">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-800" />
            <span>
              <span className="font-semibold">
                Approval happens before Meta creation.
              </span>
              <span className="mt-1 block text-amber-900/75">
                First approve this exact bundle. A separate button then creates
                the paused Meta draft.
              </span>
            </span>
          </div>
        </div>
        {!approved ? (
          <Button
            className="w-full"
            type="button"
            disabled={!familyCreativeMatches}
            onClick={approveBundle}
          >
            <CheckCircle2 />
            Approve {selectedCopyOptions.length} copy versions +{" "}
            {selectedPhotos.length} photos
          </Button>
        ) : (
          <Button className="w-full" type="submit" disabled={submitting}>
            {submitting ? <LockKeyhole className="animate-pulse" /> : <Send />}
            {submitting
              ? "Creating paused draft…"
              : demoMode
                ? "Confirm preview only — do not send to Meta"
                : "Create this approved paused draft in Meta"}
          </Button>
        )}
        {message && (
          <p className="flex items-start gap-2 rounded-lg border p-3 text-sm">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            {message}
          </p>
        )}
      </div>
    </form>
  );
}
