import React, { useState, useEffect } from 'react';
import { Play, Pause, Pencil, Trash2, Lock, Loader2, Sparkles, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { PRESET_VOICES, type Voice } from '@/hooks/useVoicePlayback';

interface VoiceManagementPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentVoice: Voice;
  onVoiceChange: (voice: Voice) => void;
}

export const VoiceManagementPanel = ({
  open,
  onOpenChange,
  currentVoice,
  onVoiceChange,
}: VoiceManagementPanelProps) => {
  const [customVoices, setCustomVoices] = useState<Voice[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [audioRef] = useState<{ current: HTMLAudioElement | null }>({ current: null });

  useEffect(() => {
    if (open) {
      const stored: Voice[] = JSON.parse(localStorage.getItem('custom-voices') || '[]');
      setCustomVoices(stored);
    }
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, [open]);

  const previewVoice = async (voice: Voice) => {
    if (playingId === voice.id) {
      audioRef.current?.pause();
      audioRef.current = null;
      setPlayingId(null);
      return;
    }

    audioRef.current?.pause();
    setLoadingId(voice.id);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;
      if (!session) {
        toast.error('Sign in to preview voices');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            text: `Hello, I am ${voice.name.replace(' ✦', '')}. This is a preview of my voice.`,
            voiceId: voice.voiceId,
          }),
        }
      );

      if (!response.ok) throw new Error('Preview failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        setPlayingId(null);
        URL.revokeObjectURL(url);
      };

      setPlayingId(voice.id);
      setLoadingId(null);
      await audio.play();
    } catch {
      toast.error('Failed to preview voice');
    } finally {
      setLoadingId(null);
    }
  };

  const startRename = (voice: Voice) => {
    setEditingId(voice.id);
    setEditName(voice.name.replace(' ✦', ''));
  };

  const saveRename = (voiceId: string) => {
    if (!editName.trim()) return;
    const updated = customVoices.map(v =>
      v.id === voiceId ? { ...v, name: `${editName.trim()} ✦` } : v
    );
    setCustomVoices(updated);
    localStorage.setItem('custom-voices', JSON.stringify(updated));

    const renamedVoice = updated.find(v => v.id === voiceId);
    if (currentVoice.id === voiceId && renamedVoice) {
      onVoiceChange(renamedVoice);
    }

    setEditingId(null);
    toast.success('Voice renamed');
  };

  const deleteVoice = (voiceId: string) => {
    const updated = customVoices.filter(v => v.id !== voiceId);
    setCustomVoices(updated);
    localStorage.setItem('custom-voices', JSON.stringify(updated));

    if (currentVoice.id === voiceId) {
      onVoiceChange(PRESET_VOICES[0]);
    }

    audioRef.current?.pause();
    if (playingId === voiceId) setPlayingId(null);

    toast.success('Voice deleted');
  };

  const VoiceRow = ({ voice, isPreset }: { voice: Voice; isPreset: boolean }) => (
    <div className="flex items-center gap-2 p-2 rounded-md hover:bg-primary/10 group transition-colors">
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0 shrink-0"
        onClick={() => previewVoice(voice)}
        disabled={loadingId === voice.id}
      >
        {loadingId === voice.id ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
        ) : playingId === voice.id ? (
          <Pause className="h-3.5 w-3.5 text-primary" />
        ) : (
          <Play className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
        )}
      </Button>

      <div className="flex-1 min-w-0">
        {editingId === voice.id ? (
          <div className="flex gap-1">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveRename(voice.id)}
              className="h-6 text-xs cyber-border bg-studio-terminal font-terminal"
              autoFocus
              maxLength={40}
            />
            <Button size="sm" className="h-6 px-2 text-xs" onClick={() => saveRename(voice.id)}>
              Save
            </Button>
          </div>
        ) : (
          <span className={`text-xs font-terminal truncate block ${currentVoice.id === voice.id ? 'neon-green' : 'text-foreground'}`}>
            {isPreset && <Lock className="h-3 w-3 inline mr-1 text-muted-foreground" />}
            {voice.name}
          </span>
        )}
      </div>

      {!isPreset && editingId !== voice.id && (
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => startRename(voice)} title="Rename">
            <Pencil className="h-3 w-3 text-muted-foreground hover:text-primary" />
          </Button>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => deleteVoice(voice.id)} title="Delete">
            <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
          </Button>
        </div>
      )}

      {!isPreset && (
        <Button
          variant="ghost"
          size="sm"
          className={`h-6 px-2 text-xs font-terminal shrink-0 ${currentVoice.id === voice.id ? 'neon-green' : 'text-muted-foreground'}`}
          onClick={() => onVoiceChange(voice)}
        >
          {currentVoice.id === voice.id ? 'Active' : 'Use'}
        </Button>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="cyber-border bg-studio-sidebar border-primary/30 max-w-md">
        <DialogHeader>
          <DialogTitle className="font-terminal neon-green flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            VOICE MANAGEMENT
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-terminal text-xs">
            Preview, rename, and manage your voices.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pr-2">
          <div className="space-y-4">
            {/* Preset Voices */}
            <div>
              <h4 className="text-xs font-terminal text-muted-foreground mb-2 flex items-center gap-1">
                <Lock className="h-3 w-3" /> PRESET VOICES
              </h4>
              <div className="space-y-0.5">
                {PRESET_VOICES.map(v => (
                  <VoiceRow key={v.id} voice={v} isPreset />
                ))}
              </div>
            </div>

            {/* Custom Voices */}
            <div>
              <h4 className="text-xs font-terminal text-muted-foreground mb-2 flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> CUSTOM VOICES
              </h4>
              {customVoices.length === 0 ? (
                <p className="text-xs text-muted-foreground font-terminal py-3 text-center">
                  No custom voices yet. Use the + button to clone a voice.
                </p>
              ) : (
                <div className="space-y-0.5">
                  {customVoices.map(v => (
                    <VoiceRow key={v.id} voice={v} isPreset={false} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
