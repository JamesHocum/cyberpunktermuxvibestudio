import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Loader2, Lock, ShieldX } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: AppRole;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, isDevBypass } = useAuth();
  const { hasRole, isLoading: roleLoading } = useUserRole();

  const isLoading = authLoading || (requiredRole && roleLoading);

  useEffect(() => {
    // Skip redirect if dev bypass is active
    if (isDevBypass) return;
    
    if (!authLoading && !isAuthenticated) {
      navigate('/auth', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate, isDevBypass]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-studio-bg flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-cyan-900/20" />
        <div className="relative z-10 text-center">
          <Loader2 className="h-12 w-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-purple-400">Initializing system...</p>
        </div>
      </div>
    );
  }

  // Allow access if dev bypass is active
  if (isDevBypass) {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-studio-bg flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-cyan-900/20" />
        <div className="relative z-10 text-center">
          <Lock className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-400">Access Denied. Redirecting...</p>
        </div>
      </div>
    );
  }

  // Check role if required
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="min-h-screen bg-studio-bg flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-cyan-900/20" />
        <div className="relative z-10 text-center">
          <ShieldX className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <p className="text-orange-400">Insufficient Permissions</p>
          <p className="text-muted-foreground text-sm mt-2">
            Required role: <span className="text-primary font-mono">{requiredRole}</span>
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default ProtectedRoute;
