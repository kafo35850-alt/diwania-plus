-- «العب واكسب»: the person whose category was accepted earns a set amount every time a game plays it.
-- One row per (category, game session): a session is a play token, so replaying inside one session counts once.
CREATE TABLE IF NOT EXISTS creator_plays (
  category      TEXT NOT NULL,
  token_hash    TEXT NOT NULL,
  creator_id    TEXT NOT NULL,
  player_id     TEXT NOT NULL,
  amount_halalas INTEGER NOT NULL,
  created_at    TEXT NOT NULL,
  PRIMARY KEY (category, token_hash)
);
CREATE INDEX IF NOT EXISTS creator_plays_by_creator ON creator_plays (creator_id, created_at);

-- Withdrawal requests; the owner pays by bank transfer and marks them paid.
CREATE TABLE IF NOT EXISTS creator_payouts (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL,
  user_email    TEXT NOT NULL,
  amount_halalas INTEGER NOT NULL,
  iban          TEXT NOT NULL,
  holder        TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending',  -- pending | paid | rejected
  note          TEXT NOT NULL DEFAULT '',
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS creator_payouts_by_user ON creator_payouts (user_id, created_at);
