
# Auto-Select Entry File and Auto-Build Preview

## Problem
After cloning a GitHub repo or opening a project, the preview is blank because no file is auto-selected and the preview panel isn't opened. The user sees "Loading neural interface..." with no content.

## Solution

### 1. Add `detectEntryFile` utility function
Create a helper in `src/lib/fileDetection.ts` that picks the best entry file from a list of file paths:
- Priority order: `index.html`, `src/index.html`, `public/index.html`, `README.md`, `src/App.tsx`, `src/App.jsx`, `src/main.tsx`, `src/main.jsx`, `package.json`
- Falls back to the first file in the list

### 2. Add auto-select logic in `StudioLayout`
Add a `useEffect` that watches `currentProject` and `fileContents`. When a project loads with files but no `activeFile` is selected:
- Call `detectEntryFile` on `Object.keys(fileContents)`
- Set that file as `activeFile` and add it to `openFiles`
- Auto-open the preview panel (`setShowPreview(true)`)

### 3. Wire up the "Run" button
Add an `onRun` handler in `StudioLayout` that:
- Re-fetches files from the database for the current project (calls `loadProject`)
- Auto-selects the entry file
- Opens the preview panel

Pass this as a new prop to `StudioHeader` and bind it to the existing Run button.

### 4. After-clone flow improvement
In `AIChatPanel`, after a successful clone + `onProjectCreated`, the `loadProject` call already populates `fileContents`. The new `useEffect` in step 2 will automatically pick up the change and select the entry file + open preview. No additional changes needed in `AIChatPanel`.

## Technical Details

### New file: `src/lib/fileDetection.ts`
```typescript
const ENTRY_PRIORITY = [
  'index.html',
  'src/index.html',
  'public/index.html',
  'README.md',
  'src/App.tsx',
  'src/App.jsx',
  'src/main.tsx',
  'src/main.jsx',
  'package.json',
];

export function detectEntryFile(paths: string[]): string | null {
  for (const entry of ENTRY_PRIORITY) {
    const match = paths.find(p => 
      p === entry || p.endsWith('/' + entry)
    );
    if (match) return match;
  }
  return paths[0] ?? null;
}
```

### Changes to `src/components/StudioLayout.tsx`
- Import `detectEntryFile`
- Add `useEffect` watching `currentProject?.id` and `Object.keys(fileContents).length`:
  - When files exist but `activeFile` is null, auto-select entry and open preview
- Add `handleRun` callback that calls `loadProject(currentProject.id)`, then the same useEffect triggers auto-select
- Pass `onRun` to `StudioHeader`

### Changes to `src/components/StudioHeader.tsx`
- Add optional `onRun` prop
- Wire the existing "Run" button to call `onRun` instead of (or in addition to) its current behavior

## Flow After Implementation
```text
Clone repo --> loadProject() --> fileContents populated
  --> useEffect fires --> detectEntryFile() --> activeFile set
  --> preview panel opens --> LivePreview renders the file

Click "Run" --> loadProject() re-fetches --> same auto-select flow
```
