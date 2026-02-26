import { useState, useEffect, useCallback, useRef } from "react";

export function useIdleTimer(timeout: number): boolean {
  const [isIdle, setIsIdle] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const reset = useCallback(() => {
    setIsIdle(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setIsIdle(true), timeout);
  }, [timeout]);

  useEffect(() => {
    const events = ["mousemove", "keydown", "mousedown", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, reset));
    timerRef.current = setTimeout(() => setIsIdle(true), timeout);
    return () => {
      events.forEach((e) => window.removeEventListener(e, reset));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [reset, timeout]);

  return isIdle;
}
