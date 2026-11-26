#!/usr/bin/env python3
"""Writes the existing questions of categories to reports/gemini-existing/<slug>.txt so Gemini can avoid repeats.
Usage: python3 scripts/export_existing.py <live_dump.json> slug1 slug2 ..."""
import json, sys, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
live = {c['id']: c for c in json.load(open(sys.argv[1]))}
more = json.load(open(os.path.join(ROOT, 'worker/src/eight_more_questions.json')))
out = os.path.join(ROOT, 'reports', 'gemini-existing'); os.makedirs(out, exist_ok=True)
for slug in sys.argv[2:]:
    c = live.get(slug, {'name': slug, 'qs': []})
    qs = [(q.get('p') or q.get('points'), q['q'], q['a']) for q in c['qs']] + [(q['points'], q['q'], q['a']) for q in more.get(slug, [])]
    with open(os.path.join(out, slug + '.txt'), 'w') as f:
        f.write(f"# {c['name']} — الأسئلة الموجودة ({len(qs)}). لا تكرر أي سؤال أو جواب منها.\n")
        for p, q, a in qs: f.write(f"{p} | {q.strip()} | {a.strip()}\n")
    print(slug, len(qs))
