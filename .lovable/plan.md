

# Veyl Stage: Avatar Sprite, Error State, and Build Error Wiring

## Overview
Replace the paw-print placeholder with the cyberpunk heroine sprite image. After overlays fade out in idle mode, the avatar sprite enters the stage. Add an `error` mode with shake animation and red "Build glitch detected" bubble. Wire `buildError` state from StudioLayout through MonacoEditor to VeylStage.

## Files to Create / Copy

### 1. Copy uploaded image to `src/assets/veyl-avatar.png`
The blue-haired cyborg character becomes the Veyl avatar sprite.

## Files to Modify

### 2. `src/components/VeylStage.tsx`
- Extend `VeylMode` type to include `'error'`
- Import the avatar image from `@/assets/veyl-avatar.png`
- Add a new `useEffect` for error handling: when `hasError` is true, set mode to `'error'`, then after 1400ms return to `'idle'`
- Add `'error'` case to `animClass` switch returning `'animate-veyl-error'`
- Add a new state `showAvatar` (default `false`) that becomes `true` when `showOverlays` fades to `false` (i.e., after overlays disappear in idle)
- Replace the old paw-print circle with the full avatar sprite:
  - Shows only when `showAvatar` is true (after overlays fade)
  - Uses the imported image as background, with `object-contain`, positioned at bottom-center
  - Styled with neon-green border glow and gradient overlay
  - Gets the `animClass` applied for animations
- Update speech bubbles:
  - `'hero'`: neon-cyan "Building..." pill
  - `'idle'`: purple "Veyl Stage Active" pill (only visible while `showOverlays` is true)
  - `'error'`: red "Build glitch detected" pill (visible regardless of overlay state)
- Speech bubbles positioned above the avatar

### 3. `src/components/MonacoEditor.tsx`
- Add `buildError?: string | null` to `MonacoEditorProps` interface (line 35)
- Destructure `buildError` in the component (around line 77)
- Pass `hasError={!!buildError}` to VeylStage instead of hardcoded `false` (line 420)

### 4. `src/components/StudioLayout.tsx`
- Add `buildError` state: `const [buildError, setBuildError] = useState<string | null>(null)`
- Update `handleRun` to wrap `loadProject` in try/catch, setting `setBuildError('Build glitch detected')` on error, clearing it on start
- Pass `buildError={buildError}` to `MonacoCodeEditor`

### 5. `tailwind.config.ts`
- Add `veyl-error` keyframe: horizontal shake (-4px, 4px, -3px, 3px pattern over 0.35s)
- Add `animate-veyl-error` animation: `'veyl-error 0.35s ease-in-out 0s 3'` (shakes 3 times)

## Technical Details

- The avatar sprite fades in with `animate-veyl-enter` after the paw/label overlays disappear, creating a reveal sequence: overlays fade out -> avatar slides in
- The `showAvatar` state is toggled by a `useEffect` watching `showOverlays` -- when overlays fade to false, a short delay triggers the avatar entrance
- Error mode is temporary (1400ms) and automatically returns to idle, so the avatar remains visible
- The error shake animation applies to the entire stage container for dramatic effect

