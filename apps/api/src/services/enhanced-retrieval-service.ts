/**
 * Enhanced Retrieval Service
 * 
 * Advanced source chunk retrieval with multiple ranking algorithms,
 * context-aware selection, and relevance optimization.
 */

import { createEmbeddings } from '../ai/openrouter.js';
import { getChunksForProject } from './source-service.js';
import type { 
  RetrievalRequest, 
  RetrievalResult,
  SourceChunk
} from '@thesis-copilot/shared';

// Enhanced response type extending the standard retrieval result
interface EnhancedRetrievalResponse {
  chunks: (SourceChunk & { score: number })[];
  query: string;
  totalRetrieved: number;
}

interface EnhancedRetrievalContext {
  query: string;
  projectId: string;
  contextType?: 'section_drafting' | 'paragraph_rewrite' | 'research_query';
  sectionContext?: {
    title: string;
    objective: string;
    precedingContent?: string;
    followingOutline?: string;
  };
  filters?: {
    sourceTypes?: string[];
    dateRange?: [Date, Date];
    authorFilters?: string[];
    excludeChunkIds?: string[];
  };
  rankingWeights?: {
    semanticSimilarity: number;
    recency: number;
    sourceReliability: number;
    contextualRelevance: number;
    diversityBonus: number;
  };
}

interface ChunkScore {
  chunkId: string;
  totalScore: number;
  scores: {
    semanticSimilarity: number;
    recencyScore: number;
    reliabilityScore: number;
    contextualRelevance: number;
    diversityBonus: number;
  };
  contextType: 'primary' | 'supporting' | 'contrasting';
  explanation: string;
}

class EnhancedRetrievalService {
  private readonly DEFAULT_WEIGHTS = {
    semanticSimilarity: 0.4,
    recency: 0.15,
    sourceReliability: 0.2,
    contextualRelevance: 0.2,
    diversityBonus: 0.05
  };

  /**
   * Perform enhanced retrieval with multiple ranking factors
   */
  async performEnhancedRetrieval(
    context: EnhancedRetrievalContext,
    maxChunks = 10
  ): Promise<EnhancedRetrievalResponse & { enhancedScores: ChunkScore[] }> {
    const { query, projectId, rankingWeights = this.DEFAULT_WEIGHTS } = context;

    try {
      // Get all chunks for the project
      const allChunks = await getChunksForProject(projectId);
      
      if (allChunks.length === 0) {
        return { 
          chunks: [], 
          query, 
          totalRetrieved: 0,
          enhancedScores: []
        };
      }

      // Generate query embedding
      const queryEmbedding = await this.generateQueryEmbedding(query);
      
      // Score all chunks using multiple factors
      const scoredChunks = await this.scoreChunksWithMultipleFactors(
        allChunks,
        queryEmbedding,
        context,
        rankingWeights
      );

      // Apply intelligent selection strategy
      const selectedChunks = this.selectOptimalChunks(scoredChunks, maxChunks);

      // Format response
      const chunks = selectedChunks.map(scored => {
        const chunk = allChunks.find((c: SourceChunk) => c.id === scored.chunkId)!;
        return {
          ...chunk,
          score: scored.totalScore
        };
      });

      return {
        chunks,
        query,
        totalRetrieved: chunks.length,
        enhancedScores: selectedChunks
      };

    } catch (error) {
      console.error('Enhanced retrieval failed:', error);
      
      // Fallback to basic retrieval
      return this.fallbackToBasicRetrieval(query, projectId, maxChunks);
    }
  }

  /**
   * Generate embedding for the query using OpenRouter
   */
  private async generateQueryEmbedding(query: string): Promise<number[]> {
    try {
      const response = await createEmbeddings([query]);
      return response.embeddings[0] || [];
    } catch (error) {
      console.error('Failed to generate query embedding:', error);
      throw new Error('Embedding generation failed');
    }
  }

  /**
   * Score chunks using multiple ranking factors
   */
  private async scoreChunksWithMultipleFactors(
    chunks: SourceChunk[],
    queryEmbedding: number[],
    context: EnhancedRetrievalContext,
    weights: typeof this.DEFAULT_WEIGHTS
  ): Promise<ChunkScore[]> {
    const scores: ChunkScore[] = [];

    for (const chunk of chunks) {
      const chunkScore = await this.calculateChunkScore(
        chunk,
        queryEmbedding,
        context,
        weights
      );
      scores.push(chunkScore);
    }

    return scores.sort((a, b) => b.totalScore - a.totalScore);
  }

  /**
   * Calculate comprehensive score for a single chunk
   */
  private async calculateChunkScore(
    chunk: SourceChunk,
    queryEmbedding: number[],
    context: EnhancedRetrievalContext,
    weights: typeof this.DEFAULT_WEIGHTS
  ): Promise<ChunkScore> {
    // 1. Semantic Similarity (cosine similarity with embedding)
    const semanticSimilarity = chunk.embedding 
      ? this.cosineSimilarity(queryEmbedding, chunk.embedding)
      : 0.1; // Low baseline for chunks without embeddings

    // 2. Recency Score (based on publication date or upload time)
    const recencyScore = this.calculateRecencyScore(chunk);

    // 3. Source Reliability Score (based on source metadata)
    const reliabilityScore = this.calculateReliabilityScore(chunk);

    // 4. Contextual Relevance (based on section context and query intent)
    const contextualRelevance = this.calculateContextualRelevance(
      chunk, 
      context
    );

    // 5. Diversity Bonus (to avoid over-clustering from single sources)
    const diversityBonus = 0; // Will be calculated in selection phase

    const totalScore = 
      semanticSimilarity * weights.semanticSimilarity +
      recencyScore * weights.recency +
      reliabilityScore * weights.sourceReliability +
      contextualRelevance * weights.contextualRelevance +
      diversityBonus * weights.diversityBonus;

    // Determine context type based on score profile
    const contextType = this.determineContextType({
      semanticSimilarity,
      contextualRelevance,
      reliabilityScore
    });

    const explanation = this.generateScoreExplanation({
      semanticSimilarity,
      recencyScore,
      reliabilityScore,
      contextualRelevance,
      contextType
    });

    return {
      chunkId: chunk.id,
      totalScore,
      scores: {
        semanticSimilarity,
        recencyScore,
        reliabilityScore,
        contextualRelevance,
        diversityBonus
      },
      contextType,
      explanation
    };
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(vectorA: number[], vectorB: number[]): number {
    if (vectorA.length !== vectorB.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i];
      normA += vectorA[i] * vectorA[i];
      normB += vectorB[i] * vectorB[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Calculate recency score based on available metadata
   */
  private calculateRecencyScore(chunk: SourceChunk): number {
    // Since current metadata doesn't have date information,
    // we'll use a baseline score that could be enhanced later
    // when date metadata is added to the schema
    return 0.5; // Neutral baseline score
  }

  /**
   * Calculate source reliability score based on available metadata
   */
  private calculateReliabilityScore(chunk: SourceChunk): number {
    let score = 0.5; // baseline

    const metadata = chunk.metadata;
    if (!metadata) return score;

    // Currently the SourceChunk metadata only has heading and pageRange
    // We can infer some reliability from the presence of structured data
    
    // Sources with clear heading structure might be more reliable
    if (metadata.heading) {
      score += 0.1;
      
      // Academic-style headings (numbered sections) get bonus
      if (/^\d+\./.test(metadata.heading)) {
        score += 0.1;
      }
    }

    // Sources with page ranges suggest formal publication
    if (metadata.pageRange) {
      score += 0.1;
    }

    return Math.min(1.0, score);
  }

  /**
   * Calculate contextual relevance based on section context
   */
  private calculateContextualRelevance(
    chunk: SourceChunk,
    context: EnhancedRetrievalContext
  ): number {
    let relevance = 0.5; // baseline

    const { sectionContext, contextType } = context;
    
    if (!sectionContext) return relevance;

    // Check if chunk content relates to section objective
    const chunkText = chunk.text.toLowerCase();
    const objective = sectionContext.objective.toLowerCase();
    const title = sectionContext.title.toLowerCase();

    // Keyword overlap with section objective
    const objectiveKeywords = this.extractKeywords(objective);
    const titleKeywords = this.extractKeywords(title);
    const chunkKeywords = this.extractKeywords(chunkText);

    const objectiveOverlap = this.calculateKeywordOverlap(
      objectiveKeywords, 
      chunkKeywords
    );
    const titleOverlap = this.calculateKeywordOverlap(
      titleKeywords, 
      chunkKeywords
    );

    relevance += objectiveOverlap * 0.3;
    relevance += titleOverlap * 0.2;

    // Context-specific relevance
    if (contextType === 'section_drafting') {
      // For drafting, prefer chunks with clear argumentative structure
      if (this.hasArgumentativeStructure(chunkText)) {
        relevance += 0.1;
      }
    } else if (contextType === 'paragraph_rewrite') {
      // For rewrites, prefer chunks with precise terminology
      if (this.hasPreciseTerminology(chunkText)) {
        relevance += 0.1;
      }
    }

    return Math.min(1.0, relevance);
  }

  /**
   * Extract meaningful keywords from text
   */
  private extractKeywords(text: string): string[] {
    // Remove common stopwords and extract meaningful terms
    const stopwords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
    
    return text
      .toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 3 && !stopwords.has(word))
      .slice(0, 10); // Top 10 keywords
  }

  /**
   * Calculate keyword overlap ratio
   */
  private calculateKeywordOverlap(keywords1: string[], keywords2: string[]): number {
    if (keywords1.length === 0 || keywords2.length === 0) return 0;
    
    const set1 = new Set(keywords1);
    const overlap = keywords2.filter(word => set1.has(word)).length;
    
    return overlap / Math.max(keywords1.length, keywords2.length);
  }

  /**
   * Check if text has argumentative structure
   */
  private hasArgumentativeStructure(text: string): boolean {
    const argumentativePatterns = [
      /therefore/i, /however/i, /moreover/i, /furthermore/i,
      /in contrast/i, /on the other hand/i, /evidence suggests/i,
      /research shows/i, /studies indicate/i
    ];
    
    return argumentativePatterns.some(pattern => pattern.test(text));
  }

  /**
   * Check if text has precise terminology
   */
  private hasPreciseTerminology(text: string): boolean {
    // Look for technical terms, specific concepts, proper nouns
    const precisionIndicators = [
      /[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+/, // Proper nouns (2+ words)
      /\b\d{4}\b/, // Years
      /\bp\s*<\s*0\.0\d+/, // Statistical significance
      /\b(?:coefficient|correlation|significant|hypothesis)\b/i
    ];
    
    return precisionIndicators.some(pattern => pattern.test(text));
  }

  /**
   * Determine context type based on score profile
   */
  private determineContextType(scores: {
    semanticSimilarity: number;
    contextualRelevance: number;
    reliabilityScore: number;
  }): 'primary' | 'supporting' | 'contrasting' {
    const { semanticSimilarity, contextualRelevance, reliabilityScore } = scores;
    
    // High semantic similarity + high contextual relevance = primary
    if (semanticSimilarity > 0.7 && contextualRelevance > 0.6) {
      return 'primary';
    }
    
    // High reliability but lower similarity might be contrasting evidence
    if (reliabilityScore > 0.8 && semanticSimilarity < 0.5) {
      return 'contrasting';
    }
    
    // Default to supporting
    return 'supporting';
  }

  /**
   * Generate human-readable explanation for the score
   */
  private generateScoreExplanation(scores: {
    semanticSimilarity: number;
    recencyScore: number;
    reliabilityScore: number;
    contextualRelevance: number;
    contextType: 'primary' | 'supporting' | 'contrasting';
  }): string {
    const { semanticSimilarity, recencyScore, reliabilityScore, contextualRelevance, contextType } = scores;
    
    const components = [];
    
    if (semanticSimilarity > 0.7) components.push('high semantic match');
    else if (semanticSimilarity > 0.4) components.push('moderate semantic match');
    else components.push('low semantic match');
    
    if (recencyScore > 0.7) components.push('recent source');
    else if (recencyScore < 0.3) components.push('older source');
    
    if (reliabilityScore > 0.8) components.push('high reliability');
    else if (reliabilityScore < 0.4) components.push('lower reliability');
    
    if (contextualRelevance > 0.7) components.push('highly contextual');
    
    return `${contextType} evidence: ${components.join(', ')}`;
  }

  /**
   * Select optimal chunks using intelligent strategy
   */
  private selectOptimalChunks(
    scoredChunks: ChunkScore[],
    maxChunks: number
  ): ChunkScore[] {
    const selected: ChunkScore[] = [];
    const sourceTracker = new Map<string, number>();
    
    // First pass: select highest scoring chunks with source diversity
    for (const chunk of scoredChunks) {
      if (selected.length >= maxChunks) break;
      
      // Get source ID from chunk
      const sourceId = chunk.chunkId.split('_')[0] || 'unknown';
      const sourceCount = sourceTracker.get(sourceId) || 0;
      
      // Apply diversity penalty for over-representation
      if (sourceCount >= 2) {
        chunk.totalScore *= 0.8; // 20% penalty for 3rd+ chunk from same source
      }
      
      selected.push(chunk);
      sourceTracker.set(sourceId, sourceCount + 1);
    }
    
    // Second pass: apply diversity bonus retroactively
    for (const chunk of selected) {
      const sourceId = chunk.chunkId.split('_')[0] || 'unknown';
      const sourceCount = sourceTracker.get(sourceId) || 0;
      
      if (sourceCount === 1) {
        chunk.scores.diversityBonus = 0.05; // Bonus for unique source
        chunk.totalScore += 0.05;
      }
    }
    
    // Re-sort after diversity adjustments
    return selected.sort((a, b) => b.totalScore - a.totalScore);
  }

  /**
   * Fallback to basic retrieval when enhanced retrieval fails
   */
  private async fallbackToBasicRetrieval(
    query: string,
    projectId: string,
    maxChunks: number
  ): Promise<EnhancedRetrievalResponse & { enhancedScores: ChunkScore[] }> {
    console.warn('Falling back to basic retrieval');
    
    try {
      // Use existing basic retrieval service
      const { performRetrieval } = await import('./retrieval-service.js');
      const basicResult = await performRetrieval('fallback', { 
        query, 
        projectId, 
        sectionId: 'fallback', 
        limit: maxChunks 
      });
      
      // Convert to enhanced format
      const enhancedScores: ChunkScore[] = basicResult.chunks.map((chunk, index) => ({
        chunkId: chunk.id,
        totalScore: chunk.score || (1 - index * 0.1), // Decreasing scores
        scores: {
          semanticSimilarity: chunk.score || 0.5,
          recencyScore: 0.5,
          reliabilityScore: 0.5,
          contextualRelevance: 0.5,
          diversityBonus: 0
        },
        contextType: 'supporting' as const,
        explanation: 'basic similarity match (fallback)'
      }));
      
      return {
        chunks: basicResult.chunks,
        query,
        totalRetrieved: basicResult.chunks.length,
        enhancedScores
      };
      
    } catch (fallbackError) {
      console.error('Fallback retrieval also failed:', fallbackError);
      
      return {
        chunks: [],
        query,
        totalRetrieved: 0,
        enhancedScores: []
      };
    }
  }

  /**
   * Analyze query intent to optimize retrieval strategy
   */
  async analyzeQueryIntent(query: string): Promise<{
    intent: 'factual' | 'analytical' | 'comparative' | 'definitional';
    confidence: number;
    suggestedStrategy: 'broad' | 'focused' | 'diverse';
  }> {
    const intentPatterns = {
      factual: [/what is/i, /how many/i, /when did/i, /where/i],
      analytical: [/why/i, /analyze/i, /examine/i, /discuss/i, /evaluate/i],
      comparative: [/compare/i, /contrast/i, /versus/i, /different/i, /similar/i],
      definitional: [/define/i, /definition/i, /concept of/i, /meaning/i]
    };

    let maxScore = 0;
    let detectedIntent: keyof typeof intentPatterns = 'analytical';

    for (const [intent, patterns] of Object.entries(intentPatterns)) {
      const score = patterns.reduce((acc, pattern) => 
        acc + (pattern.test(query) ? 1 : 0), 0);
      
      if (score > maxScore) {
        maxScore = score;
        detectedIntent = intent as keyof typeof intentPatterns;
      }
    }

    const confidence = Math.min(1, maxScore / 2);
    
    // Suggest strategy based on intent
    const suggestedStrategy = detectedIntent === 'comparative' ? 'diverse' :
                            detectedIntent === 'definitional' ? 'focused' : 'broad';

    return {
      intent: detectedIntent,
      confidence,
      suggestedStrategy
    };
  }
}

// Export singleton instance
export const enhancedRetrievalService = new EnhancedRetrievalService();