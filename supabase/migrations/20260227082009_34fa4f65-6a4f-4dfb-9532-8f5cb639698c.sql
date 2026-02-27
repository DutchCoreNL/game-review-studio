
-- ============================================================
-- FASE 1: MMO FUNDAMENT — Core Game State Tables
-- ============================================================

-- 1. PLAYER STATE — alle kernvelden uit GameState
CREATE TABLE public.player_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Core resources
  money bigint NOT NULL DEFAULT 5000,
  dirty_money bigint NOT NULL DEFAULT 0,
  debt bigint NOT NULL DEFAULT 5000,
  rep integer NOT NULL DEFAULT 0,
  heat integer NOT NULL DEFAULT 0,
  personal_heat integer NOT NULL DEFAULT 0,
  karma integer NOT NULL DEFAULT 0,
  
  -- Health & combat
  hp integer NOT NULL DEFAULT 100,
  max_hp integer NOT NULL DEFAULT 100,
  
  -- Player progression
  level integer NOT NULL DEFAULT 1,
  xp integer NOT NULL DEFAULT 0,
  next_xp integer NOT NULL DEFAULT 100,
  skill_points integer NOT NULL DEFAULT 0,
  stats jsonb NOT NULL DEFAULT '{"muscle": 1, "brains": 1, "charm": 1}',
  loadout jsonb NOT NULL DEFAULT '{"weapon": null, "armor": null, "gadget": null}',
  
  -- Location & movement
  loc text NOT NULL DEFAULT 'low',
  
  -- Energy system (Torn-style — NEW for MMO)
  energy integer NOT NULL DEFAULT 100,
  max_energy integer NOT NULL DEFAULT 100,
  nerve integer NOT NULL DEFAULT 50,
  max_nerve integer NOT NULL DEFAULT 50,
  energy_regen_at timestamptz NOT NULL DEFAULT now(),  -- when next energy point regens
  nerve_regen_at timestamptz NOT NULL DEFAULT now(),
  
  -- Cooldowns (realtime timers instead of turn-based)
  travel_cooldown_until timestamptz,
  crime_cooldown_until timestamptz,
  attack_cooldown_until timestamptz,
  heist_cooldown_until timestamptz,
  
  -- Day tracking (legacy compat + real time)
  day integer NOT NULL DEFAULT 1,
  last_action_at timestamptz NOT NULL DEFAULT now(),
  
  -- Police & hiding
  police_rel integer NOT NULL DEFAULT 50,
  hiding_until timestamptz,
  
  -- Prison & Hospital (realtime timers)
  prison_until timestamptz,
  prison_reason text,
  hospital_until timestamptz,
  hospitalizations integer NOT NULL DEFAULT 0,
  
  -- Backstory & narrative
  backstory text,
  
  -- Misc game state
  wash_used_today integer NOT NULL DEFAULT 0,
  ammo integer NOT NULL DEFAULT 0,
  ammo_stock jsonb NOT NULL DEFAULT '{"9mm": 0, "7.62mm": 0, "shells": 0}',
  ammo_factory_level integer NOT NULL DEFAULT 1,
  casino_jackpot integer NOT NULL DEFAULT 500,
  
  -- Endgame
  endgame_phase text NOT NULL DEFAULT 'straatdealer',
  new_game_plus_level integer NOT NULL DEFAULT 0,
  final_boss_defeated boolean NOT NULL DEFAULT false,
  free_play_mode boolean NOT NULL DEFAULT false,
  game_over boolean NOT NULL DEFAULT false,
  
  -- Statistics
  stats_total_earned bigint NOT NULL DEFAULT 0,
  stats_total_spent bigint NOT NULL DEFAULT 0,
  stats_casino_won bigint NOT NULL DEFAULT 0,
  stats_casino_lost bigint NOT NULL DEFAULT 0,
  stats_missions_completed integer NOT NULL DEFAULT 0,
  stats_missions_failed integer NOT NULL DEFAULT 0,
  stats_trades_completed integer NOT NULL DEFAULT 0,
  stats_days_played integer NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. PLAYER INVENTORY — goods per player
CREATE TABLE public.player_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  good_id text NOT NULL, -- 'drugs', 'weapons', 'tech', 'luxury', 'meds'
  quantity integer NOT NULL DEFAULT 0,
  avg_cost integer NOT NULL DEFAULT 0, -- average purchase cost for profit tracking
  UNIQUE(user_id, good_id)
);

-- 3. PLAYER GEAR — owned and equipped gear
CREATE TABLE public.player_gear (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gear_id text NOT NULL,
  acquired_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, gear_id)
);

-- 4. PLAYER VEHICLES — owned vehicles with condition/upgrades
CREATE TABLE public.player_vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id text NOT NULL,
  condition integer NOT NULL DEFAULT 100,
  vehicle_heat integer NOT NULL DEFAULT 0,
  rekat_cooldown integer NOT NULL DEFAULT 0,
  upgrades jsonb NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT false,
  acquired_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, vehicle_id)
);

-- 5. PLAYER DISTRICTS — owned districts
CREATE TABLE public.player_districts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  district_id text NOT NULL,
  defense jsonb NOT NULL DEFAULT '{"upgrades": [], "fortLevel": 0}',
  district_rep integer NOT NULL DEFAULT 0,
  captured_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, district_id)
);

-- 6. PLAYER BUSINESSES — owned businesses
CREATE TABLE public.player_businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id text NOT NULL,
  acquired_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, business_id)
);

-- 7. PLAYER CREW — crew members per player
CREATE TABLE public.player_crew (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text NOT NULL, -- 'Chauffeur', 'Enforcer', 'Hacker', 'Smokkelaar'
  hp integer NOT NULL DEFAULT 100,
  xp integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  specialization text,
  loyalty integer NOT NULL DEFAULT 50,
  slot_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 8. PLAYER SAFEHOUSES — safehouses per player
CREATE TABLE public.player_safehouses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  district_id text NOT NULL,
  level integer NOT NULL DEFAULT 1,
  upgrades jsonb NOT NULL DEFAULT '[]',
  acquired_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, district_id)
);

-- 9. PLAYER VILLA — villa state per player
CREATE TABLE public.player_villa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  level integer NOT NULL DEFAULT 1,
  modules jsonb NOT NULL DEFAULT '[]',
  prestige_modules jsonb NOT NULL DEFAULT '[]',
  vault_money bigint NOT NULL DEFAULT 0,
  stored_goods jsonb NOT NULL DEFAULT '{}',
  stored_ammo integer NOT NULL DEFAULT 0,
  helipad_used_today boolean NOT NULL DEFAULT false,
  purchase_day integer NOT NULL DEFAULT 0,
  last_party_day integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 10. GAME ACTION LOG — audit trail for all server-side actions
CREATE TABLE public.game_action_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  action_data jsonb,
  result_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- RLS POLICIES
-- ============================================================

ALTER TABLE public.player_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_gear ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_crew ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_safehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_villa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_action_log ENABLE ROW LEVEL SECURITY;

-- Players can read their own state
CREATE POLICY "Players read own state" ON public.player_state FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Players read own inventory" ON public.player_inventory FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Players read own gear" ON public.player_gear FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Players read own vehicles" ON public.player_vehicles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Players read own districts" ON public.player_districts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Players read own businesses" ON public.player_businesses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Players read own crew" ON public.player_crew FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Players read own safehouses" ON public.player_safehouses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Players read own villa" ON public.player_villa FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Players read own action log" ON public.game_action_log FOR SELECT USING (auth.uid() = user_id);

-- Public read for PvP: other players can see basic stats
CREATE POLICY "Public read basic player info" ON public.player_state FOR SELECT USING (true);

-- Service role (edge functions) handles all writes — no direct client writes
-- Admins can read everything
CREATE POLICY "Admins read all player state" ON public.player_state FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage inventory" ON public.player_inventory FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage gear" ON public.player_gear FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage vehicles" ON public.player_vehicles FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage districts" ON public.player_districts FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage businesses" ON public.player_businesses FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage crew" ON public.player_crew FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage safehouses" ON public.player_safehouses FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage villa" ON public.player_villa FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins read action log" ON public.game_action_log FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Auto-update timestamp trigger
CREATE TRIGGER update_player_state_updated_at
  BEFORE UPDATE ON public.player_state
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_player_state_user_id ON public.player_state(user_id);
CREATE INDEX idx_player_inventory_user_id ON public.player_inventory(user_id);
CREATE INDEX idx_player_crew_user_id ON public.player_crew(user_id);
CREATE INDEX idx_game_action_log_user_id ON public.game_action_log(user_id);
CREATE INDEX idx_game_action_log_created ON public.game_action_log(created_at DESC);
