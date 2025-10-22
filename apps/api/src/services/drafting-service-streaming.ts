import type { SectionDraftRequest } from '@thesis-copilot/shared';
import { env } from '../config/env.js';
import { getProject } from './project-service.js';
import {
  ErrorCode,
  ValidationError,
  DraftingError,
  ThesisError,
  ErrorFactory
} from '../utils/errors.js';
import { logger } from '../utils/logger.js';

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

export type StreamEvent =
  | { type: 'token'; content: string }
  | { type: 'done' }
  | { type: 'error'; message: string };

/**
 * Generate a section draft with streaming tokens
 */
export async function generateSectionDraftStreaming(
  ownerId: string,
  request: SectionDraftRequest,
  onEvent: (event: StreamEvent) => void
): Promise<void> {
  const startTime = performance.now();

  try {
    // Validate input
    if (!request.projectId || !request.sectionId) {
      throw new ValidationError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        'Project ID and Section ID are required',
        { userId: ownerId, projectId: request.projectId, sectionId: request.sectionId }
      );
    }

    if (!request.section?.title || !request.section?.objective) {
      throw new ValidationError(
        ErrorCode.INVALID_INPUT,
        'Section title and objective are required',
        { userId: ownerId, projectId: request.projectId, sectionId: request.sectionId }
      );
    }

    if (!request.chunks || request.chunks.length === 0) {
      throw new ValidationError(
        ErrorCode.INVALID_INPUT,
        'At least one source chunk is required for drafting',
        { userId: ownerId, projectId: request.projectId, sectionId: request.sectionId }
      );
    }

    // Verify project ownership
    await getProject(ownerId, request.projectId);

    const systemPrompt = `
You are Thesis Copilot, an academic writing assistant.
Produce factual, citation-aligned prose using ONLY the provided source excerpts.
When referencing a source chunk, insert [CITE:{chunkId}] where {chunkId} is the provided id.
Maintain a formal academic tone and avoid hallucinations.
Write in proper academic format with clear paragraphs and appropriate structure.
`;

    const chunkContext = request.chunks
      .map(
        (chunk, index) =>
          `Chunk ${index + 1} (id: ${chunk.id}, sourceId: ${chunk.sourceId}):\n${chunk.text}`
      )
      .join('\n\n');

    const userPrompt = `
Project ID: ${request.projectId}
Section ID: ${request.sectionId}
Section Goal: ${request.section.objective}
Section Title: ${request.section.title}
Preferred Citation Style: ${request.citationStyle ?? 'APA'}

Thesis Constitution Summary:
- Scope: ${request.thesisSummary?.scope ?? 'N/A'}
- Core Argument: ${request.thesisSummary?.coreArgument ?? 'N/A'}
- Tone Guidelines: ${request.thesisSummary?.toneGuidelines ?? 'N/A'}

Source Evidence:
${chunkContext}

Instructions:
- Write deeply and comprehensively. Aim for substantial content (minimum 800-1200 words).
- Develop ideas thoroughly with detailed explanations, analysis, and examples.
- Produce multiple well-developed paragraphs (typically 5-8 paragraphs).
- Reference specific evidence with [CITE:{chunkId}].
- Do not invent citations or mention source IDs not listed above.
- Elaborate on key concepts rather than summarizing briefly.
- Include transitions between ideas and build arguments progressively.
- Use proper academic formatting with clear paragraph breaks.
- Write until you have fully explored the section objective - don't stop early.
`;

    if (!env.openRouterApiKey) {
      throw new DraftingError(
        ErrorCode.DRAFTING_FAILED,
        'OpenRouter API key not configured',
        { userId: ownerId, projectId: request.projectId }
      );
    }

    logger.info('Starting streaming draft generation', {
      userId: ownerId,
      projectId: request.projectId,
      sectionId: request.sectionId
    });

    // Call OpenRouter with streaming enabled
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.openRouterApiKey}`,
        'HTTP-Referer': 'https://thesis-copilot.com',
        'X-Title': 'Thesis Copilot'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        temperature: 0.7,
        max_tokens: request.maxTokens ?? 4000,  // Increased default from 600 to 4000 for deeper writing
        stream: true, // Enable streaming
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new DraftingError(
        ErrorCode.DRAFTING_FAILED,
        `OpenRouter API failed: ${response.status} - ${errorText}`,
        { userId: ownerId, projectId: request.projectId }
      );
    }

    if (!response.body) {
      throw new DraftingError(
        ErrorCode.DRAFTING_FAILED,
        'No response body from OpenRouter',
        { userId: ownerId, projectId: request.projectId }
      );
    }

    // Process the streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        // Decode the chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE messages
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);

            if (data === '[DONE]') {
              continue;
            }

            try {
              const parsed = JSON.parse(data) as {
                choices: Array<{ delta: { content?: string }; finish_reason?: string }>;
              };

              const content = parsed.choices[0]?.delta?.content;
              if (content) {
                onEvent({ type: 'token', content });
              }
            } catch (err) {
              // Skip invalid JSON
              logger.warn('Failed to parse streaming chunk', { userId: ownerId });
            }
          }
        }
      }

      const duration = performance.now() - startTime;
      logger.info('Completed streaming draft generation', {
        userId: ownerId,
        projectId: request.projectId,
        sectionId: request.sectionId
      });
    } finally {
      reader.releaseLock();
    }
  } catch (error) {
    if (error instanceof ThesisError) {
      throw error;
    }

    const thesisError = ErrorFactory.fromUnknown(error, ErrorCode.DRAFTING_FAILED, {
      userId: ownerId,
      projectId: request.projectId,
      sectionId: request.sectionId,
      additionalData: {
        operation: 'generate_section_draft_streaming',
        chunkCount: request.chunks?.length ?? 0
      }
    });

    logger.error('Streaming draft generation failed', thesisError);
    throw thesisError;
  }
}
