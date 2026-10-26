require('./register-ts.cjs');
require('@next/env').loadEnvConfig(process.cwd());
const { readFile } = require('node:fs/promises');
const { resolve, dirname, basename } = require('node:path');
const { createHash } = require('node:crypto');
const { z } = require('zod');
const { createPausedMetaDraft } = require('../src/lib/ads-agent/meta-drafts.ts');
const { graphRead } = require('../src/lib/ads-agent/paused-graph.ts');
const schema = z.object({
  name: z.string().min(3).max(120),
  destinationUrl: z.url().refine(x => x.startsWith('https://')),
  dailyBudgetCents: z.number().int().min(100).max(100000),
  campaignType: z.literal('private-charter-leads'),
  images: z.array(z.string()).min(1).max(10),
  copyOptions: z.array(z.object({ id: z.string(), primaryText: z.string().min(1), headline: z.string().min(1), description: z.string() }).strict()).min(1).max(4),
}).strict();
async function main() {
  if (process.argv[2] === 'report') {
    const rows = [];
    let after;
    do {
      const page = await graphRead('act_255186019073177/insights', { date_preset: 'last_30d', level: 'ad', fields: 'campaign_id,campaign_name,adset_id,ad_id,ad_name,impressions,clicks,spend,actions', limit: '100', ...(after ? { after } : {}) });
      rows.push(...(page.data || []));
      after = page.paging?.next ? page.paging?.cursors?.after : undefined;
    } while (after);
    console.log(JSON.stringify({ period: 'last_30d', data: rows }, null, 2));
    return;
  }
  if (process.argv[2] !== 'draft' || !process.argv[3]) throw new Error('Usage: npm run meta:draft -- <brief.json> OR npm run meta:report');
  const file = resolve(process.argv[3]);
  const brief = schema.parse(JSON.parse(await readFile(file, 'utf8')));
  const hash = createHash('sha256').update(JSON.stringify(brief));
  const images = [];
  for (const path of brief.images) {
    const bytes = await readFile(resolve(dirname(file), path));
    const png = bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
    const jpeg = bytes[0] === 255 && bytes[1] === 216;
    if ((!png && !jpeg) || bytes.length > 10000000) throw new Error('Images must be JPG/PNG and smaller than 10 MB.');
    hash.update(bytes);
    images.push(new File([bytes], basename(path), { type: png ? 'image/png' : 'image/jpeg' }));
  }
  const result = await createPausedMetaDraft({ ...brief, images, idempotencyKey: hash.digest('hex') });
  const verification = [];
  for (const id of [result.campaignId, result.adSetId, result.adId]) {
    const object = await graphRead(id, { fields: 'id,status,effective_status' });
    if (object.status !== 'PAUSED') throw new Error(`Paused verification failed for ${id}. Inspect Meta immediately.`);
    verification.push(object);
  }
  console.log(JSON.stringify({ ...result, verification, adsManagerUrl: `https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=255186019073177&selected_campaign_ids=${result.campaignId}` }, null, 2));
}
main().catch(error => {
  console.error(error instanceof z.ZodError ? 'Invalid brief. See docs/meta-drafts.md for the required fields.' : (error.message.startsWith('Meta') || error.message.startsWith('Usage:') ? error.message : 'Draft command failed. Check brief, files, configuration, and audit log.'));
  process.exitCode = 1;
});
