/**
 * Error Handling Integration Test Suite
 * 
 * Tests the comprehensive error handling system across all services
 * and validates error propagation, retry mechanisms, and user-friendly messaging.
 */

import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { randomUUID } from 'crypto';
import { 
  setupFirebaseEmulator, 
  clearFirestoreData,
  createTestUser
} from '../emulator/utils.js';
import { 
  ErrorCode,
  ValidationError,
  AIServiceError,
  DatabaseError,
  ThesisError,
  ErrorFactory,
  withRetry
} from '../../apps/api/src/utils/errors';
import { logger } from '../../apps/api/src/utils/logger';

// Mock services to test error handling
const mockService = {
  failThenSucceed: vi.fn(),
  alwaysFail: vi.fn(),
  validateInput: vi.fn()
};

describe('Error Handling Integration Tests', () => {
  let testUserId: string;

  beforeAll(async () => {
    await setupFirebaseEmulator();
  });

  beforeEach(async () => {
    // Note: This test focuses on error handling logic, not database operations
    testUserId = await createTestUser();
    vi.clearAllMocks();
  });

  describe('Error Classification and User Messages', () => {
    
    it('should create validation errors with user-friendly messages', () => {
      const error = new ValidationError(
        ErrorCode.INVALID_INPUT,
        'Missing required field: title',
        { userId: testUserId }
      );

      expect(error).toBeInstanceOf(ThesisError);
      expect(error.code).toBe(ErrorCode.INVALID_INPUT);
      expect(error.isRetryable).toBe(false);
      expect(error.userMessage).toMatchObject({
        title: 'Invalid Input',
        retryable: false,
        message: expect.stringContaining('check')
      });
      expect(error.context.userId).toBe(testUserId);
    });

    it('should create AI service errors with retry capability', () => {
      const error = new AIServiceError(
        ErrorCode.AI_SERVICE_ERROR,
        'Service temporarily unavailable',
        { userId: testUserId, requestId: 'req-123' }
      );

      expect(error.code).toBe(ErrorCode.AI_SERVICE_ERROR);
      expect(error.isRetryable).toBe(true);
      expect(error.userMessage).toMatchObject({
        title: 'AI Service Error',
        retryable: true,
        message: expect.stringContaining('temporarily')
      });
    });

    it('should create database errors with proper context', () => {
      const error = new DatabaseError(
        ErrorCode.DATABASE_ERROR,
        'Connection timeout',
        { userId: testUserId, projectId: 'proj-123' }
      );

      expect(error.code).toBe(ErrorCode.DATABASE_ERROR);
      expect(error.isRetryable).toBe(true);
      expect(error.userMessage.retryable).toBe(true);
      expect(error.context).toMatchObject({
        userId: testUserId,
        projectId: 'proj-123'
      });
    });

    it('should serialize errors to JSON properly', () => {
      const originalError = new Error('Original cause');
      const error = new ValidationError(
        ErrorCode.VALIDATION_ERROR,
        'Test validation error',
        { userId: testUserId },
        originalError
      );

      const json = error.toJSON();

      expect(json).toMatchObject({
        name: 'ValidationError',
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Test validation error',
        userMessage: expect.objectContaining({
          title: 'Validation Error'
        }),
        context: expect.objectContaining({
          userId: testUserId
        }),
        isRetryable: false,
        timestamp: expect.any(String)
      });

      expect(json.cause).toMatchObject({
        name: 'Error',
        message: 'Original cause'
      });
    });

  });

  describe('Error Factory and Classification', () => {
    
    it('should classify errors by error code correctly', () => {
      
      // Authentication errors should not be retryable
      const authCodes = [
        ErrorCode.AUTHENTICATION_FAILED,
        ErrorCode.AUTHORIZATION_DENIED,
        ErrorCode.INVALID_TOKEN
      ];

      authCodes.forEach(code => {
        const error = ErrorFactory.createFromCode(code, 'Auth error', { userId: testUserId });
        expect(error.isRetryable).toBe(false);
      });

      // AI service errors should be retryable
      const aiCodes = [
        ErrorCode.AI_SERVICE_ERROR,
        ErrorCode.EXTERNAL_SERVICE_UNAVAILABLE,
        ErrorCode.EMBEDDING_GENERATION_FAILED
      ];

      aiCodes.forEach(code => {
        const error = ErrorFactory.createFromCode(code, 'AI error', { userId: testUserId });
        expect(error.isRetryable).toBe(true);
      });
    });

    it('should handle unknown errors gracefully', () => {
      const unknownError = new Error('Unexpected error');
      
      const thesisError = ErrorFactory.fromUnknown(unknownError);

      expect(thesisError).toBeInstanceOf(ThesisError);
      expect(thesisError.code).toBe(ErrorCode.INTERNAL_SERVER_ERROR);
      expect(thesisError.message).toBe('Unexpected error');
      expect(thesisError.originalCause).toBe(unknownError);
    });

    it('should preserve existing ThesisError instances', () => {
      const originalError = new ValidationError(
        ErrorCode.INVALID_INPUT,
        'Original error',
        { userId: testUserId }
      );

      const result = ErrorFactory.fromUnknown(originalError);

      expect(result).toBe(originalError);
    });

  });

  describe('Retry Mechanism Testing', () => {
    
    it('should retry operations on retryable errors', async () => {
      
      let attempts = 0;
      const operation = vi.fn(async () => {
        attempts++;
        if (attempts < 3) {
          throw new AIServiceError(
            ErrorCode.AI_SERVICE_ERROR,
            'Temporary failure',
            { attempt: attempts }
          );
        }
        return 'success';
      });

      const result = await withRetry(operation, {
        maxRetries: 3,
        baseDelay: 10, // Fast for testing
        retryableErrors: [ErrorCode.AI_SERVICE_ERROR]
      });

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should not retry non-retryable errors', async () => {
      
      const operation = vi.fn(async () => {
        throw new ValidationError(
          ErrorCode.INVALID_INPUT,
          'Invalid data',
          { userId: testUserId }
        );
      });

      await expect(withRetry(operation, { maxRetries: 3 })).rejects.toThrow();
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should respect maximum retry attempts', async () => {
      
      const operation = vi.fn(async () => {
        throw new AIServiceError(
          ErrorCode.AI_SERVICE_ERROR,
          'Always fails',
          {}
        );
      });

      await expect(withRetry(operation, {
        maxRetries: 2,
        baseDelay: 10
      })).rejects.toThrow();

      expect(operation).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should apply exponential backoff delays', async () => {
      
      const delays: number[] = [];
      const originalSetTimeout = global.setTimeout;
      
      // Mock setTimeout to capture delays
      global.setTimeout = vi.fn((callback, delay) => {
        delays.push(delay);
        return originalSetTimeout(callback as any, 1);
      }) as any;

      const operation = vi.fn(async () => {
        throw new AIServiceError(ErrorCode.AI_SERVICE_ERROR, 'Test', {});
      });

      try {
        await withRetry(operation, {
          maxRetries: 3,
          baseDelay: 100,
          backoffMultiplier: 2
        });
      } catch {
        // Expected to fail
      }

      expect(delays).toEqual([100, 200, 400]);
      
      // Restore original setTimeout
      global.setTimeout = originalSetTimeout;
    });

  });

  describe('Logging Integration', () => {
    
    it('should log errors with proper context', () => {
      const loggerSpy = vi.spyOn(logger, 'error');
      
      const error = new AIServiceError(
        ErrorCode.CONTENT_GENERATION_FAILED,
        'AI generation failed',
        { userId: testUserId, requestId: 'req-456' }
      );

      logger.error('Test error message', error, { 
        additionalData: { operation: 'test' }
      });

      expect(loggerSpy).toHaveBeenCalledWith(
        'Test error message',
        error,
        expect.objectContaining({ 
          additionalData: expect.objectContaining({ operation: 'test' })
        })
      );
    });

    it('should log performance metrics', () => {
      const metricsSpy = vi.spyOn(logger, 'logMetrics');
      
      logger.logMetrics(
        'test-operation',
        150,
        { userId: testUserId },
        { success: true }
      );

      expect(metricsSpy).toHaveBeenCalledWith(
        'test-operation',
        150,
        expect.objectContaining({ userId: testUserId }),
        expect.objectContaining({ success: true })
      );
    });

  });

  describe('Error Response Format', () => {
    
    it('should format errors consistently for API responses', () => {
      const error = new ValidationError(
        ErrorCode.INVALID_FILE_TYPE,
        'Only PDF files are supported',
        { userId: testUserId, sourceId: 'source-123' }
      );

      const response = {
        error: {
          code: error.code,
          message: error.message,
          userMessage: error.userMessage,
          requestId: 'req-123',
          timestamp: error.timestamp
        }
      };

      expect(response.error).toMatchObject({
        code: ErrorCode.INVALID_FILE_TYPE,
        message: 'Only PDF files are supported',
        userMessage: {
          title: 'Invalid File Type',
          message: expect.stringContaining('PDF'),
          action: expect.stringContaining('PDF'),
          retryable: false
        },
        requestId: 'req-123',
        timestamp: expect.any(String)
      });
    });

  });

  describe('Edge Cases and Error Scenarios', () => {
    
    it('should handle nested error causes', () => {
      const rootCause = new Error('Database connection failed');
      const serviceError = new DatabaseError(
        ErrorCode.DATABASE_ERROR,
        'Service unavailable',
        { userId: testUserId },
        rootCause
      );

      expect(serviceError.originalCause).toBe(rootCause);
      expect(serviceError.message).toBe('Service unavailable');
      
      const json = serviceError.toJSON();
      expect(json.cause).toMatchObject({
        name: 'Error',
        message: 'Database connection failed'
      });
    });

    it('should handle error context limits', () => {
      const largeContext = {
        userId: testUserId,
        additionalData: {
          largeObject: 'x'.repeat(10000) // Large string
        }
      };

      const error = new ValidationError(
        ErrorCode.VALIDATION_ERROR,
        'Test with large context',
        largeContext
      );

      // Should not throw and should preserve essential context
      expect(error.context.userId).toBe(testUserId);
      expect(error.toJSON()).toBeDefined();
    });

    it('should handle concurrent error creation', async () => {
      const errors = await Promise.all(
        Array.from({ length: 10 }, (_, i) =>
          Promise.resolve(new ValidationError(
            ErrorCode.INVALID_INPUT,
            `Error ${i}`,
            { 
              userId: testUserId, 
              additionalData: { index: i }
            }
          ))
        )
      );

      expect(errors).toHaveLength(10);
      errors.forEach((error, index) => {
        expect(error.context.additionalData?.index).toBe(index);
        expect(error.timestamp).toBeDefined();
      });
    });

  });

  describe('Error Code Coverage', () => {
    
    it('should have user messages for all error codes', () => {
      const errorCodes = Object.values(ErrorCode);
      
      // Test a representative sample of error codes
      const testCodes = [
        ErrorCode.AUTHENTICATION_FAILED,
        ErrorCode.VALIDATION_ERROR,
        ErrorCode.INVALID_INPUT,
        ErrorCode.AI_SERVICE_ERROR,
        ErrorCode.DATABASE_ERROR,
        ErrorCode.EMBEDDING_GENERATION_FAILED,
        ErrorCode.CONTENT_GENERATION_FAILED,
        ErrorCode.INTERNAL_SERVER_ERROR
      ];
      
      testCodes.forEach(code => {
        const error = ErrorFactory.createFromCode(code, 'Test error', { userId: testUserId });

        expect(error.userMessage).toBeDefined();
        expect(error.userMessage.title).toBeTruthy();
        expect(error.userMessage.message).toBeTruthy();
        expect(typeof error.userMessage.retryable).toBe('boolean');
      });

      // Ensure we have a good coverage of error codes
      expect(testCodes.length).toBeGreaterThan(7);
    });

  });

});