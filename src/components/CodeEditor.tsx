import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Save, Copy, Maximize2, File, Palette, Check } from "lucide-react";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type NeonTheme = 'matrix' | 'cyber' | 'vaporwave';

const themeStyles = {
  matrix: {
    ...tomorrow,
    'pre[class*="language-"]': {
      ...tomorrow['pre[class*="language-"]'],
      background: 'transparent',
      margin: 0,
      padding: 0,
    },
    'code[class*="language-"]': {
      ...tomorrow['code[class*="language-"]'],
      color: '#00ff41',
      fontFamily: 'JetBrains Mono, Monaco, Menlo, monospace',
    },
    keyword: { color: '#8c00ff' },
    string: { color: '#00ff41' },
    function: { color: '#00d4ff' },
    comment: { color: '#666', fontStyle: 'italic' },
  },
  cyber: {
    ...tomorrow,
    'pre[class*="language-"]': {
      ...tomorrow['pre[class*="language-"]'],
      background: 'transparent',
      margin: 0,
      padding: 0,
    },
    'code[class*="language-"]': {
      ...tomorrow['code[class*="language-"]'],
      color: '#00d4ff',
      fontFamily: 'JetBrains Mono, Monaco, Menlo, monospace',
    },
    keyword: { color: '#ff006e' },
    string: { color: '#00d4ff' },
    function: { color: '#ffbe0b' },
    comment: { color: '#666', fontStyle: 'italic' },
  },
  vaporwave: {
    ...tomorrow,
    'pre[class*="language-"]': {
      ...tomorrow['pre[class*="language-"]'],
      background: 'transparent',
      margin: 0,
      padding: 0,
    },
    'code[class*="language-"]': {
      ...tomorrow['code[class*="language-"]'],
      color: '#ff006e',
      fontFamily: 'JetBrains Mono, Monaco, Menlo, monospace',
    },
    keyword: { color: '#8c00ff' },
    string: { color: '#ff006e' },
    function: { color: '#00d4ff' },
    comment: { color: '#666', fontStyle: 'italic' },
  },
};

const saveTheme = (theme: NeonTheme) => {
  localStorage.setItem('neon-syntax-theme', theme);
};

const loadTheme = (): NeonTheme => {
  const saved = localStorage.getItem('neon-syntax-theme');
  return (saved as NeonTheme) || 'matrix';
};

interface CodeEditorProps {
  activeFile: string | null;
  openFiles?: string[];
  onCloseFile?: (file: string) => void;
  onSelectFile?: (file: string) => void;
  fileContents?: Record<string, string>;
  onFileChange?: (filename: string, content: string) => void;
  onSave?: () => void;
  hasUnsavedChanges?: boolean;
}

const defaultSampleCode = `// Welcome to Matrix DevStudio
// Select or create a file to start coding

import React from 'react';

const App = () => {
  return (
    <div className="p-6 neon-glow">
      <h1 className="text-2xl font-cyber neon-green">
        Matrix DevStudio
      </h1>
      <p className="matrix-text">
        Your cyberpunk coding environment
      </p>
    </div>
  );
};

export default App;`;

export const CodeEditor = ({ 
  activeFile, 
  openFiles = [], 
  onCloseFile, 
  onSelectFile,
  fileContents: externalFileContents,
  onFileChange,
  onSave,
  hasUnsavedChanges = false
}: CodeEditorProps) => {
  const [localOpenTabs, setLocalOpenTabs] = useState<string[]>(['Welcome.tsx']);
  const [activeTab, setActiveTab] = useState('Welcome.tsx');
  const [isMaximized, setIsMaximized] = useState(false);
  const [syntaxTheme, setSyntaxTheme] = useState<NeonTheme>(loadTheme());
  const [localFileContents, setLocalFileContents] = useState<Record<string, string>>({
    'Welcome.tsx': defaultSampleCode
  });
  const [cursorPosition, setCursorPosition] = useState({ line: 1, col: 1 });
  const [isSaved, setIsSaved] = useState(true);

  // Use external file contents if provided, otherwise use local
  const fileContents = externalFileContents || localFileContents;
  const openTabs = openFiles.length > 0 ? openFiles : localOpenTabs;

  // Sync with external activeFile
  useEffect(() => {
    if (activeFile) {
      setActiveTab(activeFile);
      if (!openTabs.includes(activeFile)) {
        if (openFiles.length === 0) {
          setLocalOpenTabs(prev => [...prev, activeFile]);
        }
      }
    }
  }, [activeFile, openTabs, openFiles.length]);

  // Auto-create template for new files
  useEffect(() => {
    if (activeFile && !fileContents[activeFile]) {
      const extension = activeFile.split('.').pop() || '';
      const template = getFileTemplate(activeFile, extension);
      
      if (onFileChange) {
        onFileChange(activeFile, template);
      } else {
        setLocalFileContents(prev => ({
          ...prev,
          [activeFile]: template
        }));
      }
    }
  }, [activeFile, fileContents, onFileChange]);

  const getFileTemplate = (filename: string, extension: string): string => {
    const name = filename.replace(/\.[^/.]+$/, '');
    
    switch (extension) {
      case 'tsx':
      case 'jsx':
        return `import React from 'react';

export const ${name} = () => {
  return (
    <div className="p-4">
      <h1>${name}</h1>
    </div>
  );
};

export default ${name};`;
      case 'ts':
        return `// ${filename}\n\nexport const ${name} = () => {\n  // TODO: Implement\n};\n`;
      case 'js':
        return `// ${filename}\n\nmodule.exports = {\n  // TODO: Implement\n};\n`;
      case 'css':
        return `/* ${filename} */\n\n.container {\n  \n}\n`;
      case 'json':
        return `{\n  "name": "${name}"\n}\n`;
      default:
        return `// ${filename}\n`;
    }
  };

  const closeTab = (tab: string) => {
    if (onCloseFile) {
      onCloseFile(tab);
    } else {
      const newTabs = localOpenTabs.filter(t => t !== tab);
      setLocalOpenTabs(newTabs);
      if (activeTab === tab && newTabs.length > 0) {
        setActiveTab(newTabs[0]);
      }
    }
  };

  const handleContentChange = useCallback((tab: string, newContent: string) => {
    setIsSaved(false);
    if (onFileChange) {
      onFileChange(tab, newContent);
    } else {
      setLocalFileContents(prev => ({
        ...prev,
        [tab]: newContent
      }));
    }
  }, [onFileChange]);

  const saveCurrentFile = useCallback(() => {
    if (onSave) {
      onSave();
    }
    setIsSaved(true);
    toast.success(`Saved ${activeTab}`);
  }, [activeTab, onSave]);

  // Keyboard shortcut for save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveCurrentFile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveCurrentFile]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(fileContents[activeTab] || '');
      toast.success('Copied to clipboard');
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  const changeTheme = (theme: NeonTheme) => {
    setSyntaxTheme(theme);
    saveTheme(theme);
    toast.success(`Theme: ${theme}`);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>, tab: string) => {
    const newContent = e.target.value;
    handleContentChange(tab, newContent);
    
    // Update cursor position
    const textarea = e.target;
    const text = textarea.value.substring(0, textarea.selectionStart);
    const lines = text.split('\n');
    setCursorPosition({
      line: lines.length,
      col: lines[lines.length - 1].length + 1
    });
  };

  const getLanguage = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'css':
        return 'css';
      case 'json':
        return 'json';
      case 'html':
        return 'html';
      case 'md':
        return 'markdown';
      default:
        return 'typescript';
    }
  };

  return (
    <div className={`flex flex-col h-full bg-studio-terminal terminal-glow ${isMaximized ? 'fixed inset-0 z-50' : ''}`}>
      {/* Tab Bar */}
      <div className="flex items-center bg-studio-header border-b cyber-border">
        <Tabs value={activeTab} onValueChange={(tab) => {
          setActiveTab(tab);
          if (onSelectFile) onSelectFile(tab);
        }} className="flex-1">
          <TabsList className="h-10 bg-transparent space-x-0 p-0">
            {openTabs.map(tab => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="h-10 px-4 rounded-none border-r cyber-border data-[state=active]:bg-studio-terminal data-[state=active]:neon-green data-[state=active]:border-b-2 data-[state=active]:border-neon-green relative group font-terminal"
              >
                <File className="h-3 w-3 mr-2 neon-green" />
                <span className="text-sm">{tab}</span>
                {!isSaved && activeTab === tab && (
                  <span className="ml-1 text-yellow-400">●</span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-2 h-4 w-4 p-0 opacity-0 group-hover:opacity-100 neon-purple hover:neon-glow"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        
        <div className="flex items-center space-x-2 px-4">
          <Badge variant="secondary" className={`text-xs font-terminal ${hasUnsavedChanges ? 'bg-yellow-500/20 text-yellow-400' : 'neon-green'}`}>
            {hasUnsavedChanges ? 'UNSAVED' : 'SYNCED'}
          </Badge>
          <Button 
            variant="ghost" 
            size="sm" 
            className="neon-green hover:neon-glow"
            onClick={saveCurrentFile}
            title="Save (Ctrl+S)"
          >
            {isSaved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="neon-purple hover:neon-glow"
            onClick={copyToClipboard}
            title="Copy code"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="neon-green hover:neon-glow"
            onClick={toggleMaximize}
            title={isMaximized ? "Exit fullscreen" : "Maximize"}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="neon-purple hover:neon-glow"
                title="Theme"
              >
                <Palette className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="cyber-border terminal-glow bg-studio-sidebar">
              <DropdownMenuItem 
                onClick={() => changeTheme('matrix')}
                className="neon-green font-terminal"
              >
                Matrix Theme
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => changeTheme('cyber')}
                className="text-cyber-cyan font-terminal"
              >
                Cyber Theme
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => changeTheme('vaporwave')}
                className="text-neon-pink font-terminal"
              >
                Vaporwave Theme
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 relative overflow-hidden">
        <Tabs value={activeTab} className="h-full">
          {openTabs.map(tab => (
            <TabsContent key={tab} value={tab} className="h-full m-0">
              <div className="h-full flex">
                {/* Line Numbers */}
                <div className="w-12 bg-studio-sidebar cyber-border flex flex-col text-xs text-muted-foreground font-terminal overflow-hidden">
                  <div className="p-2 border-b cyber-border">
                    <span className="neon-purple">#</span>
                  </div>
                  <div className="flex-1 overflow-auto cyber-scrollbar">
                    {(fileContents[tab] || '').split('\n').map((_, i) => (
                      <div
                        key={i + 1}
                        className={`px-2 py-0.5 text-right transition-colors ${cursorPosition.line === i + 1 ? 'neon-green bg-muted/20' : 'hover:bg-muted/20'}`}
                      >
                        {i + 1}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Code Area */}
                <div className="flex-1 relative">
                  <div className="absolute inset-0 pointer-events-none overflow-auto p-4 cyber-scrollbar">
                    <SyntaxHighlighter
                      language={getLanguage(tab)}
                      style={themeStyles[syntaxTheme]}
                      customStyle={{
                        background: 'transparent',
                        margin: 0,
                        padding: 0,
                        fontSize: '0.875rem',
                        lineHeight: '1.25rem',
                      }}
                      codeTagProps={{
                        style: {
                          fontFamily: 'JetBrains Mono, Monaco, Menlo, monospace',
                        }
                      }}
                    >
                      {fileContents[tab] || ''}
                    </SyntaxHighlighter>
                  </div>
                  <textarea
                    value={fileContents[tab] || ''}
                    onChange={(e) => handleTextareaChange(e, tab)}
                    className="w-full h-full p-4 bg-transparent text-transparent caret-neon-green font-terminal text-sm leading-5 resize-none focus:outline-none selection:bg-primary/20 cyber-scrollbar relative z-10"
                    style={{ fontFamily: 'JetBrains Mono, Monaco, Menlo, monospace' }}
                    spellCheck={false}
                    placeholder="// Enter your neural code here..."
                  />
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Status Bar */}
      <div className="h-6 bg-studio-header border-t cyber-border flex items-center justify-between px-4 text-xs">
        <div className="flex items-center space-x-4">
          <span className="neon-green font-terminal">Ln {cursorPosition.line}, Col {cursorPosition.col}</span>
          <span className="matrix-text font-terminal">UTF-8</span>
          <span className="matrix-text font-terminal">{activeTab ? getLanguage(activeTab).toUpperCase() : 'No file'}</span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center gap-2">
            <span className={isSaved ? "text-green-500" : "text-yellow-400"}>●</span>
            <span className="matrix-text font-terminal">{isSaved ? 'SAVED' : 'MODIFIED'}</span>
          </div>
          <span className="matrix-text font-terminal">Spaces: 2</span>
        </div>
      </div>
    </div>
  );
};
