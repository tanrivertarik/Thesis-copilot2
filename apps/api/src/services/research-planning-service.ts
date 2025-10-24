import { logger } from '../utils/logger.js';
import { AIServiceError, ErrorCode } from '../utils/errors.js';

export type SubQuestion = {
  id: string;
  question: string;
  searchQueries: string[];
  expectedSources: string[];
};

export type ResearchPlan = {
  id: string;
  mainQuestion: string;
  subQuestions: SubQuestion[];
  createdAt: string;
};

type ThesisContext = {
  scope?: string;
  coreArgument?: string;
  toneGuidelines?: string;
};

/**
 * Generate a research plan from a user query using AI
 * Breaks down complex questions into focused sub-questions
 */
export async function generateResearchPlan(
  query: string,
  thesisContext: ThesisContext
): Promise<ResearchPlan> {
  logger.info('Generating research plan');

  try {
    // For now, create a simple mock plan
    // TODO: Integrate with OpenRouter AI to generate intelligent plans
    const plan: ResearchPlan = {
      id: generateId(),
      mainQuestion: query,
      subQuestions: generateSubQuestions(query),
      createdAt: new Date().toISOString()
    };

    logger.info('Research plan generated successfully');
    return plan;
  } catch (error) {
    logger.error('Research plan generation failed', error);
    throw new AIServiceError(
      ErrorCode.CONTENT_GENERATION_FAILED,
      `Failed to generate research plan: ${(error as Error).message}`,
      {},
      error as Error
    );
  }
}

/**
 * Refine an existing research plan based on user feedback
 */
export async function refineResearchPlan(
  existingPlan: ResearchPlan,
  feedback: string
): Promise<ResearchPlan> {
  logger.info('Refining research plan');

  try {
    // For now, return the existing plan with updated timestamp
    // TODO: Use AI to refine based on feedback
    const refinedPlan: ResearchPlan = {
      ...existingPlan,
      id: generateId(),
      createdAt: new Date().toISOString()
    };

    logger.info('Research plan refined successfully');
    return refinedPlan;
  } catch (error) {
    logger.error('Research plan refinement failed', error);
    throw new AIServiceError(
      ErrorCode.CONTENT_GENERATION_FAILED,
      `Failed to refine research plan: ${(error as Error).message}`,
      {},
      error as Error
    );
  }
}

/**
 * Generate sub-questions from main query (simple mock implementation)
 * TODO: Replace with AI-powered generation
 */
function generateSubQuestions(mainQuery: string): SubQuestion[] {
  const subQuestions: SubQuestion[] = [];

  // Generate 5 related sub-questions
  const templates = [
    `What are the key concepts and theories related to ${mainQuery}?`,
    `What are the current research findings on ${mainQuery}?`,
    `What methodologies are commonly used to study ${mainQuery}?`,
    `What are the main challenges and debates in ${mainQuery}?`,
    `What are the practical applications and implications of ${mainQuery}?`
  ];

  templates.forEach((question, index) => {
    subQuestions.push({
      id: `sq-${index + 1}`,
      question,
      searchQueries: generateSearchQueries(question),
      expectedSources: ['Academic papers', 'Research articles', 'Books']
    });
  });

  return subQuestions;
}

/**
 * Generate search queries for a sub-question
 */
function generateSearchQueries(question: string): string[] {
  // Extract key terms from the question
  const keywords = question
    .replace(/[?.,]/g, '')
    .split(' ')
    .filter(word => word.length > 4)
    .slice(0, 5)
    .join(' ');

  return [
    keywords,
    `${keywords} research`,
    `${keywords} study`
  ];
}

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `plan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
