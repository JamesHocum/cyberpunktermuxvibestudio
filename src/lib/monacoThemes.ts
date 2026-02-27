import type { editor } from 'monaco-editor';

export type MonacoTheme = 'matrix' | 'cyber' | 'vaporwave';

export const matrixTheme: editor.IStandaloneThemeData = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: '', foreground: '00ff41', background: '0d1117' },
    { token: 'comment', foreground: '4a5568', fontStyle: 'italic' },
    { token: 'keyword', foreground: '8c00ff', fontStyle: 'bold' },
    { token: 'string', foreground: '00ff41' },
    { token: 'number', foreground: '00d4ff' },
    { token: 'regexp', foreground: 'ff006e' },
    { token: 'type', foreground: '00d4ff' },
    { token: 'class', foreground: 'ffbe0b' },
    { token: 'function', foreground: '00d4ff' },
    { token: 'variable', foreground: '00ff41' },
    { token: 'variable.predefined', foreground: '8c00ff' },
    { token: 'constant', foreground: 'ff006e' },
    { token: 'operator', foreground: 'b300ff' },
    { token: 'tag', foreground: 'ff006e' },
    { token: 'attribute.name', foreground: '00d4ff' },
    { token: 'attribute.value', foreground: '00ff41' },
    { token: 'delimiter', foreground: '4a5568' },
    { token: 'delimiter.html', foreground: '4a5568' },
    { token: 'delimiter.xml', foreground: '4a5568' },
  ],
  colors: {
    'editor.background': '#0d1117',
    'editor.foreground': '#00ff41',
    'editor.lineHighlightBackground': '#00ff4110',
    'editor.selectionBackground': '#00ff4130',
    'editor.inactiveSelectionBackground': '#00ff4120',
    'editorCursor.foreground': '#00ff41',
    'editorWhitespace.foreground': '#4a5568',
    'editorLineNumber.foreground': '#4a5568',
    'editorLineNumber.activeForeground': '#00ff41',
    'editorGutter.background': '#0a0e14',
    'editorWidget.background': '#0d1117',
    'editorWidget.border': '#00ff4150',
    'editorSuggestWidget.background': '#0d1117',
    'editorSuggestWidget.border': '#00ff4150',
    'editorSuggestWidget.foreground': '#00ff41',
    'editorSuggestWidget.selectedBackground': '#00ff4130',
    'editorSuggestWidget.highlightForeground': '#8c00ff',
    'editorHoverWidget.background': '#0d1117',
    'editorHoverWidget.border': '#00ff4150',
    'scrollbarSlider.background': '#00ff4130',
    'scrollbarSlider.hoverBackground': '#00ff4150',
    'scrollbarSlider.activeBackground': '#00ff4170',
  },
};

export const cyberTheme: editor.IStandaloneThemeData = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: '', foreground: '00d4ff', background: '0a0e14' },
    { token: 'comment', foreground: '4a5568', fontStyle: 'italic' },
    { token: 'keyword', foreground: 'ff006e', fontStyle: 'bold' },
    { token: 'string', foreground: '00d4ff' },
    { token: 'number', foreground: 'ffbe0b' },
    { token: 'regexp', foreground: 'ff006e' },
    { token: 'type', foreground: 'ffbe0b' },
    { token: 'class', foreground: 'ffbe0b' },
    { token: 'function', foreground: 'ffbe0b' },
    { token: 'variable', foreground: '00d4ff' },
    { token: 'variable.predefined', foreground: 'ff006e' },
    { token: 'constant', foreground: 'ff006e' },
    { token: 'operator', foreground: 'ff006e' },
    { token: 'tag', foreground: 'ff006e' },
    { token: 'attribute.name', foreground: 'ffbe0b' },
    { token: 'attribute.value', foreground: '00d4ff' },
    { token: 'delimiter', foreground: '4a5568' },
  ],
  colors: {
    'editor.background': '#0a0e14',
    'editor.foreground': '#00d4ff',
    'editor.lineHighlightBackground': '#00d4ff10',
    'editor.selectionBackground': '#00d4ff30',
    'editor.inactiveSelectionBackground': '#00d4ff20',
    'editorCursor.foreground': '#00d4ff',
    'editorWhitespace.foreground': '#4a5568',
    'editorLineNumber.foreground': '#4a5568',
    'editorLineNumber.activeForeground': '#00d4ff',
    'editorGutter.background': '#080b10',
    'editorWidget.background': '#0a0e14',
    'editorWidget.border': '#00d4ff50',
    'editorSuggestWidget.background': '#0a0e14',
    'editorSuggestWidget.border': '#00d4ff50',
    'editorSuggestWidget.foreground': '#00d4ff',
    'editorSuggestWidget.selectedBackground': '#00d4ff30',
    'editorSuggestWidget.highlightForeground': '#ff006e',
    'editorHoverWidget.background': '#0a0e14',
    'editorHoverWidget.border': '#00d4ff50',
    'scrollbarSlider.background': '#00d4ff30',
    'scrollbarSlider.hoverBackground': '#00d4ff50',
    'scrollbarSlider.activeBackground': '#00d4ff70',
  },
};

export const vaporwaveTheme: editor.IStandaloneThemeData = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: '', foreground: 'ff006e', background: '1a0a1f' },
    { token: 'comment', foreground: '6a4a7a', fontStyle: 'italic' },
    { token: 'keyword', foreground: '8c00ff', fontStyle: 'bold' },
    { token: 'string', foreground: 'ff006e' },
    { token: 'number', foreground: '00d4ff' },
    { token: 'regexp', foreground: 'ffbe0b' },
    { token: 'type', foreground: '00d4ff' },
    { token: 'class', foreground: '00d4ff' },
    { token: 'function', foreground: '00d4ff' },
    { token: 'variable', foreground: 'ff006e' },
    { token: 'variable.predefined', foreground: '8c00ff' },
    { token: 'constant', foreground: 'ffbe0b' },
    { token: 'operator', foreground: '8c00ff' },
    { token: 'tag', foreground: 'ff006e' },
    { token: 'attribute.name', foreground: '00d4ff' },
    { token: 'attribute.value', foreground: 'ff006e' },
    { token: 'delimiter', foreground: '6a4a7a' },
  ],
  colors: {
    'editor.background': '#1a0a1f',
    'editor.foreground': '#ff006e',
    'editor.lineHighlightBackground': '#ff006e10',
    'editor.selectionBackground': '#ff006e30',
    'editor.inactiveSelectionBackground': '#ff006e20',
    'editorCursor.foreground': '#ff006e',
    'editorWhitespace.foreground': '#6a4a7a',
    'editorLineNumber.foreground': '#6a4a7a',
    'editorLineNumber.activeForeground': '#ff006e',
    'editorGutter.background': '#140816',
    'editorWidget.background': '#1a0a1f',
    'editorWidget.border': '#ff006e50',
    'editorSuggestWidget.background': '#1a0a1f',
    'editorSuggestWidget.border': '#ff006e50',
    'editorSuggestWidget.foreground': '#ff006e',
    'editorSuggestWidget.selectedBackground': '#ff006e30',
    'editorSuggestWidget.highlightForeground': '#8c00ff',
    'editorHoverWidget.background': '#1a0a1f',
    'editorHoverWidget.border': '#ff006e50',
    'scrollbarSlider.background': '#ff006e30',
    'scrollbarSlider.hoverBackground': '#ff006e50',
    'scrollbarSlider.activeBackground': '#ff006e70',
  },
};

export const monacoThemes = {
  matrix: matrixTheme,
  cyber: cyberTheme,
  vaporwave: vaporwaveTheme,
} as const;

export const getMonacoLanguage = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'ts':
      return 'typescript';
    case 'tsx':
      return 'typescript';
    case 'js':
      return 'javascript';
    case 'jsx':
      return 'javascript';
    case 'css':
      return 'css';
    case 'scss':
      return 'scss';
    case 'less':
      return 'less';
    case 'json':
      return 'json';
    case 'html':
      return 'html';
    case 'md':
      return 'markdown';
    case 'sql':
      return 'sql';
    case 'yaml':
    case 'yml':
      return 'yaml';
    case 'xml':
      return 'xml';
    case 'sh':
    case 'bash':
      return 'shell';
    case 'py':
      return 'python';
    case 'go':
      return 'go';
    case 'rs':
      return 'rust';
    default:
      return 'plaintext';
  }
};
