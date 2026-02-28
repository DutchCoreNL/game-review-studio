
-- Add war chain tracking to gang_wars
ALTER TABLE public.gang_wars 
  ADD COLUMN IF NOT EXISTS attacker_chain integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS defender_chain integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS attacker_last_hit_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS defender_last_hit_at timestamp with time zone;
