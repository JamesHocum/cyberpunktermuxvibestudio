import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GitBranch, GitCommit, GitPullRequest, Upload, Download, X, RefreshCw, Loader2, Github, Link } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RepoSelector } from './RepoSelector';
import { useGitHub } from '@/hooks/useGitHub';

interface GitPanelProps {
  isVisible: boolean;
  onClose: () => void;
  projectId?: string;
  files?: Array<{ path: string; content: string }>;
}

export const GitPanel = ({ isVisible, onClose, projectId, files = [] }: GitPanelProps) => {
  const [commitMessage, setCommitMessage] = useState('');
  const [branch, setBranch] = useState('main');
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [linkedRepo, setLinkedRepo] = useState<string | null>(null);
  const [status, setStatus] = useState<string[]>(() => {
    // Show actual files from project
    return files.length > 0 
      ? files.slice(0, 10).map(f => `modified: ${f.path}`)
      : ['No files to commit'];
  });
  const [recentCommits, setRecentCommits] = useState([
    { message: 'Initial matrix setup', hash: 'a1b2c3d', time: '2 hours ago' },
    { message: 'Add neural interface components', hash: 'e4f5g6h', time: '5 hours ago' },
    { message: 'Configure quantum build', hash: 'i7j8k9l', time: '1 day ago' }
  ]);
  
  const { connected: githubConnected, username: githubUsername } = useGitHub();

  // Fetch linked repo on mount
  useEffect(() => {
    const fetchLinkedRepo = async () => {
      if (!projectId) return;
      
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('github_repo, github_branch')
          .eq('id', projectId)
          .single();
          
        if (data?.github_repo) {
          setLinkedRepo(data.github_repo);
          if (data.github_branch) {
            setBranch(data.github_branch);
          }
        }
      } catch (err) {
        console.error('[GitPanel] Failed to fetch linked repo:', err);
      }
    };
    
    fetchLinkedRepo();
  }, [projectId]);

  if (!isVisible) return null;

  const handleCommit = async () => {
    if (!commitMessage.trim()) {
      toast.error('Please enter a commit message');
      return;
    }

    if (!projectId) {
      toast.error('No project selected. Save your project first.');
      return;
    }

    setIsLoading(true);
    setSyncStatus('syncing');

    try {
      // Call git-sync edge function
      const { data, error } = await supabase.functions.invoke('git-sync', {
        body: { 
          projectId,
          commitMessage: commitMessage.trim(),
          branch
        }
      });

      if (error) throw error;

      // Add to recent commits
      setRecentCommits(prev => [
        { message: commitMessage, hash: `${Date.now().toString(16).slice(-7)}`, time: 'just now' },
        ...prev.slice(0, 4)
      ]);

      setCommitMessage('');
      setStatus(['No changes detected']);
      setSyncStatus('synced');
      toast.success('Changes committed and synced!');
    } catch (error) {
      console.error('[GIT] Sync error:', error);
      setSyncStatus('error');
      toast.error('Failed to sync with repository');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePush = async () => {
    if (!projectId) {
      toast.error('No project selected');
      return;
    }

    setIsLoading(true);
    setSyncStatus('syncing');

    try {
      const { data, error } = await supabase.functions.invoke('git-sync', {
        body: { 
          projectId,
          operation: 'push',
          branch
        }
      });

      if (error) throw error;

      setSyncStatus('synced');
      toast.success('Pushed to remote repository!');
    } catch (error) {
      console.error('[GIT] Push error:', error);
      setSyncStatus('error');
      toast.error('Failed to push to remote');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePull = async () => {
    if (!projectId) {
      toast.error('No project selected');
      return;
    }

    setIsLoading(true);
    setSyncStatus('syncing');

    try {
      const { data, error } = await supabase.functions.invoke('git-sync', {
        body: { 
          projectId,
          operation: 'pull',
          branch
        }
      });

      if (error) throw error;

      setSyncStatus('synced');
      toast.success('Pulled latest changes!');
    } catch (error) {
      console.error('[GIT] Pull error:', error);
      setSyncStatus('error');
      toast.error('Failed to pull from remote');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    // Refresh status from files prop
    if (files.length > 0) {
      setStatus(files.slice(0, 10).map(f => `modified: ${f.path}`));
    } else {
      setStatus(['No changes detected']);
    }
    toast.success('Status refreshed');
  };

  const getSyncBadge = () => {
    switch (syncStatus) {
      case 'syncing':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 font-terminal">SYNCING...</Badge>;
      case 'synced':
        return <Badge className="bg-green-500/20 neon-green border-green-500/30 font-terminal">SYNCED</Badge>;
      case 'error':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 font-terminal">ERROR</Badge>;
      default:
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 font-terminal">READY</Badge>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-studio-sidebar cyber-border rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col terminal-glow">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b cyber-border bg-studio-header">
          <div className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 neon-purple pulse-glow" />
            <h2 className="font-cyber text-lg neon-green">GIT_VERSION_CONTROL.SYS</h2>
            {getSyncBadge()}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="neon-purple hover:neon-glow"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {/* GitHub Connection Status */}
          {!githubConnected && (
            <div className="cyber-border rounded p-3 bg-yellow-500/10 border-yellow-500/30">
              <div className="flex items-center gap-2 text-yellow-400 font-terminal text-sm">
                <Github className="h-4 w-4" />
                <span>GitHub not connected. Connect via the header button to enable sync.</span>
              </div>
            </div>
          )}

          {/* Repository Selector */}
          {githubConnected && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-terminal text-sm neon-purple">
                <Link className="h-4 w-4" />
                Repository
              </div>
              <RepoSelector 
                projectId={projectId} 
                onRepoSelect={(repo) => {
                  setLinkedRepo(repo?.full_name || null);
                  if (repo?.default_branch) {
                    setBranch(repo.default_branch);
                  }
                }}
              />
            </div>
          )}

          {/* Branch Info */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4 neon-green" />
                <span className="font-terminal text-sm matrix-text">Current Branch:</span>
                <Badge className="neon-green bg-green-500/20 border-green-500/30 font-terminal">
                  {branch}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
                className="neon-purple hover:neon-glow"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-terminal text-sm neon-purple">
              <GitCommit className="h-4 w-4" />
              Changed Files ({status.filter(s => s !== 'No changes detected' && s !== 'No files to commit').length})
            </div>
            <ScrollArea className="h-40 cyber-border rounded p-2 bg-studio-terminal">
              {status.length > 0 && status[0] !== 'No changes detected' && status[0] !== 'No files to commit' ? (
                <div className="space-y-1">
                  {status.map((file, idx) => (
                    <div key={idx} className="text-sm font-terminal matrix-text hover:neon-glow transition-colors p-1">
                      {file}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm font-terminal matrix-text text-center py-8">
                  No changes detected in quantum repository
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Commit Section */}
          <div className="space-y-2">
            <label className="font-terminal text-sm neon-green">Commit Message:</label>
            <Input
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="Enter neural commit message..."
              className="cyber-border bg-studio-terminal matrix-text font-terminal"
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && commitMessage.trim()) {
                  handleCommit();
                }
              }}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={handleCommit}
              disabled={!commitMessage.trim() || isLoading || !linkedRepo}
              className="flex-1 neon-glow cyber-border"
              title={!linkedRepo ? 'Link a repository first' : ''}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <GitCommit className="h-4 w-4 mr-2 neon-green" />
              )}
              Commit & Sync
            </Button>
            <Button
              onClick={handlePush}
              variant="outline"
              disabled={isLoading || !linkedRepo}
              className="cyber-border neon-purple hover:neon-glow"
              title={!linkedRepo ? 'Link a repository first' : ''}
            >
              <Upload className="h-4 w-4 mr-2" />
              Push
            </Button>
            <Button
              onClick={handlePull}
              variant="outline"
              disabled={isLoading || !linkedRepo}
              className="cyber-border neon-green hover:neon-glow"
              title={!linkedRepo ? 'Link a repository first' : ''}
            >
              <Download className="h-4 w-4 mr-2" />
              Pull
            </Button>
          </div>

          {/* Recent Commits */}
          <div className="space-y-2">
            <div className="font-terminal text-sm neon-purple">Recent Commits:</div>
            <div className="cyber-border rounded p-2 bg-studio-terminal space-y-2">
              {recentCommits.map((commit, idx) => (
                <div key={idx} className="text-xs font-terminal matrix-text border-l-2 border-neon-green pl-2 py-1 flex justify-between">
                  <span>{commit.message}</span>
                  <span className="text-muted-foreground">{commit.hash} • {commit.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
