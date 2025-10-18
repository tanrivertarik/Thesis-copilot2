import type {
  RewriteDraftRequest,
  RewriteDraftResponse,
  SectionDraftRequest,
  SectionDraftResponse,
  AICommandRequest,
  AICommandResponse,
  EditOperation
} from '@thesis-copilot/shared';
import { generateChatCompletion } from '../ai/openrouter.js';
import { getProject } from './project-service.js';
import {
  ErrorCode,
  ErrorFactory,
  ThesisError,
  ValidationError,
  AIServiceError,
  DraftingError,
  withRetry
} from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export async function generateSectionDraft(
  ownerId: string,
  request: SectionDraftRequest
): Promise<SectionDraftResponse> {
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

    const systemPrompt = `
You are Thesis Copilot, an academic writing assistant.
Produce factual, citation-aligned prose using ONLY the provided source excerpts.
When referencing a source chunk, insert [CITE:{chunkId}] where {chunkId} is the provided id.
Maintain a formal academic tone and avoid hallucinations.
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
- Produce between 2 and 4 paragraphs unless otherwise implied by section goal.
- Reference specific evidence with [CITE:{chunkId}].
- Do not invent citations or mention source IDs not listed above.
- Mention uncertainties or gaps explicitly.
`;

    // Generate draft with retry logic
    const response = await withRetry(
      () => generateChatCompletion({
        systemPrompt,
        userPrompt,
        maxTokens: request.maxTokens,
        temperature: 0.35
      }),
      {
        maxRetries: 3,
        retryableErrors: [ErrorCode.AI_SERVICE_ERROR, ErrorCode.EXTERNAL_SERVICE_UNAVAILABLE]
      }
    );

    if (!response.output || response.output.trim().length === 0) {
      throw new DraftingError(
        ErrorCode.DRAFTING_FAILED,
        'AI service returned empty draft content',
        { userId: ownerId, projectId: request.projectId, sectionId: request.sectionId }
      );
    }

    const usedChunkIds = request.chunks.map((chunk) => chunk.id);
    const duration = performance.now() - startTime;

    logger.logMetrics('generate_section_draft', duration, {
      userId: ownerId,
      projectId: request.projectId,
      sectionId: request.sectionId
    }, {
      chunkCount: request.chunks.length,
      outputLength: response.output.length,
      tokenUsage: response.usage,
      temperature: 0.35
    });

    return {
      draft: response.output,
      usedChunkIds,
      tokenUsage: response.usage,
      latencyMs: response.latencyMs
    };
  } catch (error) {
    if (error instanceof ThesisError) {
      throw error;
    }
    
    const thesisError = ErrorFactory.fromUnknown(error, ErrorCode.DRAFTING_FAILED, {
      userId: ownerId,
      projectId: request.projectId,
      sectionId: request.sectionId,
      additionalData: { 
        operation: 'generate_section_draft',
        chunkCount: request.chunks?.length ?? 0
      }
    });
    
    logger.error('Section draft generation failed', thesisError);
    throw thesisError;
  }
}

function normalizeSuggestionHtml(html: string) {
  const trimmed = html.trim();
  if (!trimmed) {
    return '';
  }
  if (trimmed.startsWith('<')) {
    return trimmed;
  }
  return `<p>${trimmed}</p>`;
}

export async function generateParagraphRewrite(
  ownerId: string,
  request: RewriteDraftRequest
): Promise<RewriteDraftResponse> {
  const project = await getProject(ownerId, request.projectId);
  if (!project) {
    throw new Error('Project not found');
  }

  const systemPrompt = `
You are Thesis Copilot, an academic writing assistant tasked with refining a single thesis paragraph.
Maintain the author's intent, keep all provided citation placeholders exactly as [CITE:sourceId], and ensure the tone remains formal and evidence-based.
Return a JSON object with keys "suggestion_html" (rewritten HTML paragraph) and optional "reasoning".
`;

  const citationSummary =
    request.citations.length > 0
      ? request.citations
          .map(
            (citation) =>
              `${citation.placeholder} → ${citation.sourceTitle}${
                citation.snippet ? ` (${citation.snippet.slice(0, 120)}${citation.snippet.length > 120 ? '…' : ''})` : ''
              }`
          )
          .join('\n')
      : 'None provided.';

  const surrounding = request.surroundingParagraphs
    ? `
Previous paragraphs:
${request.surroundingParagraphs.previous.join('\n\n') || 'N/A'}

Following paragraphs:
${request.surroundingParagraphs.next.join('\n\n') || 'N/A'}
`
    : 'No additional paragraph context provided.';

  const thesisSummary = request.thesisSummary
    ? `
Thesis scope: ${request.thesisSummary.scope ?? 'N/A'}
Tone guidelines: ${request.thesisSummary.toneGuidelines ?? 'N/A'}
Core argument: ${request.thesisSummary.coreArgument ?? 'N/A'}
`
    : 'No thesis summary available.';

  const userPrompt = `
Project: ${project.title}
Section ID: ${request.sectionId}
Paragraph ID: ${request.paragraphId}
Citation style: ${request.citationStyle ?? project.citationStyle}

${thesisSummary}

Original paragraph HTML:
${request.originalHtml}

User-edited paragraph HTML:
${request.editedHtml}

Citations:
${citationSummary}

${surrounding}

Instructions:
- Preserve all existing citation placeholders exactly as-is.
- Improve clarity, coherence, and academic tone.
- If the edited paragraph is already optimal, return it unchanged.
- Respond with JSON only.
`;

  const response = await generateChatCompletion({
    systemPrompt,
    userPrompt,
    maxTokens: request.maxTokens,
    temperature: 0.25
  });

  let suggestionHtml = request.editedHtml;
  let reasoning: string | undefined;

  try {
    // Sanitize JSON output - remove control characters and fix common issues
    let cleanedOutput = response.output
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
      .replace(/\n/g, '\\n') // Escape newlines
      .replace(/\r/g, '\\r') // Escape carriage returns
      .replace(/\t/g, '\\t'); // Escape tabs

    const parsed = JSON.parse(cleanedOutput) as {
      suggestion_html?: string;
      suggestionHtml?: string;
      suggestion?: string;
      reasoning?: string;
    };
    suggestionHtml =
      parsed.suggestion_html ??
      parsed.suggestionHtml ??
      parsed.suggestion ??
      suggestionHtml;
    reasoning = parsed.reasoning ?? undefined;
  } catch (error) {
    // Fall back to raw output if it looks like HTML, otherwise leave edited paragraph.
    if (response.output.trim().startsWith('<')) {
      suggestionHtml = response.output;
    } else if (response.output.trim()) {
      suggestionHtml = `<p>${response.output.trim()}</p>`;
    }
    reasoning = `Model response could not be parsed as JSON: ${(error as Error).message}`;
  }

  suggestionHtml = normalizeSuggestionHtml(suggestionHtml);

  const missingCitation = request.citations.some(
    (citation) => suggestionHtml && !suggestionHtml.includes(citation.placeholder)
  );

  if (missingCitation) {
    suggestionHtml = normalizeSuggestionHtml(request.editedHtml);
    reasoning = reasoning
      ? `${reasoning} | Citation placeholders were missing, reverting to edited paragraph.`
      : 'Citation placeholders were missing in the rewrite, so the original edited paragraph is preserved.';
  }

  return {
    paragraphId: request.paragraphId,
    suggestionHtml,
    reasoning,
    tokenUsage: response.usage,
    latencyMs: response.latencyMs
  };
}

export async function processAICommand(
  ownerId: string,
  request: AICommandRequest
): Promise<AICommandResponse> {
  const startTime = performance.now();

  try {
    const project = await getProject(ownerId, request.projectId);
    if (!project) {
      throw new ValidationError(
        ErrorCode.INVALID_INPUT,
        'Project not found',
        { userId: ownerId, projectId: request.projectId }
      );
    }

    const systemPrompt = `
You are Thesis Copilot, an AI writing assistant that helps users edit their academic writing.
You receive natural language commands from the user and return structured edit operations.

Your task is to:
1. Understand the user's command (e.g., "Make it shorter", "Add more citations", "Rewrite the introduction")
2. Analyze the current document content
3. Determine the appropriate edit operation type: insert, replace, delete, or rewrite
4. Generate the new content that fulfills the command
5. Return a JSON response with the operation details

IMPORTANT: Return ONLY valid JSON, no extra text.

Response format:
{
  "operation": {
    "type": "insert" | "replace" | "delete" | "rewrite",
    // For insert:
    "position": "start" | "end" | "cursor",
    "content": "HTML content to insert",
    "reason": "Why this edit"
    // For replace:
    "from": number,  // character position
    "to": number,    // character position
    "content": "HTML content",
    "originalContent": "what was replaced",
    "reason": "Why this edit"
    // For delete:
    "from": number,
    "to": number,
    "deletedContent": "what was deleted",
    "reason": "Why this edit"
    // For rewrite:
    "target": "paragraph" | "section" | "selection",
    "content": "rewritten HTML",
    "reason": "Why this edit"
  },
  "reasoning": "Explanation of what you did and why"
}

Keep all citation placeholders like [CITE:sourceId] exactly as they are.
Maintain academic tone and formal writing style.
`;

    const citationSummary = request.citations.length > 0
      ? request.citations
          .map(c => `${c.placeholder} → ${c.sourceTitle}`)
          .join('\n')
      : 'No citations in current draft.';

    const thesisSummary = request.thesisSummary
      ? `
Thesis scope: ${request.thesisSummary.scope ?? 'N/A'}
Tone guidelines: ${request.thesisSummary.toneGuidelines ?? 'N/A'}
Core argument: ${request.thesisSummary.coreArgument ?? 'N/A'}
`
      : 'No thesis summary available.';

    const selectionInfo = request.selectionRange
      ? `
Selected text range: characters ${request.selectionRange.from} to ${request.selectionRange.to}
Selected content: ${request.currentHtml.substring(request.selectionRange.from, request.selectionRange.to)}`
      : 'No text selected.';

    const userPrompt = `
Project: ${project.title}
Section ID: ${request.sectionId}
Citation style: ${project.citationStyle}

${thesisSummary}

Current document HTML:
${request.currentHtml}

${selectionInfo}

Available citations:
${citationSummary}

User command: "${request.command}"

Instructions:
- Analyze the command and determine the best edit operation
- Generate appropriate content that fulfills the command
- Preserve all citation placeholders
- Maintain academic tone
- Return ONLY valid JSON in the specified format
`;

    const response = await withRetry(
      () => generateChatCompletion({
        systemPrompt,
        userPrompt,
        maxTokens: request.maxTokens,
        temperature: 0.3
      }),
      {
        maxRetries: 2,
        retryableErrors: [ErrorCode.AI_SERVICE_ERROR, ErrorCode.EXTERNAL_SERVICE_UNAVAILABLE]
      }
    );

    // Parse AI response
    let cleanedOutput = response.output
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
      .trim();

    // Remove markdown code blocks if present
    if (cleanedOutput.startsWith('```json')) {
      cleanedOutput = cleanedOutput.replace(/^```json\s*/, '').replace(/```\s*$/, '');
    } else if (cleanedOutput.startsWith('```')) {
      cleanedOutput = cleanedOutput.replace(/^```\s*/, '').replace(/```\s*$/, '');
    }

    let parsed: { operation: EditOperation; reasoning: string };
    try {
      parsed = JSON.parse(cleanedOutput);
    } catch (parseError) {
      throw new AIServiceError(
        ErrorCode.AI_SERVICE_ERROR,
        `Failed to parse AI response as JSON: ${(parseError as Error).message}`,
        { userId: ownerId, rawOutput: cleanedOutput.substring(0, 200) }
      );
    }

    if (!parsed.operation || !parsed.reasoning) {
      throw new AIServiceError(
        ErrorCode.AI_SERVICE_ERROR,
        'AI response missing required fields: operation or reasoning',
        { userId: ownerId, parsedResponse: parsed }
      );
    }

    const duration = performance.now() - startTime;

    logger.logMetrics('process_ai_command', duration, {
      userId: ownerId,
      projectId: request.projectId,
      sectionId: request.sectionId
    }, {
      command: request.command,
      operationType: parsed.operation.type,
      tokenUsage: response.usage
    });

    return {
      operation: parsed.operation,
      reasoning: parsed.reasoning,
      tokenUsage: response.usage,
      latencyMs: response.latencyMs
    };
  } catch (error) {
    if (error instanceof ThesisError) {
      throw error;
    }

    const thesisError = ErrorFactory.fromUnknown(error, ErrorCode.AI_SERVICE_ERROR, {
      userId: ownerId,
      projectId: request.projectId,
      sectionId: request.sectionId,
      additionalData: {
        operation: 'process_ai_command',
        command: request.command
      }
    });

    logger.error('AI command processing failed', thesisError);
    throw thesisError;
  }
}
