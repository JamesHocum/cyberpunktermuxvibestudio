-- Drop any existing INSERT policy on admin_audit_log
DROP POLICY IF EXISTS "System can insert audit logs" ON public.admin_audit_log;

-- Create a SECURITY DEFINER function for controlled audit logging
-- Only admins can log actions through this function
CREATE OR REPLACE FUNCTION public.log_admin_action(
  _action TEXT,
  _target_user_id UUID,
  _details JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can log actions
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can log actions';
  END IF;
  
  INSERT INTO admin_audit_log (admin_id, action, target_user_id, details)
  VALUES (auth.uid(), _action, _target_user_id, _details);
END;
$$;

-- Ensure no direct INSERT is allowed (RLS blocks it since no INSERT policy exists)
-- The table already has RLS enabled with only a SELECT policy for admins