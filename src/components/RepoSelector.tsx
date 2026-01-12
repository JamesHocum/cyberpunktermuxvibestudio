import React, { useEffect, useState } from 'react';
import { Check, ChevronsUpDown, Github, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GitHubRepo {
  name: string;
  full_name: string;
  html_url: string;
  default_branch: string;
}

interface RepoSelectorProps {
  projectId?: string;
  onRepoSelect?: (repo: GitHubRepo | null) => void;
  className?: string;
}

export const RepoSelector = ({ projectId, onRepoSelect, className }: RepoSelectorProps) => {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [currentRepo, setCurrentRepo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [linking, setLinking] = useState(false);

  // Fetch repos from GitHub
  const fetchRepos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('git-sync', {
        body: { action: 'list-repos' }
      });

      if (error) throw error;

      if (data.repos) {
        setRepos(data.repos);
      } else if (data.error) {
        toast.error(data.error);
      }
    } catch (err) {
      console.error('[RepoSelector] Failed to fetch repos:', err);
      toast.error('Failed to fetch repositories');
    } finally {
      setLoading(false);
    }
  };

  // Get current linked repo for project
  const fetchCurrentRepo = async () => {
    if (!projectId) return;

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('github_repo, github_url, github_branch')
        .eq('id', projectId)
        .single();

      if (error) throw error;

      if (data?.github_repo) {
        setCurrentRepo(data.github_repo);
        setSelectedRepo(data.github_repo);
      }
    } catch (err) {
      console.error('[RepoSelector] Failed to fetch current repo:', err);
    }
  };

  // Link selected repo to project
  const linkRepo = async () => {
    if (!projectId || !selectedRepo) {
      toast.error('Please select a repository');
      return;
    }

    const repo = repos.find(r => r.full_name === selectedRepo);
    if (!repo) return;

    setLinking(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          github_repo: repo.full_name,
          github_url: repo.html_url,
          github_branch: repo.default_branch,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId);

      if (error) throw error;

      setCurrentRepo(repo.full_name);
      onRepoSelect?.(repo);
      toast.success(`Linked to ${repo.full_name}`);
    } catch (err) {
      console.error('[RepoSelector] Failed to link repo:', err);
      toast.error('Failed to link repository');
    } finally {
      setLinking(false);
    }
  };

  // Unlink repo from project
  const unlinkRepo = async () => {
    if (!projectId) return;

    setLinking(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          github_repo: null,
          github_url: null,
          github_branch: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId);

      if (error) throw error;

      setCurrentRepo(null);
      setSelectedRepo('');
      onRepoSelect?.(null);
      toast.success('Repository unlinked');
    } catch (err) {
      console.error('[RepoSelector] Failed to unlink repo:', err);
      toast.error('Failed to unlink repository');
    } finally {
      setLinking(false);
    }
  };

  useEffect(() => {
    fetchRepos();
  }, []);

  useEffect(() => {
    fetchCurrentRepo();
  }, [projectId]);

  const isLinked = currentRepo && currentRepo === selectedRepo;

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2">
        <Select
          value={selectedRepo}
          onValueChange={setSelectedRepo}
          disabled={loading}
        >
          <SelectTrigger className="flex-1 cyber-border bg-studio-terminal font-terminal text-sm">
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading repos...</span>
              </div>
            ) : (
              <SelectValue placeholder="Select a repository..." />
            )}
          </SelectTrigger>
          <SelectContent className="bg-black/95 border-purple-600/30 max-h-60">
            {repos.map((repo) => (
              <SelectItem 
                key={repo.full_name} 
                value={repo.full_name}
                className="font-terminal text-sm focus:bg-purple-900/30 focus:text-purple-300"
              >
                <div className="flex items-center gap-2">
                  <Github className="h-4 w-4" />
                  <span>{repo.full_name}</span>
                  {repo.full_name === currentRepo && (
                    <Check className="h-3 w-3 text-green-400 ml-auto" />
                  )}
                </div>
              </SelectItem>
            ))}
            {repos.length === 0 && !loading && (
              <div className="text-center py-4 text-muted-foreground font-terminal text-sm">
                No repositories found
              </div>
            )}
          </SelectContent>
        </Select>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={fetchRepos}
          disabled={loading}
          className="shrink-0 neon-purple hover:neon-glow"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="flex gap-2">
        {isLinked ? (
          <Button
            variant="outline"
            size="sm"
            onClick={unlinkRepo}
            disabled={linking}
            className="flex-1 border-red-500/30 text-red-400 hover:bg-red-900/20 hover:text-red-300 font-terminal"
          >
            {linking ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Unlink Repository
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={linkRepo}
            disabled={linking || !selectedRepo || !projectId}
            className="flex-1 neon-glow cyber-border font-terminal"
          >
            {linking ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Github className="h-4 w-4 mr-2" />}
            Link Repository
          </Button>
        )}
      </div>

      {currentRepo && (
        <div className="text-xs font-terminal text-muted-foreground flex items-center gap-1">
          <Check className="h-3 w-3 text-green-400" />
          Currently linked: <span className="neon-green">{currentRepo}</span>
        </div>
      )}
    </div>
  );
};
