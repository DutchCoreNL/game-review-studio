-- Add active_event column to world_state for weekly events
ALTER TABLE public.world_state
ADD COLUMN active_event jsonb DEFAULT NULL;

COMMENT ON COLUMN public.world_state.active_event IS 'Currently active world event, e.g. {"id": "2x_xp_weekend", "name": "2x XP Weekend", "multiplier": 2, "ends_at": "..."}';
