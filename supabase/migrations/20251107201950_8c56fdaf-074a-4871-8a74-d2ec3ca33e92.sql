-- Comprehensive fix: Add explicit authentication restrictions to all RLS policies
-- This addresses both agent_security and supabase scanner warnings about anonymous access

-- ============================================
-- Fix user_roles table policies
-- ============================================
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

CREATE POLICY "Admins can delete roles" 
ON public.user_roles 
FOR DELETE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert roles" 
ON public.user_roles 
FOR INSERT 
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update roles" 
ON public.user_roles 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

-- ============================================
-- Fix admin_audit_log table policies
-- ============================================
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.admin_audit_log;

CREATE POLICY "Admins can view audit logs" 
ON public.admin_audit_log 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- Fix file_tree table policies
-- ============================================
DROP POLICY IF EXISTS "Users can delete own project trees" ON public.file_tree;
DROP POLICY IF EXISTS "Users can insert own project trees" ON public.file_tree;
DROP POLICY IF EXISTS "Users can update own project trees" ON public.file_tree;
DROP POLICY IF EXISTS "Users can view own project trees" ON public.file_tree;

CREATE POLICY "Users can delete own project trees" 
ON public.file_tree 
FOR DELETE 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM projects 
  WHERE projects.id = file_tree.project_id 
  AND projects.user_id = auth.uid()
));

CREATE POLICY "Users can insert own project trees" 
ON public.file_tree 
FOR INSERT 
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM projects 
  WHERE projects.id = file_tree.project_id 
  AND projects.user_id = auth.uid()
));

CREATE POLICY "Users can update own project trees" 
ON public.file_tree 
FOR UPDATE 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM projects 
  WHERE projects.id = file_tree.project_id 
  AND projects.user_id = auth.uid()
));

CREATE POLICY "Users can view own project trees" 
ON public.file_tree 
FOR SELECT 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM projects 
  WHERE projects.id = file_tree.project_id 
  AND projects.user_id = auth.uid()
));

-- ============================================
-- Fix project_analysis table policies
-- ============================================
DROP POLICY IF EXISTS "Users can view analysis of own projects" ON public.project_analysis;

CREATE POLICY "Users can view analysis of own projects" 
ON public.project_analysis 
FOR SELECT 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM projects 
  WHERE projects.id = project_analysis.project_id 
  AND projects.user_id = auth.uid()
));

-- Note: "System can insert analysis" policy intentionally allows unauthenticated access for system operations

-- ============================================
-- Fix project_files table policies
-- ============================================
DROP POLICY IF EXISTS "Users can delete files in own projects" ON public.project_files;
DROP POLICY IF EXISTS "Users can insert files in own projects" ON public.project_files;
DROP POLICY IF EXISTS "Users can update files in own projects" ON public.project_files;
DROP POLICY IF EXISTS "Users can view files in own projects" ON public.project_files;

CREATE POLICY "Users can delete files in own projects" 
ON public.project_files 
FOR DELETE 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM projects 
  WHERE projects.id = project_files.project_id 
  AND projects.user_id = auth.uid()
));

CREATE POLICY "Users can insert files in own projects" 
ON public.project_files 
FOR INSERT 
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM projects 
  WHERE projects.id = project_files.project_id 
  AND projects.user_id = auth.uid()
));

CREATE POLICY "Users can update files in own projects" 
ON public.project_files 
FOR UPDATE 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM projects 
  WHERE projects.id = project_files.project_id 
  AND projects.user_id = auth.uid()
));

CREATE POLICY "Users can view files in own projects" 
ON public.project_files 
FOR SELECT 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM projects 
  WHERE projects.id = project_files.project_id 
  AND projects.user_id = auth.uid()
));

-- ============================================
-- Fix projects table policies
-- ============================================
DROP POLICY IF EXISTS "Admins can view all projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can insert own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;

CREATE POLICY "Admins can view all projects" 
ON public.projects 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR user_id = auth.uid());

CREATE POLICY "Users can delete own projects" 
ON public.projects 
FOR DELETE 
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own projects" 
ON public.projects 
FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own projects" 
ON public.projects 
FOR UPDATE 
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can view own projects" 
ON public.projects 
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());