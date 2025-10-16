-- Add project automation columns
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS last_synced_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS auto_initialized boolean DEFAULT false;

-- Create project analysis table
CREATE TABLE IF NOT EXISTS public.project_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  analysis_type text NOT NULL,
  findings jsonb,
  suggestions jsonb,
  score integer,
  analyzed_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_analysis ENABLE ROW LEVEL SECURITY;

-- RLS policies for project_analysis
CREATE POLICY "Users can view analysis of own projects"
ON public.project_analysis
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_analysis.project_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "System can insert analysis"
ON public.project_analysis
FOR INSERT
WITH CHECK (true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_project_analysis_project_id ON public.project_analysis(project_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);