/**
 * Enhanced Drafting Prompts
 * 
 * Improved prompting system for better source retrieval relevance, 
 * context window management, and citation formatting.
 */

import type { 
  SectionDraftRequest, 
  RewriteDraftRequest,
  ThesisConstitution 
} from '@thesis-copilot/shared';

export interface EnhancedDraftingContext {
  request: SectionDraftRequest;
  constitution?: ThesisConstitution;
  contextualChunks?: Array<{
    chunk: any;
    relevanceScore: number;
    contextType: 'primary' | 'supporting' | 'contrasting';
  }>;
}

export interface CitationEnhancement {
  sourceTitle: string;
  authors?: string[];
  year?: number;
  pageRange?: [number, number];
  contextualRelevance: string;
}

export const ENHANCED_DRAFTING_SYSTEM_PROMPT = `You are Thesis Copilot, an expert academic writing assistant specializing in evidence-based thesis composition. Your role is to craft compelling, well-structured academic prose that seamlessly integrates source evidence while maintaining strict academic integrity.

**Core Principles:**
- **Source Fidelity**: Use ONLY the provided source excerpts - never invent or hallucinate information
- **Citation Precision**: Insert [CITE:{chunkId}] exactly where claims originate from sources
- **Academic Voice**: Maintain formal, analytical tone appropriate for the specified academic level  
- **Logical Flow**: Structure arguments with clear reasoning and smooth transitions
- **Evidence Integration**: Weave citations naturally into the narrative, not as afterthoughts

**Citation Guidelines:**
- Place citations immediately after claims, not at paragraph ends
- Use multiple sources to support major arguments when available
- Acknowledge limitations and gaps in evidence explicitly
- Maintain consistent citation style throughout

**Quality Standards:**
- Prioritize clarity and precision over complexity
- Use topic sentences that clearly state paragraph objectives
- Employ transitional phrases to connect ideas across paragraphs
- Balance evidence presentation with critical analysis

You excel at creating academic prose that advances the thesis argument while respecting source integrity and maintaining scholarly rigor.`;

export const buildEnhancedDraftingPrompt = (context: EnhancedDraftingContext): string => {
  const { request, constitution, contextualChunks } = context;
  const { section, citationStyle, thesisSummary } = request;

  // Organize chunks by relevance and context type
  const primarySources = contextualChunks?.filter(c => c.contextType === 'primary') ?? [];
  const supportingSources = contextualChunks?.filter(c => c.contextType === 'supporting') ?? [];
  const contrastingSources = contextualChunks?.filter(c => c.contextType === 'contrasting') ?? [];

  const formatChunkContext = (chunks: typeof contextualChunks, type: string) => {
    if (!chunks || chunks.length === 0) return '';
    
    return `
**${type.toUpperCase()} EVIDENCE** (${chunks.length} sources):
${chunks.map((item, index) => {
      const chunk = item.chunk;
      return `
Source ${index + 1} [CITE:${chunk.id}] (Relevance: ${(item.relevanceScore * 100).toFixed(1)}%)
- Source: ${chunk.sourceId}
- Context: ${chunk.metadata?.heading || 'General'}
- Content: ${chunk.text}
- Page Range: ${chunk.metadata?.pageRange ? `pp. ${chunk.metadata.pageRange[0]}-${chunk.metadata.pageRange[1]}` : 'N/A'}
`;
    }).join('\n')}`;
  };

  const constitutionGuidance = constitution ? `
**THESIS CONSTITUTION GUIDANCE:**
- **Scope**: ${constitution.scope}
- **Tone Standards**: ${constitution.toneGuidelines}  
- **Core Argument**: ${constitution.coreArgument}
- **Section Context**: This section should contribute to the overall argument by ${section.objective}
` : '';

  const evidenceContext = `
${formatChunkContext(primarySources, 'Primary')}
${formatChunkContext(supportingSources, 'Supporting')}  
${formatChunkContext(contrastingSources, 'Contrasting')}
`.trim();

  return `**SECTION DRAFTING REQUEST**

**Project Context:**
- Project ID: ${request.projectId}
- Section: "${section.title}" (ID: ${request.sectionId})
- Objective: ${section.objective}
- Expected Length: ${section.expectedLength ? `~${Math.round(section.expectedLength / 250)} paragraphs (${section.expectedLength} words)` : 'Standard academic length'}
- Citation Style: ${citationStyle || 'APA'}

${constitutionGuidance}

**SECTION REQUIREMENTS:**
1. Create ${section.expectedLength ? Math.max(2, Math.round(section.expectedLength / 300)) : '2-4'} well-structured paragraphs
2. Each paragraph should advance a specific sub-argument supporting the section objective
3. Integrate evidence from multiple sources where possible
4. Use clear topic sentences and logical transitions
5. Maintain academic tone consistent with thesis constitution

${evidenceContext}

**DRAFTING INSTRUCTIONS:**

**Structure Guidelines:**
- Open with a topic sentence that clearly states the paragraph's contribution to the section objective
- Present evidence in order of strength/relevance, using primary sources first
- Acknowledge contrasting viewpoints or limitations when relevant
- Conclude paragraphs with analysis that connects evidence to the broader argument

**Citation Requirements:**
- Use [CITE:{chunkId}] format immediately after claims from sources
- Multiple citations for major claims: [CITE:chunk1][CITE:chunk2] when sources agree
- Never cite sources not provided in the evidence context above
- Integrate citations naturally into sentence flow, not as appendages

**Quality Expectations:**
- Demonstrate critical thinking by analyzing evidence, not just presenting it
- Use precise academic vocabulary appropriate for the field
- Maintain objectivity while advancing the thesis argument
- Address potential counterarguments or limitations in evidence

**Output Format:**
Provide the draft as clean HTML with proper paragraph tags. Use [CITE:{chunkId}] exactly as specified for all source references.

Generate a compelling, evidence-based section that advances the thesis argument while maintaining the highest standards of academic integrity.`;
};

export const ENHANCED_REWRITE_SYSTEM_PROMPT = `You are Thesis Copilot's revision specialist, focused on refining academic prose to achieve maximum clarity, coherence, and scholarly impact. Your expertise lies in preserving the author's voice and intent while elevating the academic quality of the writing.

**Revision Principles:**
- **Preserve Intent**: Maintain the author's core arguments and analytical approach
- **Enhance Clarity**: Improve sentence structure, word choice, and logical flow
- **Strengthen Evidence**: Optimize citation integration and evidence presentation
- **Academic Polish**: Ensure tone, style, and formatting meet disciplinary standards

**Citation Preservation:**
- Keep ALL existing [CITE:{chunkId}] placeholders exactly as provided
- Never remove, modify, or add citation placeholders
- Ensure citations remain logically positioned after the claims they support

**Revision Focus Areas:**
1. **Logical Flow**: Improve transitions and argument progression
2. **Sentence Clarity**: Eliminate ambiguity and awkward constructions
3. **Academic Voice**: Enhance formal tone while maintaining readability
4. **Evidence Integration**: Make citations feel natural and well-integrated
5. **Precision**: Replace vague language with specific, precise terminology

Return your revision as a JSON object with "suggestion_html" and optional "reasoning" fields.`;

export const buildEnhancedRewritePrompt = (
  request: RewriteDraftRequest,
  project: any,
  enhancedContext?: {
    citationAnalysis: CitationEnhancement[];
    contextualFlow: {
      precedingThemes: string[];
      followingThemes: string[];
    };
  }
): string => {
  const citationContext = enhancedContext?.citationAnalysis
    ? enhancedContext.citationAnalysis.map(citation => 
        `[CITE:{id}] → "${citation.sourceTitle}" ${citation.authors?.join(', ') || ''} ${citation.year ? `(${citation.year})` : ''}
        - Context: ${citation.contextualRelevance}
        - Pages: ${citation.pageRange ? `${citation.pageRange[0]}-${citation.pageRange[1]}` : 'N/A'}`
      ).join('\n')
    : 'No enhanced citation context available.';

  const flowContext = enhancedContext?.contextualFlow
    ? `
**CONTEXTUAL FLOW ANALYSIS:**
- Preceding Themes: ${enhancedContext.contextualFlow.precedingThemes.join(', ')}
- Following Themes: ${enhancedContext.contextualFlow.followingThemes.join(', ')}
    `
    : '';

  return `**PARAGRAPH REVISION REQUEST**

**Project Context:**
- Project: "${project.title}"
- Section ID: ${request.sectionId}
- Paragraph ID: ${request.paragraphId}
- Citation Style: ${request.citationStyle || project.citationStyle}

**Thesis Constitution Reference:**
${request.thesisSummary ? `
- Scope: ${request.thesisSummary.scope}
- Tone Guidelines: ${request.thesisSummary.toneGuidelines}
- Core Argument: ${request.thesisSummary.coreArgument}
` : 'No constitution guidance available.'}

${flowContext}

**CURRENT TEXT:**
\`\`\`html
${request.editedHtml}
\`\`\`

**CITATION CONTEXT:**
${citationContext}

**SURROUNDING CONTEXT:**
${request.surroundingParagraphs ? `
**Previous Paragraphs:**
${request.surroundingParagraphs.previous.join('\n\n')}

**Following Paragraphs:**
${request.surroundingParagraphs.next.join('\n\n')}
` : 'No surrounding context provided.'}

**REVISION INSTRUCTIONS:**

**Priority Areas:**
1. **Clarity Enhancement**: Improve sentence structure and eliminate ambiguous phrasing
2. **Flow Optimization**: Strengthen transitions and logical progression
3. **Academic Precision**: Use discipline-appropriate terminology and formal constructions
4. **Citation Integration**: Ensure citations feel natural and well-positioned
5. **Argument Strength**: Enhance the analytical depth and persuasive power

**Constraints:**
- NEVER modify or remove existing [CITE:{chunkId}] placeholders
- Preserve the core argument and evidence presented
- Maintain consistency with the established academic tone
- Keep the paragraph length and structure proportional to the original

**Quality Standards:**
- Use active voice where appropriate for clarity
- Employ precise academic vocabulary
- Ensure each sentence contributes meaningfully to the argument
- Balance complexity with readability

**Output Format:**
Return a JSON object with:
- "suggestion_html": The revised paragraph as clean HTML
- "reasoning": Brief explanation of key improvements made (optional)

Focus on elevating the academic quality while preserving the author's analytical voice and intent.`;
};

export const CONTEXT_WINDOW_OPTIMIZATION = {
  MAX_TOKENS: {
    SECTION_DRAFT: 4000,
    PARAGRAPH_REWRITE: 2000,
    CITATION_ANALYSIS: 1500
  },
  
  CHUNK_SELECTION: {
    PRIMARY_SOURCES: 5,    // Most relevant chunks
    SUPPORTING_SOURCES: 3, // Additional context
    CONTRASTING_SOURCES: 2 // Alternative viewpoints
  },

  PROMPT_BUDGETING: {
    SYSTEM_PROMPT: 500,
    CONTEXT_INFO: 800,
    EVIDENCE_CHUNKS: 2000,
    INSTRUCTIONS: 700,
    OUTPUT_BUFFER: 1000
  }
} as const;