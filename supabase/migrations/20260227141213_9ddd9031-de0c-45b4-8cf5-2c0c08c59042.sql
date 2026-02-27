
-- Travel system: track player travel state
CREATE TABLE public.player_travel (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  destination text NOT NULL,
  departed_at timestamp with time zone NOT NULL DEFAULT now(),
  arrives_at timestamp with time zone NOT NULL,
  purchased_goods jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'traveling',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.player_travel ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players read own travel"
  ON public.player_travel FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Players insert own travel"
  ON public.player_travel FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Players update own travel"
  ON public.player_travel FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Players delete own travel"
  ON public.player_travel FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins manage travel"
  ON public.player_travel FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
