

# Fix: Disappearing Header Buttons + File Retrieval After Electron Build

## Problem 1: Header Buttons Disappearing During Chat/Scrolling

**Root Cause:** In `StudioLayout.tsx` (line 47), the body overflow is set to `auto`:
```
document.body.style.overflow = 'auto';
```

This allows the entire page body to scroll, which means as content grows (chat messages, terminal output), the whole page scrolls up -- pushing the header toolbar off-screen with no way to get it back.

**Fix:**
- Change `document.body.style.overflow = 'auto'` to `'hidden'` so the body never scrolls
- Add `sticky top-0 z-50` to the header element in `StudioHeader.tsx` as a safety net
- This ensures the header always remains pinned at the top regardless of content growth

### Files to Modify
- `src/components/StudioLayout.tsx` -- Change body overflow from `auto` to `hidden`
- `src/components/StudioHeader.tsx` -- Add `sticky top-0 z-50` and a solid background color to the header element

---

## Problem 2: Retrieving Files After Electron Build

The IDE already has a **Download** button in the header toolbar and a `ProjectDownloader` component. The enhancement is to add a "Download Project Files" section directly into the `BuildInfoPanel` so users can grab their project files from the same place they see build instructions.

**Approach:**
- Add a "Download Project" button inside `BuildInfoPanel.tsx` that triggers the existing project downloader
- Accept `onDownload` callback prop from the parent to trigger the download modal
- Add the download trigger in `MatrixToolsPanel.tsx` when opening the Electron Builder modal

### Files to Modify
- `src/components/BuildInfoPanel.tsx` -- Add a "Download Project Files" section with a button
- `src/components/MatrixToolsPanel.tsx` -- Pass download handler to BuildInfoPanel

---

## Technical Details

### StudioLayout.tsx Change
Line 47: `document.body.style.overflow = 'auto'` changes to `document.body.style.overflow = 'hidden'`

### StudioHeader.tsx Change
Line 127: Add `sticky top-0 z-50` and replace `bg-transparent` with a solid dark background so the header doesn't show content bleeding through:
```
<header className="sticky top-0 z-50 flex items-center justify-between bg-[#111]/95 py-2 md:py-4 px-3 md:px-6 border-b border-purple-600/20 backdrop-blur-md shadow-[0_0_30px_rgba(179,0,255,0.25)]">
```

### BuildInfoPanel.tsx Change
Add a new section with a "Download Project Files" button that calls an `onDownload` prop. This gives users a clear path to retrieve their project files right from the build instructions panel.

### MatrixToolsPanel.tsx Change
Pass an `onDownload` callback to `BuildInfoPanel` that triggers the existing project downloader.

---

## Summary

| Issue | Cause | Fix |
|-------|-------|-----|
| Header disappears on scroll | `body.overflow = 'auto'` allows page scroll | Set to `hidden` + make header `sticky` |
| No file retrieval after build | Download exists but not in build panel | Add download button to BuildInfoPanel |

