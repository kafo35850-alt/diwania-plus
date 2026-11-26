#!/usr/bin/env python3
"""Removes new questions whose answer is written inside the question, and near-duplicates (same answer + similar question) of old or earlier new questions.
Usage: python3 scripts/clean_more.py <live_dump.json> [--apply]"""
import json, re, sys
live = {c['id']: c for c in json.load(open(sys.argv[1]))}
P = 'worker/src/eight_more_questions.json'; m = json.load(open(P))
apply = '--apply' in sys.argv
def n(s):
    s = re.sub(r'[ً-ْـ]', '', str(s)); s = re.sub('[أإآ]', 'ا', s).replace('ة', 'ه').replace('ى', 'ي')
    s = re.split(r'[(—،]', s)[0]
    return ' '.join(w[2:] if w.startswith('ال') else w for w in re.sub(r'[^\w]+', ' ', s).split())
stop = set('ما من هو هي في اي التي الذي اسم كم عام وش مين على الى عن مع بعد قبل'.split())
def toks(q): return {w for w in n(q).split() if w not in stop and len(w) > 2}
removed = 0
for s, L in m.items():
    seen = [(q['q'], q['a']) for q in live.get(s, {}).get('qs', [])]
    keep = []
    for q in L:
        a = n(q['a']); t = toks(q['q']); why = None
        if len(a) >= 4 and a in n(q['q']) and s != 'computer_tech': why = 'answer in question'
        else:
            for oq, oa in seen:
                if a and n(oa) == a:
                    ot = toks(oq)
                    if len(t & ot) / max(1, min(len(t), len(ot))) >= 0.6: why = 'dup of: ' + oq[:60]; break
        if why:
            removed += 1; print(s, '|', q['q'][:70], '=>', q['a'], '||', why)
            if apply: continue
        keep.append(q); seen.append((q['q'], q['a']))
    m[s] = keep
if apply: json.dump(m, open(P, 'w'), ensure_ascii=False, indent=1)
print('removed' if apply else 'would remove', removed)
