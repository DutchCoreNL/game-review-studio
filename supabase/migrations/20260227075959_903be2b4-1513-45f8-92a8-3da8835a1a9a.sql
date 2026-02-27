
CREATE TABLE public.player_sanctions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  admin_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('warning', 'mute')),
  reason text,
  expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  active boolean NOT NULL DEFAULT true
);

ALTER TABLE public.player_sanctions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage sanctions"
ON public.player_sanctions
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own sanctions"
ON public.player_sanctions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX idx_sanctions_user ON public.player_sanctions(user_id, active);
