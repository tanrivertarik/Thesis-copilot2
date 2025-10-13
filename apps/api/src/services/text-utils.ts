type Chunk = {
  text: string;
  approxTokenCount: number;
  heading?: string;
  pageRange?: [number, number];
};

const APPROX_TOKENS_PER_CHAR = 0.25; // heuristic

// Enhanced heading detection patterns
const HEADING_PATTERNS = [
  /^(Chapter|Section|Part)\s+\d+/i,
  /^\d+\.\s+/,
  /^[A-Z][A-Z\s]{2,}$/,
  /^[A-Z][a-z]+(\s+[A-Z][a-z]+)*:$/,
  /^\d+\.\d+/
];

function detectHeading(text: string): string | undefined {
  const firstLine = text.split('\n')[0]?.trim();
  if (!firstLine) return undefined;
  
  // Check if the first line looks like a heading
  if (HEADING_PATTERNS.some(pattern => pattern.test(firstLine))) {
    return firstLine;
  }
  
  // Check if first line is short and in title case
  if (firstLine.length < 100 && /^[A-Z]/.test(firstLine) && !firstLine.endsWith('.')) {
    const words = firstLine.split(' ');
    const titleCaseWords = words.filter(word => /^[A-Z]/.test(word));
    if (titleCaseWords.length / words.length > 0.6) {
      return firstLine;
    }
  }
  
  return undefined;
}

function estimateTokenCount(text: string): number {
  // More accurate token estimation
  const words = text.split(/\s+/).length;
  const chars = text.length;
  // Average between word-based (1.33 tokens per word) and char-based estimates
  return Math.ceil((words * 1.33 + chars * APPROX_TOKENS_PER_CHAR) / 2);
}

export function chunkText(text: string, targetTokens = 800): Chunk[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  // Clean and normalize text
  const normalizedText = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n');

  const paragraphs = normalizedText
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(p => p.length > 0);

  const chunks: Chunk[] = [];
  let currentChunk = '';
  let currentHeading: string | undefined;

  const flushChunk = (heading?: string) => {
    if (currentChunk.trim().length === 0) {
      return;
    }
    const approxTokenCount = estimateTokenCount(currentChunk);
    chunks.push({
      text: currentChunk.trim(),
      approxTokenCount,
      heading: heading || currentHeading
    });
    currentChunk = '';
    currentHeading = heading;
  };

  paragraphs.forEach((paragraph) => {
    // Check if this paragraph is a heading
    const detectedHeading = detectHeading(paragraph);
    
    if (detectedHeading) {
      // If we have a heading, flush current chunk and start new one
      if (currentChunk.trim()) {
        flushChunk();
      }
      currentHeading = detectedHeading;
      currentChunk = paragraph;
      return;
    }

    const paragraphTokens = estimateTokenCount(paragraph);
    
    // If paragraph is too large, split by sentences
    if (paragraphTokens > targetTokens * 0.8) {
      // Flush current chunk before handling large paragraph
      if (currentChunk.trim()) {
        flushChunk();
      }
      
      const sentences = paragraph.split(/(?<=[.!?])\s+/);
      sentences.forEach((sentence) => {
        const newChunkTokens = estimateTokenCount(currentChunk + '\n\n' + sentence);
        if (newChunkTokens > targetTokens && currentChunk.trim()) {
          flushChunk();
        }
        currentChunk = currentChunk.trim() 
          ? `${currentChunk}\n\n${sentence}` 
          : sentence;
      });
    } else {
      // Normal paragraph processing
      const newChunkTokens = estimateTokenCount(currentChunk + '\n\n' + paragraph);
      if (newChunkTokens > targetTokens && currentChunk.trim()) {
        flushChunk();
      }
      currentChunk = currentChunk.trim() 
        ? `${currentChunk}\n\n${paragraph}` 
        : paragraph;
    }
  });

  // Flush any remaining content
  flushChunk();
  
  // Ensure no chunk is too small (merge tiny chunks)
  const finalChunks: Chunk[] = [];
  for (const chunk of chunks) {
    if (chunk.approxTokenCount < 50 && finalChunks.length > 0) {
      // Merge with previous chunk
      const prev = finalChunks[finalChunks.length - 1];
      prev.text += `\n\n${chunk.text}`;
      prev.approxTokenCount = estimateTokenCount(prev.text);
    } else {
      finalChunks.push(chunk);
    }
  }

  return finalChunks;
}
