import React, { useState, useRef } from 'react';
import { Volume2, VolumeX, Loader2, Square, Upload, Mic, Plus, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { VoiceManagementPanel } from './VoiceManagementPanel';
import type { Voice } from '@/hooks/useVoicePlayback';

interface VoiceSelectorProps {
  voices: Voice[];
  currentVoice: Voice;
  voiceEnabled: boolean;
  isSpeaking: boolean;
  isLoading: boolean;
  onVoiceChange: (voice: Voice) => void;
  onToggle: (enabled: boolean) => void;
  onStop: () => void;
}

export const VoiceSelector = ({
  voices,
  currentVoice,
  voiceEnabled,
  isSpeaking,
  isLoading,
  onVoiceChange,
  onToggle,
  onStop,
}: VoiceSelectorProps) => {
  const [showCloneDialog, setShowCloneDialog] = useState(false);
  const [showManageDialog, setShowManageDialog] = useState(false);
  const [cloneName, setCloneName] = useState('');
  const [cloneFile, setCloneFile] = useState<File | null>(null);
  const [isCloning, setIsCloning] = useState(false);
  const [cloneSuccess, setCloneSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/x-m4a', 'audio/ogg', 'audio/webm'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload an audio file (MP3, WAV, M4A, OGG, or WebM)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Audio file must be under 10MB');
      return;
    }
    setCloneFile(file);
  };

  const handleCloneVoice = async () => {
    if (!cloneName.trim() || !cloneFile) {
      toast.error('Please provide a name and audio sample');
      return;
    }

    setIsCloning(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;
      if (!session) {
        toast.error('Please sign in to create custom voices');
        return;
      }

      const formData = new FormData();
      formData.append('name', cloneName.trim());
      formData.append('audio', cloneFile);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-clone-voice`,
        {
          method: 'POST',
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Voice cloning failed (${response.status})`);
      }

      const result = await response.json();
      const newVoice: Voice = {
        id: `custom-${result.voice_id}`,
        name: `${cloneName.trim()} ✦`,
        voiceId: result.voice_id,
      };

      // Save custom voices to localStorage
      const stored = JSON.parse(localStorage.getItem('custom-voices') || '[]');
      stored.push(newVoice);
      localStorage.setItem('custom-voices', JSON.stringify(stored));

      onVoiceChange(newVoice);
      setCloneSuccess(true);
      setTimeout(() => {
        setShowCloneDialog(false);
        setCloneName('');
        setCloneFile(null);
        setCloneSuccess(false);
      }, 1500);
      toast.success(`Voice "${cloneName}" created successfully!`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Voice cloning failed';
      toast.error(msg);
    } finally {
      setIsCloning(false);
    }
  };

  // Merge preset + custom voices
  const customVoices: Voice[] = JSON.parse(localStorage.getItem('custom-voices') || '[]');
  const allVoices = [...voices, ...customVoices];

  return (
    <div className="flex items-center gap-2">
      {/* Voice Toggle Button */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 w-7 p-0",
                voiceEnabled ? "neon-green" : "text-muted-foreground"
              )}
              onClick={() => {
                if (isSpeaking) {
                  onStop();
                }
                onToggle(!voiceEnabled);
              }}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isSpeaking ? (
                <div className="relative">
                  <Volume2 className="h-4 w-4 animate-pulse" />
                  <span className="absolute -top-1 -right-1 h-2 w-2 bg-primary rounded-full animate-pulse" />
                </div>
              ) : voiceEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="font-terminal text-xs">
              {voiceEnabled ? 'Voice enabled' : 'Voice disabled'}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Stop Button (only when speaking) */}
      {isSpeaking && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-destructive hover:text-destructive/80"
          onClick={onStop}
        >
          <Square className="h-3 w-3 fill-current" />
        </Button>
      )}

      {/* Voice Selector Dropdown */}
      {voiceEnabled && (
        <>
          <Select
            value={allVoices.find(v => v.voiceId === currentVoice.voiceId)?.id || currentVoice.id}
            onValueChange={(value) => {
              const voice = allVoices.find(v => v.id === value);
              if (voice) onVoiceChange(voice);
            }}
          >
            <SelectTrigger className="h-7 w-[110px] text-xs cyber-border bg-studio-terminal font-terminal">
              <SelectValue placeholder="Voice" />
            </SelectTrigger>
            <SelectContent className="cyber-border bg-studio-sidebar">
              {allVoices.map((voice) => (
                <SelectItem
                  key={voice.id}
                  value={voice.id}
                  className="font-terminal text-xs"
                >
                  {voice.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Clone Voice Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:neon-purple"
                  onClick={() => setShowCloneDialog(true)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="font-terminal text-xs">Create custom voice</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Manage Voices Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:neon-green"
                  onClick={() => setShowManageDialog(true)}
                >
                  <Settings2 className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="font-terminal text-xs">Manage voices</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </>
      )}

      {/* Voice Management Panel */}
      <VoiceManagementPanel
        open={showManageDialog}
        onOpenChange={setShowManageDialog}
        currentVoice={currentVoice}
        onVoiceChange={onVoiceChange}
      />

      {/* Clone Voice Dialog */}
      <Dialog open={showCloneDialog} onOpenChange={(open) => { setShowCloneDialog(open); if (!open) { setCloneFile(null); setCloneName(''); setCloneSuccess(false); } }}>
        <DialogContent className={cn("cyber-border bg-studio-sidebar border-primary/30 max-w-md transition-colors duration-500", cloneSuccess && "border-green-500/60")}>
          <DialogHeader>
            <DialogTitle className="font-terminal neon-green flex items-center gap-2">
              <Mic className="h-5 w-5" />
              CREATE CUSTOM VOICE
            </DialogTitle>
            <DialogDescription className="text-muted-foreground font-terminal text-xs">
              Upload an audio sample to clone a voice for the AI assistant. Best results with 30s–5min of clear speech.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-terminal text-muted-foreground mb-1 block">
                Voice Name
              </label>
              <Input
                value={cloneName}
                onChange={(e) => setCloneName(e.target.value)}
                placeholder="My Custom Voice"
                className="cyber-border bg-studio-terminal font-terminal text-sm"
                maxLength={50}
              />
            </div>

            <div>
              <label className="text-xs font-terminal text-muted-foreground mb-1 block">
                Audio Sample
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                variant="outline"
                className="w-full cyber-border bg-studio-terminal font-terminal text-xs h-20 flex flex-col items-center justify-center gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                {cloneFile ? (
                  <>
                    <Mic className="h-5 w-5 neon-green" />
                    <span className="neon-green truncate max-w-[200px]">{cloneFile.name}</span>
                    <span className="text-muted-foreground">
                      {(cloneFile.size / (1024 * 1024)).toFixed(1)}MB
                    </span>
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <span className="text-muted-foreground">Click to upload audio (MP3, WAV, M4A)</span>
                  </>
                )}
              </Button>
            </div>

            <div className="text-xs text-muted-foreground font-terminal space-y-1">
              <p>• Supported: MP3, WAV, M4A, OGG, WebM (max 10MB)</p>
              <p>• Best quality: 30 seconds to 5 minutes of clear speech</p>
              <p>• Avoid background noise for best results</p>
            </div>

            <Button
              onClick={handleCloneVoice}
              disabled={isCloning || !cloneName.trim() || !cloneFile}
              className="w-full font-terminal bg-primary/20 hover:bg-primary/30 border border-primary/50 neon-green"
            >
              {isCloning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  CLONING VOICE...
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4 mr-2" />
                  CREATE VOICE
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
