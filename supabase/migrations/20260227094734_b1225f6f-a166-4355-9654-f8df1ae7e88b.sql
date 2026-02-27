-- Add full game state save column to player_state
ALTER TABLE public.player_state 
ADD COLUMN IF NOT EXISTS save_data jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS save_version integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_save_at timestamp with time zone DEFAULT NULL;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_player_state_user_save ON public.player_state (user_id, save_version DESC);