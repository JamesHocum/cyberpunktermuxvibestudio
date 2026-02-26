import React, { useState, useEffect, useCallback, useRef } from "react";
import Editor, { OnMount, BeforeMount, loader } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import * as monaco from "monaco-editor";

// Use locally installed monaco-editor instead of CDN to avoid loading failures
loader.config({ monaco });
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Save, Copy, Maximize2, File, Palette, Check, Minimize2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  MonacoTheme, 
  monacoThemes, 
  getMonacoLanguage 
} from "@/lib/monacoThemes";
import { VeylStage } from "@/components/VeylStage";

interface MonacoEditorProps {
  activeFile: string | null;
  openFiles?: string[];
  onCloseFile?: (file: string) => void;
  onSelectFile?: (file: string) => void;
  fileContents?: Record<string, string>;
  onFileChange?: (filename: string, content: string) => void;
  onSave?: () => void;
  hasUnsavedChanges?: boolean;
  isBuilding?: boolean;
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

const loadTheme = (): MonacoTheme => {
  const saved = localStorage.getItem("neon-syntax-theme");
  return (saved as MonacoTheme) || "matrix";
};

const saveTheme = (theme: MonacoTheme) => {
  localStorage.setItem("neon-syntax-theme", theme);
};

export const MonacoCodeEditor = ({
  activeFile,
  openFiles = [],
  onCloseFile,
  onSelectFile,
  fileContents: externalFileContents,
  onFileChange,
  onSave,
  hasUnsavedChanges = false,
  isBuilding = false,
}: MonacoEditorProps) => {
  const [localOpenTabs, setLocalOpenTabs] = useState<string[]>(["Welcome.tsx"]);
  const [activeTab, setActiveTab] = useState("Welcome.tsx");
  const [isMaximized, setIsMaximized] = useState(false);
  const [syntaxTheme, setSyntaxTheme] = useState<MonacoTheme>(loadTheme());
  const [localFileContents, setLocalFileContents] = useState<Record<string, string>>({
    "Welcome.tsx": defaultSampleCode,
  });
  const [cursorPosition, setCursorPosition] = useState({ line: 1, col: 1 });
  const [isSaved, setIsSaved] = useState(true);
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);
  const [monacoFailed, setMonacoFailed] = useState(false);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof import("monaco-editor") | null>(null);
  const loadingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Monaco loading timeout — show retry after 10s
  useEffect(() => {
    loadingTimerRef.current = setTimeout(() => {
      if (!editorRef.current) {
        setLoadingTimedOut(true);
      }
    }, 10000);
    return () => {
      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
    };
  }, []);

  const retryMonacoLoad = () => {
    setLoadingTimedOut(false);
    setMonacoFailed(false);
    // Force re-render by toggling a key — handled via monacoFailed reset
    window.location.reload();
  };

  const fileContents = externalFileContents || localFileContents;
  const openTabs = openFiles.length > 0 ? openFiles : localOpenTabs;

  // Sync with external activeFile
  useEffect(() => {
    if (activeFile) {
      setActiveTab(activeFile);
      if (!openTabs.includes(activeFile)) {
        if (openFiles.length === 0) {
          setLocalOpenTabs((prev) => [...prev, activeFile]);
        }
      }
    }
  }, [activeFile, openTabs, openFiles.length]);

  // Auto-create template for new files
  useEffect(() => {
    if (activeFile && !fileContents[activeFile]) {
      const extension = activeFile.split(".").pop() || "";
      const template = getFileTemplate(activeFile, extension);

      if (onFileChange) {
        onFileChange(activeFile, template);
      } else {
        setLocalFileContents((prev) => ({
          ...prev,
          [activeFile]: template,
        }));
      }
    }
  }, [activeFile, fileContents, onFileChange]);

  const getFileTemplate = (filename: string, extension: string): string => {
    const name = filename.replace(/\.[^/.]+$/, "");

    switch (extension) {
      case "tsx":
      case "jsx":
        return `import React from 'react';

export const ${name} = () => {
  return (
    <div className="p-4">
      <h1>${name}</h1>
    </div>
  );
};

export default ${name};`;
      case "ts":
        return `// ${filename}\n\nexport const ${name} = () => {\n  // TODO: Implement\n};\n`;
      case "js":
        return `// ${filename}\n\nmodule.exports = {\n  // TODO: Implement\n};\n`;
      case "css":
        return `/* ${filename} */\n\n.container {\n  \n}\n`;
      case "json":
        return `{\n  "name": "${name}"\n}\n`;
      default:
        return `// ${filename}\n`;
    }
  };

  const closeTab = (tab: string) => {
    if (onCloseFile) {
      onCloseFile(tab);
    } else {
      const newTabs = localOpenTabs.filter((t) => t !== tab);
      setLocalOpenTabs(newTabs);
      if (activeTab === tab && newTabs.length > 0) {
        setActiveTab(newTabs[0]);
      }
    }
  };

  const handleContentChange = useCallback(
    (value: string | undefined) => {
      if (value === undefined) return;
      setIsSaved(false);
      if (onFileChange) {
        onFileChange(activeTab, value);
      } else {
        setLocalFileContents((prev) => ({
          ...prev,
          [activeTab]: value,
        }));
      }
    },
    [activeTab, onFileChange]
  );

  const saveCurrentFile = useCallback(() => {
    if (onSave) {
      onSave();
    }
    setIsSaved(true);
    toast.success(`Saved ${activeTab}`);
  }, [activeTab, onSave]);

  // Register themes and configure Monaco before mount
  const handleEditorWillMount: BeforeMount = (monaco) => {
    monacoRef.current = monaco;
    
    // Define custom themes
    monaco.editor.defineTheme("matrix", monacoThemes.matrix);
    monaco.editor.defineTheme("cyber", monacoThemes.cyber);
    monaco.editor.defineTheme("vaporwave", monacoThemes.vaporwave);
    monaco.editor.defineTheme("veyl-stage", monacoThemes['veyl-stage']);

    // Configure TypeScript/JavaScript for React
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.Latest,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.CommonJS,
      noEmit: true,
      esModuleInterop: true,
      jsx: monaco.languages.typescript.JsxEmit.React,
      reactNamespace: "React",
      allowJs: true,
      typeRoots: ["node_modules/@types"],
    });

    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });
  };

  // Handle editor mount
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    setLoadingTimedOut(false);
    if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);

    // Set initial theme
    monaco.editor.setTheme(syntaxTheme);

    // Add save command
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      saveCurrentFile();
    });

    // Track cursor position
    editor.onDidChangeCursorPosition((e) => {
      setCursorPosition({
        line: e.position.lineNumber,
        col: e.position.column,
      });
    });

    // Focus the editor
    editor.focus();
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(fileContents[activeTab] || "");
      toast.success("Copied to clipboard");
    } catch (err) {
      toast.error("Failed to copy");
    }
  };

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  const changeTheme = (theme: MonacoTheme) => {
    setSyntaxTheme(theme);
    saveTheme(theme);
    if (monacoRef.current) {
      monacoRef.current.editor.setTheme(theme);
    }
    toast.success(`Theme: ${theme}`);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (onSelectFile) onSelectFile(tab);
  };

  return (
    <div
      className={`flex flex-col h-full bg-studio-terminal terminal-glow ${
        isMaximized ? "fixed inset-0 z-50" : ""
      }`}
    >
      {/* Tab Bar */}
      <div className="flex items-center bg-studio-header border-b cyber-border">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1">
          <TabsList className="h-10 bg-transparent space-x-0 p-0">
            {openTabs.map((tab) => (
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
          <Badge
            variant="secondary"
            className={`text-xs font-terminal ${
              hasUnsavedChanges
                ? "bg-yellow-500/20 text-yellow-400"
                : "neon-green"
            }`}
          >
            {hasUnsavedChanges ? "UNSAVED" : "SYNCED"}
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
            {isMaximized ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
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
                onClick={() => changeTheme("matrix")}
                className="neon-green font-terminal"
              >
                Matrix Theme
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => changeTheme("cyber")}
                className="text-cyber-cyan font-terminal"
              >
                Cyber Theme
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => changeTheme("vaporwave")}
                className="text-neon-pink font-terminal"
              >
                Vaporwave Theme
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => changeTheme("veyl-stage")}
                className="text-purple-400 font-terminal"
              >
                Veyl Stage
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 relative overflow-hidden">
        {syntaxTheme === 'veyl-stage' && (
          <VeylStage
            isActive={syntaxTheme === 'veyl-stage'}
            isBuilding={isBuilding}
            hasError={false}
          />
        )}
        {monacoFailed ? (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-4 py-2 bg-yellow-500/10 border-b border-yellow-500/30">
              <span className="text-xs font-terminal text-yellow-400">⚠ Monaco Editor unavailable — using plain text fallback</span>
              <Button variant="ghost" size="sm" className="text-yellow-400 h-6 text-xs" onClick={retryMonacoLoad}>
                Retry Monaco
              </Button>
            </div>
            <textarea
              className="flex-1 w-full bg-[#0d1117] text-[#00ff88] font-mono text-sm p-4 resize-none outline-none border-none"
              value={fileContents[activeTab] || ""}
              onChange={(e) => handleContentChange(e.target.value)}
              spellCheck={false}
            />
          </div>
        ) : (
          <Editor
            height="100%"
            language={getMonacoLanguage(activeTab)}
            value={fileContents[activeTab] || ""}
            theme={syntaxTheme}
            onChange={handleContentChange}
            beforeMount={handleEditorWillMount}
            onMount={handleEditorDidMount}
            options={{
              fontFamily: "'JetBrains Mono', 'Fira Code', Monaco, Menlo, monospace",
              fontSize: 14,
              fontLigatures: true,
              lineHeight: 22,
              minimap: {
                enabled: true,
                maxColumn: 80,
                renderCharacters: false,
              },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              wordWrap: "on",
              tabSize: 2,
              insertSpaces: true,
              cursorBlinking: "smooth",
              cursorSmoothCaretAnimation: "on",
              smoothScrolling: true,
              renderLineHighlight: "all",
              renderWhitespace: "selection",
              bracketPairColorization: {
                enabled: true,
              },
              guides: {
                bracketPairs: true,
                indentation: true,
              },
              suggest: {
                showMethods: true,
                showFunctions: true,
                showConstructors: true,
                showFields: true,
                showVariables: true,
                showClasses: true,
                showStructs: true,
                showInterfaces: true,
                showModules: true,
                showProperties: true,
                showEvents: true,
                showOperators: true,
                showUnits: true,
                showValues: true,
                showConstants: true,
                showEnums: true,
                showEnumMembers: true,
                showKeywords: true,
                showWords: true,
                showColors: true,
                showFiles: true,
                showReferences: true,
                showFolders: true,
                showTypeParameters: true,
                showSnippets: true,
              },
              quickSuggestions: {
                other: true,
                comments: false,
                strings: true,
              },
              parameterHints: {
                enabled: true,
              },
              folding: true,
              foldingStrategy: "indentation",
              showFoldingControls: "always",
              padding: {
                top: 16,
                bottom: 16,
              },
            }}
            loading={
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground font-terminal gap-4">
                {loadingTimedOut ? (
                  <>
                    <span className="text-yellow-400">Monaco Editor is taking too long to load.</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={retryMonacoLoad} className="font-terminal">
                        <RefreshCw className="h-3 w-3 mr-2" /> Retry
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => setMonacoFailed(true)} className="font-terminal">
                        Use Plain Editor
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="animate-pulse">Loading neural interface...</div>
                )}
              </div>
            }
          />
        )}
      </div>

      {/* Status Bar */}
      <div className="h-6 bg-studio-header border-t cyber-border flex items-center justify-between px-4 text-xs">
        <div className="flex items-center space-x-4">
          <span className="neon-green font-terminal">
            Ln {cursorPosition.line}, Col {cursorPosition.col}
          </span>
          <span className="matrix-text font-terminal">UTF-8</span>
          <span className="matrix-text font-terminal">
            {activeTab ? getMonacoLanguage(activeTab).toUpperCase() : "No file"}
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center gap-2">
            <span className={isSaved ? "text-green-500" : "text-yellow-400"}>●</span>
            <span className="matrix-text font-terminal">
              {isSaved ? "SAVED" : "MODIFIED"}
            </span>
          </div>
          <span className="matrix-text font-terminal">Spaces: 2</span>
          <span className="neon-purple font-terminal">Monaco</span>
        </div>
      </div>
    </div>
  );
};
