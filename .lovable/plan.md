

# Veyl Stage: Comic-Style Panel, Walk Animations, and Save Tick

## Overview
Replace the circular avatar with a tall comic-style panel showing the full-body hero image. Update all Veyl animations to feel more like movement (side-to-side pacing during builds, gentle hover during idle, shake on error). Wire a `lastSaveTick` prop from StudioLayout through MonacoEditor to VeylStage to replace the current `justSaved` boolean approach with a more reliable timestamp-based trigger. Add comic-style speech bubble tails.

## Files to Modify

### 1. `src/components/VeylStage.tsx`
- Replace the circular avatar container (lines 263-282) with a tall rectangular comic panel (`h-64 w-32 md:h-80 md:w-40`, rounded-xl, transparent background, neon-green border glow)
- Use an `<img>` tag with `object-contain` instead of `object-cover` to show the full body
- Remove the old circular paw-print placeholder section (lines 247-251) -- keep the fade-out overlay wrapper but simplify its content or remove it entirely since the comic panel replaces it
- Move speech bubbles inside the same bottom-center container, stacked below the panel, with comic-style diamond "tail" pointers (small rotated squares pointing up)
- Replace `justSaved` prop with `lastSaveTick?: number | null`
- Update the save reaction `useEffect` to trigger off `lastSaveTick` instead of `justSaved`
- Keep existing idle glow (`animate-veyl-avatar-glow`) and breathe (`animate-veyl-breathe`) on the panel during idle
- Keep save flash (`animate-veyl-save-flash`) during saved mode
- Apply `animClass` to the panel container for mode-based animations

### 2. `src/components/MonacoEditor.tsx`
- Replace `justSaved` boolean with `lastSaveTick?: number | null` in `MonacoEditorProps` (line 36 area)
- Destructure `lastSaveTick` instead of managing local `justSaved` state for VeylStage
- Keep `justSaved` local state for the save button check animation, but pass `lastSaveTick` to VeylStage
- Add `lastSaveTick` to the props interface
- Pass `lastSaveTick={lastSaveTick ?? null}` to `<VeylStage>`

### 3. `src/components/StudioLayout.tsx`
- Add `lastSaveTick` state: `const [lastSaveTick, setLastSaveTick] = useState<number | null>(null)`
- Update `handleSave` to call `setLastSaveTick(Date.now())` after saving
- Pass `lastSaveTick={lastSaveTick}` to `<MonacoCodeEditor>`

### 4. `tailwind.config.ts`
- Update `veyl-enter` keyframes: `translateY(12px) scale(0.96)` to `translateY(0) scale(1)`, duration 0.4s
- Update `veyl-idle` keyframes: gentle vertical bob (`translateY(0)` to `translateY(-4px)`), 3.2s infinite
- Update `veyl-hero` keyframes: side-to-side pacing (`translateX(-6px)` to `translateX(6px)`), 1.2s infinite
- Update `veyl-error` keyframes: horizontal shake with 25%/75% split, 0.5s duration
- Update corresponding animation durations in the `animation` section

## Technical Details

### Comic Panel Structure
```text
+----------------------------------+
|  Veyl Stage (background image)   |
|                                  |
|     +------------------+         |
|     |                  |         |
|     |  veyl-avatar.png |  h-64   |
|     |  object-contain  |  w-32   |
|     |  rounded-xl      |         |
|     |  neon-green glow  |         |
|     +------------------+         |
|          diamond tail             |
|     [ speech bubble text ]        |
+----------------------------------+
```

### Animation Changes
- `veyl-enter`: slide-up + scale entrance (0.4s)
- `veyl-hero`: horizontal pacing left-right (1.2s loop) -- she "walks" while building
- `veyl-idle`: gentle vertical bob (3.2s loop) -- breathing/hovering
- `veyl-error`: horizontal shake (0.5s) -- glitch reaction

### Save Tick Approach
Using `lastSaveTick` (timestamp) instead of `justSaved` (boolean) is more reliable because the `useEffect` dependency on the changing number triggers every save, even rapid successive saves. The VeylStage effect watches for changes to `lastSaveTick` and shows a save bubble for 2 seconds.

