-- Diwaniya+ core schema (Cloudflare D1 / SQLite)

CREATE TABLE users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  display_name  TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'active',   -- active | suspended
  role          TEXT,                              -- 'owner' or NULL
  created_at    TEXT NOT NULL
);

-- Session tokens are stored hashed; the raw token only lives in the HttpOnly cookie.
CREATE TABLE sessions (
  token_hash  TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id),
  csrf_token  TEXT NOT NULL,
  created_at  INTEGER NOT NULL,
  expires_at  INTEGER NOT NULL
);
CREATE INDEX idx_sessions_user ON sessions(user_id);

-- One pending code per email; the code itself is stored hashed.
CREATE TABLE otp_codes (
  email         TEXT PRIMARY KEY,
  code_hash     TEXT,
  expires_at    INTEGER NOT NULL DEFAULT 0,
  attempts      INTEGER NOT NULL DEFAULT 0,
  locked_until  INTEGER NOT NULL DEFAULT 0,
  send_count    INTEGER NOT NULL DEFAULT 0,
  window_start  INTEGER NOT NULL DEFAULT 0
);

-- Generic fixed-window rate limiter (e.g. OTP sends per IP).
CREATE TABLE rate_limits (
  key           TEXT PRIMARY KEY,
  count         INTEGER NOT NULL,
  window_start  INTEGER NOT NULL
);

CREATE TABLE wallets (
  user_id          TEXT PRIMARY KEY REFERENCES users(id),
  balance          INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  total_purchased  INTEGER NOT NULL DEFAULT 0,
  total_consumed   INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE wallet_transactions (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id),
  type            TEXT NOT NULL,
  amount          INTEGER NOT NULL,
  balance_before  INTEGER NOT NULL,
  balance_after   INTEGER NOT NULL,
  description     TEXT NOT NULL,
  created_at      TEXT NOT NULL
);
CREATE INDEX idx_wtx_user ON wallet_transactions(user_id, created_at);

-- One free play per account per game.
CREATE TABLE game_trials (
  user_id    TEXT NOT NULL,
  game_slug  TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (user_id, game_slug)
);

-- Idempotent launches: the same (user, key) never charges twice.
CREATE TABLE launches (
  user_id      TEXT NOT NULL,
  idem_key     TEXT NOT NULL,
  game_slug    TEXT NOT NULL,
  result_json  TEXT,
  created_at   INTEGER NOT NULL,
  PRIMARY KEY (user_id, idem_key)
);

-- Short-lived tokens that unlock /play/<slug> for the user who paid.
CREATE TABLE play_tokens (
  token_hash  TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
  game_slug   TEXT NOT NULL,
  expires_at  INTEGER NOT NULL
);

CREATE TABLE game_stats (
  game_slug  TEXT PRIMARY KEY,
  plays      INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE payments (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL,
  user_email      TEXT NOT NULL,
  package_id      TEXT NOT NULL,
  package_name    TEXT NOT NULL,
  credits         INTEGER NOT NULL,
  amount_halalas  INTEGER NOT NULL,
  currency        TEXT NOT NULL,
  status          TEXT NOT NULL,
  gateway_note    TEXT,
  created_at      TEXT NOT NULL
);
CREATE INDEX idx_payments_user ON payments(user_id);

CREATE TABLE admin_logs (
  id           TEXT PRIMARY KEY,
  action       TEXT NOT NULL,
  target_type  TEXT,
  target_id    TEXT,
  reason       TEXT,
  admin_email  TEXT,
  created_at   TEXT NOT NULL
);

-- Admin-editable catalog documents (games, packages, categories, content, suggestions).
-- Missing keys fall back to the defaults bundled with the Worker (worker/src/seed.json).
CREATE TABLE docs (
  key         TEXT PRIMARY KEY,
  json        TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);
