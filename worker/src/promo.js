// Discount codes. Today there is one: the reward for installing the app (opening the site from the home-screen icon).
// The amount and on/off switch live in the 'promos' document, editable from the admin panel.
// All checks and the price itself are worked out here on the server.
import { HttpError, nowIso, cleanText } from './util.js';
import { getDoc } from './catalog.js';

export const APP_CODE = 'APP2';
const MIN_CHARGE = 100; // the gateway needs at least 1 SAR

export async function promoConfig(env) {
  const doc = (await getDoc(env, 'promos')) || {};
  return { [APP_CODE]: { amount_halalas: 200, active: 1, requires_app: 1, ...(doc[APP_CODE] || {}) } };
}

function normCode(raw) { return String(raw || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20); }

// Called from the installed app (display-mode standalone). The browser reports it; the reward is small and once per account.
export async function grantAppInstall(env, session, body) {
  const platform = cleanText(body && body.platform, 20);
  await env.DB.prepare('INSERT INTO app_installs (user_id, granted_at, platform) VALUES (?, ?, ?) ON CONFLICT(user_id) DO NOTHING')
    .bind(session.user.id, nowIso(), platform).run();
  return myPromo(env, session);
}

export async function myPromo(env, session) {
  const cfg = (await promoConfig(env))[APP_CODE];
  const [inst, red] = await Promise.all([
    env.DB.prepare('SELECT granted_at FROM app_installs WHERE user_id = ?').bind(session.user.id).first(),
    env.DB.prepare('SELECT status FROM promo_redemptions WHERE user_id = ? AND code = ?').bind(session.user.id, APP_CODE).first()
  ]);
  return {
    ok: true,
    code: APP_CODE,
    amount_halalas: cfg.amount_halalas,
    active: !!cfg.active,
    installed: !!inst,
    used: !!(red && red.status === 'used')
  };
}

// Works out the discount for one order. Throws a readable error when the code can't be used.
export async function promoDiscount(env, session, rawCode, price) {
  const code = normCode(rawCode);
  if (!code) return null;
  const cfg = (await promoConfig(env))[code];
  if (!cfg || !cfg.active) throw new HttpError(400, 'كود الخصم غير صحيح أو موقوف.');
  if (cfg.requires_app) {
    const inst = await env.DB.prepare('SELECT 1 AS x FROM app_installs WHERE user_id = ?').bind(session.user.id).first();
    if (!inst) throw new HttpError(403, 'هذا الكود لمستخدمي التطبيق: ثبّت ديوانية بلس على جهازك وافتحه من أيقونته أول.');
  }
  const red = await env.DB.prepare('SELECT status FROM promo_redemptions WHERE user_id = ? AND code = ?').bind(session.user.id, code).first();
  if (red && red.status === 'used') throw new HttpError(409, 'استخدمت هذا الكود من قبل. الكود لمرة وحدة لكل حساب.');
  const discount = Math.max(0, Math.min(Number(cfg.amount_halalas) || 0, price - MIN_CHARGE));
  if (!discount) throw new HttpError(400, 'الكود ما ينطبق على هذي الباقة.');
  return { code, discount };
}

// Ties the code to this order. A newer unpaid order takes it over; a paid one never gives it back.
export async function reservePromo(env, userId, code, orderId) {
  const res = await env.DB.prepare(
    `INSERT INTO promo_redemptions (user_id, code, order_id, status, created_at) VALUES (?, ?, ?, 'reserved', ?)
     ON CONFLICT(user_id, code) DO UPDATE SET order_id = excluded.order_id, created_at = excluded.created_at
     WHERE promo_redemptions.status != 'used'`
  ).bind(userId, code, orderId, nowIso()).run();
  if (!res.meta.changes) throw new HttpError(409, 'استخدمت هذا الكود من قبل. الكود لمرة وحدة لكل حساب.');
}

// Public check used by the packages page before paying.
export async function checkPromo(env, session, body) {
  const packages = await getDoc(env, 'packages');
  const pkg = packages.find((p) => p.id === body.pkgId && p.is_active) || packages.filter((p) => p.is_active).sort((a, b) => a.price_halalas - b.price_halalas)[0];
  const r = await promoDiscount(env, session, body.code, Number(pkg ? pkg.price_halalas : 0));
  if (!r) throw new HttpError(400, 'اكتب كود الخصم.');
  return { ok: true, code: r.code, amount_halalas: r.discount, message: '✅ تم تطبيق الكود: خصم ' + (r.discount / 100) + ' ريال على الباقة.' };
}
