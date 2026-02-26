
# Portal-Based Veyl Avatar Overlay

## Overview
Refactor VeylStage from a constrained child element inside the Monaco editor container to a React portal rendered into `document.body`. This eliminates all parent clipping, borders, and overflow constraints, allowing the avatar to float freely above the entire IDE with proper z-indexing.

## Files to Modify

### 1. `src/components/VeylStage.tsx`
- Wrap the entire render output in `createPortal(..., document.body)` using `react-dom`
- Change the root container from `absolute inset-0` to `fixed` positioning with bottom-center placement
- Remove the alley background image and dark overlay gradient (no longer filling a container -- the avatar floats on its own)
- Keep the particle canvas but scope it to a fixed-size area behind the avatar (e.g. 300x400 region)
- Remove the `border-2 border-neon-green/80` from the avatar panel -- no box, no border
- Remove `overflow-hidden` and `bg-black` from the root container
- Keep all existing animation classes, state machine logic, quotes, typewriter, and particle system
- Add `pointer-events: none` on the wrapper so clicks pass through to the IDE
- Use `z-index: 9999` to float above all editor content
- Add a `mounted` state guard for SSR-safe portal rendering
- Reposition speech bubbles to stack below the avatar within the portal

### 2. `src/components/MonacoEditor.tsx`
- Move `<VeylStage>` outside the `div.flex-1.relative.overflow-hidden` container (lines 422-431)
- Since VeylStage now portals to `document.body`, its placement in the component tree only matters for React lifecycle, not DOM positioning
- Keep it adjacent to or just before the editor div, still conditionally rendered when `syntaxTheme === 'veyl-stage'`

## Technical Details

### Portal Structure
```text
document.body
  +-- VeylStage portal (fixed, bottom-center, z-9999, pointer-events-none)
       +-- particle canvas (absolute within a sized wrapper)
       +-- avatar img (no border, no box, object-contain)
       +-- speech bubbles (positioned below avatar)
```

### What Stays the Same
- All state machine logic (hidden/entering/hero/idle/cooldown/error/saved)
- All animation classes (veyl-enter, veyl-hero, veyl-idle, veyl-error, etc.)
- Typewriter hook and quote cycling
- Particle system with 2s pulse sync
- lastSaveTick-based save reactions
- Conditional activation only when veyl-stage theme is selected

### What Changes
- Root element: `div.absolute.inset-0` becomes `div.fixed.bottom-6` with explicit centering
- Background: alley image and gradient overlay removed (avatar stands alone over the editor)
- Avatar panel: border and rounded-xl box removed; just the transparent PNG floating freely
- Canvas: sized to a fixed region (e.g. 320x400) centered on the avatar area rather than filling a parent
- Rendering: wrapped in `createPortal` for DOM-level escape from layout constraints
