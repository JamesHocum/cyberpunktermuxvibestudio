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
