import type {
  SectionDraftRequest,
  SectionDraftResponse
} from '@thesis-copilot/shared';
import { generateChatCompletion } from '../ai/openrouter.js';

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
