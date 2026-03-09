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
  const lastActivityRef = useRef(0);
  const isVisibleRef = useRef(!document.hidden);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const persistRef = useRef<ReturnType<typeof setInterval>>();
  const stateRef = useRef<TimerState>({ thoughtSeconds: 0, workedSeconds: 0, lastSavedAt: 0 });

  // Load persisted state when project changes
  useEffect(() => {
    if (!projectId) return;
    const saved = loadTimerState(projectId);
    stateRef.current = saved;
    setThought(saved.thoughtSeconds);
    setWorked(saved.workedSeconds);
    lastActivityRef.current = 0; // reset activity for new project
  }, [projectId]);

  // Core tick — runs every second
  useEffect(() => {
    if (!projectId) return;

    const tick = () => {
      if (!isVisibleRef.current) return;

      // Thought always increments while tab visible
      stateRef.current.thoughtSeconds += 1;
      setThought(stateRef.current.thoughtSeconds);

      // Worked increments only if recent activity
      const now = Date.now();
      if (lastActivityRef.current > 0 && now - lastActivityRef.current < INACTIVITY_THRESHOLD_MS) {
        stateRef.current.workedSeconds += 1;
        setWorked(stateRef.current.workedSeconds);
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
      // Save on unmount
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

  // Manual signal for components that import the hook directly
  const signalActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  return { thoughtSeconds: thought, workedSeconds: worked, signalActivity };
}
