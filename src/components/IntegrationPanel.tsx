import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Github, 
  Brain, 
  Database, 
  DollarSign, 
  Sparkles,
  CreditCard,
  Wallet
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface IntegrationPanelProps {
  isVisible: boolean;
  onClose: () => void;
}

export const IntegrationPanel: React.FC<IntegrationPanelProps> = ({ isVisible, onClose }) => {
  const { toast } = useToast();
  const [integrations, setIntegrations] = useState({
    github: { enabled: true, autoPush: false },
    huggingface: { enabled: false },
    supabase: { enabled: true },
    googleAdsense: { enabled: false },
    stripe: false,
    cashapp: false,
    paypal: false,
    chime: false
  });

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

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
      <Card className="w-full max-w-4xl mx-4 bg-studio-sidebar border-2 cyber-border neon-glow max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-cyber neon-green">
            <Sparkles className="h-5 w-5" />
            INTEGRATION_MATRIX.SYS
          </CardTitle>
          <CardDescription className="font-terminal matrix-text">
            Configure external service connections and payment gateways
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Development Tools */}
          <div className="space-y-4">
            <h3 className="text-sm font-cyber neon-purple">Development & Deployment</h3>
            
            <div className="flex items-center justify-between p-4 rounded-lg bg-studio-terminal cyber-border">
              <div className="flex items-center gap-3">
                <Github className="h-5 w-5 neon-green" />
                <div>
                  <Label className="font-terminal matrix-text">GitHub Integration</Label>
                  <p className="text-xs text-muted-foreground font-terminal">
                    Auto-push to repository branches
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={integrations.github.autoPush}
                    onCheckedChange={() => toggleIntegration('github', 'autoPush')}
                  />
                  <Label className="text-xs font-terminal">Auto-Push</Label>
                </div>
                <Badge className={integrations.github.enabled ? 'bg-neon-green text-studio-bg' : ''}>
                  {integrations.github.enabled ? 'ACTIVE' : 'INACTIVE'}
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-studio-terminal cyber-border">
              <div className="flex items-center gap-3">
                <Brain className="h-5 w-5 neon-purple" />
                <div>
                  <Label className="font-terminal matrix-text">Hugging Face</Label>
                  <p className="text-xs text-muted-foreground font-terminal">
                    ML model deployment & inference
                  </p>
                </div>
              </div>
              <Switch
                checked={integrations.huggingface.enabled}
                onCheckedChange={() => toggleIntegration('huggingface', 'enabled')}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-studio-terminal cyber-border">
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 neon-green" />
                <div>
                  <Label className="font-terminal matrix-text">Lovable Cloud</Label>
                  <p className="text-xs text-muted-foreground font-terminal">
                    Backend & database services
                  </p>
                </div>
              </div>
              <Badge className="bg-neon-green text-studio-bg">CONNECTED</Badge>
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
              className="bg-neon-green text-studio-bg hover:bg-neon-green/90"
            >
              Save Configuration
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
