import { useState, useCallback } from "react";
import { 
  ChevronDown, 
  ChevronRight, 
  File, 
  FolderOpen, 
  Folder,
  Plus,
  Search,
  GitBranch,
  Package,
  Settings,
  FileText,
  Code,
  Image,
  Database,
  Trash2
} from "lucide-react";
import { MatrixToolsPanel, ModalType } from "./MatrixToolsPanel";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FileNode } from "@/hooks/useProject";

interface StudioSidebarProps {
  onFileSelect: (file: string) => void;
  activeFile?: string;
  fileTree: FileNode;
  onToggleFolder: (path: string[]) => void;
  onCreateFile: (parentPath: string, fileName: string, isFolder?: boolean) => void;
  onDeleteFile: (filePath: string) => void;
  currentProjectName?: string;
  fileContents?: Record<string, string>;
}

const getCyberFileIcon = (extension?: string) => {
  switch (extension) {
    case 'tsx':
    case 'jsx':
      return <Code className="h-4 w-4 neon-green" />;
    case 'js':
    case 'ts':
      return <Code className="h-4 w-4 neon-purple" />;
    case 'css':
    case 'scss':
      return <FileText className="h-4 w-4 neon-cyan" />;
    case 'html':
      return <FileText className="h-4 w-4 text-orange-400" />;
    case 'json':
      return <Database className="h-4 w-4 neon-green" />;
    case 'md':
      return <FileText className="h-4 w-4 matrix-text" />;
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'svg':
      return <Image className="h-4 w-4 neon-purple" />;
    default:
      return <File className="h-4 w-4 matrix-text" />;
  }
};

export const StudioSidebar = ({ 
  onFileSelect, 
  activeFile = '',
  fileTree,
  onToggleFolder,
  onCreateFile,
  onDeleteFile,
  currentProjectName,
  fileContents = {}
}: StudioSidebarProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [openModal, setOpenModal] = useState<ModalType>(null);

  const handleOpenModal = useCallback((modal: ModalType) => {
    setOpenModal(modal);
  }, []);

  const handleCloseModal = useCallback(() => {
    setOpenModal(null);
  }, []);

  const createNewFile = () => {
    const fileName = prompt("Enter file name (e.g., Component.tsx or foldername/):");
    if (!fileName?.trim()) return;
    
    const trimmedName = fileName.trim();
    const isFolder = trimmedName.endsWith('/');
    const name = isFolder ? trimmedName.slice(0, -1) : trimmedName;
    
    onCreateFile(fileTree.name, name, isFolder);
  };

  const handleDeleteFile = (e: React.MouseEvent, filePath: string) => {
    e.stopPropagation();
    if (confirm(`Delete "${filePath}"?`)) {
      onDeleteFile(filePath);
    }
  };

  const filterFileTree = (node: FileNode): FileNode | null => {
    if (!searchQuery.trim()) return node;
    
    const query = searchQuery.toLowerCase();
    
    if (node.type === 'file') {
      return node.name.toLowerCase().includes(query) ? node : null;
    }
    
    if (node.type === 'folder') {
      const filteredChildren = node.children
        ?.map(child => filterFileTree(child))
        .filter(Boolean) as FileNode[] | undefined;
      
      if (filteredChildren && filteredChildren.length > 0) {
        return { ...node, children: filteredChildren, expanded: true };
      }
      
      return node.name.toLowerCase().includes(query) ? { ...node, expanded: true } : null;
    }
    
    return node;
  };

  const renderFileTree = (node: FileNode, path: string[] = []) => {
    const isFolder = node.type === 'folder';
    const currentPath = [...path, node.name];
    const fullPath = currentPath.join('/');
    const isActive = !isFolder && fullPath === activeFile;
    
    return (
      <SidebarMenuItem key={fullPath}>
        <div className="group flex items-center">
          <SidebarMenuButton
            onClick={() => {
              if (isFolder) {
                onToggleFolder(currentPath);
              } else {
                onFileSelect(fullPath);
              }
            }}
            className={`flex-1 justify-start hover:neon-glow transition-all duration-200 font-terminal ${
              isActive ? 'neon-glow bg-studio-terminal' : ''
            }`}
          >
            <div className="flex items-center space-x-2">
              {isFolder ? (
                <>
                  {node.expanded ? (
                    <ChevronDown className="h-4 w-4 neon-green" />
                  ) : (
                    <ChevronRight className="h-4 w-4 neon-green" />
                  )}
                  {node.expanded ? (
                    <FolderOpen className="h-4 w-4 neon-purple" />
                  ) : (
                    <Folder className="h-4 w-4 neon-purple" />
                  )}
                </>
              ) : (
                <>
                  <div className="w-4" />
                  {getCyberFileIcon(node.extension)}
                </>
              )}
              <span className="text-sm matrix-text truncate">{node.name}</span>
            </div>
          </SidebarMenuButton>
          
          {!isFolder && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => handleDeleteFile(e, fullPath)}
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 hover:bg-red-500/20"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
        
        {isFolder && node.expanded && node.children && (
          <div className="ml-4 border-l cyber-border pl-2">
            {node.children.map(child => renderFileTree(child, currentPath))}
          </div>
        )}
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar className="w-64 cyber-border bg-studio-sidebar">
      <SidebarContent className="cyber-scrollbar">
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between font-cyber neon-purple">
            <div className="flex items-center gap-2">
              FILE_TREE.SYS
              {currentProjectName && (
                <Badge className="text-[10px] bg-neon-green/20 neon-green border-neon-green/30">
                  {currentProjectName}
                </Badge>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="neon-green hover:neon-glow"
              onClick={createNewFile}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="mb-2">
              <Input
                placeholder="Search neural files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 cyber-border bg-studio-terminal matrix-text font-terminal placeholder:text-muted-foreground"
              />
            </div>
            <SidebarMenu>
              {(() => {
                const filteredTree = filterFileTree(fileTree);
                return filteredTree ? renderFileTree(filteredTree) : (
                  <div className="text-sm matrix-text text-center py-4">
                    No files match your search
                  </div>
                );
              })()}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="font-cyber neon-green">MATRIX_TOOLS</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  className="hover:neon-glow matrix-text font-terminal"
                  onClick={() => handleOpenModal('neural-search')}
                >
                  <Search className="h-4 w-4 neon-green" />
                  <span>Neural Search</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  className="hover:neon-glow matrix-text font-terminal"
                  onClick={() => handleOpenModal('quantum-control')}
                >
                  <GitBranch className="h-4 w-4 neon-purple" />
                  <span>Quantum Control</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  className="hover:neon-glow matrix-text font-terminal"
                  onClick={() => handleOpenModal('cyber-extensions')}
                >
                  <Package className="h-4 w-4 neon-green" />
                  <span>Cyber Extensions</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  className="hover:neon-glow matrix-text font-terminal"
                  onClick={() => handleOpenModal('matrix-config')}
                >
                  <Settings className="h-4 w-4 neon-purple" />
                  <span>Matrix Config</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <MatrixToolsPanel
        openModal={openModal}
        onClose={handleCloseModal}
        fileContents={fileContents}
        onFileSelect={onFileSelect}
      />
    </Sidebar>
  );
};
