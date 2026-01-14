import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Download, X, Smartphone, Monitor, Share } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';
import { toast } from 'sonner';

interface PWAInstallPromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PWAInstallPrompt = ({ open, onOpenChange }: PWAInstallPromptProps) => {
  const { canInstall, install, isIOS, isAndroid, isInstalled, getInstallInstructions, platform } = usePWA();
  const [installing, setInstalling] = useState(false);

  const handleInstall = async () => {
    if (!canInstall) return;
    
    setInstalling(true);
    const success = await install();
    setInstalling(false);
    
    if (success) {
      toast.success('App installed successfully!');
      onOpenChange(false);
    } else {
      toast.error('Installation was cancelled');
    }
  };

  if (isInstalled) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-black/95 border-green-500/30 cyber-border terminal-glow">
          <DialogHeader>
            <DialogTitle className="font-cyber neon-green flex items-center gap-2">
              <Download className="h-5 w-5" />
              Already Installed
            </DialogTitle>
            <DialogDescription className="matrix-text font-terminal">
              Cyberpunk Termux is already installed on your device. Launch it from your home screen or app launcher.
            </DialogDescription>
          </DialogHeader>
          <Button 
            onClick={() => onOpenChange(false)}
            className="neon-glow font-cyber"
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-black/95 border-purple-600/30 cyber-border terminal-glow max-w-md">
        <DialogHeader>
          <DialogTitle className="font-cyber neon-purple flex items-center gap-2">
            <Download className="h-5 w-5 pulse-glow" />
            Install Cyberpunk Termux
          </DialogTitle>
          <DialogDescription className="matrix-text font-terminal">
            Install this app for offline access, faster loading, and a native app experience.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Platform indicator */}
          <div className="flex items-center gap-3 p-3 bg-studio-terminal rounded-lg cyber-border">
            {platform === 'ios' || platform === 'android' ? (
              <Smartphone className="h-8 w-8 neon-purple" />
            ) : (
              <Monitor className="h-8 w-8 neon-green" />
            )}
            <div>
              <p className="font-cyber neon-green text-sm">
                {platform === 'ios' ? 'iOS Device' : 
                 platform === 'android' ? 'Android Device' : 
                 'Desktop Browser'}
              </p>
              <p className="text-xs matrix-text font-terminal">
                Detected Platform
              </p>
            </div>
          </div>

          {/* Installation instructions based on platform */}
          {isIOS ? (
            <div className="space-y-3">
              <p className="font-terminal text-sm matrix-text">
                iOS doesn't support automatic installation. Follow these steps:
              </p>
              <ol className="list-decimal list-inside space-y-2 font-terminal text-sm">
                <li className="neon-green">Tap the <Share className="inline h-4 w-4 mx-1" /> Share button</li>
                <li className="neon-purple">Scroll and tap "Add to Home Screen"</li>
                <li className="neon-green">Tap "Add" to confirm</li>
              </ol>
            </div>
          ) : canInstall ? (
            <Button 
              onClick={handleInstall}
              disabled={installing}
              className="w-full neon-glow font-cyber pulse-glow"
              size="lg"
            >
              {installing ? (
                <>Installing...</>
              ) : (
                <>
                  <Download className="h-5 w-5 mr-2" />
                  Install Now
                </>
              )}
            </Button>
          ) : (
            <div className="text-center p-4 bg-studio-terminal rounded-lg cyber-border">
              <p className="font-terminal text-sm matrix-text">
                {getInstallInstructions()}
              </p>
            </div>
          )}

          {/* Features */}
          <div className="grid grid-cols-2 gap-2 pt-4 border-t cyber-border">
            <div className="text-center p-2">
              <p className="font-cyber text-xs neon-green">Offline Mode</p>
              <p className="text-xs matrix-text font-terminal">Works without internet</p>
            </div>
            <div className="text-center p-2">
              <p className="font-cyber text-xs neon-purple">Fast Launch</p>
              <p className="text-xs matrix-text font-terminal">Native-like speed</p>
            </div>
            <div className="text-center p-2">
              <p className="font-cyber text-xs neon-green">Full Screen</p>
              <p className="text-xs matrix-text font-terminal">No browser UI</p>
            </div>
            <div className="text-center p-2">
              <p className="font-cyber text-xs neon-purple">Home Screen</p>
              <p className="text-xs matrix-text font-terminal">Quick access icon</p>
            </div>
          </div>
        </div>

        <Button 
          variant="ghost" 
          onClick={() => onOpenChange(false)}
          className="font-terminal text-muted-foreground"
        >
          Maybe Later
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default PWAInstallPrompt;
