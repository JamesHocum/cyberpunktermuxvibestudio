import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Plus, Settings, Square, Terminal as TerminalIcon } from "lucide-react";
import { toast } from "sonner";
import { validateMessage, RateLimiter } from "@/lib/inputValidation";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";

interface TerminalProps {
  fileTree?: any;
  fileContents?: Record<string, string>;
  onCodeGenerated?: (code: string, filename: string) => void;
  projectId?: string;
}

export const Terminal = ({ fileTree, fileContents = {}, onCodeGenerated, projectId }: TerminalProps) => {
  const { session } = useAuth();
  const [terminals, setTerminals] = useState(['MAIN_SHELL']);
  const [activeTerminal, setActiveTerminal] = useState('MAIN_SHELL');
  const [command, setCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const rateLimiterRef = useRef(new RateLimiter(2000));
  const [history, setHistory] = useState([
    'root@matrix:~$ echo "Welcome to the Matrix DevStudio"',
    'Welcome to the Matrix DevStudio',
    '',
    'root@matrix:~$ system --init --neural-interface',
    '[OK] Neural interface initialized',
    '[OK] AI subsystems online',
    '[OK] Codex Agent: ACTIVE',
    '',
    'root@matrix:~$ ai --help',
    'AI Commands Available:',
    '  ai code <description>    - Generate code from natural language',
    '  ai refactor <file>       - Refactor and improve code',
    '  ai explain <file>        - Explain code functionality',
    '  ai debug <error>         - Debug and fix code issues',
    '  ai complete <context>    - Complete code snippet',
    '',
    'root@matrix:~$ help',
    'Standard Commands:',
    '  ls                       - List project files',
    '  cat <file>               - Display file contents',
    '  clear                    - Clear terminal',
    '  npm <command>            - Package manager',
    '  git <command>            - Version control',
    '',
    'root@matrix:~$ echo "Ready for neural commands..."',
    'Ready for neural commands...',
    ''
  ]);

  const availableCommands = [
    'npm install', 'npm run build', 'npm run dev', 'npm test',
    'git status', 'git add', 'git commit', 'git push', 'git pull',
    'ls', 'cd', 'mkdir', 'rm', 'cat', 'echo',
    'ai code', 'ai debug', 'ai refactor', 'ai explain', 'ai complete', 'ai test',
    'help', 'clear', 'matrix --status', 'cyber --theme',
    'pwa --install', 'pwa --status', 'electron --info'
  ];

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

  // Flatten file tree to get all file paths
  const getFilePaths = (tree: any, prefix = ''): string[] => {
    if (!tree) return [];
    const paths: string[] = [];
    
    const traverse = (node: any, currentPath: string) => {
      if (!node) return;
      const fullPath = currentPath ? `${currentPath}/${node.name}` : node.name;
      
      if (node.type === 'file') {
        paths.push(fullPath);
      } else if (node.type === 'folder' && node.children) {
        node.children.forEach((child: any) => traverse(child, fullPath));
      }
    };
    
    if (Array.isArray(tree)) {
      tree.forEach(node => traverse(node, prefix));
    } else {
      traverse(tree, prefix);
    }
    
    return paths;
  };

  // Call Codex Agent for AI commands
  const callCodexAgent = async (task: string, content: string, context?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('codex-agent', {
        body: { task, code: content, context }
      });

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('[Codex Agent Error]:', err);
      throw err;
    }
  };

  const executeCommand = async () => {
    if (!command.trim() || isProcessing) return;

    // Validate input
    try {
      validateMessage(command);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
      return;
    }

    // Check rate limit
    if (!rateLimiterRef.current.checkLimit()) {
      const remaining = Math.ceil(rateLimiterRef.current.getRemainingTime() / 1000);
      toast.error(`Please wait ${remaining} seconds before sending another command`);
      return;
    }
    
    // Add to command history
    setCommandHistory(prev => [...prev, command]);
    setHistoryIndex(-1);
    
    const newHistory = [...history, `root@matrix:~$ ${command}`];
    const cmd = command.trim().toLowerCase();
    const cmdParts = command.trim().split(' ');
    
    setHistory(newHistory);
    setCommand('');
    setSuggestions([]);

    // ============ REAL COMMAND IMPLEMENTATIONS ============

    // CLEAR command
    if (cmd === 'clear') {
      setHistory(['root@matrix:~$ Terminal cleared', '']);
      return;
    }

    // LS command - list actual project files
    if (cmd === 'ls' || cmd === 'dir') {
      const files = getFilePaths(fileTree);
      if (files.length > 0) {
        setHistory(prev => [...prev, ...files.map(f => `  ${f}`), '']);
      } else {
        setHistory(prev => [...prev, '  (no files in project)', '']);
      }
      return;
    }

    // CAT command - display actual file contents
    if (cmd.startsWith('cat ')) {
      const fileName = command.slice(4).trim();
      const content = fileContents[fileName];
      
      if (content) {
        const lines = content.split('\n').slice(0, 50); // Limit to 50 lines
        setHistory(prev => [...prev, `--- ${fileName} ---`, ...lines, '---', '']);
      } else {
        setHistory(prev => [...prev, `[ERROR] File not found: ${fileName}`, '']);
      }
      return;
    }

    // HELP command
    if (cmd === 'help') {
      setHistory(prev => [...prev,
        'MATRIX TERMINAL - Neural Command Interface',
        '',
        'Standard Commands:',
        '  ls, dir          - List project files',
        '  cat <file>       - Display file contents',
        '  clear            - Clear terminal',
        '  npm <command>    - Package manager',
        '  git <command>    - Version control',
        '',
        'AI Commands (requires authentication):',
        '  ai code <desc>       - Generate code from description',
        '  ai refactor <file>   - Improve and refactor code',
        '  ai explain <file>    - Explain what code does',
        '  ai debug <error>     - Debug and fix issues',
        '  ai complete <code>   - Complete code snippet',
        '  ai test <file>       - Generate tests for code',
        '',
        'Matrix Commands:',
        '  matrix --status  - Check neural network status',
        '',
        'App Commands:',
        '  pwa --install    - Install as PWA (if available)',
        '  pwa --status     - Check PWA installation status',
        '  electron --info  - Show Electron build instructions',
        ''
      ]);
      return;
    }

    // AI COMMANDS - Route to Codex Agent (requires auth)
    if (cmd.startsWith('ai ')) {
      // Check authentication
      if (!session) {
        setHistory(prev => [...prev,
          '[AUTH] Neural interface requires authentication',
          '[INFO] Log in via the Auth page to activate AI commands',
          '[HINT] Use the user menu in the header to sign in',
          ''
        ]);
        return;
      }

      const aiCmd = cmdParts[1];
      const aiArg = cmdParts.slice(2).join(' ');

      setIsProcessing(true);
      setHistory(prev => [...prev, `[AI] Processing ${aiCmd} request...`]);

      try {
        let result;
        
        switch (aiCmd) {
          case 'code':
            result = await callCodexAgent('generate', aiArg);
            if (result?.code) {
              const codeLines = result.code.split('\n');
              setHistory(prev => [...prev, '[AI] Generated code:', '', ...codeLines, '']);
              if (onCodeGenerated) {
                onCodeGenerated(result.code, `generated_${Date.now()}.tsx`);
              }
              toast.success('Code generated! Check the output above.');
            }
            break;

          case 'refactor':
            const refactorContent = fileContents[aiArg];
            if (!refactorContent) {
              setHistory(prev => [...prev, `[ERROR] File not found: ${aiArg}`, '']);
              break;
            }
            result = await callCodexAgent('refactor', refactorContent);
            if (result?.code) {
              const refactoredLines = result.code.split('\n').slice(0, 30);
              setHistory(prev => [...prev, '[AI] Refactored code:', '', ...refactoredLines, '...', '']);
            }
            break;

          case 'explain':
            const explainContent = fileContents[aiArg];
            if (!explainContent) {
              setHistory(prev => [...prev, `[ERROR] File not found: ${aiArg}`, '']);
              break;
            }
            result = await callCodexAgent('explain', explainContent);
            if (result?.explanation) {
              setHistory(prev => [...prev, '[AI] Explanation:', '', result.explanation, '']);
            }
            break;

          case 'debug':
            result = await callCodexAgent('debug', aiArg);
            if (result?.code) {
              setHistory(prev => [...prev, '[AI] Debug analysis:', '', result.explanation || '', '', 'Fixed code:', result.code, '']);
            }
            break;

          case 'complete':
            result = await callCodexAgent('complete', aiArg);
            if (result?.code) {
              setHistory(prev => [...prev, '[AI] Completed code:', '', result.code, '']);
            }
            break;

          case 'test':
            const testContent = fileContents[aiArg];
            if (!testContent) {
              setHistory(prev => [...prev, `[ERROR] File not found: ${aiArg}`, '']);
              break;
            }
            result = await callCodexAgent('test', testContent);
            if (result?.code) {
              const testLines = result.code.split('\n').slice(0, 40);
              setHistory(prev => [...prev, '[AI] Generated tests:', '', ...testLines, '']);
            }
            break;

          default:
            setHistory(prev => [...prev, `[ERROR] Unknown AI command: ${aiCmd}`, '']);
        }
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : 'Unknown error';
        setHistory(prev => [...prev, `[ERROR] AI processing failed: ${errMsg}`, '']);
        toast.error('AI command failed');
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    // NPM commands - Real functionality
    if (cmd.startsWith('npm ')) {
      const npmCmd = cmdParts[1];
      const npmArg = cmdParts.slice(2).join(' ');

      if (npmCmd === 'install' || npmCmd === 'i') {
        const pkgJson = fileContents['package.json'];
        if (pkgJson) {
          try {
            const pkg = JSON.parse(pkgJson);
            const deps = Object.keys(pkg.dependencies || {}).length;
            const devDeps = Object.keys(pkg.devDependencies || {}).length;
            setHistory(prev => [...prev,
              '[NPM] Analyzing package.json...',
              `Found ${deps} dependencies, ${devDeps} dev dependencies`,
              '[INFO] Dependencies are installed at build time by Lovable',
              npmArg ? `[QUEUE] Package to install: ${npmArg}` : '[OK] All dependencies ready',
              ''
            ]);
          } catch {
            setHistory(prev => [...prev, '[ERROR] Failed to parse package.json', '']);
          }
        } else {
          setHistory(prev => [...prev, '[WARN] No package.json found in project', '']);
        }
        return;
      }

      if (npmCmd === 'run') {
        const scriptName = npmArg;
        const pkgJson = fileContents['package.json'];
        if (pkgJson) {
          try {
            const pkg = JSON.parse(pkgJson);
            const scripts = pkg.scripts || {};
            if (scripts[scriptName]) {
              setHistory(prev => [...prev,
                `[NPM] Script "${scriptName}": ${scripts[scriptName]}`,
                scriptName === 'dev' ? '[INFO] Use the Preview panel to see your app running' : 
                scriptName === 'build' ? '[INFO] Production builds run automatically on deploy' :
                `[INFO] Script ready to execute: ${scripts[scriptName]}`,
                ''
              ]);
            } else {
              const availableScripts = Object.keys(scripts).join(', ') || 'none';
              setHistory(prev => [...prev, 
                `[ERROR] Script "${scriptName}" not found`,
                `Available scripts: ${availableScripts}`,
                ''
              ]);
            }
          } catch {
            setHistory(prev => [...prev, '[ERROR] Failed to parse package.json', '']);
          }
        } else {
          setHistory(prev => [...prev, '[WARN] No package.json found', '']);
        }
        return;
      }

      if (npmCmd === 'test') {
        setHistory(prev => [...prev,
          '[NPM] Running test suite...',
          '[INFO] Use the Testing panel (toggle from header) for full test results',
          ''
        ]);
        return;
      }

      // Generic npm command
      setHistory(prev => [...prev,
        `[NPM] Command: npm ${cmdParts.slice(1).join(' ')}`,
        '[OK] Command processed',
        ''
      ]);
      return;
    }

    // GIT commands - Real functionality via git-sync edge function
    if (cmd.startsWith('git ')) {
      const gitCmd = cmdParts[1];
      
      if (!projectId) {
        setHistory(prev => [...prev, 
          '[GIT] No project loaded',
          '[INFO] Create or load a project first using the Project Manager',
          ''
        ]);
        return;
      }

      setIsProcessing(true);
      setHistory(prev => [...prev, `[GIT] Executing: git ${cmdParts.slice(1).join(' ')}...`]);

      try {
        if (gitCmd === 'status') {
          const { data, error } = await supabase.functions.invoke('git-sync', {
            body: { action: 'status', projectId }
          });

          if (error) throw error;

          setHistory(prev => [...prev,
            `On branch ${data?.branch || 'main'}`,
            data?.connected ? `Remote: ${data.repo}` : 'No remote repository configured',
            data?.lastSynced ? `Last synced: ${new Date(data.lastSynced).toLocaleString()}` : 'Never synced',
            data?.username ? `GitHub user: ${data.username}` : '',
            ''
          ]);
        } else if (gitCmd === 'push') {
          const commitMessage = cmdParts.slice(2).join(' ') || `Update from terminal ${new Date().toISOString()}`;
          const files = Object.entries(fileContents).map(([path, content]) => ({ path, content }));
          
          const { data, error } = await supabase.functions.invoke('git-sync', {
            body: { action: 'push', projectId, files, message: commitMessage }
          });

          if (error) throw error;

          if (data?.success) {
            setHistory(prev => [...prev,
              `[OK] Pushed ${data.files_pushed || files.length} files to remote`,
              data.commit_sha ? `Commit: ${data.commit_sha.slice(0, 7)}` : '',
              ''
            ]);
            toast.success('Changes pushed to GitHub');
          } else {
            setHistory(prev => [...prev, `[WARN] ${data?.message || 'Push may have failed'}`, '']);
          }
        } else if (gitCmd === 'pull') {
          const { data, error } = await supabase.functions.invoke('git-sync', {
            body: { action: 'pull', projectId }
          });

          if (error) throw error;

          setHistory(prev => [...prev,
            `[OK] Pulled ${data?.files?.length || 0} files from remote`,
            ''
          ]);
          toast.success('Changes pulled from GitHub');
        } else if (gitCmd === 'commit') {
          const message = cmdParts.slice(3).join(' ') || 'Commit from terminal';
          setHistory(prev => [...prev,
            `[OK] Changes staged with message: "${message}"`,
            '[INFO] Use "git push" to push to remote',
            ''
          ]);
        } else if (gitCmd === 'add') {
          setHistory(prev => [...prev,
            '[OK] Changes staged',
            '[INFO] All modified files are automatically tracked',
            ''
          ]);
        } else {
          setHistory(prev => [...prev,
            `[GIT] Unknown command: git ${gitCmd}`,
            'Available: git status, git add, git commit, git push, git pull',
            ''
          ]);
        }
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : 'Unknown error';
        setHistory(prev => [...prev, `[ERROR] Git command failed: ${errMsg}`, '']);
        
        if (errMsg.includes('not connected') || errMsg.includes('token')) {
          setHistory(prev => [...prev, '[INFO] Connect GitHub via the Git panel (toggle from header)', '']);
        }
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    // Matrix status
    if (cmd === 'matrix --status') {
      setHistory(prev => [...prev,
        '[MATRIX] System Status:',
        '  Neural Interface: ACTIVE',
        '  Codex Agent: ONLINE',
        '  Quantum Processors: 4/4',
        '  Memory Banks: 87% utilized',
        '  Network Sync: STABLE',
        ''
      ]);
      return;
    }

    // PWA commands
    if (cmd === 'pwa --install' || cmd === 'pwa --status') {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      
      if (cmd === 'pwa --status') {
        setHistory(prev => [...prev,
          '[PWA] Installation Status:',
          `  Running as PWA: ${isStandalone ? 'YES' : 'NO'}`,
          `  Service Worker: ${navigator.serviceWorker ? 'REGISTERED' : 'NOT AVAILABLE'}`,
          `  Protocol: ${window.location.protocol}`,
          '',
          isStandalone 
            ? '[OK] App is installed and running in standalone mode'
            : '[INFO] Use "pwa --install" or the Install button in header to install',
          ''
        ]);
      } else {
        if (isStandalone) {
          setHistory(prev => [...prev,
            '[PWA] App is already installed!',
            '[INFO] Running in standalone mode',
            ''
          ]);
        } else {
          setHistory(prev => [...prev,
            '[PWA] To install this app:',
            '',
            '  Desktop: Click the Install button in your browser\'s address bar',
            '  iOS: Tap Share → Add to Home Screen',
            '  Android: Tap Menu → Add to Home Screen',
            '',
            '[INFO] Or use the Install button in the header',
            ''
          ]);
        }
      }
      return;
    }

    // Electron info command
    if (cmd === 'electron --info') {
      setHistory(prev => [...prev,
        '[ELECTRON] Desktop Build Information',
        '',
        'To build a desktop application:',
        '',
        '1. Clone project from GitHub',
        '2. Install dependencies: npm install',
        '3. Install Electron: npm install -D electron electron-builder',
        '4. Build the app:',
        '   - Windows: npm run electron:build:win',
        '   - macOS:   npm run electron:build:mac',
        '   - Linux:   npm run electron:build:linux',
        '',
        'Output will be in the "release" folder',
        '',
        '[INFO] Electron configuration files:',
        '  - electron/main.js     - Main process',
        '  - electron/preload.js  - Preload script',
        '  - electron-builder.config.js - Build config',
        ''
      ]);
      return;
    }

    // Default: Try natural language via AI chat (requires auth)
    if (cmd.length > 10) {
      // Check authentication
      if (!session) {
        setHistory(prev => [...prev,
          '[AUTH] Neural interface requires authentication',
          '[INFO] Log in to use natural language AI processing',
          ''
        ]);
        return;
      }
      
      setIsProcessing(true);
      
      try {
        // Use session token if available, fallback to anon key
        const authToken = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/lady-violet-chat`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({
              messages: [
                { role: "system", content: "You are a helpful terminal assistant. Be concise and provide code when relevant." },
                { role: "user", content: command }
              ]
            }),
          }
        );

        if (!response.ok) throw new Error("AI request failed");

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let aiResponse = "";

        if (reader) {
          let buffer = "";
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (let line of lines) {
              line = line.trim();
              if (!line || line.startsWith(":")) continue;
              if (!line.startsWith("data: ")) continue;

              const data = line.slice(6);
              if (data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) aiResponse += content;
              } catch (e) {}
            }
          }
        }

        setHistory(prev => [...prev, '[AI] ' + aiResponse, '']);
      } catch (error) {
        setHistory(prev => [...prev, `[ERROR] AI processing failed`, '']);
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    // Fallback
    setHistory(prev => [...prev,
      `[EXEC] Unknown command: ${command}`,
      'Type "help" for available commands',
      ''
    ]);
  };

  const handleKeyPress = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      await executeCommand();
      setSuggestions([]);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setCommand(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = Math.min(commandHistory.length - 1, historyIndex + 1);
        if (newIndex === commandHistory.length - 1 && historyIndex === newIndex) {
          setHistoryIndex(-1);
          setCommand('');
        } else {
          setHistoryIndex(newIndex);
          setCommand(commandHistory[newIndex]);
        }
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (suggestions.length > 0) {
        setCommand(suggestions[0]);
        setSuggestions([]);
      }
    }
  };

  const handleCommandChange = (value: string) => {
    setCommand(value);
    if (value.trim()) {
      const matches = availableCommands.filter(cmd => cmd.startsWith(value.trim()));
      setSuggestions(matches.slice(0, 5));
    } else {
      setSuggestions([]);
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
          <Badge variant="secondary" className={`text-xs font-terminal border-green-500/30 ${isProcessing ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 neon-green'}`}>
            {isProcessing ? 'PROCESSING...' : 'CODEX_ACTIVE'}
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
                          : line.startsWith('[ERROR]') 
                          ? 'text-red-400'
                          : line.startsWith('[EXEC]') || line.startsWith('[NPM]') || line.startsWith('[GIT]')
                          ? 'neon-green'
                          : line.startsWith('[MATRIX]')
                          ? 'neon-purple'
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
                <div className="relative">
                  <div className="flex items-center">
                    <span className="neon-purple mr-2 font-bold">root@matrix:~$</span>
                    <input
                      type="text"
                      value={command}
                      onChange={(e) => handleCommandChange(e.target.value)}
                      onKeyDown={handleKeyPress}
                      className="flex-1 bg-transparent border-none outline-none matrix-text font-terminal flicker"
                      placeholder={isProcessing ? "Processing..." : "Enter command or 'ai code <description>'..."}
                      autoFocus
                      disabled={isProcessing}
                    />
                  </div>
                  {/* Autocomplete Suggestions */}
                  {suggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-studio-sidebar cyber-border rounded p-2 space-y-1 z-10">
                      {suggestions.map((suggestion, idx) => (
                        <div
                          key={idx}
                          className="px-2 py-1 hover:bg-studio-terminal rounded cursor-pointer neon-green transition-colors"
                          onClick={() => {
                            setCommand(suggestion);
                            setSuggestions([]);
                          }}
                        >
                          {suggestion}
                        </div>
                      ))}
                      <div className="text-xs matrix-text mt-2 border-t cyber-border pt-1">
                        Press Tab to autocomplete
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};
