
-- Track individual player influence contributions per district
CREATE TABLE public.district_influence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  gang_id UUID NOT NULL REFERENCES public.gangs(id) ON DELETE CASCADE,
  district_id TEXT NOT NULL,
  influence INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, district_id)
);

-- Add total_influence to gang_territories
ALTER TABLE public.gang_territories ADD COLUMN IF NOT EXISTS total_influence INTEGER NOT NULL DEFAULT 0;

-- Enable RLS
ALTER TABLE public.district_influence ENABLE ROW LEVEL SECURITY;

-- Players can read all influence (to see leaderboard per district)
CREATE POLICY "Anyone can read district influence"
  ON public.district_influence FOR SELECT USING (true);

-- Admins full access
CREATE POLICY "Admins manage district influence"
  ON public.district_influence FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Index for fast lookups
CREATE INDEX idx_district_influence_district ON public.district_influence(district_id);
CREATE INDEX idx_district_influence_gang ON public.district_influence(gang_id);

-- Enable realtime for gang_territories so clients can see changes
ALTER PUBLICATION supabase_realtime ADD TABLE public.gang_territories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.district_influence;
