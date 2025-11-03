import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { StudioSidebar } from "./StudioSidebar";
import { StudioHeader } from "./StudioHeader";
import { CodeEditor } from "./CodeEditor";
import { Terminal } from "./Terminal";
import { AIChatPanel } from "./AIChatPanel";
import StudioApiKeySelector from "./StudioApiKeySelector";
import { ProjectDownloader } from "./ProjectDownloader";
import { TestingSuite } from "./TestingSuite";
import { IntegrationPanel } from "./IntegrationPanel";
import { GitPanel } from "./GitPanel";
import { SettingsPanel } from "./SettingsPanel";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
export const StudioLayout = () => {
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [showTerminal, setShowTerminal] = useState(true);
  const [showApiConfig, setShowApiConfig] = useState(false);
  const [showDownloader, setShowDownloader] = useState(false);
  const [showTesting, setShowTesting] = useState(false);
  const [showIntegrations, setShowIntegrations] = useState(false);
  const [showGit, setShowGit] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState<string>("DEFAULT");
  const [openFiles, setOpenFiles] = useState<string[]>([]);

  const handleFileSelect = (file: string) => {
    setActiveFile(file);
    if (!openFiles.includes(file)) {
      setOpenFiles(prev => [...prev, file]);
    }
  };

  const handleCloseFile = (file: string) => {
    setOpenFiles(prev => prev.filter(f => f !== file));
    if (activeFile === file) {
      const index = openFiles.indexOf(file);
      const newActiveFile = openFiles[index - 1] || openFiles[index + 1] || null;
      setActiveFile(newActiveFile);
    }
  };

  return (
    <div className="h-screen w-full bg-studio-bg text-matrix-green font-terminal">
      <SidebarProvider>
        <div className="flex h-full w-full">
          <StudioSidebar onFileSelect={handleFileSelect} activeFile={activeFile} />
          
          <div className="flex-1 flex flex-col">
          <StudioHeader 
            onToggleChat={() => setShowChat(!showChat)}
            onToggleTerminal={() => setShowTerminal(!showTerminal)}
            onToggleApiConfig={() => setShowApiConfig(!showApiConfig)}
            onToggleDownloader={() => setShowDownloader(!showDownloader)}
            onToggleTesting={() => setShowTesting(!showTesting)}
            onToggleIntegrations={() => setShowIntegrations(!showIntegrations)}
            showChat={showChat}
            showTerminal={showTerminal}
            showApiConfig={showApiConfig}
            showDownloader={showDownloader}
            showTesting={showTesting}
            showIntegrations={showIntegrations}
            onToggleGit={() => setShowGit(!showGit)}
            onToggleSettings={() => setShowSettings(!showSettings)}
          />
            
            {showApiConfig && (
              <div className="p-4 border-b bg-muted/50">
                <StudioApiKeySelector onKeyChange={setApiKey} />
              </div>
            )}
            
            <ResizablePanelGroup direction="horizontal" className="flex-1">
              <ResizablePanel defaultSize={showChat ? 70 : 100} minSize={50}>
                <ResizablePanelGroup direction="vertical">
                  <ResizablePanel defaultSize={showTerminal ? 70 : 100} minSize={30}>
                    <CodeEditor 
                      activeFile={activeFile} 
                      openFiles={openFiles}
                      onCloseFile={handleCloseFile}
                      onSelectFile={setActiveFile}
                    />
                  </ResizablePanel>
                  
                  {showTerminal && (
                    <>
                      <ResizableHandle />
                      <ResizablePanel defaultSize={30} minSize={20}>
                        <Terminal />
                      </ResizablePanel>
                    </>
                  )}
                </ResizablePanelGroup>
              </ResizablePanel>
              
              {showChat && (
                <>
                  <ResizableHandle />
                  <ResizablePanel defaultSize={30} minSize={25} maxSize={50}>
                    <AIChatPanel />
                  </ResizablePanel>
                </>
              )}
            </ResizablePanelGroup>
          </div>
        </div>
        
        <ProjectDownloader 
          isVisible={showDownloader} 
          onClose={() => setShowDownloader(false)} 
        />
        
        <TestingSuite 
          isVisible={showTesting} 
          onClose={() => setShowTesting(false)} 
        />
        
        <IntegrationPanel 
          isVisible={showIntegrations} 
          onClose={() => setShowIntegrations(false)} 
        />
        
        <GitPanel 
          isVisible={showGit} 
          onClose={() => setShowGit(false)} 
        />
        
        <SettingsPanel 
          isVisible={showSettings} 
          onClose={() => setShowSettings(false)} 
        />
      </SidebarProvider>
    </div>
  );
};