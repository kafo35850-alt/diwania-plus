-- «العب واكسب» pays only from real money: each play token remembers which launch it belongs to and how many
-- paid credits that launch cost (0 for a free trial or an always-free game).
ALTER TABLE play_tokens ADD COLUMN launch_key TEXT NOT NULL DEFAULT '';
ALTER TABLE play_tokens ADD COLUMN paid_credits INTEGER NOT NULL DEFAULT 0;
