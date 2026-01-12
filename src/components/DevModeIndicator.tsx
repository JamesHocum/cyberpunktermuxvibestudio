import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Bug, User, Shield } from 'lucide-react';

/**
 * Development-only indicator showing current auth state and user role.
 * This component is completely tree-shaken from production builds.
 */
export function DevModeIndicator() {
  // This entire component only renders in development
  if (!import.meta.env.DEV) {
    return null;
  }

  const { user, isAuthenticated } = useAuth();
  const { roles, isLoading } = useUserRole();

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-background/95 backdrop-blur border border-border rounded-lg p-3 shadow-lg max-w-xs">
      <div className="flex items-center gap-2 text-xs font-mono">
        <Bug className="h-4 w-4 text-yellow-500" />
        <span className="text-yellow-500 font-semibold">DEV MODE</span>
      </div>
      
      <div className="mt-2 space-y-1 text-xs">
        <div className="flex items-center gap-2">
          <User className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">
            {isAuthenticated ? (
              <span className="text-green-400">{user?.email || 'Authenticated'}</span>
            ) : (
              <span className="text-red-400">Not authenticated</span>
            )}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Shield className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">
            {isLoading ? (
              <span className="text-yellow-400">Loading roles...</span>
            ) : roles.length > 0 ? (
              <span className="text-cyan-400">{roles.join(', ')}</span>
            ) : (
              <span className="text-muted-foreground">No roles</span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

export default DevModeIndicator;
