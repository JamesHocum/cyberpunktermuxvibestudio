import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useUserRole } from '@/hooks/useUserRole';
import { 
  Play, 
  Square, 
  Settings, 
  MessageSquare, 
  Terminal as TerminalIcon,
  FolderPlus,
  Download,
  Upload,
  Key,
  TestTube,
  Plug,
  GitBranch,
  Shield
} from "lucide-react";

interface StudioHeaderProps {
  onToggleChat: () => void;
  onToggleTerminal: () => void;
  onToggleApiConfig: () => void;
  onToggleDownloader: () => void;
  onToggleTesting: () => void;
  onToggleIntegrations: () => void;
  onToggleGit?: () => void;
  onToggleSettings?: () => void;
  showChat: boolean;
  showTerminal: boolean;
  showApiConfig: boolean;
  showDownloader: boolean;
  showTesting: boolean;
  showIntegrations: boolean;
}

export const StudioHeader = ({ 
  onToggleChat, 
  onToggleTerminal, 
  onToggleApiConfig,
  onToggleDownloader,
  onToggleTesting,
  onToggleIntegrations,
  onToggleGit,
  onToggleSettings,
  showChat, 
  showTerminal,
  showApiConfig,
  showDownloader,
  showTesting,
  showIntegrations
}: StudioHeaderProps) => {
  const navigate = useNavigate();
  const { isAdmin } = useUserRole();

  return (
    <header className="h-12 border-b cyber-border bg-studio-header flex items-center justify-between px-4 terminal-glow">
      <div className="flex items-center space-x-4">
        <h1 className="text-lg font-cyber font-bold neon-green flicker">
          DEVSTUDIO_MATRIX.EXE
        </h1>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="sm" className="neon-green hover:neon-glow">
          <Play className="h-4 w-4 mr-2" />
          Run
        </Button>
        <Button variant="ghost" size="sm" className="neon-purple hover:neon-glow">
          <Square className="h-4 w-4 mr-2" />
          Stop
        </Button>
        <Button variant="ghost" size="sm" className="neon-green hover:neon-glow">
          <FolderPlus className="h-4 w-4 mr-2" />
          New
        </Button>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button 
          variant={showTerminal ? "secondary" : "ghost"} 
          size="sm"
          onClick={onToggleTerminal}
          className="neon-green hover:neon-glow"
        >
          <TerminalIcon className="h-4 w-4 mr-2" />
          Terminal
        </Button>
        
        <Button 
          variant={showApiConfig ? "secondary" : "ghost"} 
          size="sm"
          onClick={onToggleApiConfig}
          className="neon-purple hover:neon-glow"
        >
          <Key className="h-4 w-4 mr-2" />
          API Config
        </Button>
        
        <Button 
          variant={showChat ? "secondary" : "ghost"} 
          size="sm"
          onClick={onToggleChat}
          className="neon-green hover:neon-glow"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          AI Assistant
        </Button>
        
        <Button 
          variant={showDownloader ? "secondary" : "ghost"} 
          size="sm"
          onClick={onToggleDownloader}
          className="neon-purple hover:neon-glow"
        >
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
        
        <Button 
          variant={showTesting ? "secondary" : "ghost"} 
          size="sm"
          onClick={onToggleTesting}
          className="neon-green hover:neon-glow"
        >
          <TestTube className="h-4 w-4 mr-2" />
          Test
        </Button>
        
        <Button 
          variant={showIntegrations ? "secondary" : "ghost"} 
          size="sm"
          onClick={onToggleIntegrations}
          className="neon-purple hover:neon-glow"
        >
          <Plug className="h-4 w-4 mr-2" />
          Integrations
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onToggleGit}
          className="neon-green hover:neon-glow"
        >
          <GitBranch className="h-4 w-4 mr-2" />
          Git
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onToggleSettings}
          className="neon-purple hover:neon-glow"
        >
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
        
        {isAdmin && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/admin')}
            className="text-xs opacity-70 hover:opacity-100 neon-green hover:neon-glow"
          >
            <Shield className="h-4 w-4" />
          </Button>
        )}
      </div>
    </header>
  );
};