
-- Death Legacy table: tracks coffer cash + XP bonus across runs
CREATE TABLE public.death_legacy (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  coffer_cash bigint NOT NULL DEFAULT 0,
  legacy_xp_bonus numeric(4,2) NOT NULL DEFAULT 0,
  death_count integer NOT NULL DEFAULT 0,
  last_death_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.death_legacy ENABLE ROW LEVEL SECURITY;

-- Players can read their own legacy
CREATE POLICY "Players read own legacy"
ON public.death_legacy FOR SELECT
USING (auth.uid() = user_id);

-- Players can insert their own legacy
CREATE POLICY "Players insert own legacy"
ON public.death_legacy FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Players can update their own legacy
CREATE POLICY "Players update own legacy"
ON public.death_legacy FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_death_legacy_updated_at
BEFORE UPDATE ON public.death_legacy
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
