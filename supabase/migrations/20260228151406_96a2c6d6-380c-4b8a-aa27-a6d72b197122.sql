
-- Gang Moles: Informant & Mol Systeem
CREATE TABLE public.gang_moles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL,
  player_gang_id UUID NOT NULL REFERENCES public.gangs(id) ON DELETE CASCADE,
  target_gang_id UUID NOT NULL REFERENCES public.gangs(id) ON DELETE CASCADE,
  planted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'active',
  cover_strength INTEGER NOT NULL DEFAULT 100,
  intel_reports JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_intel_at TIMESTAMP WITH TIME ZONE,
  discovered_at TIMESTAMP WITH TIME ZONE,
  discovery_consequence TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_active_mole UNIQUE (player_id, target_gang_id)
);

-- Enable RLS
ALTER TABLE public.gang_moles ENABLE ROW LEVEL SECURITY;

-- Only the player who planted the mole can see it
CREATE POLICY "Players read own moles"
ON public.gang_moles FOR SELECT
USING (auth.uid() = player_id);

-- Admins full access
CREATE POLICY "Admins manage moles"
ON public.gang_moles FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_gang_moles_updated_at
BEFORE UPDATE ON public.gang_moles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
