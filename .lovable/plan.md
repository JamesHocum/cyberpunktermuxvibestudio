

# Comprehensive IDE Fixes: Remove Veyl, Fix Chat Isolation, Add Publish/Download Features

## Overview

This plan addresses 7 distinct issues reported. Changes span removing the Veyl Stage theme, fixing chat conversation isolation per project, improving the Projects page load state, adding publish/download capabilities, and fixing the preview pane.

---

## 1. Remove Veyl Stage Theme Entirely

**Files to modify:**
- **Delete** `src/components/VeylStage.tsx`
- **`src/components/MonacoEditor.tsx`**: Remove the VeylStage import (line 24), remove the portal block (lines 421-431), remove `veyl-stage` from the theme dropdown (lines 410-415), remove `isBuilding`/`buildError`/`lastSaveTick` props if only used for Veyl
- **`src/lib/monacoThemes.ts`**: Remove `'veyl-stage'` from the `MonacoTheme` type union and delete the `veyl-stage` theme definition object

---

## 2. Fix TTS Speaker Button

The `speakDirect` method was already wired in the last diff. The remaining issue is that the ElevenLabs edge function requires a valid `ELEVENLABS_API_KEY` secret. We will verify the secret exists and add error feedback so the user knows if TTS fails due to a missing key.

**File to modify:**
- **`src/hooks/useVoicePlayback.ts`**: Add a toast notification on TTS failure so silent failures become visible (e.g., "TTS failed: check API key in Integrations")

---

## 3. Fix Cross-Project Chat Conversations

**Root cause:** In `AIChatPanel.tsx` line 211, the query is `.eq('project_id', currentProjectId || null)`. When `currentProjectId` is `undefined`, this queries for `project_id = null`, returning orphaned messages from previous sessions.

**Fix in `src/components/AIChatPanel.tsx`:**
- In `loadChatHistory`: If `currentProjectId` is undefined/null, skip loading history entirely (start fresh with just the welcome message)
- In `saveMessage`: If `currentProjectId` is undefined, save with `project_id: null` but don't load them back on next mount
- In `clearHistory`: Same guard -- only clear for the current project
- Reset messages to `[WELCOME_MESSAGE]` when `currentProjectId` changes (add effect)

---

## 4. Fix Projects Page "Create First Project" Flash

**Root cause:** The `projects` array starts empty while `isLoading` is `true`. The code at line 295 checks `!isLoading` before rendering the grid, which should prevent the flash. However, `loadProjects` runs on mount via `useEffect` in the hook, and there may be a render cycle where `isLoading` becomes `false` before `projects` is populated.

**Fix in `src/pages/Projects.tsx`:**
- Move the empty state check to also verify that loading has completed AND projects is empty: show "Create Your First Project" only when `!isLoading && projects.length === 0`
- This is already the current logic, so the real fix is in `useProject.ts`: ensure `setProjects` is called BEFORE `setIsLoading(false)` (it already is -- the issue may be the initial render). Add a `hasLoaded` flag to distinguish "never loaded" from "loaded but empty".

---

## 5. Add Completed Projects / Download Tab

**New feature:** Add a "Publish" button to the IDE header toolbar that opens a deployment dialog with options:
- Deploy as PWA (generates manifest + service worker files, then triggers ZIP download)
- Deploy as Web App (opens Vercel/Netlify links)  
- Download as ZIP (existing ProjectDownloader)
- Download as Windows Installer Package (generates Electron config + triggers ZIP with build instructions)

**Files to modify:**
- **`src/components/StudioHeader.tsx`**: Add a "Publish" button that opens the deploy dialog
- **`src/components/StudioLayout.tsx`**: Wire the publish action to show ProjectDownloader or a new PublishDialog
- **New file `src/components/PublishDialog.tsx`**: A dialog with deployment target options (PWA, Web, ZIP, Windows EXE package). For Windows EXE, it bundles the Electron config files (`electron/main.cjs`, `electron-builder.config.js`) into the ZIP so the user can run `npm run package:win` locally.

---

## 6. Fix Preview Pane Not Displaying Current Project

**Root cause:** `LivePreview` receives only the content of the single active file (`fileContents[activeFile]`). For React/TSX files, it tries Sandpack mode but only passes the single file, not the whole project.

**Fix in `src/components/StudioLayout.tsx`:**
- Pass the full `fileContents` map to `LivePreview` as a new prop so Sandpack can resolve imports across files
- **`src/components/LivePreview.tsx`**: Update the Sandpack configuration to include all project files (not just the active one), mapping the `fileContents` record to Sandpack's file format. This allows multi-file React projects to render correctly.

---

## Technical Details

### MonacoEditor.tsx changes (Veyl removal)
- Remove line 24: `import { VeylStage } from "@/components/VeylStage";`
- Remove lines 421-431: The portal block
- Remove "Veyl Stage" dropdown item (lines 410-415)
- Keep `isBuilding`, `buildError`, `lastSaveTick` props as they may be used elsewhere

### monacoThemes.ts changes
- Change type from `'matrix' | 'cyber' | 'vaporwave' | 'veyl-stage'` to `'matrix' | 'cyber' | 'vaporwave'`
- Delete the `veyl-stage` theme data object

### AIChatPanel.tsx chat isolation fix
```text
// In loadChatHistory:
if (!currentProjectId) {
  setMessages([WELCOME_MESSAGE]);
  return; // Don't load orphaned messages
}

// Add effect to reset on project change:
useEffect(() => {
  setMessages([WELCOME_MESSAGE]);
  setApplyHistory({});
}, [currentProjectId]);
```

### PublishDialog.tsx (new component)
- Modal with 4 deployment cards: PWA, Web Deploy, ZIP Download, Windows Package
- PWA option: auto-generates manifest.json + sw.js into project files, then triggers ZIP
- Web Deploy: links to Vercel/Netlify with instructions
- ZIP: triggers existing ProjectDownloader
- Windows Package: bundles project + Electron config into ZIP with README for local build

### LivePreview.tsx multi-file support
- Accept `allFileContents?: Record<string, string>` prop
- In Sandpack mode, convert `allFileContents` to Sandpack file format
- This enables cross-file imports to resolve in the preview

---

## Files Summary

| Action | File |
|--------|------|
| Delete | `src/components/VeylStage.tsx` |
| Modify | `src/components/MonacoEditor.tsx` |
| Modify | `src/lib/monacoThemes.ts` |
| Modify | `src/hooks/useVoicePlayback.ts` |
| Modify | `src/components/AIChatPanel.tsx` |
| Modify | `src/pages/Projects.tsx` (or `src/hooks/useProject.ts`) |
| Create | `src/components/PublishDialog.tsx` |
| Modify | `src/components/StudioHeader.tsx` |
| Modify | `src/components/StudioLayout.tsx` |
| Modify | `src/components/LivePreview.tsx` |

