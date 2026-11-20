// Adds the ready-made Eight categories in content/eight_categories.json to worker/src/seed.json
// (category + its questions). Safe to run again: categories are replaced by slug.
//   node scripts/add-eight-categories.mjs
import { readFileSync, writeFileSync } from 'node:fs';
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
cats.forEach((c, i) => {
  extra.push({
    id: 'cat_' + c.slug, slug: c.slug, name: c.name,
    macro_group: 'فئات الديوانية', sub_group: c.group, description: c.description, icon: c.icon,
    posterTheme: 'country_saudi', poster: '/cat-posters/' + c.poster + '.svg',
    sort_order: i + 1, is_visible: 1, item_count: c.questions.length
  });
  seed.catQuestionsOverrides[c.slug] = c.questions.map((q, n) => ({
    uid: c.slug + '_' + (n + 1) + '_' + q.points, points: q.points, q: q.q, a: q.a, hint: q.hint || '', info: q.hint || '', qm: pic(q.qm), am: pic(q.am)
  }));
});
const slugs = new Set(extra.map((c) => c.slug));
seed.categories = [...extra, ...seed.categories.filter((c) => !slugs.has(c.slug))];
writeFileSync(seedPath, JSON.stringify(seed));
console.log('categories:', extra.length, 'questions:', extra.reduce((n, c) => n + c.item_count, 0));
