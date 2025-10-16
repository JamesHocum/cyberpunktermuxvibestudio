import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GitBranch, GitCommit, GitPullRequest, Upload, Download, X, RefreshCw } from 'lucide-react';

interface GitPanelProps {
  isVisible: boolean;
  onClose: () => void;
}

export const GitPanel = ({ isVisible, onClose }: GitPanelProps) => {
  const [commitMessage, setCommitMessage] = useState('');
  const [branch, setBranch] = useState('main');
  const [status, setStatus] = useState<string[]>([
    'modified: src/components/Terminal.tsx',
    'modified: src/components/CodeEditor.tsx',
    'new file: src/lib/projectManager.ts'
  ]);

  if (!isVisible) return null;

  const handleCommit = () => {
    if (!commitMessage.trim()) return;
    console.log(`[GIT] Committing: ${commitMessage}`);
    setCommitMessage('');
    setStatus([]);
  };

  const handlePush = () => {
    console.log('[GIT] Pushing to remote...');
  };

  const handlePull = () => {
    console.log('[GIT] Pulling from remote...');
  };

  const handleRefresh = () => {
    console.log('[GIT] Refreshing status...');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-studio-sidebar cyber-border rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col terminal-glow">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b cyber-border bg-studio-header">
          <div className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 neon-purple pulse-glow" />
            <h2 className="font-cyber text-lg neon-green">GIT_VERSION_CONTROL.SYS</h2>
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
                className="neon-purple hover:neon-glow"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-terminal text-sm neon-purple">
              <GitCommit className="h-4 w-4" />
              Changed Files ({status.length})
            </div>
            <ScrollArea className="h-40 cyber-border rounded p-2 bg-studio-terminal">
              {status.length > 0 ? (
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
              disabled={!commitMessage.trim() || status.length === 0}
              className="flex-1 neon-glow cyber-border"
            >
              <GitCommit className="h-4 w-4 mr-2 neon-green" />
              Commit Changes
            </Button>
            <Button
              onClick={handlePush}
              variant="outline"
              className="cyber-border neon-purple hover:neon-glow"
            >
              <Upload className="h-4 w-4 mr-2" />
              Push
            </Button>
            <Button
              onClick={handlePull}
              variant="outline"
              className="cyber-border neon-green hover:neon-glow"
            >
              <Download className="h-4 w-4 mr-2" />
              Pull
            </Button>
          </div>

          {/* Recent Commits */}
          <div className="space-y-2">
            <div className="font-terminal text-sm neon-purple">Recent Commits:</div>
            <div className="cyber-border rounded p-2 bg-studio-terminal space-y-2">
              {['Initial matrix setup', 'Add neural interface components', 'Configure quantum build'].map((msg, idx) => (
                <div key={idx} className="text-xs font-terminal matrix-text border-l-2 border-neon-green pl-2 py-1">
                  {msg}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
