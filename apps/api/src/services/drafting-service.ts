import type {
  RewriteDraftRequest,
  RewriteDraftResponse,
  SectionDraftRequest,
  SectionDraftResponse
} from '@thesis-copilot/shared';
import { generateChatCompletion } from '../ai/openrouter.js';
import { getProject } from './project-service.js';

export async function generateSectionDraft(
  _ownerId: string,
  request: SectionDraftRequest
): Promise<SectionDraftResponse> {
  // TODO: enforce owner permissions when persistence layer exists
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

  const response = await generateChatCompletion({
    systemPrompt,
    userPrompt,
    maxTokens: request.maxTokens,
    temperature: 0.35
  });

  const usedChunkIds = request.chunks.map((chunk) => chunk.id);

  return {
    draft: response.output,
    usedChunkIds,
    tokenUsage: response.usage,
    latencyMs: response.latencyMs
  };
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
    const parsed = JSON.parse(response.output) as {
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
