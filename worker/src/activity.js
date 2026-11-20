// Owner analytics: time on site per account (from a heartbeat the page sends while it is visible),
// plus purchases and plays read from the payments and wallet tables.
import { HttpError } from './util.js';

const BEAT_MS = 60 * 1000;          // the page pings once a minute while visible
const MAX_GAP_MS = 2 * BEAT_MS + 15000; // a longer gap means the visitor left: count nothing for it
const NEW_VISIT_MS = 30 * 60 * 1000; // 30 minutes away starts a new visit
const RIYADH_MS = 3 * 60 * 60 * 1000;

const dayOf = (ms) => new Date(ms + RIYADH_MS).toISOString().slice(0, 10);

function platformOf(ua) {
  ua = String(ua || '');
  if (/iPhone|iPod/.test(ua)) return 'iPhone';
  if (/iPad/.test(ua) || (/Macintosh/.test(ua) && /Mobile/.test(ua))) return 'iPad';
  if (/Android/.test(ua)) return 'Android';
  if (/Windows/.test(ua)) return 'Windows';
  if (/Macintosh/.test(ua)) return 'Mac';
  if (/SmartTV|Tizen|Web0S|BRAVIA|AFT/.test(ua)) return 'TV';
  return 'other';
}

export async function recordPing(env, session, request) {
  const uid = session.user.id;
  const now = Date.now();
  const row = await env.DB.prepare('SELECT last_seen FROM user_activity WHERE user_id = ?').bind(uid).first();
  const platform = platformOf(request.headers.get('user-agent'));
  if (!row) {
    await env.DB.prepare('INSERT INTO user_activity (user_id, first_seen, last_seen, total_seconds, visits, platform) VALUES (?, ?, ?, 0, 1, ?) ON CONFLICT(user_id) DO NOTHING')
      .bind(uid, now, now, platform).run();
    return { ok: true };
  }
  const gap = now - row.last_seen;
  if (gap < 20000) return { ok: true }; // extra tabs or quick reloads add nothing
  const secs = gap <= MAX_GAP_MS ? Math.round(Math.min(gap, BEAT_MS + 15000) / 1000) : 0;
  const newVisit = gap > NEW_VISIT_MS ? 1 : 0;
  const stmts = [
    env.DB.prepare('UPDATE user_activity SET last_seen = ?, total_seconds = total_seconds + ?, visits = visits + ?, platform = ? WHERE user_id = ?')
      .bind(now, secs, newVisit, platform, uid)
  ];
  if (secs) {
    stmts.push(env.DB.prepare('INSERT INTO user_activity_days (user_id, day, seconds) VALUES (?, ?, ?) ON CONFLICT(user_id, day) DO UPDATE SET seconds = seconds + excluded.seconds')
      .bind(uid, dayOf(now), secs));
  }
  await env.DB.batch(stmts);
  return { ok: true };
}

const PLAY_TYPES = "('free_play','free_trial','consume')";
const gameOf = (desc) => String(desc || '').replace(/^.*?:\s*/, '').trim() || '—';

export async function analyticsOverview(env) {
  const now = Date.now();
  const today = dayOf(now);
  const since = (d) => dayOf(now - d * 86400000);
  const [users, days, plays, top] = await env.DB.batch([
    env.DB.prepare(
      `SELECT u.id, u.email, u.display_name, u.status, substr(u.created_at, 1, 10) AS created_at,
              COALESCE(w.balance, 0) AS balance,
              a.total_seconds, a.visits, a.last_seen, a.first_seen, a.platform,
              (SELECT COUNT(*) FROM user_activity_days d WHERE d.user_id = u.id) AS days_active,
              (SELECT COUNT(*) FROM payments p WHERE p.user_id = u.id AND p.status = 'paid') AS paid_count,
              (SELECT COALESCE(SUM(p.amount_halalas), 0) FROM payments p WHERE p.user_id = u.id AND p.status = 'paid') AS paid_halalas,
              (SELECT COUNT(*) FROM wallet_transactions t WHERE t.user_id = u.id AND t.type = 'free_play') AS free_plays,
              (SELECT COUNT(*) FROM wallet_transactions t WHERE t.user_id = u.id AND t.type = 'free_trial') AS trials,
              (SELECT COUNT(*) FROM wallet_transactions t WHERE t.user_id = u.id AND t.type = 'consume') AS paid_plays,
              (SELECT 1 FROM app_installs i WHERE i.user_id = u.id) AS installed
       FROM users u LEFT JOIN wallets w ON w.user_id = u.id LEFT JOIN user_activity a ON a.user_id = u.id
       ORDER BY COALESCE(a.last_seen, 0) DESC, u.created_at DESC LIMIT 1000`
    ),
    env.DB.prepare('SELECT day, COUNT(*) AS users, SUM(seconds) AS seconds FROM user_activity_days WHERE day >= ? GROUP BY day ORDER BY day').bind(since(13)),
    env.DB.prepare(`SELECT type, COUNT(*) AS n FROM wallet_transactions WHERE type IN ${PLAY_TYPES} GROUP BY type`),
    env.DB.prepare(`SELECT description, type, COUNT(*) AS n FROM wallet_transactions WHERE type IN ${PLAY_TYPES} GROUP BY description, type`)
  ]);
  const list = users.results || [];
  const activeSince = (d) => list.filter((u) => u.last_seen && dayOf(u.last_seen) >= since(d)).length;
  const games = {};
  for (const r of top.results || []) {
    const g = gameOf(r.description);
    games[g] = games[g] || { game: g, plays: 0, free: 0, paid: 0 };
    games[g].plays += r.n;
    if (r.type === 'consume') games[g].paid += r.n; else games[g].free += r.n;
  }
  const byType = Object.fromEntries((plays.results || []).map((r) => [r.type, r.n]));
  const tracked = list.filter((u) => u.total_seconds > 0);
  return {
    ok: true,
    today,
    summary: {
      users: list.length,
      active_today: activeSince(0),
      active_7: activeSince(6),
      active_30: activeSince(29),
      buyers: list.filter((u) => u.paid_count > 0).length,
      revenue_halalas: list.reduce((a, u) => a + (u.paid_halalas || 0), 0),
      total_seconds: tracked.reduce((a, u) => a + u.total_seconds, 0),
      avg_seconds: tracked.length ? Math.round(tracked.reduce((a, u) => a + u.total_seconds, 0) / tracked.length) : 0,
      free_plays: (byType.free_play || 0) + (byType.free_trial || 0),
      paid_plays: byType.consume || 0
    },
    days: days.results || [],
    top_games: Object.values(games).sort((a, b) => b.plays - a.plays).slice(0, 10),
    users: list
  };
}

export async function analyticsUser(env, userId) {
  const user = await env.DB.prepare('SELECT id, email, display_name, created_at FROM users WHERE id = ?').bind(userId).first();
  if (!user) throw new HttpError(404, 'الحساب غير موجود.');
  const [days, tx, pays] = await env.DB.batch([
    env.DB.prepare('SELECT day, seconds FROM user_activity_days WHERE user_id = ? ORDER BY day DESC LIMIT 30').bind(userId),
    env.DB.prepare('SELECT type, amount, description, created_at FROM wallet_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 200').bind(userId),
    env.DB.prepare('SELECT id, package_name, credits, amount_halalas, status, promo_code, created_at FROM payments WHERE user_id = ? ORDER BY created_at DESC LIMIT 100').bind(userId)
  ]);
  return { ok: true, user, days: days.results || [], transactions: tx.results || [], payments: pays.results || [] };
}
