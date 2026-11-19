-- Audio and video are larger than one D1 row allows, so they are stored in pieces.
ALTER TABLE media ADD COLUMN chunks INTEGER NOT NULL DEFAULT 0;
ALTER TABLE media ADD COLUMN kind TEXT NOT NULL DEFAULT 'image';
CREATE TABLE IF NOT EXISTS media_chunks (
  media_id  TEXT NOT NULL,
  idx       INTEGER NOT NULL,
  data      BLOB NOT NULL,
  PRIMARY KEY (media_id, idx)
);
