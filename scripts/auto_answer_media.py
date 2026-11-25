#!/usr/bin/env python3
"""Answer pictures for «ديوانية الثمانية», picked automatically from Arabic Wikipedia — strictly.

Only the ANSWER side (shown after the answer is revealed), so a picture can never give the answer away.
A question gets a picture only when every check passes; when in doubt it is skipped:
  1. The answer is a name (person / place / thing): no numbers, years, dates or explanations.
  2. An Arabic Wikipedia article has exactly that name (or redirects to it), and is not a disambiguation page.
  3. The article's intro talks about the same thing as the question: it shares a real word with the
     question or the category, and «من …؟» questions must land on a person.
  4. The article has a free picture (Wikimedia Commons licence), which is downloaded and kept with its source.
Religious categories, «احلى نصيب» and «سيارات» are never touched.

  python3 scripts/auto_answer_media.py            # all missing answers in reports/eight-media-gaps.csv
  python3 scripts/auto_answer_media.py --limit 200

Writes worker/src/eight_answer_auto.json (read by worker/src/eight-answer-auto.js), new files in
assets/eight-media/, their sources in content/eight_media_sources.json, and reports/eight-answer-auto.csv
(every question with the reason it got a picture or not). Running it again only looks at what is still missing.
"""
import csv, hashlib, io, json, os, re, subprocess, sys, time, urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GAPS = os.path.join(ROOT, 'reports', 'eight-media-gaps.csv')
OUT = os.path.join(ROOT, 'worker', 'src', 'eight_answer_auto.json')
SOURCES = os.path.join(ROOT, 'content', 'eight_media_sources.json')
REPORT = os.path.join(ROOT, 'reports', 'eight-answer-auto.csv')
MEDIA_DIR = os.path.join(ROOT, 'assets', 'eight-media')
API = 'https://ar.wikipedia.org/w/api.php'
UA = 'DiwaniyaQuizMediaBot/1.0 (quiz answer picture matcher; contact via site)'
EXCLUDED_SLUGS = {'custom_1795086658817', 'custom_cars'}
RELIGIOUS = re.compile(r'(^|\s)(ال)?(قرآن|إسلام|إسلامي|إسلاميات|اسلاميات|سيرة|صحابة|أنبياء|الأنبياء|نبوية|فقه|حديث|عقيدة|سور|سورة|تفسير|أذكار|عبادات|دين|دينية)(\s|$|:)')
PERSON_WORDS = re.compile(r'ممثل|مغن|مطرب|لاعب|كاتب|شاعر|ملحن|رسام|مخرج|سياسي|شخصية|عالم|ملك|أمير|ملكة|أميرة|مدرب|رياض|فنان|إعلامي|مذيع|رئيس|قائد|مؤلف|مصمم|موسيقي|مفكر|فيلسوف|مخترع|ولد|ولدت|توفي|توفيت|حارس|مهاجم|مدافع|بطل|بطلة|يوتيوبر|ممثلة|مغنية|مؤثر|طبيب|مهندس|مستكشف|رحالة|خليفة|سلطان|شيخ')
STOP = set('''الذي التي الذين اللي اسم هذا هذه هذين ماذا متى أين وين كيف كم أي وش هو هي هم في على من إلى الى عن مع كان كانت يكون تكون
أول الأول الأولى أكثر أكبر أشهر أصغر أطول أقدم أحد إحدى التي الذي عام سنة عند حتى بين خلال حول بعد قبل تحت فوق يعرف تعرف يسمى تسمى
الشهير الشهيرة المشهور المعروف المعروفة يطلق لقب الملقب الملقبة باسم ضمن لدى كل بعض جميع غير مثل حرف السؤال الإجابة الصورة'''.split())


def norm(s):
    s = re.sub(r'[ً-ْـ]', '', str(s or ''))
    s = re.sub('[أإآ]', 'ا', s).replace('ة', 'ه').replace('ى', 'ي')
    return re.sub(r'[^\w]+', ' ', s).strip().lower()


def words(s):
    out = set()
    for w in norm(s).split():
        w = re.sub(r'^(وال|بال|لل|فال|كال|ال)', '', w)
        if len(w) >= 4 and w not in STOP and not w.isdigit():
            out.add(w)
    return out


def fingerprint(q, a):
    """Same as fingerprint() in worker/src/eight-question-media.js (FNV-1a over UTF-16 code units)."""
    text = (q or '') + '\0' + (a or '')
    h = 2166136261
    units = text.encode('utf-16-le')
    for i in range(0, len(units), 2):
        h = ((h ^ (units[i] | (units[i + 1] << 8))) * 16777619) & 0xFFFFFFFF
    return h


def answer_name(a):
    """The name to look up, or (None, reason)."""
    a = str(a or '')
    quoted = re.search(r'«([^»]+)»', a)  # فيلم «البحث عن نيمو» → البحث عن نيمو
    main = quoted.group(1) if quoted else re.split(r'\s[—–-]\s|—|–|\(|،|/|\bأو\b', a)[0]
    main = main.strip(' .«»"\'')
    if not main:
        return None, 'إجابة فاضية'
    if re.search(r'[0-9٠-٩]', main):
        return None, 'رقم أو سنة'
    if len(main) < 3 or len(main.split()) > 4:
        return None, 'مو اسم واضح'
    if re.match(r'^(لأن|لان|بسبب|نعم|لا|صح|خطأ|خطا|يعني)\b', main):
        return None, 'شرح مو اسم'
    return main, ''


def api(params, tries=8):
    params = {**params, 'format': 'json', 'formatversion': '2', 'maxlag': '5'}
    url = API + '?' + urllib.parse.urlencode(params)
    wait = 20
    for _ in range(tries):
        r = subprocess.run(['curl', '-s', '-A', UA, '-w', '\n%{http_code}', url], capture_output=True, text=True)
        body, _, code = r.stdout.rpartition('\n')
        if code == '200':
            try:
                return json.loads(body)
            except ValueError:
                pass
        print('  wikipedia busy (' + code + '), waiting', wait, 's', flush=True)
        time.sleep(wait)
        wait = min(wait * 2, 300)
    raise SystemExit('Wikipedia kept refusing; run the script again later (it continues where it stopped).')


def lookup(names):
    """name -> page dict (title, image thumbnail, file name, intro, short description) or None."""
    found = {}
    names = list(names)
    for i in range(0, len(names), 20):
        part = names[i:i + 20]  # API limit for intros
        d = api({'action': 'query', 'redirects': '1', 'titles': '|'.join(part),
                 'prop': 'pageimages|pageprops|extracts', 'pilicense': 'free', 'piprop': 'thumbnail|name',
                 'pithumbsize': '800', 'exintro': '1', 'explaintext': '1', 'exchars': '700', 'exlimit': '20',
                 'ppprop': 'wikibase-shortdesc|disambiguation'})
        q = d.get('query', {})
        back = {}
        for m in q.get('normalized', []) + q.get('redirects', []):
            back.setdefault(m['to'], []).append(m['from'])
        for p in q.get('pages', []):
            if p.get('missing') or p.get('invalid'):
                continue
            origin = {p['title']}
            for t in list(origin) + back.get(p['title'], []):
                origin.add(t)
                origin.update(back.get(t, []))
            for t in origin:
                found[t] = p
        time.sleep(3)
    return found


def matches(row, name, page):
    """'' when the article is about the question's answer, else the reason it is not."""
    if not page:
        return 'ما فيه مقالة بنفس الاسم'
    props = page.get('pageprops', {})
    if 'disambiguation' in props:
        return 'اسم له أكثر من معنى'
    if not page.get('thumbnail') or not page.get('pageimage'):
        return 'المقالة ما فيها صورة حرة'
    intro = (page.get('extract') or '') + ' ' + props.get('wikibase-shortdesc', '')
    q = row['question']
    if re.match(r'^\s*(من\s|مين\s|من هو|من هي)', re.sub(r'^حرف \([^)]*\):\s*', '', q)):
        if not PERSON_WORDS.search(intro):
            return 'السؤال عن شخص والمقالة مو عن شخص'
    context = words(q) | words(row['category'])
    shared = context & words(intro)
    if not shared:
        return 'المقالة ما لها علاقة واضحة بالسؤال'
    return ''


def save_image(url):
    from PIL import Image  # pip install pillow
    raw = subprocess.run(['curl', '-s', '-L', '-A', UA, url], capture_output=True).stdout
    img = Image.open(io.BytesIO(raw))
    img = img.convert('RGBA' if img.mode in ('RGBA', 'LA', 'P') else 'RGB')
    img.thumbnail((800, 800))
    buf = io.BytesIO()
    img.save(buf, 'WEBP', quality=80)
    data = buf.getvalue()
    name = hashlib.sha1(data).hexdigest()[:20] + '.webp'
    with open(os.path.join(MEDIA_DIR, name), 'wb') as f:
        f.write(data)
    time.sleep(1)
    return '/eight-media/' + name


def main():
    limit = int(sys.argv[sys.argv.index('--limit') + 1]) if '--limit' in sys.argv else 10 ** 9
    rows = []
    with open(GAPS, encoding='utf-8-sig') as f:
        r = csv.reader(f)
        next(r)
        for slug, cat, uid, pts, q, a, kind, qgap, agap in r:
            if agap.strip():
                rows.append({'slug': slug, 'category': cat, 'uid': uid, 'question': q, 'answer': a})
    out = json.load(open(OUT)) if os.path.exists(OUT) else {'items': {}}
    done = {uid for s in out['items'].values() for uid in s}
    sources = json.load(open(SOURCES))
    report, todo = [], []
    for row in rows:
        if row['uid'] in done:
            continue
        if row['slug'] in EXCLUDED_SLUGS or RELIGIOUS.search(row['category']):
            report.append([row['slug'], row['uid'], row['answer'], '', 'فئة مستثناة'])
            continue
        name, why = answer_name(row['answer'])
        if not name:
            report.append([row['slug'], row['uid'], row['answer'], '', why])
            continue
        row['name'] = name
        todo.append(row)
    todo = todo[:limit]
    print('questions to check:', len(todo), flush=True)
    added = 0

    def save():
        json.dump(out, open(OUT, 'w'), ensure_ascii=False, separators=(',', ':'))
        json.dump(sources, open(SOURCES, 'w'), ensure_ascii=False, indent=2)
        with open(REPORT, 'w', encoding='utf-8-sig', newline='') as f:
            w = csv.writer(f)
            w.writerow(['معرف الفئة', 'معرف السؤال', 'الإجابة', 'مقالة ويكيبيديا', 'النتيجة'])
            w.writerows(old_report + report)

    old_report = []
    if os.path.exists(REPORT):
        with open(REPORT, encoding='utf-8-sig') as f:
            old_report = [x for x in list(csv.reader(f))[1:] if x[1] in done or x[4] not in ('',)]
        seen_report = {x[1] for x in old_report}
        todo = [r for r in todo if r['uid'] not in seen_report]
        report = [x for x in report if x[1] not in seen_report]
    # Small groups, saved after each one: if Wikipedia stops answering, the next run carries on from here.
    names = sorted({r['name'] for r in todo})
    for i in range(0, len(names), 20):
        group = set(names[i:i + 20])
        pages = lookup(group)
        for row in [r for r in todo if r['name'] in group]:
            page = pages.get(row['name'])
            why = matches(row, row['name'], page)
            if why:
                report.append([row['slug'], row['uid'], row['answer'], page and page.get('title') or '', why])
                continue
            try:
                u = save_image(page['thumbnail']['source'])
            except Exception:  # unreadable picture: skip it
                report.append([row['slug'], row['uid'], row['answer'], page['title'], 'تعذر تحميل الصورة'])
                continue
            out['items'].setdefault(row['slug'], {})[row['uid']] = [fingerprint(row['question'], row['answer']), u]
            sources[u] = 'https://commons.wikimedia.org/wiki/File:' + page['pageimage'].replace(' ', '_')
            report.append([row['slug'], row['uid'], row['answer'], page['title'], 'انضافت ✅'])
            added += 1
        save()
        print('checked', min(i + 20, len(names)), 'of', len(names), 'names — pictures added:', added, flush=True)
    save()
    print('done: added', added, 'pictures; report in reports/eight-answer-auto.csv', flush=True)


if __name__ == '__main__':
    main()
