import { generateChatCompletion } from '../ai/openrouter.js';
import { logger } from '../utils/logger.js';
import type { AcademicPaper } from './semantic-scholar-service.js';

export type RelevanceScore = {
  paperId: string;
  score: number; // 0-10
  reasoning: string;
  isRelevant: boolean; // true if score >= 6
};

/**
 * Use AI to score the relevance of papers to the research query and domain context
 * This is much more accurate than keyword matching alone
 */
export async function scoreRelevance(
  papers: AcademicPaper[],
  researchQuery: string,
  researchDomain: string
): Promise<Map<string, RelevanceScore>> {
  if (papers.length === 0) {
    return new Map();
  }

  logger.info('Scoring paper relevance with AI', {
    paperCount: papers.length,
    query: researchQuery,
    domain: researchDomain
  });

  try {
    // Batch papers into groups of 10 for efficient processing
    const batchSize = 10;
    const allScores = new Map<string, RelevanceScore>();

    for (let i = 0; i < papers.length; i += batchSize) {
      const batch = papers.slice(i, i + batchSize);

      const systemPrompt = `You are an expert academic research assistant evaluating the relevance of papers to a specific research topic.

Your task: Score each paper's relevance on a scale of 0-10, where:
- 0-3: Completely irrelevant (different domain/application)
- 4-5: Tangentially related (shares keywords but different context)
- 6-7: Moderately relevant (related domain, could provide useful context)
- 8-9: Highly relevant (directly addresses the research topic)
- 10: Perfect match (exactly what the researcher needs)

IMPORTANT: Consider both the TOPIC and the DOMAIN/APPLICATION CONTEXT.
- A paper about "AI bias in clinical populations" is NOT relevant to "AI bias in employee monitoring"
- A paper about "federated learning for IoT security" is NOT relevant to "federated learning for HR analytics"
- Domain mismatch = low score, even if keywords match

Return JSON array in this format:
[
  {
    "paperId": "paper_id_here",
    "score": 7,
    "reasoning": "Brief explanation of why this score"
  }
]`;

      const paperSummaries = batch
        .map(
          (p, idx) =>
            `${idx + 1}. [ID: ${p.id}]
Title: ${p.title}
Authors: ${p.authors}
Year: ${p.year || 'N/A'}
Citations: ${p.citationCount}
Abstract: ${p.abstract ? p.abstract.substring(0, 300) : 'No abstract available'}...`
        )
        .join('\n\n');

      const userPrompt = `Research Query: "${researchQuery}"
Research Domain: "${researchDomain}"

Evaluate the relevance of these ${batch.length} papers:

${paperSummaries}

Return ONLY the JSON array, no additional text.`;

      const response = await generateChatCompletion(
        {
          model: 'google/gemini-flash-1.5-8b',
          systemPrompt,
          userPrompt,
          temperature: 0.3, // Low temperature for consistent scoring
          maxTokens: 2000
        },
        { additionalData: { batchIndex: i / batchSize, batchSize: batch.length } }
      );

      // Parse AI response
      const jsonMatch = response.output.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        logger.warn('AI response did not contain valid JSON array');
        continue;
      }

      const scores = JSON.parse(jsonMatch[0]) as Array<{
        paperId: string;
        score: number;
        reasoning: string;
      }>;

      // Store scores
      for (const score of scores) {
        allScores.set(score.paperId, {
          ...score,
          isRelevant: score.score >= 6
        });
      }

      logger.debug('Batch scored', {
        batchIndex: i / batchSize,
        scoresCount: scores.length,
        relevantCount: scores.filter(s => s.score >= 6).length
      });

      // Small delay between batches to avoid overwhelming the AI API
      if (i + batchSize < papers.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const relevantCount = Array.from(allScores.values()).filter(s => s.isRelevant).length;
    logger.info('Paper relevance scoring completed', {
      totalPapers: papers.length,
      scoredPapers: allScores.size,
      relevantPapers: relevantCount,
      relevanceRate: `${Math.round((relevantCount / allScores.size) * 100)}%`
    });

    return allScores;
  } catch (error) {
    logger.error('Paper relevance scoring failed', error);
    // Return empty map - don't fail the whole search
    return new Map();
  }
}

/**
 * Filter papers by AI relevance score
 */
export function filterByRelevance(
  papers: AcademicPaper[],
  relevanceScores: Map<string, RelevanceScore>,
  minScore: number = 6
): AcademicPaper[] {
  return papers.filter(paper => {
    const score = relevanceScores.get(paper.id);
    if (!score) {
      // If no score available, keep the paper (fail open)
      return true;
    }
    return score.score >= minScore;
  });
}
