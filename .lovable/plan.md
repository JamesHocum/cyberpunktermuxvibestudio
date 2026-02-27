

# Fine-Tune Codex AI to Act as a True Copilot

## Problem
When users ask the Codex AI to "build this project as a PWA React with installer," it responds with explanations and instructions instead of directly generating and applying code to the project. It behaves like a tutorial rather than a copilot.

## Root Cause
1. **System prompt is too passive** -- it says "generate code" but doesn't instruct the AI to act autonomously or produce all necessary files in one response
2. **No auto-apply for build commands** -- even when code blocks are generated correctly, the user must manually click "Apply" on each one
3. **No detection of "build" intent** -- commands like "build this as a PWA" should trigger a more aggressive, file-producing mode
4. **AI defaults to explaining** rather than doing, especially for broad requests

## Solution

### 1. Enhance the system prompt in `codex-chat` edge function
- Add a "BUILD MODE" prompt variant triggered when the action is `generate` or the message contains build-intent keywords
- Instruct the AI to produce ALL required files with full content, no placeholders, no "run this command" instructions
- Emphasize: "You are a copilot. Create the files. Do not instruct the user to create them."

### 2. Add build-intent detection in `AIChatPanel.tsx`
- Detect phrases like "build this", "scaffold", "create a PWA", "set up", "initialize" and auto-set the action to `generate`
- Pass a `buildMode: true` flag to the edge function so the system prompt switches to full-build mode

### 3. Add auto-apply option for build responses
- When `buildMode` is active and the AI response contains 2+ code blocks, show an "Auto-Apply All" banner at the top of the response that automatically creates/updates all files
- Add a user setting (stored in localStorage) to toggle auto-apply behavior

### 4. Improve the `generate` system prompt to be project-aware
- Include the current file list in the prompt context so the AI knows what already exists
- Instruct it to only generate files that are missing or need changes
- For PWA builds specifically: generate `manifest.json`, service worker registration, and installable app shell

---

## Technical Details

### Files to modify

**`supabase/functions/codex-chat/index.ts`**
- Add `buildMode` to the request interface
- Add a new `BUILD MODE` system prompt section that says:
  - "You are an autonomous coding copilot. When asked to build something, produce ALL necessary files with complete code."
  - "Do NOT tell the user to run commands. Do NOT give instructions. Just produce the files."
  - "Each file must have its filename on the line before the code fence."
  - "Cover every file needed: config, components, styles, types, utils."
- When `buildMode` is true, append the project's existing file list to context

**`src/components/AIChatPanel.tsx`**
- Add `isBuildIntent()` function to detect build commands (keywords: "build", "scaffold", "create a", "set up", "initialize", "generate a", "make a")
- When build intent is detected, auto-set action to `generate` and pass `buildMode: true`
- After streaming completes in build mode, auto-trigger `handleApplyAll` equivalent -- iterate all parsed code blocks and call `onCreateFile` + `onUpdateFileContent` for each
- Show a toast: "Applied X files to your project"

**`src/components/MessageContent.tsx`**
- Add `autoApply` prop (boolean)
- When `autoApply` is true and code blocks are present, call `onApplyCode` for each block automatically on mount via `useEffect`
- Show applied-files badges immediately

### Edge cases handled
- If a file already exists, `onUpdateFileContent` overwrites it (existing behavior)
- Undo is still available per-file via the existing undo system
- Non-build messages continue to work exactly as before
- Users can still manually apply individual blocks if auto-apply is off

