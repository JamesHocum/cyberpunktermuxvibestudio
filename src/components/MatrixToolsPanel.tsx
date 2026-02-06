import { useState, useEffect } from 'react';
import { Search, GitBranch, Package, Settings, X, Zap, Clock, Terminal as TerminalIcon, Key, Download, Upload } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ExtensionManager } from '@/components/extensions';

export type ModalType = 'neural-search' | 'quantum-control' | 'cyber-extensions' | 'matrix-config' | null;

interface MatrixToolsPanelProps {
  openModal: ModalType;
  onClose: () => void;
  fileContents: Record<string, string>;
  onFileSelect?: (file: string) => void;
}

interface SearchResult {
  file: string;
  line: number;
  content: string;
  matchIndex: number;
}

export const MatrixToolsPanel = ({ 
  openModal, 
  onClose, 
  fileContents,
  onFileSelect 
}: MatrixToolsPanelProps) => {
  // Neural Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchInContent, setSearchInContent] = useState(true);
  const [fileTypeFilter, setFileTypeFilter] = useState<string>('all');

  // Quantum Control state
  const [aiModel, setAiModel] = useState('gemini-flash');
  const [autoSaveInterval, setAutoSaveInterval] = useState([30]);
  const [terminalHistorySize, setTerminalHistorySize] = useState([100]);
  const [devMode, setDevMode] = useState(false);


  // Matrix Config state
  const [envVars, setEnvVars] = useState<{ key: string; value: string }[]>([]);
  const [newEnvKey, setNewEnvKey] = useState('');
  const [newEnvValue, setNewEnvValue] = useState('');

  // Search logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const results: SearchResult[] = [];
    const query = searchQuery.toLowerCase();

    Object.entries(fileContents).forEach(([file, content]) => {
      // Filter by file type
      if (fileTypeFilter !== 'all') {
        const ext = file.split('.').pop()?.toLowerCase();
        if (ext !== fileTypeFilter) return;
      }

      // Search in filename
      if (file.toLowerCase().includes(query)) {
        results.push({ file, line: 0, content: file, matchIndex: file.toLowerCase().indexOf(query) });
      }

      // Search in content
      if (searchInContent && content) {
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (line.toLowerCase().includes(query)) {
            results.push({
              file,
              line: idx + 1,
              content: line.trim().substring(0, 100),
              matchIndex: line.toLowerCase().indexOf(query),
            });
          }
        });
      }
    });

    setSearchResults(results.slice(0, 50)); // Limit results
  }, [searchQuery, fileContents, searchInContent, fileTypeFilter]);

  const handleAddEnvVar = () => {
    if (newEnvKey.trim() && newEnvValue.trim()) {
      setEnvVars(prev => [...prev, { key: newEnvKey.trim(), value: newEnvValue.trim() }]);
      setNewEnvKey('');
      setNewEnvValue('');
    }
  };

  const handleRemoveEnvVar = (key: string) => {
    setEnvVars(prev => prev.filter(v => v.key !== key));
  };

  return (
    <>
      {/* Neural Search Modal */}
      <Dialog open={openModal === 'neural-search'} onOpenChange={() => onClose()}>
        <DialogContent className="cyber-border bg-studio-sidebar max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="font-cyber neon-green flex items-center gap-2">
              <Search className="h-5 w-5" />
              NEURAL_SEARCH.EXE
            </DialogTitle>
            <DialogDescription className="matrix-text">
              Search across all project files with semantic precision
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter search query..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="cyber-border bg-studio-terminal matrix-text font-terminal"
                autoFocus
              />
              <Select value={fileTypeFilter} onValueChange={setFileTypeFilter}>
                <SelectTrigger className="w-32 cyber-border bg-studio-terminal">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="cyber-border bg-studio-sidebar">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="tsx">TSX</SelectItem>
                  <SelectItem value="ts">TS</SelectItem>
                  <SelectItem value="css">CSS</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Switch 
                id="search-content" 
                checked={searchInContent}
                onCheckedChange={setSearchInContent}
              />
              <Label htmlFor="search-content" className="matrix-text text-sm">
                Search in file contents
              </Label>
            </div>

            <ScrollArea className="h-[300px] cyber-border rounded-md p-2">
              {searchResults.length === 0 && searchQuery && (
                <p className="text-muted-foreground text-center py-8">No results found</p>
              )}
              {searchResults.map((result, idx) => (
                <button
                  key={`${result.file}-${result.line}-${idx}`}
                  onClick={() => {
                    onFileSelect?.(result.file);
                    onClose();
                  }}
                  className="w-full text-left p-2 hover:bg-primary/10 rounded transition-colors block"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="neon-green text-xs">
                      {result.line > 0 ? `L${result.line}` : 'FILE'}
                    </Badge>
                    <span className="matrix-text text-sm font-terminal truncate">
                      {result.file}
                    </span>
                  </div>
                  {result.line > 0 && (
                    <p className="text-xs text-muted-foreground mt-1 truncate pl-12">
                      {result.content}
                    </p>
                  )}
                </button>
              ))}
            </ScrollArea>

            <p className="text-xs text-muted-foreground">
              {searchResults.length} results found • Press Ctrl+Shift+F to open
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quantum Control Modal */}
      <Dialog open={openModal === 'quantum-control'} onOpenChange={() => onClose()}>
        <DialogContent className="cyber-border bg-studio-sidebar max-w-md">
          <DialogHeader>
            <DialogTitle className="font-cyber neon-purple flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              QUANTUM_CONTROL.SYS
            </DialogTitle>
            <DialogDescription className="matrix-text">
              Configure AI models and system parameters
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="matrix-text flex items-center gap-2">
                <Zap className="h-4 w-4 neon-purple" />
                AI Model Selection
              </Label>
              <Select value={aiModel} onValueChange={setAiModel}>
                <SelectTrigger className="cyber-border bg-studio-terminal">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="cyber-border bg-studio-sidebar">
                  <SelectItem value="gemini-flash">Gemini 2.5 Flash (Fast)</SelectItem>
                  <SelectItem value="gemini-pro">Gemini 2.5 Pro (Powerful)</SelectItem>
                  <SelectItem value="gpt-5-mini">GPT-5 Mini (Balanced)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator className="bg-primary/20" />

            <div className="space-y-2">
              <Label className="matrix-text flex items-center gap-2">
                <Clock className="h-4 w-4 neon-green" />
                Auto-Save Interval: {autoSaveInterval[0]}s
              </Label>
              <Slider
                value={autoSaveInterval}
                onValueChange={setAutoSaveInterval}
                min={10}
                max={120}
                step={10}
                className="py-2"
              />
            </div>

            <div className="space-y-2">
              <Label className="matrix-text flex items-center gap-2">
                <TerminalIcon className="h-4 w-4 neon-green" />
                Terminal History: {terminalHistorySize[0]} lines
              </Label>
              <Slider
                value={terminalHistorySize}
                onValueChange={setTerminalHistorySize}
                min={50}
                max={500}
                step={50}
                className="py-2"
              />
            </div>

            <Separator className="bg-primary/20" />

            <div className="flex items-center justify-between">
              <Label className="matrix-text flex items-center gap-2">
                Developer Mode
              </Label>
              <Switch checked={devMode} onCheckedChange={setDevMode} />
            </div>

            <Button 
              onClick={onClose}
              className="w-full neon-button"
            >
              Apply Configuration
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cyber Extensions Modal */}
      <Dialog open={openModal === 'cyber-extensions'} onOpenChange={() => onClose()}>
        <DialogContent className="cyber-border bg-studio-sidebar max-w-lg max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="font-cyber neon-green flex items-center gap-2">
              <Package className="h-5 w-5" />
              CYBER_EXTENSIONS.PKG
            </DialogTitle>
            <DialogDescription className="matrix-text">
              Browse, install, and manage community extensions
            </DialogDescription>
          </DialogHeader>
          
          <ExtensionManager />
        </DialogContent>
      </Dialog>

      {/* Matrix Config Modal */}
      <Dialog open={openModal === 'matrix-config'} onOpenChange={() => onClose()}>
        <DialogContent className="cyber-border bg-studio-sidebar max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-cyber neon-purple flex items-center gap-2">
              <Settings className="h-5 w-5" />
              MATRIX_CONFIG.ENV
            </DialogTitle>
            <DialogDescription className="matrix-text">
              Manage environment variables and API keys
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="matrix-text flex items-center gap-2">
                <Key className="h-4 w-4 neon-green" />
                Environment Variables
              </Label>
              
              <div className="flex gap-2">
                <Input
                  placeholder="KEY"
                  value={newEnvKey}
                  onChange={(e) => setNewEnvKey(e.target.value.toUpperCase())}
                  className="cyber-border bg-studio-terminal matrix-text font-terminal flex-1"
                />
                <Input
                  placeholder="Value"
                  value={newEnvValue}
                  onChange={(e) => setNewEnvValue(e.target.value)}
                  className="cyber-border bg-studio-terminal matrix-text font-terminal flex-1"
                  type="password"
                />
                <Button onClick={handleAddEnvVar} variant="outline" className="neon-green">
                  Add
                </Button>
              </div>

              <ScrollArea className="h-[150px] cyber-border rounded-md p-2">
                {envVars.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4 text-sm">
                    No custom environment variables
                  </p>
                ) : (
                  envVars.map((v) => (
                    <div key={v.key} className="flex items-center justify-between p-2 hover:bg-primary/10 rounded">
                      <div>
                        <span className="matrix-text font-terminal text-sm">{v.key}</span>
                        <span className="text-muted-foreground ml-2">= ••••••</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveEnvVar(v.key)}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </ScrollArea>
            </div>

            <Separator className="bg-primary/20" />

            <div className="space-y-2">
              <Label className="matrix-text">Connected Services</Label>
              <div className="grid grid-cols-2 gap-2">
                <Badge variant="outline" className="neon-green justify-center py-2">
                  GitHub ✓
                </Badge>
                <Badge variant="outline" className="neon-purple justify-center py-2">
                  HuggingFace ✓
                </Badge>
              </div>
            </div>

            <Separator className="bg-primary/20" />

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 neon-green">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" className="flex-1 neon-purple">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};


