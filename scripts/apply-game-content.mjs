// Merges the extra rounds in content/<game>.json into games/<game>.html (window.GAME_CONFIG)
// and makes each session start from a random round instead of always the same one.
//   node scripts/apply-game-content.mjs
// Safe to run again: items already present are not added twice.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const CFG_RE = /window\.GAME_CONFIG = (\{.*?\});\n/;
const SHUFFLE_MARK = '/*dw-shuffle-rounds*/';
// Arrays whose order matters to the game (wheel layout, deck cards, pack picker).
const KEEP_ORDER = ['segments', 'decks', 'wordPacks'];
const SHUFFLE = SHUFFLE_MARK + ' (function (c) { if (!c) return; Object.keys(c).forEach(function (k) {' +
  ' var a = c[k]; if (!Array.isArray(a) || ' + JSON.stringify(KEEP_ORDER) + '.indexOf(k) !== -1) return;' +
  ' for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } }); })(window.GAME_CONFIG);\n';

for (const file of readdirSync(join(root, 'content')).filter((f) => f.endsWith('.json'))) {
  const slug = file.replace(/\.json$/, '');
  const gamePath = join(root, 'games', slug + '.html');
  let html = readFileSync(gamePath, 'utf8');
  const m = html.match(CFG_RE);
  if (!m) throw new Error(slug + ': GAME_CONFIG not found');
  const cfg = JSON.parse(m[1]);
  const extra = JSON.parse(readFileSync(join(root, 'content', file), 'utf8'));
  const report = [];
  for (const [key, items] of Object.entries(extra)) {
    if (key.startsWith('_')) continue;
    if (!Array.isArray(cfg[key])) throw new Error(slug + ': GAME_CONFIG has no array "' + key + '"');
    const seen = new Set(cfg[key].map((x) => JSON.stringify(x)));
    let added = 0;
    for (const it of items) if (!seen.has(JSON.stringify(it))) { cfg[key].push(it); seen.add(JSON.stringify(it)); added++; }
    report.push(key + ': +' + added + ' = ' + cfg[key].length);
  }
  const json = JSON.stringify(cfg).replace(/</g, '\\u003c');
  html = html.replace(CFG_RE, () => 'window.GAME_CONFIG = ' + json + ';\n' + (html.includes(SHUFFLE_MARK) ? '' : SHUFFLE));
  writeFileSync(gamePath, html);
  console.log(slug.padEnd(18), report.join(', '));
}
