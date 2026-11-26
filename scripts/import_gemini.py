#!/usr/bin/env python3
"""Imports a Gemini CSV that covers several categories.
Columns: الفئة,النقاط,السؤال,الإجابة,الحلقة,المصدر   (الفئة = the category code, e.g. series_dark)
Usage: python3 scripts/import_gemini.py file.csv"""
import csv, json, subprocess, sys, os, collections
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
names = json.load(open('content/eight_category_names.json'))
rows = [r for r in csv.DictReader(open(sys.argv[1], encoding='utf-8-sig')) if r.get('السؤال') and r.get('الفئة')]
by = collections.defaultdict(list)
for r in rows: by[r['الفئة'].strip()].append(r)
for slug in list(by):
    if slug not in names: print('unknown category code:', slug); del by[slug]
new = {s: [[int(r['النقاط']), r['السؤال'].strip(), r['الإجابة'].strip()] for r in L] for s, L in by.items()}
p = subprocess.run(['python3', 'scripts/add_more.py'], input=json.dumps(new, ensure_ascii=False), text=True, capture_output=True)
print(p.stdout.strip(), p.stderr)
m = json.load(open('worker/src/eight_more_questions.json'))
have = {r[0] for r in csv.reader(open('reports/scene-episodes.csv'))}
C = json.load(open('content/eight_checked.json'))
done = set(C.get('gemini_new', []))
with open('reports/scene-episodes.csv', 'a', newline='') as f:
    w = csv.writer(f)
    for s, L in by.items():
        byq = {q['q']: q['uid'] for q in m[s]}
        for r in L:
            u = byq.get(r['السؤال'].strip())
            if not u: continue
            done.add(u)
            if r.get('الحلقة', '').strip() and u not in have:
                w.writerow([u, names[s], r['الحلقة'], r.get('المصدر', ''), r['السؤال'], r['الإجابة']])
C['gemini_new'] = sorted(done)
json.dump(C, open('content/eight_checked.json', 'w'), ensure_ascii=False, indent=1)
for s, L in by.items(): print(names[s], len(L))
