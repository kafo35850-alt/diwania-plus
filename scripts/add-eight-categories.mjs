// Adds the ready-made Eight categories in content/eight_categories.json to worker/src/seed.json
// (category + its questions). Safe to run again: categories are replaced by slug.
//   node scripts/add-eight-categories.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const seedPath = join(root, 'worker/src/seed.json');
const seed = JSON.parse(readFileSync(seedPath, 'utf8'));
const cats = JSON.parse(readFileSync(join(root, 'content/eight_categories.json'), 'utf8'));
seed.catQuestionsOverrides = seed.catQuestionsOverrides || {};
// Pictures from content/media/<key>.jpg are loaded into the database by scripts/seed-media.mjs as /media/med_seed_<key>.
const pic = (key) => (key ? { t: 'image', u: '/media/med_seed_' + key } : null);
const extra = [];
// Categories marked "draft": true wait for the owner's OK and are left out of the site.
cats.filter((c) => !c.draft).forEach((c, i) => {
  extra.push({
    id: 'cat_' + c.slug, slug: c.slug, name: c.name,
    macro_group: 'فئات الديوانية', sub_group: c.group, description: c.description, icon: c.icon,
    posterTheme: 'country_saudi', poster: c.posterMedia ? '/media/med_seed_' + c.posterMedia : '/cat-posters/' + c.poster + '.svg',
    sort_order: i + 1, is_visible: 1, item_count: c.questions.length
  });
  seed.catQuestionsOverrides[c.slug] = c.questions.map((q, n) => ({
    uid: c.slug + '_' + (n + 1) + '_' + q.points, points: q.points, q: q.q, a: q.a, hint: q.hint || '', info: q.hint || '', qm: pic(q.qm), am: pic(q.am)
  }));
});
// Pictures for the built-in categories (questions inside games/eight.html) go to worker/src/pictures.json:
// uid → [question picture key, answer picture key]. The game adds them to its own questions.
//   content/question_pictures.json  — found automatically (real photos; never a woman)
//   content/women_pictures.json     — the owner's hijab photos { slug: { "<question index>": { qm?, am? } } }, these win
const readJson = (f, d) => (existsSync(join(root, f)) ? JSON.parse(readFileSync(join(root, f), 'utf8')) : d);
const pics = readJson('content/question_pictures.json', {});
const women = readJson('content/women_pictures.json', {});
const eightHtml = readFileSync(join(root, 'games/eight.html'), 'utf8');
const draftSlugs = new Set(cats.filter((c) => c.draft).map((c) => c.slug));
for (const [slug, byIndex] of Object.entries(women)) {
  if (draftSlugs.has(slug)) continue;
  const own = seed.catQuestionsOverrides[slug] && cats.some((c) => c.slug === slug);
  if (own) { // a ready-made category of ours: the picture goes on the question itself
    for (const [i, p] of Object.entries(byIndex)) {
      const q = seed.catQuestionsOverrides[slug][Number(i)]; if (!q) continue;
      if (p.qm) q.qm = pic(p.qm); if (p.am) q.am = pic(p.am);
    }
    continue;
  }
  delete seed.catQuestionsOverrides[slug]; // older releases shipped built-ins as full copies
  const m = eightHtml.match(new RegExp('id="m8_cat_' + slug + '">([\\s\\S]*?)</script>'));
  if (!m) { console.warn('no built-in questions for', slug); continue; }
  const list = JSON.parse(m[1]);
  for (const [i, p] of Object.entries(byIndex)) {
    const q = list[Number(i)]; if (!q) continue;
    const uid = slug + '_q' + (Number(i) + 1) + '_' + (q.points || 200);
    const cur = pics[uid] || ['', ''];
    pics[uid] = [p.qm || cur[0], p.am || cur[1]];
  }
}
writeFileSync(join(root, 'worker/src/pictures.json'), JSON.stringify(pics));
console.log('built-in questions with pictures:', Object.keys(pics).length);
const drafts = new Set(cats.filter((c) => c.draft).map((c) => c.slug));
drafts.forEach((s) => { delete seed.catQuestionsOverrides[s]; });
const slugs = new Set([...extra.map((c) => c.slug), ...drafts]);
seed.categories = [...extra, ...seed.categories.filter((c) => !slugs.has(c.slug))];
writeFileSync(seedPath, JSON.stringify(seed));
console.log('categories:', extra.length, 'questions:', extra.reduce((n, c) => n + c.item_count, 0));
