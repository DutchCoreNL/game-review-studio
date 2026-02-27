
-- Remove direct client INSERT/UPDATE on leaderboard_entries so only backend function can write
DROP POLICY IF EXISTS "Own insert leaderboard " ON public.leaderboard_entries;
DROP POLICY IF EXISTS "Own update leaderboard " ON public.leaderboard_entries;

-- Keep public read
-- Add a policy that allows service_role to insert/update (edge function uses service role key)
CREATE POLICY "Service role can insert leaderboard"
ON public.leaderboard_entries
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Service role can update leaderboard"
ON public.leaderboard_entries
FOR UPDATE
USING (true);
