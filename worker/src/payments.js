// Credit packages paid through Moyasar (https://moyasar.com) hosted invoices.
//
// Flow:
//   1. POST /api/payments/orders  -> we create a "pending" order and a Moyasar invoice
//                                    (amount comes from the server's package list, never the browser)
//   2. The browser goes to the invoice page on Moyasar; card details never touch our site.
//   3. Moyasar sends the customer back to /payments/return and/or calls /api/payments/webhook.
//   4. Either way we ask Moyasar's API for the invoice and only credit the wallet when Moyasar
//      itself says it is paid with the exact amount and currency of the order.
//      Crediting is a single D1 transaction guarded by status = 'pending', so it happens once.
import { HttpError, nowMs, nowIso, randomId, constantTimeEqual, underRateLimit, clientIp } from './util.js';
import { getDoc } from './catalog.js';
import { walletSnapshot } from './wallet.js';

const DEFAULT_API = 'https://api.moyasar.com/v1';
const PENDING_RECHECK_MS = 2 * 24 * 60 * 60 * 1000; // re-verify pending orders up to 2 days old

export function gatewayConfigured(env) {
  return !!env.MOYASAR_SECRET_KEY;
}

function apiBase(env) {
  return (env.MOYASAR_API_BASE || DEFAULT_API).replace(/\/+$/, '');
}

async function moyasar(env, method, path, body) {
  const res = await fetch(apiBase(env) + path, {
    method,
    headers: {
      authorization: 'Basic ' + btoa(env.MOYASAR_SECRET_KEY + ':'),
      'content-type': 'application/json',
      accept: 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data && (data.message || data.type)) || ('HTTP ' + res.status);
    const err = new Error('Moyasar ' + method + ' ' + path + ' failed: ' + msg);
    err.status = res.status;
    throw err;
  }
  return data;
}

// Invoice is paid when Moyasar marks it paid, or it carries a paid payment for the full amount.
function paidPayment(invoice, order) {
  const sameMoney = (obj) =>
    Number(obj.amount) === Number(order.amount_halalas) &&
    String(obj.currency || '').toUpperCase() === String(order.currency).toUpperCase();
  if (!invoice || !sameMoney(invoice)) return null;
  const payments = Array.isArray(invoice.payments) ? invoice.payments : [];
  const paid = payments.find((p) => p && p.status === 'paid' && sameMoney(p));
  if (paid) return { paymentId: paid.id || null };
  if (invoice.status === 'paid') return { paymentId: null };
  return null;
}

const FINAL_FAILURE = { failed: 'failed', expired: 'expired', canceled: 'canceled', voided: 'canceled' };

// Marks the order paid and credits the wallet exactly once (all-or-nothing batch).
async function creditOrder(env, order, paymentId) {
  const iso = nowIso();
  const pendingGuard = "EXISTS (SELECT 1 FROM payments WHERE id = ?1 AND status = 'pending')";
  const results = await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO wallet_transactions (id, user_id, type, amount, balance_before, balance_after, description, created_at)
       SELECT ?2, w.user_id, 'purchase', ?3, w.balance, w.balance + ?3, ?4, ?5
       FROM wallets w WHERE w.user_id = ?6 AND ${pendingGuard}`
    ).bind(order.id, randomId('wtx'), order.credits, 'شراء باقة: ' + order.package_name + ' (' + order.id + ')', iso, order.user_id),
    env.DB.prepare(
      `UPDATE wallets SET balance = balance + ?2, total_purchased = total_purchased + ?2
       WHERE user_id = ?3 AND ${pendingGuard}`
    ).bind(order.id, order.credits, order.user_id),
    env.DB.prepare(
      `UPDATE payments SET status = 'paid', paid_at = ?2, updated_at = ?2, gateway_payment_id = COALESCE(?3, gateway_payment_id),
         gateway_note = 'تم الدفع وإضافة الأقيام'
       WHERE id = ?1 AND status = 'pending'`
    ).bind(order.id, iso, paymentId)
  ]);
  return results[2].meta.changes === 1;
}

// Asks Moyasar about the order's invoice and settles it. Safe to call any number of times.
export async function verifyOrder(env, orderId) {
  const order = await env.DB.prepare('SELECT * FROM payments WHERE id = ?').bind(orderId).first();
  if (!order) return { ok: false, status: 404, error: 'طلب الدفع غير موجود.' };
  if (order.status !== 'pending' || !order.gateway_invoice_id || !gatewayConfigured(env)) {
    return { ok: true, order, changed: false };
  }
  const invoice = await moyasar(env, 'GET', '/invoices/' + encodeURIComponent(order.gateway_invoice_id));
  const paid = paidPayment(invoice, order);
  let changed = false;
  if (paid) {
    changed = await creditOrder(env, order, paid.paymentId);
  } else if (FINAL_FAILURE[invoice.status]) {
    const res = await env.DB.prepare(
      "UPDATE payments SET status = ?, updated_at = ?, gateway_note = ? WHERE id = ? AND status = 'pending'"
    ).bind(FINAL_FAILURE[invoice.status], nowIso(), 'حالة الفاتورة في البوابة: ' + invoice.status, order.id).run();
    changed = res.meta.changes === 1;
  }
  const fresh = await env.DB.prepare('SELECT * FROM payments WHERE id = ?').bind(orderId).first();
  return { ok: true, order: fresh, changed };
}

export async function createCheckout(env, request, session, body) {
  if (!gatewayConfigured(env)) throw new HttpError(503, 'الدفع الإلكتروني غير متاح حالياً. تواصل مع إدارة المنصة.');
  if (!(await underRateLimit(env, 'pay_user:' + session.user.id, 10, 60 * 60 * 1000))) {
    throw new HttpError(429, 'طلبات شراء كثيرة. حاول بعد قليل.');
  }
  const packages = await getDoc(env, 'packages');
  const pkg = packages.find((p) => p.id === body.pkgId && p.is_active);
  if (!pkg) throw new HttpError(404, 'الباقة المختارة غير متاحة.');
  const amount = Number(pkg.price_halalas);
  if (!Number.isInteger(amount) || amount < 100) throw new HttpError(400, 'سعر الباقة غير صالح.');

  const origin = new URL(request.url).origin;
  const iso = nowIso();
  const order = {
    id: randomId('pay'),
    user_id: session.user.id,
    user_email: session.user.email,
    package_id: pkg.id,
    package_name: pkg.name,
    credits: pkg.credits,
    amount_halalas: amount,
    currency: pkg.currency || 'SAR'
  };
  await env.DB.prepare(
    `INSERT INTO payments (id, user_id, user_email, package_id, package_name, credits, amount_halalas, currency, status,
       gateway, gateway_note, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'moyasar', 'بانتظار إتمام الدفع', ?, ?)`
  ).bind(order.id, order.user_id, order.user_email, order.package_id, order.package_name, order.credits,
    order.amount_halalas, order.currency, iso, iso).run();

  const returnUrl = origin + '/payments/return?order=' + encodeURIComponent(order.id);
  let invoice;
  try {
    invoice = await moyasar(env, 'POST', '/invoices', {
      amount: order.amount_halalas,
      currency: order.currency,
      description: 'ديوانية بلس — ' + pkg.name + ' (' + pkg.credits + ' أقيام)',
      success_url: returnUrl,
      back_url: returnUrl,
      callback_url: origin + '/api/payments/webhook',
      metadata: { order_id: order.id, user_id: order.user_id }
    });
  } catch (e) {
    console.error('create invoice failed:', e.message);
    await env.DB.prepare("UPDATE payments SET status = 'failed', gateway_note = ?, updated_at = ? WHERE id = ?")
      .bind('تعذر إنشاء الفاتورة في بوابة الدفع', nowIso(), order.id).run();
    throw new HttpError(502, 'تعذر الاتصال ببوابة الدفع. حاول بعد قليل.');
  }
  if (!invoice || !invoice.id || !invoice.url) throw new HttpError(502, 'رد غير متوقع من بوابة الدفع.');

  await env.DB.prepare('UPDATE payments SET gateway_invoice_id = ?, checkout_url = ?, updated_at = ? WHERE id = ?')
    .bind(String(invoice.id), String(invoice.url), nowIso(), order.id).run();

  return {
    ok: true,
    status: 201,
    gatewayConnected: true,
    order: { ...order, status: 'pending' },
    checkoutUrl: invoice.url,
    message: 'جاري تحويلك لصفحة الدفع الآمنة…'
  };
}

// GET /payments/return?order=… — Moyasar sends the customer here after paying (or pressing back).
export async function handleReturn(env, request) {
  const orderId = new URL(request.url).searchParams.get('order') || '';
  let status = 'unknown';
  const allowed = await underRateLimit(env, 'pay_return_ip:' + clientIp(request), 30, 60 * 1000);
  if (allowed && /^pay_[A-Za-z0-9_-]{4,80}$/.test(orderId)) {
    try {
      const r = await verifyOrder(env, orderId);
      if (r.ok && r.order) status = r.order.status;
    } catch (e) {
      console.error('verify on return failed:', e.message);
    }
  }
  const target = '/?tab=wallet&payment=' + encodeURIComponent(status) + '&order=' + encodeURIComponent(orderId);
  return new Response(null, { status: 303, headers: { location: target, 'cache-control': 'no-store' } });
}

// POST /api/payments/webhook — called by Moyasar. We never trust the body for money:
// it only tells us which order to re-check against Moyasar's API.
export async function handleWebhook(env, request) {
  let body = {};
  try { body = await request.json(); } catch (e) { /* ignore */ }

  if (env.MOYASAR_WEBHOOK_SECRET) {
    if (!constantTimeEqual(body.secret_token, env.MOYASAR_WEBHOOK_SECRET)) return new Response('forbidden', { status: 403 });
  } else if (!(await underRateLimit(env, 'webhook_ip:' + clientIp(request), 120, 60 * 1000))) {
    return new Response('slow down', { status: 429 });
  }

  const data = (body && (body.data || body)) || {};
  const meta = data.metadata || {};
  let order = null;
  if (typeof meta.order_id === 'string') {
    order = await env.DB.prepare('SELECT id FROM payments WHERE id = ?').bind(meta.order_id).first();
  }
  const invoiceId = data.invoice_id || (String(data.id || '').length ? data.id : null);
  if (!order && invoiceId) {
    order = await env.DB.prepare('SELECT id FROM payments WHERE gateway_invoice_id = ?').bind(String(invoiceId)).first();
  }
  if (order) {
    try {
      await verifyOrder(env, order.id);
    } catch (e) {
      console.error('verify on webhook failed:', e.message);
      return new Response('retry', { status: 500 }); // let Moyasar retry later
    }
  }
  return new Response('ok', { status: 200 });
}

// Re-checks the user's recent pending orders (covers a lost webhook or a closed browser tab).
export async function reconcileUserPending(env, userId) {
  if (!gatewayConfigured(env)) return;
  const since = new Date(nowMs() - PENDING_RECHECK_MS).toISOString();
  const rows = await env.DB.prepare(
    "SELECT id FROM payments WHERE user_id = ? AND status = 'pending' AND gateway_invoice_id IS NOT NULL AND created_at > ? ORDER BY created_at DESC LIMIT 5"
  ).bind(userId, since).all();
  for (const r of rows.results || []) {
    try { await verifyOrder(env, r.id); } catch (e) { console.error('reconcile failed:', e.message); }
  }
}

export async function paymentStatusForUser(env, session, orderId) {
  const order = await env.DB.prepare('SELECT * FROM payments WHERE id = ? AND user_id = ?').bind(orderId, session.user.id).first();
  if (!order) throw new HttpError(404, 'طلب الدفع غير موجود.');
  const r = order.status === 'pending' ? await verifyOrder(env, order.id) : { order };
  return { ok: true, order: r.order, wallet: await walletSnapshot(env, session.user.id) };
}
