
-- Drop restrictive policies
DROP POLICY IF EXISTS "Public read leaderboard" ON leaderboard_entries;
DROP POLICY IF EXISTS "Own insert leaderboard" ON leaderboard_entries;
DROP POLICY IF EXISTS "Own update leaderboard" ON leaderboard_entries;

-- Recreate as permissive
CREATE POLICY "Public read leaderboard" ON leaderboard_entries FOR SELECT USING (true);
CREATE POLICY "Own insert leaderboard" ON leaderboard_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own update leaderboard" ON leaderboard_entries FOR UPDATE USING (auth.uid() = user_id);
