// Some uploads to Cloudflare's static file store fail from the cloud workspace (its proxy replaces the
// upload's own key). This puts the files the live site is missing into the database instead, where
// /eight-media/<name> falls back to them (worker/src/index.js), and lists them in assets/.assetsignore
// so the next deploy does not try to upload them again.
//   node scripts/seed-assets-d1.mjs            (live site)
import { readdirSync, readFileSync, writeFileSync, mkdtempSync, existsSync } from 'node:fs';
import { execFileSync, execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'assets', 'eight-media');
const SITE = process.env.SITE || 'https://diwaniyaplus.com';
const MIME = { webp: 'image/webp', mp3: 'audio/mpeg', mp4: 'video/mp4' };
const CHUNK = 40000; // bytes per statement part (hex doubles it; D1 allows ~100KB per statement)
const ignorePath = join(root, 'assets', '.assetsignore');
const ignored = new Set(existsSync(ignorePath) ? readFileSync(ignorePath, 'utf8').split('\n').map((s) => s.trim()).filter(Boolean) : []);

const files = readdirSync(dir).filter((f) => /^[a-f0-9]{20}\.(webp|mp3|mp4)$/.test(f));
// Files already in the database are skipped, so a run that stopped half way picks up where it left off.
const inDb = new Set();
try {
  const out = execFileSync('npx', ['wrangler', 'd1', 'execute', 'diwaniya-plus', '--remote', '--json', '--command',
    "SELECT m.id FROM media m WHERE m.id LIKE 'med_em_%' AND m.chunks = (SELECT COUNT(*) FROM media_chunks c WHERE c.media_id = m.id)"],
    { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'inherit'] });
  for (const r of JSON.parse(out.slice(out.indexOf('[')))[0].results) inDb.add(r.id.slice('med_em_'.length));
} catch (e) { console.log('could not list stored files, checking all:', e.message.slice(0, 120)); }
console.log('already stored', inDb.size);
const missing = [];
for (let i = 0; i < files.length; i += 24) {
  const batch = files.slice(i, i + 24);
  // curl (not fetch): it goes through the workspace's HTTPS proxy.
  const codes = await Promise.all(batch.map((f) => new Promise((res) => execFile('curl', ['-s', '-o', '/dev/null', '-I', '-w', '%{http_code}', SITE + '/eight-media/' + f], (e, out) => res(Number(out) || 0)))));
  batch.forEach((f, k) => { if (!inDb.has(f.slice(0, 20)) && (codes[k] === 404 || ignored.has('eight-media/' + f))) missing.push(f); });
}
console.log('files', files.length, 'missing on the live site', missing.length);
const tmp = mkdtempSync(join(tmpdir(), 'seedassets-'));
const now = new Date().toISOString();
let n = 0;
for (const f of missing) {
  const buf = readFileSync(join(dir, f));
  const id = 'med_em_' + f.slice(0, 20);
  const parts = Math.ceil(buf.length / CHUNK);
  const lines = [
    `DELETE FROM media_chunks WHERE media_id = '${id}';`,
    `INSERT OR REPLACE INTO media (id, user_id, mime, size, data, created_at, chunks, kind, store) VALUES ('${id}', 'system', '${MIME[f.split('.').pop()]}', ${buf.length}, X'', '${now}', ${parts}, '${f.endsWith('webp') ? 'image' : f.endsWith('mp3') ? 'audio' : 'video'}', 'd1');`
  ];
  for (let p = 0; p < parts; p++) lines.push(`INSERT INTO media_chunks (media_id, idx, data) VALUES ('${id}', ${p}, X'${buf.subarray(p * CHUNK, (p + 1) * CHUNK).toString('hex')}');`);
  const sqlPath = join(tmp, 'a' + n + '.sql');
  writeFileSync(sqlPath, lines.join('\n') + '\n');
  for (let k = 0; ; k++) {
    try { execFileSync('npx', ['wrangler', 'd1', 'execute', 'diwaniya-plus', '--remote', '--file', sqlPath], { cwd: root, stdio: ['ignore', 'ignore', 'inherit'] }); break; }
    catch (e) { if (k >= 5) throw e; execFileSync('sleep', [String(20 * (k + 1))]); }
  }
  ignored.add('eight-media/' + f);
  if (++n % 20 === 0) console.log('loaded', n, 'of', missing.length);
}
writeFileSync(ignorePath, [...ignored].sort().join('\n') + '\n');
console.log('loaded', n, '— listed in assets/.assetsignore');
