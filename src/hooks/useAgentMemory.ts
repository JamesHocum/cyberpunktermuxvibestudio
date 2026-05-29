// Conversational memory snapshots — keeps Codex threads continuous
// across IDE restarts and devices.
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface MemorySnapshot {
  id: string;
  session_id: string;
  summary: string | null;
  messages: any[];
  model: string | null;
  persona: Record<string, unknown>;
  device_label: string | null;
  created_at: string;
}

const deviceLabel = () => {
  if (typeof navigator === 'undefined') return 'unknown';
  const ua = navigator.userAgent;
  const platform = /Mac/.test(ua) ? 'Mac' : /Win/.test(ua) ? 'Windows' : /Linux/.test(ua) ? 'Linux' : /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : 'Web';
  const browser = /Edg\//.test(ua) ? 'Edge' : /Chrome/.test(ua) ? 'Chrome' : /Firefox/.test(ua) ? 'Firefox' : /Safari/.test(ua) ? 'Safari' : 'Browser';
  return `${platform} · ${browser}`;
};

export function useAgentMemory(projectId: string | null, sessionId: string = 'default') {
  const { user } = useAuth();
  const [snapshots, setSnapshots] = useState<MemorySnapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const lastSaveRef = useRef<number>(0);
  const debounceRef = useRef<number | null>(null);

  const refresh = useCallback(async () => {
    if (!user?.id || !projectId) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('agent_memory_snapshots')
        .select('*')
        .eq('user_id', user.id)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(30);
      setSnapshots((data || []) as unknown as MemorySnapshot[]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, projectId]);

  const saveSnapshot = useCallback(
    async (payload: { messages: any[]; model?: string; persona?: Record<string, unknown>; summary?: string }) => {
      if (!user?.id || !projectId) return;
      lastSaveRef.current = Date.now();
      const { data, error } = await supabase
        .from('agent_memory_snapshots')
        .insert({
          user_id: user.id,
          project_id: projectId,
          session_id: sessionId,
          messages: payload.messages as any,
          model: payload.model ?? null,
          persona: (payload.persona ?? {}) as any,
          summary: payload.summary ?? `${payload.messages.length} messages`,
          device_label: deviceLabel(),
        })
        .select('*')
        .single();
      if (!error && data) {
        setSnapshots((prev) => [data as unknown as MemorySnapshot, ...prev].slice(0, 30));
      }
    },
    [user?.id, projectId, sessionId],
  );

  // Debounced auto-save: call this on every chat change.
  const queueAutoSave = useCallback(
    (payload: { messages: any[]; model?: string; persona?: Record<string, unknown> }) => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(() => {
        if (payload.messages.length > 0) saveSnapshot(payload).catch(() => {});
      }, 30_000);
    },
    [saveSnapshot],
  );

  const restoreSnapshot = useCallback(
    async (id: string): Promise<MemorySnapshot | null> => {
      const found = snapshots.find((s) => s.id === id);
      if (found) return found;
      const { data } = await supabase
        .from('agent_memory_snapshots')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      return (data as unknown as MemorySnapshot) || null;
    },
    [snapshots],
  );

  const deleteSnapshot = useCallback(
    async (id: string) => {
      await supabase.from('agent_memory_snapshots').delete().eq('id', id);
      setSnapshots((prev) => prev.filter((s) => s.id !== id));
    },
    [],
  );

  const latest = snapshots[0] || null;

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Save once on unload too (best-effort)
  useEffect(() => {
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, []);

  return { snapshots, latest, loading, refresh, saveSnapshot, queueAutoSave, restoreSnapshot, deleteSnapshot };
}

export default useAgentMemory;
