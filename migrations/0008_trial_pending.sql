-- A free trial is "pending" from launch until the game really starts (a start button is pressed,
-- or the game stays open a few minutes). Closing the game before that keeps the trial available.
ALTER TABLE game_trials ADD COLUMN state TEXT NOT NULL DEFAULT 'used';
ALTER TABLE game_trials ADD COLUMN tries INTEGER NOT NULL DEFAULT 1;
