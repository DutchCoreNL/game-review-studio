-- Track when rested_xp was last granted per player so world-tick can compute the
-- gain from real elapsed time instead of re-granting on every invocation regardless
-- of how often the tick actually fires.
ALTER TABLE public.player_state ADD COLUMN IF NOT EXISTS rested_xp_synced_at timestamptz NOT NULL DEFAULT now();
