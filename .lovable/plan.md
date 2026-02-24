

# Per-Message Apply History with Undo

## Overview

Add real per-message, per-file undo capability: when a user applies AI-generated code, the previous file content is snapshot'd. Each applied file pill gets an "Undo" button that restores the original content.

## Changes

### 1. `src/components/AIChatPanel.tsx`

**Add state and types (near line 91):**
- `AppliedFileHistory` type: `{ filename: string; previousContent: string }`
- `ApplyHistory` type: `Record<string, AppliedFileHistory[]>` (keyed by message ID)
- `applyHistory` state using `useState<ApplyHistory>({})`

**Replace `handleApplyCode` (lines 515-526) with two factory functions:**

- `makeHandleApplyCode(messageId)` -- returns a per-message apply handler that:
  1. Normalizes the filename (strips leading `/`)
  2. Snapshots the current `fileContents[normalized]` before overwriting
  3. Calls `onCreateFile` + `onUpdateFileContent` + `onSelectFile` as before
  4. Stores the snapshot in `applyHistory[messageId]` (deduplicating by filename)

- `makeHandleUndoFile(messageId)` -- returns a per-message undo handler that:
  1. Looks up the snapshot from `applyHistory[messageId]`
  2. Calls `onUpdateFileContent` with the previous content
  3. Removes that entry from history

**Update message rendering (lines 703-707):**
- For each assistant message, create `handleApplyForMessage` and `handleUndoForMessage` using the factories
- Pass `onUndoFile={handleUndoForMessage}` as a new prop to `MessageContent`

### 2. `src/components/MessageContent.tsx`

**Extend props (lines 9-13):**
- Add `onUndoFile?: (filename: string) => void` to `MessageContentProps`
- Destructure it in the component signature

**Update applied files UI (lines 183-194):**
- Add an "Undo" button inside each applied file pill (only shown when `onUndoFile` is provided)
- On click: calls `onUndoFile(fn)`, removes the filename from `appliedFiles`, resets `allApplied` if last file
- Keep the existing "Clear" button as-is (cosmetic reset only, no file revert)

## Behavior Summary

| Action | Effect |
|--------|--------|
| Apply / Apply All | File updated, previous content snapshot'd, pill appears with checkmark |
| Undo on a pill | File content restored from snapshot, pill removed, deploy options hide if last |
| Clear | Wipes UI indicators only, does NOT revert files |

## Files Modified

| File | Nature of Change |
|------|-----------------|
| `src/components/AIChatPanel.tsx` | Add `applyHistory` state, `makeHandleApplyCode`, `makeHandleUndoFile` factories, pass `onUndoFile` to `MessageContent` |
| `src/components/MessageContent.tsx` | Add `onUndoFile` prop, per-pill Undo button in applied files section |

