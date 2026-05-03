import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const envPath = path.join(root, '.env.local');
const strictKey = 'VITE_TENANT_ISOLATION_STRICT';
const monitorKey = 'VITE_TENANT_ISOLATION_MONITOR_COMPAT';

function readEnv() {
  if (!fs.existsSync(envPath)) return '';
  return fs.readFileSync(envPath, 'utf8');
}

function upsert(content, key, value) {
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, 'm');
  if (re.test(content)) return content.replace(re, line);
  const withNl = content.length > 0 && !content.endsWith('\n') ? `${content}\n` : content;
  return `${withNl}${line}\n`;
}

function currentValue(content, key, fallback = 'false') {
  const re = new RegExp(`^${key}=(.*)$`, 'm');
  const m = content.match(re);
  return (m?.[1] ?? fallback).trim();
}

function save(content) {
  fs.writeFileSync(envPath, content, 'utf8');
}

function printStatus() {
  const content = readEnv();
  const strict = currentValue(content, strictKey, 'false');
  const monitor = currentValue(content, monitorKey, 'true');
  console.log(`Strict mode: ${strict}`);
  console.log(`Compat monitor: ${monitor}`);
  console.log(`Env file: ${envPath}`);
}

function checklist() {
  console.log('Tenant Strict Rollout Checklist');
  console.log('1) Run: npm run tenant:strict:status');
  console.log('2) Ensure no legacy fallback signals in audit logs (resource=tenant, details contains "legacy ownership fallback used")');
  console.log('3) Verify shared-browser smoke: login A -> logout -> login B, caches must not bleed');
  console.log('4) Verify core CRUD works for users with fully-owned docs');
  console.log('5) Enable strict: npm run tenant:strict:enable');
  console.log('6) Build + tests: npm run build && npm test');
  console.log('7) If rollback needed: npm run tenant:strict:disable');
}

function setStrict(value) {
  let content = readEnv();
  content = upsert(content, strictKey, value);
  content = upsert(content, monitorKey, 'true');
  save(content);
  console.log(`Updated .env.local: ${strictKey}=${value}`);
  printStatus();
}

const cmd = (process.argv[2] || 'status').toLowerCase();
if (cmd === 'status') printStatus();
else if (cmd === 'enable') setStrict('true');
else if (cmd === 'disable') setStrict('false');
else if (cmd === 'checklist') checklist();
else {
  console.log('Usage: node scripts/tenant-strict-rollout.mjs <status|enable|disable|checklist>');
  process.exit(1);
}
