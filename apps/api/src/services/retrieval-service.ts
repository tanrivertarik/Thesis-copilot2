import type { RetrievalRequest, RetrievalResult } from '@thesis-copilot/shared';
import { createEmbeddings } from '../ai/openrouter.js';
import { getChunksForProject } from './source-service.js';
import {
  ErrorCode,
  ErrorFactory,
  ThesisError,
  ValidationError,
  AIServiceError,
  withRetry
} from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export async function performRetrieval(
  ownerId: string,
  request: RetrievalRequest
): Promise<RetrievalResult> {
  const startTime = performance.now();
  
  try {
    // Validate input
    if (!request.query || request.query.trim().length === 0) {
      throw new ValidationError(
        ErrorCode.INVALID_INPUT,
        'Query cannot be empty',
        { userId: ownerId, projectId: request.projectId }
      );
    }

    if (request.limit <= 0 || request.limit > 100) {
      throw new ValidationError(
        ErrorCode.INVALID_INPUT,
        'Limit must be between 1 and 100',
        { userId: ownerId, projectId: request.projectId }
      );
    }

    // Get chunks with error handling
    const allChunks = await withRetry(
      () => getChunksForProject(request.projectId),
      { maxRetries: 2 }
    );
    
    const chunksWithEmbeddings = allChunks.filter((chunk) => Array.isArray(chunk.embedding));

    logger.info('Retrieved chunks for retrieval', {
      userId: ownerId,
      projectId: request.projectId,
      additionalData: {
        totalChunks: allChunks.length,
        chunksWithEmbeddings: chunksWithEmbeddings.length,
        query: request.query
      }
    });

    if (chunksWithEmbeddings.length === 0) {
      logger.warn('No embeddings found, using fallback retrieval', {
        userId: ownerId,
        projectId: request.projectId
      });
      
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

    // Generate query embedding with retry
    const embeddingResult = await withRetry(
      () => createEmbeddings([request.query]),
      { 
        maxRetries: 3,
        retryableErrors: [ErrorCode.AI_SERVICE_ERROR, ErrorCode.EXTERNAL_SERVICE_UNAVAILABLE]
      }
    );

    const queryEmbedding = embeddingResult.embeddings[0];
    if (!queryEmbedding || queryEmbedding.length === 0) {
      throw new AIServiceError(
        ErrorCode.EMBEDDING_GENERATION_FAILED,
        'Failed to generate query embedding',
        { userId: ownerId, projectId: request.projectId }
      );
    }

    const scored = chunksWithEmbeddings
      .map((chunk) => ({
        ...chunk,
        score: cosineSimilarity(queryEmbedding, chunk.embedding ?? []),
        citation: `${chunk.metadata?.heading ?? 'Section'}`
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, request.limit);

    const duration = performance.now() - startTime;
    logger.logMetrics('perform_retrieval', duration, { 
      userId: ownerId, 
      projectId: request.projectId 
    }, {
      query: request.query,
      resultCount: scored.length,
      averageScore: scored.length > 0 ? scored.reduce((sum, r) => sum + r.score, 0) / scored.length : 0
    });

    return {
      query: request,
      chunks: scored
    };
  } catch (error) {
    if (error instanceof ThesisError) {
      throw error;
    }
    
    const thesisError = ErrorFactory.fromUnknown(error, ErrorCode.RETRIEVAL_FAILED, {
      userId: ownerId,
      projectId: request.projectId,
      additionalData: { 
        operation: 'perform_retrieval',
        query: request.query,
        limit: request.limit
      }
    });
    
    logger.error('Retrieval operation failed', thesisError);
    throw thesisError;
  }
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
