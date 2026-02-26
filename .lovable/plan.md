

# Floating Neon Particles Behind Veyl Avatar (Synced to IDE Pulse)

## Overview
Add a canvas-based particle system directly inside VeylStage that renders floating neon particles behind the avatar during idle mode. The particles will pulse their opacity and size in sync with the existing 2-second `pulse-glow` cycle used throughout the IDE, creating a cohesive rhythmic ambiance.

## What Changes

### 1. `src/components/VeylStage.tsx`
- Add a `<canvas>` element positioned between the alley background and the avatar container (z-order: behind avatar, in front of background overlay)
- Create a self-contained particle system using `useEffect` + `useRef` for the canvas
- **Particle behavior:**
  - ~30 particles floating upward at varied speeds, concentrated around the bottom-center (behind the avatar)
  - Colors alternate between neon-green (`rgba(74,222,128)`) and neon-purple (`rgba(168,85,247)`) with some cyan (`rgba(34,211,238)`)
  - Each particle's opacity and radius pulse on a **2-second sine wave** (`Math.sin(time * Math.PI)` over 2000ms), matching the `pulse-glow` keyframe timing exactly
  - Particles respawn at the bottom when they float off the top
- **Idle-only visibility:** The canvas fades in when `showAvatar` is true and mode is `idle` or `saved`, and fades out otherwise
- No dependency on the existing `Particles.tsx` component (that one is a global full-screen effect; this is localized to the Veyl Stage area)

### 2. No other files need changes
- The particle system is entirely self-contained within VeylStage
- The 2s pulse timing is hardcoded to match the existing `pulse-glow` animation — no config changes needed

## Technical Details

### Pulse Sync Math
The existing `pulse-glow` animation is `2s infinite`:
- At 0%/100%: neon-green shadow
- At 50%: cyber shadow (brighter)

The particles will use `Math.sin((performance.now() % 2000) / 2000 * Math.PI * 2)` to create a 0-to-1-to-0 pulse over the same 2s period. This value modulates each particle's:
- **Opacity**: base 0.3 + pulse * 0.5 (range 0.3 to 0.8)
- **Radius**: base size + pulse * 1px (subtle throb)

### Particle Spawn Area
Particles spawn in the bottom third of the canvas, horizontally centered (within ~40% of width), so they rise up around and behind the avatar panel. This keeps the effect localized and atmospheric rather than filling the entire stage.

### Performance
- ~30 particles with simple circle draws — negligible GPU/CPU cost
- Canvas resizes on container resize via ResizeObserver
- Animation loop cancels on unmount or when particles should be hidden

