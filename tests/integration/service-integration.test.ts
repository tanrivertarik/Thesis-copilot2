/**
 * Comprehensive Service Integration Tests
 * 
 * Tests the integration between services with error handling scenarios.
 * Uses Firebase emulator for isolated testing.
 */

import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { randomUUID } from 'crypto';
import { 
  setupFirebaseEmulator, 
  clearFirestoreData,
  createTestUser
} from '../emulator/utils.js';
import { 
  createSource,
  uploadSourceContent,
  ingestSource,
  listSources
} from '../../apps/api/src/services/source-service.js';
import { performRetrieval } from '../../apps/api/src/services/retrieval-service.js';
import { generateSectionDraft } from '../../apps/api/src/services/drafting-service.js';
import { createProject } from '../../apps/api/src/services/project-service.js';
import { ErrorCode, ValidationError, AIServiceError } from '../../apps/api/src/utils/errors.js';

// Mock OpenRouter to avoid external API calls during testing
const mockOpenRouter = {
  generateChatCompletion: vi.fn(),
  createEmbeddings: vi.fn()
};

vi.mock('../../apps/api/src/ai/openrouter.js', () => mockOpenRouter);

describe('Service Integration Tests', () => {
  let testUserId: string;
  let testProjectId: string;

  beforeAll(async () => {
    await setupFirebaseEmulator();
  });

  beforeEach(async () => {
    await clearFirestoreData();
    
    // Create test user and project
    testUserId = await createTestUser();
    
    const project = await createProject(testUserId, {
      title: 'Integration Test Project',
      topic: 'AI tools in academic research',
      researchQuestions: ['How do AI tools improve research efficiency?'],
      citationStyle: 'APA',
      constitution: {
        scope: 'Test academic research scope',
        coreArgument: 'AI tools improve research efficiency',
        toneGuidelines: 'Formal academic tone with clear citations',
        outline: {
          sections: [
            {
              id: 'literature-review',
              title: 'Literature Review',
              objective: 'Review existing research on AI tools',
              expectedLength: 1000
            }
          ]
        }
      }
    });
    
    testProjectId = project.id;
  });

  describe('Happy Path: Complete Workflow', () => {
    
    it('should complete full source-to-draft workflow', async () => {
      // Mock successful AI responses
      mockOpenRouter.createEmbeddings.mockResolvedValue({
        embeddings: [new Array(1536).fill(0.1)],
        usage: { prompt_tokens: 10, total_tokens: 10 }
      });
      
      mockOpenRouter.generateChatCompletion.mockResolvedValue({
        output: 'This is a generated thesis section about [CITE:chunk-1] the research findings.',
        usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
        latencyMs: 1200
      });

      // Step 1: Create a source
      const source = await createSource(testUserId, {
        projectId: testProjectId,
        kind: 'research_paper',
        metadata: {
          title: 'AI in Academic Research',
          authors: ['Dr. Jane Smith', 'Prof. John Doe'],
          year: 2024,
          url: 'https://example.com/ai-research.pdf'
        }
      });
      
      expect(source).toMatchObject({
        projectId: testProjectId,
        kind: 'research_paper',
        status: 'UPLOADED',
        ownerId: testUserId
      });

      // Step 2: Upload source content
      const sampleContent = `
        Abstract
        
        This paper investigates the transformative effects of artificial intelligence
        on academic research methodologies. Our study demonstrates that AI-powered tools
        can significantly enhance research efficiency and output quality.
        
        Introduction
        
        The integration of AI in academic research represents a paradigm shift.
        Machine learning algorithms can process vast datasets, identify patterns,
        and generate insights that would take human researchers considerably longer.
        
        Methodology
        
        We analyzed 200 research projects across multiple disciplines, comparing
        traditional research methods with AI-enhanced approaches. Key metrics
        included time efficiency, result accuracy, and researcher satisfaction.
        
        Results
        
        Our findings indicate a 45% improvement in research efficiency and
        35% increase in output quality when AI tools are properly integrated.
        Researchers reported higher job satisfaction and reduced cognitive load.
        
        Discussion
        
        The results suggest that AI serves as an effective research multiplier.
        However, proper training and ethical guidelines are essential for
        successful implementation.
        
        Conclusion
        
        AI tools represent a significant opportunity for enhancing academic
        productivity while maintaining research integrity and quality.
      `;

      const uploadResult = await uploadSourceContent(testUserId, source.id, {
        data: sampleContent,
        mimeType: 'text/plain'
      });
      
      expect(uploadResult).toBe(true);

      // Step 3: Ingest the source
      const ingestionResult = await ingestSource(testUserId, source.id);
      
      expect(ingestionResult).toMatchObject({
        sourceId: source.id,
        status: 'COMPLETED',
        totalChunks: expect.any(Number),
        chunksProcessed: expect.any(Number)
      });
      
      expect(ingestionResult!.totalChunks).toBeGreaterThan(0);
      expect(mockOpenRouter.createEmbeddings).toHaveBeenCalled();

      // Step 4: Perform retrieval
      const retrievalResult = await performRetrieval(testUserId, {
        projectId: testProjectId,
        query: 'AI tools research efficiency improvement',
        limit: 5
      });
      
      expect(retrievalResult).toMatchObject({
        query: expect.objectContaining({
          query: 'AI tools research efficiency improvement'
        }),
        chunks: expect.arrayContaining([
          expect.objectContaining({
            text: expect.any(String),
            score: expect.any(Number),
            citation: expect.any(String)
          })
        ])
      });
      
      expect(retrievalResult.chunks.length).toBeGreaterThan(0);

      // Step 5: Generate draft
      const draftResult = await generateSectionDraft(testUserId, {
        projectId: testProjectId,
        sectionId: 'literature-review',
        section: {
          title: 'Literature Review',
          objective: 'Review existing research on AI tools in academic research'
        },
        chunks: retrievalResult.chunks.slice(0, 3),
        maxTokens: 500,
        citationStyle: 'APA'
      });
      
      expect(draftResult).toMatchObject({
        draft: expect.stringContaining('[CITE:'),
        usedChunkIds: expect.arrayContaining([expect.any(String)]),
        tokenUsage: expect.objectContaining({
          total_tokens: expect.any(Number)
        }),
        latencyMs: expect.any(Number)
      });
      
      expect(mockOpenRouter.generateChatCompletion).toHaveBeenCalledWith(
        expect.objectContaining({
          systemPrompt: expect.stringContaining('Thesis Copilot'),
          userPrompt: expect.stringContaining('Literature Review'),
          maxTokens: 500,
          temperature: 0.35
        })
      );

      // Step 6: Verify source listing
      const sources = await listSources(testUserId, testProjectId);
      expect(sources).toHaveLength(1);
      expect(sources[0].status).toBe('COMPLETED');
    });

  });

  describe('Error Handling Scenarios', () => {

    it('should handle validation errors in source creation', async () => {
      await expect(
        createSource(testUserId, {
          projectId: '', // Invalid project ID
          kind: 'research_paper',
          metadata: { title: 'Test', authors: [], year: 2024 }
        })
      ).rejects.toThrow();
    });

    it('should handle AI service failures with retry', async () => {
      // Create and upload source
      const source = await createSource(testUserId, {
        projectId: testProjectId,
        kind: 'research_paper',
        metadata: { title: 'Test Paper', authors: ['Test'], year: 2024 }
      });

      await uploadSourceContent(testUserId, source.id, {
        data: 'Sample content for retry test.',
        mimeType: 'text/plain'
      });

      // Mock AI service failure then success
      mockOpenRouter.createEmbeddings
        .mockRejectedValueOnce(new Error('Service temporarily unavailable'))
        .mockResolvedValue({
          embeddings: [new Array(1536).fill(0.2)],
          usage: { prompt_tokens: 10, total_tokens: 10 }
        });

      // Should succeed after retry
      const result = await ingestSource(testUserId, source.id);
      expect(result?.status).toBe('COMPLETED');
      
      // Verify retry occurred
      expect(mockOpenRouter.createEmbeddings).toHaveBeenCalledTimes(2);
    });

    it('should handle retrieval validation errors', async () => {
      await expect(
        performRetrieval(testUserId, {
          projectId: testProjectId,
          query: '', // Empty query
          limit: 5
        })
      ).rejects.toThrow(ValidationError);
      
      await expect(
        performRetrieval(testUserId, {
          projectId: testProjectId,
          query: 'valid query',
          limit: 0 // Invalid limit
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should handle drafting validation errors', async () => {
      await expect(
        generateSectionDraft(testUserId, {
          projectId: '', // Invalid project ID
          sectionId: 'test',
          section: { title: 'Test', objective: 'Test' },
          chunks: [],
          maxTokens: 500
        })
      ).rejects.toThrow(ValidationError);
      
      await expect(
        generateSectionDraft(testUserId, {
          projectId: testProjectId,
          sectionId: 'test',
          section: { title: '', objective: '' }, // Missing title/objective
          chunks: [{ id: 'test', sourceId: 'test', text: 'test', embedding: [] }],
          maxTokens: 500
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should handle non-existent source access', async () => {
      const nonExistentId = randomUUID();
      
      const uploadResult = await uploadSourceContent(testUserId, nonExistentId, {
        data: 'test content',
        mimeType: 'text/plain'
      });
      
      expect(uploadResult).toBe(false);
      
      const ingestResult = await ingestSource(testUserId, nonExistentId);
      expect(ingestResult).toBeNull();
    });

    it('should handle AI service errors in drafting', async () => {
      // Create source and retrieval setup
      const source = await createSource(testUserId, {
        projectId: testProjectId,
        kind: 'research_paper',
        metadata: { title: 'Test', authors: ['Test'], year: 2024 }
      });

      await uploadSourceContent(testUserId, source.id, {
        data: 'Test content for drafting error test.',
        mimeType: 'text/plain'
      });

      mockOpenRouter.createEmbeddings.mockResolvedValue({
        embeddings: [new Array(1536).fill(0.3)],
        usage: { prompt_tokens: 10, total_tokens: 10 }
      });

      await ingestSource(testUserId, source.id);
      
      const chunks = await performRetrieval(testUserId, {
        projectId: testProjectId,
        query: 'test query',
        limit: 3
      });

      // Mock AI drafting failure
      mockOpenRouter.generateChatCompletion.mockRejectedValue(
        new Error('AI service unavailable')
      );

      await expect(
        generateSectionDraft(testUserId, {
          projectId: testProjectId,
          sectionId: 'test-section',
          section: { title: 'Test', objective: 'Test objective' },
          chunks: chunks.chunks,
          maxTokens: 500
        })
      ).rejects.toThrow();
    });

  });

  describe('Data Consistency', () => {
    
    it('should maintain consistent source status through workflow', async () => {
      const source = await createSource(testUserId, {
        projectId: testProjectId,
        kind: 'research_paper',
        metadata: { title: 'Consistency Test', authors: ['Test'], year: 2024 }
      });
      
      // Initially should be UPLOADED
      expect(source.status).toBe('UPLOADED');
      
      // After upload, should be PROCESSING
      await uploadSourceContent(testUserId, source.id, {
        data: 'Test content',
        mimeType: 'text/plain'
      });
      
      let sources = await listSources(testUserId, testProjectId);
      expect(sources[0].status).toBe('PROCESSING');
      
      // After ingestion, should be COMPLETED
      mockOpenRouter.createEmbeddings.mockResolvedValue({
        embeddings: [new Array(1536).fill(0.4)],
        usage: { prompt_tokens: 10, total_tokens: 10 }
      });
      
      await ingestSource(testUserId, source.id);
      
      sources = await listSources(testUserId, testProjectId);
      expect(sources[0].status).toBe('COMPLETED');
    });

    it('should handle multiple concurrent source operations', async () => {
      const sourcePromises = Array.from({ length: 3 }, (_, i) =>
        createSource(testUserId, {
          projectId: testProjectId,
          kind: 'research_paper',
          metadata: {
            title: `Concurrent Test ${i}`,
            authors: ['Test'],
            year: 2024
          }
        })
      );

      const sources = await Promise.all(sourcePromises);
      
      expect(sources).toHaveLength(3);
      expect(new Set(sources.map(s => s.id)).size).toBe(3); // All unique IDs
      
      const listedSources = await listSources(testUserId, testProjectId);
      expect(listedSources).toHaveLength(3);
    });

  });

  describe('Performance and Edge Cases', () => {
    
    it('should handle large text content processing', async () => {
      const source = await createSource(testUserId, {
        projectId: testProjectId,
        kind: 'research_paper',
        metadata: { title: 'Large Content Test', authors: ['Test'], year: 2024 }
      });

      // Generate large content (simulate a large research paper)
      const largeContent = Array.from({ length: 100 }, (_, i) => `
        Section ${i + 1}
        
        This is a large section of content with multiple paragraphs and detailed
        information about research findings, methodologies, and conclusions.
        The content includes various technical terms, citations, and complex
        academic language that would be typical in a research paper.
        
        Additional paragraph with more detailed information about the research
        methodology and findings that contribute to the overall understanding
        of the subject matter being investigated.
      `).join('\n');

      await uploadSourceContent(testUserId, source.id, {
        data: largeContent,
        mimeType: 'text/plain'
      });

      mockOpenRouter.createEmbeddings.mockResolvedValue({
        embeddings: [new Array(1536).fill(0.5)],
        usage: { prompt_tokens: 100, total_tokens: 100 }
      });

      const result = await ingestSource(testUserId, source.id);
      
      expect(result?.status).toBe('COMPLETED');
      expect(result?.totalChunks).toBeGreaterThan(10); // Should create multiple chunks
    });

    it('should handle retrieval with no embeddings (fallback)', async () => {
      const source = await createSource(testUserId, {
        projectId: testProjectId,
        kind: 'research_paper',
        metadata: { title: 'No Embeddings Test', authors: ['Test'], year: 2024 }
      });

      await uploadSourceContent(testUserId, source.id, {
        data: 'Simple content without embeddings.',
        mimeType: 'text/plain'
      });

      // Don't ingest (no embeddings created)
      // This should trigger fallback retrieval
      
      const result = await performRetrieval(testUserId, {
        projectId: testProjectId,
        query: 'any query',
        limit: 3
      });

      expect(result.chunks.length).toBe(0); // No chunks without ingestion
    });

  });

});