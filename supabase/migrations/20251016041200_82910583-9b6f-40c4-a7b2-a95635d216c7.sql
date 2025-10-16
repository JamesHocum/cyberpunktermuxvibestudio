-- Add user_id columns to all tables
ALTER TABLE projects ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE project_files ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE file_tree ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Allow all operations on projects" ON projects;
DROP POLICY IF EXISTS "Allow all operations on project_files" ON project_files;
DROP POLICY IF EXISTS "Allow all operations on file_tree" ON file_tree;

-- Create secure RLS policies for projects
CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- Create secure RLS policies for project_files
CREATE POLICY "Users can view files in own projects" ON project_files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_files.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert files in own projects" ON project_files
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_files.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update files in own projects" ON project_files
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_files.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete files in own projects" ON project_files
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_files.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- Create secure RLS policies for file_tree
CREATE POLICY "Users can view own project trees" ON file_tree
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = file_tree.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own project trees" ON file_tree
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = file_tree.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own project trees" ON file_tree
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = file_tree.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own project trees" ON file_tree
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = file_tree.project_id 
      AND projects.user_id = auth.uid()
    )
  );