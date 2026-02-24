// Parses fenced code blocks from AI markdown responses
// Extracts optional filename from the line before the fence or from the fence language hint

export interface ParsedCodeBlock {
  filename: string;
  language: string;
  code: string;
}

export interface ParsedSegment {
  type: 'text' | 'code';
  content: string;
  codeBlock?: ParsedCodeBlock;
}

/**
 * Parses AI response content into text segments and code blocks.
 * Detects filenames from patterns like:
 *   `path/to/file.ext`
 *   **`path/to/file.ext`**
 *   or the line immediately before a code fence
 */
export function parseMessageContent(content: string): ParsedSegment[] {
  const segments: ParsedSegment[] = [];
  const lines = content.split('\n');
  let i = 0;

  while (i < lines.length) {
    const fenceMatch = lines[i].match(/^```(\w*)/);
    if (fenceMatch) {
      const language = fenceMatch[1] || '';
      let filename = '';

      // Check if the previous text segment's last line contains a filename
      if (segments.length > 0 && segments[segments.length - 1].type === 'text') {
        const prevText = segments[segments.length - 1].content.trimEnd();
        const prevLines = prevText.split('\n');
        const lastLine = prevLines[prevLines.length - 1].trim();
        
        const fnMatch = lastLine.match(/`([^`]+\.[a-zA-Z0-9]+)`/) ||
                         lastLine.match(/(\S+\.[a-zA-Z0-9]+)\s*$/);
        if (fnMatch) {
          filename = fnMatch[1];
          // Remove the filename line from the previous text segment
          prevLines.pop();
          const newText = prevLines.join('\n').trimEnd();
          if (newText) {
            segments[segments.length - 1].content = newText;
          } else {
            segments.pop();
          }
        }
      }

      // Collect code lines until closing fence
      i++;
      const codeLines: string[] = [];
      while (i < lines.length && !lines[i].match(/^```\s*$/)) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```

      if (!filename) {
        // Derive filename from language
        const extMap: Record<string, string> = {
          json: 'file.json', javascript: 'file.js', js: 'file.js',
          typescript: 'file.ts', ts: 'file.ts', tsx: 'file.tsx', jsx: 'file.jsx',
          css: 'file.css', html: 'file.html', python: 'file.py', py: 'file.py',
          bash: 'script.sh', sh: 'script.sh', yaml: 'file.yaml', yml: 'file.yml',
          md: 'file.md', markdown: 'file.md', sql: 'file.sql',
        };
        filename = extMap[language] || `file.${language || 'txt'}`;
      }

      segments.push({
        type: 'code',
        content: codeLines.join('\n'),
        codeBlock: { filename, language, code: codeLines.join('\n') },
      });
    } else {
      // Regular text line
      if (segments.length > 0 && segments[segments.length - 1].type === 'text') {
        segments[segments.length - 1].content += '\n' + lines[i];
      } else {
        segments.push({ type: 'text', content: lines[i] });
      }
      i++;
    }
  }

  return segments;
}
