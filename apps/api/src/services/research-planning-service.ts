import { logger } from '../utils/logger.js';
import { AIServiceError, ErrorCode } from '../utils/errors.js';
import { generateChatCompletion } from '../ai/openrouter.js';

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

export type ThesisContext = {
  topic?: string;
  researchQuestions?: string[];
  thesisStatement?: string;
};

/**
 * Generate a research plan from a user query using AI
 * Breaks down complex questions into focused sub-questions with academic search queries
 */
export async function generateResearchPlan(
  query: string,
  thesisContext: ThesisContext
): Promise<ResearchPlan> {
  logger.info('Generating AI-powered research plan');

  try {
    const systemPrompt = `You are an expert research assistant helping graduate students find relevant academic papers.
Your task is to break down a research query into focused sub-questions and generate highly specific academic search queries for Semantic Scholar.

CRITICAL RULES for search queries:
1. Use EXACT academic terminology from the research domain
2. Combine 2-3 core concepts per query (e.g., "employee well-being AI workplace")
3. Include methodology keywords (e.g., "sentiment analysis", "natural language processing", "machine learning")
4. Use domain-specific terms (e.g., "remote work", "organizational psychology", "HR analytics")
5. Queries should be 4-7 words - not too short, not too long
6. NEVER use generic filler words: "related", "research", "study", "findings", "current", "novel"
7. Focus on WHAT is being studied and HOW it's being studied

GOOD examples:
- "employee sentiment analysis workplace monitoring"
- "privacy-preserving NLP organizational data"
- "remote work well-being measurement tools"
- "AI-driven employee engagement detection"

BAD examples (too generic):
- "concepts theories related to AI"
- "current research findings"
- "novel approaches"

Return your response as valid JSON in this exact format:
{
  "subQuestions": [
    {
      "question": "Clear, focused research question",
      "searchQueries": [
        "specific academic concept keyword phrase",
        "another targeted search phrase",
        "third precise academic query"
      ],
      "expectedSources": ["Academic papers", "Review articles", "Conference proceedings"]
    }
  ]
}`;

    const contextInfo = thesisContext.topic
      ? `\n\nThesis Context:
- Topic: ${thesisContext.topic}
${thesisContext.researchQuestions ? `- Research Questions: ${thesisContext.researchQuestions.join('; ')}` : ''}
${thesisContext.thesisStatement ? `- Thesis Statement: ${thesisContext.thesisStatement}` : ''}`
      : '';

    const userPrompt = `Research Query: "${query}"${contextInfo}

Generate 5-7 comprehensive sub-questions that deeply explore this research query from multiple angles:
- Theoretical foundations and existing research
- Methodologies and technical approaches
- Implementation challenges and solutions
- Evaluation metrics and validation methods
- Ethical considerations and limitations
- Practical applications and case studies
- Future directions and open problems

For EACH sub-question, generate 5-6 diverse, highly specific academic search queries optimized for Semantic Scholar.

Example of GOOD search queries:
- "transformer attention mechanism NLP"
- "BERT sentiment classification accuracy"
- "deep learning hate speech detection"
- "convolutional neural networks image recognition"
- "employee sentiment analysis workplace"
- "privacy-preserving federated learning"

Example of BAD search queries (too generic):
- "concepts theories related to AI"
- "current research findings"
- "methodologies commonly used"

Return ONLY the JSON object, no additional text.`;

    const response = await generateChatCompletion({
      model: 'google/gemini-2.5-flash',
      systemPrompt,
      userPrompt,
      temperature: 0.4,
      maxTokens: 4000
    });

    // Parse AI response
    const jsonMatch = response.output.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('AI response did not contain valid JSON');
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      subQuestions: Array<{
        question: string;
        searchQueries: string[];
        expectedSources: string[];
      }>;
    };

    if (!parsed.subQuestions || !Array.isArray(parsed.subQuestions)) {
      throw new Error('AI response missing subQuestions array');
    }

    // Transform to ResearchPlan format
    const plan: ResearchPlan = {
      id: generateId(),
      mainQuestion: query,
      subQuestions: parsed.subQuestions.map((sq, index) => ({
        id: `sq-${index + 1}`,
        question: sq.question,
        searchQueries: sq.searchQueries,
        expectedSources: sq.expectedSources
      })),
      createdAt: new Date().toISOString()
    };

    logger.info('AI-powered research plan generated successfully');
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
 * Refine an existing research plan based on user feedback using AI
 */
export async function refineResearchPlan(
  existingPlan: ResearchPlan,
  feedback: string,
  thesisContext?: ThesisContext
): Promise<ResearchPlan> {
  logger.info('Refining research plan with AI');

  try {
    const systemPrompt = `You are an expert research assistant helping refine academic research plans.
Given an existing research plan and user feedback, modify the plan to better address the user's needs.

IMPORTANT: Generate search queries that:
- Use precise academic terminology and keywords
- Include field-specific concepts
- Target specific research areas, methodologies, or approaches
- Are 3-8 words long for optimal search results
- Avoid generic words like "related", "research", "study", "findings"

Return your response as valid JSON in this exact format:
{
  "subQuestions": [
    {
      "question": "Clear, focused research question",
      "searchQueries": [
        "specific academic concept keyword phrase",
        "another targeted search phrase",
        "third precise academic query"
      ],
      "expectedSources": ["Academic papers", "Review articles", "Conference proceedings"]
    }
  ]
}`;

    const contextInfo = thesisContext?.topic
      ? `\n\nThesis Context:
- Topic: ${thesisContext.topic}
${thesisContext.researchQuestions ? `- Research Questions: ${thesisContext.researchQuestions.join('; ')}` : ''}
${thesisContext.thesisStatement ? `- Thesis Statement: ${thesisContext.thesisStatement}` : ''}`
      : '';

    const userPrompt = `Existing Research Plan:
Main Question: "${existingPlan.mainQuestion}"

Current Sub-Questions:
${existingPlan.subQuestions.map((sq, idx) => `${idx + 1}. ${sq.question}\n   Queries: ${sq.searchQueries.join(', ')}`).join('\n')}

User Feedback: "${feedback}"${contextInfo}

Please refine the research plan based on the feedback. You may:
- Modify existing sub-questions to be more focused
- Add new sub-questions if needed
- Remove or merge sub-questions
- Generate better, more specific academic search queries

Return ONLY the JSON object with the refined sub-questions, no additional text.`;

    const response = await generateChatCompletion({
      model: 'google/gemini-flash-1.5-8b',
      systemPrompt,
      userPrompt,
      temperature: 0.4,
      maxTokens: 4000
    });

    // Parse AI response
    const jsonMatch = response.output.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('AI response did not contain valid JSON');
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      subQuestions: Array<{
        question: string;
        searchQueries: string[];
        expectedSources: string[];
      }>;
    };

    if (!parsed.subQuestions || !Array.isArray(parsed.subQuestions)) {
      throw new Error('AI response missing subQuestions array');
    }

    // Transform to ResearchPlan format
    const refinedPlan: ResearchPlan = {
      id: generateId(),
      mainQuestion: existingPlan.mainQuestion,
      subQuestions: parsed.subQuestions.map((sq, index) => ({
        id: `sq-${index + 1}`,
        question: sq.question,
        searchQueries: sq.searchQueries,
        expectedSources: sq.expectedSources
      })),
      createdAt: new Date().toISOString()
    };

    logger.info('Research plan refined successfully with AI');
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
