import { GitBranch, RefreshCw, Cloud, CloudOff, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useGitSyncStatus } from '@/hooks/useGitSyncStatus';

interface StudioFooterProps {
  projectId?: string;
  hasUnsavedChanges?: boolean;
  onSyncClick?: () => void;
}

export const StudioFooter = ({ projectId, hasUnsavedChanges, onSyncClick }: StudioFooterProps) => {
  const { 
    isConnected, 
    linkedRepo, 
    branch, 
    unsyncedChanges, 
    isLoading, 
    formatLastSync, 
    refresh 
  } = useGitSyncStatus(projectId);

  return (
    <footer className="border-t border-purple-600/20 bg-transparent backdrop-blur-md py-2 px-4">
      <div className="flex items-center justify-between">
        {/* Left: Git Sync Status */}
        <div className="flex items-center gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <Cloud className="h-4 w-4 neon-green" />
                ) : (
                  <CloudOff className="h-4 w-4 text-muted-foreground" />
                )}
                <span className={`h-2 w-2 rounded-full ${
                  isConnected 
                    ? hasUnsavedChanges 
                      ? 'bg-yellow-500 animate-pulse' 
                      : 'bg-green-500'
                    : 'bg-muted-foreground'
                }`} />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isConnected ? 'Connected to GitHub' : 'Not connected'}</p>
            </TooltipContent>
          </Tooltip>

          {isConnected && (
            <>
              <span className="text-xs text-muted-foreground">
                {formatLastSync()}
              </span>
              
              {linkedRepo && (
                <Badge variant="outline" className="text-xs neon-purple">
                  <GitBranch className="h-3 w-3 mr-1" />
                  {branch || 'main'}
                </Badge>
              )}

              {unsyncedChanges > 0 && (
                <Badge variant="outline" className="text-xs text-yellow-500 border-yellow-500/30">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {unsyncedChanges} pending
                </Badge>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 neon-green"
                onClick={() => {
                  refresh();
                  onSyncClick?.();
                }}
                disabled={isLoading}
              >
                <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </>
          )}
        </div>

        {/* Center: Navigation */}
        <nav className="flex items-center space-x-4 text-xs">
          <a href="#" className="text-matrix-green/70 hover:text-matrix-green transition-colors">
            Docs
          </a>
          <a href="#" className="text-matrix-green/70 hover:text-matrix-green transition-colors">
            API
          </a>
          <a href="#" className="text-matrix-green/70 hover:text-matrix-green transition-colors">
            Community
          </a>
        </nav>

        {/* Right: Credits */}
        <div className="flex items-center space-x-2 text-xs text-matrix-green/50">
          <span>© 2025 Harold Hocum</span>
          <span>•</span>
          <a 
            href="https://harold-hocum-develop-7loc.bolt.host/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-neon-purple hover:text-neon-purple/80 transition-colors font-semibold"
          >
            Portfolio
          </a>
        </div>
      </div>
    </footer>
  );
};
