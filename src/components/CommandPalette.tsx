import { useState, useEffect, useCallback, useMemo } from 'react';
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
  Brain,
  Cpu,
  FileText,
  Save,
  Play,
  Square,
  FileSearch,
  Palette,
  Layers,
  Code,
} from 'lucide-react';

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
}: CommandPaletteProps) => {
  const [open, setOpen] = useState(false);

  // Define all commands with fuzzy search keywords
  const commands = useMemo<Command[]>(() => [
    // Panel Commands
    {
      id: 'toggle-terminal',
      label: 'Toggle Terminal',
      shortcut: '⌘T',
      icon: <Terminal className="h-4 w-4 neon-green" />,
      category: 'Panels',
      action: () => { onToggleTerminal(); setOpen(false); },
      keywords: ['console', 'shell', 'cmd', 'command line'],
    },
    {
      id: 'toggle-chat',
      label: 'Toggle AI Chat',
      shortcut: '⌘⇧C',
      icon: <MessageSquare className="h-4 w-4 neon-purple" />,
      category: 'Panels',
      action: () => { onToggleChat(); setOpen(false); },
      keywords: ['assistant', 'lady violet', 'ai', 'neural'],
    },
    {
      id: 'toggle-preview',
      label: 'Toggle Live Preview',
      shortcut: '⌘⇧V',
      icon: <Eye className="h-4 w-4 neon-green" />,
      category: 'Panels',
      action: () => { onTogglePreview(); setOpen(false); },
      keywords: ['view', 'render', 'sandbox'],
    },
    {
      id: 'toggle-git',
      label: 'Toggle Git Panel',
      shortcut: '⌘G',
      icon: <GitBranch className="h-4 w-4 neon-purple" />,
      category: 'Panels',
      action: () => { onToggleGit(); setOpen(false); },
      keywords: ['github', 'version control', 'commit', 'push'],
    },

    // File Commands
    {
      id: 'save-file',
      label: 'Save File',
      shortcut: '⌘S',
      icon: <Save className="h-4 w-4 neon-green" />,
      category: 'File',
      action: () => { onSave(); setOpen(false); },
      keywords: ['write', 'store', 'persist'],
    },
    {
      id: 'new-file',
      label: 'New File',
      shortcut: '⌘N',
      icon: <FileText className="h-4 w-4 neon-purple" />,
      category: 'File',
      action: () => { onNewFile?.(); setOpen(false); },
      keywords: ['create', 'add'],
    },
    {
      id: 'download-project',
      label: 'Download Project',
      icon: <Download className="h-4 w-4 neon-green" />,
      category: 'File',
      action: () => { onToggleDownloader(); setOpen(false); },
      keywords: ['export', 'zip', 'backup'],
    },
    {
      id: 'project-manager',
      label: 'Open Project Manager',
      shortcut: '⌘P',
      icon: <FolderPlus className="h-4 w-4 neon-purple" />,
      category: 'File',
      action: () => { onToggleProjectManager(); setOpen(false); },
      keywords: ['projects', 'switch', 'open'],
    },

    // Matrix Tools
    {
      id: 'neural-search',
      label: 'Neural Search',
      shortcut: '⌘⇧F',
      icon: <Search className="h-4 w-4 neon-green" />,
      category: 'Matrix Tools',
      action: () => { onOpenNeuralSearch?.(); setOpen(false); },
      keywords: ['find', 'search files', 'grep'],
    },
    {
      id: 'quantum-control',
      label: 'Quantum Control',
      icon: <Zap className="h-4 w-4 neon-purple" />,
      category: 'Matrix Tools',
      action: () => { onOpenQuantumControl?.(); setOpen(false); },
      keywords: ['settings', 'ai model', 'preferences'],
    },
    {
      id: 'cyber-extensions',
      label: 'Cyber Extensions',
      icon: <Layers className="h-4 w-4 neon-green" />,
      category: 'Matrix Tools',
      action: () => { onOpenCyberExtensions?.(); setOpen(false); },
      keywords: ['plugins', 'features', 'toggles'],
    },
    {
      id: 'matrix-config',
      label: 'Matrix Config',
      icon: <Cpu className="h-4 w-4 neon-purple" />,
      category: 'Matrix Tools',
      action: () => { onOpenMatrixConfig?.(); setOpen(false); },
      keywords: ['environment', 'env', 'variables', 'secrets'],
    },

    // Tools
    {
      id: 'testing-suite',
      label: 'Open Testing Suite',
      icon: <TestTube className="h-4 w-4 neon-green" />,
      category: 'Tools',
      action: () => { onToggleTesting(); setOpen(false); },
      keywords: ['test', 'unit test', 'jest', 'vitest'],
    },
    {
      id: 'integrations',
      label: 'Open Integrations',
      icon: <Plug className="h-4 w-4 neon-purple" />,
      category: 'Tools',
      action: () => { onToggleIntegrations(); setOpen(false); },
      keywords: ['connect', 'apis', 'services'],
    },
    {
      id: 'api-config',
      label: 'API Configuration',
      icon: <Key className="h-4 w-4 neon-green" />,
      category: 'Tools',
      action: () => { onToggleApiConfig(); setOpen(false); },
      keywords: ['keys', 'tokens', 'auth'],
    },
    {
      id: 'settings',
      label: 'Open Settings',
      shortcut: '⌘,',
      icon: <Settings className="h-4 w-4 neon-purple" />,
      category: 'Tools',
      action: () => { onToggleSettings(); setOpen(false); },
      keywords: ['preferences', 'options', 'configure'],
    },
    {
      id: 'codebase-analyzer',
      label: 'Analyze Codebase',
      icon: <FileSearch className="h-4 w-4 neon-green" />,
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

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, Command[]> = {};
    commands.forEach(cmd => {
      if (!groups[cmd.category]) {
        groups[cmd.category] = [];
      }
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [commands]);

  // Keyboard shortcut listener
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Ctrl+Shift+P or Cmd+Shift+P
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'p') {
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
        
        {Object.entries(groupedCommands).map(([category, cmds], idx) => (
          <div key={category}>
            {idx > 0 && <CommandSeparator />}
            <CommandGroup heading={category}>
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
                    <span className="text-xs text-muted-foreground font-terminal">
                      {cmd.shortcut}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </div>
        ))}
      </CommandList>
    </CommandDialog>
  );
};

export default CommandPalette;
