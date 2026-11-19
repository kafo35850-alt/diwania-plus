// Question images: uploaded by signed-in users (already compressed in the browser), stored in D1,
// and served from /media/<id>. Videos are never uploaded: questions keep a link (YouTube or a direct file).
import { HttpError, clientIp, nowIso, randomId, underRateLimit } from './util.js';

const MAX_BYTES = 450 * 1024;
const TYPES = { 'image/jpeg': [0xff, 0xd8, 0xff], 'image/png': [0x89, 0x50, 0x4e, 0x47], 'image/webp': [0x52, 0x49, 0x46, 0x46] };
export const MEDIA_RE = /^\/media\/(med_[A-Za-z0-9_-]{6,60})$/;

function sniff(bytes, mime) {
  const sig = TYPES[mime];
  if (!sig || bytes.length < 12) return false;
  for (let i = 0; i < sig.length; i++) if (bytes[i] !== sig[i]) return false;
  if (mime === 'image/webp') return String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]) === 'WEBP';
  return true;
}

export async function uploadMedia(env, request, session) {
  const isStaff = session.user.role === 'owner' || session.user.role === 'admin';
  const limit = isStaff ? 600 : 40;
  if (!(await underRateLimit(env, 'media_u:' + session.user.id, limit, 60 * 60 * 1000)) ||
      !(await underRateLimit(env, 'media_ip:' + clientIp(request), isStaff ? 600 : 60, 60 * 60 * 1000))) {
    throw new HttpError(429, 'رفعت صور كثيرة خلال ساعة. حاول بعد شوي.');
  }
  const mime = String(request.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (!TYPES[mime]) throw new HttpError(415, 'الصورة لازم تكون JPG أو PNG أو WEBP.');
  const len = Number(request.headers.get('content-length') || 0);
  if (len > MAX_BYTES) throw new HttpError(413, 'الصورة كبيرة. الحد ٤٥٠ كيلوبايت بعد الضغط.');
  const buf = new Uint8Array(await request.arrayBuffer());
  if (!buf.length || buf.length > MAX_BYTES) throw new HttpError(413, 'الصورة كبيرة. الحد ٤٥٠ كيلوبايت بعد الضغط.');
  if (!sniff(buf, mime)) throw new HttpError(415, 'الملف مو صورة صالحة.');
  const id = randomId('med');
  await env.DB.prepare('INSERT INTO media (id, user_id, mime, size, data, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(id, session.user.id, mime, buf.length, buf, nowIso()).run();
  return { ok: true, url: '/media/' + id };
}

export async function serveMedia(env, request, id) {
  const row = await env.DB.prepare('SELECT mime, data FROM media WHERE id = ?').bind(id).first();
  if (!row) return new Response('Not found', { status: 404 });
  const body = row.data instanceof ArrayBuffer ? row.data : new Uint8Array(row.data);
  return new Response(request.method === 'HEAD' ? null : body, {
    headers: {
      'content-type': row.mime,
      'cache-control': 'public, max-age=31536000, immutable',
      'x-content-type-options': 'nosniff',
      'content-security-policy': "default-src 'none'; sandbox",
      'cross-origin-resource-policy': 'same-origin'
    }
  });
}

// Image: one of our uploads, or an https link. Video: an https link (YouTube or a direct video file).
export function cleanImageRef(raw) {
  const v = String(raw || '').trim();
  if (!v) return '';
  if (MEDIA_RE.test(v)) return v;
  return httpsUrl(v, 600);
}
export function cleanVideoRef(raw) {
  return httpsUrl(String(raw || '').trim(), 600);
}
function httpsUrl(v, max) {
  if (!v || v.length > max) return '';
  try {
    const u = new URL(v);
    return u.protocol === 'https:' ? u.href : '';
  } catch (e) { return ''; }
}
