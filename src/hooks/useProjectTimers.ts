import { useState, useEffect, useRef, useCallback } from 'react';
import {
  TimerState,
  loadTimerState,
  saveTimerState,
  onActivity,
  ActivityEvent,
} from '@/lib/projectTimers';

const INACTIVITY_THRESHOLD_MS = 75_000; // 75 seconds
const PERSIST_INTERVAL_MS = 10_000; // save every 10s

export function useProjectTimers(projectId: string | undefined) {
  const [thought, setThought] = useState(0);
  const [worked, setWorked] = useState(0);
  const [sessionThought, setSessionThought] = useState(0);
  const [sessionWorked, setSessionWorked] = useState(0);
  const lastActivityRef = useRef(0);
  const isVisibleRef = useRef(!document.hidden);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const persistRef = useRef<ReturnType<typeof setInterval>>();
  const stateRef = useRef<TimerState>({ thoughtSeconds: 0, workedSeconds: 0, lastSavedAt: 0 });
  const sessionRef = useRef({ thought: 0, worked: 0 });

  // Load persisted state when project changes
  useEffect(() => {
    if (!projectId) return;
    const saved = loadTimerState(projectId);
    stateRef.current = saved;
    setThought(saved.thoughtSeconds);
    setWorked(saved.workedSeconds);
    sessionRef.current = { thought: 0, worked: 0 };
    setSessionThought(0);
    setSessionWorked(0);
    lastActivityRef.current = 0;
  }, [projectId]);

  // Core tick — runs every second
  useEffect(() => {
    if (!projectId) return;

    const tick = () => {
      if (!isVisibleRef.current) return;

      // Thought always increments while tab visible
      stateRef.current.thoughtSeconds += 1;
      sessionRef.current.thought += 1;
      setThought(stateRef.current.thoughtSeconds);
      setSessionThought(sessionRef.current.thought);

      // Worked increments only if recent activity
      const now = Date.now();
      if (lastActivityRef.current > 0 && now - lastActivityRef.current < INACTIVITY_THRESHOLD_MS) {
        stateRef.current.workedSeconds += 1;
        sessionRef.current.worked += 1;
        setWorked(stateRef.current.workedSeconds);
        setSessionWorked(sessionRef.current.worked);
      }
    };

    intervalRef.current = setInterval(tick, 1000);
    return () => clearInterval(intervalRef.current);
  }, [projectId]);

  // Persist periodically
  useEffect(() => {
    if (!projectId) return;
    persistRef.current = setInterval(() => {
      saveTimerState(projectId, stateRef.current);
    }, PERSIST_INTERVAL_MS);
    return () => {
      clearInterval(persistRef.current);
      saveTimerState(projectId, stateRef.current);
    };
  }, [projectId]);

  // Visibility change
  useEffect(() => {
    const handler = () => { isVisibleRef.current = !document.hidden; };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  // Listen for activity events from global bus
  useEffect(() => {
    return onActivity((_event: ActivityEvent) => {
      lastActivityRef.current = Date.now();
    });
  }, []);

  const signalActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  return {
    thoughtSeconds: thought,
    workedSeconds: worked,
    sessionThoughtSeconds: sessionThought,
    sessionWorkedSeconds: sessionWorked,
    signalActivity,
  };
}
