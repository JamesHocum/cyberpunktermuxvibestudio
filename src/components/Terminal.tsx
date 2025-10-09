import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Plus, Settings, Square, Terminal as TerminalIcon } from "lucide-react";

export const Terminal = () => {
  const [terminals, setTerminals] = useState(['MAIN_SHELL']);
  const [activeTerminal, setActiveTerminal] = useState('MAIN_SHELL');
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState([
    'root@matrix:~$ echo "Welcome to the Matrix DevStudio"',
    'Welcome to the Matrix DevStudio',
    '',
    'root@matrix:~$ system --init --neural-interface',
    '[OK] Neural interface initialized',
    '[OK] AI subsystems online',
    '[OK] Natural language processing: ACTIVE',
    '',
    'root@matrix:~$ npm create cyberpunk-app --template matrix',
    'Creating cyberpunk application...',
    '[OK] Installing neon dependencies',
    '[OK] Configuring holographic display',
    '[OK] Injecting cyberpunk aesthetics',
    '',
    'root@matrix:~$ ai --help',
    'AI Commands Available:',
    '  ai code <description>    - Generate code from natural language',
    '  ai debug <error>        - Debug and fix code issues',
    '  ai optimize <file>      - Optimize performance',
    '  ai create <component>   - Create new components',
    '',
    'root@matrix:~$ echo "Ready for neural commands..."',
    'Ready for neural commands...',
    ''
  ]);

  const addTerminal = () => {
    const newTerminal = `SHELL_${terminals.length + 1}`;
    setTerminals([...terminals, newTerminal]);
    setActiveTerminal(newTerminal);
  };

  const closeTerminal = (terminal: string) => {
    const newTerminals = terminals.filter(t => t !== terminal);
    setTerminals(newTerminals);
    if (activeTerminal === terminal && newTerminals.length > 0) {
      setActiveTerminal(newTerminals[0]);
    }
  };

  const executeCommand = () => {
    if (!command.trim()) return;
    
    const newHistory = [...history, `root@matrix:~$ ${command}`];
    
    // Enhanced command responses with cyberpunk flair
    if (command.includes('npm run build')) {
      newHistory.push(
        '[INFO] Compiling neural networks...',
        '[OK] Quantum compilation complete',
        '[OK] Holographic assets generated',
        '✓ Build complete - ready for deployment to the matrix',
        ''
      );
    } else if (command.includes('ai ')) {
      newHistory.push(
        '[AI] Processing neural request...',
        '[AI] Interfacing with quantum processors...',
        '[OK] AI task completed successfully',
        ''
      );
    } else if (command.includes('git')) {
      newHistory.push(
        '[GIT] Syncing with neural repository...',
        '[OK] Matrix state synchronized',
        ''
      );
    } else if (command.includes('ls') || command.includes('dir')) {
      newHistory.push(
        'cyberpunk_components/',
        'neural_networks/',
        'matrix_assets/',
        'quantum_deps/',
        'package.json',
        'README.matrix',
        ''
      );
    } else if (command.includes('help')) {
      newHistory.push(
        'MATRIX TERMINAL - Neural Command Interface',
        '',
        'Standard Commands:',
        '  ls, dir          - List neural directories',
        '  cd <path>        - Navigate matrix paths',
        '  npm <command>    - Package quantum modules',
        '  git <command>    - Version control via neural net',
        '',
        'AI Commands:',
        '  ai code <desc>   - Generate code from thoughts',
        '  ai debug <err>   - Neural debugging interface',
        '  ai create <comp> - Manifest new components',
        '',
        'Matrix Commands:',
        '  matrix --status  - Check neural network status',
        '  cyber --theme    - Toggle cyberpunk aesthetics',
        '  hack --mode      - Enter hacker mode',
        ''
      );
    } else {
      newHistory.push(
        `[EXEC] Processing command: ${command}`,
        '[OK] Neural command executed',
        ''
      );
    }
    
    setHistory(newHistory);
    setCommand('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeCommand();
    }
  };

  return (
    <div className="flex flex-col h-full bg-studio-terminal terminal-glow">
      {/* Terminal Header */}
      <div className="flex items-center justify-between bg-studio-header border-b cyber-border h-10">
        <Tabs value={activeTerminal} onValueChange={setActiveTerminal} className="flex-1">
          <TabsList className="h-full bg-transparent space-x-0 p-0">
            {terminals.map(terminal => (
              <TabsTrigger
                key={terminal}
                value={terminal}
                className="h-full px-4 rounded-none border-r cyber-border data-[state=active]:bg-studio-terminal neon-green data-[state=active]:neon-green relative group font-terminal"
              >
                <TerminalIcon className="h-3 w-3 mr-2 neon-green" />
                <span className="text-sm">{terminal}</span>
                {terminals.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2 h-4 w-4 p-0 opacity-0 group-hover:opacity-100 neon-purple hover:neon-glow"
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTerminal(terminal);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        
        <div className="flex items-center space-x-2 px-4">
          <Badge variant="secondary" className="text-xs bg-green-500/20 neon-green border-green-500/30 font-terminal">
            NEURAL_LINK_ACTIVE
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={addTerminal}
            className="neon-green hover:neon-glow"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="neon-purple hover:neon-glow"
          >
            <Square className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="neon-green hover:neon-glow"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Terminal Content */}
      <div className="flex-1 overflow-auto cyber-scrollbar">
        <Tabs value={activeTerminal} className="h-full">
          {terminals.map(terminal => (
            <TabsContent key={terminal} value={terminal} className="h-full m-0">
              <div className="p-4 font-terminal text-sm h-full flex flex-col">
                {/* Command History */}
                <div className="flex-1 space-y-1 mb-4">
                  {history.map((line, index) => (
                    <div 
                      key={index} 
                      className={
                        line.startsWith('root@matrix:~$') 
                          ? 'neon-purple font-semibold' 
                          : line.startsWith('[OK]') 
                          ? 'neon-green'
                          : line.startsWith('[AI]') 
                          ? 'neon-purple'
                          : line.startsWith('[INFO]') 
                          ? 'neon-cyan'
                          : line.startsWith('[EXEC]') 
                          ? 'neon-green'
                          : line.startsWith('✓')
                          ? 'neon-green'
                          : 'matrix-text'
                      }
                    >
                      {line}
                    </div>
                  ))}
                </div>
                
                {/* Current Command Line */}
                <div className="flex items-center">
                  <span className="neon-purple mr-2 font-bold">root@matrix:~$</span>
                  <input
                    type="text"
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1 bg-transparent border-none outline-none matrix-text font-terminal flicker"
                    placeholder="Enter neural command or natural language..."
                    autoFocus
                  />
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};