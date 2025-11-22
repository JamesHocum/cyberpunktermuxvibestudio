-- Fix Anonymous Access Policies on all remaining tables
-- Drop and recreate policies with explicit authenticated user checks

-- admin_audit_log
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.admin_audit_log;
CREATE POLICY "Admins can view audit logs" 
ON public.admin_audit_log
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL AND
  has_role(auth.uid(), 'admin'::app_role)
);

-- file_tree
DROP POLICY IF EXISTS "Users can delete own project trees" ON public.file_tree;
DROP POLICY IF EXISTS "Users can insert own project trees" ON public.file_tree;
DROP POLICY IF EXISTS "Users can update own project trees" ON public.file_tree;
DROP POLICY IF EXISTS "Users can view own project trees" ON public.file_tree;

CREATE POLICY "Users can delete own project trees" 
ON public.file_tree
FOR DELETE
TO authenticated
USING (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = file_tree.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert own project trees" 
ON public.file_tree
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = file_tree.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own project trees" 
ON public.file_tree
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = file_tree.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view own project trees" 
ON public.file_tree
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = file_tree.project_id 
    AND projects.user_id = auth.uid()
  )
);

-- project_analysis
DROP POLICY IF EXISTS "Users can view analysis of own projects" ON public.project_analysis;
DROP POLICY IF EXISTS "System can insert analysis" ON public.project_analysis;

CREATE POLICY "Users can view analysis of own projects" 
ON public.project_analysis
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_analysis.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "System can insert analysis" 
ON public.project_analysis
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_analysis.project_id 
    AND projects.user_id = auth.uid()
  )
);

-- project_files
DROP POLICY IF EXISTS "Users can delete files in own projects" ON public.project_files;
DROP POLICY IF EXISTS "Users can insert files in own projects" ON public.project_files;
DROP POLICY IF EXISTS "Users can update files in own projects" ON public.project_files;
DROP POLICY IF EXISTS "Users can view files in own projects" ON public.project_files;

CREATE POLICY "Users can delete files in own projects" 
ON public.project_files
FOR DELETE
TO authenticated
USING (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_files.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert files in own projects" 
ON public.project_files
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_files.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update files in own projects" 
ON public.project_files
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_files.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view files in own projects" 
ON public.project_files
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_files.project_id 
    AND projects.user_id = auth.uid()
  )
);

-- projects
DROP POLICY IF EXISTS "Admins can view all projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can insert own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;

CREATE POLICY "Admins can view all projects" 
ON public.projects
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL AND
  (has_role(auth.uid(), 'admin'::app_role) OR user_id = auth.uid())
);

CREATE POLICY "Users can delete own projects" 
ON public.projects
FOR DELETE
TO authenticated
USING (
  auth.uid() IS NOT NULL AND
  user_id = auth.uid()
);

CREATE POLICY "Users can insert own projects" 
ON public.projects
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL AND
  user_id = auth.uid()
);

CREATE POLICY "Users can update own projects" 
ON public.projects
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL AND
  user_id = auth.uid()
);

CREATE POLICY "Users can view own projects" 
ON public.projects
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL AND
  user_id = auth.uid()
);