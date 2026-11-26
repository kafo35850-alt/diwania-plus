// Data for «حامي بارد» (word-distance game): word list, compressed word meanings and the closest words of each hidden word.
// Built offline by the word-embedding scripts; served with a long cache since the files only change with a release.
import vocab from './ctx/vocab.txt';
import emb from './ctx/emb.bin';
import top from './ctx/top.bin';

const FILES = { 'vocab.txt': [vocab, 'text/plain; charset=utf-8'], 'emb.bin': [emb, 'application/octet-stream'], 'top.bin': [top, 'application/octet-stream'] };
export function serveCtx(url) {
  const f = FILES[url.pathname.slice('/ctx/'.length)];
  if (!f) return new Response('Not found', { status: 404 });
  return new Response(f[0], { headers: { 'content-type': f[1], 'cache-control': 'public, max-age=86400' } });
}
