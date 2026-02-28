
-- ========== 1. ACTIVITY FEED (Realtime interactie) ==========
CREATE TABLE public.activity_feed (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  username text NOT NULL DEFAULT 'Onbekend',
  action_type text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL DEFAULT '📰',
  district_id text,
  target_name text,
  data jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read activity feed" ON public.activity_feed FOR SELECT USING (true);
CREATE POLICY "System inserts activity" ON public.activity_feed FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage activity" ON public.activity_feed FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Auto-cleanup old activity (keep 24h)
CREATE OR REPLACE FUNCTION public.cleanup_old_activity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  DELETE FROM public.activity_feed WHERE created_at < now() - interval '24 hours';
  RETURN NEW;
END;
$$;

CREATE TRIGGER cleanup_activity_trigger
AFTER INSERT ON public.activity_feed
FOR EACH STATEMENT EXECUTE FUNCTION public.cleanup_old_activity();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_feed;

-- ========== 2. ONLINE STATUS (Realtime interactie) ==========
CREATE TABLE public.player_online_status (
  user_id uuid NOT NULL PRIMARY KEY,
  username text NOT NULL DEFAULT 'Onbekend',
  district_id text NOT NULL DEFAULT 'low',
  level integer NOT NULL DEFAULT 1,
  last_seen_at timestamp with time zone NOT NULL DEFAULT now(),
  is_online boolean NOT NULL DEFAULT true
);

ALTER TABLE public.player_online_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read online status" ON public.player_online_status FOR SELECT USING (true);
CREATE POLICY "Players update own status" ON public.player_online_status FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Players upsert own status" ON public.player_online_status FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins manage online status" ON public.player_online_status FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

ALTER PUBLICATION supabase_realtime ADD TABLE public.player_online_status;

-- ========== 3. GANG ALLIANCES (Sociale systemen) ==========
CREATE TABLE public.gang_alliances (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gang_a_id uuid NOT NULL REFERENCES public.gangs(id) ON DELETE CASCADE,
  gang_b_id uuid NOT NULL REFERENCES public.gangs(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  proposed_by uuid NOT NULL,
  accepted_at timestamp with time zone,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '14 days'),
  benefits jsonb NOT NULL DEFAULT '{"shared_defense": true, "trade_bonus": 0.1}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.gang_alliances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read alliances" ON public.gang_alliances FOR SELECT USING (true);
CREATE POLICY "Admins manage alliances" ON public.gang_alliances FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

ALTER PUBLICATION supabase_realtime ADD TABLE public.gang_alliances;

-- ========== 4. PLAYER TITLES (Sociale systemen) ==========
CREATE TABLE public.player_titles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title_id text NOT NULL,
  title_name text NOT NULL,
  title_icon text NOT NULL DEFAULT '🏅',
  is_active boolean NOT NULL DEFAULT false,
  earned_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.player_titles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read titles" ON public.player_titles FOR SELECT USING (true);
CREATE POLICY "Players manage own titles" ON public.player_titles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins manage titles" ON public.player_titles FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE UNIQUE INDEX idx_player_titles_unique ON public.player_titles(user_id, title_id);

-- ========== 5. WORLD RAIDS (Wereld-events) ==========
CREATE TABLE public.world_raids (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  raid_type text NOT NULL,
  title text NOT NULL,
  description text,
  district_id text,
  boss_hp integer NOT NULL DEFAULT 1000,
  boss_max_hp integer NOT NULL DEFAULT 1000,
  participants jsonb NOT NULL DEFAULT '{}'::jsonb,
  total_participants integer NOT NULL DEFAULT 0,
  reward_pool jsonb NOT NULL DEFAULT '{"cash": 50000, "rep": 200, "xp": 500}'::jsonb,
  status text NOT NULL DEFAULT 'active',
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  ends_at timestamp with time zone NOT NULL DEFAULT (now() + interval '2 hours'),
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.world_raids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read world raids" ON public.world_raids FOR SELECT USING (true);
CREATE POLICY "Admins manage world raids" ON public.world_raids FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

ALTER PUBLICATION supabase_realtime ADD TABLE public.world_raids;

-- ========== 6. SMUGGLE ROUTES (Economie) ==========
CREATE TABLE public.smuggle_routes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_district text NOT NULL,
  to_district text NOT NULL,
  good_id text NOT NULL,
  profit_multiplier numeric NOT NULL DEFAULT 1.5,
  risk_level integer NOT NULL DEFAULT 50,
  capacity integer NOT NULL DEFAULT 20,
  used_capacity integer NOT NULL DEFAULT 0,
  created_by uuid,
  gang_id uuid REFERENCES public.gangs(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active',
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '6 hours'),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.smuggle_routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read smuggle routes" ON public.smuggle_routes FOR SELECT USING (true);
CREATE POLICY "Admins manage smuggle routes" ON public.smuggle_routes FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

ALTER PUBLICATION supabase_realtime ADD TABLE public.smuggle_routes;

-- ========== 7. GOLDEN DISTRICT (Seizoens-events) ==========
-- Add golden_district column to world_state if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'world_state') THEN
    BEGIN
      ALTER TABLE public.world_state ADD COLUMN golden_district text;
      ALTER TABLE public.world_state ADD COLUMN golden_district_expires_at timestamp with time zone;
      ALTER TABLE public.world_state ADD COLUMN season_number integer DEFAULT 1;
      ALTER TABLE public.world_state ADD COLUMN season_ends_at timestamp with time zone DEFAULT (now() + interval '30 days');
    EXCEPTION WHEN duplicate_column THEN NULL;
    END;
  END IF;
END $$;

-- Index for performance
CREATE INDEX idx_activity_feed_created ON public.activity_feed(created_at DESC);
CREATE INDEX idx_activity_feed_district ON public.activity_feed(district_id);
CREATE INDEX idx_player_online_district ON public.player_online_status(district_id) WHERE is_online = true;
CREATE INDEX idx_smuggle_routes_status ON public.smuggle_routes(status) WHERE status = 'active';
CREATE INDEX idx_world_raids_status ON public.world_raids(status) WHERE status = 'active';
