

# Click-and-Drag Horizontal Scrolling for Header Toolbar

## Problem
The top header toolbar buttons overflow when browser zoom is increased or on smaller screens. While CSS `overflow-x-auto` enables native scroll-wheel scrolling, users cannot left-click and drag to scroll horizontally. This is a common UX pattern expected in horizontal scroll areas.

## Solution
Implement a **custom drag-to-scroll hook** that adds click-and-drag scrolling behavior to the desktop toolbar container. When users click and hold on the toolbar area (not on a button), they can drag left/right to scroll through the buttons.

---

## Technical Approach

### 1. Create a Custom Hook: `useDragScroll`

Create `src/hooks/useDragScroll.ts` to encapsulate the drag-to-scroll logic:

```text
Features:
- Track mousedown/mouseup/mousemove events
- Calculate scroll position based on drag distance
- Add cursor styling (grab/grabbing) during drag
- Prevent text selection during drag
- Work with React refs
```

**Logic Flow:**
1. On `mousedown` on the container (not button): Record start position, set dragging state
2. On `mousemove` while dragging: Calculate delta, update `scrollLeft`
3. On `mouseup` or `mouseleave`: Stop dragging, reset cursor

### 2. Update StudioHeader Component

Apply the hook to the scrollable toolbar container:

```text
Current (line 206):
<div className="flex items-center space-x-2 overflow-x-auto scrollbar-hide max-w-[60vw] px-2">

After:
<div 
  ref={scrollRef}
  className="flex items-center space-x-2 overflow-x-auto scrollbar-hide max-w-[60vw] px-2 cursor-grab active:cursor-grabbing select-none"
  {...dragHandlers}
>
```

### 3. CSS Enhancements

Add grab cursor styles to `src/index.css`:

```css
.drag-scroll-container {
  cursor: grab;
  user-select: none;
}

.drag-scroll-container:active {
  cursor: grabbing;
}

.drag-scroll-container.is-dragging {
  cursor: grabbing;
}
```

---

## Implementation Details

### Hook API Design

```typescript
// src/hooks/useDragScroll.ts
export function useDragScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  
  // Returns:
  // - ref: Attach to scrollable container
  // - isDragging: Boolean state for conditional styling
  // - handlers: { onMouseDown, onMouseMove, onMouseUp, onMouseLeave }
}
```

### Event Handling Strategy

| Event | Action |
|-------|--------|
| `mousedown` | Check if clicking on container (not button), start drag tracking |
| `mousemove` | If dragging, calculate `deltaX` and update `scrollLeft` |
| `mouseup` | End drag state |
| `mouseleave` | End drag state (safety) |

### Button Click Preservation

The hook must NOT interfere with button clicks:
- Only initiate drag if `mousedown` target is the container itself OR user drags more than 5px threshold
- If drag distance < 5px, treat as a click (let event bubble)
- Use `e.target === e.currentTarget` check or threshold-based approach

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/hooks/useDragScroll.ts` | Create | Custom hook for drag-to-scroll behavior |
| `src/components/StudioHeader.tsx` | Modify | Apply hook to desktop toolbar container |
| `src/index.css` | Modify | Add cursor and selection styles for drag scrolling |

---

## Visual Behavior

1. **Default state**: Cursor shows `grab` on hover over toolbar
2. **During drag**: Cursor changes to `grabbing`, scrolls horizontally with mouse movement
3. **Button clicks**: Still work normally - clicking a button triggers its action
4. **Zoom resilience**: Works at any zoom level since it uses actual pixel distances

---

## Edge Cases Handled

- **Touch devices**: Already have native drag scrolling, hook only applies to mouse events
- **Momentum/inertia**: Optional enhancement - can add smooth deceleration after release
- **Nested buttons**: Drag only starts on empty space or after movement threshold
- **Fast dragging**: Uses `requestAnimationFrame` for smooth performance

