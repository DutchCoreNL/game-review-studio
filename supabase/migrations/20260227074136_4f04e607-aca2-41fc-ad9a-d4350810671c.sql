
-- Tighten: only authenticated users (won't matter for service role which bypasses RLS)
DROP POLICY IF EXISTS "Service role can insert leaderboard" ON public.leaderboard_entries;
DROP POLICY IF EXISTS "Service role can update leaderboard" ON public.leaderboard_entries;

-- Block all direct client writes - only service role (edge function) can write
-- No INSERT or UPDATE policies = clients can't write directly
-- Service role bypasses RLS entirely, so the edge function still works
