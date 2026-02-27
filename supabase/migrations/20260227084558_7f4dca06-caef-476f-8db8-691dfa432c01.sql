
-- Player-to-player messages
CREATE TABLE public.player_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  subject text NOT NULL DEFAULT '',
  body text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_player_messages_receiver ON public.player_messages(receiver_id, created_at DESC);
CREATE INDEX idx_player_messages_sender ON public.player_messages(sender_id, created_at DESC);

-- RLS
ALTER TABLE public.player_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players read own received messages"
  ON public.player_messages FOR SELECT
  USING (auth.uid() = receiver_id OR auth.uid() = sender_id);

CREATE POLICY "Players send messages"
  ON public.player_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Players update own received messages"
  ON public.player_messages FOR UPDATE
  USING (auth.uid() = receiver_id);

CREATE POLICY "Players delete own messages"
  ON public.player_messages FOR DELETE
  USING (auth.uid() = receiver_id OR auth.uid() = sender_id);

-- Admins
CREATE POLICY "Admins manage messages"
  ON public.player_messages FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
