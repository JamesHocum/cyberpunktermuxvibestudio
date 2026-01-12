import { ReactNode } from 'react';
import { useUserRole } from '@/hooks/useUserRole';
import { Loader2, ShieldX } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface RoleGuardProps {
  children: ReactNode;
  requiredRole: AppRole;
  fallback?: ReactNode;
  showAccessDenied?: boolean;
}

export function RoleGuard({
  children,
  requiredRole,
  fallback,
  showAccessDenied = true,
}: RoleGuardProps) {
  const { hasRole, isLoading } = useUserRole();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 text-primary animate-spin" />
        <span className="ml-2 text-muted-foreground">Checking permissions...</span>
      </div>
    );
  }

  if (!hasRole(requiredRole)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showAccessDenied) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <ShieldX className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Access Denied
          </h3>
          <p className="text-muted-foreground">
            You need the <span className="text-primary font-mono">{requiredRole}</span> role to access this content.
          </p>
        </div>
      );
    }

    return null;
  }

  return <>{children}</>;
}

export default RoleGuard;
