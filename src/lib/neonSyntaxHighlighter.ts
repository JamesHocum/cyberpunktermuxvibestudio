// ============================================
// Neon Syntax Highlighter
// Cyberpunk-themed syntax highlighting engine
// ============================================

export type NeonTheme = 'matrix' | 'cyber' | 'vaporwave';

interface ThemeColors {
  keyword: string;
  string: string;
  number: string;
  comment: string;
  function: string;
  variable: string;
  operator: string;
  tag: string;
  attribute: string;
}

const themes: Record<NeonTheme, ThemeColors> = {
  matrix: {
    keyword: 'hsl(var(--neon-green))',
    string: 'hsl(var(--neon-purple))',
    number: 'hsl(var(--cyber-cyan))',
    comment: 'hsl(var(--muted-foreground))',
    function: 'hsl(var(--neon-green))',
    variable: 'hsl(var(--matrix-green))',
    operator: 'hsl(var(--neon-purple))',
    tag: 'hsl(var(--neon-green))',
    attribute: 'hsl(var(--cyber-cyan))',
  },
  cyber: {
    keyword: 'hsl(var(--cyber-cyan))',
    string: 'hsl(var(--neon-pink))',
    number: 'hsl(var(--neon-purple))',
    comment: 'hsl(var(--muted-foreground))',
    function: 'hsl(var(--cyber-cyan))',
    variable: 'hsl(var(--foreground))',
    operator: 'hsl(var(--neon-pink))',
    tag: 'hsl(var(--cyber-cyan))',
    attribute: 'hsl(var(--neon-purple))',
  },
  vaporwave: {
    keyword: 'hsl(var(--neon-pink))',
    string: 'hsl(var(--cyber-cyan))',
    number: 'hsl(var(--neon-purple))',
    comment: 'hsl(var(--muted-foreground))',
    function: 'hsl(var(--neon-pink))',
    variable: 'hsl(var(--neon-green))',
    operator: 'hsl(var(--cyber-cyan))',
    tag: 'hsl(var(--neon-pink))',
    attribute: 'hsl(var(--neon-green))',
  },
};

const patterns = {
  keyword: /\b(import|export|const|let|var|function|return|if|else|for|while|switch|case|break|continue|class|interface|type|extends|implements|async|await|try|catch|finally|throw|new|this|super|static|public|private|protected|default|from|as)\b/g,
  string: /(["'`])(?:(?=(\\?))\2.)*?\1/g,
  number: /\b\d+(\.\d+)?\b/g,
  comment: /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm,
  function: /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?=\()/g,
  jsxTag: /<\/?([a-zA-Z][a-zA-Z0-9]*)/g,
  jsxAttribute: /([a-zA-Z][a-zA-Z0-9-]*)=/g,
  operator: /[+\-*/%=<>!&|^~?:]+/g,
};

export function highlightCode(code: string, theme: NeonTheme = 'matrix'): string {
  const colors = themes[theme];
  let highlighted = code;

  // Escape HTML
  highlighted = highlighted
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Apply syntax highlighting in order
  highlighted = highlighted.replace(patterns.comment, (match) => 
    `<span style="color: ${colors.comment}; font-style: italic;">${match}</span>`
  );

  highlighted = highlighted.replace(patterns.string, (match) => 
    `<span style="color: ${colors.string}; text-shadow: 0 0 5px currentColor;">${match}</span>`
  );

  highlighted = highlighted.replace(patterns.keyword, (match) => 
    `<span style="color: ${colors.keyword}; font-weight: 600; text-shadow: 0 0 8px currentColor;">${match}</span>`
  );

  highlighted = highlighted.replace(patterns.function, (match) => 
    `<span style="color: ${colors.function}; text-shadow: 0 0 6px currentColor;">${match}</span>`
  );

  highlighted = highlighted.replace(patterns.number, (match) => 
    `<span style="color: ${colors.number};">${match}</span>`
  );

  highlighted = highlighted.replace(patterns.operator, (match) => 
    `<span style="color: ${colors.operator};">${match}</span>`
  );

  return highlighted;
}

export function getThemeColors(theme: NeonTheme): ThemeColors {
  return themes[theme];
}

export function saveTheme(theme: NeonTheme): void {
  localStorage.setItem('neon-syntax-theme', theme);
}

export function loadTheme(): NeonTheme {
  return (localStorage.getItem('neon-syntax-theme') as NeonTheme) || 'matrix';
}
