-- Fix admin_audit_log INSERT policy
-- Drop the overly permissive policy that allows any authenticated user to insert
DROP POLICY IF EXISTS "System can insert audit logs" ON public.admin_audit_log;

-- The service role bypasses RLS, so Edge Functions using SUPABASE_SERVICE_ROLE_KEY
-- can still insert audit logs without any policy needed.
-- This prevents authenticated users from poisoning the audit log.