
-- Add rested XP column for offline catch-up mechanic
ALTER TABLE public.player_state ADD COLUMN IF NOT EXISTS rested_xp INTEGER NOT NULL DEFAULT 0;
