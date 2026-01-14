import React, { useState } from 'react';
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
  Eye,
  Github,
  Loader2,
  CheckCircle,
  XCircle,
  Smartphone
} from "lucide-react";
import { useAuth } from '@/hooks/useAuth';
import { useGitHub } from '@/hooks/useGitHub';
import { usePWA } from '@/hooks/usePWA';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PWAInstallPrompt } from './PWAInstallPrompt';
import { Badge } from "@/components/ui/badge";

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
  const { canInstall, isInstalled, isStandalone } = usePWA();
  const [showPWAPrompt, setShowPWAPrompt] = useState(false);
  const { 
    connected: githubConnected, 
    username: githubUsername, 
    avatarUrl: githubAvatar,
    loading: githubLoading,
    isAuthorizing,
    connect: connectGitHub,
    disconnect: disconnectGitHub
  } = useGitHub();

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
        
        {/* GitHub Connection Button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm"
              className={githubConnected ? "neon-green" : "text-muted-foreground hover:neon-purple"}
            >
              {githubLoading || isAuthorizing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : githubConnected ? (
                <Avatar className="h-5 w-5 mr-2">
                  <AvatarImage src={githubAvatar || undefined} alt={githubUsername || 'GitHub'} />
                  <AvatarFallback className="bg-green-500/20 text-green-400 text-xs">
                    <Github className="h-3 w-3" />
                  </AvatarFallback>
                </Avatar>
              ) : (
                <Github className="h-4 w-4 mr-2" />
              )}
              {githubConnected ? githubUsername || 'GitHub' : 'GitHub'}
              {githubConnected && <CheckCircle className="h-3 w-3 ml-1 text-green-400" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-black/90 border-purple-600/30">
            {githubConnected ? (
              <>
                <DropdownMenuItem className="text-gray-400 cursor-default">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                  Connected as {githubUsername}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-purple-600/30" />
                <DropdownMenuItem 
                  onClick={() => onToggleGit?.()}
                  className="text-purple-400 focus:text-purple-300 focus:bg-purple-900/30 cursor-pointer"
                >
                  <GitBranch className="h-4 w-4 mr-2" />
                  Open Git Panel
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={disconnectGitHub}
                  className="text-red-400 focus:text-red-300 focus:bg-red-900/30 cursor-pointer"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Disconnect GitHub
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem className="text-gray-400 cursor-default">
                  <XCircle className="h-4 w-4 mr-2 text-gray-500" />
                  Not connected
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-purple-600/30" />
                <DropdownMenuItem 
                  onClick={connectGitHub}
                  disabled={isAuthorizing}
                  className="text-green-400 focus:text-green-300 focus:bg-green-900/30 cursor-pointer"
                >
                  <Github className="h-4 w-4 mr-2" />
                  {isAuthorizing ? 'Connecting...' : 'Connect GitHub'}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button 
          variant="ghost" 
          size="sm"
          onClick={(e) => { handleClick(e); onToggleGit?.(); }}
          className="neon-green"
        >
          <GitBranch className="h-4 w-4 mr-2" />
          Git
        </Button>

        {/* PWA Install Button */}
        {(canInstall || isInstalled || isStandalone) && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={(e) => { handleClick(e); setShowPWAPrompt(true); }}
            className={isInstalled || isStandalone ? "neon-green" : "neon-purple pulse-glow"}
          >
            <Smartphone className="h-4 w-4 mr-2" />
            {isInstalled || isStandalone ? (
              <>
                Installed
                <Badge variant="secondary" className="ml-2 text-xs bg-green-500/20 neon-green border-green-500/30">PWA</Badge>
              </>
            ) : (
              'Install'
            )}
          </Button>
        )}
        
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

      {/* PWA Install Dialog */}
      <PWAInstallPrompt open={showPWAPrompt} onOpenChange={setShowPWAPrompt} />
    </header>
  );
};
