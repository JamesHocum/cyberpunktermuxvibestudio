import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Save, Copy, Maximize2, File } from "lucide-react";

interface CodeEditorProps {
  activeFile: string | null;
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

export const CodeEditor = ({ activeFile }: CodeEditorProps) => {
  const [openTabs, setOpenTabs] = useState(['CyberApp.tsx', 'NeuralInterface.tsx']);
  const [activeTab, setActiveTab] = useState('CyberApp.tsx');
  const [code, setCode] = useState(cyberpunkSampleCode);

  const closeTab = (tab: string) => {
    const newTabs = openTabs.filter(t => t !== tab);
    setOpenTabs(newTabs);
    if (activeTab === tab && newTabs.length > 0) {
      setActiveTab(newTabs[0]);
    }
  };

  return (
    <div className="flex flex-col h-full bg-studio-terminal terminal-glow">
      {/* Tab Bar */}
      <div className="flex items-center bg-studio-header border-b cyber-border">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
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
          <Button variant="ghost" size="sm" className="neon-green hover:neon-glow">
            <Save className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="neon-purple hover:neon-glow">
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="neon-green hover:neon-glow">
            <Maximize2 className="h-4 w-4" />
          </Button>
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
                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full h-full p-4 bg-transparent matrix-text font-terminal text-sm leading-5 resize-none focus:outline-none selection:bg-primary/20 cyber-scrollbar"
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