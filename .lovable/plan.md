
# Fullstack-by-Default AI, Deployment Buttons, and Scroll Drift Fix

## Overview

This plan addresses four interconnected improvements:
1. Fix the persistent scroll drift where the IDE header scrolls off-screen
2. Add deployment integration buttons (Vercel, Netlify) after code is applied
3. Make the AI "fullstack by default" -- it should auto-wire backend code without asking
4. Enhance the system prompt with stack profile awareness

---

## 1. Scroll Drift Fix (Critical)

**Current Problem:** The header at `StudioHeader.tsx` uses `sticky top-0`, but when the AI chat panel's content grows, the entire IDE layout scrolls despite `overflow-hidden` on the root. The `sticky` positioning only works within a scrolling container -- and when the parent overflows, the header moves with it.

**Root Cause:** The `StudioLayout` root div has `overflow-hidden`, but the inner flex column (`flex-1 flex flex-col min-w-0 overflow-hidden`) can still be pushed by growing content inside the `ResizablePanelGroup`. The `AIChatPanel` has `min-h-0 overflow-hidden` (added previously), but the `ScrollArea` inside the `TabsContent` at line 655 doesn't have a bounded height -- it uses `flex-1` which depends on proper flex containment all the way up.

**Fix:**
- Change `StudioHeader` from `sticky top-0` to `flex-shrink-0` (it's already inside a flex column with overflow-hidden, so sticky is unnecessary and causes issues)
- Add `overflow-hidden` to the `TabsContent` for chat (line 653) to ensure the `ScrollArea` viewport is properly bounded
- Add explicit `h-0 flex-grow` to the `ScrollArea` so it fills available space without expanding beyond it

### Files to Modify
- `src/components/StudioHeader.tsx` (line 130): Replace `sticky top-0` with `flex-shrink-0`
- `src/components/AIChatPanel.tsx` (line 653): Add `overflow-hidden` to chat TabsContent; change ScrollArea to use bounded height

---

## 2. Deployment Buttons After Code Application

**What:** When the AI generates code and the user clicks "Apply" or "Apply All", show deployment option buttons (Vercel, Netlify, Download ZIP) below the code blocks.

**Implementation:**
- Add a `DeploymentOptions` component in `MessageContent.tsx` that renders after all code blocks are applied
- Buttons: "Deploy to Vercel", "Deploy to Netlify", "Download as ZIP"
- Vercel/Netlify buttons link to their import-from-GitHub flows (requires GitHub connection) or show a toast explaining the prerequisite
- Download ZIP reuses the existing `ProjectDownloader` logic

### Files to Modify
- `src/components/MessageContent.tsx`: Add `DeploymentOptions` component that appears when code blocks have been applied; add `onDeploy` callback prop
- `src/components/AIChatPanel.tsx`: Pass deployment handler down to `MessageContent`
- `src/components/StudioLayout.tsx`: Wire deployment actions (open downloader, trigger Vercel/Netlify flow)

---

## 3. Fullstack-by-Default System Prompt

**What:** The AI should never ask "would you like a backend?" -- it should assume fullstack and auto-generate backend code (database schemas, API routes, auth wiring, middleware) when the feature requires it.

**Implementation:**
- Create a `stackProfile` configuration that's stored per-project in localStorage and injected into the system prompt
- Default stack profile: `{ backend: 'supabase', auth: 'supabase_auth', autoWireBackend: true, autoWireMiddleware: true }`
- Update the `codex-chat` edge function's system prompt to include stack context
- Update the `SettingsPanel` Persona tab to include a "Stack Profile" selector (Supabase fullstack, SQLite, Frontend-only)
- The system prompt will instruct the AI: "When features require persistence, auth, or APIs, generate the backend code. Do NOT ask if a backend should be used."

### Files to Modify
- `src/components/SettingsPanel.tsx`: Add stack profile selector (Supabase Fullstack / SQLite / Frontend Only) saved to localStorage alongside persona settings
- `src/components/AIChatPanel.tsx`: Load stack profile from settings and include it in the API request body
- `supabase/functions/codex-chat/index.ts`: Accept `stackProfile` param and inject fullstack directives into system prompt

### Stack Profile Shape
```text
{
  backend: 'supabase' | 'sqlite' | 'none',
  autoWireBackend: true | false,
  autoWireMiddleware: true | false,
  auth: 'supabase_auth' | 'jwt' | 'none'
}
```

---

## 4. Enhanced System Prompt for Agentic Code Generation

**What:** Update the default system prompt so the AI always wraps generated code in fenced blocks with explicit filenames, making the "Apply to Project" buttons work correctly.

**Implementation:**
- In the `codex-chat` edge function, append instructions to the system prompt telling the AI to always use filename-tagged code fences
- Format: A line with the filename in backticks before each code fence, e.g.:
  ```
  `src/components/Login.tsx`
  ```tsx
  // code here
  ```
  ```
- This ensures `parseCodeBlocks.ts` correctly extracts filenames for the Apply buttons

### Files to Modify
- `supabase/functions/codex-chat/index.ts`: Add code formatting instructions to system prompt

---

## Technical Details

### Files to Modify Summary

| File | Changes |
|------|---------|
| `src/components/StudioHeader.tsx` | Change `sticky top-0` to `flex-shrink-0` on the header element |
| `src/components/AIChatPanel.tsx` | Fix scroll containment on chat TabsContent and ScrollArea; pass stack profile to API; pass deploy handler to MessageContent |
| `src/components/MessageContent.tsx` | Add DeploymentOptions component with Vercel/Netlify/ZIP buttons shown after code is applied |
| `src/components/SettingsPanel.tsx` | Add Stack Profile selector (Supabase/SQLite/None) to Persona tab |
| `src/components/StudioLayout.tsx` | Wire deployment actions to AIChatPanel |
| `supabase/functions/codex-chat/index.ts` | Accept stackProfile param; inject fullstack directives and code-formatting rules into system prompt |

### Implementation Order

| Step | Task |
|------|------|
| 1 | Fix scroll drift: change header to `flex-shrink-0`, fix ScrollArea containment |
| 2 | Update system prompt in codex-chat edge function with fullstack directives and filename formatting rules |
| 3 | Add stack profile selector to SettingsPanel |
| 4 | Wire stack profile from AIChatPanel to codex-chat API |
| 5 | Add DeploymentOptions component to MessageContent |
| 6 | Wire deployment actions through StudioLayout |
| 7 | Deploy updated edge function |
