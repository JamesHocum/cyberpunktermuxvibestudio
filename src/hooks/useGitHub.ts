import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GitHubStatus {
  connected: boolean;
  username: string | null;
  avatarUrl: string | null;
  loading: boolean;
}

interface GitHubRepo {
  name: string;
  full_name: string;
  html_url: string;
  default_branch: string;
}

export const useGitHub = () => {
  const [status, setStatus] = useState<GitHubStatus>({
    connected: false,
    username: null,
    avatarUrl: null,
    loading: true,
  });
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  // Check GitHub connection status
  const checkStatus = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('github-oauth', {
        body: { action: 'status' }
      });

      if (error) throw error;

      setStatus({
        connected: data.connected,
        username: data.username,
        avatarUrl: data.avatar_url,
        loading: false,
      });

      return data.connected;
    } catch (err) {
      console.error('[GitHub] Status check failed:', err);
      setStatus(prev => ({ ...prev, loading: false }));
      return false;
    }
  }, []);

  // Initiate OAuth flow
  const connect = useCallback(async () => {
    setIsAuthorizing(true);
    
    try {
      const redirectUri = `${window.location.origin}/github/callback`;
      
      const { data, error } = await supabase.functions.invoke('github-oauth', {
        body: { 
          action: 'authorize',
          redirectUri 
        }
      });

      if (error) throw error;

      if (data.setup_required) {
        toast.error('GitHub OAuth not configured. Please add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET secrets.');
        return;
      }

      // Store state for verification
      sessionStorage.setItem('github_oauth_state', data.state);
      
      // Open GitHub OAuth in a popup
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const popup = window.open(
        data.url,
        'github-oauth',
        `width=${width},height=${height},left=${left},top=${top},popup=1`
      );

      // Poll for popup close and check for success
      const pollInterval = setInterval(async () => {
        if (popup?.closed) {
          clearInterval(pollInterval);
          setIsAuthorizing(false);
          
          // Check if connection was successful
          const connected = await checkStatus();
          if (connected) {
            toast.success('GitHub connected successfully!');
          }
        }
      }, 500);

    } catch (err) {
      console.error('[GitHub] Connect failed:', err);
      toast.error('Failed to connect to GitHub');
      setIsAuthorizing(false);
    }
  }, [checkStatus]);

  // Handle OAuth callback (called from callback page)
  const handleCallback = useCallback(async (code: string, state: string) => {
    try {
      const savedState = sessionStorage.getItem('github_oauth_state');
      
      if (state !== savedState) {
        throw new Error('Invalid state parameter');
      }

      sessionStorage.removeItem('github_oauth_state');

      const redirectUri = `${window.location.origin}/github/callback`;

      const { data, error } = await supabase.functions.invoke('github-oauth', {
        body: { 
          action: 'callback',
          code,
          redirectUri
        }
      });

      if (error) throw error;

      setStatus({
        connected: true,
        username: data.username,
        avatarUrl: data.avatar_url,
        loading: false,
      });

      return true;
    } catch (err) {
      console.error('[GitHub] Callback failed:', err);
      return false;
    }
  }, []);

  // Disconnect GitHub
  const disconnect = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('github-oauth', {
        body: { action: 'disconnect' }
      });

      if (error) throw error;

      setStatus({
        connected: false,
        username: null,
        avatarUrl: null,
        loading: false,
      });

      setRepos([]);
      toast.success('GitHub disconnected');
      return true;
    } catch (err) {
      console.error('[GitHub] Disconnect failed:', err);
      toast.error('Failed to disconnect GitHub');
      return false;
    }
  }, []);

  // Fetch user's repositories (called from git-sync edge function)
  const fetchRepos = useCallback(async () => {
    if (!status.connected) return [];

    try {
      const { data, error } = await supabase.functions.invoke('git-sync', {
        body: { action: 'list-repos' }
      });

      if (error) throw error;

      setRepos(data.repos || []);
      return data.repos || [];
    } catch (err) {
      console.error('[GitHub] Fetch repos failed:', err);
      return [];
    }
  }, [status.connected]);

  // Push to GitHub
  const push = useCallback(async (
    projectId: string, 
    files: Array<{ path: string; content: string }>,
    commitMessage: string
  ) => {
    try {
      const { data, error } = await supabase.functions.invoke('git-sync', {
        body: { 
          action: 'push',
          projectId,
          files,
          message: commitMessage
        }
      });

      if (error) throw error;

      toast.success(`Pushed ${files.length} files to GitHub`);
      return data;
    } catch (err) {
      console.error('[GitHub] Push failed:', err);
      toast.error('Failed to push to GitHub');
      throw err;
    }
  }, []);

  // Pull from GitHub
  const pull = useCallback(async (projectId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('git-sync', {
        body: { 
          action: 'pull',
          projectId
        }
      });

      if (error) throw error;

      toast.success('Pulled latest changes from GitHub');
      return data.files || [];
    } catch (err) {
      console.error('[GitHub] Pull failed:', err);
      toast.error('Failed to pull from GitHub');
      throw err;
    }
  }, []);

  // Check status on mount
  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Handle OAuth callback if we're on the callback route
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (code && state) {
      handleCallback(code, state).then((success) => {
        // Clean up URL
        window.history.replaceState({}, '', window.location.pathname);
        
        if (success) {
          // Close popup if this is a popup window
          if (window.opener) {
            window.close();
          }
        }
      });
    }
  }, [handleCallback]);

  return {
    ...status,
    isAuthorizing,
    repos,
    connect,
    disconnect,
    fetchRepos,
    push,
    pull,
    checkStatus,
  };
};
