
-- Daily digests table: one row per player per world day
CREATE TABLE public.daily_digests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  world_day INTEGER NOT NULL,
  digest_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  seen BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Unique constraint: one digest per player per day
CREATE UNIQUE INDEX idx_daily_digests_user_day ON public.daily_digests (user_id, world_day);

-- Index for quick lookup of unseen digests
CREATE INDEX idx_daily_digests_unseen ON public.daily_digests (user_id, seen) WHERE seen = false;

-- Enable RLS
ALTER TABLE public.daily_digests ENABLE ROW LEVEL SECURITY;

-- Players can read their own digests
CREATE POLICY "Players read own digests"
  ON public.daily_digests
  FOR SELECT
  USING (auth.uid() = user_id);

-- Players can update own digests (mark as seen)
CREATE POLICY "Players update own digests"
  ON public.daily_digests
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins full access
CREATE POLICY "Admins manage digests"
  ON public.daily_digests
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
