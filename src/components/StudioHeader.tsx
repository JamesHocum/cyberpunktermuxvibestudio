import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Play, 
  Square, 
  Settings, 
  MessageSquare, 
  Terminal as TerminalIcon,
  FolderPlus,
  Download,
  Key,
  TestTube,
  Plug,
  GitBranch,
  LogOut,
  User,
  Eye
} from "lucide-react";
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface StudioHeaderProps {
  onToggleChat: () => void;
  onToggleTerminal: () => void;
  onTogglePreview: () => void;
  onToggleApiConfig: () => void;
  onToggleDownloader: () => void;
  onToggleTesting: () => void;
  onToggleIntegrations: () => void;
  onToggleGit?: () => void;
  onToggleSettings?: () => void;
  onToggleProjectManager?: () => void;
  onSave?: () => void;
  showChat: boolean;
  showTerminal: boolean;
  showPreview: boolean;
  showApiConfig: boolean;
  showDownloader: boolean;
  showTesting: boolean;
  showIntegrations: boolean;
  isSaving?: boolean;
  hasUnsavedChanges?: boolean;
  currentProjectName?: string;
}

export const StudioHeader = ({ 
  onToggleChat, 
  onToggleTerminal,
  onTogglePreview,
  onToggleApiConfig,
  onToggleDownloader,
  onToggleTesting,
  onToggleIntegrations,
  onToggleGit,
  onToggleSettings,
  showChat, 
  showTerminal,
  showPreview,
  showApiConfig,
  showDownloader,
  showTesting,
  showIntegrations
}: StudioHeaderProps) => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: 'Sign Out Failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Signed Out',
        description: 'You have been disconnected from the matrix.',
      });
    }
  };

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
        <Button variant="ghost" size="sm" className="neon-green" onClick={handleClick}>
          <Play className="h-4 w-4 mr-2" />
          Run
        </Button>
        <Button variant="ghost" size="sm" className="neon-purple" onClick={handleClick}>
          <Square className="h-4 w-4 mr-2" />
          Stop
        </Button>
        <Button variant="ghost" size="sm" className="neon-green" onClick={handleClick}>
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
          variant={showPreview ? "secondary" : "ghost"} 
          size="sm"
          onClick={(e) => { handleClick(e); onTogglePreview(); }}
          className="neon-green"
        >
          <Eye className="h-4 w-4 mr-2" />
          Preview
        </Button>
        <Button 
          variant={showTesting ? "secondary" : "ghost"} 
          size="sm"
          onClick={(e) => { handleClick(e); onToggleTesting(); }}
          className="neon-purple"
        >
          <TestTube className="h-4 w-4 mr-2" />
          Test
        </Button>
        
        <Button 
          variant={showIntegrations ? "secondary" : "ghost"} 
          size="sm"
          onClick={(e) => { handleClick(e); onToggleIntegrations(); }}
          className="neon-green"
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

        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="neon-green">
                <User className="h-4 w-4 mr-2" />
                {user.email?.split('@')[0] || 'Agent'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-black/90 border-purple-600/30">
              <DropdownMenuItem className="text-gray-400 cursor-default">
                {user.email}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-purple-600/30" />
              <DropdownMenuItem 
                onClick={handleSignOut}
                className="text-red-400 focus:text-red-300 focus:bg-red-900/30 cursor-pointer"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
};
