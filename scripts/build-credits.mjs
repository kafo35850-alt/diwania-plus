// Writes public/legal/credits.html: who took each real photo used in the picture categories, and its licence
// (Wikimedia Commons photos under Creative Commons need this credit).   node scripts/build-credits.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const credits = JSON.parse(readFileSync(join(root, 'content/media/credits.json'), 'utf8'));
const esc = (s) => String(s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const rows = Object.entries(credits).sort(([a], [b]) => a.localeCompare(b)).map(([, c]) =>
  `<li><a href="${esc(c.page)}" target="_blank" rel="noopener" dir="ltr">${esc(c.title)}</a> — <span dir="ltr">${esc(c.author || 'Unknown')}</span> · <span dir="ltr">${esc(c.license)}</span></li>`).join('\n');
writeFileSync(join(root, 'public/legal/credits.html'), `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>مصادر الصور — ديوانية بلس</title>
<link rel="stylesheet" href="/legal/legal.css">
</head>
<body>
<main>
<nav><a href="/">← العودة للمتجر</a><a href="/legal/terms.html">الشروط والأحكام</a><a href="/legal/privacy.html">سياسة الخصوصية</a></nav>
<h1>مصادر الصور</h1>
<div class="card">
<p>الصور الحقيقية في فئات الصور (مثل «سيارات» و«عالم المكياج») من مكتبة <a href="https://commons.wikimedia.org" target="_blank" rel="noopener">ويكيميديا كومنز</a>، ومنشورة برخص مفتوحة تسمح باستخدامها مع ذكر المصدر. بعضها معدّل (قص، أو تغبيش الشعار أو الاسم عشان يصير سؤال).</p>
<ul>
${rows}
</ul>
</div>
</main>
</body>
</html>
`);
console.log('credits:', Object.keys(credits).length);
