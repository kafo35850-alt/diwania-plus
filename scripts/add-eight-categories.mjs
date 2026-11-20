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
// Owner-approved pictures of women (hijab versions) for chosen questions: content/women_pictures.json
// { slug: { "<question index>": { qm?: key, am?: key } } }. A built-in category (questions inside games/eight.html)
// is shipped as an override with all its questions, unchanged except for these pictures.
const womenPath = join(root, 'content/women_pictures.json');
const women = existsSync(womenPath) ? JSON.parse(readFileSync(womenPath, 'utf8')) : {};
const eightHtml = readFileSync(join(root, 'games/eight.html'), 'utf8');
const draftSlugs = new Set(cats.filter((c) => c.draft).map((c) => c.slug));
for (const [slug, byIndex] of Object.entries(women)) {
  if (draftSlugs.has(slug)) continue;
  let list = seed.catQuestionsOverrides[slug];
  if (!list) {
    const m = eightHtml.match(new RegExp('id="m8_cat_' + slug + '">([\\s\\S]*?)</script>'));
    if (!m) { console.warn('no built-in questions for', slug); continue; }
    list = JSON.parse(m[1]).map((q, n) => Object.assign({}, q, { uid: q.uid || slug + '_q' + (n + 1) }));
    seed.catQuestionsOverrides[slug] = list;
  }
  for (const [i, pics] of Object.entries(byIndex)) {
    const q = list[Number(i)]; if (!q) continue;
    if (pics.qm) q.qm = pic(pics.qm);
    if (pics.am) q.am = pic(pics.am);
  }
}
const drafts = new Set(cats.filter((c) => c.draft).map((c) => c.slug));
drafts.forEach((s) => { delete seed.catQuestionsOverrides[s]; });
const slugs = new Set([...extra.map((c) => c.slug), ...drafts]);
seed.categories = [...extra, ...seed.categories.filter((c) => !slugs.has(c.slug))];
writeFileSync(seedPath, JSON.stringify(seed));
console.log('categories:', extra.length, 'questions:', extra.reduce((n, c) => n + c.item_count, 0));
