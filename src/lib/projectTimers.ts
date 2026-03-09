// Project timer persistence and event system

export interface TimerState {
  thoughtSeconds: number;
  workedSeconds: number;
  lastSavedAt: number;
}

export interface TimerSnapshot extends TimerState {
  projectId: string;
  sessionStart: number;
}

const STORAGE_PREFIX = 'codex-timer-';

export const loadTimerState = (projectId: string): TimerState => {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${projectId}`);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { thoughtSeconds: 0, workedSeconds: 0, lastSavedAt: Date.now() };
};

export const saveTimerState = (projectId: string, state: TimerState): void => {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${projectId}`, JSON.stringify({
      ...state,
      lastSavedAt: Date.now(),
    }));
  } catch { /* ignore */ }
};

export const formatTimer = (totalSeconds: number): string => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

// Activity event types the timer system recognizes
export type ActivityEvent =
  | 'keystroke'
  | 'prompt_submit'
  | 'file_save'
  | 'build_action'
  | 'terminal_command'
  | 'ide_action';

// Global activity bus so any component can signal work
type ActivityListener = (event: ActivityEvent) => void;
const listeners = new Set<ActivityListener>();

export const onActivity = (fn: ActivityListener) => {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
};

export const emitActivity = (event: ActivityEvent) => {
  listeners.forEach(fn => fn(event));
};
