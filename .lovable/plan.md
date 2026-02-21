

# Remaining Fixes: Navigation, Auto-Scroll, and Toolbar Polish

## What's Already Complete (Verified)
All 10 extensions are in the registry. The Persona tab exists in Settings with model selector, temperature, and system prompt. The Codex edge function accepts `model` and `systemPrompt` params and defaults to `gemini-3-flash-preview`. BuildInfoPanel supports GitHub Releases download links. Project thumbnails are on the dashboard cards. ProjectContext is created and shared.

## What Still Needs Fixing

### 1. Navigation Bug: Project Opens But Bounces Back (Critical)

**Root Cause:** In `StudioLayout.tsx` (lines 59-63), the redirect `useEffect` checks `!isLoading && !currentProject`. The problem is that `isLoading` in `useProject.ts` starts as `false` (line 62). When `Projects.tsx` calls `loadProject(id)` and then `navigate('/')`, the context state is shared, but there is a race:

- `loadProject` sets `isLoading = true` at the start
- React navigates to `/`, `StudioLayout` mounts
- On initial render, `isLoading` may be `true` (good) or the effect may catch a moment where loading finished but `currentProject` hasn't re-rendered yet

**The real issue** is more subtle: when creating a new project, `createProject` in `useProject.ts` sets `isLoading = true`, creates the project, sets `currentProject`, then sets `isLoading = false`. But `Projects.tsx` calls `navigate('/')` AFTER `createProject` returns. By that time `isLoading` is already `false` and `currentProject` is set -- this should work. 

Let me look more carefully. The `loadProject` function sets `isLoading(true)` at line 97, does async work, then sets `currentProject` at line 121 and `isLoading(false)` at line 141. In `Projects.tsx`, `handleOpen` awaits `loadProject` then calls `navigate('/')`. So by the time we navigate, `isLoading=false` and `currentProject` IS set. The useEffect should NOT redirect.

However, `useProject` has a `loadProjects` effect on mount (lines 394-396). When the context re-renders due to navigation, `loadProjects` does NOT reset `currentProject` -- it only updates the `projects` array. So that's not the issue either.

Wait -- the `useEffect` at lines 383-391 does auto-save, not navigation. The redirect logic at lines 59-63 of StudioLayout should see `currentProject` as set. Let me re-check if there's something else resetting it...

The `clearProject` function (line 350) sets `currentProject(null)`. If anything calls that during navigation, it would break. But nothing auto-calls it.

**Likely the actual problem:** The `useEffect` dependency array is `[isLoading, currentProject, navigate]`. When `StudioLayout` first mounts, `currentProject` is already set (via shared context) and `isLoading` is `false`. This means the effect runs and sees `!isLoading && !currentProject` -- but `currentProject` IS set. So it should NOT redirect.

Unless... the issue is that `loadProjects` at mount (line 394-396) triggers a re-render mid-cycle. But that only updates `projects`, not `currentProject`.

I suspect the bug may have been fixed by the ProjectContext change but the user hasn't tested it yet with the new code. However, to be safe, I'll add a guard that's more robust.

**Fix:** Change the redirect logic to only redirect after a brief delay or use a "has ever loaded" flag, and also ensure `isLoading` starts as `true` so the initial render doesn't trigger a premature redirect.

- In `useProject.ts`: Change `isLoading` initial state from `false` to `true`  
- In `useProject.ts`: Set `isLoading = false` at the end of the initial `loadProjects` call
- This ensures that on first render, `isLoading` is `true`, preventing the redirect until projects have been fetched

### 2. AI Chat Auto-Scroll Hijacking Fix

The user provided code to fix auto-scroll behavior. Currently `AIChatPanel.tsx` scrolls to bottom on every message update. The fix: only auto-scroll if the user is already near the bottom.

- In `AIChatPanel.tsx`: Add `autoScrollEnabled` state and a scroll listener on the chat container
- Only call `scrollToBottom` when `autoScrollEnabled` is `true`

### 3. Toolbar Scrollbar Styling

Add thin neon scrollbar styling for the desktop toolbar in `StudioHeader.tsx`.

- In `src/index.css`: Add `.scrollbar-thin` and `.scrollbar-thumb-neon` classes
- In `StudioHeader.tsx`: Replace `scrollbar-hide` with `scrollbar-thin scrollbar-thumb-neon` on the desktop toolbar div so the scrollbar is visible but styled

---

## Technical Details

### Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useProject.ts` | Change `isLoading` initial value to `true`, set `false` after `loadProjects` completes |
| `src/components/AIChatPanel.tsx` | Add auto-scroll guard: only scroll when user is at bottom |
| `src/components/StudioHeader.tsx` | Change `scrollbar-hide` to `scrollbar-thin scrollbar-thumb-neon` on toolbar |
| `src/index.css` | Add `.scrollbar-thin` and `.scrollbar-thumb-neon` CSS classes |

### Implementation Order

| Step | Task |
|------|------|
| 1 | Fix `useProject.ts` -- `isLoading` starts `true`, set `false` after initial load |
| 2 | Fix auto-scroll in `AIChatPanel.tsx` |
| 3 | Add scrollbar styling to `index.css` and update `StudioHeader.tsx` |
| 4 | Deploy updated edge function (already deployed from last session) |

