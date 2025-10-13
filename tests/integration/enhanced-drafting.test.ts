/**
 * Enhanced Drafting Service Integration Test
 * 
 * Tests the enhanced drafting capabilities with improved retrieval,
 * context management, and citation integration.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { enhancedDraftingService } from '../../apps/api/src/services/enhanced-drafting-service.js';
import { enhancedRetrievalService } from '../../apps/api/src/services/enhanced-retrieval-service.js';
import type { SectionDraftRequest, RewriteDraftRequest } from '../../packages/shared/src/index.js';

// Mock data for testing
const mockProject = {
  id: 'test-project-123',
  title: 'Climate Change Impact on Biodiversity',
  ownerId: 'test-user-456'
};

const mockSection = {
  id: 'section-1',
  title: 'Literature Review',
  objective: 'Analyze current research on climate change effects on species diversity and ecosystem stability',
  expectedLength: 800
};

const mockSectionDraftRequest: SectionDraftRequest = {
  projectId: mockProject.id,
  sectionId: mockSection.id,
  section: mockSection,
  thesisSummary: {
    scope: 'Comprehensive analysis of climate change impacts on global biodiversity patterns',
    toneGuidelines: 'Academic, analytical, evidence-based with critical evaluation of sources',
    coreArgument: 'Climate change represents an unprecedented threat to biodiversity requiring immediate conservation action'
  },
  citationStyle: 'APA',
  chunks: [
    {
      id: 'chunk-1',
      sourceId: 'source-1',
      projectId: mockProject.id,
      text: 'Climate change has emerged as one of the most significant drivers of biodiversity loss in the 21st century. Research indicates that rising temperatures and altered precipitation patterns are disrupting ecological communities worldwide, leading to species range shifts, phenological mismatches, and increased extinction risks.',
      metadata: {
        heading: '1. Introduction to Climate-Biodiversity Interactions',
        pageRange: [12, 15] as [number, number]
      }
    },
    {
      id: 'chunk-2', 
      sourceId: 'source-2',
      projectId: mockProject.id,
      text: 'Meta-analysis of 1,598 species across six continents revealed that 41% of species have shifted their geographic ranges poleward at an average rate of 16.9 km per decade. These range shifts are particularly pronounced in high-latitude regions where warming rates exceed the global average.',
      metadata: {
        heading: '2. Range Shift Patterns',
        pageRange: [28, 31] as [number, number]
      }
    }
  ],
  maxTokens: 1200
};

const mockRewriteRequest: RewriteDraftRequest = {
  projectId: mockProject.id,
  sectionId: mockSection.id,
  paragraphId: 'para-1',
  originalHtml: '<p>Climate change affects biodiversity in various ways including habitat loss and species migration.</p>',
  editedHtml: '<p>Climate change significantly impacts biodiversity through multiple mechanisms, primarily habitat degradation and forced species migration [CITE:chunk-1]. These effects are becoming more pronounced as global temperatures continue to rise.</p>',
  citations: [
    {
      placeholder: '[CITE:chunk-1]',
      sourceId: 'chunk-1', 
      sourceTitle: 'Climate Change and Biodiversity Research',
      snippet: 'habitat degradation and forced species migration'
    }
  ],
  thesisSummary: {
    scope: 'Comprehensive analysis of climate change impacts on global biodiversity patterns',
    toneGuidelines: 'Academic, analytical, evidence-based',
    coreArgument: 'Climate change represents an unprecedented threat to biodiversity'
  },
  citationStyle: 'APA',
  surroundingParagraphs: {
    previous: ['<p>The relationship between climate and biodiversity has become a central focus of conservation biology research.</p>'],
    next: ['<p>Understanding these impacts is crucial for developing effective conservation strategies.</p>']
  },
  maxTokens: 400
};

describe('Enhanced Drafting Service Integration', () => {
  
  // Skip integration tests unless explicitly requested
  const runIntegrationTests = process.env.RUN_INTEGRATION_TESTS === 'true';
  
  describe.skipIf(!runIntegrationTests)('Section Draft Generation', () => {
    
    it('should generate enhanced section draft with improved retrieval', async () => {
      const result = await enhancedDraftingService.generateSectionDraft(mockSectionDraftRequest);
      
      expect(result).toMatchObject({
        draft: expect.any(String),
        usedChunkIds: expect.any(Array),
        latencyMs: expect.any(Number)
      });
      
      // Draft should contain HTML paragraphs
      expect(result.draft).toMatch(/<p>/);
      expect(result.draft.length).toBeGreaterThan(200);
      
      // Should include citations from provided chunks
      expect(result.usedChunkIds.length).toBeGreaterThan(0);
      result.usedChunkIds.forEach(chunkId => {
        expect(mockSectionDraftRequest.chunks.some(chunk => chunk.id === chunkId)).toBe(true);
      });
      
      // Should maintain citation format
      const citationMatches = result.draft.match(/\[CITE:[^\]]+\]/g);
      expect(citationMatches).toBeTruthy();
      expect(citationMatches!.length).toBeGreaterThan(0);
      
      console.log('✅ Enhanced section draft generated successfully');
      console.log(`📊 Draft length: ${result.draft.length} characters`);
      console.log(`🔗 Citations used: ${result.usedChunkIds.length}`);
      console.log(`⏱️ Generation time: ${result.latencyMs.toFixed(2)}ms`);
    });
    
    it('should handle section draft with different expected lengths', async () => {
      const shortSectionRequest = {
        ...mockSectionDraftRequest,
        section: {
          ...mockSectionDraftRequest.section,
          expectedLength: 300
        },
        maxTokens: 500
      };
      
      const result = await enhancedDraftingService.generateSectionDraft(shortSectionRequest);
      
      expect(result.draft).toBeTruthy();
      expect(result.draft.length).toBeLessThan(mockSectionDraftRequest.section.expectedLength! * 2);
      
      console.log('✅ Short section draft generated with appropriate length');
    });
    
  });
  
  describe.skipIf(!runIntegrationTests)('Paragraph Rewrite', () => {
    
    it('should generate enhanced paragraph rewrite with context preservation', async () => {
      const result = await enhancedDraftingService.generateParagraphRewrite(mockRewriteRequest);
      
      expect(result).toMatchObject({
        paragraphId: mockRewriteRequest.paragraphId,
        suggestionHtml: expect.any(String),
        latencyMs: expect.any(Number)
      });
      
      // Should preserve existing citations
      const originalCitations = mockRewriteRequest.editedHtml.match(/\[CITE:[^\]]+\]/g) || [];
      const rewrittenCitations = result.suggestionHtml.match(/\[CITE:[^\]]+\]/g) || [];
      
      expect(rewrittenCitations.length).toBeGreaterThanOrEqual(originalCitations.length);
      
      // Should maintain paragraph structure
      expect(result.suggestionHtml).toMatch(/<p>/);
      
      // Should be different from original (indicating actual rewrite)
      expect(result.suggestionHtml).not.toBe(mockRewriteRequest.editedHtml);
      
      console.log('✅ Enhanced paragraph rewrite completed successfully');
      console.log(`📝 Original: ${mockRewriteRequest.editedHtml.length} chars`);
      console.log(`📝 Rewritten: ${result.suggestionHtml.length} chars`);
      console.log(`⏱️ Rewrite time: ${result.latencyMs.toFixed(2)}ms`);
      if (result.reasoning) {
        console.log(`💡 Reasoning: ${result.reasoning.substring(0, 100)}...`);
      }
    });
    
    it('should handle rewrite without surrounding context', async () => {
      const minimalRewriteRequest = {
        ...mockRewriteRequest,
        surroundingParagraphs: undefined
      };
      
      const result = await enhancedDraftingService.generateParagraphRewrite(minimalRewriteRequest);
      
      expect(result.suggestionHtml).toBeTruthy();
      expect(result.paragraphId).toBe(minimalRewriteRequest.paragraphId);
      
      console.log('✅ Rewrite handled successfully without surrounding context');
    });
    
  });
  
  describe.skipIf(!runIntegrationTests)('Enhanced Retrieval Integration', () => {
    
    it('should use enhanced retrieval with contextual ranking', async () => {
      const retrievalResult = await enhancedRetrievalService.performEnhancedRetrieval({
        query: 'climate change biodiversity species migration patterns',
        projectId: mockProject.id,
        contextType: 'section_drafting',
        sectionContext: {
          title: 'Climate Change and Species Migration',
          objective: 'Analyze how climate change drives species migration and range shifts'
        }
      });
      
      expect(retrievalResult).toMatchObject({
        chunks: expect.any(Array),
        query: expect.any(String),
        totalRetrieved: expect.any(Number),
        enhancedScores: expect.any(Array)
      });
      
      // Should provide enhanced scoring information
      if (retrievalResult.enhancedScores.length > 0) {
        const firstScore = retrievalResult.enhancedScores[0];
        expect(firstScore).toMatchObject({
          chunkId: expect.any(String),
          totalScore: expect.any(Number),
          scores: expect.objectContaining({
            semanticSimilarity: expect.any(Number),
            recencyScore: expect.any(Number),
            reliabilityScore: expect.any(Number),
            contextualRelevance: expect.any(Number),
            diversityBonus: expect.any(Number)
          }),
          contextType: expect.stringMatching(/^(primary|supporting|contrasting)$/),
          explanation: expect.any(String)
        });
        
        console.log('✅ Enhanced retrieval with contextual scoring completed');
        console.log(`🎯 Retrieved ${retrievalResult.totalRetrieved} chunks`);
        console.log(`📊 Top score: ${firstScore.totalScore.toFixed(3)} (${firstScore.contextType})`);
        console.log(`💡 Explanation: ${firstScore.explanation}`);
      }
    });
    
  });
  
  describe('Error Handling & Fallbacks', () => {
    
    it('should handle invalid section draft request gracefully', async () => {
      const invalidRequest = {
        ...mockSectionDraftRequest,
        projectId: '', // Invalid project ID
        chunks: [] // No chunks available
      };
      
      const result = await enhancedDraftingService.generateSectionDraft(invalidRequest);
      
      // Should still return a valid response structure
      expect(result).toMatchObject({
        draft: expect.any(String),
        usedChunkIds: expect.any(Array),
        latencyMs: expect.any(Number)
      });
      
      console.log('✅ Error handling for invalid request works correctly');
    });
    
    it('should handle rewrite request with malformed HTML', async () => {
      const malformedRequest = {
        ...mockRewriteRequest,
        editedHtml: 'This is not HTML at all <incomplete tag'
      };
      
      const result = await enhancedDraftingService.generateParagraphRewrite(malformedRequest);
      
      expect(result.paragraphId).toBe(malformedRequest.paragraphId);
      expect(result.suggestionHtml).toBeTruthy();
      
      console.log('✅ Malformed HTML handled gracefully in rewrite');
    });
    
  });
  
});