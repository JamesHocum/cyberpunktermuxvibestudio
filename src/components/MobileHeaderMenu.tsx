import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Terminal as TerminalIcon,
  Download,
  Key,
  TestTube,
  Plug,
  GitBranch,
  Eye,
  Settings,
  Menu,
  MessageSquare,
  Smartphone
} from "lucide-react";

interface MobileHeaderMenuProps {
  onToggleTerminal: () => void;
  onTogglePreview: () => void;
  onToggleApiConfig: () => void;
  onToggleDownloader: () => void;
  onToggleTesting: () => void;
  onToggleIntegrations: () => void;
  onToggleGit?: () => void;
  onToggleSettings?: () => void;
  onToggleChat: () => void;
  onTogglePWAInstall?: () => void;
  showTerminal: boolean;
  showPreview: boolean;
  showApiConfig: boolean;
  showDownloader: boolean;
  showTesting: boolean;
  showIntegrations: boolean;
  showChat: boolean;
}

export const MobileHeaderMenu = ({
  onToggleTerminal,
  onTogglePreview,
  onToggleApiConfig,
  onToggleDownloader,
  onToggleTesting,
  onToggleIntegrations,
  onToggleGit,
  onToggleSettings,
  onToggleChat,
  onTogglePWAInstall,
  showTerminal,
  showPreview,
  showApiConfig,
  showDownloader,
  showTesting,
  showIntegrations,
  showChat
}: MobileHeaderMenuProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="neon-purple md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-56 bg-black/95 border-purple-600/30 backdrop-blur-md"
      >
        {/* Primary Actions */}
        <DropdownMenuItem 
          onClick={onToggleChat}
          className={`cursor-pointer ${showChat ? 'text-primary bg-primary/10' : 'text-foreground'}`}
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          AI Assistant
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={onToggleTerminal}
          className={`cursor-pointer ${showTerminal ? 'text-primary bg-primary/10' : 'text-foreground'}`}
        >
          <TerminalIcon className="h-4 w-4 mr-2" />
          Terminal
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="bg-purple-600/30" />
        
        {/* Secondary Actions */}
        <DropdownMenuItem 
          onClick={onTogglePreview}
          className={`cursor-pointer ${showPreview ? 'text-primary bg-primary/10' : 'text-foreground'}`}
        >
          <Eye className="h-4 w-4 mr-2" />
          Preview
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={onToggleApiConfig}
          className={`cursor-pointer ${showApiConfig ? 'text-secondary bg-secondary/10' : 'text-foreground'}`}
        >
          <Key className="h-4 w-4 mr-2" />
          API Config
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={onToggleDownloader}
          className={`cursor-pointer ${showDownloader ? 'text-secondary bg-secondary/10' : 'text-foreground'}`}
        >
          <Download className="h-4 w-4 mr-2" />
          Download
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={onToggleTesting}
          className={`cursor-pointer ${showTesting ? 'text-secondary bg-secondary/10' : 'text-foreground'}`}
        >
          <TestTube className="h-4 w-4 mr-2" />
          Test Suite
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={onToggleIntegrations}
          className={`cursor-pointer ${showIntegrations ? 'text-primary bg-primary/10' : 'text-foreground'}`}
        >
          <Plug className="h-4 w-4 mr-2" />
          Integrations
        </DropdownMenuItem>
        
        {onTogglePWAInstall && (
          <DropdownMenuItem
            onClick={onTogglePWAInstall}
            className="cursor-pointer text-secondary"
          >
            <Smartphone className="h-4 w-4 mr-2" />
            Install App
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator className="bg-purple-600/30" />
        
        {/* Tertiary Actions */}
        <DropdownMenuItem 
          onClick={() => onToggleGit?.()}
          className="cursor-pointer text-foreground"
        >
          <GitBranch className="h-4 w-4 mr-2" />
          Git Panel
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => onToggleSettings?.()}
          className="cursor-pointer text-foreground"
        >
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
