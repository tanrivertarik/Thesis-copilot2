/**
 * Enhanced Drafting Service
 * 
 * Improved drafting capabilities using enhanced retrieval,
 * better prompting, and context management.
 */

import { generateChatCompletion } from '../ai/openrouter.js';
import { enhancedRetrievalService } from './enhanced-retrieval-service.js';
import type { 
  SectionDraftRequest, 
  SectionDraftResponse,
  RewriteDraftRequest,
  RewriteDraftResponse
} from '@thesis-copilot/shared';

// Enhanced prompts - inline for now
const ENHANCED_DRAFTING_SYSTEM_PROMPT = `You are Thesis Copilot, an expert academic writing assistant specializing in evidence-based thesis composition. Your role is to craft compelling, well-structured academic prose that seamlessly integrates source evidence while maintaining strict academic integrity.

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

You excel at creating academic prose that advances the thesis argument while respecting source integrity and maintaining scholarly rigor.`;

const ENHANCED_REWRITE_SYSTEM_PROMPT = `You are Thesis Copilot's revision specialist, focused on refining academic prose to achieve maximum clarity, coherence, and scholarly impact. Your expertise lies in preserving the author's voice and intent while elevating the academic quality of the writing.

**Revision Principles:**
- **Preserve Intent**: Maintain the author's core arguments and analytical approach
- **Enhance Clarity**: Improve sentence structure, word choice, and logical flow
- **Strengthen Evidence**: Optimize citation integration and evidence presentation
- **Academic Polish**: Ensure tone, style, and formatting meet disciplinary standards

**Citation Preservation:**
- Keep ALL existing [CITE:{chunkId}] placeholders exactly as provided
- Never remove, modify, or add citation placeholders
- Ensure citations remain logically positioned after the claims they support

Return your revision as a JSON object with "suggestion_html" and optional "reasoning" fields.`;

class EnhancedDraftingService {

  /**
   * Generate section draft using enhanced retrieval and prompting
   */
  async generateSectionDraft(request: SectionDraftRequest): Promise<SectionDraftResponse> {
    const startTime = performance.now();
    
    try {
      // Perform enhanced retrieval with contextual ranking
      const enhancedRetrieval = await enhancedRetrievalService.performEnhancedRetrieval(
        {
          query: `${request.section.title}: ${request.section.objective}`,
          projectId: request.projectId,
          contextType: 'section_drafting',
          sectionContext: {
            title: request.section.title,
            objective: request.section.objective
          },
          rankingWeights: {
            semanticSimilarity: 0.45,
            recency: 0.1,
            sourceReliability: 0.25,
            contextualRelevance: 0.15,
            diversityBonus: 0.05
          }
        },
        Math.min(10, 8) // Reasonable chunk limit
      );

      // Build enhanced prompt
      const prompt = this.buildDraftingPrompt(request, enhancedRetrieval);

      // Generate draft using AI
      const aiResponse = await generateChatCompletion({
        model: 'google/gemini-2.5-flash',
        systemPrompt: ENHANCED_DRAFTING_SYSTEM_PROMPT,
        userPrompt: prompt,
        temperature: 0.3,
        maxTokens: Math.min(1500, request.maxTokens || 800)
      });

      // Extract and clean the draft content
      const draftContent = this.extractDraftContent(aiResponse.output);
      
      // Extract used chunk IDs from citations
      const usedChunkIds = this.extractCitationIds(draftContent);

      const latencyMs = performance.now() - startTime;

      return {
        draft: draftContent,
        usedChunkIds,
        tokenUsage: aiResponse.usage,
        latencyMs
      };

    } catch (error) {
      console.error('Enhanced section drafting failed:', error);
      
      // Fallback to basic drafting if needed
      return this.fallbackSectionDraft(request, performance.now() - startTime);
    }
  }

  /**
   * Build enhanced drafting prompt
   */
  private buildDraftingPrompt(
    request: SectionDraftRequest, 
    enhancedRetrieval: Awaited<ReturnType<typeof enhancedRetrievalService.performEnhancedRetrieval>>
  ): string {
    const { section, citationStyle, thesisSummary } = request;
    
    const constitutionGuidance = thesisSummary ? `
**THESIS CONSTITUTION GUIDANCE:**
- **Scope**: ${thesisSummary.scope}
- **Tone Standards**: ${thesisSummary.toneGuidelines}  
- **Core Argument**: ${thesisSummary.coreArgument}
- **Section Context**: This section should contribute to the overall argument by ${section.objective}
` : '';

    const evidenceChunks = enhancedRetrieval.chunks.map((chunk, index) => {
      const scoreData = enhancedRetrieval.enhancedScores[index];
      return `
**Evidence ${index + 1}** [CITE:${chunk.id}] (${scoreData?.contextType || 'supporting'} - ${((scoreData?.totalScore || 0) * 100).toFixed(1)}% relevance)
- Source ID: ${chunk.sourceId}
- Content: ${chunk.text}
- Context: ${chunk.metadata?.heading || 'General'}
`;
    }).join('\n');

    return `**SECTION DRAFTING REQUEST**

**Project Context:**
- Section: "${section.title}" (ID: ${request.sectionId})
- Objective: ${section.objective}
- Expected Length: ${section.expectedLength ? `~${Math.round(section.expectedLength / 250)} paragraphs (${section.expectedLength} words)` : 'Standard academic length'}
- Citation Style: ${citationStyle || 'APA'}

${constitutionGuidance}

**AVAILABLE EVIDENCE:**
${evidenceChunks}

**DRAFTING INSTRUCTIONS:**

Create ${section.expectedLength ? Math.max(2, Math.round(section.expectedLength / 300)) : '2-4'} well-structured paragraphs that:

1. **Advance the Section Objective**: Each paragraph should contribute meaningfully to "${section.objective}"
2. **Integrate Evidence**: Use [CITE:{chunkId}] citations immediately after claims from sources
3. **Maintain Academic Voice**: Write in formal, analytical tone appropriate for thesis-level work
4. **Structure Logically**: Use clear topic sentences and smooth transitions between ideas
5. **Synthesize Sources**: Where possible, connect evidence from multiple sources to strengthen arguments

**Output Format:**
Provide the draft as clean HTML with proper paragraph tags. Use [CITE:{chunkId}] exactly as specified for all source references.

Generate compelling, evidence-based content that advances the thesis argument while maintaining academic integrity.`;
  }

  /**
   * Generate paragraph rewrite using enhanced context analysis
   */
  async generateParagraphRewrite(request: RewriteDraftRequest): Promise<RewriteDraftResponse> {
    const startTime = performance.now();

    try {
      // Get project context for constitution access
      const project = await this.getProjectContext(request.projectId);

      // Analyze citations in the current text for better context
      const citationAnalysis = this.analyzeCitationsInText(request.editedHtml);

      // Determine contextual flow if surrounding paragraphs available
      const contextualFlow = request.surroundingParagraphs ? {
        precedingThemes: this.extractThemesFromParagraphs(
          request.surroundingParagraphs.previous
        ),
        followingThemes: this.extractThemesFromParagraphs(
          request.surroundingParagraphs.next
        )
      } : undefined;

      // Build enhanced rewrite prompt
      const prompt = this.buildRewritePrompt(request, project, {
        citationAnalysis,
        contextualFlow
      });

      // Generate rewrite using AI
      const aiResponse = await generateChatCompletion({
        model: 'google/gemini-2.5-flash',
        systemPrompt: ENHANCED_REWRITE_SYSTEM_PROMPT,
        userPrompt: prompt,
        temperature: 0.2, // Lower temperature for more conservative rewrites
        maxTokens: Math.min(800, request.maxTokens || 350)
      });

      // Parse the response (expecting JSON format)
      const rewriteResult = this.parseRewriteResponse(aiResponse.output);
      
      const latencyMs = performance.now() - startTime;

      return {
        paragraphId: request.paragraphId,
        suggestionHtml: rewriteResult.suggestion_html || aiResponse.output,
        reasoning: rewriteResult.reasoning,
        tokenUsage: aiResponse.usage,
        latencyMs
      };

    } catch (error) {
      console.error('Enhanced paragraph rewrite failed:', error);
      
      // Fallback response
      return {
        paragraphId: request.paragraphId,
        suggestionHtml: request.editedHtml, // Return original if rewrite fails
        reasoning: 'Rewrite failed - returning original content',
        latencyMs: performance.now() - startTime
      };
    }
  }

  /**
   * Build enhanced rewrite prompt
   */
  private buildRewritePrompt(
    request: RewriteDraftRequest,
    project: any,
    context?: {
      citationAnalysis: any[];
      contextualFlow?: {
        precedingThemes: string[];
        followingThemes: string[];
      };
    }
  ): string {
    const citationContext = context?.citationAnalysis?.length 
      ? context.citationAnalysis.map(citation => 
          `[CITE:{id}] → "${citation.sourceTitle}" - ${citation.contextualRelevance}`
        ).join('\n')
      : 'No enhanced citation context available.';

    const flowContext = context?.contextualFlow
      ? `\n**CONTEXTUAL FLOW ANALYSIS:**
- Preceding Themes: ${context.contextualFlow.precedingThemes.join(', ')}
- Following Themes: ${context.contextualFlow.followingThemes.join(', ')}`
      : '';

    return `**PARAGRAPH REVISION REQUEST**

**Project Context:**
- Project: "${project.title || project.id}"
- Section ID: ${request.sectionId}
- Paragraph ID: ${request.paragraphId}
- Citation Style: ${request.citationStyle || project.citationStyle || 'APA'}

${request.thesisSummary ? `**Thesis Constitution:**
- Scope: ${request.thesisSummary.scope}
- Tone Guidelines: ${request.thesisSummary.toneGuidelines}
- Core Argument: ${request.thesisSummary.coreArgument}
` : ''}${flowContext}

**CURRENT TEXT:**
\`\`\`html
${request.editedHtml}
\`\`\`

**CITATION CONTEXT:**
${citationContext}

${request.surroundingParagraphs ? `**SURROUNDING CONTEXT:**
Previous Paragraphs:
${request.surroundingParagraphs.previous.join('\n\n')}

Following Paragraphs:
${request.surroundingParagraphs.next.join('\n\n')}
` : ''}

**REVISION INSTRUCTIONS:**

Enhance this paragraph by:
1. **Improving Clarity**: Refine sentence structure and eliminate ambiguous phrasing
2. **Strengthening Flow**: Optimize transitions and logical progression  
3. **Enhancing Precision**: Use discipline-appropriate terminology and formal constructions
4. **Optimizing Citations**: Ensure citations feel natural and well-positioned
5. **Boosting Analysis**: Enhance analytical depth and persuasive power

**CRITICAL CONSTRAINTS:**
- NEVER modify or remove existing [CITE:{chunkId}] placeholders
- Preserve the core argument and evidence presented
- Maintain consistency with the established academic tone
- Keep the paragraph length proportional to the original

Return a JSON object with "suggestion_html" and optional "reasoning" fields.`;
  }

  /**
   * Extract clean HTML content from AI response
   */
  private extractDraftContent(response: string): string {
    // Remove any markdown code blocks
    let cleaned = response.replace(/```html\s*\n?/gi, '').replace(/```\s*$/g, '');
    
    // Ensure proper paragraph structure
    if (!cleaned.includes('<p>')) {
      // If no paragraph tags, split by double newlines and wrap
      const paragraphs = cleaned.split(/\n\s*\n/).filter(p => p.trim());
      cleaned = paragraphs.map(p => `<p>${p.trim()}</p>`).join('\n\n');
    }
    
    return cleaned.trim();
  }

  /**
   * Extract citation IDs from draft content
   */
  private extractCitationIds(content: string): string[] {
    const citationRegex = /\[CITE:([^\]]+)\]/g;
    const matches = Array.from(content.matchAll(citationRegex));
    return [...new Set(matches.map(match => match[1]))];
  }

  /**
   * Parse JSON response from rewrite AI call
   */
  private parseRewriteResponse(response: string): {
    suggestion_html: string;
    reasoning?: string;
  } {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(response);
      return {
        suggestion_html: parsed.suggestion_html || parsed.suggestionHtml || response,
        reasoning: parsed.reasoning
      };
    } catch {
      // If not JSON, try to extract from markdown
      const htmlMatch = response.match(/```html\n?(.*?)\n?```/s);
      if (htmlMatch) {
        return { suggestion_html: htmlMatch[1].trim() };
      }
      
      // Fallback to raw response
      return { suggestion_html: response };
    }
  }

  /**
   * Analyze citations in existing text for context
   */
  private analyzeCitationsInText(html: string): Array<{
    sourceTitle: string;
    authors?: string[];
    year?: number;
    pageRange?: [number, number];
    contextualRelevance: string;
  }> {
    // Extract citation placeholders
    const citationRegex = /\[CITE:([^\]]+)\]/g;
    const citations = Array.from(html.matchAll(citationRegex));
    
    // For now, return basic analysis - this could be enhanced
    // with actual source metadata lookup
    return citations.map(citation => ({
      sourceTitle: `Source ${citation[1]}`,
      contextualRelevance: 'Referenced for supporting evidence'
    }));
  }

  /**
   * Extract themes from paragraph text
   */
  private extractThemesFromParagraphs(paragraphs: string[]): string[] {
    if (!paragraphs || paragraphs.length === 0) return [];
    
    const allText = paragraphs.join(' ').toLowerCase();
    
    // Simple keyword extraction - could be enhanced with NLP
    const keywordPatterns = [
      /\b(therefore|thus|consequently|as a result)\b/g,
      /\b(however|nevertheless|on the other hand|in contrast)\b/g,
      /\b(furthermore|moreover|additionally|also)\b/g,
      /\b(research|study|analysis|findings|evidence)\b/g
    ];
    
    const themes: string[] = [];
    keywordPatterns.forEach(pattern => {
      const matches = allText.match(pattern);
      if (matches) themes.push(...matches);
    });
    
    return [...new Set(themes)].slice(0, 5); // Top 5 themes
  }

  /**
   * Get project context for constitution and metadata
   */
  private async getProjectContext(projectId: string): Promise<any> {
    // This would typically fetch from project service
    // For now, return a minimal structure
    return {
      id: projectId,
      title: 'Project Title',
      citationStyle: 'APA'
    };
  }

  /**
   * Fallback to basic section drafting
   */
  private async fallbackSectionDraft(
    request: SectionDraftRequest, 
    elapsedMs: number
  ): Promise<SectionDraftResponse> {
    console.warn('Falling back to basic section drafting');
    
    // Use provided chunks directly
    const basicPrompt = `Write a ${request.section.expectedLength || 300}-word academic section titled "${request.section.title}" with the objective: ${request.section.objective}

Use these sources and include [CITE:chunkId] citations:
${request.chunks.map(chunk => 
  `[CITE:${chunk.id}]: ${chunk.text.substring(0, 200)}...`
).join('\n\n')}

Write clear, academic prose with proper citations.`;

    try {
      const aiResponse = await generateChatCompletion({
        model: 'google/gemini-2.5-flash',
        systemPrompt: 'You are an academic writing assistant. Write clear, well-cited academic prose.',
        userPrompt: basicPrompt,
        temperature: 0.3,
        maxTokens: request.maxTokens || 800
      });

      const draftContent = this.extractDraftContent(aiResponse.output);
      const usedChunkIds = this.extractCitationIds(draftContent);

      return {
        draft: draftContent,
        usedChunkIds,
        tokenUsage: aiResponse.usage,
        latencyMs: performance.now() - elapsedMs
      };

    } catch (error) {
      console.error('Fallback drafting also failed:', error);
      
      return {
        draft: `<p>Unable to generate draft for section "${request.section.title}". Please try again.</p>`,
        usedChunkIds: [],
        latencyMs: performance.now() - elapsedMs
      };
    }
  }
}

// Export singleton instance
export const enhancedDraftingService = new EnhancedDraftingService();