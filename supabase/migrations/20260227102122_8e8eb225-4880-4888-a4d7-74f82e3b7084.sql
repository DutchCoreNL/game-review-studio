
-- PvP Combat Sessions table for turn-based PvP
CREATE TABLE public.pvp_combat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  attacker_id UUID NOT NULL,
  defender_id TEXT NOT NULL, -- can be bot_xxx or uuid
  attacker_state JSONB NOT NULL DEFAULT '{}'::jsonb,
  defender_state JSONB NOT NULL DEFAULT '{}'::jsonb,
  combat_log JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'active',
  winner_id TEXT,
  turn INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pvp_combat_sessions ENABLE ROW LEVEL SECURITY;

-- Players can read their own sessions
CREATE POLICY "Players read own pvp sessions"
  ON public.pvp_combat_sessions
  FOR SELECT
  USING (auth.uid() = attacker_id);

-- Players can insert their own sessions
CREATE POLICY "Players create own pvp sessions"
  ON public.pvp_combat_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = attacker_id);

-- Players can update their own active sessions
CREATE POLICY "Players update own pvp sessions"
  ON public.pvp_combat_sessions
  FOR UPDATE
  USING (auth.uid() = attacker_id);

-- Admins manage all
CREATE POLICY "Admins manage pvp sessions"
  ON public.pvp_combat_sessions
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_pvp_combat_sessions_updated_at
  BEFORE UPDATE ON public.pvp_combat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
