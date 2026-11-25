#!/usr/bin/env python3
"""Adds new questions for categories to worker/src/eight_more_questions.json.
Input (stdin): JSON {slug: [[points, question, answer], ...]}. Skips a question whose text already exists."""
import json, os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = os.path.join(ROOT, 'worker', 'src', 'eight_more_questions.json')
data = json.load(open(P))
new = json.load(sys.stdin)
for slug, rows in new.items():
    lst = data.setdefault(slug, [])
    have = {q['q'] for q in lst}
    n = len(lst)
    for pts, q, a in rows:
        if q in have: continue
        n += 1
        lst.append({'uid': f'{slug}_more_q{n}_{pts}', 'points': pts, 'q': q, 'a': a})
    print(slug, len(lst))
json.dump(data, open(P, 'w'), ensure_ascii=False, indent=1)
