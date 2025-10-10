import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { PersonaConfig } from '../../pantheon.config';

interface DevModeOverlayProps {
  personas: PersonaConfig[];
}

export const DevModeOverlay: React.FC<DevModeOverlayProps> = ({ personas }) => {
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <Card className="fixed top-4 right-4 z-[9999] bg-studio-sidebar border-2 cyber-border neon-glow max-w-xs">
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-studio-terminal/50 transition-colors"
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="flex items-center gap-2">
          <Badge className="bg-neon-green text-studio-bg font-cyber">DEV MODE</Badge>
          <span className="text-xs text-neon-purple font-terminal">UNRESTRICTED</span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 w-6 p-0 neon-green hover:neon-glow"
        >
          {isMinimized ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </Button>
      </div>
      
      {!isMinimized && (
        <>
          <div className="px-3 pb-3 space-y-2">
            <div className="text-sm font-cyber neon-green">Active Personas:</div>
            <div className="space-y-1">
              {personas.map(p => (
                <div key={p.id} className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse" />
                  <span className="matrix-text font-terminal">{p.name}</span>
                  <Badge variant="outline" className="text-[10px] cyber-border">
                    {p.model.split('/')[1]}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
          
          <div className="px-3 pb-3 pt-2 border-t cyber-border">
            <div className="text-xs text-neon-purple font-terminal">
              🔓 All safety protocols disabled
            </div>
          </div>
        </>
      )}
    </Card>
  );
};
