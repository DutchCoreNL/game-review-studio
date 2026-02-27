
-- Add columns for world boss reset system
ALTER TABLE public.faction_relations
  ADD COLUMN IF NOT EXISTS reset_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS total_damage_dealt jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS conquest_reward_claimed jsonb NOT NULL DEFAULT '[]'::jsonb;
