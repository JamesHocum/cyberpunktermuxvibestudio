import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FolderPlus, 
  FolderOpen, 
  Trash2, 
  X, 
  Clock, 
  Save,
  History,
  FileText,
  Download,
  Upload
} from 'lucide-react';
import { Project, ProjectHistory } from '@/hooks/useProject';

interface ProjectManagerModalProps {
  isVisible: boolean;
  onClose: () => void;
  projects: Project[];
  currentProject: Project | null;
  history: ProjectHistory[];
  isLoading: boolean;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  onCreateProject: (name: string, description?: string) => Promise<any>;
  onLoadProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
  onSaveProject: () => void;
  onClearProject: () => void;
}

export const ProjectManagerModal: React.FC<ProjectManagerModalProps> = ({
  isVisible,
  onClose,
  projects,
  currentProject,
  history,
  isLoading,
  isSaving,
  hasUnsavedChanges,
  onCreateProject,
  onLoadProject,
  onDeleteProject,
  onSaveProject,
  onClearProject
}) => {
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [activeTab, setActiveTab] = useState('projects');

  if (!isVisible) return null;

  const handleCreate = async () => {
    if (!newProjectName.trim()) return;
    await onCreateProject(newProjectName.trim(), newProjectDescription.trim() || undefined);
    setNewProjectName('');
    setNewProjectDescription('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-studio-sidebar cyber-border rounded-lg w-full max-w-4xl max-h-[85vh] flex flex-col terminal-glow">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b cyber-border bg-studio-header">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 neon-purple pulse-glow" />
            <h2 className="font-cyber text-lg neon-green">PROJECT_MANAGER.SYS</h2>
            {currentProject && (
              <Badge className="ml-2 bg-neon-purple/20 neon-purple border-neon-purple/30 font-terminal">
                {currentProject.name}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasUnsavedChanges && (
              <Badge variant="outline" className="border-yellow-500 text-yellow-500 font-terminal">
                Unsaved Changes
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="neon-purple hover:neon-glow"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-4 mt-4 bg-studio-terminal cyber-border">
            <TabsTrigger value="projects" className="font-terminal neon-green data-[state=active]:neon-glow">
              <FolderOpen className="h-4 w-4 mr-2" />
              Projects
            </TabsTrigger>
            <TabsTrigger value="create" className="font-terminal neon-purple data-[state=active]:neon-glow">
              <FolderPlus className="h-4 w-4 mr-2" />
              New Project
            </TabsTrigger>
            <TabsTrigger value="history" className="font-terminal neon-green data-[state=active]:neon-glow">
              <History className="h-4 w-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>

          {/* Projects Tab */}
          <TabsContent value="projects" className="flex-1 overflow-hidden p-4">
            <ScrollArea className="h-[400px]">
              {projects.length === 0 ? (
                <div className="text-center py-12">
                  <FolderOpen className="h-12 w-12 mx-auto mb-4 neon-purple opacity-50" />
                  <p className="font-terminal matrix-text">No projects found in the matrix</p>
                  <p className="font-terminal text-sm text-muted-foreground mt-2">
                    Create a new project to begin your neural development journey
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {projects.map(project => (
                    <div
                      key={project.id}
                      className={`p-4 rounded-lg cyber-border bg-studio-terminal hover:neon-glow transition-all cursor-pointer ${
                        currentProject?.id === project.id ? 'neon-glow border-neon-green' : ''
                      }`}
                      onClick={() => onLoadProject(project.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 neon-green" />
                            <span className="font-terminal font-medium neon-green">
                              {project.name}
                            </span>
                            {currentProject?.id === project.id && (
                              <Badge className="bg-green-500/20 neon-green border-green-500/30 font-terminal text-xs">
                                ACTIVE
                              </Badge>
                            )}
                          </div>
                          {project.description && (
                            <p className="text-sm matrix-text mt-1 font-terminal">
                              {project.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-xs text-muted-foreground font-terminal flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDate(project.updated_at)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onLoadProject(project.id);
                            }}
                            className="neon-green hover:neon-glow"
                          >
                            <FolderOpen className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('Delete this project? This cannot be undone.')) {
                                onDeleteProject(project.id);
                              }
                            }}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Create Tab */}
          <TabsContent value="create" className="flex-1 p-4">
            <div className="space-y-4 max-w-lg">
              <div className="space-y-2">
                <Label className="font-terminal neon-green">Project Name</Label>
                <Input
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="my-awesome-project"
                  className="cyber-border bg-studio-terminal matrix-text font-terminal"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
              </div>
              <div className="space-y-2">
                <Label className="font-terminal neon-purple">Description (optional)</Label>
                <Input
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  placeholder="A cyberpunk-themed application..."
                  className="cyber-border bg-studio-terminal matrix-text font-terminal"
                />
              </div>
              <Button
                onClick={handleCreate}
                disabled={!newProjectName.trim() || isLoading}
                className="w-full neon-glow cyber-border"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <FolderPlus className="h-4 w-4 mr-2" />
                    Create Project
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="flex-1 overflow-hidden p-4">
            <ScrollArea className="h-[400px]">
              {history.length === 0 ? (
                <div className="text-center py-12">
                  <History className="h-12 w-12 mx-auto mb-4 neon-purple opacity-50" />
                  <p className="font-terminal matrix-text">No history recorded yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {history.map(entry => (
                    <div
                      key={entry.id}
                      className="p-3 rounded-lg cyber-border bg-studio-terminal"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={`font-terminal text-xs ${
                              entry.action === 'create' ? 'border-green-500 text-green-500' :
                              entry.action === 'delete' ? 'border-red-500 text-red-500' :
                              entry.action === 'update' ? 'border-yellow-500 text-yellow-500' :
                              'border-neon-purple neon-purple'
                            }`}
                          >
                            {entry.action.toUpperCase()}
                          </Badge>
                          <span className="font-terminal text-sm matrix-text">
                            {entry.description}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground font-terminal">
                          {entry.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Footer Actions */}
        <div className="p-4 border-t cyber-border bg-studio-header flex items-center justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClearProject}
              className="cyber-border font-terminal"
            >
              <FolderPlus className="h-4 w-4 mr-2" />
              New (Local)
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="cyber-border font-terminal"
            >
              Close
            </Button>
            {currentProject && (
              <Button
                onClick={onSaveProject}
                disabled={isSaving || !hasUnsavedChanges}
                size="sm"
                className="neon-glow"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Project
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
