type Chunk = {
  text: string;
  approxTokenCount: number;
  heading?: string;
  pageRange?: [number, number];
};

const APPROX_TOKENS_PER_CHAR = 0.25; // heuristic

export function chunkText(text: string, targetTokens = 800): Chunk[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const paragraphs = text.split(/\n{2,}/).map((paragraph) => paragraph.trim());
  const chunks: Chunk[] = [];
  let currentChunk = '';

  const flushChunk = () => {
    if (currentChunk.trim().length === 0) {
      return;
    }
    const approxTokenCount = Math.ceil(currentChunk.length * APPROX_TOKENS_PER_CHAR);
    chunks.push({
      text: currentChunk.trim(),
      approxTokenCount
    });
    currentChunk = '';
  };

  paragraphs.forEach((paragraph) => {
    if (paragraph.length === 0) {
      return;
    }
    const paragraphTokens = paragraph.length * APPROX_TOKENS_PER_CHAR;
    if (paragraphTokens > targetTokens) {
      const sentences = paragraph.split(/(?<=[.!?])\s+/);
      sentences.forEach((sentence) => {
        if ((currentChunk + ' ' + sentence).length * APPROX_TOKENS_PER_CHAR > targetTokens) {
          flushChunk();
        }
        currentChunk += ` ${sentence}`.trim();
      });
    } else {
      if ((currentChunk + '\n\n' + paragraph).length * APPROX_TOKENS_PER_CHAR > targetTokens) {
        flushChunk();
      }
      currentChunk += `\n\n${paragraph}`.trim();
    }
  });

  flushChunk();
  return chunks;
}
