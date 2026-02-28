
-- Gang Story Arcs table for collaborative gang missions
CREATE TABLE public.gang_story_arcs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gang_id UUID NOT NULL REFERENCES public.gangs(id) ON DELETE CASCADE,
  arc_id TEXT NOT NULL,
  current_step INTEGER NOT NULL DEFAULT 0,
  total_steps INTEGER NOT NULL DEFAULT 4,
  member_choices JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'active',
  result JSONB NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.gang_story_arcs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gang members read own gang arcs"
  ON public.gang_story_arcs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM gang_members WHERE gang_members.gang_id = gang_story_arcs.gang_id AND gang_members.user_id = auth.uid()
  ));

CREATE POLICY "Admins manage gang arcs"
  ON public.gang_story_arcs FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for gang_story_arcs
ALTER PUBLICATION supabase_realtime ADD TABLE public.gang_story_arcs;

-- NPC District Mood table for collective NPC relations
CREATE TABLE public.npc_district_mood (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  npc_id TEXT NOT NULL,
  district_id TEXT NOT NULL,
  collective_score INTEGER NOT NULL DEFAULT 0,
  interaction_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'neutral',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(npc_id, district_id)
);

ALTER TABLE public.npc_district_mood ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read NPC mood"
  ON public.npc_district_mood FOR SELECT
  USING (true);

CREATE POLICY "Admins manage NPC mood"
  ON public.npc_district_mood FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add triggered_by column to district_events
ALTER TABLE public.district_events
  ADD COLUMN IF NOT EXISTS triggered_by UUID NULL,
  ADD COLUMN IF NOT EXISTS triggered_by_name TEXT NULL,
  ADD COLUMN IF NOT EXISTS source_type TEXT NOT NULL DEFAULT 'system';

-- Player nemesis assignments
CREATE TABLE public.player_nemesis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL,
  nemesis_id UUID NOT NULL,
  district_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  arc_progress INTEGER NOT NULL DEFAULT 0,
  events_log JSONB NOT NULL DEFAULT '[]'::jsonb,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE NULL,
  UNIQUE(player_id, status)
);

ALTER TABLE public.player_nemesis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players read own nemesis"
  ON public.player_nemesis FOR SELECT
  USING (auth.uid() = player_id OR auth.uid() = nemesis_id);

CREATE POLICY "Admins manage nemesis"
  ON public.player_nemesis FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Seed initial NPC mood data for all district/npc combos
INSERT INTO public.npc_district_mood (npc_id, district_id, collective_score, status)
VALUES
  ('rosa', 'neon', 0, 'neutral'), ('rosa', 'port', 0, 'neutral'), ('rosa', 'crown', 0, 'neutral'), ('rosa', 'iron', 0, 'neutral'), ('rosa', 'low', 0, 'neutral'),
  ('marco', 'neon', 0, 'neutral'), ('marco', 'port', 0, 'neutral'), ('marco', 'crown', 0, 'neutral'), ('marco', 'iron', 0, 'neutral'), ('marco', 'low', 0, 'neutral'),
  ('yilmaz', 'neon', 0, 'neutral'), ('yilmaz', 'port', 0, 'neutral'), ('yilmaz', 'crown', 0, 'neutral'), ('yilmaz', 'iron', 0, 'neutral'), ('yilmaz', 'low', 0, 'neutral'),
  ('luna', 'neon', 0, 'neutral'), ('luna', 'port', 0, 'neutral'), ('luna', 'crown', 0, 'neutral'), ('luna', 'iron', 0, 'neutral'), ('luna', 'low', 0, 'neutral'),
  ('krow', 'neon', 0, 'neutral'), ('krow', 'port', 0, 'neutral'), ('krow', 'crown', 0, 'neutral'), ('krow', 'iron', 0, 'neutral'), ('krow', 'low', 0, 'neutral');
