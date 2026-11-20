// Loads the pictures of the ready-made picture categories (content/media/<key>.jpg) into the database
// as /media/med_seed_<key>, so they are served like any uploaded picture and the owner can swap them in the editor.
//   node scripts/seed-media.mjs --local     (test database)
//   node scripts/seed-media.mjs --remote    (live database)
// Each picture is kept under ~46KB so one SQL statement stays below D1's 100KB limit.
import { readdirSync, readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'content', 'media');
const target = process.argv.includes('--remote') ? '--remote' : '--local';
const extra = process.argv.filter((a) => a.startsWith('--persist-to='));
const now = new Date().toISOString();
const lines = [];
for (const f of readdirSync(dir).filter((x) => x.endsWith('.jpg')).sort()) {
  const buf = readFileSync(join(dir, f));
  if (buf.length > 47000) throw new Error(f + ' is too big (' + buf.length + ' bytes)');
  const id = 'med_seed_' + f.replace(/\.jpg$/, '');
  lines.push(`INSERT OR REPLACE INTO media (id, user_id, mime, size, data, created_at, chunks, kind, store) VALUES ('${id}', 'system', 'image/jpeg', ${buf.length}, X'${buf.toString('hex')}', '${now}', 0, 'image', 'd1');`);
}
// Sent a few pictures at a time: one big file is refused by the database.
const tmp = mkdtempSync(join(tmpdir(), 'seedmedia-'));
const extraArgs = extra.flatMap((a) => a.split('=').length > 1 ? [a.slice(0, a.indexOf('=')), a.slice(a.indexOf('=') + 1)] : [a]);
for (let i = 0; i < lines.length; i += 6) {
  const sqlPath = join(tmp, 'seed-media-' + i + '.sql');
  writeFileSync(sqlPath, lines.slice(i, i + 6).join('\n') + '\n');
  execFileSync('npx', ['wrangler', 'd1', 'execute', 'diwaniya-plus', target, '--file', sqlPath, ...extraArgs], { cwd: root, stdio: ['ignore', 'ignore', 'inherit'] });
  console.log('loaded', Math.min(i + 6, lines.length), 'of', lines.length);
}
console.log('pictures loaded:', lines.length, target);
