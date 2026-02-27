
-- Shared faction state for MMO: all players see the same faction status
CREATE TABLE public.faction_relations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  faction_id text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'active', -- active, chaos, vassal
  boss_hp integer NOT NULL DEFAULT 100,
  boss_max_hp integer NOT NULL DEFAULT 100,
  conquest_phase text NOT NULL DEFAULT 'none', -- none, defense, subboss, leader
  conquest_progress integer NOT NULL DEFAULT 0,
  conquered_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  conquered_at timestamptz,
  vassal_owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  global_relation integer NOT NULL DEFAULT 0, -- shared world relation (-100 to 100)
  last_attack_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  last_attack_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.faction_relations ENABLE ROW LEVEL SECURITY;

-- Everyone can read faction state
CREATE POLICY "Anyone can read faction relations"
  ON public.faction_relations FOR SELECT USING (true);

-- Only service_role / edge functions can write
-- No INSERT/UPDATE/DELETE policies for regular users

-- Seed the 3 factions
INSERT INTO public.faction_relations (faction_id, status, boss_hp, boss_max_hp)
VALUES
  ('cartel', 'active', 100, 100),
  ('syndicate', 'active', 100, 100),
  ('bikers', 'active', 100, 100);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.faction_relations;
