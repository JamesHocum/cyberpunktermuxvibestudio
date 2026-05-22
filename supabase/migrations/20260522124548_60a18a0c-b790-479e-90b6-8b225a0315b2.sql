CREATE TABLE public.workspace_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  label text,
  reason text NOT NULL DEFAULT 'manual',
  file_count integer NOT NULL DEFAULT 0,
  size_bytes integer NOT NULL DEFAULT 0,
  files jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_workspace_snapshots_project ON public.workspace_snapshots(project_id, created_at DESC);

ALTER TABLE public.workspace_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own project snapshots"
  ON public.workspace_snapshots FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM public.projects WHERE projects.id = workspace_snapshots.project_id AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users insert own project snapshots"
  ON public.workspace_snapshots FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM public.projects WHERE projects.id = workspace_snapshots.project_id AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users delete own project snapshots"
  ON public.workspace_snapshots FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM public.projects WHERE projects.id = workspace_snapshots.project_id AND projects.user_id = auth.uid()
  ));