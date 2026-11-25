#!/usr/bin/env python3
"""Flags new questions whose answer already appears in the same category (old or new), and level counts."""
import json, re, sys, collections
live = {c['id']: c for c in json.load(open(sys.argv[1]))}
more = json.load(open('worker/src/eight_more_questions.json'))
def n(s):
    s = re.sub(r'[ً-ْـ]', '', str(s)); s = re.sub('[أإآ]', 'ا', s).replace('ة', 'ه').replace('ى', 'ي')
    s = re.split(r'[(—،]', s)[0]
    return ' '.join(w[2:] if w.startswith('ال') else w for w in re.sub(r'[^\w]+', ' ', s).split())
drop = '--drop' in sys.argv
args = [a for a in sys.argv[2:] if a != '--drop']
for slug in (args or list(more)):
    old = [n(q['a']) for q in live.get(slug, {}).get('qs', [])]
    seen = collections.Counter(old)
    keep = []
    for q in more.get(slug, []):
        k = n(q['a'])
        if k and (seen[k] or any(k == o or (len(k) > 4 and (k in o or o in k)) for o in old)):
            print('DROP' if drop else 'DUP', slug, q['points'], q['q'][:60], '→', q['a'])
            if drop: continue
        seen[k] += 1
        keep.append(q)
    if drop and slug in more: more[slug] = keep
    lv = collections.Counter(q['points'] for q in more.get(slug, []))
    if lv != {200: 8, 400: 8, 600: 8}: print('LEVELS', slug, dict(lv))
if drop: json.dump(more, open('worker/src/eight_more_questions.json', 'w'), ensure_ascii=False, indent=1)
