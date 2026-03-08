/**
 * Auto-chunking for very large prompts (>50,000 chars).
 * Splits on logical boundaries (double newlines, code fences, headers)
 * and wraps each chunk with ordering metadata.
 */

const CHUNK_SIZE = 45000; // chars per chunk (safe margin under 50k)

export interface PromptChunk {
  index: number;
  total: number;
  content: string;
}

/**
 * Returns true if the prompt exceeds the chunking threshold.
 */
export const needsChunking = (text: string): boolean => text.length > 50000;

/**
 * Split a large prompt into ordered chunks at logical boundaries.
 * Preserves the original text intact — chunks are for sequential API dispatch only.
 */
export const chunkPrompt = (text: string): PromptChunk[] => {
  if (!needsChunking(text)) {
    return [{ index: 1, total: 1, content: text }];
  }

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= CHUNK_SIZE) {
      chunks.push(remaining);
      break;
    }

    // Find the best split point within the chunk window
    const window = remaining.slice(0, CHUNK_SIZE);
    let splitAt = -1;

    // Priority 1: double newline (paragraph boundary)
    const doubleNl = window.lastIndexOf('\n\n');
    if (doubleNl > CHUNK_SIZE * 0.5) {
      splitAt = doubleNl + 2;
    }

    // Priority 2: code fence boundary
    if (splitAt === -1) {
      const fenceIdx = window.lastIndexOf('\n```');
      if (fenceIdx > CHUNK_SIZE * 0.3) {
        // Include the fence line
        const nextNl = window.indexOf('\n', fenceIdx + 1);
        splitAt = nextNl !== -1 ? nextNl + 1 : fenceIdx;
      }
    }

    // Priority 3: any single newline
    if (splitAt === -1) {
      const singleNl = window.lastIndexOf('\n');
      if (singleNl > CHUNK_SIZE * 0.3) {
        splitAt = singleNl + 1;
      }
    }

    // Fallback: hard split
    if (splitAt === -1) {
      splitAt = CHUNK_SIZE;
    }

    chunks.push(remaining.slice(0, splitAt));
    remaining = remaining.slice(splitAt);
  }

  const total = chunks.length;
  return chunks.map((content, i) => ({
    index: i + 1,
    total,
    content,
  }));
};

/**
 * Wraps a chunk with a context header so the AI knows it's part of a multi-part prompt.
 */
export const wrapChunk = (chunk: PromptChunk): string => {
  if (chunk.total === 1) return chunk.content;
  return `[MULTI-PART PROMPT: Part ${chunk.index} of ${chunk.total}]\n${chunk.index < chunk.total ? '[MORE PARTS FOLLOW — do NOT respond until all parts received]\n' : '[FINAL PART — you may now respond to the complete prompt]\n'}\n${chunk.content}`;
};
