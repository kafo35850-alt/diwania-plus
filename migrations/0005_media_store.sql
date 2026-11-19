-- Where a file lives: 'd1' (inside the database) or 'r2' (Cloudflare R2 storage, for big files).
ALTER TABLE media ADD COLUMN store TEXT NOT NULL DEFAULT 'd1';
