import type { RetrievalRequest, RetrievalResult } from '@thesis-copilot/shared';
import { createEmbeddings } from '../ai/openrouter.js';
import { getChunksForProject } from './source-service.js';

export async function performRetrieval(
  ownerId: string,
  request: RetrievalRequest
): Promise<RetrievalResult> {
  // TODO: enforce ownerId scoping when persistence layer is in place
  const allChunks = await getChunksForProject(request.projectId);
  const chunksWithEmbeddings = allChunks.filter((chunk) => Array.isArray(chunk.embedding));

  if (chunksWithEmbeddings.length === 0) {
    const fallback = allChunks.slice(0, request.limit).map((chunk, index) => ({
      ...chunk,
      score: Math.max(0.1, 1 - index * 0.1),
      citation: `${chunk.metadata?.heading ?? 'Section'}`
    }));

    return {
      query: request,
      chunks: fallback
    };
  }

  const { embeddings: [queryEmbedding] } = await createEmbeddings([request.query]);

  const scored = chunksWithEmbeddings
    .map((chunk) => ({
      ...chunk,
      score: cosineSimilarity(queryEmbedding, chunk.embedding ?? []),
      citation: `${chunk.metadata?.heading ?? 'Section'}`
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, request.limit);

  return {
    query: request,
    chunks: scored
  };
}

function cosineSimilarity(a: number[], b: number[]) {
  if (a.length === 0 || b.length === 0) {
    return 0;
  }
  const dot = a.reduce((sum, value, index) => sum + value * (b[index] ?? 0), 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, value) => sum + value * value, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, value) => sum + value * value, 0));
  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }
  return dot / (magnitudeA * magnitudeB);
}
