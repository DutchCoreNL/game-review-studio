
-- ========== CO-OP HEIST SESSIONS ==========
CREATE TABLE public.heist_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gang_id UUID NOT NULL REFERENCES public.gangs(id) ON DELETE CASCADE,
  heist_id TEXT NOT NULL,
  initiator_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'recruiting',
  crew_slots JSONB NOT NULL DEFAULT '{}',
  equipment JSONB NOT NULL DEFAULT '[]',
  recon_done BOOLEAN NOT NULL DEFAULT false,
  result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.heist_sessions ENABLE ROW LEVEL SECURITY;

-- Gang members can read their gang's heist sessions
CREATE POLICY "Gang members read heist sessions"
  ON public.heist_sessions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM gang_members
    WHERE gang_members.gang_id = heist_sessions.gang_id
    AND gang_members.user_id = auth.uid()
  ));

-- Gang members can insert heist sessions for their gang
CREATE POLICY "Gang members create heist sessions"
  ON public.heist_sessions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM gang_members
    WHERE gang_members.gang_id = heist_sessions.gang_id
    AND gang_members.user_id = auth.uid()
  ));

-- Gang members can update their gang's heist sessions
CREATE POLICY "Gang members update heist sessions"
  ON public.heist_sessions FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM gang_members
    WHERE gang_members.gang_id = heist_sessions.gang_id
    AND gang_members.user_id = auth.uid()
  ));

-- Admins full access
CREATE POLICY "Admins manage heist sessions"
  ON public.heist_sessions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ========== SAFEHOUSE RAIDS PVP LOG ==========
CREATE TABLE public.safehouse_raids (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  attacker_id UUID NOT NULL,
  defender_id UUID NOT NULL,
  district_id TEXT NOT NULL,
  attacker_won BOOLEAN NOT NULL,
  loot_stolen BIGINT NOT NULL DEFAULT 0,
  upgrade_destroyed TEXT,
  attacker_damage INTEGER NOT NULL DEFAULT 0,
  defender_damage INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.safehouse_raids ENABLE ROW LEVEL SECURITY;

-- Players can see raids they were involved in
CREATE POLICY "Players read own raids"
  ON public.safehouse_raids FOR SELECT
  USING (auth.uid() = attacker_id OR auth.uid() = defender_id);

-- Admins full access
CREATE POLICY "Admins manage raids"
  ON public.safehouse_raids FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for heist sessions (co-op coordination)
ALTER PUBLICATION supabase_realtime ADD TABLE public.heist_sessions;
