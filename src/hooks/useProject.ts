import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FileNode {
  name: string;
  type: 'file' | 'folder';
  extension?: string;
  children?: FileNode[];
  expanded?: boolean;
}

export interface ProjectFile {
  path: string;
  content: string;
  fileType: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  github_url?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectHistory {
  id: string;
  projectId: string;
  action: 'create' | 'update' | 'delete' | 'save';
  filePath?: string;
  timestamp: Date;
  description: string;
}

const DEFAULT_PROJECT: FileNode = {
  name: "new-project",
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
      ]
    },
    { name: "package.json", type: "file", extension: "json" },
    { name: "README.md", type: "file", extension: "md" }
  ]
};

export const useProject = () => {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [fileTree, setFileTree] = useState<FileNode>(DEFAULT_PROJECT);
  const [fileContents, setFileContents] = useState<Record<string, string>>({});
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [history, setHistory] = useState<ProjectHistory[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Add to history
  const addToHistory = useCallback((action: ProjectHistory['action'], filePath?: string, description?: string) => {
    const entry: ProjectHistory = {
      id: Date.now().toString(),
      projectId: currentProject?.id || 'local',
      action,
      filePath,
      timestamp: new Date(),
      description: description || `${action} ${filePath || 'project'}`
    };
    setHistory(prev => [entry, ...prev].slice(0, 100)); // Keep last 100 entries
  }, [currentProject]);

  // Load all projects
  const loadProjects = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setProjects((data || []) as Project[]);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  }, []);

  // Load a specific project
  const loadProject = useCallback(async (projectId: string) => {
    setIsLoading(true);
    try {
      // Load project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;

      // Load file tree
      const { data: treeData } = await supabase
        .from('file_tree')
        .select('tree_structure')
        .eq('project_id', projectId)
        .single();

      // Load files
      const { data: files } = await supabase
        .from('project_files')
        .select('*')
        .eq('project_id', projectId);

      setCurrentProject(project as Project);
      
      if (treeData?.tree_structure) {
        setFileTree(treeData.tree_structure as unknown as FileNode);
      }

      // Build file contents map
      const contents: Record<string, string> = {};
      files?.forEach(file => {
        contents[file.path] = file.content || '';
      });
      setFileContents(contents);
      setHasUnsavedChanges(false);
      
      addToHistory('save', undefined, `Loaded project: ${project.name}`);
      toast.success(`Project "${project.name}" loaded`);
    } catch (error) {
      console.error('Error loading project:', error);
      toast.error('Failed to load project');
    } finally {
      setIsLoading(false);
    }
  }, [addToHistory]);

  // Save current project
  const saveProject = useCallback(async () => {
    if (!currentProject) return;
    
    setIsSaving(true);
    try {
      // Update file tree
      await supabase
        .from('file_tree')
        .upsert({
          project_id: currentProject.id,
          tree_structure: fileTree as any
        });

      // Save all files
      const fileEntries = Object.entries(fileContents);
      for (const [path, content] of fileEntries) {
        const extension = path.split('.').pop() || '';
        await supabase
          .from('project_files')
          .upsert({
            project_id: currentProject.id,
            path,
            content,
            file_type: extension,
            is_folder: false
          });
      }

      // Update project timestamp
      await supabase
        .from('projects')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', currentProject.id);

      setHasUnsavedChanges(false);
      addToHistory('save', undefined, 'Project saved');
      toast.success('Project saved successfully');
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error('Failed to save project');
    } finally {
      setIsSaving(false);
    }
  }, [currentProject, fileTree, fileContents, addToHistory]);

  // Create new project
  const createProject = useCallback(async (name: string, description?: string) => {
    setIsLoading(true);
    try {
      const { data: project, error } = await supabase
        .from('projects')
        .insert({ name, description })
        .select()
        .single();

      if (error) throw error;

      // Create default file tree
      await supabase
        .from('file_tree')
        .insert({
          project_id: project.id,
          tree_structure: DEFAULT_PROJECT as any
        });

      setCurrentProject(project as Project);
      setFileTree({ ...DEFAULT_PROJECT, name });
      setFileContents({});
      setHasUnsavedChanges(false);
      
      await loadProjects();
      addToHistory('create', undefined, `Created project: ${name}`);
      toast.success(`Project "${name}" created`);
      
      return project;
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [loadProjects, addToHistory]);

  // Delete project
  const deleteProject = useCallback(async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      if (currentProject?.id === projectId) {
        setCurrentProject(null);
        setFileTree(DEFAULT_PROJECT);
        setFileContents({});
      }

      await loadProjects();
      addToHistory('delete', undefined, 'Project deleted');
      toast.success('Project deleted');
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    }
  }, [currentProject, loadProjects, addToHistory]);

  // Update file content
  const updateFileContent = useCallback((path: string, content: string) => {
    setFileContents(prev => ({ ...prev, [path]: content }));
    setHasUnsavedChanges(true);
    addToHistory('update', path, `Updated file: ${path}`);
  }, [addToHistory]);

  // Create new file
  const createFile = useCallback((parentPath: string, fileName: string, isFolder: boolean = false) => {
    const extension = isFolder ? undefined : fileName.split('.').pop();
    const fullPath = parentPath ? `${parentPath}/${fileName}` : fileName;
    
    const addFileToTree = (node: FileNode, pathParts: string[]): FileNode => {
      if (pathParts.length === 0) {
        const newNode: FileNode = {
          name: fileName,
          type: isFolder ? 'folder' : 'file',
          extension,
          expanded: isFolder,
          children: isFolder ? [] : undefined
        };
        return {
          ...node,
          children: [...(node.children || []), newNode]
        };
      }
      
      const [current, ...rest] = pathParts;
      return {
        ...node,
        children: node.children?.map(child =>
          child.name === current ? addFileToTree(child, rest) : child
        )
      };
    };

    const pathParts = parentPath ? parentPath.split('/').filter(Boolean).slice(1) : [];
    setFileTree(prev => addFileToTree(prev, pathParts));
    
    if (!isFolder) {
      setFileContents(prev => ({ ...prev, [fullPath]: '' }));
    }
    
    setHasUnsavedChanges(true);
    addToHistory('create', fullPath, `Created ${isFolder ? 'folder' : 'file'}: ${fileName}`);
    toast.success(`${isFolder ? 'Folder' : 'File'} created: ${fileName}`);
  }, [addToHistory]);

  // Delete file
  const deleteFile = useCallback(async (filePath: string) => {
    const removeFromTree = (node: FileNode, pathParts: string[]): FileNode | null => {
      if (pathParts.length === 1) {
        return {
          ...node,
          children: node.children?.filter(child => child.name !== pathParts[0])
        };
      }
      
      const [current, ...rest] = pathParts;
      return {
        ...node,
        children: node.children?.map(child =>
          child.name === current ? removeFromTree(child, rest) : child
        ).filter(Boolean) as FileNode[]
      };
    };

    const pathParts = filePath.split('/').filter(Boolean).slice(1);
    setFileTree(prev => removeFromTree(prev, pathParts) || prev);
    
    setFileContents(prev => {
      const updated = { ...prev };
      delete updated[filePath];
      return updated;
    });

    // Delete from database if we have a current project
    if (currentProject) {
      try {
        await supabase
          .from('project_files')
          .delete()
          .eq('project_id', currentProject.id)
          .eq('path', filePath);
      } catch (error) {
        console.error('Error deleting file from database:', error);
      }
    }

    setHasUnsavedChanges(true);
    addToHistory('delete', filePath, `Deleted: ${filePath}`);
    toast.success('File deleted');
  }, [currentProject, addToHistory]);

  // Clear/New project (local only)
  const clearProject = useCallback(() => {
    setCurrentProject(null);
    setFileTree(DEFAULT_PROJECT);
    setFileContents({});
    setHasUnsavedChanges(false);
    setHistory([]);
    toast.info('New project started');
  }, []);

  // Toggle folder
  const toggleFolder = useCallback((path: string[]) => {
    const toggleInTree = (node: FileNode, targetPath: string[], currentPath: string[] = []): FileNode => {
      const nodePath = [...currentPath, node.name];
      const pathMatch = nodePath.join('/') === targetPath.join('/');
      
      if (pathMatch && node.type === 'folder') {
        return { ...node, expanded: !node.expanded };
      }
      
      if (node.children) {
        return {
          ...node,
          children: node.children.map(child => toggleInTree(child, targetPath, nodePath))
        };
      }
      
      return node;
    };

    setFileTree(prev => toggleInTree(prev, path, []));
  }, []);

  // Auto-save debounced
  useEffect(() => {
    if (!hasUnsavedChanges || !currentProject) return;
    
    const timeout = setTimeout(() => {
      saveProject();
    }, 30000); // Auto-save every 30 seconds if there are changes

    return () => clearTimeout(timeout);
  }, [hasUnsavedChanges, currentProject, saveProject]);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  return {
    // State
    currentProject,
    fileTree,
    fileContents,
    projects,
    isLoading,
    isSaving,
    history,
    hasUnsavedChanges,
    
    // Actions
    loadProjects,
    loadProject,
    saveProject,
    createProject,
    deleteProject,
    updateFileContent,
    createFile,
    deleteFile,
    clearProject,
    toggleFolder,
    setFileTree,
    setFileContents
  };
};
