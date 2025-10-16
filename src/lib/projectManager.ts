import { supabase } from "@/integrations/supabase/client";

export interface FileNode {
  name: string;
  type: 'file' | 'folder';
  extension?: string;
  children?: FileNode[];
  expanded?: boolean;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  github_url?: string;
  created_at: string;
  updated_at: string;
}

export const saveProject = async (name: string, description: string = '', treeStructure: FileNode) => {
  try {
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({ name, description })
      .select()
      .single();

    if (projectError) throw projectError;

    const { error: treeError } = await supabase
      .from('file_tree')
      .insert({
        project_id: project.id,
        tree_structure: treeStructure as any
      });

    if (treeError) throw treeError;

    return project;
  } catch (error) {
    console.error('Error saving project:', error);
    throw error;
  }
};

export const loadProject = async (projectId: string) => {
  try {
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError) throw projectError;

    const { data: treeData, error: treeError } = await supabase
      .from('file_tree')
      .select('tree_structure')
      .eq('project_id', projectId)
      .single();

    if (treeError) throw treeError;

    const { data: files, error: filesError } = await supabase
      .from('project_files')
      .select('*')
      .eq('project_id', projectId);

    if (filesError) throw filesError;

    return {
      project,
      treeStructure: (treeData.tree_structure || {}) as unknown as FileNode,
      files: files || []
    };
  } catch (error) {
    console.error('Error loading project:', error);
    throw error;
  }
};

export const saveFile = async (projectId: string, filePath: string, content: string, fileType: string = 'file') => {
  try {
    const { error } = await supabase
      .from('project_files')
      .upsert({
        project_id: projectId,
        path: filePath,
        content,
        file_type: fileType,
        is_folder: fileType === 'folder'
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error saving file:', error);
    throw error;
  }
};

export const deleteFile = async (projectId: string, filePath: string) => {
  try {
    const { error } = await supabase
      .from('project_files')
      .delete()
      .eq('project_id', projectId)
      .eq('path', filePath);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

export const listProjects = async () => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error listing projects:', error);
    throw error;
  }
};

export const deleteProject = async (projectId: string) => {
  try {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
};

export const updateFileTree = async (projectId: string, treeStructure: FileNode) => {
  try {
    const { error } = await supabase
      .from('file_tree')
      .upsert({
        project_id: projectId,
        tree_structure: treeStructure as any
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error updating file tree:', error);
    throw error;
  }
};
