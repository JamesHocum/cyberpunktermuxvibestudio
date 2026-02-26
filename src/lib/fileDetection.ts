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
    const match = paths.find(p => p === entry || p.endsWith('/' + entry));
    if (match) return match;
  }
  return paths[0] ?? null;
}
