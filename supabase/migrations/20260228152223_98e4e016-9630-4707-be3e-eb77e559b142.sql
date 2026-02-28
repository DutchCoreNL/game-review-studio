
-- ============================================
-- FEATURE 2: AI Personal Story Events
-- ============================================
CREATE TABLE public.personal_story_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  story_text TEXT NOT NULL,
  story_title TEXT NOT NULL DEFAULT 'Onbekend verhaal',
  choices JSONB NOT NULL DEFAULT '[]'::jsonb,
  chosen_option TEXT,
  reward_data JSONB,
  context_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '1 day'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.personal_story_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players read own stories" ON public.personal_story_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Players update own stories" ON public.personal_story_events
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins manage stories" ON public.personal_story_events
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- FEATURE 3: Reputatie Echo Systeem
-- ============================================
CREATE TABLE public.player_reputation_echo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  district_id TEXT NOT NULL,
  violence INTEGER NOT NULL DEFAULT 0,
  trade_trust INTEGER NOT NULL DEFAULT 0,
  loyalty INTEGER NOT NULL DEFAULT 0,
  stealth INTEGER NOT NULL DEFAULT 0,
  generosity INTEGER NOT NULL DEFAULT 0,
  total_interactions INTEGER NOT NULL DEFAULT 0,
  price_modifier NUMERIC(4,2) NOT NULL DEFAULT 0.00,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, district_id)
);

ALTER TABLE public.player_reputation_echo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players read own reputation" ON public.player_reputation_echo
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins manage reputation" ON public.player_reputation_echo
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- FEATURE 4: Undercover Infiltratie
-- ============================================
CREATE TABLE public.undercover_missions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  target_faction TEXT NOT NULL,
  cover_identity TEXT NOT NULL DEFAULT 'Onbekend',
  cover_integrity INTEGER NOT NULL DEFAULT 100,
  days_active INTEGER NOT NULL DEFAULT 0,
  intel_gathered JSONB NOT NULL DEFAULT '[]'::jsonb,
  missions_completed INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  reward_data JSONB,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.undercover_missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players read own undercover" ON public.undercover_missions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Players update own undercover" ON public.undercover_missions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins manage undercover" ON public.undercover_missions
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- FEATURE 5: Ondergronds Tribunaal
-- ============================================
CREATE TABLE public.tribunal_cases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  accuser_id UUID NOT NULL,
  accuser_name TEXT NOT NULL DEFAULT 'Onbekend',
  accused_id UUID NOT NULL,
  accused_name TEXT NOT NULL DEFAULT 'Onbekend',
  charge TEXT NOT NULL,
  evidence TEXT NOT NULL DEFAULT '',
  jury_size INTEGER NOT NULL DEFAULT 7,
  votes_guilty INTEGER NOT NULL DEFAULT 0,
  votes_innocent INTEGER NOT NULL DEFAULT 0,
  verdict TEXT,
  punishment JSONB,
  status TEXT NOT NULL DEFAULT 'voting',
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '48 hours'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

ALTER TABLE public.tribunal_cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read tribunal cases" ON public.tribunal_cases
  FOR SELECT USING (true);

CREATE POLICY "Admins manage tribunal" ON public.tribunal_cases
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.tribunal_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES public.tribunal_cases(id) ON DELETE CASCADE,
  juror_id UUID NOT NULL,
  juror_name TEXT NOT NULL DEFAULT 'Onbekend',
  vote TEXT NOT NULL,
  reasoning TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(case_id, juror_id)
);

ALTER TABLE public.tribunal_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read tribunal votes" ON public.tribunal_votes
  FOR SELECT USING (true);

CREATE POLICY "Jurors cast vote" ON public.tribunal_votes
  FOR INSERT WITH CHECK (auth.uid() = juror_id);

CREATE POLICY "Admins manage votes" ON public.tribunal_votes
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
