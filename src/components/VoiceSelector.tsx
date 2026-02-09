import React from 'react';
import { Volume2, VolumeX, Loader2, Square } from 'lucide-react';
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
import { cn } from '@/lib/utils';
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
                  <span className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full animate-pulse" />
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
          className="h-7 w-7 p-0 text-red-400 hover:text-red-300"
          onClick={onStop}
        >
          <Square className="h-3 w-3 fill-current" />
        </Button>
      )}

      {/* Voice Selector Dropdown */}
      {voiceEnabled && (
        <Select
          value={currentVoice.id}
          onValueChange={(value) => {
            const voice = voices.find(v => v.id === value);
            if (voice) onVoiceChange(voice);
          }}
        >
          <SelectTrigger className="h-7 w-[100px] text-xs cyber-border bg-studio-terminal font-terminal">
            <SelectValue placeholder="Voice" />
          </SelectTrigger>
          <SelectContent className="cyber-border bg-studio-sidebar">
            {voices.map((voice) => (
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
      )}
    </div>
  );
};
