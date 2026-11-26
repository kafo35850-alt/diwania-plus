#!/usr/bin/env python3
"""Imports a Gemini scene-questions CSV (النقاط,السؤال,الإجابة,الحلقة,المصدر) into a category.
Usage: python3 scripts/import_scene.py file.csv <slug> "<اسم الفئة>"
Adds questions to eight_more_questions.json, episodes to reports/scene-episodes.csv, and marks them checked."""
import csv, json, subprocess, sys, os
src, slug, name = sys.argv[1], sys.argv[2], sys.argv[3]
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
rows = [r for r in csv.DictReader(open(src, encoding='utf-8-sig')) if r.get('السؤال')]
new = {slug: [[int(r['النقاط']), r['السؤال'].strip(), r['الإجابة'].strip()] for r in rows]}
p = subprocess.run(['python3', 'scripts/add_more.py'], input=json.dumps(new, ensure_ascii=False), text=True, capture_output=True)
print(p.stdout.strip(), p.stderr)
m = json.load(open('worker/src/eight_more_questions.json'))
byq = {q['q']: q['uid'] for q in m[slug]}
have = {r[0] for r in csv.reader(open('reports/scene-episodes.csv'))}
with open('reports/scene-episodes.csv', 'a', newline='') as f:
    w = csv.writer(f)
    for r in rows:
        u = byq[r['السؤال'].strip()]
        if u not in have: w.writerow([u, name, r['الحلقة'], r['المصدر'], r['السؤال'], r['الإجابة']])
C = json.load(open('content/eight_checked.json'))
C['gemini_new'] = sorted(set(C.get('gemini_new', [])) | {byq[r['السؤال'].strip()] for r in rows})
json.dump(C, open('content/eight_checked.json', 'w'), ensure_ascii=False, indent=1)
print(name, len(rows))
