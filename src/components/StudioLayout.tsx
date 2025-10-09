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
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

export const StudioLayout = () => {
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [showTerminal, setShowTerminal] = useState(true);
  const [showApiConfig, setShowApiConfig] = useState(false);
  const [showDownloader, setShowDownloader] = useState(false);
  const [showTesting, setShowTesting] = useState(false);
  const [apiKey, setApiKey] = useState<string>("DEFAULT");

  return (
    <div className="h-screen w-full bg-studio-bg text-matrix-green dark font-terminal">
      <SidebarProvider>
        <div className="flex h-full w-full">
          <StudioSidebar onFileSelect={setActiveFile} />
          
          <div className="flex-1 flex flex-col">
            <StudioHeader 
              onToggleChat={() => setShowChat(!showChat)}
              onToggleTerminal={() => setShowTerminal(!showTerminal)}
              onToggleApiConfig={() => setShowApiConfig(!showApiConfig)}
              onToggleDownloader={() => setShowDownloader(!showDownloader)}
              onToggleTesting={() => setShowTesting(!showTesting)}
              showChat={showChat}
              showTerminal={showTerminal}
              showApiConfig={showApiConfig}
              showDownloader={showDownloader}
              showTesting={showTesting}
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
                    <CodeEditor activeFile={activeFile} />
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
      </SidebarProvider>
    </div>
  );
};