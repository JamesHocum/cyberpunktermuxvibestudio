import { useState, useRef, useCallback } from 'react';

export interface Voice {
  id: string;
  name: string;
  voiceId: string;
}

export const PRESET_VOICES: Voice[] = [
  { id: 'sol', name: 'Sol (Default)', voiceId: 'IKne3meq5aSn9XLyUdCD' },
  { id: 'roger', name: 'Roger', voiceId: 'CwhRBWXzGAHq8TQ4Fs17' },
  { id: 'sarah', name: 'Sarah', voiceId: 'EXAVITQu4vr4xnSDxMaL' },
  { id: 'laura', name: 'Laura', voiceId: 'FGY2WhTYpPnrIDTdsKH5' },
  { id: 'charlie', name: 'Charlie', voiceId: 'IKne3meq5aSn9XLyUdCD' },
  { id: 'george', name: 'George', voiceId: 'JBFqnCBsd6RMkjVDRZzb' },
  { id: 'callum', name: 'Callum', voiceId: 'N2lVS1w4EtoT3dr4eOWO' },
  { id: 'lily', name: 'Lily', voiceId: 'pFZP5JQG7iQjIQuC4Bku' },
];

interface UseVoicePlaybackReturn {
  isSpeaking: boolean;
  isLoading: boolean;
  error: string | null;
  currentVoice: Voice;
  voices: Voice[];
  voiceEnabled: boolean;
  setVoiceEnabled: (enabled: boolean) => void;
  setCurrentVoice: (voice: Voice) => void;
  speak: (text: string) => Promise<void>;
  stop: () => void;
}

export function useVoicePlayback(): UseVoicePlaybackReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(() => {
    const stored = localStorage.getItem('voice-enabled');
    return stored === 'true';
  });
  const [currentVoice, setCurrentVoiceState] = useState<Voice>(() => {
    const storedId = localStorage.getItem('voice-id');
    return PRESET_VOICES.find(v => v.id === storedId) || PRESET_VOICES[0];
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const setCurrentVoice = useCallback((voice: Voice) => {
    setCurrentVoiceState(voice);
    localStorage.setItem('voice-id', voice.id);
  }, []);

  const handleVoiceEnabled = useCallback((enabled: boolean) => {
    setVoiceEnabled(enabled);
    localStorage.setItem('voice-enabled', String(enabled));
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsSpeaking(false);
    setIsLoading(false);
  }, []);

  const speak = useCallback(async (text: string) => {
    if (!voiceEnabled || !text.trim()) return;

    // Clean text for TTS (remove markdown, code blocks, etc.)
    const cleanText = text
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/`[^`]+`/g, '') // Remove inline code
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold markers
      .replace(/\*([^*]+)\*/g, '$1') // Remove italic markers
      .replace(/#+\s/g, '') // Remove headers
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
      .replace(/[•\-]\s/g, '') // Remove bullet points
      .trim();

    if (!cleanText) return;

    // Stop any current playback
    stop();

    setIsLoading(true);
    setError(null);

    try {
      abortControllerRef.current = new AbortController();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            text: cleanText.substring(0, 5000), // Limit text length
            voiceId: currentVoice.voiceId,
          }),
          signal: abortControllerRef.current.signal,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `TTS request failed: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };
      audioRef.current.onerror = () => {
        setError('Audio playback failed');
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };

      setIsLoading(false);
      setIsSpeaking(true);
      await audioRef.current.play();
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Cancelled, ignore
        return;
      }
      console.error('Voice playback error:', err);
      setError(err instanceof Error ? err.message : 'Voice playback failed');
      setIsLoading(false);
      setIsSpeaking(false);
    }
  }, [voiceEnabled, currentVoice, stop]);

  return {
    isSpeaking,
    isLoading,
    error,
    currentVoice,
    voices: PRESET_VOICES,
    voiceEnabled,
    setVoiceEnabled: handleVoiceEnabled,
    setCurrentVoice,
    speak,
    stop,
  };
}
