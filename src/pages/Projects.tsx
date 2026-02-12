import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '@/hooks/useProject';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, FolderOpen, Loader2, LogOut, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const Projects = () => {
  const navigate = useNavigate();
  const { projects, isLoading, createProject, deleteProject, loadProject } = useProject();
  const { user, signOut } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);

  const handleOpen = async (projectId: string) => {
    await loadProject(projectId);
    navigate('/');
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    const project = await createProject(newName.trim(), newDesc.trim() || undefined);
    if (project) {
      navigate('/');
    }
    setCreating(false);
    setNewName('');
    setNewDesc('');
    setShowCreate(false);
  };

  const handleDelete = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    if (confirm('Delete this project? This cannot be undone.')) {
      await deleteProject(projectId);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-terminal">
      {/* Background effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-[hsl(var(--neon-purple)/0.08)] via-background to-[hsl(var(--neon-green)/0.05)]" />
      <div className="fixed inset-0 animate-scanlines pointer-events-none opacity-30" />

      <div className="relative z-10">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-5 border-b border-border/40">
          <h1 className="text-2xl md:text-3xl font-extrabold neon-text tracking-tight">
            CYBERPUNK TERMUX
          </h1>
          {user && (
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground text-sm hidden sm:inline">{user.email}</span>
              <Button variant="ghost" size="sm" className="neon-purple" onClick={() => signOut()}>
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          )}
        </header>

        {/* Content */}
        <main className="max-w-6xl mx-auto px-4 md:px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold text-foreground">Your Projects</h2>
              <p className="text-muted-foreground text-sm mt-1">Select a project to open the IDE</p>
            </div>
            <Button
              className="neon-green"
              onClick={() => setShowCreate(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </div>

          {/* Create project inline form */}
          {showCreate && (
            <Card className="mb-6 border-primary/30 bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-primary">Create New Project</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder="Project name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="bg-input border-border"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
                <Input
                  placeholder="Description (optional)"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="bg-input border-border"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
              </CardContent>
              <CardFooter className="gap-2">
                <Button onClick={handleCreate} disabled={!newName.trim() || creating} className="neon-green">
                  {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  Create
                </Button>
                <Button variant="ghost" onClick={() => { setShowCreate(false); setNewName(''); setNewDesc(''); }}>
                  Cancel
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
          )}

          {/* Project grid */}
          {!isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <Card
                  key={project.id}
                  className="group cursor-pointer border-border/50 bg-card/60 backdrop-blur-sm hover:border-primary/50 hover:shadow-[0_0_20px_hsl(var(--neon-green)/0.15)] transition-all duration-300"
                  onClick={() => handleOpen(project.id)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base text-foreground group-hover:text-primary transition-colors truncate">
                      {project.name}
                    </CardTitle>
                    {project.description && (
                      <CardDescription className="line-clamp-2 text-xs">
                        {project.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}
                    </div>
                    {project.github_url && (
                      <div className="mt-1 text-xs text-secondary truncate">
                        {project.github_url}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="pt-0 gap-2">
                    <Button size="sm" variant="ghost" className="neon-green flex-1" onClick={(e) => { e.stopPropagation(); handleOpen(project.id); }}>
                      <FolderOpen className="h-3.5 w-3.5 mr-1.5" />
                      Open
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={(e) => handleDelete(e, project.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}

              {/* Empty state */}
              {projects.length === 0 && !showCreate && (
                <div className="col-span-full text-center py-16">
                  <FolderOpen className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No projects yet</p>
                  <Button className="neon-green" onClick={() => setShowCreate(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Project
                  </Button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Projects;
