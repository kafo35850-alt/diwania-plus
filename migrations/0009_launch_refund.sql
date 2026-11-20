-- Credits come back if a paid game is closed before it really starts.
ALTER TABLE launches ADD COLUMN started INTEGER NOT NULL DEFAULT 0;
ALTER TABLE launches ADD COLUMN refunded INTEGER NOT NULL DEFAULT 0;
