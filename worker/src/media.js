// Question media: images (compressed in the browser), audio and short videos, uploaded by signed-in users,
// stored in D1 and served from /media/<id>. Audio and video are split into pieces (one D1 row holds ~2MB)
// and served with byte ranges so Safari can play and seek them.
import { HttpError, clientIp, nowIso, randomId, underRateLimit } from './util.js';

const CHUNK = 1536 * 1024;
const MB = 1024 * 1024;
// The free D1 database holds 500MB; keep room for everything else.
const STORAGE_CAP = 420 * MB;
export const MEDIA_RE = /^\/media\/(med_[A-Za-z0-9_-]{6,60})$/;

const TYPES = {
  'image/jpeg': 'image', 'image/png': 'image', 'image/webp': 'image', 'image/gif': 'image',
  'audio/mpeg': 'audio', 'audio/mp3': 'audio', 'audio/mp4': 'audio', 'audio/x-m4a': 'audio', 'audio/m4a': 'audio',
  'audio/aac': 'audio', 'audio/wav': 'audio', 'audio/x-wav': 'audio', 'audio/wave': 'audio', 'audio/ogg': 'audio', 'audio/webm': 'audio',
  'video/mp4': 'video', 'video/quicktime': 'video', 'video/webm': 'video', 'video/x-m4v': 'video'
};
// Size limits per kind: staff (owner/admin) and players.
const LIMITS = {
  staff: { image: 450 * 1024, audio: 6 * MB, video: 15 * MB },
  player: { image: 450 * 1024, audio: 3 * MB, video: 0 }
};

function ascii(b, from, len) { let s = ''; for (let i = from; i < from + len && i < b.length; i++) s += String.fromCharCode(b[i]); return s; }
// Checks the file's first bytes, so a renamed file can't pass as media.
function looksLike(bytes, mime) {
  if (bytes.length < 12) return false;
  const kind = TYPES[mime];
  const isoBmff = ascii(bytes, 4, 4) === 'ftyp';
  if (mime === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mime === 'image/png') return bytes[0] === 0x89 && ascii(bytes, 1, 3) === 'PNG';
  if (mime === 'image/webp') return ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 4) === 'WEBP';
  if (mime === 'image/gif') return ascii(bytes, 0, 4) === 'GIF8';
  if (/wav|wave/.test(mime)) return ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 4) === 'WAVE';
  if (/ogg/.test(mime)) return ascii(bytes, 0, 4) === 'OggS';
  if (/webm/.test(mime)) return bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3;
  if (mime === 'audio/mpeg' || mime === 'audio/mp3') return ascii(bytes, 0, 3) === 'ID3' || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0);
  if (mime === 'audio/aac') return (bytes[0] === 0xff && (bytes[1] & 0xf0) === 0xf0) || isoBmff;
  if (kind === 'audio' || kind === 'video') return isoBmff;
  return false;
}

export async function mediaBytesUsed(env) {
  const r = await env.DB.prepare('SELECT COALESCE(SUM(size), 0) AS n FROM media').first();
  return r ? r.n : 0;
}

export async function uploadMedia(env, request, session) {
  const isStaff = session.user.role === 'owner' || session.user.role === 'admin';
  if (!(await underRateLimit(env, 'media_u:' + session.user.id, isStaff ? 600 : 40, 60 * 60 * 1000)) ||
      !(await underRateLimit(env, 'media_ip:' + clientIp(request), isStaff ? 600 : 60, 60 * 60 * 1000))) {
    throw new HttpError(429, 'رفعت ملفات كثيرة خلال ساعة. حاول بعد شوي.');
  }
  const mime = String(request.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  const kind = TYPES[mime];
  if (!kind) throw new HttpError(415, 'نوع الملف غير مدعوم. المسموح: صور (JPG/PNG)، صوت (MP3/M4A)، فيديو (MP4/MOV).');
  const max = LIMITS[isStaff ? 'staff' : 'player'][kind];
  if (!max) throw new HttpError(403, 'رفع الفيديو للإدارة بس. تقدر تحط رابط يوتيوب بدلاً منه.');
  const tooBig = 'الملف كبير. الحد ' + (max >= MB ? Math.round(max / MB) + ' ميقابايت' : Math.round(max / 1024) + ' كيلوبايت') + (kind === 'video' ? '. للمقاطع الطويلة استخدم رابط يوتيوب.' : '.');
  if (Number(request.headers.get('content-length') || 0) > max) throw new HttpError(413, tooBig);
  const buf = new Uint8Array(await request.arrayBuffer());
  if (!buf.length || buf.length > max) throw new HttpError(413, tooBig);
  if (!looksLike(buf, mime)) throw new HttpError(415, 'الملف تالف أو مو من النوع المكتوب.');
  if ((await mediaBytesUsed(env)) + buf.length > STORAGE_CAP) {
    throw new HttpError(507, 'مساحة الوسائط امتلأت. احذف وسائط قديمة أو استخدم روابط يوتيوب.');
  }
  const id = randomId('med');
  const iso = nowIso();
  if (kind === 'image' || buf.length <= CHUNK) {
    await env.DB.prepare('INSERT INTO media (id, user_id, mime, size, data, created_at, chunks, kind) VALUES (?, ?, ?, ?, ?, ?, 0, ?)')
      .bind(id, session.user.id, mime, buf.length, buf, iso, kind).run();
  } else {
    const parts = Math.ceil(buf.length / CHUNK);
    const stmts = [env.DB.prepare('INSERT INTO media (id, user_id, mime, size, data, created_at, chunks, kind) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(id, session.user.id, mime, buf.length, new Uint8Array(0), iso, parts, kind)];
    for (let i = 0; i < parts; i++) {
      stmts.push(env.DB.prepare('INSERT INTO media_chunks (media_id, idx, data) VALUES (?, ?, ?)').bind(id, i, buf.subarray(i * CHUNK, Math.min(buf.length, (i + 1) * CHUNK))));
    }
    await env.DB.batch(stmts);
  }
  return { ok: true, url: '/media/' + id, kind, size: buf.length };
}

const MEDIA_HEADERS = {
  'cache-control': 'public, max-age=31536000, immutable',
  'x-content-type-options': 'nosniff',
  'content-security-policy': "default-src 'none'; sandbox",
  'cross-origin-resource-policy': 'same-origin',
  'accept-ranges': 'bytes'
};

export async function serveMedia(env, request, id) {
  const row = await env.DB.prepare('SELECT mime, size, chunks, data FROM media WHERE id = ?').bind(id).first();
  if (!row) return new Response('Not found', { status: 404 });
  const head = request.method === 'HEAD';
  const size = row.size;
  let start = 0;
  let end = size - 1;
  let partial = false;
  const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get('range') || '');
  if (range && (range[1] !== '' || range[2] !== '')) {
    if (range[1] === '') { start = Math.max(0, size - Number(range[2])); }
    else { start = Number(range[1]); if (range[2] !== '') end = Math.min(size - 1, Number(range[2])); }
    if (start >= size || start > end) {
      return new Response(null, { status: 416, headers: { ...MEDIA_HEADERS, 'content-range': 'bytes */' + size } });
    }
    partial = true;
  }
  let body;
  if (!row.chunks) {
    const all = row.data instanceof ArrayBuffer ? new Uint8Array(row.data) : new Uint8Array(row.data);
    body = all.subarray(start, end + 1);
  } else {
    // Send at most two pieces per request; players ask for the rest with further range requests.
    const first = Math.floor(start / CHUNK);
    let last = Math.floor(end / CHUNK);
    if (partial && last - first > 1) { last = first + 1; end = Math.min(end, (last + 1) * CHUNK - 1); }
    const rows = await env.DB.prepare('SELECT idx, data FROM media_chunks WHERE media_id = ? AND idx BETWEEN ? AND ? ORDER BY idx').bind(id, first, last).all();
    const pieces = (rows.results || []).map((r) => new Uint8Array(r.data));
    const joined = new Uint8Array(pieces.reduce((n, p) => n + p.length, 0));
    let off = 0;
    for (const p of pieces) { joined.set(p, off); off += p.length; }
    body = joined.subarray(start - first * CHUNK, end - first * CHUNK + 1);
  }
  const headers = { ...MEDIA_HEADERS, 'content-type': row.mime, 'content-length': String(body.length) };
  if (partial) headers['content-range'] = 'bytes ' + start + '-' + end + '/' + size;
  return new Response(head ? null : body, { status: partial ? 206 : 200, headers });
}

// A question's media: { t: 'image' | 'audio' | 'video' | 'youtube', u: our /media/ address or an https link }.
export function cleanMedia(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const u = String(raw.u || '').trim();
  let t = String(raw.t || '').trim();
  if (!u) return null;
  if (MEDIA_RE.test(u)) return ['image', 'audio', 'video'].includes(t) ? { t, u } : { t: 'image', u };
  const link = httpsUrl(u, 600);
  if (!link) return null;
  if (youTubeId(link)) return { t: 'youtube', u: link };
  if (!['image', 'audio', 'video'].includes(t)) t = guessKind(link);
  return { t, u: link };
}
export function guessKind(u) {
  if (youTubeId(u)) return 'youtube';
  if (/\.(mp3|m4a|aac|wav|ogg|oga)(\?|#|$)/i.test(u)) return 'audio';
  if (/\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(u)) return 'video';
  return 'image';
}
export function youTubeId(u) {
  try {
    const x = new URL(u);
    const h = x.hostname.replace(/^(www|m|music)\./, '');
    let id = '';
    if (h === 'youtu.be') id = x.pathname.slice(1).split('/')[0];
    else if (h === 'youtube.com' || h === 'youtube-nocookie.com') {
      id = x.searchParams.get('v') || ((x.pathname.match(/^\/(?:shorts|embed|live)\/([A-Za-z0-9_-]+)/) || [])[1] || '');
    }
    return /^[A-Za-z0-9_-]{6,20}$/.test(id) ? id : '';
  } catch (e) { return ''; }
}
// Older questions kept separate image / video links: turn them into question media.
export function legacyMedia(img, video) {
  const i = String(img || '').trim();
  if (i) return cleanMedia({ t: 'image', u: i });
  const v = String(video || '').trim();
  if (v) return cleanMedia({ t: guessKind(v), u: v });
  return null;
}
function httpsUrl(v, max) {
  if (!v || v.length > max) return '';
  try {
    const u = new URL(v);
    return u.protocol === 'https:' ? u.href : '';
  } catch (e) { return ''; }
}
