// One-off: gives every game a "الديوانية" name, in the store and inside the game pages.
//   node scripts/rename-games.mjs
// Each replacement must match the expected number of times, so a re-run (or a changed file) fails loudly.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

export const NAMES = {
  eight: 'ديوانية الثمانية',
  qaftah: 'قفطة الديوانية',
  chancellor: 'مستشار الديوانية',
  harf: 'حروف الديوانية',
  qaddirha: 'تقدير الديوانية',
  dakhil: 'دخيل الديوانية',
  mafia: 'مافيا الديوانية',
  shifra: 'شفرة الديوانية',
  mystery_button: 'زر الديوانية الغامض',
  golden_vault: 'خزنة الديوانية الذهبية',
  diwaniya_auction: 'مزاد الديوانية',
  fortune_wheel: 'عجلة حظ الديوانية',
  friends_court: 'محكمة الديوانية',
  last_one_standing: 'صامد الديوانية',
  silent_library: 'الديوانية الصامتة',
  who_knows_friend: 'ربع الديوانية',
  draw_guess: 'رسّام الديوانية',
  stadium_esports: 'ملعب الديوانية',
  how_much_price: 'سوق الديوانية',
  pressure_seat: 'كرسي الديوانية',
  mazad30: 'عدّاد الديوانية',
  fake_artist: 'مندس الديوانية',
  liars_table: 'كذّابين الديوانية',
  vault50: 'خزائن الديوانية',
  radar_guess: 'رادار الديوانية',
  alibi_court: 'تحقيق الديوانية'
};

const file = (p) => join(root, p);
function edit(path, pairs) {
  let t = readFileSync(file(path), 'utf8');
  for (const [from, to, expected] of pairs) {
    const n = t.split(from).length - 1;
    if (n === 0 && t.includes(to)) continue; // already renamed by an earlier run
    if (expected !== undefined ? n !== expected : n === 0) throw new Error(path + ': "' + from + '" found ' + n + ' times');
    t = t.split(from).join(to);
  }
  writeFileSync(file(path), t);
}

// ---- games built from the shared GAME_CONFIG template: title in <title> and in the header
const CFG_RE = /window\.GAME_CONFIG = (\{.*?\});\n/;
for (const slug of ['shifra', 'mystery_button', 'golden_vault', 'diwaniya_auction', 'fortune_wheel', 'friends_court', 'last_one_standing',
  'silent_library', 'who_knows_friend', 'draw_guess', 'stadium_esports', 'how_much_price', 'pressure_seat', 'mazad30', 'fake_artist',
  'liars_table', 'vault50', 'radar_guess', 'alibi_court']) {
  const p = file('games/' + slug + '.html');
  let t = readFileSync(p, 'utf8');
  const cfg = JSON.parse(t.match(CFG_RE)[1]);
  t = t.replace(/<title>[^<]*<\/title>/, '<title>ديوانية بلس — ' + NAMES[slug] + '</title>');
  cfg.title = NAMES[slug];
  t = t.replace(CFG_RE, () => 'window.GAME_CONFIG = ' + JSON.stringify(cfg).replace(/</g, '\\u003c') + ';\n');
  writeFileSync(p, t);
}

// ---- hand-written games
edit('games/eight.html', [['تحدي الثمانية — ديوانية بلس', NAMES.eight], ['المستشار السري', NAMES.chancellor]]);
edit('games/qaftah.html', [['<title>ديوانية بلس — قفطة! (أكمل الكذبة)</title>', '<title>ديوانية بلس — ' + NAMES.qaftah + '</title>', 1],
  ['ديوانية بلس <b>قفطة!</b>', '<b>قفطة</b> الديوانية']]);
edit('games/mafia.html', [['<title>ديوانية بلس — مافيا</title>', '<title>ديوانية بلس — ' + NAMES.mafia + '</title>', 1],
  ['ديوانية بلس <b>مافيا</b>', '<b>مافيا</b> الديوانية', 1]]);
edit('games/chancellor.html', [['المستشار <b>السري</b>', '<b>مستشار</b> الديوانية', 3], ['المستشار السري', NAMES.chancellor]]);
edit('games/dakhil.html', [['<title>ديوانية بلس — الدخيل</title>', '<title>ديوانية بلس — ' + NAMES.dakhil + '</title>', 1],
  ["name: 'الدخيل', nameHtml: 'ال<b>دخيل</b>'", "name: '" + NAMES.dakhil + "', nameHtml: '<b>دخيل</b> الديوانية'", 1],
  ["title: 'ال<b>دخيل</b>', timedPhases", "title: '<b>دخيل</b> الديوانية', timedPhases", 1]]);
edit('games-src/harf/ui.js', [["name: 'حرف ونص', nameHtml: 'حرف <b>ونص</b>'", "name: '" + NAMES.harf + "', nameHtml: '<b>حروف</b> الديوانية'", 1],
  ["title: 'حرف <b>ونص</b>', timedPhases", "title: '<b>حروف</b> الديوانية', timedPhases", 1]]);
edit('games-src/harf/help.js', [['وش حرف ونص؟', 'وش ' + NAMES.harf + '؟', 1]]);
edit('games-src/qaddirha/ui.js', [["name: 'قدّرها', nameHtml: 'قدّر<b>ها</b>'", "name: '" + NAMES.qaddirha + "', nameHtml: '<b>تقدير</b> الديوانية'", 1],
  ["title: 'قدّر<b>ها</b>', timedPhases", "title: '<b>تقدير</b> الديوانية', timedPhases", 1]]);
edit('games-src/qaddirha/help.js', [['وش قدّرها؟', 'وش ' + NAMES.qaddirha + '؟', 1]]);
edit('scripts/build-kit-games.mjs', [["harf: { title: 'حرف ونص' }", "harf: { title: '" + NAMES.harf + "' }", 1],
  ["qaddirha: { title: 'قدّرها' }", "qaddirha: { title: '" + NAMES.qaddirha + "' }", 1]]);

// ---- store catalog
const seedPath = file('worker/src/seed.json');
const seed = JSON.parse(readFileSync(seedPath, 'utf8'));
for (const g of seed.games) if (NAMES[g.slug]) g.title = NAMES[g.slug];
writeFileSync(seedPath, JSON.stringify(seed));

// ---- store page text
edit('public/index.html', [['تحدي الثمانية', NAMES.eight], ['المستشار السري', NAMES.chancellor], ["link('categories', 'فئات الثمانية')", "link('categories', 'فئات الثمانية')", 1]]);
console.log('renamed', Object.keys(NAMES).length, 'games');
