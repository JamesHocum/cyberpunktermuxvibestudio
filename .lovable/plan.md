

# Final Polish: Fix Navigation, Extensions, Codex AI, Persona, and Build Downloads

## Status of Previous Plan

| Item | Status |
|------|--------|
| Projects dashboard page | Done |
| Header sticky fix + body overflow hidden | Done |
| BuildInfoPanel download button (`onDownload` prop) | Done |
| **ProjectContext (navigation fix)** | **NOT done -- critical bug** |
| **Project thumbnails** | **NOT done** |
| **Extensions (7 new)** | **NOT done** |
| **Codex AI model upgrade** | **NOT done** |
| **Persona editor** | **NOT done** |
| **GitHub Releases link in BuildInfoPanel** | **NOT done** |

---

## What We'll Implement

### 1. Fix Project Navigation (Critical Bug)

**The Problem:** `Projects.tsx` and `StudioLayout.tsx` each create their own `useProject()` hook. When you click a project on the dashboard and navigate to `/`, StudioLayout mounts with a fresh hook where `currentProject` is `null`, and immediately redirects you back to `/projects`.

**The Fix:** Create a shared React context so both pages use the same project state.

- **Create** `src/contexts/ProjectContext.tsx` -- wraps the `useProject` hook in a React context provider
- **Modify** `src/App.tsx` -- wrap all routes with `<ProjectProvider>`
- **Modify** `src/pages/Projects.tsx` -- replace `useProject()` with `useProjectContext()`
- **Modify** `src/components/StudioLayout.tsx` -- replace `useProject()` with `useProjectContext()`

### 2. Project Thumbnails on Dashboard Cards

Add a generated gradient thumbnail at the top of each project card. Each project gets a unique color derived from its name.

- **Modify** `src/pages/Projects.tsx` -- add gradient banner with code icon overlay

### 3. Electron Build: GitHub Releases Download Link

Add a "Download from GitHub Releases" button to the build panel so users can grab packaged builds (installer `.exe` or portable `.exe`).

- **Modify** `src/components/BuildInfoPanel.tsx` -- accept optional `githubUrl` prop, render a "Download from GitHub Releases" link pointing to `{githubUrl}/releases`, and show the available output files (Windows installer, portable, macOS DMG, Linux AppImage)

### 4. Expand Extensions Registry

Add 7 new extensions to `public/extensions.json`:

| Extension | Description |
|-----------|-------------|
| Syntax Highlighter Pro | Enhanced syntax highlighting with 20+ themes |
| File Diff Viewer | Side-by-side file comparison |
| Snippet Manager | Save and reuse code snippets |
| Project Notes | Markdown notes per project |
| Color Picker | Inline CSS color picker |
| Terminal Themes | Custom terminal color schemes |
| Auto Formatter | Code formatting on save |

### 5. Codex AI Model Upgrade

Update `supabase/functions/codex-chat/index.ts`:
- Default model changes from `google/gemini-2.5-flash` to `google/gemini-3-flash-preview`
- Accept an optional `model` parameter from the client request body
- Support switching to `openai/gpt-5.2` (the latest available OpenAI model)

Update `pantheon.config.ts` default model to `google/gemini-3-flash-preview`.

**Note:** GPT 5.3 does not exist yet in the AI gateway. The newest available OpenAI model is `openai/gpt-5.2`, which will be fully supported.

### 6. Editable Persona Layer

Add a "Persona" tab to the Settings panel where you can customize:
- Persona name
- System prompt
- Temperature slider
- Model selector (dropdown with all available models)

Settings are saved in localStorage and sent to the Codex edge function on every request.

- **Modify** `src/components/SettingsPanel.tsx` -- add a 5th "Persona" tab with editing fields
- **Modify** `src/components/AIChatPanel.tsx` -- read persona settings from localStorage and pass `model` and `systemPrompt` to the edge function
- **Modify** `supabase/functions/codex-chat/index.ts` -- accept optional `model` and `systemPrompt` params, use them if provided

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/contexts/ProjectContext.tsx` | Shared project state context provider |

## Files to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Wrap routes with `<ProjectProvider>` |
| `src/pages/Projects.tsx` | Use shared context + add gradient thumbnails |
| `src/components/StudioLayout.tsx` | Use shared context instead of local `useProject()` |
| `public/extensions.json` | Add 7 new extensions (total 10) |
| `supabase/functions/codex-chat/index.ts` | Default model to `gemini-3-flash-preview`, accept `model` and `systemPrompt` params |
| `src/components/SettingsPanel.tsx` | Add Persona editor tab |
| `src/components/AIChatPanel.tsx` | Pass model/persona config to edge function |
| `src/components/BuildInfoPanel.tsx` | Add GitHub Releases download link |
| `pantheon.config.ts` | Update default model |

## Implementation Order

| Step | Task |
|------|------|
| 1 | Create `ProjectContext` and wrap App |
| 2 | Update `Projects.tsx` and `StudioLayout.tsx` to use shared context |
| 3 | Add gradient thumbnails to project cards |
| 4 | Add GitHub Releases link to BuildInfoPanel |
| 5 | Expand extensions registry |
| 6 | Upgrade Codex model + accept model/systemPrompt params |
| 7 | Add persona editor to Settings |
| 8 | Wire persona/model into AIChatPanel |
| 9 | Deploy updated edge function |

