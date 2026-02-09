import { useRef, useState, useCallback, useEffect } from 'react';

interface DragScrollState {
  isDown: boolean;
  startX: number;
  scrollLeft: number;
  hasMoved: boolean;
}

export function useDragScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [isDragging, setIsDragging] = useState(false);
  const stateRef = useRef<DragScrollState>({
    isDown: false,
    startX: 0,
    scrollLeft: 0,
    hasMoved: false,
  });

  const DRAG_THRESHOLD = 5; // pixels before drag activates

  const handleMouseDown = useCallback((e: React.MouseEvent<T>) => {
    const element = ref.current;
    if (!element) return;

    // Don't start drag if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input, select, textarea, [role="button"]')) {
      return;
    }

    stateRef.current = {
      isDown: true,
      startX: e.pageX - element.offsetLeft,
      scrollLeft: element.scrollLeft,
      hasMoved: false,
    };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<T>) => {
    const element = ref.current;
    const state = stateRef.current;
    
    if (!state.isDown || !element) return;

    e.preventDefault();
    
    const x = e.pageX - element.offsetLeft;
    const walk = x - state.startX;
    
    // Only start dragging after threshold
    if (!state.hasMoved && Math.abs(walk) > DRAG_THRESHOLD) {
      state.hasMoved = true;
      setIsDragging(true);
    }

    if (state.hasMoved) {
      element.scrollLeft = state.scrollLeft - walk;
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    stateRef.current.isDown = false;
    stateRef.current.hasMoved = false;
    setIsDragging(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (stateRef.current.isDown) {
      stateRef.current.isDown = false;
      stateRef.current.hasMoved = false;
      setIsDragging(false);
    }
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stateRef.current.isDown = false;
    };
  }, []);

  const handlers = {
    onMouseDown: handleMouseDown,
    onMouseMove: handleMouseMove,
    onMouseUp: handleMouseUp,
    onMouseLeave: handleMouseLeave,
  };

  return { ref, isDragging, handlers };
}
