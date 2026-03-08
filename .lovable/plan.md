

# Expand Chat Input & Remove 4000-Character Limit

## Problem
The chat input is a single-line `<Input>` element, and a hard 4000-character limit exists in three places:
1. `src/lib/inputValidation.ts` — Zod schema `.max(4000)`
2. `supabase/functions/lady-violet-chat/index.ts` line 74 — `msg.content.length > 4000`
3. `src/components/AIChatPanel.tsx` line 338 — calls `validateMessage()` which enforces the limit

The `codex-chat` edge function has NO such limit. Database column `chat_messages.content` is `text` (unbounded). So the only bottlenecks are the three spots above plus the single-line input.

## Changes

### 1. Replace `<Input>` with auto-expanding `<Textarea>` in AIChatPanel
**File: `src/components/AIChatPanel.tsx`**
- Replace the `<Input>` on line 931 with a `<Textarea>` that:
  - Has `min-height: 44px`, `max-height: 200px`, auto-grows with content, scrolls internally beyond max
  - Handles Enter to send, Shift+Enter for newline
  - Preserves line breaks and formatting
- Add a live character counter below the input showing `{length} chars`
- Show warning badges at 20,000+ ("large prompt") and 40,000+ ("very large prompt") — purely informational, never blocking

### 2. Raise validation limit to 100,000 characters
**File: `src/lib/inputValidation.ts`**
- Change `.max(4000, ...)` to `.max(100000, "Message too long (max 100,000 characters)")`
- This is a soft safety ceiling, not a UX blocker for normal use

### 3. Remove backend 4000-char limit in lady-violet-chat
**File: `supabase/functions/lady-violet-chat/index.ts`**
- Change `msg.content.length > 4000` to `msg.content.length > 100000` with matching error message
- This function is the legacy chat endpoint; codex-chat already has no limit

### 4. Terminal validation passthrough
**File: `src/components/Terminal.tsx`**
- The terminal also calls `validateMessage()` — it will automatically benefit from the raised limit in step 2. No additional changes needed.

### 5. No chunking needed now
The AI gateway accepts large payloads. The model context windows (GPT-5.2, Gemini) handle 100K+ tokens. No auto-chunking is needed at this stage — the limit raise is sufficient.

## Files Summary

| Action | File | What |
|--------|------|------|
| Modify | `src/lib/inputValidation.ts` | Raise max from 4000 → 100000 |
| Modify | `src/components/AIChatPanel.tsx` | Replace Input with auto-expanding Textarea, add char counter + warnings |
| Modify | `supabase/functions/lady-violet-chat/index.ts` | Raise backend limit from 4000 → 100000 |

