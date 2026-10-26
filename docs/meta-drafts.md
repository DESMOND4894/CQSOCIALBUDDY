# Meta Ads Agent: standing paused drafts

Run from CQ Social Buddy (Node 22+, npm dependencies installed):

```sh
npm run meta:draft -- /absolute/path/to/brief.json
npm run meta:report
```

The report is a GET-only ad performance report for the last 30 days.
The draft command creates one campaign, one ad set, creative assets and one ad,
then reads back and verifies all three delivery statuses as PAUSED.
No per-job unlock is needed. It uses the existing `.env.local` credentials and
`META_ADS_WRITES_ENABLED=true`, `META_ADS_TARGETING_PLAN_APPROVED=cq-targeting-v1`.
Keep credentials out of briefs, source control, chat, and command arguments.

Brief JSON (image paths are relative to the brief):

```json
{
  "name": "Private charter draft",
  "destinationUrl": "https://celticquestfishing.com/private-group-charter/",
  "dailyBudgetCents": 100,
  "campaignType": "private-charter-leads",
  "images": ["approved-group-photo.jpg"],
  "copyOptions": [{
    "id": "charter",
    "primaryText": "Plan a private fishing trip with Celtic Quest.",
    "headline": "Your private fishing trip",
    "description": "Ask about private charters from Port Jefferson."
  }]
}
```

The budget is a proposed initial setting on a NEW PAUSED ad set. It cannot spend
while paused. No existing object can be updated, resumed, published, or have its
budget changed through the agent. Targeting is the fixed cq-targeting-v1 baseline.
Only private-charter lead briefs are currently supported. Use matching approved
CQ photos and factual copy. The CLI rejects unknown fields (including status).
The Graph write boundary also forcibly sets PAUSED regardless of caller status.

Every attempted and successful write is recorded in `meta-logs/writes.jsonl`,
with timestamp, request identifier, object IDs and status, without tokens or copy.
On Vercel the file is `/tmp/meta-logs/writes.jsonl` (ephemeral) and the same safe
events go to runtime logs. Use the local CLI for a persistent local audit trail.
Vercel requires its own dedicated Ads Agent credentials; the two flags alone do
not supply credentials. Existing social-posting credentials are not reused.

An identical brief/content is rejected once its campaign exists, including after
partial creation. Do not blindly retry an unknown outcome: inspect the audit log
and Ads Manager first. Concurrent invocations are not a distributed idempotency
system; run one draft job at a time. Paused API objects are saved Meta objects,
not Ads Manager's unpublished local-editor drafts. A human with account access
can still activate them outside this tool; the restriction applies to this agent.
