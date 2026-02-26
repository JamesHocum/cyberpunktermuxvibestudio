

# Add "Veyl Stage" Theme to the IDE

## Overview
Add a 4th interactive theme called **Veyl Stage** that renders an animated stage with the cyberpunk alley artwork in the center editor area (above the terminal). The stage activates when the theme is selected and responds to build/run actions.

## Files to Create

### 1. `src/components/VeylStage.tsx`
- Create the VeylStage component based on the provided snippet, with proper JSX structure
- State machine with modes: hidden, entering, hero, idle, cooldown
- Props: `isActive`, `isBuilding`, `hasError`
- Renders the cyberpunk alley background image (from `src/assets/`), an avatar sprite placeholder, and a speech bubble container
- Uses Tailwind animation classes (`animate-veyl-enter`, `animate-veyl-hero`, `animate-veyl-idle`, `animate-veyl-exit`)

### 2. Copy uploaded image to `src/assets/veyl-stage-bg.jpg`
- The cyberpunk dog/alley artwork becomes the stage background

## Files to Modify

### 3. `src/lib/monacoThemes.ts`
- Add `'veyl-stage'` to the `MonacoTheme` type union
- Add a `veylStageTheme` definition with dark purples/magentas/neon pinks matching the artwork's color palette
- Export it in the `monacoThemes` object

### 4. `src/components/MonacoEditor.tsx`
- Add "Veyl Stage" option to the theme dropdown menu (alongside Matrix, Cyber, Vaporwave)
- Track `veylStageActive` state derived from `syntaxTheme === 'veyl-stage'`
- Render `<VeylStage>` as an overlay in the editor area when the Veyl Stage theme is active and no file content is focused
- Pass `isBuilding={false}` and `hasError={false}` initially (wired later)

### 5. `src/components/StudioLayout.tsx`
- Add `isRunningBuild` state, set to `true` during `handleRun` and `false` when complete
- Pass `isRunningBuild` down to `MonacoCodeEditor` so VeylStage can react to builds

### 6. `tailwind.config.ts`
- Add keyframes and animation utilities for the Veyl Stage transitions:
  - `veyl-enter`: fade + scale in (1.5s)
  - `veyl-hero`: pulse glow effect
  - `veyl-idle`: subtle breathing animation
  - `veyl-exit`: fade out

### 7. `src/index.css`
- Add any supplementary CSS for the Veyl Stage background sizing, overlay gradients, and sprite positioning

## Technical Details

- The VeylStage component renders absolutely positioned within the editor panel, behind/over the Monaco editor when active
- The background image is imported as an ES6 module from `src/assets/veyl-stage-bg.jpg` for proper bundling
- Theme selection persists to localStorage via the existing `saveTheme` / `loadTheme` mechanism
- The stage transitions smoothly between states using the custom Tailwind animations
- When the user switches away from Veyl Stage theme, the `cooldown` exit animation plays before hiding

