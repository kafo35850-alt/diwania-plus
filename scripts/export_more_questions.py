#!/usr/bin/env python3
"""Lists the new questions in worker/src/eight_more_questions.json as reports/eight-more-questions.csv
(category, question id, points, question, answer) — what Codex and the answer-picture tool work from.
Category names come from content/eight_category_names.json (slug -> Arabic name)."""
import csv, json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
more = json.load(open(os.path.join(ROOT, 'worker', 'src', 'eight_more_questions.json')))
names = json.load(open(os.path.join(ROOT, 'content', 'eight_category_names.json')))
with open(os.path.join(ROOT, 'reports', 'eight-more-questions.csv'), 'w', encoding='utf-8-sig', newline='') as f:
    w = csv.writer(f)
    w.writerow(['معرف الفئة', 'الفئة', 'معرف السؤال', 'النقاط', 'السؤال', 'الإجابة'])
    for slug, qs in more.items():
        for q in qs:
            w.writerow([slug, names.get(slug, slug), q['uid'], q['points'], q['q'], q['a']])
print('rows:', sum(len(v) for v in more.values()))
