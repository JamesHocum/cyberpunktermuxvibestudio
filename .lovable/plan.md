
# Fix Entry File Detection for Next.js and More Frameworks

## Problem
The cloned "Chameleon-Document-Forger" repo is a Next.js project with an `app/` directory. The current `detectEntryFile` priority list doesn't include Next.js patterns (`app/layout.tsx`, `app/page.tsx`, `pages/index.tsx`), so it falls through to `package.json` -- which the preview shows as raw JSON with "Loading neural interface..." overlay.

## Solution

### 1. Expand `ENTRY_PRIORITY` in `src/lib/fileDetection.ts`
Add common framework entry points:

```
index.html
src/index.html
public/index.html
README.md
src/App.tsx
src/App.jsx
src/main.tsx
src/main.jsx
app/page.tsx          <-- Next.js App Router
app/page.jsx
app/layout.tsx
pages/index.tsx       <-- Next.js Pages Router
pages/index.jsx
src/routes/+page.svelte   <-- SvelteKit
src/App.vue           <-- Vue
src/App.svelte        <-- Svelte
package.json          <-- last resort (still useful for seeing deps)
```

### 2. Deprioritize `package.json`
Move `package.json` to the very end since it can't render meaningfully. Also add a fallback: if the only match is `package.json` and a `README.md` exists anywhere in nested paths, prefer that instead.

### 3. Smarter fallback logic
If no priority file is found and no files matched, pick the first file that is NOT `package.json`, `package-lock.json`, `.gitignore`, or config files -- prefer `.tsx`, `.jsx`, `.html`, or `.md` files first.

Updated `detectEntryFile`:

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
  'app/page.tsx',
  'app/page.jsx',
  'app/layout.tsx',
  'pages/index.tsx',
  'pages/index.jsx',
  'src/App.vue',
  'src/App.svelte',
  'package.json',
];

const PREVIEW_FRIENDLY_EXT = ['.html', '.tsx', '.jsx', '.md', '.vue', '.svelte'];

export function detectEntryFile(paths: string[]): string | null {
  // 1. Check priority list
  for (const entry of ENTRY_PRIORITY) {
    const match = paths.find(p => p === entry || p.endsWith('/' + entry));
    if (match) return match;
  }
  // 2. Prefer a preview-friendly file over random config files
  const friendly = paths.find(p =>
    PREVIEW_FRIENDLY_EXT.some(ext => p.endsWith(ext))
  );
  if (friendly) return friendly;
  // 3. Absolute fallback
  return paths[0] ?? null;
}
```

## Files Changed
- `src/lib/fileDetection.ts` -- expanded priority list and added smart fallback
