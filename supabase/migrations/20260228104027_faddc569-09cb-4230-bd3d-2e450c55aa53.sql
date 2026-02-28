
-- Add combat_rating to player_state
ALTER TABLE public.player_state ADD COLUMN IF NOT EXISTS combat_rating INTEGER NOT NULL DEFAULT 1000;

-- Add claimed_by and claimed_at to district_events for competitive claim mechanism
ALTER TABLE public.district_events ADD COLUMN IF NOT EXISTS claimed_by UUID;
ALTER TABLE public.district_events ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMP WITH TIME ZONE;

-- Add escalation_level to track escalation events
ALTER TABLE public.district_events ADD COLUMN IF NOT EXISTS escalation_level INTEGER NOT NULL DEFAULT 0;

-- Add participants count for coop events
ALTER TABLE public.district_events ADD COLUMN IF NOT EXISTS participants JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Create index for quick combat rating lookups
CREATE INDEX IF NOT EXISTS idx_player_state_combat_rating ON public.player_state(combat_rating DESC);

-- Allow service role to update district_events (for claim mechanism via edge function)
-- The edge function uses service role key, so no additional RLS needed for server-side updates
