
# Add "Clear Applied" Button to MessageContent

## What Changes

Add a `handleClearApplied` handler and a "Clear" button to the applied files indicator section in `src/components/MessageContent.tsx`.

## Details

### File: `src/components/MessageContent.tsx`

**1. Add clear handler** (after `handleApplyAll`, around line 150):

```typescript
const handleClearApplied = () => {
  setAppliedFiles([]);
  setAllApplied(false);
};
```

**2. Add Clear button to applied files section** (lines 178-186):

Add a `<Button>` at the end of the applied files row with `ml-auto` positioning, calling `handleClearApplied`. This resets both `appliedFiles` and `allApplied`, which also hides the `DeploymentOptions`.

The updated section will show the existing file badges plus a small "Clear" button right-aligned at the end of the row.
