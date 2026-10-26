import { graphPost, graphRead } from "./paused-graph";
import { CELTIC_QUEST_PROVEN_TARGETING_BASELINE } from "./celtic-quest-context";

const ALLOWED_ACCOUNT_ID = "255186019073177";
const ALLOWED_PIXEL_ID = "272943549577718";
const ATTRIBUTION_SPEC = [
  { event_type: "CLICK_THROUGH", window_days: 1 },
];
const URL_TAGS = [
  "utm_source={{site_source_name}}",
  "utm_medium=paid_social",
  "utm_campaign={{campaign.id}}",
  "utm_content={{ad.id}}",
  "utm_term={{adset.id}}",
].join("&");

type MetaDraftInput = {
  name: string;
  destinationUrl: string;
  dailyBudgetCents: number;
  campaignType: "private-charter-leads";
  images: File[];
  copyOptions: Array<{
    id: string;
    primaryText: string;
    headline: string;
    description: string;
  }>;
  idempotencyKey: string;
};

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

async function assertDraftDoesNotExist(
  accountPath: string,
  campaignName: string
) {
  let after: string | undefined;
  do {
    const data = await graphRead(`${accountPath}/campaigns`, {
      fields: "id,name", limit: "100", ...(after ? { after } : {}),
    });
    if (data.data?.some((campaign: { name: string }) => campaign.name === campaignName)) {
      throw new Error("Meta draft already exists; no duplicate created.");
    }
    after = data.paging?.next ? data.paging?.cursors?.after : undefined;
    if (data.paging?.next && !after) throw new Error("Meta duplicate check incomplete.");
  } while (after);
}

export function getMetaAdsReadiness() {
  return {
    connected: Boolean(
      process.env.META_ADS_ACCESS_TOKEN &&
        process.env.META_ADS_ACCOUNT_ID === ALLOWED_ACCOUNT_ID
    ),
    accountId: ALLOWED_ACCOUNT_ID,
    writesEnabled: process.env.META_ADS_WRITES_ENABLED === "true",
    tracking: {
      objective: "OUTCOME_LEADS",
      optimizationGoal: "OFFSITE_CONVERSIONS",
      pixelId: ALLOWED_PIXEL_ID,
      measuredWebsiteEvent: "Lead",
      eventVerification: "UNVERIFIED",
      urlTags: URL_TAGS,
    },
  };
}

export async function createPausedMetaDraft(input: MetaDraftInput) {
  const configuredAccount = requiredEnv("META_ADS_ACCOUNT_ID");
  if (configuredAccount !== ALLOWED_ACCOUNT_ID) {
    throw new Error("The configured Meta ad account is not allowed.");
  }
  if (process.env.META_ADS_WRITES_ENABLED !== "true") {
    throw new Error("Meta draft creation is locked. Writes remain disabled.");
  }
  if (process.env.META_ADS_TARGETING_PLAN_APPROVED !== "cq-targeting-v1") {
    throw new Error(
      "Meta draft creation is locked until an approved targeting plan is attached."
    );
  }

  const token = requiredEnv("META_ADS_ACCESS_TOKEN");
  const pageId = requiredEnv("META_ADS_PAGE_ID");
  const instagramActorId = process.env.META_ADS_INSTAGRAM_ACTOR_ID;
  const accountPath = `act_${ALLOWED_ACCOUNT_ID}`;
  const dateStamp = new Date().toISOString().slice(0, 10);
  const draftKey = input.idempotencyKey.slice(0, 8);
  const campaignName =
    `CQ ADS AGENT — ${input.name.toUpperCase()} — LEADS WEBSITE` +
    ` — CAMPAIGN — PAUSED` +
    ` [${draftKey}]`;
  const adSetName =
    `CQ ADS AGENT — ${input.name.toUpperCase()}` +
    ` — AGE 25+ LOCAL — WEBSITE LEADS — LEAD EVENT UNVERIFIED` +
    ` — AD SET — PAUSED` +
    ` — $${(input.dailyBudgetCents / 100).toFixed(0)}-DAY [${draftKey}]`;
  const creativeName =
    `CQ ADS AGENT — ${input.name.toUpperCase()}` +
    ` — ${input.copyOptions.length}-COPY ${input.images.length}-PHOTO FLEXIBLE` +
    ` — CREATIVE` +
    ` — ${dateStamp} [${draftKey}]`;
  const adName =
    `CQ ADS AGENT — ${input.name.toUpperCase()}` +
    ` — PRIVATE CHARTER — AD — PAUSED` +
    ` — ${dateStamp} [${draftKey}]`;

  await assertDraftDoesNotExist(accountPath, campaignName);

  const campaign = await graphPost(
    `${accountPath}/campaigns`,
    new URLSearchParams({
      name: campaignName,
      objective: "OUTCOME_LEADS",
      status: "PAUSED",
      special_ad_categories: "[]",
      is_adset_budget_sharing_enabled: "false",
    }),
    token
  );
  if (!campaign.id) throw new Error("Meta did not return a campaign ID.");

  const adSet = await graphPost(
    `${accountPath}/adsets`,
    new URLSearchParams({
      name: adSetName,
      campaign_id: campaign.id,
      daily_budget: String(input.dailyBudgetCents),
      billing_event: "IMPRESSIONS",
      optimization_goal: "OFFSITE_CONVERSIONS",
      bid_strategy: "LOWEST_COST_WITHOUT_CAP",
      destination_type: "WEBSITE",
      promoted_object: JSON.stringify({
        pixel_id: ALLOWED_PIXEL_ID,
        custom_event_type: "LEAD",
      }),
      attribution_spec: JSON.stringify(ATTRIBUTION_SPEC),
      targeting: JSON.stringify({
        age_min: CELTIC_QUEST_PROVEN_TARGETING_BASELINE.ageMin,
        age_max: CELTIC_QUEST_PROVEN_TARGETING_BASELINE.ageMax,
        geo_locations: {
          custom_locations:
            CELTIC_QUEST_PROVEN_TARGETING_BASELINE.customLocations.map(
              (location) => ({
                latitude: location.latitude,
                longitude: location.longitude,
                radius: location.radius,
                distance_unit: location.distanceUnit,
              })
            ),
          location_types:
            CELTIC_QUEST_PROVEN_TARGETING_BASELINE.locationTypes,
        },
        targeting_automation: {
          advantage_audience: 1,
          individual_setting: { geo: 1 },
        },
      }),
      status: "PAUSED",
    }),
    token
  );
  if (!adSet.id) throw new Error("Meta did not return an ad set ID.");

  const imageHashes: string[] = [];
  for (const image of input.images) {
    const imageBody = new FormData();
    imageBody.set("filename", image, image.name);
    const imageResult = await graphPost(
      `${accountPath}/adimages`,
      imageBody,
      token
    );
    const imageHash = Object.values(imageResult.images ?? {})[0]?.hash;
    if (!imageHash) throw new Error("Meta did not return an image hash.");
    imageHashes.push(imageHash);
  }

  const objectStorySpec = {
    page_id: pageId,
    ...(instagramActorId
      ? { instagram_actor_id: instagramActorId }
      : {}),
    link_data: {
      image_hash: imageHashes[0],
      link: input.destinationUrl,
      call_to_action: {
        type: "LEARN_MORE",
        value: { link: input.destinationUrl },
      },
    },
  };
  const assetFeedSpec = {
    images: imageHashes.map((hash) => ({ hash })),
    bodies: input.copyOptions.map((option) => ({ text: option.primaryText })),
    titles: input.copyOptions.map((option) => ({ text: option.headline })),
    descriptions: input.copyOptions.map((option) => ({
      text: option.description,
    })),
    link_urls: [{ website_url: input.destinationUrl }],
    call_to_action_types: ["LEARN_MORE"],
    ad_formats: ["SINGLE_IMAGE"],
    optimization_type: "DEGREES_OF_FREEDOM",
  };

  const creative = await graphPost(
    `${accountPath}/adcreatives`,
    new URLSearchParams({
      name: creativeName,
      object_story_spec: JSON.stringify(objectStorySpec),
      asset_feed_spec: JSON.stringify(assetFeedSpec),
      url_tags: URL_TAGS,
    }),
    token
  );
  if (!creative.id) throw new Error("Meta did not return a creative ID.");

  const ad = await graphPost(
    `${accountPath}/ads`,
    new URLSearchParams({
      name: adName,
      adset_id: adSet.id,
      creative: JSON.stringify({ creative_id: creative.id }),
      tracking_specs: JSON.stringify([
        {
          "action.type": ["offsite_conversion"],
          fb_pixel: [ALLOWED_PIXEL_ID],
        },
      ]),
      status: "PAUSED",
    }),
    token
  );
  if (!ad.id) throw new Error("Meta did not return an ad ID.");

  return {
    campaignId: campaign.id,
    adSetId: adSet.id,
    creativeId: creative.id,
    adId: ad.id,
    photoCount: imageHashes.length,
    copyCount: input.copyOptions.length,
    status: "PAUSED" as const,
    tracking: {
      objective: "OUTCOME_LEADS",
      optimizationGoal: "OFFSITE_CONVERSIONS",
      pixelId: ALLOWED_PIXEL_ID,
      measuredWebsiteEvent: "Lead",
      eventVerification: "UNVERIFIED",
      attributionSpec: ATTRIBUTION_SPEC,
      urlTags: URL_TAGS,
    },
  };
}
