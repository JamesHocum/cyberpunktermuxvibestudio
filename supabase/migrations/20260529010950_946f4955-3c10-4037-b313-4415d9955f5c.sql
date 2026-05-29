
-- 1. agent_memory_snapshots
CREATE TABLE public.agent_memory_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  project_id uuid NOT NULL,
  session_id text NOT NULL DEFAULT 'default',
  summary text,
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  model text,
  persona jsonb NOT NULL DEFAULT '{}'::jsonb,
  device_label text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_memory_snapshots TO authenticated;
GRANT ALL ON public.agent_memory_snapshots TO service_role;

ALTER TABLE public.agent_memory_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own memory snapshots"
  ON public.agent_memory_snapshots FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users insert own memory snapshots"
  ON public.agent_memory_snapshots FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own memory snapshots"
  ON public.agent_memory_snapshots FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_agent_memory_user_project
  ON public.agent_memory_snapshots (user_id, project_id, created_at DESC);

-- 2. extension_link_codes
CREATE TABLE public.extension_link_codes (
  code text PRIMARY KEY,
  user_id uuid,
  scopes jsonb NOT NULL DEFAULT '["bridge:read","bridge:write"]'::jsonb,
  approved_token text,
  claimed_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '5 minutes'),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.extension_link_codes TO authenticated;
GRANT ALL ON public.extension_link_codes TO service_role;

ALTER TABLE public.extension_link_codes ENABLE ROW LEVEL SECURITY;

-- Owner of the linked account can see/approve their own pending codes; unauth code generation goes through service_role in the edge function
CREATE POLICY "Users view own link codes"
  ON public.extension_link_codes FOR SELECT TO authenticated
  USING (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "Users approve own link codes"
  ON public.extension_link_codes FOR UPDATE TO authenticated
  USING (user_id IS NULL OR user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 3. extension_context — two-way sync
ALTER TABLE public.extension_context
  ADD COLUMN IF NOT EXISTS direction text NOT NULL DEFAULT 'inbound',
  ADD COLUMN IF NOT EXISTS parent_id uuid,
  ADD COLUMN IF NOT EXISTS response text,
  ADD COLUMN IF NOT EXISTS response_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_extension_context_parent
  ON public.extension_context (parent_id);
CREATE INDEX IF NOT EXISTS idx_extension_context_user_direction
  ON public.extension_context (user_id, direction, created_at DESC);
