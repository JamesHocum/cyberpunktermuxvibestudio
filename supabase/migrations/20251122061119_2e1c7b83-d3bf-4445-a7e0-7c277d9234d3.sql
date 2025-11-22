-- Fix Anonymous Access Policies on user_roles table
-- Drop existing policies
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

-- Recreate policies with explicit authenticated user checks
CREATE POLICY "Admins can delete roles" 
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  auth.uid() IS NOT NULL AND
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can insert roles" 
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL AND
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update roles" 
ON public.user_roles
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL AND
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Users can view own roles" 
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL AND
  user_id = auth.uid()
);