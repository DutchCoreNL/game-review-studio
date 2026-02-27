
-- Add is_hardcore to leaderboard_entries
ALTER TABLE public.leaderboard_entries ADD COLUMN is_hardcore boolean NOT NULL DEFAULT false;

-- Add is_hardcore to player_state
ALTER TABLE public.player_state ADD COLUMN is_hardcore boolean NOT NULL DEFAULT false;
