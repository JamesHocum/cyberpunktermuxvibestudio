import { useState } from "react";
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
  Database
} from "lucide-react";
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

interface StudioSidebarProps {
  onFileSelect: (file: string) => void;
  activeFile?: string;
}

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  extension?: string;
  children?: FileNode[];
  expanded?: boolean;
}

const cyberpunkProject: FileNode = {
  name: "cyberpunk-devstudio",
  type: "folder",
  expanded: true,
  children: [
    {
      name: "src",
      type: "folder",
      expanded: true,
      children: [
        { name: "App.tsx", type: "file", extension: "tsx" },
        { name: "main.tsx", type: "file", extension: "tsx" },
        { name: "index.css", type: "file", extension: "css" },
        {
          name: "components",
          type: "folder",
          expanded: true,
          children: [
            { name: "CyberButton.tsx", type: "file", extension: "tsx" },
            { name: "NeonHeader.tsx", type: "file", extension: "tsx" },
            { name: "MatrixTerminal.tsx", type: "file", extension: "tsx" },
            { name: "HolographicCard.tsx", type: "file", extension: "tsx" }
          ]
        },
        {
          name: "neural",
          type: "folder",
          children: [
            { name: "ai-interface.ts", type: "file", extension: "ts" },
            { name: "quantum-state.ts", type: "file", extension: "ts" }
          ]
        }
      ]
    },
    {
      name: "assets",
      type: "folder",
      children: [
        { name: "cyber-logo.svg", type: "file", extension: "svg" },
        { name: "matrix-bg.png", type: "file", extension: "png" },
        { name: "neon-patterns.css", type: "file", extension: "css" }
      ]
    },
    { name: "package.json", type: "file", extension: "json" },
    { name: "cyberpunk.config.js", type: "file", extension: "js" },
    { name: "NEURAL_README.md", type: "file", extension: "md" }
  ]
};

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

export const StudioSidebar = ({ onFileSelect, activeFile = '' }: StudioSidebarProps) => {
  const [project, setProject] = useState<FileNode>(cyberpunkProject);
  const [searchQuery, setSearchQuery] = useState("");

  const toggleFolderExpanded = (node: FileNode, targetPath: string[], currentPath: string[] = []): FileNode => {
    const nodePath = [...currentPath, node.name];
    const pathMatch = nodePath.join('/') === targetPath.join('/');
    
    if (pathMatch && node.type === 'folder') {
      return { ...node, expanded: !node.expanded };
    }
    
    if (node.children) {
      return {
        ...node,
        children: node.children.map(child => 
          toggleFolderExpanded(child, targetPath, nodePath)
        )
      };
    }
    
    return node;
  };

  const toggleFolder = (path: string[]) => {
    setProject(prevProject => toggleFolderExpanded(prevProject, path, []));
  };

  const createNewFile = () => {
    const fileName = prompt("Enter file name (e.g., Component.tsx or foldername/):");
    if (!fileName?.trim()) return;
    
    const trimmedName = fileName.trim();
    const isFolder = trimmedName.endsWith('/');
    const name = isFolder ? trimmedName.slice(0, -1) : trimmedName;
    const extension = isFolder ? undefined : name.split('.').pop();
    
    const newNode: FileNode = {
      name,
      type: isFolder ? 'folder' : 'file',
      extension,
      expanded: isFolder ? true : undefined,
      children: isFolder ? [] : undefined
    };
    
    setProject(prevProject => ({
      ...prevProject,
      children: [...(prevProject.children || []), newNode]
    }));
    
    if (!isFolder) {
      onFileSelect(`${project.name}/${name}`);
    }
  };

  const renderFileTree = (node: FileNode, path: string[] = []) => {
    const isFolder = node.type === 'folder';
    const currentPath = [...path, node.name];
    const fullPath = currentPath.join('/');
    const isActive = !isFolder && fullPath === activeFile;
    
    return (
      <SidebarMenuItem key={fullPath}>
        <SidebarMenuButton
          onClick={() => {
            if (isFolder) {
              toggleFolder(currentPath);
            } else {
              onFileSelect(fullPath);
            }
          }}
          className={`w-full justify-start hover:neon-glow transition-all duration-200 font-terminal ${
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
            <span className="text-sm matrix-text">{node.name}</span>
          </div>
        </SidebarMenuButton>
        
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
            FILE_TREE.SYS
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
              {renderFileTree(project)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="font-cyber neon-green">MATRIX_TOOLS</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton className="hover:neon-glow matrix-text font-terminal">
                  <Search className="h-4 w-4 neon-green" />
                  <span>Neural Search</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton className="hover:neon-glow matrix-text font-terminal">
                  <GitBranch className="h-4 w-4 neon-purple" />
                  <span>Quantum Control</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton className="hover:neon-glow matrix-text font-terminal">
                  <Package className="h-4 w-4 neon-green" />
                  <span>Cyber Extensions</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton className="hover:neon-glow matrix-text font-terminal">
                  <Settings className="h-4 w-4 neon-purple" />
                  <span>Matrix Config</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};