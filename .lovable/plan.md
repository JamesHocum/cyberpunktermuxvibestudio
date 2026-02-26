

# Veyl Stage: Idle Fade-out and Image Fit Improvements

## Overview
After the environment loads and enters idle mode, the "Veyl Stage Active" label and paw print avatar should fade out and disappear. The background image should be resized to fit fully within the container (using `object-contain` instead of `object-cover`). An idle timer hook will be added for future use.

## Changes

### 1. `src/components/VeylStage.tsx`
- Change background image from `object-cover` to `object-contain` so the full artwork is visible without cropping
- Add `saturate-[1.2]` filter to match the provided CSS snippet
- After the stage transitions to `idle` mode, fade out the paw avatar and "Veyl Stage Active" speech bubble after a short delay (e.g. 2 seconds)
- Add local state `showOverlays` that starts `true` on entering/hero and fades to `false` once idle settles
- Wrap avatar and speech bubble in a container with opacity transition that hides when idle

### 2. `src/hooks/useIdleTimer.ts` (new file)
- Create a simple `useIdleTimer(timeout: number)` hook that returns `true` when the user has been idle (no mouse/keyboard activity) for the given duration
- Listens for `mousemove`, `keydown`, `mousedown`, `touchstart` events
- Resets timer on activity, returns idle boolean
- This will be available for future Veyl Stage enhancements (e.g. triggering special idle animations)

### 3. `src/components/MonacoEditor.tsx`
- No structural changes needed; `VeylStage` already receives `isBuilding` prop

### 4. `tailwind.config.ts`
- Update `veyl-enter` keyframe to use `translateY(40px)` entrance (sliding up) per the user's CSS snippet instead of the current scale animation
- Keep existing hero/idle/exit animations

## Technical Details

- The avatar and speech bubble use a CSS transition (`opacity`, `transition-duration: 1s`) controlled by a `showOverlays` state that flips to `false` 2 seconds after entering `idle` mode
- Background uses `object-contain` + `bg-black` to letterbox the image so nothing is cropped
- The `useIdleTimer` hook is standalone and can be wired into `StudioLayout` later to pass an `isIdle` prop to VeylStage

