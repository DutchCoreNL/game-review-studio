
-- Global chat messages table
CREATE TABLE public.chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  username text NOT NULL DEFAULT '',
  channel text NOT NULL DEFAULT 'global',
  message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for fast channel queries
CREATE INDEX idx_chat_messages_channel_created ON public.chat_messages (channel, created_at DESC);

-- Auto-delete old messages (keep last 7 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_chat_messages()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.chat_messages
  WHERE created_at < now() - interval '7 days';
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_cleanup_chat
AFTER INSERT ON public.chat_messages
FOR EACH STATEMENT
EXECUTE FUNCTION public.cleanup_old_chat_messages();

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read all chat messages
CREATE POLICY "Authenticated users read chat"
  ON public.chat_messages FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Users insert own messages
CREATE POLICY "Users send chat messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins manage all
CREATE POLICY "Admins manage chat"
  ON public.chat_messages FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
