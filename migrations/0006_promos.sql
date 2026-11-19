-- Accounts that opened the site as an installed app (home-screen icon) at least once.
CREATE TABLE IF NOT EXISTS app_installs (
  user_id     TEXT PRIMARY KEY,
  granted_at  TEXT NOT NULL,
  platform    TEXT
);
-- One use of a discount code per account. A code is "reserved" by an unpaid order and becomes "used" once it is paid.
CREATE TABLE IF NOT EXISTS promo_redemptions (
  user_id     TEXT NOT NULL,
  code        TEXT NOT NULL,
  order_id    TEXT,
  status      TEXT NOT NULL DEFAULT 'reserved',
  created_at  TEXT NOT NULL,
  PRIMARY KEY (user_id, code)
);
CREATE INDEX IF NOT EXISTS idx_promo_order ON promo_redemptions (order_id);
ALTER TABLE payments ADD COLUMN promo_code TEXT;
ALTER TABLE payments ADD COLUMN discount_halalas INTEGER NOT NULL DEFAULT 0;
