// Conversational memory snapshots — keeps Codex threads continuous
// across IDE restarts and devices.
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface MemorySnapshot {
  id: string;
  project_id: string;
  user_id: string;
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
  const platform = /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Mac/.test(ua) ? 'Mac' : /Win/.test(ua) ? 'Windows' : /Linux/.test(ua) ? 'Linux' : 'Web';
  const browser = /Edg\//.test(ua) ? 'Edge' : /Chrome/.test(ua) ? 'Chrome' : /Firefox/.test(ua) ? 'Firefox' : /Safari/.test(ua) ? 'Safari' : 'Browser';
  return `${platform} · ${browser}`;
};

export function useAgentMemory(projectId: string | null, sessionId: string = 'default') {
  const { user } = useAuth();
  const [snapshots, setSnapshots] = useState<MemorySnapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const pendingRef = useRef<(() => Promise<void>) | null>(null);
  const scope = `${user?.id ?? ''}:${projectId ?? ''}`;
  const scopeRef = useRef(scope);
  scopeRef.current = scope;
  const refreshId = useRef(0);

  const flushAutoSave = useCallback(async () => {
    if (debounceRef.current !== null) window.clearTimeout(debounceRef.current);
    debounceRef.current = null;
    const pending = pendingRef.current;
    pendingRef.current = null;
    if (pending) await pending();
  }, []);

  const refresh = useCallback(async () => {
    const requestId = ++refreshId.current;
    if (!user?.id || !projectId) {
      setSnapshots([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('agent_memory_snapshots')
        .select('*')
        .eq('user_id', user.id)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      if (scopeRef.current === scope && requestId === refreshId.current) {
        setSnapshots((data || []) as unknown as MemorySnapshot[]);
      }
    } catch {
      if (scopeRef.current === scope && requestId === refreshId.current) toast.error('Could not load conversation snapshots');
    } finally {
      if (scopeRef.current === scope && requestId === refreshId.current) setLoading(false);
    }
  }, [user?.id, projectId, scope]);

  const saveSnapshot = useCallback(
    async (payload: { messages: any[]; model?: string; persona?: Record<string, unknown>; summary?: string }) => {
      if (!user?.id || !projectId) throw new Error('Open a project and sign in to save conversation memory');
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
      if (error || !data) {
        toast.error('Conversation snapshot could not be saved');
        throw error ?? new Error('Snapshot save was not confirmed');
      }
      if (scopeRef.current === scope) {
        setSnapshots((prev) => [data as unknown as MemorySnapshot, ...prev].slice(0, 30));
      }
      window.dispatchEvent(new CustomEvent('cyberpunk:memory-saved', { detail: { projectId } }));
    },
    [user?.id, projectId, sessionId, scope],
  );

  // Debounced auto-save: call this on every chat change.
  const queueAutoSave = useCallback(
    (payload: { messages: any[]; model?: string; persona?: Record<string, unknown> }) => {
      if (!user?.id || !projectId || !payload.messages.length) return;
      if (debounceRef.current !== null) window.clearTimeout(debounceRef.current);
      // Capture this project's save callback, not whichever project is active later.
      pendingRef.current = () => saveSnapshot(payload);
      debounceRef.current = window.setTimeout(() => {
        void flushAutoSave().catch(() => {}); // saveSnapshot reports the failure.
      }, 30_000);
    },
    [saveSnapshot, flushAutoSave, user?.id, projectId],
  );

  const restoreSnapshot = useCallback(
    async (id: string): Promise<MemorySnapshot | null> => {
      if (!user?.id || !projectId) throw new Error('Open a project and sign in to restore memory');
      const { data, error } = await supabase
        .from('agent_memory_snapshots')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .eq('project_id', projectId)
        .maybeSingle();
      if (error) throw error;
      if (scopeRef.current !== scope) throw new Error('Project changed during restore');
      return (data as unknown as MemorySnapshot) || null;
    },
    [user?.id, projectId, scope],
  );

  const deleteSnapshot = useCallback(
    async (id: string) => {
      if (!user?.id || !projectId) throw new Error('Sign in to delete memory');
      const { data, error } = await supabase.from('agent_memory_snapshots').delete()
        .eq('id', id).eq('user_id', user.id).eq('project_id', projectId).select('id');
      if (error) throw error;
      if (!data?.length) throw new Error('Snapshot deletion was not confirmed');
      if (scopeRef.current === scope) setSnapshots((prev) => prev.filter((s) => s.id !== id));
    },
    [user?.id, projectId, scope],
  );

  const latest = snapshots[0] || null;

  useEffect(() => {
    setSnapshots([]);
    void refresh();
    const handleSaved = (event: Event) => {
      if ((event as CustomEvent).detail?.projectId === projectId) void refresh();
    };
    window.addEventListener('cyberpunk:memory-saved', handleSaved);
    return () => {
      ++refreshId.current;
      window.removeEventListener('cyberpunk:memory-saved', handleSaved);
      // Normal navigation stays in the browser, so start pending saves immediately.
      // Closing/reloading the browser does NOT guarantee async completion.
      void flushAutoSave().catch(() => {});
    };
  }, [refresh, projectId, flushAutoSave]);

  return { snapshots, latest, loading, refresh, saveSnapshot, queueAutoSave, flushAutoSave, restoreSnapshot, deleteSnapshot };
}

export default useAgentMemory;
