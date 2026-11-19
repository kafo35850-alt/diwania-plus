-- Images attached to questions (Eight categories and category suggestions).
-- Kept small (compressed in the browser before upload) so they fit comfortably in D1.
CREATE TABLE IF NOT EXISTS media (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
  mime        TEXT NOT NULL,
  size        INTEGER NOT NULL,
  data        BLOB NOT NULL,
  created_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_media_user ON media (user_id, created_at);
