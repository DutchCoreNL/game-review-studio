ALTER TABLE public.player_state ADD COLUMN IF NOT EXISTS merit_points integer NOT NULL DEFAULT 0;
ALTER TABLE public.player_state ADD COLUMN IF NOT EXISTS stat_points integer NOT NULL DEFAULT 0;