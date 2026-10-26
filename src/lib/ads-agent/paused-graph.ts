import { appendFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";

const BASE = "https://graph.facebook.com/v21.0";
const ACCOUNT = "act_255186019073177";
const fields: Record<string, string[]> = {
  campaigns: ["name", "objective", "status", "special_ad_categories", "is_adset_budget_sharing_enabled"],
  adsets: ["name", "campaign_id", "daily_budget", "billing_event", "optimization_goal", "bid_strategy", "destination_type", "promoted_object", "attribution_spec", "targeting", "status"],
  ads: ["name", "adset_id", "creative", "tracking_specs", "status"],
  adcreatives: ["name", "object_story_spec", "asset_feed_spec", "url_tags"],
  adimages: ["filename"],
};
// Parent IDs must have been created by this execution, never supplied from a brief.
const parents = new Map<string, string>();
export function enforcePausedWrite(path: string, body: FormData | URLSearchParams) {
  const edge = path.split("/")[1];
  if (path !== `${ACCOUNT}/${edge}` || !fields[edge]) throw new Error("Only new paused draft objects may be written.");
  for (const key of body.keys()) {
    if (!fields[edge].includes(key)) throw new Error(`Unsupported draft field: ${key}`);
  }
  if (["campaigns", "adsets", "ads"].includes(edge)) body.set("status", "PAUSED");
  if (edge === "adsets" && parents.get(String(body.get("campaign_id"))) !== "campaigns") throw new Error("Ad sets require a campaign created in this execution.");
  if (edge === "ads" && parents.get(String(body.get("adset_id"))) !== "adsets") throw new Error("Ads require an ad set created in this execution.");
  return edge;
}
async function audit(event: Record<string, unknown>) {
  const file = process.env.VERCEL ? "/tmp/meta-logs/writes.jsonl" : join(process.cwd(), "meta-logs/writes.jsonl");
  await mkdir(dirname(file), { recursive: true, mode: 0o700 });
  const line = JSON.stringify({ timestamp: new Date().toISOString(), ...event });
  await appendFile(file, line + "\n", { mode: 0o600 });
  // Vercel's filesystem is ephemeral; also retain the safe event in runtime logs.
  if (process.env.VERCEL) console.info(line);
}
export async function graphPost(path: string, body: FormData | URLSearchParams, token: string) {
  if (process.env.META_ADS_WRITES_ENABLED !== "true" || process.env.META_ADS_TARGETING_PLAN_APPROVED !== "cq-targeting-v1" || process.env.META_ADS_ACCOUNT_ID !== "255186019073177") throw new Error("Paused draft mode is not configured.");
  const edge = enforcePausedWrite(path, body);
  const requestId = randomUUID();
  const context = { requestId, edge, campaignId: body.get("campaign_id") || undefined, adSetId: body.get("adset_id") || undefined, status: body.get("status") || "NON_DELIVERING_ASSET" };
  await audit({ ...context, outcome: "attempt" }); // Fail closed if logging is unavailable.
  let data;
  try {
    const response = await fetch(`${BASE}/${path}`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body, redirect: "error" });
    data = await response.json();
    if (!response.ok || data.error) {
      await audit({ ...context, outcome: "rejected", code: data.error?.code });
      throw new Error(`Meta rejected draft creation (code ${Number(data.error?.code) || response.status}).`);
    }
  } catch (error) {
    await audit({ ...context, outcome: "failed_or_unknown" });
    if (error instanceof Error && error.message.startsWith("Meta rejected")) throw error;
    throw new Error("Meta write outcome unknown. Inspect the audit log and Meta before retrying.");
  }
  if (data.id) parents.set(data.id, edge);
  await audit({ ...context, outcome: "created", objectId: data.id, imageHashes: data.images ? Object.values(data.images).map((x) => (x as { hash: string }).hash) : undefined });
  return data as { id?: string; images?: Record<string, { hash: string }> };
}
export async function graphRead(path: string, params: Record<string, string> = {}) {
  const token = process.env.META_ADS_ACCESS_TOKEN;
  if (!token || process.env.META_ADS_ACCOUNT_ID !== "255186019073177") throw new Error("Meta Ads credentials are not configured for the allowed account.");
  const url = new URL(`${BASE}/${path}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, redirect: "error" });
  const data = await response.json();
  if (!response.ok || data.error) throw new Error(`Meta read failed (code ${Number(data.error?.code) || response.status}).`);
  return data;
}
