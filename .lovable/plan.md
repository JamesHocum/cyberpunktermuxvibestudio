

# Project Creation Wizard with Stack Profile + Manifest Update

## Overview

Two changes:
1. **Project Creation Wizard** -- Replace the simple name/description form on `/projects` with a multi-step wizard that includes stack profile selection (Supabase Fullstack / SQLite / Frontend Only). The selected stack is saved to `localStorage` keyed by project ID, so each project remembers its stack.
2. **Manifest update** -- Add `id` field and version the `start_url` to force PWA cache refresh.

---

## 1. Project Creation Wizard

### Current State
The `/projects` page has a simple inline card form with two text inputs (name, description) and a Create button. Stack profile is only configurable after project creation via Settings > Stack tab, which is a global setting (not per-project).

### Changes to `src/pages/Projects.tsx`

Replace the inline create form with a 2-step wizard:

**Step 1: Name and Description**
- Project name (required)
- Description (optional)
- "Next" button to proceed

**Step 2: Stack Profile Selection**
- Three visual cards to pick from:
  - **Supabase Fullstack** -- Full backend with database, auth, edge functions, and middleware. Default choice, highlighted.
  - **SQLite (Self-hosted)** -- Lightweight local database with JWT auth. Good for offline-first apps.
  - **Frontend Only** -- No backend. Static site or client-side only app.
- Auto-wire Backend and Auto-wire Middleware toggles (pre-checked for Supabase/SQLite, unchecked for Frontend Only)
- "Create Project" button

**On create:**
- Call `createProject(name, description)` as before
- Save the selected stack profile to `localStorage` with key `codex-stack-profile-{projectId}` so it's per-project
- Also save to the global `codex-stack-profile` key for backward compatibility
- Navigate to IDE

### Changes to `src/components/SettingsPanel.tsx`

- Update the Stack tab to load/save per-project stack profile when a project ID is available
- Export a helper `loadStackProfile(projectId?)` that checks per-project key first, then falls back to global key

### Changes to `src/components/AIChatPanel.tsx`

- Use the per-project stack profile loader instead of the global one, passing `currentProjectId`

---

## 2. Manifest Update

### Changes to `public/manifest.json`

- Add `"id": "/cyberpunk-termux-v2"` field
- Change `"start_url"` to `"/?v=2"` to bust PWA cache

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Projects.tsx` | Replace inline form with 2-step wizard including stack profile card selector |
| `src/components/SettingsPanel.tsx` | Export `loadStackProfile(projectId?)` helper; update Stack tab to use per-project key |
| `src/components/AIChatPanel.tsx` | Use per-project `loadStackProfile` with `currentProjectId` |
| `public/manifest.json` | Add `id` field, update `start_url` to `/?v=2` |

## Implementation Details

### Wizard UI (Projects.tsx)

```text
+---------------------------------------------+
| Create New Project                          |
|                                             |
| Step 1 of 2: Project Info                   |
| [Project name___________]                   |
| [Description (optional)_]                   |
|                          [Cancel] [Next ->] |
+---------------------------------------------+

+---------------------------------------------+
| Create New Project                          |
|                                             |
| Step 2 of 2: Choose Your Stack              |
|                                             |
| [Supabase Fullstack]  [SQLite]  [Frontend]  |
|  * DB + Auth + Edge    * Local    * No       |
|  * Auto-wire all       * JWT      * backend  |
|  (RECOMMENDED)         * Offline             |
|                                             |
| [x] Auto-wire Backend                       |
| [x] Auto-wire Middleware                    |
|                                             |
|                   [<- Back] [Create Project] |
+---------------------------------------------+
```

### Stack Profile Storage

Per-project key: `codex-stack-profile-{projectId}`
Global fallback: `codex-stack-profile`

The `loadStackProfile` helper:
```text
function loadStackProfile(projectId?: string): StackProfile
  1. If projectId, check localStorage for `codex-stack-profile-{projectId}`
  2. Fall back to `codex-stack-profile` (global)
  3. Fall back to DEFAULT_STACK
```

### Implementation Order

| Step | Task |
|------|------|
| 1 | Add `loadStackProfile` helper to SettingsPanel.tsx |
| 2 | Build the 2-step wizard in Projects.tsx with stack card selector |
| 3 | Update AIChatPanel to use per-project stack loading |
| 4 | Update manifest.json with id and start_url |

