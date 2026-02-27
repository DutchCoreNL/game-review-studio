
-- Add gang_id to bot_players so bots can be linked to gangs
ALTER TABLE public.bot_players ADD COLUMN IF NOT EXISTS gang_id uuid REFERENCES public.gangs(id) ON DELETE SET NULL;
