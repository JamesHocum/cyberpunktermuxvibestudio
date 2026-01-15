import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface GitSyncStatus {
  lastSynced: Date | null;
  unsyncedChanges: number;
  linkedRepo: string | null;
  branch: string | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useGitSyncStatus(projectId?: string) {
  const [status, setStatus] = useState<GitSyncStatus>({
    lastSynced: null,
    unsyncedChanges: 0,
    linkedRepo: null,
    branch: null,
    isConnected: false,
    isLoading: false,
    error: null,
  });

  const fetchStatus = useCallback(async () => {
    if (!projectId) {
      setStatus(prev => ({ ...prev, isLoading: false, isConnected: false }));
      return;
    }

    setStatus(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setStatus(prev => ({ 
          ...prev, 
          isLoading: false, 
          isConnected: false,
          error: null 
        }));
        return;
      }

      const { data, error } = await supabase.functions.invoke('git-sync', {
        body: { action: 'status', projectId }
      });

      if (error) throw error;

      setStatus({
        lastSynced: data?.lastSyncedAt ? new Date(data.lastSyncedAt) : null,
        unsyncedChanges: data?.unsyncedChanges || 0,
        linkedRepo: data?.repo || null,
        branch: data?.branch || 'main',
        isConnected: !!data?.connected,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      console.error('Git sync status error:', err);
      setStatus(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch status',
      }));
    }
  }, [projectId]);

  useEffect(() => {
    fetchStatus();
    
    // Poll every 60 seconds
    const interval = setInterval(fetchStatus, 60000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const formatLastSync = useCallback(() => {
    if (!status.lastSynced) return 'Never synced';
    
    const now = new Date();
    const diff = now.getTime() - status.lastSynced.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }, [status.lastSynced]);

  return {
    ...status,
    formatLastSync,
    refresh: fetchStatus,
  };
}
