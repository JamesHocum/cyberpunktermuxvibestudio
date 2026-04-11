import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Settings, X, Palette, Type, Keyboard, Zap, Bot, Server, Cpu, Lock, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { useUserPlan } from '@/hooks/useUserPlan';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface SettingsPanelProps {
  isVisible: boolean;
  onClose: () => void;
}

export interface PersonaSettings {
  name: string;
  systemPrompt: string;
  temperature: number;
  model: string;
}

export interface StackProfile {
  backend: 'supabase' | 'sqlite' | 'none';
  auth: 'supabase_auth' | 'jwt' | 'none';
  autoWireBackend: boolean;
  autoWireMiddleware: boolean;
}

const DEFAULT_PERSONA: PersonaSettings = {
  name: 'Lady Violet',
  systemPrompt: 'Creative UI/UX and design specialist with full-stack development expertise. You speak with technical precision but maintain a mysterious, elegant persona.',
  temperature: 0.7,
  model: 'google/gemini-3-flash-preview',
};

const DEFAULT_STACK: StackProfile = {
  backend: 'supabase',
  auth: 'supabase_auth',
  autoWireBackend: true,
  autoWireMiddleware: true,
};

const AVAILABLE_MODELS = [
  { value: 'google/gemini-3-flash-preview', label: 'Gemini 3 Flash (Default)', tier: 'free' as const },
  { value: 'google/gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite', tier: 'free' as const },
  { value: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash', tier: 'pro' as const },
  { value: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro', tier: 'pro' as const },
  { value: 'google/gemini-3-pro-preview', label: 'Gemini 3 Pro', tier: 'premium' as const },
  { value: 'openai/gpt-5', label: 'GPT-5', tier: 'premium' as const },
  { value: 'openai/gpt-5-mini', label: 'GPT-5 Mini', tier: 'pro' as const },
  { value: 'openai/gpt-5.2', label: 'GPT-5.2 (Latest)', tier: 'premium' as const },
];

export { AVAILABLE_MODELS };

export const loadPersonaSettings = (): PersonaSettings => {
  try {
    const stored = localStorage.getItem('codex-persona');
    if (stored) return { ...DEFAULT_PERSONA, ...JSON.parse(stored) };
  } catch {}
  return DEFAULT_PERSONA;
};

export const loadStackProfile = (projectId?: string): StackProfile => {
  try {
    if (projectId) {
      const perProject = localStorage.getItem(`codex-stack-profile-${projectId}`);
      if (perProject) return { ...DEFAULT_STACK, ...JSON.parse(perProject) };
    }
    const global = localStorage.getItem('codex-stack-profile');
    if (global) return { ...DEFAULT_STACK, ...JSON.parse(global) };
  } catch {}
  return DEFAULT_STACK;
};

export { DEFAULT_STACK };

export const SettingsPanel = ({ isVisible, onClose }: SettingsPanelProps) => {
  const { session } = useAuth();
  const userPlan = useUserPlan();
  const [fontSize, setFontSize] = useState([14]);
  const [tabSize, setTabSize] = useState('2');
  const [theme, setTheme] = useState('cyberpunk');
  const [autoSave, setAutoSave] = useState(true);
  const [lineNumbers, setLineNumbers] = useState(true);
  const [minimap, setMinimap] = useState(false);
  const [wordWrap, setWordWrap] = useState(false);
  const [byokKey, setByokKey] = useState('');
  const [isSavingKey, setIsSavingKey] = useState(false);

  // Persona settings
  const [persona, setPersona] = useState<PersonaSettings>(loadPersonaSettings);
  
  // Stack profile settings
  const [stack, setStack] = useState<StackProfile>(() => {
    try {
      const stored = localStorage.getItem('codex-stack-profile');
      if (stored) return { ...DEFAULT_STACK, ...JSON.parse(stored) };
    } catch {}
    return DEFAULT_STACK;
  });

  const saveByokKey = async () => {
    if (!byokKey.trim() || !session?.access_token) return;
    setIsSavingKey(true);
    try {
      const res = await supabase.functions.invoke('save-api-key', {
        body: { service: 'openai', token: byokKey.trim() },
      });
      if (res.error) throw res.error;
      toast.success('OpenAI API key saved');
      setByokKey('');
    } catch (err) {
      toast.error('Failed to save API key');
    } finally {
      setIsSavingKey(false);
    }
  };

  const planBadgeColor = {
    free: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
    pro: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    premium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  };

  if (!isVisible) return null;

  const savePersona = () => {
    localStorage.setItem('codex-persona', JSON.stringify(persona));
    // Save stack profile both globally and per-project if a project is active
    localStorage.setItem('codex-stack-profile', JSON.stringify(stack));
    // Note: per-project saving happens when projectId is available via the wizard
    toast.success('Persona & stack settings saved');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-studio-sidebar cyber-border rounded-lg w-full max-w-3xl max-h-[80vh] flex flex-col terminal-glow">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b cyber-border bg-studio-header">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 neon-purple pulse-glow" />
            <h2 className="font-cyber text-lg neon-green">MATRIX_CONFIG.SYS</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="neon-purple hover:neon-glow">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          <Tabs defaultValue="appearance" className="w-full">
            <TabsList className="grid w-full grid-cols-7 cyber-border">
              <TabsTrigger value="appearance" className="font-terminal text-xs">
                <Palette className="h-4 w-4 mr-1" />
                Theme
              </TabsTrigger>
              <TabsTrigger value="editor" className="font-terminal text-xs">
                <Type className="h-4 w-4 mr-1" />
                Editor
              </TabsTrigger>
              <TabsTrigger value="ai" className="font-terminal text-xs">
                <Cpu className="h-4 w-4 mr-1" />
                AI
              </TabsTrigger>
              <TabsTrigger value="persona" className="font-terminal text-xs">
                <Bot className="h-4 w-4 mr-1" />
                Persona
              </TabsTrigger>
              <TabsTrigger value="stack" className="font-terminal text-xs">
                <Server className="h-4 w-4 mr-1" />
                Stack
              </TabsTrigger>
              <TabsTrigger value="keybindings" className="font-terminal text-xs">
                <Keyboard className="h-4 w-4 mr-1" />
                Keys
              </TabsTrigger>
              <TabsTrigger value="advanced" className="font-terminal text-xs">
                <Zap className="h-4 w-4 mr-1" />
                Advanced
              </TabsTrigger>
            </TabsList>

            {/* Appearance */}
            <TabsContent value="appearance" className="space-y-6 mt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-terminal neon-green">Theme</Label>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger className="cyber-border bg-studio-terminal matrix-text font-terminal">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="cyber-border bg-studio-sidebar">
                      <SelectItem value="cyberpunk" className="font-terminal">Cyberpunk Matrix</SelectItem>
                      <SelectItem value="neon-purple" className="font-terminal">Neon Purple</SelectItem>
                      <SelectItem value="neural-blue" className="font-terminal">Neural Blue</SelectItem>
                      <SelectItem value="quantum-green" className="font-terminal">Quantum Green</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-terminal neon-green">Font Size: {fontSize[0]}px</Label>
                  <Slider value={fontSize} onValueChange={setFontSize} min={10} max={24} step={1} className="cyber-slider" />
                </div>
              </div>
            </TabsContent>

            {/* Editor */}
            <TabsContent value="editor" className="space-y-6 mt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="font-terminal matrix-text">Auto Save</Label>
                  <Switch checked={autoSave} onCheckedChange={setAutoSave} className="cyber-switch" />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="font-terminal matrix-text">Show Line Numbers</Label>
                  <Switch checked={lineNumbers} onCheckedChange={setLineNumbers} className="cyber-switch" />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="font-terminal matrix-text">Enable Minimap</Label>
                  <Switch checked={minimap} onCheckedChange={setMinimap} className="cyber-switch" />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="font-terminal matrix-text">Word Wrap</Label>
                  <Switch checked={wordWrap} onCheckedChange={setWordWrap} className="cyber-switch" />
                </div>
                <div className="space-y-2">
                  <Label className="font-terminal neon-green">Tab Size</Label>
                  <Select value={tabSize} onValueChange={setTabSize}>
                    <SelectTrigger className="cyber-border bg-studio-terminal matrix-text font-terminal">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="cyber-border bg-studio-sidebar">
                      <SelectItem value="2" className="font-terminal">2 spaces</SelectItem>
                      <SelectItem value="4" className="font-terminal">4 spaces</SelectItem>
                      <SelectItem value="8" className="font-terminal">8 spaces</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            {/* AI & Usage */}
            <TabsContent value="ai" className="space-y-6 mt-4">
              <div className="space-y-4">
                {/* Plan Badge */}
                <div className="flex items-center justify-between">
                  <Label className="font-terminal neon-green">Current Plan</Label>
                  <Badge className={`font-terminal text-xs uppercase ${planBadgeColor[userPlan.plan]}`}>
                    {userPlan.plan === 'premium' && <Crown className="h-3 w-3 mr-1" />}
                    {userPlan.plan}
                  </Badge>
                </div>

                {/* Daily Usage */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="font-terminal matrix-text text-xs">Daily Usage</Label>
                    <span className="font-terminal text-xs neon-green">{userPlan.dailyUsed} / {userPlan.dailyLimit}</span>
                  </div>
                  <Progress value={(userPlan.dailyUsed / userPlan.dailyLimit) * 100} className="h-2" />
                </div>

                {/* Monthly Usage */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="font-terminal matrix-text text-xs">Monthly Usage</Label>
                    <span className="font-terminal text-xs neon-green">{userPlan.monthlyUsed} / {userPlan.monthlyLimit}</span>
                  </div>
                  <Progress value={(userPlan.monthlyUsed / userPlan.monthlyLimit) * 100} className="h-2" />
                </div>

                {/* Model Access */}
                <div className="space-y-2">
                  <Label className="font-terminal neon-green">Available Models</Label>
                  <div className="space-y-1">
                    {AVAILABLE_MODELS.map(m => {
                      const allowed = userPlan.allowedModels.includes(m.value);
                      return (
                        <div key={m.value} className={`flex items-center justify-between text-xs font-terminal p-1.5 rounded ${allowed ? 'text-foreground' : 'text-muted-foreground opacity-50'}`}>
                          <span>{m.label}</span>
                          {!allowed && <Lock className="h-3 w-3 text-amber-500" />}
                          {allowed && <span className="text-green-400">✓</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* BYOK Section */}
                {userPlan.byokEnabled ? (
                  <div className="space-y-2 cyber-border rounded p-3 bg-studio-terminal">
                    <Label className="font-terminal neon-purple">Bring Your Own Key (OpenAI)</Label>
                    <div className="flex gap-2">
                      <Input
                        type="password"
                        value={byokKey}
                        onChange={(e) => setByokKey(e.target.value)}
                        placeholder="sk-..."
                        className="cyber-border bg-studio-terminal matrix-text font-terminal text-xs"
                      />
                      <Button size="sm" onClick={saveByokKey} disabled={!byokKey.trim() || isSavingKey} className="font-terminal text-xs">
                        Save
                      </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-terminal">
                      Your key is stored securely and used for OpenAI models only.
                    </p>
                  </div>
                ) : (
                  <div className="cyber-border rounded p-3 bg-studio-terminal text-center">
                    <p className="text-xs text-muted-foreground font-terminal">
                      <Lock className="h-3 w-3 inline mr-1" />
                      BYOK available on Pro & Premium plans
                    </p>
                  </div>
                )}

                {/* Upgrade CTA */}
                {userPlan.isFree && (
                  <Button
                    variant="outline"
                    className="w-full cyber-border font-terminal text-amber-400 hover:text-amber-300 border-amber-500/30"
                    onClick={() => toast.info('Plan upgrades coming soon!')}
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    Upgrade to Pro
                  </Button>
                )}
              </div>
            </TabsContent>

            <TabsContent value="persona" className="space-y-6 mt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-terminal neon-green">Persona Name</Label>
                  <Input
                    value={persona.name}
                    onChange={(e) => setPersona(p => ({ ...p, name: e.target.value }))}
                    className="cyber-border bg-studio-terminal matrix-text font-terminal"
                    placeholder="Lady Violet"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-terminal neon-green">AI Model</Label>
                  <Select value={persona.model} onValueChange={(v) => setPersona(p => ({ ...p, model: v }))}>
                    <SelectTrigger className="cyber-border bg-studio-terminal matrix-text font-terminal">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="cyber-border bg-studio-sidebar">
                      {AVAILABLE_MODELS.map(m => (
                        <SelectItem key={m.value} value={m.value} className="font-terminal">{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="font-terminal neon-green">Temperature: {persona.temperature.toFixed(1)}</Label>
                  <Slider
                    value={[persona.temperature]}
                    onValueChange={([v]) => setPersona(p => ({ ...p, temperature: v }))}
                    min={0}
                    max={1.5}
                    step={0.1}
                    className="cyber-slider"
                  />
                  <p className="text-[10px] text-muted-foreground font-terminal">
                    Lower = more focused, Higher = more creative
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="font-terminal neon-green">System Prompt</Label>
                  <Textarea
                    value={persona.systemPrompt}
                    onChange={(e) => setPersona(p => ({ ...p, systemPrompt: e.target.value }))}
                    className="cyber-border bg-studio-terminal matrix-text font-terminal min-h-[120px]"
                    placeholder="Describe the AI's personality and capabilities..."
                  />
                </div>

                <Button onClick={savePersona} className="w-full neon-glow cyber-border font-terminal">
                  <Bot className="h-4 w-4 mr-2" />
                  Save Persona Configuration
                </Button>
              </div>
            </TabsContent>

            {/* Stack Profile */}
            <TabsContent value="stack" className="space-y-6 mt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-terminal neon-green">Backend Stack</Label>
                  <Select value={stack.backend} onValueChange={(v: StackProfile['backend']) => setStack(s => ({ ...s, backend: v }))}>
                    <SelectTrigger className="cyber-border bg-studio-terminal matrix-text font-terminal">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="cyber-border bg-studio-sidebar">
                      <SelectItem value="supabase" className="font-terminal">Supabase (Fullstack)</SelectItem>
                      <SelectItem value="sqlite" className="font-terminal">SQLite (Self-hosted)</SelectItem>
                      <SelectItem value="none" className="font-terminal">Frontend Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="font-terminal neon-green">Authentication</Label>
                  <Select value={stack.auth} onValueChange={(v: StackProfile['auth']) => setStack(s => ({ ...s, auth: v }))}>
                    <SelectTrigger className="cyber-border bg-studio-terminal matrix-text font-terminal">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="cyber-border bg-studio-sidebar">
                      <SelectItem value="supabase_auth" className="font-terminal">Supabase Auth</SelectItem>
                      <SelectItem value="jwt" className="font-terminal">JWT (Custom)</SelectItem>
                      <SelectItem value="none" className="font-terminal">No Auth</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label className="font-terminal matrix-text">Auto-wire Backend</Label>
                  <Switch checked={stack.autoWireBackend} onCheckedChange={(v) => setStack(s => ({ ...s, autoWireBackend: v }))} className="cyber-switch" />
                </div>
                <p className="text-[10px] text-muted-foreground font-terminal">
                  When enabled, AI will automatically generate DB schemas, API routes, and auth wiring without asking.
                </p>

                <div className="flex items-center justify-between">
                  <Label className="font-terminal matrix-text">Auto-wire Middleware</Label>
                  <Switch checked={stack.autoWireMiddleware} onCheckedChange={(v) => setStack(s => ({ ...s, autoWireMiddleware: v }))} className="cyber-switch" />
                </div>
                <p className="text-[10px] text-muted-foreground font-terminal">
                  When enabled, AI will include auth middleware, rate limiting, and logging automatically.
                </p>

                <Button onClick={savePersona} className="w-full neon-glow cyber-border font-terminal">
                  <Server className="h-4 w-4 mr-2" />
                  Save Stack Profile
                </Button>
              </div>
            </TabsContent>

            {/* Keybindings */}
            <TabsContent value="keybindings" className="space-y-4 mt-4">
              <div className="cyber-border rounded p-4 bg-studio-terminal space-y-3">
                {[
                  { key: 'Ctrl + S', action: 'Save File' },
                  { key: 'Ctrl + N', action: 'New File' },
                  { key: 'Ctrl + W', action: 'Close Tab' },
                  { key: 'Ctrl + Shift + F', action: 'Search in Files' },
                  { key: 'Ctrl + `', action: 'Toggle Terminal' },
                  { key: 'Alt + ↑/↓', action: 'Move Line' },
                  { key: 'Ctrl + /', action: 'Toggle Comment' },
                  { key: 'F11', action: 'Toggle Fullscreen' }
                ].map((binding, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="matrix-text font-terminal">{binding.action}</span>
                    <span className="neon-green font-terminal cyber-border px-2 py-1 rounded">{binding.key}</span>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Advanced */}
            <TabsContent value="advanced" className="space-y-6 mt-4">
              <div className="space-y-4">
                <div className="cyber-border rounded p-4 bg-studio-terminal">
                  <h3 className="font-terminal neon-purple mb-3">Performance</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="matrix-text font-terminal">Enable Hardware Acceleration</span>
                      <Switch defaultChecked className="cyber-switch" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="matrix-text font-terminal">Neural Network Optimization</span>
                      <Switch defaultChecked className="cyber-switch" />
                    </div>
                  </div>
                </div>
                <div className="cyber-border rounded p-4 bg-studio-terminal">
                  <h3 className="font-terminal neon-purple mb-3">Experimental Features</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="matrix-text font-terminal">AI Code Suggestions</span>
                      <Switch className="cyber-switch" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="matrix-text font-terminal">Quantum Compiler</span>
                      <Switch className="cyber-switch" />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="p-4 border-t cyber-border bg-studio-header flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} className="cyber-border neon-purple hover:neon-glow font-terminal">
            Cancel
          </Button>
          <Button
            onClick={() => {
              savePersona();
              onClose();
            }}
            className="neon-glow cyber-border font-terminal"
          >
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
};
