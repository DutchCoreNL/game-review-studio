
-- 1. Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- 3. Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Security definer function to check roles (avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 5. RLS policies: only admins can read/manage roles
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 6. Admin policy on leaderboard_entries: admins can delete entries
CREATE POLICY "Admins can delete leaderboard entries"
  ON public.leaderboard_entries FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 7. Admin policy on leaderboard_entries: admins can update entries
CREATE POLICY "Admins can update leaderboard entries"
  ON public.leaderboard_entries FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
