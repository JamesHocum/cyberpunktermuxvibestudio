CREATE TABLE public.extension_context (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  source TEXT NOT NULL DEFAULT 'browser-extension',
  origin_url TEXT,
  page_title TEXT,
  selection TEXT,
  prompt TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  consumed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  consumed_at TIMESTAMPTZ
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.extension_context TO authenticated;
GRANT ALL ON public.extension_context TO service_role;

ALTER TABLE public.extension_context ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own bridge context"
  ON public.extension_context FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users insert their own bridge context"
  ON public.extension_context FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update their own bridge context"
  ON public.extension_context FOR UPDATE
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users delete their own bridge context"
  ON public.extension_context FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_extension_context_user_unconsumed
  ON public.extension_context (user_id, consumed, created_at DESC);