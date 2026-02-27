-- Add gang_damage jsonb column to faction_relations for tracking per-gang damage
ALTER TABLE public.faction_relations ADD COLUMN IF NOT EXISTS gang_damage jsonb NOT NULL DEFAULT '{}'::jsonb;