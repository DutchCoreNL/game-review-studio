
-- Player rivalries: tracks rivalry intensity between two players
CREATE TABLE public.player_rivalries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL,
  rival_id UUID NOT NULL,
  rivalry_score INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'pvp', -- pvp, bounty, territory, trade
  last_interaction TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(player_id, rival_id)
);

ALTER TABLE public.player_rivalries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players read own rivalries"
ON public.player_rivalries FOR SELECT
USING (auth.uid() = player_id OR auth.uid() = rival_id);

CREATE POLICY "Admins manage rivalries"
ON public.player_rivalries FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Player bounties: real player bounties
CREATE TABLE public.player_bounties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  placer_id UUID NOT NULL,
  target_id UUID NOT NULL,
  amount INTEGER NOT NULL DEFAULT 0,
  reason TEXT NOT NULL DEFAULT 'rivalry',
  status TEXT NOT NULL DEFAULT 'active', -- active, claimed, expired
  claimed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  claimed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.player_bounties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active bounties"
ON public.player_bounties FOR SELECT
USING (true);

CREATE POLICY "Admins manage bounties"
ON public.player_bounties FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Index for fast lookups
CREATE INDEX idx_rivalries_player ON public.player_rivalries(player_id);
CREATE INDEX idx_rivalries_rival ON public.player_rivalries(rival_id);
CREATE INDEX idx_bounties_target ON public.player_bounties(target_id, status);
CREATE INDEX idx_bounties_active ON public.player_bounties(status) WHERE status = 'active';

-- Enable realtime for bounties
ALTER PUBLICATION supabase_realtime ADD TABLE public.player_bounties;
