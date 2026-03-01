

# Add Linux/macOS Export, Completed Projects Tab, and End-to-End Testing

## Overview

Three features to implement:
1. Add Linux AppImage and macOS DMG export options to the Publish dialog
2. Create a `project_exports` database table and a "Completed Projects" tab on the Projects page with re-download capability
3. Wire export events to persist in the database so completed builds appear in the new tab

---

## 1. Add Linux AppImage and macOS DMG to Publish Dialog

**File: `src/components/PublishDialog.tsx`**

Add two new export handlers and option cards alongside the existing Windows .exe:

- **`handleLinuxPackage`**: Generates a ZIP with project files, Electron main process, `package.json` with `package:linux` script (`electron-builder --linux`), and `electron-builder.config.js` targeting `AppImage`, `deb`, and `rpm`. Includes a README with build instructions.

- **`handleMacPackage`**: Same pattern but targets `dmg` and `zip` for macOS, with `package:mac` script. Config includes `mac.category`, `mac.darkModeSupport`, and DMG layout settings.

- Add two new entries to the `options` array:
  - `{ id: "linux", icon: <Terminal>, title: "Linux AppImage", badge: "LINUX", desc: "Download with Electron config -- run npm run package:linux locally" }`
  - `{ id: "mac", icon: <Apple/Monitor>, title: "macOS DMG", badge: "MACOS", desc: "Download with Electron config -- run npm run package:mac locally" }`

- Import `Terminal` icon from lucide-react for Linux (there's no Apple icon in lucide, so we'll use a custom label or the `Laptop` icon).

- After each successful download, record the export to the database (see section 3).

---

## 2. Database: `project_exports` Table

**New migration** to create a table that tracks completed exports/builds:

```text
CREATE TABLE public.project_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  export_type TEXT NOT NULL,        -- 'pwa', 'windows', 'linux', 'mac', 'zip', 'web'
  project_name TEXT NOT NULL,
  file_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.project_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own exports"
  ON public.project_exports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own exports"
  ON public.project_exports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own exports"
  ON public.project_exports FOR DELETE
  USING (auth.uid() = user_id);
```

This table stores metadata about each export. We do NOT store the actual ZIP blob (too large for DB rows). Instead, the "Re-download" action in the Completed Projects tab will re-generate the package on the fly from the project's current files.

---

## 3. Record Exports from PublishDialog

**File: `src/components/PublishDialog.tsx`**

- Accept a new optional prop: `projectId?: string`
- After each successful download (PWA, Windows, Linux, Mac, ZIP), insert a row into `project_exports` with the export type, project name, and file count
- Pass `currentProject?.id` from `StudioLayout.tsx` to `PublishDialog`

**File: `src/components/StudioLayout.tsx`**

- Pass `projectId={currentProject?.id}` to `<PublishDialog>`

---

## 4. "Completed Projects" Tab on Projects Page

**File: `src/pages/Projects.tsx`**

Add a tab bar at the top of the content area with two tabs: "Your Projects" (existing grid) and "Completed Builds" (new).

The "Completed Builds" tab:
- Queries `project_exports` table ordered by `created_at DESC`
- Displays a card for each export showing: project name, export type badge (PWA/Windows/Linux/macOS/ZIP), date
- Each card has a "Re-download" button that:
  - Loads the project's files from `project_files` table
  - Calls the same ZIP generation logic as PublishDialog for that export type
  - Downloads the package
- Also has a delete button to remove the export record

The re-download logic will be extracted into a shared utility:

**New file: `src/lib/exportGenerators.ts`**

Extract the ZIP generation functions from `PublishDialog.tsx` into reusable functions:
- `generatePWAPackage(projectName, fileContents): Promise<Blob>`
- `generateWindowsPackage(projectName, fileContents): Promise<Blob>`
- `generateLinuxPackage(projectName, fileContents): Promise<Blob>`
- `generateMacPackage(projectName, fileContents): Promise<Blob>`
- `generateZipPackage(projectName, fileContents): Promise<Blob>`

Both `PublishDialog` and the Projects page "Re-download" button will use these shared functions.

---

## Files Summary

| Action | File |
|--------|------|
| Create | `src/lib/exportGenerators.ts` -- shared ZIP generation functions |
| Modify | `src/components/PublishDialog.tsx` -- add Linux/Mac options, record exports to DB, use shared generators |
| Modify | `src/components/StudioLayout.tsx` -- pass `projectId` to PublishDialog |
| Modify | `src/pages/Projects.tsx` -- add "Completed Builds" tab with re-download |
| Migration | Create `project_exports` table with RLS policies |

---

## Technical Notes

- No actual binary compilation happens in-browser. Each "package" is a ZIP containing source + Electron config + build scripts + README. The user runs `npm run package:linux` (or `:mac`, `:win`) locally.
- The `project_exports` table is lightweight metadata only (no blobs). Re-downloads regenerate the ZIP from current project files.
- Linux config targets: AppImage, deb, rpm. Mac config targets: dmg, zip. Windows config targets: nsis, portable.

