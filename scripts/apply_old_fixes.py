#!/usr/bin/env python3
"""Adds fact-check fixes for existing (old) Eight questions to worker/src/eight_question_fixes.json.
Usage: python3 scripts/apply_old_fixes.py fixes.csv [live_dump.json]
CSV columns: المعرّف,المشكلة,السؤال المصحح,الإجابة الصحيحة,المصدر.
The category of each question id comes from content/eight_uid_category.json."""
import csv, json, os, sys, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = os.path.join(ROOT, 'worker', 'src', 'eight_question_fixes.json')
U = os.path.join(ROOT, 'content', 'eight_uid_category.json')
fixes = json.load(open(P)) if os.path.exists(P) else {}
cat = json.load(open(U))
n = 0
with open(sys.argv[1], encoding='utf-8-sig') as f:
    r = csv.reader(f)
    next(r)
    for row in r:
        if len(row) < 4 or not row[0].strip(): continue
        uid, problem, q, a = row[0].strip(), row[1], row[2].strip(), row[3].strip()
        slug = cat.get(uid)
        if not slug: print('unknown id', uid); continue
        # keep only the answer itself; Gemini sometimes adds an explanation in brackets
        a = re.sub(r'\s*\((?:[^()]*?)(?:وليس|ليس|لا )[^()]*\)\s*$', '', a).strip()
        fix = {}
        if q: fix['q'] = q
        if a: fix['a'] = a
        if fix:
            fixes.setdefault(slug, {})[uid] = fix; n += 1
json.dump(fixes, open(P, 'w'), ensure_ascii=False, indent=1)
print('fixes applied:', n, 'total:', sum(len(v) for v in fixes.values()))
