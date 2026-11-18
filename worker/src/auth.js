// Email + one-time code login, cookie sessions and the owner/admin roles.
// Owner: emails in the OWNER_EMAILS setting (can add/remove admins). Admin: granted by an owner, stored in D1.
import {
  HttpError, nowMs, nowIso, randomToken, randomId, sha256Hex, sixDigitCode,
  constantTimeEqual, getCookie, clientIp, cleanText, underRateLimit
} from './util.js';
import { sendLoginCode } from './mail.js';

export const SESSION_COOKIE = 'dw_sess';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_SEND_WINDOW_MS = 15 * 60 * 1000;
const OTP_MAX_SENDS = 5;
const OTP_MAX_ATTEMPTS = 5;
const OTP_LOCK_MS = 15 * 60 * 1000;
const IP_SEND_LIMIT = 20;            // codes per IP per hour
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function authSecret(env) {
  if (!env.AUTH_SECRET || env.AUTH_SECRET.length < 16) {
    throw new HttpError(500, 'إعدادات الخادم ناقصة (AUTH_SECRET).');
  }
  return env.AUTH_SECRET;
}

function normalizeEmail(raw) {
  const email = String(raw || '').trim().toLowerCase();
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) return null;
  return email;
}

function ownerEmails(env) {
  return String(env.OWNER_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

async function codeHash(env, email, code) {
  return sha256Hex(authSecret(env) + ':otp:' + email + ':' + code);
}

export function publicUser(user, csrfToken) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    status: user.status,
    emailVerified: true,
    // adminRole opens the admin panel for owners and admins; role tells them apart.
    adminRole: user.role === 'owner' || user.role === 'admin' ? 'owner' : null,
    role: user.role === 'owner' || user.role === 'admin' ? user.role : null,
    csrfToken
  };
}

export function sessionCookie(token, request) {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return SESSION_COOKIE + '=' + token + '; Path=/; HttpOnly; SameSite=Lax; Max-Age=' + SESSION_TTL_MS / 1000 + secure;
}

export function clearSessionCookie(request) {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return SESSION_COOKIE + '=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0' + secure;
}

// Returns { user, csrfToken, tokenHash } or null.
export async function currentSession(env, request) {
  const token = getCookie(request, SESSION_COOKIE);
  if (!token || token.length > 200) return null;
  const tokenHash = await sha256Hex(token);
  const row = await env.DB.prepare(
    'SELECT s.csrf_token, s.expires_at, u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?'
  ).bind(tokenHash).first();
  if (!row) return null;
  if (row.expires_at < nowMs()) {
    await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(tokenHash).run();
    return null;
  }
  if (row.status !== 'active') return null;
  const user = { id: row.id, email: row.email, display_name: row.display_name, status: row.status, role: row.role, created_at: row.created_at };
  return { user, csrfToken: row.csrf_token, tokenHash };
}

export async function requireSession(env, request, { csrf = true, owner = false } = {}) {
  const session = await currentSession(env, request);
  if (!session) throw new HttpError(401, 'يرجى تسجيل الدخول أولاً.');
  if (csrf && !constantTimeEqual(request.headers.get('x-dw-csrf'), session.csrfToken)) {
    throw new HttpError(403, 'رمز الحماية غير صالح. أعد تحميل الصفحة.');
  }
  if (owner && session.user.role !== 'owner' && session.user.role !== 'admin') {
    throw new HttpError(403, 'هذه الصلاحية لمالك المنصة فقط.');
  }
  return session;
}

export async function sendOtp(env, request, body) {
  const email = normalizeEmail(body.email);
  if (!email) throw new HttpError(400, 'يرجى إدخال بريد إلكتروني صحيح.');
  authSecret(env);

  if (!(await underRateLimit(env, 'otp_ip:' + clientIp(request), IP_SEND_LIMIT, 60 * 60 * 1000))) {
    throw new HttpError(429, 'طلبات كثيرة من نفس الجهاز. حاول بعد ساعة.');
  }

  const now = nowMs();
  const rec = (await env.DB.prepare('SELECT * FROM otp_codes WHERE email = ?').bind(email).first()) || {
    attempts: 0, locked_until: 0, send_count: 0, window_start: 0
  };
  if (rec.locked_until > now) {
    const wait = Math.ceil((rec.locked_until - now) / 1000);
    throw new HttpError(429, 'تم تجاوز الحد المسموح. انتظر ' + wait + ' ثانية ثم حاول مجدداً.');
  }
  let sendCount = rec.send_count;
  let windowStart = rec.window_start;
  if (now - windowStart >= OTP_SEND_WINDOW_MS) {
    sendCount = 0;
    windowStart = now;
  }
  if (sendCount >= OTP_MAX_SENDS) {
    await env.DB.prepare('UPDATE otp_codes SET locked_until = ? WHERE email = ?').bind(now + OTP_LOCK_MS, email).run();
    throw new HttpError(429, 'وصلت للحد الأقصى (٥ رموز خلال ١٥ دقيقة). حاول لاحقاً.');
  }

  const code = sixDigitCode();
  try {
    await sendLoginCode(env, email, code);
  } catch (e) {
    console.error('sendLoginCode failed:', e && e.message);
    throw new HttpError(503, 'تعذر إرسال رمز التحقق الآن. حاول بعد قليل.');
  }

  await env.DB.prepare(
    `INSERT INTO otp_codes (email, code_hash, expires_at, attempts, locked_until, send_count, window_start)
     VALUES (?, ?, ?, 0, 0, ?, ?)
     ON CONFLICT(email) DO UPDATE SET code_hash = excluded.code_hash, expires_at = excluded.expires_at,
       attempts = 0, locked_until = 0, send_count = excluded.send_count, window_start = excluded.window_start`
  ).bind(email, await codeHash(env, email, code), now + OTP_TTL_MS, sendCount + 1, windowStart).run();

  return { ok: true, status: 200, message: 'تم إرسال رمز التحقق المكون من ٦ أرقام إلى ' + email + ' (صالح لمدة ٥ دقائق).' };
}

// Returns { result, cookie } on success.
export async function verifyOtp(env, request, body) {
  const email = normalizeEmail(body.email);
  const code = String(body.code || '').trim();
  const displayName = cleanText(body.displayName, 40);
  if (!email || !/^\d{6}$/.test(code)) throw new HttpError(400, 'يرجى إدخال البريد الإلكتروني ورمز التحقق المكون من ٦ أرقام.');

  const now = nowMs();
  const rec = await env.DB.prepare('SELECT * FROM otp_codes WHERE email = ?').bind(email).first();
  if (rec && rec.locked_until > now) {
    const wait = Math.ceil((rec.locked_until - now) / 1000);
    throw new HttpError(429, 'التحقق مقفل مؤقتاً بسبب تكرار المحاولات الخاطئة. انتظر ' + wait + ' ثانية.');
  }
  if (!rec || !rec.code_hash) throw new HttpError(400, 'يرجى طلب رمز التحقق أولاً.');
  if (rec.expires_at < now) {
    await env.DB.prepare('UPDATE otp_codes SET code_hash = NULL WHERE email = ?').bind(email).run();
    throw new HttpError(401, 'انتهت صلاحية رمز التحقق. اطلب رمزاً جديداً.');
  }
  if (!constantTimeEqual(await codeHash(env, email, code), rec.code_hash)) {
    const attempts = rec.attempts + 1;
    if (attempts >= OTP_MAX_ATTEMPTS) {
      await env.DB.prepare('UPDATE otp_codes SET attempts = ?, code_hash = NULL, locked_until = ? WHERE email = ?')
        .bind(attempts, now + OTP_LOCK_MS, email).run();
      throw new HttpError(429, 'استنفدت المحاولات الخمس. تم قفل التحقق لمدة ١٥ دقيقة.');
    }
    await env.DB.prepare('UPDATE otp_codes SET attempts = ? WHERE email = ?').bind(attempts, email).run();
    throw new HttpError(401, 'رمز التحقق غير صحيح! المحاولات المتبقية: ' + (OTP_MAX_ATTEMPTS - attempts));
  }

  // Code is valid: consume it.
  await env.DB.prepare('UPDATE otp_codes SET code_hash = NULL, attempts = 0 WHERE email = ?').bind(email).run();

  const isOwnerEmail = ownerEmails(env).includes(email);
  let user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
  const iso = nowIso();
  if (!user) {
    user = {
      id: randomId('usr'),
      email,
      display_name: displayName || email.split('@')[0],
      status: 'active',
      role: isOwnerEmail ? 'owner' : null,
      created_at: iso
    };
    await env.DB.batch([
      env.DB.prepare('INSERT INTO users (id, email, display_name, status, role, created_at) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(user.id, user.email, user.display_name, user.status, user.role, user.created_at),
      env.DB.prepare('INSERT INTO wallets (user_id) VALUES (?)').bind(user.id),
      env.DB.prepare(
        "INSERT INTO wallet_transactions (id, user_id, type, amount, balance_before, balance_after, description, created_at) VALUES (?, ?, 'bonus', 0, 0, 0, ?, ?)"
      ).bind(randomId('wtx'), user.id, '🎁 باقة الترحيب: تجربة مجانية واحدة في كل لعبة', iso)
    ]);
  } else {
    if (user.status !== 'active') throw new HttpError(403, 'هذا الحساب موقوف حالياً من إدارة المنصة.');
    // Owner comes only from the Worker settings; admin is granted by an owner and kept in the database.
    const role = isOwnerEmail ? 'owner' : (user.role === 'admin' ? 'admin' : null);
    const name = displayName || user.display_name;
    if (role !== user.role || name !== user.display_name) {
      await env.DB.prepare('UPDATE users SET role = ?, display_name = ? WHERE id = ?').bind(role, name, user.id).run();
      user.role = role;
      user.display_name = name;
    }
  }

  const token = randomToken(32);
  const csrfToken = randomToken(24);
  await env.DB.batch([
    env.DB.prepare('INSERT INTO sessions (token_hash, user_id, csrf_token, created_at, expires_at) VALUES (?, ?, ?, ?, ?)')
      .bind(await sha256Hex(token), user.id, csrfToken, now, now + SESSION_TTL_MS),
    env.DB.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(now),
    env.DB.prepare('DELETE FROM play_tokens WHERE expires_at < ?').bind(now)
  ]);

  return { user, csrfToken, cookie: sessionCookie(token, request) };
}

export async function logout(env, request) {
  const session = await currentSession(env, request);
  if (session) await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(session.tokenHash).run();
}
