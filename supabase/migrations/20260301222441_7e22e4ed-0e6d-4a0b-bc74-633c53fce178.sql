
CREATE TABLE public.project_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  export_type TEXT NOT NULL,
  project_name TEXT NOT NULL,
  file_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.project_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own exports"
  ON public.project_exports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own exports"
  ON public.project_exports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own exports"
  ON public.project_exports FOR DELETE
  USING (auth.uid() = user_id);
