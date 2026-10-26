require('./register-ts.cjs');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtemp, readFile, rm } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { graphPost, enforcePausedWrite } = require('../src/lib/ads-agent/paused-graph.ts');
test('paused-only guard blocks updates, alternate accounts, publishing, budgets, and existing parents', () => {
  for (const path of ['123', '123/ads', 'act_255186019073177', 'act_255186019073177/campaigns?x=1', 'act_9/campaigns', 'act_255186019073177/batch']) assert.throws(() => enforcePausedWrite(path, new URLSearchParams({status:'ACTIVE'})));
  for (const key of ['spend_cap','daily_budget','method','batch']) assert.throws(() => enforcePausedWrite('act_255186019073177/campaigns', new URLSearchParams({[key]:'1'})));
  assert.throws(() => enforcePausedWrite('act_255186019073177/adsets', new URLSearchParams({campaign_id:'existing'})));
  assert.throws(() => enforcePausedWrite('act_255186019073177/ads', new URLSearchParams({adset_id:'existing'})));
});
test('writes force PAUSED, audit IDs without tokens, and fail closed when disabled', async () => {
  const cwd = process.cwd(); const dir = await mkdtemp(join(tmpdir(), 'meta-test-')); const original = global.fetch;
  Object.assign(process.env, {META_ADS_WRITES_ENABLED:'true', META_ADS_TARGETING_PLAN_APPROVED:'cq-targeting-v1',META_ADS_ACCOUNT_ID:'255186019073177'});
  process.chdir(dir);
  let calls = 0;
  global.fetch = async (url, options) => { assert.equal(options.body.get('status'),'PAUSED'); assert.ok(!url.includes('secret')); calls++; return {ok:true,json:async()=>({id:String(calls)})}; };
  try {
    await graphPost('act_255186019073177/campaigns',new URLSearchParams({status:'ACTIVE'}),'test-secret');
    await graphPost('act_255186019073177/adsets',new URLSearchParams({campaign_id:'1',status:'ACTIVE',daily_budget:'100'}),'test-secret');
    await graphPost('act_255186019073177/ads',new URLSearchParams({adset_id:'2',status:'ACTIVE'}),'test-secret');
    const log = await readFile('meta-logs/writes.jsonl','utf8'); assert.ok(!log.includes('test-secret')); assert.ok(log.includes('"objectId":"3"')); assert.equal(log.trim().split('\n').length,6);
    process.env.META_ADS_WRITES_ENABLED='false'; await assert.rejects(graphPost('act_255186019073177/campaigns',new URLSearchParams(),'test-secret')); assert.equal(calls,3);
  } finally { global.fetch=original; process.chdir(cwd); await rm(dir,{recursive:true,force:true}); }
});
