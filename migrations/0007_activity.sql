-- Owner analytics: how long each signed-in account spends on the site.
CREATE TABLE IF NOT EXISTS user_activity (
  user_id        TEXT PRIMARY KEY,
  first_seen     INTEGER NOT NULL,
  last_seen      INTEGER NOT NULL,
  total_seconds  INTEGER NOT NULL DEFAULT 0,
  visits         INTEGER NOT NULL DEFAULT 1,
  platform       TEXT
);
CREATE TABLE IF NOT EXISTS user_activity_days (
  user_id  TEXT NOT NULL,
  day      TEXT NOT NULL,
  seconds  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day)
);
CREATE INDEX IF NOT EXISTS idx_activity_day ON user_activity_days (day);
