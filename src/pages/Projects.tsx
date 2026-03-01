import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectContext } from '@/contexts/ProjectContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, FolderOpen, Loader2, LogOut, Clock, Code2, ArrowRight, ArrowLeft, Server, Database, Globe, Check, Download, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { StackProfile } from '@/components/SettingsPanel';
import {
  generatePWAPackage, generateWindowsPackage, generateLinuxPackage,
  generateMacPackage, generateZipPackage, downloadBlob,
} from '@/lib/exportGenerators';

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
    id: 'supabase', label: 'Supabase Fullstack',
    description: 'Full backend with database, auth, edge functions, and middleware.',
    icon: <Server className="h-6 w-6" />, auth: 'supabase_auth',
    features: ['Database + RLS', 'Auth + SSO', 'Edge Functions', 'Auto-wire All'], recommended: true,
  },
  {
    id: 'sqlite', label: 'SQLite (Self-hosted)',
    description: 'Lightweight local database with JWT auth. Great for offline-first apps.',
    icon: <Database className="h-6 w-6" />, auth: 'jwt',
    features: ['Local DB', 'JWT Auth', 'Offline-first', 'Self-hosted'],
  },
  {
    id: 'none', label: 'Frontend Only',
    description: 'No backend. Static site or client-side only application.',
    icon: <Globe className="h-6 w-6" />, auth: 'none',
    features: ['Static Site', 'No Backend', 'Client-side', 'Fast Deploy'],
  },
];

const EXPORT_BADGE_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  pwa: { label: 'PWA', variant: 'default' },
  windows: { label: 'Windows', variant: 'secondary' },
  linux: { label: 'Linux', variant: 'secondary' },
  mac: { label: 'macOS', variant: 'secondary' },
  zip: { label: 'ZIP', variant: 'outline' },
  web: { label: 'Web', variant: 'outline' },
};

interface ProjectExport {
  id: string;
  project_id: string;
  export_type: string;
  project_name: string;
  file_count: number;
  created_at: string;
}

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

  // Completed builds state
  const [exports, setExports] = useState<ProjectExport[]>([]);
  const [exportsLoading, setExportsLoading] = useState(false);
  const [redownloading, setRedownloading] = useState<string | null>(null);

  useEffect(() => {
    if (user) loadExports();
  }, [user]);

  const loadExports = async () => {
    setExportsLoading(true);
    const { data } = await supabase
      .from('project_exports')
      .select('*')
      .order('created_at', { ascending: false });
    setExports((data as ProjectExport[]) || []);
    setExportsLoading(false);
  };

  const handleRedownload = async (exp: ProjectExport) => {
    setRedownloading(exp.id);
    try {
      const { data: files } = await supabase
        .from('project_files')
        .select('path, content')
        .eq('project_id', exp.project_id)
        .eq('is_folder', false);

      if (!files || files.length === 0) {
        toast.error('Project files not found');
        return;
      }

      const fc: Record<string, string> = {};
      files.forEach(f => { if (f.content) fc[f.path] = f.content; });

      const generators: Record<string, () => Promise<Blob>> = {
        pwa: () => generatePWAPackage(exp.project_name, fc),
        windows: () => generateWindowsPackage(exp.project_name, fc),
        linux: () => generateLinuxPackage(exp.project_name, fc),
        mac: () => generateMacPackage(exp.project_name, fc),
        zip: () => generateZipPackage(exp.project_name, fc),
      };

      const gen = generators[exp.export_type];
      if (!gen) { toast.error('Unknown export type'); return; }

      const blob = await gen();
      downloadBlob(blob, `${exp.project_name}-${exp.export_type}.zip`);
      toast.success('Package re-downloaded!');
    } catch { toast.error('Re-download failed'); }
    finally { setRedownloading(null); }
  };

  const handleDeleteExport = async (id: string) => {
    await supabase.from('project_exports').delete().eq('id', id);
    setExports(prev => prev.filter(e => e.id !== id));
    toast.success('Export record removed');
  };

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
      localStorage.setItem(`codex-stack-profile-${project.id}`, JSON.stringify(profile));
      localStorage.setItem('codex-stack-profile', JSON.stringify(profile));
      navigate('/');
    }
    setCreating(false);
    resetWizard();
  };

  const resetWizard = () => {
    setNewName(''); setNewDesc(''); setShowCreate(false); setWizardStep(1);
    setSelectedStack('supabase'); setAutoWireBackend(true); setAutoWireMiddleware(true);
  };

  const handleStackSelect = (stackId: StackProfile['backend']) => {
    setSelectedStack(stackId);
    if (stackId === 'none') { setAutoWireBackend(false); setAutoWireMiddleware(false); }
    else { setAutoWireBackend(true); setAutoWireMiddleware(true); }
  };

  const handleDelete = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    if (confirm('Delete this project? This cannot be undone.')) {
      await deleteProject(projectId);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-terminal">
      <div className="fixed inset-0 bg-gradient-to-br from-[hsl(var(--neon-purple)/0.08)] via-background to-[hsl(var(--neon-green)/0.05)]" />
      <div className="fixed inset-0 animate-scanlines pointer-events-none opacity-30" />

      <div className="relative z-10">
        <header className="flex items-center justify-between px-6 py-5 border-b border-border/40">
          <h1 className="text-2xl md:text-3xl font-extrabold neon-text tracking-tight">CYBERPUNK TERMUX</h1>
          {user && (
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground text-sm hidden sm:inline">{user.email}</span>
              <Button variant="ghost" size="sm" className="neon-purple" onClick={() => signOut()}>
                <LogOut className="h-4 w-4 mr-2" /><span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          )}
        </header>

        <main className="max-w-6xl mx-auto px-4 md:px-8 py-8">
          <Tabs defaultValue="projects" className="w-full">
            <div className="flex items-center justify-between mb-6">
              <TabsList className="bg-card/60 border border-border/40">
                <TabsTrigger value="projects" className="font-terminal text-xs">Your Projects</TabsTrigger>
                <TabsTrigger value="builds" className="font-terminal text-xs">Completed Builds</TabsTrigger>
              </TabsList>
              <Button className="neon-green" onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4 mr-2" />New Project
              </Button>
            </div>

            <TabsContent value="projects">
              {/* Creation Wizard */}
              {showCreate && (
                <Card className="mb-6 border-primary/30 bg-card/80 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-primary">Create New Project</CardTitle>
                    <CardDescription className="font-terminal text-xs">
                      Step {wizardStep} of 2: {wizardStep === 1 ? 'Project Info' : 'Choose Your Stack'}
                    </CardDescription>
                  </CardHeader>
                  {wizardStep === 1 && (
                    <>
                      <CardContent className="space-y-3">
                        <Input placeholder="Project name" value={newName} onChange={(e) => setNewName(e.target.value)} className="bg-input border-border" autoFocus onKeyDown={(e) => e.key === 'Enter' && newName.trim() && setWizardStep(2)} />
                        <Input placeholder="Description (optional)" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="bg-input border-border" onKeyDown={(e) => e.key === 'Enter' && newName.trim() && setWizardStep(2)} />
                      </CardContent>
                      <CardFooter className="gap-2">
                        <Button variant="ghost" onClick={resetWizard}>Cancel</Button>
                        <Button onClick={() => setWizardStep(2)} disabled={!newName.trim()} className="neon-green">Next<ArrowRight className="h-4 w-4 ml-2" /></Button>
                      </CardFooter>
                    </>
                  )}
                  {wizardStep === 2 && (
                    <>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {STACK_OPTIONS.map((option) => (
                            <button key={option.id} onClick={() => handleStackSelect(option.id)}
                              className={`relative text-left p-4 rounded-lg border transition-all duration-200 ${selectedStack === option.id ? 'border-primary bg-primary/10 shadow-[0_0_15px_hsl(var(--neon-green)/0.2)]' : 'border-border/50 bg-card/40 hover:border-border'}`}>
                              {option.recommended && <span className="absolute -top-2 right-2 text-[10px] font-terminal bg-primary text-primary-foreground px-2 py-0.5 rounded-full">RECOMMENDED</span>}
                              {selectedStack === option.id && <div className="absolute top-2 left-2"><Check className="h-4 w-4 text-primary" /></div>}
                              <div className={`mb-2 ${selectedStack === option.id ? 'text-primary' : 'text-muted-foreground'}`}>{option.icon}</div>
                              <h4 className="font-bold text-sm text-foreground mb-1">{option.label}</h4>
                              <p className="text-[11px] text-muted-foreground mb-3">{option.description}</p>
                              <ul className="space-y-1">{option.features.map((f) => <li key={f} className="text-[10px] text-muted-foreground font-terminal flex items-center gap-1"><span className="text-primary">•</span> {f}</li>)}</ul>
                            </button>
                          ))}
                        </div>
                        {selectedStack !== 'none' && (
                          <div className="space-y-3 pt-2 border-t border-border/30">
                            <div className="flex items-center justify-between"><Label className="font-terminal text-sm text-muted-foreground">Auto-wire Backend</Label><Switch checked={autoWireBackend} onCheckedChange={setAutoWireBackend} /></div>
                            <div className="flex items-center justify-between"><Label className="font-terminal text-sm text-muted-foreground">Auto-wire Middleware</Label><Switch checked={autoWireMiddleware} onCheckedChange={setAutoWireMiddleware} /></div>
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className="gap-2">
                        <Button variant="ghost" onClick={() => setWizardStep(1)}><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
                        <Button onClick={handleCreate} disabled={creating} className="neon-green">
                          {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}Create Project
                        </Button>
                      </CardFooter>
                    </>
                  )}
                </Card>
              )}

              {(isLoading || !hasLoaded) && (
                <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>
              )}

              {!isLoading && hasLoaded && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projects.map((project) => (
                    <Card key={project.id} className="group cursor-pointer border-border/50 bg-card/60 backdrop-blur-sm hover:border-primary/50 hover:shadow-[0_0_20px_hsl(var(--neon-green)/0.15)] transition-all duration-300 overflow-hidden" onClick={() => handleOpen(project.id)}>
                      <div className="h-24 flex items-center justify-center relative" style={{ background: getProjectGradient(project.name) }}>
                        <Code2 className="h-10 w-10 text-white/20" />
                        <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
                      </div>
                      <CardHeader className="pb-2 pt-3">
                        <CardTitle className="text-base text-foreground group-hover:text-primary transition-colors truncate">{project.name}</CardTitle>
                        {project.description && <CardDescription className="line-clamp-2 text-xs">{project.description}</CardDescription>}
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                          <Clock className="h-3 w-3" />{formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}
                        </div>
                        {project.github_url && <div className="mt-1 text-xs text-secondary truncate">{project.github_url}</div>}
                      </CardContent>
                      <CardFooter className="pt-0 gap-2">
                        <Button size="sm" variant="ghost" className="neon-green flex-1" onClick={(e) => { e.stopPropagation(); handleOpen(project.id); }}><FolderOpen className="h-3.5 w-3.5 mr-1.5" />Open</Button>
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={(e) => handleDelete(e, project.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </CardFooter>
                    </Card>
                  ))}
                  {projects.length === 0 && !showCreate && (
                    <div className="col-span-full text-center py-16">
                      <FolderOpen className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">No projects yet</p>
                      <Button className="neon-green" onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-2" />Create Your First Project</Button>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="builds">
              {exportsLoading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>
              ) : exports.length === 0 ? (
                <div className="text-center py-16">
                  <Download className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">No completed builds yet</p>
                  <p className="text-muted-foreground/60 text-xs">Export a project from the IDE Publish menu to see it here</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {exports.map((exp) => {
                    const badgeInfo = EXPORT_BADGE_MAP[exp.export_type] || { label: exp.export_type, variant: 'outline' as const };
                    return (
                      <Card key={exp.id} className="border-border/50 bg-card/60 backdrop-blur-sm">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base text-foreground truncate">{exp.project_name}</CardTitle>
                            <Badge variant={badgeInfo.variant} className="text-[10px] font-terminal shrink-0">{badgeInfo.label}</Badge>
                          </div>
                          <CardDescription className="text-xs">
                            {exp.file_count} files · {formatDistanceToNow(new Date(exp.created_at), { addSuffix: true })}
                          </CardDescription>
                        </CardHeader>
                        <CardFooter className="gap-2 pt-2">
                          <Button size="sm" variant="ghost" className="neon-green flex-1" disabled={redownloading === exp.id} onClick={() => handleRedownload(exp)}>
                            {redownloading === exp.id ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
                            Re-download
                          </Button>
                          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDeleteExport(exp.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default Projects;
