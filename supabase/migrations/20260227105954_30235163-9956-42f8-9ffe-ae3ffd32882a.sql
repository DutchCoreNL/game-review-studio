
-- Create district_events table for realtime MMO map events
CREATE TABLE public.district_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  district_id text NOT NULL,
  event_type text NOT NULL,
  title text NOT NULL,
  description text,
  data jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '1 hour')
);

-- Enable RLS
ALTER TABLE public.district_events ENABLE ROW LEVEL SECURITY;

-- Everyone can read events (public map data)
CREATE POLICY "Anyone can read district events"
  ON public.district_events FOR SELECT USING (true);

-- Enable realtime for district_events
ALTER PUBLICATION supabase_realtime ADD TABLE public.district_events;

-- Index for quick lookups
CREATE INDEX idx_district_events_district ON public.district_events (district_id);
CREATE INDEX idx_district_events_expires ON public.district_events (expires_at);
