ALTER TABLE public.world_state ADD COLUMN maintenance_mode boolean NOT NULL DEFAULT false;
ALTER TABLE public.world_state ADD COLUMN maintenance_message text DEFAULT null;