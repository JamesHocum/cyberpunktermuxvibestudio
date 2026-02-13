

# Final Polish: Fix Navigation, Thumbnails, Extensions, Codex AI, and Persona Editor

## 1. Fix Project Navigation Bug (Critical)

**Root Cause:** `Projects.tsx` and `StudioLayout.tsx` each create their own `useProject()` hook instance. When Projects loads a project and navigates to `/`, StudioLayout mounts with a fresh hook where `currentProject` is `null`, triggering an immediate redirect back to `/projects`.

**Fix:** Create a shared React context (`ProjectContext`) so both pages share the same project state.

- Create `src/contexts/ProjectContext.tsx` wrapping `useProject()` in a context provider
- Wrap the app routes with `<ProjectProvider>` in `App.tsx`
- Replace `useProject()` calls in `Projects.tsx` and `StudioLayout.tsx` with `useProjectContext()`

This single change fixes both "clicking a project doesn't leave the screen" and "creating a new project fails."

---

## 2. Project Thumbnails on Dashboard Cards

Add a generated gradient thumbnail at the top of each project card based on the project name. Each project gets a unique color combination derived from a simple hash of its name.

- Update `src/pages/Projects.tsx` to render a gradient banner with a code icon overlay at the top of each card

---

## 3. More Extensions

Expand `public/extensions.json` from 3 to 10 extensions:

| New Extension | Description |
|---|---|
| Syntax Highlighter Pro | Enhanced syntax highlighting with 20+ themes |
| File Diff Viewer | Compare file versions side by side |
| Snippet Manager | Save and reuse code snippets across projects |
| Project Notes | Markdown notes attached to projects |
| Color Picker | Inline color picker for CSS values |
| Terminal Themes | Custom terminal color schemes and fonts |
| Auto Formatter | Code formatting on save with Prettier rules |

---

## 4. Codex AI Model Upgrade

Update `supabase/functions/codex-chat/index.ts`:
- Default model: `google/gemini-3-flash-preview` (latest available)
- Accept optional `model` parameter from the client to allow switching
- Support `openai/gpt-5.2` (the latest available OpenAI model -- GPT 5.3 does not exist yet, GPT 5.2 is the newest)

Update `src/components/AIChatPanel.tsx` to pass a `model` parameter from settings.

---

## 5. Editable Persona Layer

Add a "Persona" tab to `src/components/SettingsPanel.tsx`:
- Edit persona name, system prompt, temperature, and model selection
- Stored in `localStorage` so it persists across sessions
- Passed to the Codex edge function on each request

This gives users full control over Lady Violet's behavior. Direct ChatGPT account integration is not technically possible through the AI gateway, but users get equivalent customization through the persona editor.

---

## 6. Electron Build: GitHub Releases Link

Update `src/components/BuildInfoPanel.tsx` to accept an optional `githubUrl` prop and display a "Download from GitHub Releases" button that opens `{githubUrl}/releases` in a new tab when available.

---

## Technical Summary

### Files to Create
| File | Purpose |
|---|---|
| `src/contexts/ProjectContext.tsx` | Shared project state context provider |

### Files to Modify
| File | Changes |
|---|---|
| `src/App.tsx` | Wrap routes with `<ProjectProvider>` |
| `src/pages/Projects.tsx` | Use shared context, add gradient thumbnails |
| `src/components/StudioLayout.tsx` | Use shared context instead of local `useProject()` |
| `public/extensions.json` | Add 7 more extensions |
| `supabase/functions/codex-chat/index.ts` | Update default model to `gemini-3-flash-preview`, accept model param |
| `src/components/SettingsPanel.tsx` | Add Persona editor tab with localStorage persistence |
| `src/components/AIChatPanel.tsx` | Pass model and persona config to edge function |
| `src/components/BuildInfoPanel.tsx` | Add GitHub Releases download link |
| `pantheon.config.ts` | Update default model to `gemini-3-flash-preview` |

### Implementation Order
| Step | Task |
|---|---|
| 1 | Create `ProjectContext` and wrap App |
| 2 | Update `Projects.tsx` and `StudioLayout.tsx` to use shared context |
| 3 | Add gradient thumbnails to project cards |
| 4 | Add 7 new extensions to registry |
| 5 | Update Codex model to `gemini-3-flash-preview` with model selection |
| 6 | Add persona editor to Settings panel |
| 7 | Wire persona/model into AIChatPanel and edge function |
| 8 | Add GitHub Releases link to BuildInfoPanel |
| 9 | Deploy updated edge function |

