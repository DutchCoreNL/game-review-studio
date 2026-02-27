-- Add prestige_level column to leaderboard_entries
ALTER TABLE public.leaderboard_entries ADD COLUMN prestige_level integer NOT NULL DEFAULT 0;

-- Add prestige_level to bot_players too
ALTER TABLE public.bot_players ADD COLUMN prestige_level integer NOT NULL DEFAULT 0;