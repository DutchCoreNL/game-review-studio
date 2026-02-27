
-- Create world_state singleton table
CREATE TABLE public.world_state (
  id integer PRIMARY KEY DEFAULT 1,
  world_day integer NOT NULL DEFAULT 1,
  time_of_day text NOT NULL DEFAULT 'day',
  current_weather text NOT NULL DEFAULT 'clear',
  next_cycle_at timestamptz NOT NULL DEFAULT (now() + interval '30 minutes'),
  weather_changed_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Ensure only one row
CREATE UNIQUE INDEX world_state_singleton ON public.world_state ((true));

-- Enable RLS
ALTER TABLE public.world_state ENABLE ROW LEVEL SECURITY;

-- Anyone can read
CREATE POLICY "Anyone can read world state"
  ON public.world_state FOR SELECT USING (true);

-- Seed initial row
INSERT INTO public.world_state (id, world_day, time_of_day, current_weather, next_cycle_at)
VALUES (1, 1, 'day', 'clear', now() + interval '30 minutes');

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.world_state;
