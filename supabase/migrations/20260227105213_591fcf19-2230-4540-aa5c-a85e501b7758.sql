
-- Player skills table for the skill tree system
CREATE TABLE public.player_skills (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  skill_id text NOT NULL,
  level integer NOT NULL DEFAULT 1,
  unlocked_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, skill_id)
);

ALTER TABLE public.player_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players read own skills" ON public.player_skills
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins manage skills" ON public.player_skills
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add prestige_level to player_state
ALTER TABLE public.player_state
  ADD COLUMN IF NOT EXISTS prestige_level integer NOT NULL DEFAULT 0;

-- Add xp_multiplier tracking column
ALTER TABLE public.player_state
  ADD COLUMN IF NOT EXISTS xp_streak integer NOT NULL DEFAULT 0;
