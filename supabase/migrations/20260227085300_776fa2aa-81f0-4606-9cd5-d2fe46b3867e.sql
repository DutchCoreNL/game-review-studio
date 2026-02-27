
-- Gangs table
CREATE TABLE public.gangs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  tag text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  leader_id uuid NOT NULL,
  level integer NOT NULL DEFAULT 1,
  xp integer NOT NULL DEFAULT 0,
  treasury bigint NOT NULL DEFAULT 0,
  max_members integer NOT NULL DEFAULT 20,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT gang_name_length CHECK (char_length(name) BETWEEN 3 AND 24),
  CONSTRAINT gang_tag_length CHECK (char_length(tag) BETWEEN 2 AND 5)
);

CREATE INDEX idx_gangs_leader ON public.gangs(leader_id);

-- Gang members
CREATE TABLE public.gang_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gang_id uuid NOT NULL REFERENCES public.gangs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL UNIQUE,
  role text NOT NULL DEFAULT 'member',
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  contributed bigint NOT NULL DEFAULT 0,
  CONSTRAINT valid_role CHECK (role IN ('leader', 'officer', 'member'))
);

CREATE INDEX idx_gang_members_gang ON public.gang_members(gang_id);
CREATE INDEX idx_gang_members_user ON public.gang_members(user_id);

-- Gang invites
CREATE TABLE public.gang_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gang_id uuid NOT NULL REFERENCES public.gangs(id) ON DELETE CASCADE,
  inviter_id uuid NOT NULL,
  invitee_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(gang_id, invitee_id)
);

CREATE INDEX idx_gang_invites_invitee ON public.gang_invites(invitee_id);

-- Gang territories (districts claimed by gangs)
CREATE TABLE public.gang_territories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gang_id uuid NOT NULL REFERENCES public.gangs(id) ON DELETE CASCADE,
  district_id text NOT NULL UNIQUE,
  captured_at timestamp with time zone NOT NULL DEFAULT now(),
  defense_level integer NOT NULL DEFAULT 0
);

CREATE INDEX idx_gang_territories_gang ON public.gang_territories(gang_id);

-- Gang wars
CREATE TABLE public.gang_wars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attacker_gang_id uuid NOT NULL REFERENCES public.gangs(id) ON DELETE CASCADE,
  defender_gang_id uuid NOT NULL REFERENCES public.gangs(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active',
  attacker_score integer NOT NULL DEFAULT 0,
  defender_score integer NOT NULL DEFAULT 0,
  district_id text,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  ends_at timestamp with time zone NOT NULL DEFAULT (now() + interval '24 hours'),
  ended_at timestamp with time zone,
  winner_gang_id uuid,
  CONSTRAINT valid_war_status CHECK (status IN ('active', 'ended'))
);

CREATE INDEX idx_gang_wars_attacker ON public.gang_wars(attacker_gang_id);
CREATE INDEX idx_gang_wars_defender ON public.gang_wars(defender_gang_id);

-- Gang chat messages
CREATE TABLE public.gang_chat (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gang_id uuid NOT NULL REFERENCES public.gangs(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  sender_name text NOT NULL DEFAULT '',
  message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT chat_message_length CHECK (char_length(message) BETWEEN 1 AND 300)
);

CREATE INDEX idx_gang_chat_gang ON public.gang_chat(gang_id, created_at DESC);

-- Enable realtime for gang chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.gang_chat;

-- RLS for all tables
ALTER TABLE public.gangs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gang_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gang_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gang_territories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gang_wars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gang_chat ENABLE ROW LEVEL SECURITY;

-- Gangs: public read, managed via edge function
CREATE POLICY "Anyone can read gangs" ON public.gangs FOR SELECT USING (true);

-- Gang members: public read
CREATE POLICY "Anyone can read gang members" ON public.gang_members FOR SELECT USING (true);

-- Gang invites: invitee can read their own
CREATE POLICY "Invitees read own invites" ON public.gang_invites FOR SELECT USING (auth.uid() = invitee_id);
CREATE POLICY "Gang officers read invites" ON public.gang_invites FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.gang_members WHERE gang_id = gang_invites.gang_id AND user_id = auth.uid() AND role IN ('leader', 'officer')));

-- Gang territories: public read
CREATE POLICY "Anyone can read gang territories" ON public.gang_territories FOR SELECT USING (true);

-- Gang wars: public read
CREATE POLICY "Anyone can read gang wars" ON public.gang_wars FOR SELECT USING (true);

-- Gang chat: members only
CREATE POLICY "Gang members read chat" ON public.gang_chat FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.gang_members WHERE gang_id = gang_chat.gang_id AND user_id = auth.uid()));
CREATE POLICY "Gang members send chat" ON public.gang_chat FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.gang_members WHERE gang_id = gang_chat.gang_id AND user_id = auth.uid()));

-- Admin policies for all gang tables
CREATE POLICY "Admins manage gangs" ON public.gangs FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage gang members" ON public.gang_members FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage gang invites" ON public.gang_invites FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage gang territories" ON public.gang_territories FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage gang wars" ON public.gang_wars FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage gang chat" ON public.gang_chat FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
