import { useState, useEffect, useCallback } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { StudioSidebar } from "./StudioSidebar";
import { StudioHeader } from "./StudioHeader";
import { MonacoCodeEditor } from "./MonacoEditor";
import { LivePreview } from "./LivePreview";
import { Terminal } from "./Terminal";
import { AIChatPanel } from "./AIChatPanel";
import StudioApiKeySelector from "./StudioApiKeySelector";
import { ProjectDownloader } from "./ProjectDownloader";
import { TestingSuite } from "./TestingSuite";
import { IntegrationPanel } from "./IntegrationPanel";
import { GitPanel } from "./GitPanel";
import { SettingsPanel } from "./SettingsPanel";
import { StudioFooter } from "./StudioFooter";
import { ProjectManagerModal } from "./ProjectManagerModal";
import { NeonModuleSelector } from "./NeonModuleSelector";
import { DevModeIndicator } from "./DevModeIndicator";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useProject } from "@/hooks/useProject";

export const StudioLayout = () => {
  const {
    currentProject,
    fileTree,
    fileContents,
    projects,
    isLoading,
    isSaving,
    history,
    hasUnsavedChanges,
    loadProject,
    saveProject,
    createProject,
    deleteProject,
    updateFileContent,
    createFile,
    deleteFile,
    clearProject,
    toggleFolder
  } = useProject();

  useEffect(() => {
    document.body.style.background = '#111';
    document.body.style.overflow = 'auto';
    
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('[PWA] Service Worker registered'))
        .catch(err => console.log('[PWA] SW failed:', err));
    }
  }, []);

  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [showTerminal, setShowTerminal] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [showApiConfig, setShowApiConfig] = useState(false);
  const [showDownloader, setShowDownloader] = useState(false);
  const [showTesting, setShowTesting] = useState(false);
  const [showIntegrations, setShowIntegrations] = useState(false);
  const [showGit, setShowGit] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProjectManager, setShowProjectManager] = useState(false);
  const [apiKey, setApiKey] = useState<string>("DEFAULT");
  const [openFiles, setOpenFiles] = useState<string[]>([]);

  const handleFileSelect = useCallback((file: string) => {
    setActiveFile(file);
    if (!openFiles.includes(file)) {
      setOpenFiles(prev => [...prev, file]);
    }
  }, [openFiles]);

  const handleCloseFile = useCallback((file: string) => {
    setOpenFiles(prev => prev.filter(f => f !== file));
    if (activeFile === file) {
      const index = openFiles.indexOf(file);
      const newActiveFile = openFiles[index - 1] || openFiles[index + 1] || null;
      setActiveFile(newActiveFile);
    }
  }, [activeFile, openFiles]);

  const handleFileChange = useCallback((filename: string, content: string) => {
    updateFileContent(filename, content);
  }, [updateFileContent]);

  const handleSave = useCallback(() => {
    saveProject();
  }, [saveProject]);

  // Handle AI code generation from terminal
  const handleCodeGenerated = useCallback((code: string, filename: string) => {
    createFile(filename, 'file');
    updateFileContent(filename, code);
    handleFileSelect(filename);
  }, [createFile, updateFileContent, handleFileSelect]);

  // Convert file contents to array format for GitPanel
  const filesForGit = Object.entries(fileContents).map(([path, content]) => ({
    path,
    content
  }));

  return (
    <div className="h-screen w-full bg-studio-bg text-matrix-green font-terminal overflow-hidden">
      <SidebarProvider>
        <div className="flex h-full w-full overflow-hidden">
          <StudioSidebar 
            onFileSelect={handleFileSelect} 
            activeFile={activeFile || ''}
            fileTree={fileTree}
            onToggleFolder={toggleFolder}
            onCreateFile={createFile}
            onDeleteFile={deleteFile}
            currentProjectName={currentProject?.name}
            fileContents={fileContents}
          />
          
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <StudioHeader
              onToggleChat={() => setShowChat(!showChat)}
              onToggleTerminal={() => setShowTerminal(!showTerminal)}
              onTogglePreview={() => setShowPreview(!showPreview)}
              onToggleApiConfig={() => setShowApiConfig(!showApiConfig)}
              onToggleDownloader={() => setShowDownloader(!showDownloader)}
              onToggleTesting={() => setShowTesting(!showTesting)}
              onToggleIntegrations={() => setShowIntegrations(!showIntegrations)}
              showChat={showChat}
              showTerminal={showTerminal}
              showPreview={showPreview}
              showApiConfig={showApiConfig}
              showDownloader={showDownloader}
              showTesting={showTesting}
              showIntegrations={showIntegrations}
              onToggleGit={() => setShowGit(!showGit)}
              onToggleSettings={() => setShowSettings(!showSettings)}
              onToggleProjectManager={() => setShowProjectManager(!showProjectManager)}
              onSave={handleSave}
              isSaving={isSaving}
              hasUnsavedChanges={hasUnsavedChanges}
              currentProjectName={currentProject?.name}
            />
            
            {showApiConfig && (
              <div className="p-4 border-b bg-muted/50">
                <StudioApiKeySelector onKeyChange={setApiKey} />
              </div>
            )}
            
            <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">
              <ResizablePanel defaultSize={showChat || showPreview ? 60 : 100} minSize={40}>
                <ResizablePanelGroup direction="vertical" className="h-full">
                  <ResizablePanel defaultSize={showTerminal ? 70 : 100} minSize={30}>
                    <MonacoCodeEditor 
                      activeFile={activeFile} 
                      openFiles={openFiles}
                      onCloseFile={handleCloseFile}
                      onSelectFile={setActiveFile}
                      fileContents={fileContents}
                      onFileChange={handleFileChange}
                      onSave={handleSave}
                      hasUnsavedChanges={hasUnsavedChanges}
                    />
                  </ResizablePanel>
                  
                  {showTerminal && (
                    <>
                      <ResizableHandle />
                      <ResizablePanel defaultSize={30} minSize={20}>
                        <Terminal 
                          fileTree={fileTree}
                          fileContents={fileContents}
                          onCodeGenerated={handleCodeGenerated}
                          projectId={currentProject?.id}
                        />
                      </ResizablePanel>
                    </>
                  )}
                </ResizablePanelGroup>
              </ResizablePanel>
              
              {showPreview && (
                <>
                  <ResizableHandle />
                  <ResizablePanel defaultSize={40} minSize={25} maxSize={60}>
                    <LivePreview 
                      content={activeFile ? (fileContents[activeFile] || '') : ''}
                      filename={activeFile || 'untitled'}
                    />
                  </ResizablePanel>
                </>
              )}
              
              {showChat && (
                <>
                  <ResizableHandle />
                  <ResizablePanel defaultSize={30} minSize={25} maxSize={50}>
                    <AIChatPanel 
                      onProjectCreated={loadProject}
                      currentProjectId={currentProject?.id}
                    />
                  </ResizablePanel>
                </>
              )}
            </ResizablePanelGroup>
            
            <StudioFooter 
              projectId={currentProject?.id}
              hasUnsavedChanges={hasUnsavedChanges}
              onSyncClick={() => setShowGit(true)}
            />
          </div>
        </div>
        
        <ProjectManagerModal
          isVisible={showProjectManager}
          onClose={() => setShowProjectManager(false)}
          projects={projects}
          currentProject={currentProject}
          history={history}
          isLoading={isLoading}
          isSaving={isSaving}
          hasUnsavedChanges={hasUnsavedChanges}
          onCreateProject={createProject}
          onLoadProject={loadProject}
          onDeleteProject={deleteProject}
          onSaveProject={saveProject}
          onClearProject={clearProject}
        />
        
        <ProjectDownloader
          isVisible={showDownloader} 
          onClose={() => setShowDownloader(false)}
          projectName={currentProject?.name || 'MyProject'}
          fileContents={fileContents}
        />
        
        <TestingSuite 
          isVisible={showTesting} 
          onClose={() => setShowTesting(false)}
          fileContents={fileContents}
        />
        
        <IntegrationPanel 
          isVisible={showIntegrations} 
          onClose={() => setShowIntegrations(false)} 
        />
        
        <GitPanel 
          isVisible={showGit} 
          onClose={() => setShowGit(false)}
          projectId={currentProject?.id}
          files={filesForGit}
        />
        
        <SettingsPanel 
          isVisible={showSettings} 
          onClose={() => setShowSettings(false)} 
        />
        
        <DevModeIndicator />
      </SidebarProvider>
    </div>
  );
};
