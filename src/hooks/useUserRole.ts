import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface UserRoleState {
  roles: AppRole[];
  isLoading: boolean;
  error: Error | null;
}

export function useUserRole() {
  const { user, isAuthenticated } = useAuth();
  const [state, setState] = useState<UserRoleState>({
    roles: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setState({ roles: [], isLoading: false, error: null });
      return;
    }

    const fetchRoles = async () => {
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (error) throw error;

        const roles = data?.map((r) => r.role) || [];
        setState({ roles, isLoading: false, error: null });
      } catch (err) {
        setState({ roles: [], isLoading: false, error: err as Error });
      }
    };

    fetchRoles();
  }, [user, isAuthenticated]);

  const hasRole = useCallback(
    (role: AppRole): boolean => {
      return state.roles.includes(role);
    },
    [state.roles]
  );

  const isAdmin = useCallback((): boolean => {
    return hasRole('admin');
  }, [hasRole]);

  const isModerator = useCallback((): boolean => {
    return hasRole('moderator') || hasRole('admin');
  }, [hasRole]);

  return {
    roles: state.roles,
    isLoading: state.isLoading,
    error: state.error,
    hasRole,
    isAdmin,
    isModerator,
  };
}

export default useUserRole;
