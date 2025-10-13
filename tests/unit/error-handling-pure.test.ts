/**
 * Error Handling System Unit Test
 * 
 * Pure unit tests for the error handling system that don't require Firebase emulator.
 */

import { describe, it, expect, vi } from 'vitest';

// Mock the Firebase dependencies before importing our modules
vi.mock('@google-cloud/firestore', () => ({
  Firestore: vi.fn()
}));

vi.mock('firebase-admin', () => ({
  initializeApp: vi.fn(),
  auth: vi.fn(() => ({
    verifyIdToken: vi.fn()
  }))
}));

import { 
  ThesisError,
  ErrorCode,
  ErrorFactory,
  AuthenticationError,
  ValidationError,
  AIServiceError,
  withRetry
} from '../../apps/api/src/utils/errors.js';

describe('Error Handling System (Unit Tests)', () => {

  describe('Custom Error Classes', () => {
    
    it('should create authentication error with proper user message', () => {
      const error = new AuthenticationError(
        ErrorCode.AUTHENTICATION_FAILED,
        'Invalid credentials',
        { userId: 'test-user' }
      );

      expect(error).toBeInstanceOf(ThesisError);
      expect(error.code).toBe(ErrorCode.AUTHENTICATION_FAILED);
      expect(error.message).toBe('Invalid credentials');
      expect(error.userMessage.title).toBe('Authentication Failed');
      expect(error.userMessage.retryable).toBe(false);
      expect(error.context.userId).toBe('test-user');
      expect(error.isRetryable).toBe(false);
    });

    it('should create validation error with correct properties', () => {
      const error = new ValidationError(
        ErrorCode.INVALID_FILE_TYPE,
        'File must be PDF',
        { projectId: 'proj-123' }
      );

      expect(error.code).toBe(ErrorCode.INVALID_FILE_TYPE);
      expect(error.userMessage.title).toBe('Invalid File Type');
      expect(error.userMessage.message).toBe('Only PDF files are supported. Please select a PDF file.');
      expect(error.userMessage.action).toBe('Choose a PDF file');
      expect(error.context.projectId).toBe('proj-123');
    });

    it('should create AI service error with retry capability', () => {
      const error = new AIServiceError(
        ErrorCode.AI_SERVICE_ERROR,
        'Service temporarily unavailable',
        { requestId: 'req-456' }
      );

      expect(error.code).toBe(ErrorCode.AI_SERVICE_ERROR);
      expect(error.isRetryable).toBe(true);
      expect(error.userMessage.retryable).toBe(true);
      expect(error.context.requestId).toBe('req-456');
    });

    it('should serialize error to JSON correctly', () => {
      const originalError = new Error('Original cause');
      const error = new ValidationError(
        ErrorCode.VALIDATION_ERROR,
        'Test validation error',
        { userId: 'user-123' },
        originalError
      );

      const json = error.toJSON();

      expect(json).toMatchObject({
        name: 'ValidationError',
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Test validation error',
        userMessage: expect.objectContaining({
          title: 'Validation Error',
          retryable: false
        }),
        context: expect.objectContaining({
          userId: 'user-123'
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

  describe('Error Factory', () => {
    
    it('should create appropriate error from error code', () => {
      const error = ErrorFactory.createFromCode(
        ErrorCode.DATABASE_ERROR,
        'Connection failed',
        { projectId: 'proj-789' }
      );

      expect(error).toBeInstanceOf(ThesisError);
      expect(error.code).toBe(ErrorCode.DATABASE_ERROR);
      expect(error.isRetryable).toBe(true);
    });

    it('should handle unknown errors gracefully', () => {
      const unknownError = new Error('Something went wrong');
      const thesisError = ErrorFactory.fromUnknown(unknownError);

      expect(thesisError).toBeInstanceOf(ThesisError);
      expect(thesisError.code).toBe(ErrorCode.INTERNAL_SERVER_ERROR);
      expect(thesisError.message).toBe('Something went wrong');
      expect(thesisError.originalCause).toBe(unknownError);
    });

    it('should pass through existing ThesisError instances', () => {
      const originalError = new ValidationError(
        ErrorCode.INVALID_INPUT,
        'Test error',
        { userId: 'test' }
      );

      const result = ErrorFactory.fromUnknown(originalError);
      expect(result).toBe(originalError);
    });

    it('should handle non-Error objects', () => {
      const stringError = 'String error message';
      const thesisError = ErrorFactory.fromUnknown(stringError);

      expect(thesisError).toBeInstanceOf(ThesisError);
      expect(thesisError.message).toBe('String error message');
    });

  });

  describe('Retry Mechanism', () => {
    
    it('should retry retryable operations', async () => {
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
        baseDelay: 10, // Short delay for testing
        retryableErrors: [ErrorCode.AI_SERVICE_ERROR]
      });

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
      expect(attempts).toBe(3);
    });

    it('should not retry non-retryable errors', async () => {
      const operation = vi.fn(async () => {
        throw new ValidationError(
          ErrorCode.INVALID_INPUT,
          'Invalid data',
          {}
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

  });

  describe('Error Code Classification', () => {
    
    it('should classify authentication errors correctly', () => {
      const authCodes = [
        ErrorCode.AUTHENTICATION_FAILED,
        ErrorCode.AUTHORIZATION_DENIED,
        ErrorCode.INVALID_TOKEN,
        ErrorCode.TOKEN_EXPIRED
      ];

      authCodes.forEach(code => {
        const error = ErrorFactory.createFromCode(code, 'Test', {});
        expect(error).toBeInstanceOf(AuthenticationError);
        expect(error.isRetryable).toBe(false);
      });
    });

    it('should classify AI service errors as retryable', () => {
      const aiCodes = [
        ErrorCode.AI_SERVICE_ERROR,
        ErrorCode.EXTERNAL_SERVICE_UNAVAILABLE,
        ErrorCode.EMBEDDING_GENERATION_FAILED,
        ErrorCode.CONTENT_GENERATION_FAILED
      ];

      aiCodes.forEach(code => {
        const error = ErrorFactory.createFromCode(code, 'Test', {});
        expect(error).toBeInstanceOf(AIServiceError);
        expect(error.isRetryable).toBe(true);
      });
    });

    it('should classify validation errors as non-retryable', () => {
      const validationCodes = [
        ErrorCode.VALIDATION_ERROR,
        ErrorCode.INVALID_INPUT,
        ErrorCode.INVALID_FILE_TYPE,
        ErrorCode.FILE_TOO_LARGE
      ];

      validationCodes.forEach(code => {
        const error = ErrorFactory.createFromCode(code, 'Test', {});
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.isRetryable).toBe(false);
      });
    });

  });

});