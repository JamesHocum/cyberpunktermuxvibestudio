

# Fix Scroll Drift, Agentic Code Application, and Live Preview

## Issues Identified

### 1. Scroll Drift (Header Moves Off Screen)
The screenshot shows the header has scrolled off the top. The root layout in `StudioLayout.tsx` uses `h-screen overflow-hidden`, which should prevent this. However, the `AIChatPanel` uses a `ScrollArea` that can grow unbounded. The issue is that the chat content pushes the outer layout, causing the entire page to scroll despite `overflow-hidden` on the root.

**Root cause:** The `AIChatPanel` outer div has `h-full` but no `overflow-hidden`, and the `ScrollArea` can expand beyond its container. When the Radix ScrollArea viewport grows, it can push the parent flex container, causing the header to shift.

**Fix:** Add `overflow-hidden` and `min-h-0` to the `AIChatPanel` outer container, and ensure the chat `TabsContent` uses proper flex containment so the `ScrollArea` stays within bounds.

### 2. AI Should Apply Code to Files (Agentic Behavior)
Currently the Codex AI just streams text responses with code blocks. It does NOT:
- Parse code blocks from its response and apply them to project files
- Offer deployment options (Vercel, Netlify, etc.)

**Fix:** After the AI response finishes streaming, parse any fenced code blocks with filenames (e.g., `` ```jsx ``, `` ```json ``), and when code blocks are detected:
- Add an "Apply to Project" button on each code block that creates/updates the file in the project
- Add an "Apply All" button that applies all code blocks at once
- This makes the AI agentic -- it generates code AND the user can one-click apply it

### 3. Live Preview Should Render Current File
The Live Preview currently shows the content of `activeFile` only. When the AI generates code and the user applies it, the preview should auto-update.

**Fix:** This is already wired -- `LivePreview` receives `fileContents[activeFile]`. Once code application works (issue 2), the preview will update automatically when the user applies generated code and switches to that file.

---

## Technical Plan

### File: `src/components/AIChatPanel.tsx`

**A. Fix scroll containment:**
- Add `overflow-hidden min-h-0` to the outer chat container div (line 514)
- Ensure TabsContent for chat has `overflow-hidden` so ScrollArea stays bounded

**B. Add code block detection and "Apply" buttons:**
- Create a `parseCodeBlocks(content: string)` utility that extracts fenced code blocks with optional filenames
- Replace the plain `<pre>` message renderer with a new `MessageContent` component that:
  - Renders normal text as before
  - Renders code blocks with syntax highlighting AND an "Apply to File" button
  - The "Apply" button calls `createFile` + `updateFileContent` from the project context
- Add `onCodeApply` callback prop to `AIChatPanel` that creates/updates files

### File: `src/components/StudioLayout.tsx`

- Pass `createFile` and `updateFileContent` callbacks to `AIChatPanel` so it can apply code to the project
- Auto-open Live Preview when code is applied

### File: `src/components/LivePreview.tsx`

- No changes needed -- it already reacts to `fileContents` changes

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/AIChatPanel.tsx` | Fix scroll containment; add code block parser; add "Apply to Project" buttons on AI-generated code blocks; accept file manipulation callbacks |
| `src/components/StudioLayout.tsx` | Pass `createFile`, `updateFileContent`, and `handleFileSelect` to AIChatPanel |

## Implementation Order

| Step | Task |
|------|------|
| 1 | Fix scroll containment in AIChatPanel (overflow-hidden + min-h-0) |
| 2 | Create `parseCodeBlocks` utility to extract filename + code from fenced blocks |
| 3 | Build `CodeBlockWithApply` component that renders code + "Apply to File" button |
| 4 | Replace plain `<pre>` rendering with the new component |
| 5 | Update StudioLayout to pass file manipulation callbacks to AIChatPanel |
| 6 | Test: send a "build me a PWA" message, verify code blocks have Apply buttons, click Apply, verify file appears in sidebar and Live Preview |

