// Builds games/<slug>.html for the room games written on the shared kit (games-src/<slug>/*.js),
// using games/dakhil.html as the template for the shared parts (QR, audio, hub, lobby, phone/board UI).
//   node scripts/build-kit-games.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export const KIT_GAMES = {
  harf: { title: 'حروف الديوانية' },
  qaddirha: { title: 'تقدير الديوانية' },
  draw_guess: { title: 'رسّام الديوانية' },
  fooq_rasak: { title: 'ديوانية خمّن الشخصية' }
};
const SLOTS = [
  ['games/dakhil/words.js', 'data.js'],
  ['games/dakhil/engine.js', 'engine.js'],
  ['games/dakhil/help.js', 'help.js'],
  ['games/dakhil/ui.js', 'ui.js'],
  ['games/dakhil/bots.js', 'bots.js']
];

const template = readFileSync(join(root, 'games/dakhil.html'), 'utf8');
for (const [slug, meta] of Object.entries(KIT_GAMES)) {
  let html = template.replace('<title>ديوانية بلس — الدخيل</title>', '<title>ديوانية بلس — ' + meta.title + '</title>');
  for (const [blockName, file] of SLOTS) {
    const marker = '<script>/* ' + blockName + ' */';
    const start = html.indexOf(marker);
    if (start === -1) throw new Error('template block missing: ' + blockName);
    const end = html.indexOf('</script>', start);
    const src = readFileSync(join(root, 'games-src', slug, file), 'utf8');
    if (src.includes('</script>')) throw new Error(slug + '/' + file + ' contains </script>');
    html = html.slice(0, start) + '<script>/* games/' + slug + '/' + file + ' */\n' + src + html.slice(end);
  }
  const leftovers = (html.match(/الدخيل|dakhil/g) || []).length;
  writeFileSync(join(root, 'games', slug + '.html'), html);
  console.log('built games/' + slug + '.html', leftovers ? '(template mentions left: ' + leftovers + ')' : '');
}
