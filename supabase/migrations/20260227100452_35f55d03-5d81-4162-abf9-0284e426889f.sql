
-- Bot players table to populate the world
CREATE TABLE public.bot_players (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username text NOT NULL,
  level integer NOT NULL DEFAULT 1,
  hp integer NOT NULL DEFAULT 100,
  max_hp integer NOT NULL DEFAULT 100,
  loc text NOT NULL DEFAULT 'low',
  rep integer NOT NULL DEFAULT 0,
  cash bigint NOT NULL DEFAULT 5000,
  day integer NOT NULL DEFAULT 1,
  districts_owned integer NOT NULL DEFAULT 0,
  crew_size integer NOT NULL DEFAULT 0,
  karma integer NOT NULL DEFAULT 0,
  backstory text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS: public read, admin manage
ALTER TABLE public.bot_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read bot players"
  ON public.bot_players FOR SELECT
  USING (true);

CREATE POLICY "Admins manage bot players"
  ON public.bot_players FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
