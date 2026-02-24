

# Upgrade MessageContent with Applied Files Tracking

## What Changes

Update `src/components/MessageContent.tsx` to add:

1. **Applied files tracking** -- Track which individual files have been applied using `appliedFiles` state array, with a `recordApplied` helper
2. **Applied files indicator** -- Show a list of applied filenames as styled pills/badges below the code blocks (e.g. "Applied files: checkmark filename.tsx")
3. **Re-apply support** -- Change "Apply All" button text to "Re-apply All" after first application, and keep it enabled for re-application
4. **Individual apply callback wiring** -- Route individual code block applies through `handleApplySingle` which both calls `onApplyCode` and records the filename

## Technical Details

### Changes to `src/components/MessageContent.tsx`

**State additions (inside `MessageContent`):**
- Add `appliedFiles` state (`string[]`) to track which files have been applied
- Add `recordApplied(filename)` helper that deduplicates

**Updated handlers:**
- `handleApplySingle(filename, code)` -- calls `onApplyCode`, records the file, sets `allApplied = true`
- `handleApplyAll()` -- applies all code blocks, records all filenames, sets `allApplied = true`, shows toast

**Updated JSX:**
- Pass `handleApplySingle` (not raw `onApplyCode`) to `CodeBlockWithApply`
- Change "Apply All" button to show "Re-apply All" after first use and remain enabled
- Add applied files indicator section showing checkmarked filename pills when `appliedFiles.length > 0`
- Keep deployment options appearing after any apply

### No other files need changes

This is a self-contained enhancement to `MessageContent.tsx` only. The props interface stays the same. `CodeBlockWithApply` already handles its own `applied` state for the per-block button -- the new `appliedFiles` state in the parent is for the summary indicator.

## Implementation Order

| Step | Task |
|------|------|
| 1 | Add `appliedFiles` state and `recordApplied` helper |
| 2 | Create `handleApplySingle` wrapper and update `handleApplyAll` |
| 3 | Wire `handleApplySingle` to `CodeBlockWithApply` |
| 4 | Add applied files indicator UI |
| 5 | Update Apply All button to support re-apply |

