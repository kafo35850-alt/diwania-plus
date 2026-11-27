// Data for «حامي بارد الديوانية» (word-distance game): word list, compressed word meanings and the closest words of each hidden word.
// Built offline by scripts/ctx/build2.py; served with a long cache since the files only change with a release.
// POST /ctx/guess ranks a word that is not in the word list, using the same three Workers AI models the list was built with.
import vocab from './ctx/vocab.txt';
import emb from './ctx/emb.bin';
import top from './ctx/top.bin';
import sec from './ctx/sec.bin';
import thr from './ctx/thr.bin';

const FILES = { 'vocab.txt': [vocab, 'text/plain; charset=utf-8'], 'emb.bin': [emb, 'application/octet-stream'], 'top.bin': [top, 'application/octet-stream'] };
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

// Same normalisation as the word list: no diacritics, one alef, ة→ه, ى→ي, without «ال».
export function wordKey(w) {
  w = String(w || '').trim().replace(/[ً-ْـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي').replace(/\s+/g, ' ');
  if (w.indexOf('ال') === 0 && w.length >= 4) w = w.slice(2);
  return w;
}
function half(h) {
  const s = (h & 0x8000) ? -1 : 1, e = (h >> 10) & 0x1f, f = h & 0x3ff;
  if (e === 0) return s * Math.pow(2, -14) * (f / 1024);
  if (e === 31) return f ? NaN : s * Infinity;
  return s * Math.pow(2, e - 15) * (1 + f / 1024);
}
let DATA = null;
function data() {
  if (DATA) return DATA;
  const words = vocab.split('\n');
  const th = new Uint16Array(top, 0, 2), K = th[1], topIdx = new Uint16Array(top, 4);
  const sh = new Int32Array(sec, 0, 2), ns = sh[0], dim = sh[1], secV = new Uint16Array(sec, 8);
  const hh = new Int32Array(thr, 0, 2), nr = hh[1], ranks = new Int32Array(thr, 8, nr), thrV = new Uint16Array(thr, 8 + 4 * nr);
  DATA = { words, K, topIdx, ns, dim, secV, nr, ranks, thrV };
  return DATA;
}
const bigrams = (w) => { w = '^' + w + '$'; const s = new Set(); for (let i = 0; i < w.length - 1; i++) s.add(w.slice(i, i + 2)); return s; };
function dice(a, b) { const A = bigrams(a), B = bigrams(b); let n = 0; A.forEach((x) => { if (B.has(x)) n++; }); return (2 * n) / (A.size + B.size); }
const MODELS = [
  ['@cf/qwen/qwen3-embedding-0.6b', (w) => 'Instruct: Given an Arabic word, retrieve words related in meaning\nQuery: ' + w],
  ['@cf/baai/bge-m3', (w) => w],
  ['@cf/google/embeddinggemma-300m', (w) => w]
];
const cache = new Map(), hits = new Map();
async function guess(env, request) {
  if (!env.AI) return json({ ok: false, error: 'ai_off' }, 503);
  const ip = request.headers.get('cf-connecting-ip') || 'x', now = Date.now();
  const h = hits.get(ip) || []; const recent = h.filter((t) => now - t < 60000); recent.push(now); hits.set(ip, recent);
  if (recent.length > 40) return json({ ok: false, error: 'slow_down' }, 429);
  let body; try { body = await request.json(); } catch (e) { return json({ ok: false, error: 'bad_json' }, 400); }
  const D = data(), id = Number(body && body.id), raw = String((body && body.w) || '').trim().slice(0, 30);
  if (!(id >= 0 && id < D.ns) || !/^[ء-يً-ْـ ]{2,30}$/.test(raw)) return json({ ok: false, error: 'bad_word' }, 400);
  const k = wordKey(raw), secretKey = wordKey(D.words[D.topIdx[id * D.K]]);
  if (k === secretKey) return json({ ok: true, rank: 1 });
  const ck = id + ':' + k;
  if (cache.has(ck)) return json({ ok: true, rank: cache.get(ck) });
  const parts = await Promise.all(MODELS.map(([m, t]) => env.AI.run(m, { text: [t(raw)] }).then((r) => r.data[0])));
  let dot = 0, off = 0; const base = id * D.dim;
  for (const v of parts) {
    let n = 0; for (const x of v) n += x * x; n = Math.sqrt(n) || 1;
    for (let j = 0; j < v.length; j++) dot += (v[j] / n / Math.sqrt(3)) * half(D.secV[base + off + j]);
    off += v.length;
  }
  if (off !== D.dim) return json({ ok: false, error: 'dim' }, 500);
  const score = dot - 0.15 * dice(k, secretKey);
  // Rank = how many words of the list score higher (sampled thresholds, filled in between).
  const t = (i) => half(D.thrV[id * D.nr + i]);
  let rank = D.ranks[D.nr - 1] + 1;
  for (let i = 1; i < D.nr; i++) {
    if (t(i) <= score) {
      const r0 = D.ranks[i - 1], r1 = D.ranks[i], s0 = t(i - 1), s1 = t(i);
      const f = isFinite(s0) && s0 > s1 ? (s0 - score) / (s0 - s1) : 1;
      rank = Math.max(2, Math.round(r0 + f * (r1 - r0)));
      break;
    }
  }
  if (cache.size > 5000) cache.clear();
  cache.set(ck, rank);
  return json({ ok: true, rank });
}
export async function serveCtx(url, request, env) {
  if (url.pathname === '/ctx/guess' && request && request.method === 'POST') return guess(env, request);
  const f = FILES[url.pathname.slice('/ctx/'.length)];
  if (!f) return new Response('Not found', { status: 404 });
  return new Response(f[0], { headers: { 'content-type': f[1], 'cache-control': 'public, max-age=3600' } });
}
