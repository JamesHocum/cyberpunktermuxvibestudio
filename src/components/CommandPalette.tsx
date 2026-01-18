import { useState, useEffect, useMemo } from 'react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Terminal,
  MessageSquare,
  Eye,
  Download,
  TestTube,
  Plug,
  GitBranch,
  Settings,
  FolderPlus,
  Key,
  Search,
  Zap,
  Cpu,
  FileText,
  Save,
  FileSearch,
  Layers,
  Trash2,
  Clock,
} from 'lucide-react';
import { SHORTCUTS, getRecentFileShortcut, matchesShortcut } from '@/lib/shortcuts';
import { FileIcon } from '@/components/FileIcon';
import type { RecentFile } from '@/hooks/useRecentFiles';

interface Command {
  id: string;
  label: string;
  shortcut?: string;
  icon: React.ReactNode;
  category: string;
  action: () => void;
  keywords?: string[];
}

interface CommandPaletteProps {
  onToggleChat: () => void;
  onToggleTerminal: () => void;
  onTogglePreview: () => void;
  onToggleApiConfig: () => void;
  onToggleDownloader: () => void;
  onToggleTesting: () => void;
  onToggleIntegrations: () => void;
  onToggleGit: () => void;
  onToggleSettings: () => void;
  onToggleProjectManager: () => void;
  onSave: () => void;
  onNewFile?: () => void;
  onOpenNeuralSearch?: () => void;
  onOpenQuantumControl?: () => void;
  onOpenCyberExtensions?: () => void;
  onOpenMatrixConfig?: () => void;
  // Recent files props
  recentFiles?: RecentFile[];
  onOpenRecentFile?: (path: string) => void;
  onClearRecentFiles?: () => void;
}

export const CommandPalette = ({
  onToggleChat,
  onToggleTerminal,
  onTogglePreview,
  onToggleApiConfig,
  onToggleDownloader,
  onToggleTesting,
  onToggleIntegrations,
  onToggleGit,
  onToggleSettings,
  onToggleProjectManager,
  onSave,
  onNewFile,
  onOpenNeuralSearch,
  onOpenQuantumControl,
  onOpenCyberExtensions,
  onOpenMatrixConfig,
  recentFiles = [],
  onOpenRecentFile,
  onClearRecentFiles,
}: CommandPaletteProps) => {
  const [open, setOpen] = useState(false);

  // Generate recent file commands dynamically
  const recentFileCommands = useMemo<Command[]>(() => {
    if (recentFiles.length === 0) return [];
    
    const fileCommands = recentFiles.map((file, index) => {
      const shortcut = getRecentFileShortcut(index);
      return {
        id: `recent-${file.path}`,
        label: file.name,
        shortcut: shortcut?.display,
        icon: <FileIcon extension={file.extension} className="h-4 w-4 text-primary" />,
        category: 'Recent Files',
        action: () => { 
          onOpenRecentFile?.(file.path); 
          setOpen(false); 
        },
        keywords: [file.name, 'recent', 'history', file.extension, file.path],
      };
    });

    // Add clear recent files command if there are files
    if (onClearRecentFiles && recentFiles.length > 0) {
      fileCommands.push({
        id: 'clear-recent-files',
        label: 'Clear Recent Files',
        shortcut: undefined,
        icon: <Trash2 className="h-4 w-4 text-destructive" />,
        category: 'Recent Files',
        action: () => { 
          onClearRecentFiles(); 
          setOpen(false); 
        },
        keywords: ['clear', 'remove', 'delete', 'history'],
      });
    }

    return fileCommands;
  }, [recentFiles, onOpenRecentFile, onClearRecentFiles]);

  // Define all static commands with shortcuts from config
  const staticCommands = useMemo<Command[]>(() => [
    // Panel Commands
    {
      id: 'toggle-terminal',
      label: 'Toggle Terminal',
      shortcut: SHORTCUTS.TOGGLE_TERMINAL.display,
      icon: <Terminal className="h-4 w-4 text-primary" />,
      category: 'Panels',
      action: () => { onToggleTerminal(); setOpen(false); },
      keywords: ['console', 'shell', 'cmd', 'command line'],
    },
    {
      id: 'toggle-chat',
      label: 'Toggle AI Chat',
      shortcut: SHORTCUTS.TOGGLE_CHAT.display,
      icon: <MessageSquare className="h-4 w-4 text-accent" />,
      category: 'Panels',
      action: () => { onToggleChat(); setOpen(false); },
      keywords: ['assistant', 'lady violet', 'ai', 'neural'],
    },
    {
      id: 'toggle-preview',
      label: 'Toggle Live Preview',
      shortcut: SHORTCUTS.TOGGLE_PREVIEW.display,
      icon: <Eye className="h-4 w-4 text-primary" />,
      category: 'Panels',
      action: () => { onTogglePreview(); setOpen(false); },
      keywords: ['view', 'render', 'sandbox'],
    },
    {
      id: 'toggle-git',
      label: 'Toggle Git Panel',
      shortcut: SHORTCUTS.TOGGLE_GIT.display,
      icon: <GitBranch className="h-4 w-4 text-accent" />,
      category: 'Panels',
      action: () => { onToggleGit(); setOpen(false); },
      keywords: ['github', 'version control', 'commit', 'push'],
    },

    // File Commands
    {
      id: 'save-file',
      label: 'Save File',
      shortcut: SHORTCUTS.SAVE.display,
      icon: <Save className="h-4 w-4 text-primary" />,
      category: 'File',
      action: () => { onSave(); setOpen(false); },
      keywords: ['write', 'store', 'persist'],
    },
    {
      id: 'new-file',
      label: 'New File',
      shortcut: SHORTCUTS.NEW_FILE.display,
      icon: <FileText className="h-4 w-4 text-accent" />,
      category: 'File',
      action: () => { onNewFile?.(); setOpen(false); },
      keywords: ['create', 'add'],
    },
    {
      id: 'download-project',
      label: 'Download Project',
      icon: <Download className="h-4 w-4 text-primary" />,
      category: 'File',
      action: () => { onToggleDownloader(); setOpen(false); },
      keywords: ['export', 'zip', 'backup'],
    },
    {
      id: 'project-manager',
      label: 'Open Project Manager',
      shortcut: SHORTCUTS.PROJECT_MANAGER.display,
      icon: <FolderPlus className="h-4 w-4 text-accent" />,
      category: 'File',
      action: () => { onToggleProjectManager(); setOpen(false); },
      keywords: ['projects', 'switch', 'open'],
    },

    // Matrix Tools
    {
      id: 'neural-search',
      label: 'Neural Search',
      shortcut: SHORTCUTS.NEURAL_SEARCH.display,
      icon: <Search className="h-4 w-4 text-primary" />,
      category: 'Matrix Tools',
      action: () => { onOpenNeuralSearch?.(); setOpen(false); },
      keywords: ['find', 'search files', 'grep'],
    },
    {
      id: 'quantum-control',
      label: 'Quantum Control',
      icon: <Zap className="h-4 w-4 text-accent" />,
      category: 'Matrix Tools',
      action: () => { onOpenQuantumControl?.(); setOpen(false); },
      keywords: ['settings', 'ai model', 'preferences'],
    },
    {
      id: 'cyber-extensions',
      label: 'Cyber Extensions',
      icon: <Layers className="h-4 w-4 text-primary" />,
      category: 'Matrix Tools',
      action: () => { onOpenCyberExtensions?.(); setOpen(false); },
      keywords: ['plugins', 'features', 'toggles'],
    },
    {
      id: 'matrix-config',
      label: 'Matrix Config',
      icon: <Cpu className="h-4 w-4 text-accent" />,
      category: 'Matrix Tools',
      action: () => { onOpenMatrixConfig?.(); setOpen(false); },
      keywords: ['environment', 'env', 'variables', 'secrets'],
    },

    // Tools
    {
      id: 'testing-suite',
      label: 'Open Testing Suite',
      icon: <TestTube className="h-4 w-4 text-primary" />,
      category: 'Tools',
      action: () => { onToggleTesting(); setOpen(false); },
      keywords: ['test', 'unit test', 'jest', 'vitest'],
    },
    {
      id: 'integrations',
      label: 'Open Integrations',
      icon: <Plug className="h-4 w-4 text-accent" />,
      category: 'Tools',
      action: () => { onToggleIntegrations(); setOpen(false); },
      keywords: ['connect', 'apis', 'services'],
    },
    {
      id: 'api-config',
      label: 'API Configuration',
      icon: <Key className="h-4 w-4 text-primary" />,
      category: 'Tools',
      action: () => { onToggleApiConfig(); setOpen(false); },
      keywords: ['keys', 'tokens', 'auth'],
    },
    {
      id: 'settings',
      label: 'Open Settings',
      shortcut: SHORTCUTS.SETTINGS.display,
      icon: <Settings className="h-4 w-4 text-accent" />,
      category: 'Tools',
      action: () => { onToggleSettings(); setOpen(false); },
      keywords: ['preferences', 'options', 'configure'],
    },
    {
      id: 'codebase-analyzer',
      label: 'Analyze Codebase',
      icon: <FileSearch className="h-4 w-4 text-primary" />,
      category: 'Tools',
      action: () => { onToggleChat(); setOpen(false); },
      keywords: ['analysis', 'scan', 'review', 'code quality'],
    },
  ], [
    onToggleChat, onToggleTerminal, onTogglePreview, onToggleApiConfig,
    onToggleDownloader, onToggleTesting, onToggleIntegrations, onToggleGit,
    onToggleSettings, onToggleProjectManager, onSave, onNewFile,
    onOpenNeuralSearch, onOpenQuantumControl, onOpenCyberExtensions, onOpenMatrixConfig,
  ]);

  // Combine all commands - recent files first
  const allCommands = useMemo(() => [
    ...recentFileCommands,
    ...staticCommands,
  ], [recentFileCommands, staticCommands]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, Command[]> = {};
    allCommands.forEach(cmd => {
      if (!groups[cmd.category]) {
        groups[cmd.category] = [];
      }
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [allCommands]);

  // Define category order (Recent Files first)
  const categoryOrder = ['Recent Files', 'Panels', 'File', 'Matrix Tools', 'Tools'];

  // Keyboard shortcut listener
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (matchesShortcut(e, SHORTCUTS.COMMAND_PALETTE)) {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput 
        placeholder="Type a command or search..." 
        className="border-none focus:ring-0"
      />
      <CommandList>
        <CommandEmpty>No commands found.</CommandEmpty>
        
        {categoryOrder.map((category, idx) => {
          const cmds = groupedCommands[category];
          if (!cmds || cmds.length === 0) return null;
          
          return (
            <div key={category}>
              {idx > 0 && <CommandSeparator />}
              <CommandGroup 
                heading={
                  <span className="flex items-center gap-2">
                    {category === 'Recent Files' && <Clock className="h-3 w-3" />}
                    {category}
                  </span>
                }
              >
                {cmds.map(cmd => (
                  <CommandItem
                    key={cmd.id}
                    onSelect={cmd.action}
                    className="flex items-center justify-between cursor-pointer"
                    keywords={cmd.keywords}
                  >
                    <div className="flex items-center gap-2">
                      {cmd.icon}
                      <span>{cmd.label}</span>
                    </div>
                    {cmd.shortcut && (
                      <span className="text-xs text-muted-foreground font-mono">
                        {cmd.shortcut}
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </div>
          );
        })}
      </CommandList>
    </CommandDialog>
  );
};

export default CommandPalette;
