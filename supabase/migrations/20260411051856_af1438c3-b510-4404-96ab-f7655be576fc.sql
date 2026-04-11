
-- Create user_plans table
CREATE TABLE public.user_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'premium')),
  daily_limit integer NOT NULL DEFAULT 15,
  monthly_limit integer NOT NULL DEFAULT 100,
  allowed_models text[] NOT NULL DEFAULT ARRAY['google/gemini-3-flash-preview', 'google/gemini-2.5-flash-lite'],
  byok_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own plan"
  ON public.user_plans FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_plans_updated_at
  BEFORE UPDATE ON public.user_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create ai_usage_log table
CREATE TABLE public.ai_usage_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  model_used text,
  tokens_used integer NOT NULL DEFAULT 0,
  source text NOT NULL DEFAULT 'managed' CHECK (source IN ('managed', 'byok'))
);

ALTER TABLE public.ai_usage_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage"
  ON public.ai_usage_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Index for efficient daily/monthly count queries
CREATE INDEX idx_ai_usage_log_user_created ON public.ai_usage_log (user_id, created_at DESC);
