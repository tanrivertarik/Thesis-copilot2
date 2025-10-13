/**
 * End-to-End Integration Test Suite
 * 
 * Tests the complete workflow from PDF upload to draft generation,
 * including error handling scenarios and edge cases.
 * 
 * Requires Firebase emulator to be running.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'crypto';
import express from 'express';
import { 
  setupFirebaseEmulator, 
  clearFirestoreData,
  createTestUser,
  getTestIdToken 
} from '../emulator/utils.js';

// Mock OpenRouter to avoid external API calls during testing
const mockOpenRouter = {
  generateChatCompletion: vi.fn(),
  createEmbeddings: vi.fn()
};

vi.mock('../../apps/api/src/ai/openrouter.js', () => mockOpenRouter);

describe('End-to-End Integration Tests', () => {
  let app: express.Application;
  let testUserId: string;
  let authToken: string;
  let testProjectId: string;

  beforeAll(async () => {
    // Setup Firebase emulator
    await setupFirebaseEmulator();
    
    // Create Express app with middleware
    app = express();
    app.use(express.json({ limit: '1mb' }));
    app.use(requestContextMiddleware);
    app.use(authMiddleware);
    
    // Register routes
    registerRoutes(app);
    
    // Add error handling
    app.use(errorHandlerMiddleware);
    
    // Create test user and get auth token
    testUserId = `test-user-${randomUUID()}`;
    authToken = await getTestIdToken(testUserId);
  });

  beforeEach(async () => {
    // Clear Firestore data before each test
    await clearFirestoreData();
    
    // Create a test project
    const projectResponse = await request(app)
      .post('/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Test Thesis Project',
        description: 'A test project for integration testing',
        constitution: {
          scope: 'Test scope',
          coreArgument: 'Test argument',
          toneGuidelines: 'Academic tone'
        }
      });
    
    expect(projectResponse.status).toBe(201);
    testProjectId = projectResponse.body.data.id;
  });

  afterAll(async () => {
    // Clean up
    await clearFirestoreData();
  });

  describe('Happy Path: Complete Workflow', () => {
    
    it('should complete full workflow from source upload to draft generation', async () => {
      // Mock successful AI responses
      mockOpenRouter.createEmbeddings.mockResolvedValue({
        embeddings: [new Array(1536).fill(0.1)], // Mock embedding vector
        usage: { prompt_tokens: 10, total_tokens: 10 }
      });
      
      mockOpenRouter.generateChatCompletion.mockResolvedValue({
        output: 'This is a generated thesis section about [CITE:chunk-1] the research findings.',
        usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
        latencyMs: 1200
      });

      // Step 1: Create a source
      const sourceResponse = await request(app)
        .post('/sources')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectId: testProjectId,
          kind: 'research_paper',
          metadata: {
            title: 'Test Research Paper',
            authors: ['Dr. Test Author'],
            year: 2024,
            url: 'https://example.com/paper.pdf'
          }
        });
      
      expect(sourceResponse.status).toBe(201);
      const sourceId = sourceResponse.body.data.id;
      expect(sourceResponse.body.data).toMatchObject({
        projectId: testProjectId,
        kind: 'research_paper',
        status: 'UPLOADED',
        metadata: expect.objectContaining({
          title: 'Test Research Paper'
        })
      });

      // Step 2: Upload source content
      const samplePdfText = `
        Abstract
        
        This paper investigates the effects of machine learning on academic research.
        The study demonstrates significant improvements in research efficiency and quality
        when AI tools are properly integrated into the research workflow.
        
        Introduction
        
        Machine learning has revolutionized many fields, and academic research is no exception.
        Recent studies have shown that AI-powered tools can enhance research productivity
        by automating routine tasks and providing intelligent insights.
        
        Methodology
        
        We conducted a comprehensive analysis of 100 research projects that utilized
        AI tools compared to traditional research methods. The evaluation criteria
        included time efficiency, quality of outputs, and researcher satisfaction.
        
        Results
        
        The results indicate a 40% improvement in research efficiency and a 25%
        increase in output quality when AI tools are properly integrated.
        Researchers reported higher satisfaction levels and reduced cognitive load.
        
        Conclusion
        
        AI tools represent a significant opportunity for enhancing academic research.
        Proper integration and training are essential for maximizing benefits.
      `;

      const uploadResponse = await request(app)
        .post(`/sources/${sourceId}/upload`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          data: samplePdfText,
          mimeType: 'text/plain'
        });
      
      expect(uploadResponse.status).toBe(204);

      // Step 3: Ingest the source (process and create embeddings)
      const ingestResponse = await request(app)
        .post(`/sources/${sourceId}/ingest`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(ingestResponse.status).toBe(200);
      expect(ingestResponse.body.data).toMatchObject({
        sourceId,
        status: 'COMPLETED',
        totalChunks: expect.any(Number),
        chunksProcessed: expect.any(Number)
      });
      
      // Verify embeddings were created
      expect(mockOpenRouter.createEmbeddings).toHaveBeenCalled();

      // Step 4: Perform retrieval to get relevant chunks
      const retrievalResponse = await request(app)
        .post('/retrieval')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectId: testProjectId,
          query: 'machine learning effects on research efficiency',
          limit: 5
        });
      
      expect(retrievalResponse.status).toBe(200);
      expect(retrievalResponse.body.data).toMatchObject({
        query: expect.objectContaining({
          query: 'machine learning effects on research efficiency'
        }),
        chunks: expect.arrayContaining([
          expect.objectContaining({
            text: expect.any(String),
            score: expect.any(Number),
            citation: expect.any(String)
          })
        ])
      });

      const retrievedChunks = retrievalResponse.body.data.chunks;
      expect(retrievedChunks.length).toBeGreaterThan(0);

      // Step 5: Generate a thesis section draft
      const draftResponse = await request(app)
        .post('/drafting/section')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectId: testProjectId,
          sectionId: 'literature-review',
          section: {
            title: 'Literature Review',
            objective: 'Review existing research on AI tools in academic research'
          },
          chunks: retrievedChunks.slice(0, 3), // Use top 3 chunks
          maxTokens: 500,
          citationStyle: 'APA'
        });
      
      expect(draftResponse.status).toBe(200);
      expect(draftResponse.body.data).toMatchObject({
        draft: expect.stringContaining('[CITE:'),
        usedChunkIds: expect.arrayContaining([expect.any(String)]),
        tokenUsage: expect.objectContaining({
          total_tokens: expect.any(Number)
        }),
        latencyMs: expect.any(Number)
      });

      // Verify AI generation was called with proper context
      expect(mockOpenRouter.generateChatCompletion).toHaveBeenCalledWith(
        expect.objectContaining({
          systemPrompt: expect.stringContaining('Thesis Copilot'),
          userPrompt: expect.stringContaining('Literature Review'),
          maxTokens: 500,
          temperature: 0.35
        })
      );

      // Step 6: List sources to verify they're properly stored
      const sourcesResponse = await request(app)
        .get(`/projects/${testProjectId}/sources`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(sourcesResponse.status).toBe(200);
      expect(sourcesResponse.body.data).toHaveLength(1);
      expect(sourcesResponse.body.data[0]).toMatchObject({
        id: sourceId,
        status: 'COMPLETED'
      });
    });

  });

  describe('Error Handling Scenarios', () => {

    it('should handle validation errors gracefully', async () => {
      // Test invalid source creation
      const invalidSourceResponse = await request(app)
        .post('/sources')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // Missing required fields
          kind: 'invalid_kind'
        });
      
      expect(invalidSourceResponse.status).toBe(400);
      expect(invalidSourceResponse.body.error).toMatchObject({
        code: 'VALIDATION_ERROR',
        message: expect.any(String),
        userMessage: expect.objectContaining({
          title: 'Validation Error',
          retryable: false
        })
      });
    });

    it('should handle AI service failures with retry', async () => {
      // Mock AI service failure then success
      mockOpenRouter.createEmbeddings
        .mockRejectedValueOnce(new Error('Service temporarily unavailable'))
        .mockResolvedValue({
          embeddings: [new Array(1536).fill(0.1)],
          usage: { prompt_tokens: 10, total_tokens: 10 }
        });

      // Create and upload source
      const sourceResponse = await request(app)
        .post('/sources')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectId: testProjectId,
          kind: 'research_paper',
          metadata: { title: 'Test Paper', authors: ['Test'], year: 2024 }
        });
      
      const sourceId = sourceResponse.body.data.id;

      await request(app)
        .post(`/sources/${sourceId}/upload`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          data: 'Sample content for testing retry mechanism.',
          mimeType: 'text/plain'
        });

      // Ingest should succeed after retry
      const ingestResponse = await request(app)
        .post(`/sources/${sourceId}/ingest`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(ingestResponse.status).toBe(200);
      expect(mockOpenRouter.createEmbeddings).toHaveBeenCalledTimes(2); // Initial failure + retry success
    });

    it('should handle non-retryable errors appropriately', async () => {
      // Test access to non-existent source
      const nonExistentId = randomUUID();
      const ingestResponse = await request(app)
        .post(`/sources/${nonExistentId}/ingest`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(ingestResponse.status).toBe(400);
      expect(ingestResponse.body.error).toMatchObject({
        code: 'INVALID_INPUT',
        userMessage: expect.objectContaining({
          retryable: false
        })
      });
    });

    it('should handle authentication errors', async () => {
      // Test request without auth token
      const noAuthResponse = await request(app)
        .get(`/projects/${testProjectId}/sources`);
      
      expect(noAuthResponse.status).toBe(401);
      
      // Test request with invalid auth token
      const invalidAuthResponse = await request(app)
        .get(`/projects/${testProjectId}/sources`)
        .set('Authorization', 'Bearer invalid-token');
      
      expect(invalidAuthResponse.status).toBe(401);
    });

    it('should handle large file upload errors', async () => {
      const sourceResponse = await request(app)
        .post('/sources')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectId: testProjectId,
          kind: 'research_paper',
          metadata: { title: 'Large File Test', authors: ['Test'], year: 2024 }
        });
      
      const sourceId = sourceResponse.body.data.id;
      
      // Test with extremely large content (simulating file too large error)
      const largeContent = 'x'.repeat(100 * 1024 * 1024); // 100MB of text
      
      const uploadResponse = await request(app)
        .post(`/sources/${sourceId}/upload`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          data: largeContent,
          mimeType: 'text/plain'
        });
      
      // Should handle gracefully (either success or proper error)
      expect([200, 204, 400, 413]).toContain(uploadResponse.status);
      
      if (uploadResponse.status >= 400) {
        expect(uploadResponse.body.error).toMatchObject({
          code: expect.any(String),
          userMessage: expect.objectContaining({
            title: expect.any(String)
          })
        });
      }
    });

    it('should handle empty retrieval queries', async () => {
      const retrievalResponse = await request(app)
        .post('/retrieval')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectId: testProjectId,
          query: '', // Empty query
          limit: 5
        });
      
      expect(retrievalResponse.status).toBe(400);
      expect(retrievalResponse.body.error).toMatchObject({
        code: 'INVALID_INPUT',
        message: expect.stringContaining('empty'),
        userMessage: expect.objectContaining({
          retryable: false
        })
      });
    });

    it('should handle drafting with no source chunks', async () => {
      const draftResponse = await request(app)
        .post('/drafting/section')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectId: testProjectId,
          sectionId: 'test-section',
          section: {
            title: 'Test Section',
            objective: 'Test objective'
          },
          chunks: [], // No chunks provided
          maxTokens: 500
        });
      
      expect(draftResponse.status).toBe(400);
      expect(draftResponse.body.error).toMatchObject({
        code: 'INVALID_INPUT',
        message: expect.stringContaining('chunk'),
        userMessage: expect.objectContaining({
          retryable: false
        })
      });
    });

  });

  describe('Performance and Edge Cases', () => {

    it('should handle concurrent requests properly', async () => {
      // Create multiple sources concurrently
      const concurrentRequests = Array.from({ length: 5 }, (_, i) =>
        request(app)
          .post('/sources')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            projectId: testProjectId,
            kind: 'research_paper',
            metadata: {
              title: `Concurrent Test Paper ${i}`,
              authors: ['Test Author'],
              year: 2024
            }
          })
      );

      const responses = await Promise.all(concurrentRequests);
      
      // All should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(201);
        expect(response.body.data.id).toBeDefined();
      });

      // All should have unique IDs
      const ids = responses.map(r => r.body.data.id);
      const uniqueIds = [...new Set(ids)];
      expect(uniqueIds).toHaveLength(5);
    });

    it('should handle retrieval with no matching chunks', async () => {
      // Mock embeddings that don't match anything
      mockOpenRouter.createEmbeddings.mockResolvedValue({
        embeddings: [new Array(1536).fill(0)], // All zeros, won't match
        usage: { prompt_tokens: 10, total_tokens: 10 }
      });

      // Create and ingest a source first
      const sourceResponse = await request(app)
        .post('/sources')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectId: testProjectId,
          kind: 'research_paper',
          metadata: { title: 'Test', authors: ['Test'], year: 2024 }
        });
      
      const sourceId = sourceResponse.body.data.id;

      await request(app)
        .post(`/sources/${sourceId}/upload`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          data: 'Some unrelated content about cooking recipes.',
          mimeType: 'text/plain'
        });

      // Mock successful embedding creation for ingestion
      mockOpenRouter.createEmbeddings.mockResolvedValue({
        embeddings: [new Array(1536).fill(0.5)],
        usage: { prompt_tokens: 10, total_tokens: 10 }
      });

      await request(app)
        .post(`/sources/${sourceId}/ingest`)
        .set('Authorization', `Bearer ${authToken}`);

      // Mock different embeddings for query
      mockOpenRouter.createEmbeddings.mockResolvedValue({
        embeddings: [new Array(1536).fill(0.1)],
        usage: { prompt_tokens: 10, total_tokens: 10 }
      });

      // Perform retrieval with query that won't match
      const retrievalResponse = await request(app)
        .post('/retrieval')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectId: testProjectId,
          query: 'quantum physics and space exploration',
          limit: 5
        });
      
      expect(retrievalResponse.status).toBe(200);
      // Should return fallback chunks even with low scores
      expect(retrievalResponse.body.data.chunks.length).toBeGreaterThan(0);
    });

    it('should track performance metrics properly', async () => {
      // Monitor logger calls to verify metrics are being tracked
      const loggerSpy = vi.spyOn(logger, 'logMetrics');
      
      const sourceResponse = await request(app)
        .post('/sources')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectId: testProjectId,
          kind: 'research_paper',
          metadata: { title: 'Metrics Test', authors: ['Test'], year: 2024 }
        });
      
      expect(sourceResponse.status).toBe(201);
      
      // Verify metrics were logged
      expect(loggerSpy).toHaveBeenCalledWith(
        'create_source',
        expect.any(Number), // duration
        expect.objectContaining({
          userId: testUserId,
          projectId: testProjectId
        }),
        expect.any(Object) // additional metrics
      );
    });

  });

  describe('Data Consistency and Cleanup', () => {

    it('should maintain data consistency across operations', async () => {
      // Create source
      const sourceResponse = await request(app)
        .post('/sources')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectId: testProjectId,
          kind: 'research_paper',
          metadata: { title: 'Consistency Test', authors: ['Test'], year: 2024 }
        });
      
      const sourceId = sourceResponse.body.data.id;
      
      // Verify source appears in listing
      const listResponse1 = await request(app)
        .get(`/projects/${testProjectId}/sources`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(listResponse1.body.data).toHaveLength(1);
      expect(listResponse1.body.data[0].status).toBe('UPLOADED');
      
      // Upload content
      await request(app)
        .post(`/sources/${sourceId}/upload`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          data: 'Test content for consistency check.',
          mimeType: 'text/plain'
        });
      
      // Status should update to PROCESSING
      const listResponse2 = await request(app)
        .get(`/projects/${testProjectId}/sources`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(listResponse2.body.data[0].status).toBe('PROCESSING');
      
      // Mock successful ingestion
      mockOpenRouter.createEmbeddings.mockResolvedValue({
        embeddings: [new Array(1536).fill(0.3)],
        usage: { prompt_tokens: 10, total_tokens: 10 }
      });
      
      // Ingest
      await request(app)
        .post(`/sources/${sourceId}/ingest`)
        .set('Authorization', `Bearer ${authToken}`);
      
      // Status should update to COMPLETED
      const listResponse3 = await request(app)
        .get(`/projects/${testProjectId}/sources`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(listResponse3.body.data[0].status).toBe('COMPLETED');
    });

  });

});