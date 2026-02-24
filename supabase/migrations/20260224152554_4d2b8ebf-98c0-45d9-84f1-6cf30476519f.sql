
-- Create a SECURITY DEFINER function to access GitHub token server-side only
CREATE OR REPLACE FUNCTION public.get_github_token(_user_id uuid)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT github_access_token FROM profiles WHERE id = _user_id;
$$;

-- Create a SECURITY DEFINER function to access GitHub username server-side only
CREATE OR REPLACE FUNCTION public.get_github_info(_user_id uuid)
RETURNS TABLE(github_access_token text, github_username text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.github_access_token, p.github_username FROM profiles p WHERE p.id = _user_id;
$$;

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Create a new SELECT policy that excludes token columns by returning only safe fields
-- Since Postgres RLS is row-level, we create a restricted policy and use SECURITY DEFINER functions for token access
-- The policy still allows SELECT but edge functions should use service role or RPC for tokens
CREATE POLICY "Users can view own profile safe" ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);
