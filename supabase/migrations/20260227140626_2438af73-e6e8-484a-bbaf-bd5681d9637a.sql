
-- Education system: players can enroll in courses that take real time
CREATE TABLE public.player_education (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  course_id text NOT NULL,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  status text NOT NULL DEFAULT 'in_progress',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Unique constraint: one active course per user
CREATE UNIQUE INDEX idx_player_education_active ON public.player_education (user_id) WHERE status = 'in_progress';

-- Index for completed courses lookup
CREATE INDEX idx_player_education_completed ON public.player_education (user_id, status);

-- Enable RLS
ALTER TABLE public.player_education ENABLE ROW LEVEL SECURITY;

-- Players can read their own education
CREATE POLICY "Players read own education"
  ON public.player_education FOR SELECT
  USING (auth.uid() = user_id);

-- Admins manage education
CREATE POLICY "Admins manage education"
  ON public.player_education FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
