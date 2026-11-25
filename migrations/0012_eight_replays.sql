-- «العب قيمك مرة ثانية ببلاش»: every Eight board a player started is kept (last 30 per account),
-- and can be opened again from the store with the same categories and questions, free.
CREATE TABLE IF NOT EXISTS eight_boards (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
  launch_hash TEXT NOT NULL,
  board_json  TEXT NOT NULL,
  replays     INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS eight_boards_by_user ON eight_boards (user_id, created_at);
-- A token opened from a saved board: the game rebuilds that board instead of picking new questions.
ALTER TABLE play_tokens ADD COLUMN replay_board TEXT NOT NULL DEFAULT '';
