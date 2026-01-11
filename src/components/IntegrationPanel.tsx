import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  Github, 
  Brain, 
  Database, 
  DollarSign, 
  Sparkles,
  CreditCard,
  Wallet,
  Loader2,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  LogOut,
  Link2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useGitHub } from '@/hooks/useGitHub';

interface IntegrationPanelProps {
  isVisible: boolean;
  onClose: () => void;
}

export const IntegrationPanel: React.FC<IntegrationPanelProps> = ({ isVisible, onClose }) => {
  const { toast } = useToast();
  const github = useGitHub();
  const [integrations, setIntegrations] = useState({
    github: { enabled: true, autoPush: false },
    huggingface: { enabled: false, token: '', verified: false },
    supabase: { enabled: true },
    googleAdsense: { enabled: false },
    stripe: false,
    cashapp: false,
    paypal: false,
    chime: false
  });
  const [showHfToken, setShowHfToken] = useState(false);
  const [isTestingHf, setIsTestingHf] = useState(false);

  // Update GitHub enabled state based on connection
  useEffect(() => {
    setIntegrations(prev => ({
      ...prev,
      github: { ...prev.github, enabled: github.connected }
    }));
  }, [github.connected]);

  if (!isVisible) return null;

  const toggleIntegration = (key: string, subKey?: string) => {
    if (subKey) {
      setIntegrations(prev => {
        const currentVal = prev[key as keyof typeof prev];
        if (typeof currentVal === 'object' && currentVal !== null) {
          return {
            ...prev,
            [key]: { ...currentVal, [subKey]: !(currentVal as any)[subKey] }
          };
        }
        return prev;
      });
    } else {
      setIntegrations(prev => ({
        ...prev,
        [key]: !prev[key as keyof typeof prev]
      }));
    }
    
    toast({
      title: "Integration Updated",
      description: `${key} integration ${subKey ? subKey : ''} toggled`,
    });
  };

  const testHuggingFaceConnection = async () => {
    setIsTestingHf(true);
    
    try {
      // Test the HuggingFace integration via edge function
      const { data, error } = await supabase.functions.invoke('huggingface-inference', {
        body: {
          task: 'text-generation',
          inputs: 'Hello, this is a test.',
          parameters: { max_new_tokens: 10 }
        }
      });

      if (error) throw error;

      if (data?.setup_required) {
        toast({
          title: "Token Required",
          description: "Please add HUGGING_FACE_ACCESS_TOKEN to your secrets",
          variant: "destructive"
        });
        return;
      }

      if (data?.loading) {
        toast({
          title: "Model Loading",
          description: "HuggingFace model is warming up. Try again in a moment.",
        });
        return;
      }

      setIntegrations(prev => ({
        ...prev,
        huggingface: { ...prev.huggingface, verified: true, enabled: true }
      }));

      toast({
        title: "Connection Verified! ✓",
        description: "HuggingFace integration is working correctly",
      });
    } catch (error) {
      console.error('[HuggingFace Test Error]:', error);
      setIntegrations(prev => ({
        ...prev,
        huggingface: { ...prev.huggingface, verified: false }
      }));
      toast({
        title: "Connection Failed",
        description: "Could not connect to HuggingFace. Check your token.",
        variant: "destructive"
      });
    } finally {
      setIsTestingHf(false);
    }
  };

  const testCodexAgent = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('codex-agent', {
        body: {
          task: 'complete',
          code: 'function hello() { return'
        }
      });

      if (error) throw error;

      toast({
        title: "Codex Agent Active! ✓",
        description: "AI coding assistant is ready",
      });
    } catch (error) {
      console.error('[Codex Agent Test Error]:', error);
      toast({
        title: "Codex Agent Error",
        description: "Could not connect to Codex Agent",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
      <Card className="w-full max-w-4xl mx-4 bg-studio-sidebar border-2 cyber-border neon-glow max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-cyber neon-green">
            <Sparkles className="h-5 w-5" />
            INTEGRATION_MATRIX.SYS
          </CardTitle>
          <CardDescription className="font-terminal matrix-text">
            Configure external service connections and AI integrations
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* AI & Development Tools */}
          <div className="space-y-4">
            <h3 className="text-sm font-cyber neon-purple">AI & Development</h3>
            
            {/* Codex Agent (Built-in) */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-studio-terminal cyber-border">
              <div className="flex items-center gap-3">
                <Brain className="h-5 w-5 neon-green pulse-glow" />
                <div>
                  <Label className="font-terminal matrix-text">Codex Agent (Lovable AI)</Label>
                  <p className="text-xs text-muted-foreground font-terminal">
                    Built-in AI coding assistant - No API key needed
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-neon-green text-studio-bg font-terminal">ACTIVE</Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={testCodexAgent}
                  className="cyber-border"
                >
                  Test
                </Button>
              </div>
            </div>

            {/* HuggingFace Integration */}
            <div className="p-4 rounded-lg bg-studio-terminal cyber-border space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Brain className="h-5 w-5 neon-purple" />
                  <div>
                    <Label className="font-terminal matrix-text">HuggingFace</Label>
                    <p className="text-xs text-muted-foreground font-terminal">
                      ML model deployment, image generation & inference
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {integrations.huggingface.verified ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                  )}
                  <Switch
                    checked={integrations.huggingface.enabled}
                    onCheckedChange={() => toggleIntegration('huggingface', 'enabled')}
                  />
                </div>
              </div>
              
              {integrations.huggingface.enabled && (
                <div className="pt-2 border-t cyber-border space-y-2">
                  <p className="text-xs font-terminal text-muted-foreground">
                    Token is stored securely in backend. Click Test to verify connection.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={testHuggingFaceConnection}
                      disabled={isTestingHf}
                      className="cyber-border bg-neon-purple/20 hover:bg-neon-purple/30"
                    >
                      {isTestingHf ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Brain className="h-4 w-4 mr-2" />
                      )}
                      Test Connection
                    </Button>
                    <a 
                      href="https://huggingface.co/settings/tokens" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-neon-cyan underline font-terminal self-center"
                    >
                      Get Token →
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* GitHub */}
            <div className="p-4 rounded-lg bg-studio-terminal cyber-border space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Github className="h-5 w-5 neon-green" />
                  <div>
                    <Label className="font-terminal matrix-text">GitHub Integration</Label>
                    <p className="text-xs text-muted-foreground font-terminal">
                      Connect to push/pull from repositories
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {github.connected ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                  )}
                  <Badge className={github.connected ? 'bg-neon-green text-studio-bg' : ''}>
                    {github.loading ? 'CHECKING...' : github.connected ? 'CONNECTED' : 'NOT CONNECTED'}
                  </Badge>
                </div>
              </div>

              {github.connected ? (
                <div className="pt-2 border-t cyber-border space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={github.avatarUrl || ''} alt={github.username || ''} />
                      <AvatarFallback className="bg-neon-green/20 text-neon-green">
                        {github.username?.charAt(0).toUpperCase() || 'G'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-terminal text-sm matrix-text">{github.username}</p>
                      <p className="text-xs text-muted-foreground font-terminal">Connected Account</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={integrations.github.autoPush}
                      onCheckedChange={() => toggleIntegration('github', 'autoPush')}
                    />
                    <Label className="text-xs font-terminal">Auto-Push on Save</Label>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={github.disconnect}
                    className="cyber-border text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Disconnect
                  </Button>
                </div>
              ) : (
                <div className="pt-2 border-t cyber-border">
                  <Button
                    size="sm"
                    onClick={github.connect}
                    disabled={github.isAuthorizing || github.loading}
                    className="cyber-border bg-neon-green/20 hover:bg-neon-green/30 neon-green"
                  >
                    {github.isAuthorizing ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Link2 className="h-4 w-4 mr-2" />
                    )}
                    Connect GitHub Account
                  </Button>
                </div>
              )}
            </div>

            {/* Lovable Cloud */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-studio-terminal cyber-border">
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 neon-green" />
                <div>
                  <Label className="font-terminal matrix-text">Lovable Cloud</Label>
                  <p className="text-xs text-muted-foreground font-terminal">
                    Backend, database & edge functions
                  </p>
                </div>
              </div>
              <Badge className="bg-neon-green text-studio-bg font-terminal">CONNECTED</Badge>
            </div>
          </div>

          {/* Monetization */}
          <div className="space-y-4">
            <h3 className="text-sm font-cyber neon-purple">Monetization & Payments</h3>
            
            <div className="flex items-center justify-between p-4 rounded-lg bg-studio-terminal cyber-border">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 neon-green" />
                <div>
                  <Label className="font-terminal matrix-text">Google AdSense</Label>
                  <p className="text-xs text-muted-foreground font-terminal">
                    Display ads monetization
                  </p>
                </div>
              </div>
              <Switch
                checked={integrations.googleAdsense.enabled}
                onCheckedChange={() => toggleIntegration('googleAdsense', 'enabled')}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-studio-terminal cyber-border">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 neon-purple" />
                  <Label className="font-terminal matrix-text text-sm">Stripe</Label>
                </div>
                <Switch
                  checked={integrations.stripe}
                  onCheckedChange={() => toggleIntegration('stripe')}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-studio-terminal cyber-border">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 neon-green" />
                  <Label className="font-terminal matrix-text text-sm">Cash App</Label>
                </div>
                <Switch
                  checked={integrations.cashapp}
                  onCheckedChange={() => toggleIntegration('cashapp')}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-studio-terminal cyber-border">
                <div className="flex items-center gap-3">
                  <Wallet className="h-5 w-5 neon-purple" />
                  <Label className="font-terminal matrix-text text-sm">PayPal</Label>
                </div>
                <Switch
                  checked={integrations.paypal}
                  onCheckedChange={() => toggleIntegration('paypal')}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-studio-terminal cyber-border">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 neon-green" />
                  <Label className="font-terminal matrix-text text-sm">Chime</Label>
                </div>
                <Switch
                  checked={integrations.chime}
                  onCheckedChange={() => toggleIntegration('chime')}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t cyber-border">
            <Button variant="outline" onClick={onClose} className="cyber-border">
              Close
            </Button>
            <Button 
              onClick={() => {
                toast({
                  title: "Config Saved",
                  description: "Integration settings updated successfully",
                });
                onClose();
              }}
              className="bg-neon-green text-studio-bg hover:bg-neon-green/90 font-terminal"
            >
              Save Configuration
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
