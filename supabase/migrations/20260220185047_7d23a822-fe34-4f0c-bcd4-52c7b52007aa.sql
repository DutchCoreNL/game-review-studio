
-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Leaderboard entries table
CREATE TABLE public.leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  username TEXT NOT NULL,
  rep INTEGER NOT NULL DEFAULT 0,
  cash INTEGER NOT NULL DEFAULT 0,
  day INTEGER NOT NULL DEFAULT 1,
  level INTEGER NOT NULL DEFAULT 1,
  districts_owned INTEGER NOT NULL DEFAULT 0,
  crew_size INTEGER NOT NULL DEFAULT 0,
  karma INTEGER NOT NULL DEFAULT 0,
  backstory TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.leaderboard_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read leaderboard" ON public.leaderboard_entries FOR SELECT USING (true);
CREATE POLICY "Own insert leaderboard" ON public.leaderboard_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own update leaderboard" ON public.leaderboard_entries FOR UPDATE USING (auth.uid() = user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_leaderboard_updated_at
  BEFORE UPDATE ON public.leaderboard_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
