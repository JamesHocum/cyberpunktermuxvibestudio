import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Save, Copy, Maximize2, File, Palette } from "lucide-react";
import { highlightCode, saveTheme, loadTheme, type NeonTheme } from "@/lib/neonSyntaxHighlighter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CodeEditorProps {
  activeFile: string | null;
  openFiles?: string[];
  onCloseFile?: (file: string) => void;
  onSelectFile?: (file: string) => void;
}

const cyberpunkSampleCode = `import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Zap, Circuit } from 'lucide-react';

const CyberpunkComponent = () => {
  const [neuralState, setNeuralState] = useState(0);
  const [quantumLink, setQuantumLink] = useState(false);

  const activateNeuralInterface = () => {
    setNeuralState(prev => prev + 1);
    setQuantumLink(true);
    console.log('Neural interface activated!');
  };

  return (
    <div className="p-6 space-y-4 cyber-gradient">
      <h1 className="text-2xl font-cyber font-bold neon-green flicker">
        Welcome to the Matrix DevStudio
      </h1>
      
      <p className="matrix-text font-terminal">
        Build cyberpunk applications with neural-enhanced coding
      </p>
      
      <div className="flex items-center space-x-4">
        <Button 
          onClick={activateNeuralInterface}
          className="neon-glow pulse-glow cyber-border"
        >
          <Zap className="h-4 w-4 mr-2 neon-green" />
          Neural Count: {neuralState}
        </Button>
        
        <Button 
          variant="outline" 
          className="cyber-border neon-purple hover:neon-glow"
        >
          <Circuit className="h-4 w-4 mr-2" />
          Reset Matrix
        </Button>
      </div>
      
      {quantumLink && (
        <div className="p-4 cyber-border terminal-glow rounded">
          <p className="neon-green font-terminal">
            [OK] Quantum entanglement established
          </p>
        </div>
      )}
    </div>
  );
};

export default CyberpunkComponent;`;

export const CodeEditor = ({ activeFile, openFiles = [], onCloseFile, onSelectFile }: CodeEditorProps) => {
  const [openTabs, setOpenTabs] = useState(['CyberApp.tsx', 'NeuralInterface.tsx']);
  const [activeTab, setActiveTab] = useState('CyberApp.tsx');
  const [code, setCode] = useState(cyberpunkSampleCode);
  const [isMaximized, setIsMaximized] = useState(false);
  const [syntaxTheme, setSyntaxTheme] = useState<NeonTheme>(loadTheme());
  const [fileContents, setFileContents] = useState<Record<string, string>>({
    'CyberApp.tsx': cyberpunkSampleCode,
    'NeuralInterface.tsx': '// Neural interface component\n\nexport const NeuralInterface = () => {\n  return <div>Neural Link Active</div>;\n};'
  });

  // Sync with external openFiles prop
  React.useEffect(() => {
    if (openFiles.length > 0) {
      setOpenTabs(openFiles);
    }
  }, [openFiles]);

  // Sync with external activeFile and create template
  React.useEffect(() => {
    if (activeFile && !fileContents[activeFile]) {
      const extension = activeFile.split('.').pop() || '';
      const template = extension === 'tsx' || extension === 'jsx' 
        ? `// ${activeFile}\nimport React from 'react';\n\nexport const Component = () => {\n  return <div>New Component</div>;\n};`
        : `// ${activeFile}\n`;
      
      setFileContents(prev => ({
        ...prev,
        [activeFile]: template
      }));
    }
    if (activeFile) {
      setActiveTab(activeFile);
    }
  }, [activeFile, fileContents]);

  const closeTab = (tab: string) => {
    if (onCloseFile) {
      onCloseFile(tab);
    } else {
      const newTabs = openTabs.filter(t => t !== tab);
      setOpenTabs(newTabs);
      if (activeTab === tab && newTabs.length > 0) {
        setActiveTab(newTabs[0]);
      }
    }
  };

  const createNewFile = () => {
    const fileName = `NewFile${openTabs.length + 1}.tsx`;
    setOpenTabs([...openTabs, fileName]);
    setFileContents({
      ...fileContents,
      [fileName]: '// New neural file\n\nimport React from \'react\';\n\nconst Component = () => {\n  return (\n    <div>\n      // Your code here\n    </div>\n  );\n};\n\nexport default Component;'
    });
    setActiveTab(fileName);
  };

  const saveCurrentFile = () => {
    setFileContents({
      ...fileContents,
      [activeTab]: code
    });
    console.log(`[SAVE] File ${activeTab} saved to neural storage`);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(fileContents[activeTab] || code);
      console.log('[COPY] Code copied to quantum clipboard');
    } catch (err) {
      console.error('[ERROR] Failed to copy code:', err);
    }
  };

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  const changeTheme = (theme: NeonTheme) => {
    setSyntaxTheme(theme);
    saveTheme(theme);
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
          <Badge variant="secondary" className="text-xs neon-green font-terminal">
            TypeScript React | Matrix Enhanced
          </Badge>
          <Button 
            variant="ghost" 
            size="sm" 
            className="neon-green hover:neon-glow"
            onClick={createNewFile}
            title="Create new file"
          >
            <File className="h-4 w-4 mr-1" />
            <span className="text-xs">New</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="neon-green hover:neon-glow"
            onClick={saveCurrentFile}
            title="Save current file"
          >
            <Save className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="neon-purple hover:neon-glow"
            onClick={copyToClipboard}
            title="Copy code to clipboard"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="neon-green hover:neon-glow"
            onClick={toggleMaximize}
            title={isMaximized ? "Exit fullscreen" : "Maximize editor"}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="neon-purple hover:neon-glow"
                title="Change syntax theme"
              >
                <Palette className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="cyber-border terminal-glow">
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
      <div className="flex-1 relative">
        <Tabs value={activeTab} className="h-full">
          {openTabs.map(tab => (
            <TabsContent key={tab} value={tab} className="h-full m-0">
              <div className="h-full flex">
                {/* Line Numbers */}
                <div className="w-12 bg-studio-sidebar cyber-border flex flex-col text-xs text-muted-foreground font-terminal">
                  <div className="p-2 border-b cyber-border">
                    <span className="neon-purple">#</span>
                  </div>
                  {Array.from({ length: 40 }, (_, i) => (
                    <div
                      key={i + 1}
                      className="px-2 py-0.5 text-right hover:bg-muted/20 transition-colors neon-green"
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>
                
                {/* Code Area */}
                <div className="flex-1 relative">
                  <div className="absolute inset-0 pointer-events-none overflow-auto p-4 font-terminal text-sm leading-5 cyber-scrollbar">
                    <pre
                      dangerouslySetInnerHTML={{
                        __html: highlightCode(fileContents[tab] || code, syntaxTheme)
                      }}
                      className="m-0"
                      style={{ fontFamily: 'JetBrains Mono, Monaco, Menlo, monospace' }}
                    />
                  </div>
                  <textarea
                    value={fileContents[tab] || code}
                    onChange={(e) => {
                      const newContent = e.target.value;
                      setCode(newContent);
                      setFileContents({
                        ...fileContents,
                        [tab]: newContent
                      });
                    }}
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
          <span className="neon-green font-terminal">Ln 24, Col 12</span>
          <span className="matrix-text font-terminal">UTF-8</span>
          <span className="matrix-text font-terminal">{activeTab ? 'TypeScript Matrix' : 'No neural file'}</span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center gap-2">
            <span className="neon-purple">●</span>
            <span className="matrix-text font-terminal">MATRIX_MODE</span>
          </div>
          <span className="matrix-text font-terminal">Quantum Spaces: 2</span>
        </div>
      </div>
    </div>
  );
};