

# Make Codex AI a True Build Copilot

## Problem
When a user asks "Build this project as a PWA React app with installer," the Codex AI responds with explanations, terminal commands, and instructions like "run `npm run build`" instead of directly generating files and offering a download. Since this is a web-based IDE, there is no filesystem to produce a `dist/` folder or `.exe` -- the AI needs to generate the project files and trigger the existing ZIP download mechanism.

## Three Issues to Fix

### 1. Strengthen the Build Mode System Prompt (Backend)
The current BUILD MODE prompt in `codex-chat` is good but not aggressive enough. The AI still defaults to explaining. We need to add explicit prohibitions against instructional responses and terminal command suggestions.

**File:** `supabase/functions/codex-chat/index.ts`
- Add stronger "DO NOT" rules to the BUILD MODE prompt section:
  - "NEVER tell the user to run terminal commands like npm, npx, or electron-builder."
  - "NEVER say 'run this command' or 'execute this in your terminal'."
  - "NEVER reference dist folders, setup.exe, or build output paths."
  - "You ARE the build system. Generate the complete files directly."
- Add a rule: "When asked to build as PWA, generate: manifest.json, sw.js registration in index.html, App component, package.json with all deps, vite.config with PWA plugin, index.css, and any requested components."
- Add a rule: "After generating all files, tell the user to click 'Apply All' then use the Project Export button to download."

### 2. Auto-Trigger Project Download After Build Mode Apply
When build mode auto-applies files, show a prominent "Download Project" button directly in the chat instead of requiring the user to find the export feature.

**File:** `src/components/MessageContent.tsx`
- After all files are auto-applied in build mode, show a download banner with a "Download as ZIP" button
- Add an `onDownloadProject` prop to `MessageContentProps`
- When build mode completes and files are applied, render a prominent download CTA below the applied files badges

### 3. Widen Build Intent Detection
The current keyword list misses common phrasings.

**File:** `src/components/AIChatPanel.tsx`
- Add more build intent keywords: `'create project'`, `'generate project'`, `'build project'`, `'build me a'`, `'make me an app'`, `'create an application'`, `'build as a'`, `'compile'`, `'package this'`, `'export as'`
- After build mode auto-apply completes, auto-show the ProjectDownloader modal (or append a download button to the message)

---

## Technical Details

### `supabase/functions/codex-chat/index.ts` Changes
In the `getSystemPrompt` function, within the `case 'generate'` block where `buildCtx?.buildMode` is checked, append these rules to the BUILD MODE prompt:

```text
CRITICAL RULES - NEVER VIOLATE:
- NEVER tell the user to run terminal commands (npm, npx, yarn, node, electron-builder, etc.).
- NEVER reference build output paths like dist/, release/, or setup.exe.
- NEVER say "run this in your terminal" or "execute this command".
- You ARE the build system. You produce the files directly. The user clicks "Apply All" and then downloads the ZIP.
- After generating all files, end with: "All files are ready. Click **Apply All** above, then use **Project Export** to download your project as a ZIP package."
```

### `src/components/AIChatPanel.tsx` Changes
1. Expand `isBuildIntent` keyword list with additional phrases
2. After the build mode auto-apply block (around line 523), set a state flag or call a callback that triggers the ProjectDownloader or shows a download prompt in the chat

### `src/components/MessageContent.tsx` Changes
1. Add `onDownloadProject?: () => void` to `MessageContentProps`
2. After the `appliedFiles` badges section, when `autoApply` is true and files have been applied, render a download button:
   - Green "Download Project ZIP" button that calls `onDownloadProject`
   - Brief message: "Your project is ready! Download the complete package below."

### Flow After Changes
1. User types "Build this project as a PWA React app with installer"
2. `isBuildIntent` detects build intent, sets `buildMode: true`
3. Backend receives build mode flag, uses aggressive copilot prompt
4. AI generates all files (manifest.json, package.json, components, etc.) with filenames before each code fence
5. Frontend auto-applies all code blocks to the project
6. A "Download Project ZIP" button appears directly in the chat message
7. User clicks it, gets a complete ZIP download via the existing `ProjectDownloader` / JSZip logic

