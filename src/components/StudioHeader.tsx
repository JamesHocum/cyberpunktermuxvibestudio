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

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const spark = document.createElement('span');
    spark.classList.add('spark');
    spark.style.left = `${e.clientX - button.getBoundingClientRect().left}px`;
    spark.style.top = `${e.clientY - button.getBoundingClientRect().top}px`;
    button.appendChild(spark);
    setTimeout(() => spark.remove(), 400);
  };

  return (
    <header className="flex items-center justify-between bg-transparent py-4 px-6 border-b border-purple-600/20 backdrop-blur-md shadow-[0_0_30px_rgba(179,0,255,0.25)]">
      <h1 className="text-3xl font-extrabold neon-text">
        CYBERPUNK TERMUX
      </h1>
      
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="sm" className="neon-button" onClick={handleClick}>
          <Play className="h-4 w-4 mr-2" />
          Run
        </Button>
        <Button variant="ghost" size="sm" className="neon-button" onClick={handleClick}>
          <Square className="h-4 w-4 mr-2" />
          Stop
        </Button>
        <Button variant="ghost" size="sm" className="neon-button" onClick={handleClick}>
          <FolderPlus className="h-4 w-4 mr-2" />
          New
        </Button>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button 
          variant={showTerminal ? "secondary" : "ghost"} 
          size="sm"
          onClick={(e) => { handleClick(e); onToggleTerminal(); }}
          className="neon-green"
        >
          <TerminalIcon className="h-4 w-4 mr-2" />
          Terminal
        </Button>
        
        <Button 
          variant={showApiConfig ? "secondary" : "ghost"} 
          size="sm"
          onClick={(e) => { handleClick(e); onToggleApiConfig(); }}
          className="neon-purple"
        >
          <Key className="h-4 w-4 mr-2" />
          API Config
        </Button>
        
        <Button 
          variant={showChat ? "secondary" : "ghost"} 
          size="sm"
          onClick={(e) => { handleClick(e); onToggleChat(); }}
          className="neon-green"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          AI Assistant
        </Button>
        
        <Button 
          variant={showDownloader ? "secondary" : "ghost"} 
          size="sm"
          onClick={(e) => { handleClick(e); onToggleDownloader(); }}
          className="neon-purple"
        >
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
        
        <Button 
          variant={showTesting ? "secondary" : "ghost"} 
          size="sm"
          onClick={(e) => { handleClick(e); onToggleTesting(); }}
          className="neon-green"
        >
          <TestTube className="h-4 w-4 mr-2" />
          Test
        </Button>
        
        <Button 
          variant={showIntegrations ? "secondary" : "ghost"} 
          size="sm"
          onClick={(e) => { handleClick(e); onToggleIntegrations(); }}
          className="neon-purple"
        >
          <Plug className="h-4 w-4 mr-2" />
          Integrations
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm"
          onClick={(e) => { handleClick(e); onToggleGit?.(); }}
          className="neon-green"
        >
          <GitBranch className="h-4 w-4 mr-2" />
          Git
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm"
          onClick={(e) => { handleClick(e); onToggleSettings?.(); }}
          className="neon-purple"
        >
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
        
        {isAdmin && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={(e) => { handleClick(e); navigate('/admin'); }}
            className="text-xs opacity-70 hover:opacity-100 neon-green"
          >
            <Shield className="h-4 w-4" />
          </Button>
        )}
      </div>
    </header>
  );
};