import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useDragScroll } from '@/hooks/useDragScroll';
import { 
  Play, 
  Square, 
  Settings,
  MessageSquare, 
  Terminal as TerminalIcon,
  FolderPlus,
  FolderKanban,
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
import { useIsMobile } from '@/hooks/use-mobile';
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
import { MobileHeaderMenu } from './MobileHeaderMenu';
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
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { canInstall, isInstalled, isStandalone } = usePWA();
  const [showPWAPrompt, setShowPWAPrompt] = useState(false);
  const { ref: scrollRef, isDragging, handlers: dragHandlers } = useDragScroll<HTMLDivElement>();
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
    <header className="sticky top-0 z-50 flex items-center justify-between bg-[hsl(0,0%,7%)]/95 py-2 md:py-4 px-3 md:px-6 border-b border-purple-600/20 backdrop-blur-md shadow-[0_0_30px_rgba(179,0,255,0.25)]">
      {/* Logo - Always visible */}
      <h1 className="text-lg md:text-3xl font-extrabold neon-text whitespace-nowrap">
        {isMobile ? 'CYBER·T' : 'CYBERPUNK TERMUX'}
      </h1>
      
      {/* Primary Actions - Always visible */}
      <div className="flex items-center space-x-1 md:space-x-2">
        <Button variant="ghost" size="sm" className="neon-purple flex-shrink-0" onClick={() => navigate('/projects')}>
          <FolderKanban className="h-4 w-4 md:mr-2" />
          <span className="hidden md:inline">Projects</span>
        </Button>
        <Button variant="ghost" size="sm" className="neon-green" onClick={handleClick}>
          <Play className="h-4 w-4 md:mr-2" />
          <span className="hidden md:inline">Run</span>
        </Button>
        <Button variant="ghost" size="sm" className="neon-purple" onClick={handleClick}>
          <Square className="h-4 w-4 md:mr-2" />
          <span className="hidden md:inline">Stop</span>
        </Button>
        <Button variant="ghost" size="sm" className="neon-green hidden sm:flex" onClick={handleClick}>
          <FolderPlus className="h-4 w-4 md:mr-2" />
          <span className="hidden md:inline">New</span>
        </Button>
      </div>
      
      {/* Desktop: Scrollable Toolbar | Mobile: Dropdown Menu */}
      {isMobile ? (
        <div className="flex items-center space-x-2">
          {/* Essential mobile buttons */}
          <Button 
            variant={showChat ? "secondary" : "ghost"} 
            size="sm"
            onClick={(e) => { handleClick(e); onToggleChat(); }}
            className="neon-green"
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
          
          {/* Mobile overflow menu */}
          <MobileHeaderMenu
            onToggleChat={onToggleChat}
            onToggleTerminal={onToggleTerminal}
            onTogglePreview={onTogglePreview}
            onToggleApiConfig={onToggleApiConfig}
            onToggleDownloader={onToggleDownloader}
            onToggleTesting={onToggleTesting}
            onToggleIntegrations={onToggleIntegrations}
            onToggleGit={onToggleGit}
            onToggleSettings={onToggleSettings}
            showChat={showChat}
            showTerminal={showTerminal}
            showPreview={showPreview}
            showApiConfig={showApiConfig}
            showDownloader={showDownloader}
            showTesting={showTesting}
            showIntegrations={showIntegrations}
          />
          
          {/* User menu on mobile */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="neon-green">
                  <User className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-black/90 border-purple-600/30">
                <DropdownMenuItem className="text-muted-foreground cursor-default text-xs">
                  {user.email}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-purple-600/30" />
                <DropdownMenuItem 
                  onClick={handleSignOut}
                  className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      ) : (
        /* Desktop toolbar with horizontal scroll and drag-to-scroll */
        <div 
          ref={scrollRef}
          className={`flex items-center space-x-2 overflow-x-auto scrollbar-thin scrollbar-thumb-neon max-w-[60vw] px-2 drag-scroll-container ${isDragging ? 'is-dragging' : ''}`}
          {...dragHandlers}
        >
          <Button 
            variant={showTerminal ? "secondary" : "ghost"} 
            size="sm"
            onClick={(e) => { handleClick(e); onToggleTerminal(); }}
            className="neon-green flex-shrink-0"
          >
            <TerminalIcon className="h-4 w-4 mr-2" />
            Terminal
          </Button>
          
          <Button 
            variant={showApiConfig ? "secondary" : "ghost"} 
            size="sm"
            onClick={(e) => { handleClick(e); onToggleApiConfig(); }}
            className="neon-purple flex-shrink-0"
          >
            <Key className="h-4 w-4 mr-2" />
            API Config
          </Button>
          
          <Button 
            variant={showChat ? "secondary" : "ghost"} 
            size="sm"
            onClick={(e) => { handleClick(e); onToggleChat(); }}
            className="neon-green flex-shrink-0"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            AI Assistant
          </Button>
          
          <Button 
            variant={showDownloader ? "secondary" : "ghost"} 
            size="sm"
            onClick={(e) => { handleClick(e); onToggleDownloader(); }}
            className="neon-purple flex-shrink-0"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          
          <Button 
            variant={showPreview ? "secondary" : "ghost"} 
            size="sm"
            onClick={(e) => { handleClick(e); onTogglePreview(); }}
            className="neon-green flex-shrink-0"
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button 
            variant={showTesting ? "secondary" : "ghost"} 
            size="sm"
            onClick={(e) => { handleClick(e); onToggleTesting(); }}
            className="neon-purple flex-shrink-0"
          >
            <TestTube className="h-4 w-4 mr-2" />
            Test
          </Button>
          
          <Button 
            variant={showIntegrations ? "secondary" : "ghost"} 
            size="sm"
            onClick={(e) => { handleClick(e); onToggleIntegrations(); }}
            className="neon-green flex-shrink-0"
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
                className={`flex-shrink-0 ${githubConnected ? "neon-green" : "text-muted-foreground hover:neon-purple"}`}
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
                  <DropdownMenuItem className="text-muted-foreground cursor-default">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                    Connected as {githubUsername}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-purple-600/30" />
                  <DropdownMenuItem 
                    onClick={() => onToggleGit?.()}
                    className="text-secondary focus:text-secondary focus:bg-secondary/10 cursor-pointer"
                  >
                    <GitBranch className="h-4 w-4 mr-2" />
                    Open Git Panel
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={disconnectGitHub}
                    className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Disconnect GitHub
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem className="text-muted-foreground cursor-default">
                    <XCircle className="h-4 w-4 mr-2 text-muted-foreground" />
                    Not connected
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-purple-600/30" />
                  <DropdownMenuItem 
                    onClick={connectGitHub}
                    disabled={isAuthorizing}
                    className="text-primary focus:text-primary focus:bg-primary/10 cursor-pointer"
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
            className="neon-green flex-shrink-0"
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
              className={`flex-shrink-0 ${isInstalled || isStandalone ? "neon-green" : "neon-purple pulse-glow"}`}
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
            className="neon-purple flex-shrink-0"
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="neon-green flex-shrink-0">
                  <User className="h-4 w-4 mr-2" />
                  {user.email?.split('@')[0] || 'Agent'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-black/90 border-purple-600/30">
                <DropdownMenuItem className="text-muted-foreground cursor-default">
                  {user.email}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-purple-600/30" />
                <DropdownMenuItem 
                  onClick={handleSignOut}
                  className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}

      {/* PWA Install Dialog */}
      <PWAInstallPrompt open={showPWAPrompt} onOpenChange={setShowPWAPrompt} />
    </header>
  );
};
