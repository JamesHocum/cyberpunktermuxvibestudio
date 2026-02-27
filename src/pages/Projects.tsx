import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectContext } from '@/contexts/ProjectContext';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, FolderOpen, Loader2, LogOut, Clock, Code2, ArrowRight, ArrowLeft, Server, Database, Globe, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { StackProfile, DEFAULT_STACK } from '@/components/SettingsPanel';

// Generate a unique gradient from project name
const getProjectGradient = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h1 = Math.abs(hash % 360);
  const h2 = (h1 + 40 + Math.abs((hash >> 8) % 60)) % 360;
  return `linear-gradient(135deg, hsl(${h1}, 70%, 25%), hsl(${h2}, 80%, 15%))`;
};

type StackOption = {
  id: StackProfile['backend'];
  label: string;
  description: string;
  icon: React.ReactNode;
  auth: StackProfile['auth'];
  features: string[];
  recommended?: boolean;
};

const STACK_OPTIONS: StackOption[] = [
  {
    id: 'supabase',
    label: 'Supabase Fullstack',
    description: 'Full backend with database, auth, edge functions, and middleware.',
    icon: <Server className="h-6 w-6" />,
    auth: 'supabase_auth',
    features: ['Database + RLS', 'Auth + SSO', 'Edge Functions', 'Auto-wire All'],
    recommended: true,
  },
  {
    id: 'sqlite',
    label: 'SQLite (Self-hosted)',
    description: 'Lightweight local database with JWT auth. Great for offline-first apps.',
    icon: <Database className="h-6 w-6" />,
    auth: 'jwt',
    features: ['Local DB', 'JWT Auth', 'Offline-first', 'Self-hosted'],
  },
  {
    id: 'none',
    label: 'Frontend Only',
    description: 'No backend. Static site or client-side only application.',
    icon: <Globe className="h-6 w-6" />,
    auth: 'none',
    features: ['Static Site', 'No Backend', 'Client-side', 'Fast Deploy'],
  },
];

const Projects = () => {
  const navigate = useNavigate();
  const { projects, isLoading, hasLoaded, createProject, deleteProject, loadProject } = useProjectContext();
  const { user, signOut } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [selectedStack, setSelectedStack] = useState<StackProfile['backend']>('supabase');
  const [autoWireBackend, setAutoWireBackend] = useState(true);
  const [autoWireMiddleware, setAutoWireMiddleware] = useState(true);

  const handleOpen = async (projectId: string) => {
    await loadProject(projectId);
    navigate('/');
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    const project = await createProject(newName.trim(), newDesc.trim() || undefined);
    if (project) {
      const stackOption = STACK_OPTIONS.find(s => s.id === selectedStack)!;
      const profile: StackProfile = {
        backend: selectedStack,
        auth: stackOption.auth,
        autoWireBackend: selectedStack !== 'none' ? autoWireBackend : false,
        autoWireMiddleware: selectedStack !== 'none' ? autoWireMiddleware : false,
      };
      // Save per-project
      localStorage.setItem(`codex-stack-profile-${project.id}`, JSON.stringify(profile));
      // Save global for backward compat
      localStorage.setItem('codex-stack-profile', JSON.stringify(profile));
      navigate('/');
    }
    setCreating(false);
    resetWizard();
  };

  const resetWizard = () => {
    setNewName('');
    setNewDesc('');
    setShowCreate(false);
    setWizardStep(1);
    setSelectedStack('supabase');
    setAutoWireBackend(true);
    setAutoWireMiddleware(true);
  };

  const handleStackSelect = (stackId: StackProfile['backend']) => {
    setSelectedStack(stackId);
    if (stackId === 'none') {
      setAutoWireBackend(false);
      setAutoWireMiddleware(false);
    } else {
      setAutoWireBackend(true);
      setAutoWireMiddleware(true);
    }
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

          {/* Creation Wizard */}
          {showCreate && (
            <Card className="mb-6 border-primary/30 bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-primary">
                  Create New Project
                </CardTitle>
                <CardDescription className="font-terminal text-xs">
                  Step {wizardStep} of 2: {wizardStep === 1 ? 'Project Info' : 'Choose Your Stack'}
                </CardDescription>
              </CardHeader>

              {wizardStep === 1 && (
                <>
                  <CardContent className="space-y-3">
                    <Input
                      placeholder="Project name"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="bg-input border-border"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && newName.trim() && setWizardStep(2)}
                    />
                    <Input
                      placeholder="Description (optional)"
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      className="bg-input border-border"
                      onKeyDown={(e) => e.key === 'Enter' && newName.trim() && setWizardStep(2)}
                    />
                  </CardContent>
                  <CardFooter className="gap-2">
                    <Button variant="ghost" onClick={resetWizard}>
                      Cancel
                    </Button>
                    <Button
                      onClick={() => setWizardStep(2)}
                      disabled={!newName.trim()}
                      className="neon-green"
                    >
                      Next
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardFooter>
                </>
              )}

              {wizardStep === 2 && (
                <>
                  <CardContent className="space-y-4">
                    {/* Stack cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {STACK_OPTIONS.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => handleStackSelect(option.id)}
                          className={`relative text-left p-4 rounded-lg border transition-all duration-200 ${
                            selectedStack === option.id
                              ? 'border-primary bg-primary/10 shadow-[0_0_15px_hsl(var(--neon-green)/0.2)]'
                              : 'border-border/50 bg-card/40 hover:border-border'
                          }`}
                        >
                          {option.recommended && (
                            <span className="absolute -top-2 right-2 text-[10px] font-terminal bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                              RECOMMENDED
                            </span>
                          )}
                          {selectedStack === option.id && (
                            <div className="absolute top-2 left-2">
                              <Check className="h-4 w-4 text-primary" />
                            </div>
                          )}
                          <div className={`mb-2 ${selectedStack === option.id ? 'text-primary' : 'text-muted-foreground'}`}>
                            {option.icon}
                          </div>
                          <h4 className="font-bold text-sm text-foreground mb-1">{option.label}</h4>
                          <p className="text-[11px] text-muted-foreground mb-3">{option.description}</p>
                          <ul className="space-y-1">
                            {option.features.map((f) => (
                              <li key={f} className="text-[10px] text-muted-foreground font-terminal flex items-center gap-1">
                                <span className="text-primary">•</span> {f}
                              </li>
                            ))}
                          </ul>
                        </button>
                      ))}
                    </div>

                    {/* Auto-wire toggles */}
                    {selectedStack !== 'none' && (
                      <div className="space-y-3 pt-2 border-t border-border/30">
                        <div className="flex items-center justify-between">
                          <Label className="font-terminal text-sm text-muted-foreground">Auto-wire Backend</Label>
                          <Switch checked={autoWireBackend} onCheckedChange={setAutoWireBackend} />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="font-terminal text-sm text-muted-foreground">Auto-wire Middleware</Label>
                          <Switch checked={autoWireMiddleware} onCheckedChange={setAutoWireMiddleware} />
                        </div>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="gap-2">
                    <Button variant="ghost" onClick={() => setWizardStep(1)}>
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    <Button onClick={handleCreate} disabled={creating} className="neon-green">
                      {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                      Create Project
                    </Button>
                  </CardFooter>
                </>
              )}
            </Card>
          )}

          {/* Loading state */}
          {(isLoading || !hasLoaded) && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
          )}

          {/* Project grid */}
          {!isLoading && hasLoaded && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <Card
                  key={project.id}
                  className="group cursor-pointer border-border/50 bg-card/60 backdrop-blur-sm hover:border-primary/50 hover:shadow-[0_0_20px_hsl(var(--neon-green)/0.15)] transition-all duration-300 overflow-hidden"
                  onClick={() => handleOpen(project.id)}
                >
                  {/* Gradient thumbnail */}
                  <div
                    className="h-24 flex items-center justify-center relative"
                    style={{ background: getProjectGradient(project.name) }}
                  >
                    <Code2 className="h-10 w-10 text-white/20" />
                    <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
                  </div>

                  <CardHeader className="pb-2 pt-3">
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
