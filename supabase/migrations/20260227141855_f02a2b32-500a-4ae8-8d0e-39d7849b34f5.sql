
-- Organized Crimes: gang-wide async crimes
CREATE TABLE public.organized_crimes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gang_id uuid NOT NULL REFERENCES public.gangs(id) ON DELETE CASCADE,
  crime_id text NOT NULL,
  status text NOT NULL DEFAULT 'recruiting',
  signups jsonb NOT NULL DEFAULT '{}',
  initiated_by uuid NOT NULL,
  initiated_at timestamp with time zone,
  completes_at timestamp with time zone,
  result jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_oc_gang_status ON public.organized_crimes (gang_id, status);

ALTER TABLE public.organized_crimes ENABLE ROW LEVEL SECURITY;

-- Gang members can read their gang's OCs
CREATE POLICY "Gang members read OCs"
  ON public.organized_crimes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM gang_members
    WHERE gang_members.gang_id = organized_crimes.gang_id
    AND gang_members.user_id = auth.uid()
  ));

-- Gang members can insert OCs for their gang
CREATE POLICY "Gang members create OCs"
  ON public.organized_crimes FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM gang_members
    WHERE gang_members.gang_id = organized_crimes.gang_id
    AND gang_members.user_id = auth.uid()
  ));

-- Gang members can update their gang's OCs (signup)
CREATE POLICY "Gang members update OCs"
  ON public.organized_crimes FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM gang_members
    WHERE gang_members.gang_id = organized_crimes.gang_id
    AND gang_members.user_id = auth.uid()
  ));

-- Admins manage all
CREATE POLICY "Admins manage OCs"
  ON public.organized_crimes FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for live signup updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.organized_crimes;
