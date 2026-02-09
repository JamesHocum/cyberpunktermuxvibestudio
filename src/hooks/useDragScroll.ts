import { useRef, useState, useCallback, useEffect } from 'react';

interface DragScrollState {
  isDown: boolean;
  startX: number;
  scrollLeft: number;
  hasMoved: boolean;
  lastX: number;
  lastTime: number;
  velocityX: number;
}

export function useDragScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [isDragging, setIsDragging] = useState(false);
  const stateRef = useRef<DragScrollState>({
    isDown: false,
    startX: 0,
    scrollLeft: 0,
    hasMoved: false,
    lastX: 0,
    lastTime: 0,
    velocityX: 0,
  });
  const animationRef = useRef<number | null>(null);

  const DRAG_THRESHOLD = 5; // pixels before drag activates
  const FRICTION = 0.92; // exponential decay factor
  const MIN_VELOCITY = 0.5; // minimum velocity before stopping

  // Cancel any ongoing momentum animation
  const cancelMomentum = useCallback(() => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  // Apply momentum scrolling after release
  const applyMomentum = useCallback(() => {
    const element = ref.current;
    const state = stateRef.current;

    if (!element || Math.abs(state.velocityX) < MIN_VELOCITY) {
      animationRef.current = null;
      return;
    }

    // Apply velocity
    element.scrollLeft -= state.velocityX;

    // Apply friction
    state.velocityX *= FRICTION;

    // Check bounds
    const maxScroll = element.scrollWidth - element.clientWidth;
    if (element.scrollLeft <= 0 || element.scrollLeft >= maxScroll) {
      state.velocityX = 0;
      animationRef.current = null;
      return;
    }

    // Continue animation
    animationRef.current = requestAnimationFrame(applyMomentum);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<T>) => {
    const element = ref.current;
    if (!element) return;

    // Cancel any ongoing momentum
    cancelMomentum();

    // Don't start drag if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input, select, textarea, [role="button"]')) {
      return;
    }

    const now = performance.now();
    stateRef.current = {
      isDown: true,
      startX: e.pageX - element.offsetLeft,
      scrollLeft: element.scrollLeft,
      hasMoved: false,
      lastX: e.pageX,
      lastTime: now,
      velocityX: 0,
    };
  }, [cancelMomentum]);

  const handleMouseMove = useCallback((e: React.MouseEvent<T>) => {
    const element = ref.current;
    const state = stateRef.current;
    
    if (!state.isDown || !element) return;

    e.preventDefault();
    
    const x = e.pageX - element.offsetLeft;
    const walk = x - state.startX;
    const now = performance.now();
    
    // Only start dragging after threshold
    if (!state.hasMoved && Math.abs(walk) > DRAG_THRESHOLD) {
      state.hasMoved = true;
      setIsDragging(true);
    }

    if (state.hasMoved) {
      // Calculate velocity (pixels per millisecond)
      const dt = now - state.lastTime;
      if (dt > 0) {
        const dx = e.pageX - state.lastX;
        state.velocityX = dx / dt * 16; // Scale to ~60fps frame time
      }

      state.lastX = e.pageX;
      state.lastTime = now;

      element.scrollLeft = state.scrollLeft - walk;
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    const state = stateRef.current;
    
    // Start momentum if there was significant velocity
    if (state.hasMoved && Math.abs(state.velocityX) > MIN_VELOCITY) {
      animationRef.current = requestAnimationFrame(applyMomentum);
    }

    state.isDown = false;
    state.hasMoved = false;
    setIsDragging(false);
  }, [applyMomentum]);

  const handleMouseLeave = useCallback(() => {
    const state = stateRef.current;
    
    if (state.isDown) {
      // Start momentum if there was significant velocity
      if (state.hasMoved && Math.abs(state.velocityX) > MIN_VELOCITY) {
        animationRef.current = requestAnimationFrame(applyMomentum);
      }

      state.isDown = false;
      state.hasMoved = false;
      setIsDragging(false);
    }
  }, [applyMomentum]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stateRef.current.isDown = false;
      cancelMomentum();
    };
  }, [cancelMomentum]);

  const handlers = {
    onMouseDown: handleMouseDown,
    onMouseMove: handleMouseMove,
    onMouseUp: handleMouseUp,
    onMouseLeave: handleMouseLeave,
  };

  return { ref, isDragging, handlers };
}
