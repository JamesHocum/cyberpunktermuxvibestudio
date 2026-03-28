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
  speakDirect: (text: string) => Promise<void>;
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
    if (storedId) {
      // Check preset voices first
      const preset = PRESET_VOICES.find(v => v.id === storedId);
      if (preset) return preset;
      // Check custom voices
      if (storedId.startsWith('custom-')) {
        const customVoices: Voice[] = JSON.parse(localStorage.getItem('custom-voices') || '[]');
        const custom = customVoices.find(v => v.id === storedId);
        if (custom) return custom;
      }
    }
    return PRESET_VOICES[0];
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

  const doSpeak = useCallback(async (text: string) => {
    if (!text.trim()) return;

    // Clean text for TTS (remove markdown, code blocks, etc.)
    const cleanText = text
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`[^`]+`/g, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/#+\s/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[•\-]\s/g, '')
      .trim();

    if (!cleanText) return;

    stop();
    setIsLoading(true);
    setError(null);

    try {
      abortControllerRef.current = new AbortController();

      // Get the user's actual session token for auth
      const { data: sessionData } = await (await import('@/integrations/supabase/client')).supabase.auth.getSession();
      const session = sessionData?.session;

      if (!session) {
        const msg = 'Please sign in to use voice playback';
        setError(msg);
        setIsLoading(false);
        const { toast } = await import('sonner');
        toast.error(msg);
        return;
      }

      const accessToken = session.access_token;

      if (import.meta.env.DEV) {
        console.debug('[TTS] Requesting voice playback', {
          voiceId: currentVoice.voiceId,
          textLength: cleanText.length,
          tokenExpiry: new Date((session.expires_at ?? 0) * 1000).toISOString(),
        });
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            text: cleanText.substring(0, 5000),
            voiceId: currentVoice.voiceId,
          }),
          signal: abortControllerRef.current.signal,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const status = response.status;
        let userMsg: string;

        if (status === 401) {
          userMsg = 'Authentication expired — please sign in again';
        } else if (status === 402) {
          userMsg = 'Voice credits exhausted — upgrade your ElevenLabs plan or wait for quota reset';
        } else if (status === 429) {
          userMsg = 'Rate limit reached — try again in a minute';
        } else if (status === 400) {
          userMsg = errorData.error || 'Invalid TTS request';
        } else {
          userMsg = errorData.error || `Voice service error (${status})`;
        }

        throw new Error(userMsg);
      }

      const audioBlob = await response.blob();

      if (!audioBlob || audioBlob.size === 0) {
        throw new Error('Empty audio response from voice service');
      }

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
      if (err instanceof Error && err.name === 'AbortError') return;

      if (import.meta.env.DEV) {
        console.error('[TTS] Voice playback error:', err);
      }

      const errorMsg = err instanceof Error ? err.message : 'Voice playback failed';
      setError(errorMsg);
      setIsLoading(false);
      setIsSpeaking(false);
      const { toast } = await import('sonner');
      toast.error(errorMsg);
    }
  }, [currentVoice, stop]);

  const speak = useCallback(async (text: string) => {
    if (!voiceEnabled) return;
    return doSpeak(text);
  }, [voiceEnabled, doSpeak]);

  const speakDirect = useCallback(async (text: string) => {
    return doSpeak(text);
  }, [doSpeak]);

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
    speakDirect,
    stop,
  };
}
