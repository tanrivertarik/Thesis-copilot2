/**
 * Custom Error Classes and Error Handling Utilities
 * 
 * Provides structured error types, user-friendly messages, and debugging context
 * for robust error handling across all Thesis Copilot services.
 */

export enum ErrorCode {
  // Authentication & Authorization
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  AUTHORIZATION_DENIED = 'AUTHORIZATION_DENIED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',

  // Data Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',

  // Database & Storage
  DATABASE_ERROR = 'DATABASE_ERROR',
  DOCUMENT_NOT_FOUND = 'DOCUMENT_NOT_FOUND',
  STORAGE_ERROR = 'STORAGE_ERROR',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  CONNECTION_TIMEOUT = 'CONNECTION_TIMEOUT',

  // AI & External Services
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
  AI_QUOTA_EXCEEDED = 'AI_QUOTA_EXCEEDED',
  EMBEDDING_GENERATION_FAILED = 'EMBEDDING_GENERATION_FAILED',
  CONTENT_GENERATION_FAILED = 'CONTENT_GENERATION_FAILED',
  EXTERNAL_SERVICE_UNAVAILABLE = 'EXTERNAL_SERVICE_UNAVAILABLE',

  // Source Processing
  PDF_PROCESSING_FAILED = 'PDF_PROCESSING_FAILED',
  TEXT_EXTRACTION_FAILED = 'TEXT_EXTRACTION_FAILED',
  CHUNKING_FAILED = 'CHUNKING_FAILED',
  SOURCE_INGESTION_FAILED = 'SOURCE_INGESTION_FAILED',

  // Drafting & Retrieval
  RETRIEVAL_FAILED = 'RETRIEVAL_FAILED',
  DRAFTING_FAILED = 'DRAFTING_FAILED',
  CITATION_EXTRACTION_FAILED = 'CITATION_EXTRACTION_FAILED',
  CONSTITUTION_GENERATION_FAILED = 'CONSTITUTION_GENERATION_FAILED',

  // Export
  EXPORT_FAILED = 'EXPORT_FAILED',

  // System & Infrastructure
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR'
}

export interface ErrorContext {
  userId?: string;
  projectId?: string;
  sourceId?: string;
  sectionId?: string;
  requestId?: string;
  timestamp?: string;
  attempt?: number;
  maxRetries?: number;
  statusCode?: number;
  latencyMs?: number;
  model?: string;
  userAgent?: string;
  ip?: string;
  errorText?: string;
  additionalData?: Record<string, unknown>;
}

export interface UserFriendlyMessage {
  title: string;
  message: string;
  action?: string;
  retryable: boolean;
}

/**
 * Base class for all Thesis Copilot errors
 */
export abstract class ThesisError extends Error {
  public readonly code: ErrorCode;
  public readonly context: ErrorContext;
  public readonly userMessage: UserFriendlyMessage;
  public readonly isRetryable: boolean;
  public readonly timestamp: string;
  public readonly originalCause?: Error;

  constructor(
    code: ErrorCode,
    message: string,
    userMessage: UserFriendlyMessage,
    context: ErrorContext = {},
    isRetryable = false,
    cause?: Error
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.context = { ...context, timestamp: new Date().toISOString() };
    this.userMessage = userMessage;
    this.isRetryable = isRetryable;
    this.timestamp = new Date().toISOString();
    this.originalCause = cause;

    // Maintains proper stack trace for debugging
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Serialize error for logging and debugging
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      userMessage: this.userMessage,
      context: this.context,
      isRetryable: this.isRetryable,
      timestamp: this.timestamp,
      stack: this.stack,
      cause: this.originalCause ? {
        name: this.originalCause.name,
        message: this.originalCause.message,
        stack: this.originalCause.stack
      } : undefined
    };
  }
}

/**
 * Authentication and authorization errors
 */
export class AuthenticationError extends ThesisError {
  constructor(
    code: ErrorCode.AUTHENTICATION_FAILED | ErrorCode.AUTHORIZATION_DENIED | ErrorCode.INVALID_TOKEN | ErrorCode.TOKEN_EXPIRED,
    message: string,
    context: ErrorContext = {},
    cause?: Error
  ) {
    const userMessages = {
      [ErrorCode.AUTHENTICATION_FAILED]: {
        title: 'Authentication Failed',
        message: 'Please sign in to continue using Thesis Copilot.',
        action: 'Sign in with your Google account',
        retryable: false
      },
      [ErrorCode.AUTHORIZATION_DENIED]: {
        title: 'Access Denied',
        message: 'You don\'t have permission to access this resource.',
        retryable: false
      },
      [ErrorCode.INVALID_TOKEN]: {
        title: 'Session Invalid',
        message: 'Your session is invalid. Please sign in again.',
        action: 'Sign in again',
        retryable: false
      },
      [ErrorCode.TOKEN_EXPIRED]: {
        title: 'Session Expired',
        message: 'Your session has expired. Please sign in again.',
        action: 'Sign in again',
        retryable: false
      }
    };

    super(code, message, userMessages[code], context, false, cause);
  }
}

/**
 * Validation and input errors
 */
export class ValidationError extends ThesisError {
  constructor(
    code: ErrorCode.VALIDATION_ERROR | ErrorCode.INVALID_INPUT | ErrorCode.MISSING_REQUIRED_FIELD | ErrorCode.INVALID_FILE_TYPE | ErrorCode.FILE_TOO_LARGE,
    message: string,
    context: ErrorContext = {},
    cause?: Error
  ) {
    const userMessages = {
      [ErrorCode.VALIDATION_ERROR]: {
        title: 'Validation Error',
        message: 'Please check your input and try again.',
        retryable: false
      },
      [ErrorCode.INVALID_INPUT]: {
        title: 'Invalid Input',
        message: 'The provided input is not valid. Please check and correct it.',
        retryable: false
      },
      [ErrorCode.MISSING_REQUIRED_FIELD]: {
        title: 'Missing Information',
        message: 'Please fill in all required fields.',
        retryable: false
      },
      [ErrorCode.INVALID_FILE_TYPE]: {
        title: 'Invalid File Type',
        message: 'Only PDF files are supported. Please select a PDF file.',
        action: 'Choose a PDF file',
        retryable: false
      },
      [ErrorCode.FILE_TOO_LARGE]: {
        title: 'File Too Large',
        message: 'The file is too large. Please select a file smaller than 10MB.',
        action: 'Choose a smaller file',
        retryable: false
      }
    };

    super(code, message, userMessages[code], context, false, cause);
  }
}

/**
 * Database and storage errors
 */
export class DatabaseError extends ThesisError {
  constructor(
    code: ErrorCode.DATABASE_ERROR | ErrorCode.DOCUMENT_NOT_FOUND | ErrorCode.STORAGE_ERROR | ErrorCode.QUOTA_EXCEEDED | ErrorCode.CONNECTION_TIMEOUT,
    message: string,
    context: ErrorContext = {},
    cause?: Error
  ) {
    const userMessages = {
      [ErrorCode.DATABASE_ERROR]: {
        title: 'Database Error',
        message: 'We\'re experiencing technical difficulties. Please try again.',
        action: 'Try again in a few moments',
        retryable: true
      },
      [ErrorCode.DOCUMENT_NOT_FOUND]: {
        title: 'Not Found',
        message: 'The requested item could not be found.',
        retryable: false
      },
      [ErrorCode.STORAGE_ERROR]: {
        title: 'Storage Error',
        message: 'Unable to save your file. Please try again.',
        action: 'Try uploading again',
        retryable: true
      },
      [ErrorCode.QUOTA_EXCEEDED]: {
        title: 'Storage Limit Reached',
        message: 'You\'ve reached your storage limit. Please delete some files or upgrade your plan.',
        action: 'Manage your files',
        retryable: false
      },
      [ErrorCode.CONNECTION_TIMEOUT]: {
        title: 'Connection Timeout',
        message: 'The connection timed out. Please check your internet and try again.',
        action: 'Try again',
        retryable: true
      }
    };

    super(code, message, userMessages[code], context, code !== ErrorCode.DOCUMENT_NOT_FOUND && code !== ErrorCode.QUOTA_EXCEEDED, cause);
  }
}

/**
 * AI service and external API errors
 */
export class AIServiceError extends ThesisError {
  constructor(
    code: ErrorCode.AI_SERVICE_ERROR | ErrorCode.AI_QUOTA_EXCEEDED | ErrorCode.EMBEDDING_GENERATION_FAILED | ErrorCode.CONTENT_GENERATION_FAILED | ErrorCode.EXTERNAL_SERVICE_UNAVAILABLE,
    message: string,
    context: ErrorContext = {},
    cause?: Error
  ) {
    const userMessages = {
      [ErrorCode.AI_SERVICE_ERROR]: {
        title: 'AI Service Error',
        message: 'Our AI service is temporarily unavailable. Please try again.',
        action: 'Try again in a few minutes',
        retryable: true
      },
      [ErrorCode.AI_QUOTA_EXCEEDED]: {
        title: 'Usage Limit Reached',
        message: 'You\'ve reached your AI usage limit. Please try again later or upgrade your plan.',
        action: 'Try again later',
        retryable: false
      },
      [ErrorCode.EMBEDDING_GENERATION_FAILED]: {
        title: 'Processing Error',
        message: 'Unable to process your sources. Please try again.',
        action: 'Try again',
        retryable: true
      },
      [ErrorCode.CONTENT_GENERATION_FAILED]: {
        title: 'Generation Error',
        message: 'Unable to generate content. Please try again.',
        action: 'Try again',
        retryable: true
      },
      [ErrorCode.EXTERNAL_SERVICE_UNAVAILABLE]: {
        title: 'Service Unavailable',
        message: 'A required service is temporarily unavailable. Please try again later.',
        action: 'Try again later',
        retryable: true
      }
    };

    super(code, message, userMessages[code], context, true, cause);
  }
}

/**
 * Source processing errors
 */
export class SourceProcessingError extends ThesisError {
  constructor(
    code: ErrorCode.PDF_PROCESSING_FAILED | ErrorCode.TEXT_EXTRACTION_FAILED | ErrorCode.CHUNKING_FAILED | ErrorCode.SOURCE_INGESTION_FAILED,
    message: string,
    context: ErrorContext = {},
    cause?: Error
  ) {
    const userMessages = {
      [ErrorCode.PDF_PROCESSING_FAILED]: {
        title: 'PDF Processing Failed',
        message: 'Unable to process your PDF. Please ensure it\'s a valid, readable PDF file.',
        action: 'Try a different PDF file',
        retryable: false
      },
      [ErrorCode.TEXT_EXTRACTION_FAILED]: {
        title: 'Text Extraction Failed',
        message: 'Unable to extract text from your PDF. The file might be corrupted or password-protected.',
        action: 'Try a different file',
        retryable: false
      },
      [ErrorCode.CHUNKING_FAILED]: {
        title: 'Processing Error',
        message: 'Unable to process the document content. Please try again.',
        action: 'Try again',
        retryable: true
      },
      [ErrorCode.SOURCE_INGESTION_FAILED]: {
        title: 'Source Upload Failed',
        message: 'Unable to process your source. Please try uploading again.',
        action: 'Try uploading again',
        retryable: true
      }
    };

    super(code, message, userMessages[code], context, code === ErrorCode.CHUNKING_FAILED || code === ErrorCode.SOURCE_INGESTION_FAILED, cause);
  }
}

/**
 * Drafting and retrieval errors
 */
export class DraftingError extends ThesisError {
  constructor(
    code: ErrorCode.RETRIEVAL_FAILED | ErrorCode.DRAFTING_FAILED | ErrorCode.CITATION_EXTRACTION_FAILED | ErrorCode.CONSTITUTION_GENERATION_FAILED,
    message: string,
    context: ErrorContext = {},
    cause?: Error
  ) {
    const userMessages = {
      [ErrorCode.RETRIEVAL_FAILED]: {
        title: 'Source Retrieval Failed',
        message: 'Unable to find relevant sources for your query. Please try different keywords.',
        action: 'Try different search terms',
        retryable: true
      },
      [ErrorCode.DRAFTING_FAILED]: {
        title: 'Draft Generation Failed',
        message: 'Unable to generate draft content. Please try again.',
        action: 'Try again',
        retryable: true
      },
      [ErrorCode.CITATION_EXTRACTION_FAILED]: {
        title: 'Citation Processing Failed',
        message: 'Unable to process citations in your content. Please check the format.',
        action: 'Check citation format',
        retryable: false
      },
      [ErrorCode.CONSTITUTION_GENERATION_FAILED]: {
        title: 'Constitution Generation Failed',
        message: 'Unable to generate thesis constitution. Please ensure you have uploaded sufficient sources.',
        action: 'Upload more sources',
        retryable: true
      }
    };

    super(code, message, userMessages[code], context, true, cause);
  }
}

/**
 * System and infrastructure errors
 */
export class SystemError extends ThesisError {
  constructor(
    code: ErrorCode.INTERNAL_SERVER_ERROR | ErrorCode.SERVICE_UNAVAILABLE | ErrorCode.RATE_LIMIT_EXCEEDED | ErrorCode.CONFIGURATION_ERROR,
    message: string,
    context: ErrorContext = {},
    cause?: Error
  ) {
    const userMessages = {
      [ErrorCode.INTERNAL_SERVER_ERROR]: {
        title: 'Server Error',
        message: 'We\'re experiencing technical difficulties. Please try again.',
        action: 'Try again',
        retryable: true
      },
      [ErrorCode.SERVICE_UNAVAILABLE]: {
        title: 'Service Unavailable',
        message: 'Thesis Copilot is temporarily unavailable. Please try again later.',
        action: 'Try again later',
        retryable: true
      },
      [ErrorCode.RATE_LIMIT_EXCEEDED]: {
        title: 'Too Many Requests',
        message: 'You\'re making requests too quickly. Please wait a moment and try again.',
        action: 'Wait and try again',
        retryable: true
      },
      [ErrorCode.CONFIGURATION_ERROR]: {
        title: 'Configuration Error',
        message: 'There\'s a configuration issue. Please contact support.',
        action: 'Contact support',
        retryable: false
      }
    };

    super(code, message, userMessages[code], context, code !== ErrorCode.CONFIGURATION_ERROR, cause);
  }
}

/**
 * Error factory for creating appropriate error instances
 */
export class ErrorFactory {
  static createFromCode(
    code: ErrorCode,
    message: string,
    context: ErrorContext = {},
    cause?: Error
  ): ThesisError {
    // Authentication errors
    if ([ErrorCode.AUTHENTICATION_FAILED, ErrorCode.AUTHORIZATION_DENIED, ErrorCode.INVALID_TOKEN, ErrorCode.TOKEN_EXPIRED].includes(code)) {
      return new AuthenticationError(code as any, message, context, cause);
    }

    // Validation errors
    if ([ErrorCode.VALIDATION_ERROR, ErrorCode.INVALID_INPUT, ErrorCode.MISSING_REQUIRED_FIELD, ErrorCode.INVALID_FILE_TYPE, ErrorCode.FILE_TOO_LARGE].includes(code)) {
      return new ValidationError(code as any, message, context, cause);
    }

    // Database errors
    if ([ErrorCode.DATABASE_ERROR, ErrorCode.DOCUMENT_NOT_FOUND, ErrorCode.STORAGE_ERROR, ErrorCode.QUOTA_EXCEEDED, ErrorCode.CONNECTION_TIMEOUT].includes(code)) {
      return new DatabaseError(code as any, message, context, cause);
    }

    // AI service errors
    if ([ErrorCode.AI_SERVICE_ERROR, ErrorCode.AI_QUOTA_EXCEEDED, ErrorCode.EMBEDDING_GENERATION_FAILED, ErrorCode.CONTENT_GENERATION_FAILED, ErrorCode.EXTERNAL_SERVICE_UNAVAILABLE].includes(code)) {
      return new AIServiceError(code as any, message, context, cause);
    }

    // Source processing errors
    if ([ErrorCode.PDF_PROCESSING_FAILED, ErrorCode.TEXT_EXTRACTION_FAILED, ErrorCode.CHUNKING_FAILED, ErrorCode.SOURCE_INGESTION_FAILED].includes(code)) {
      return new SourceProcessingError(code as any, message, context, cause);
    }

    // Drafting errors
    if ([ErrorCode.RETRIEVAL_FAILED, ErrorCode.DRAFTING_FAILED, ErrorCode.CITATION_EXTRACTION_FAILED, ErrorCode.CONSTITUTION_GENERATION_FAILED].includes(code)) {
      return new DraftingError(code as any, message, context, cause);
    }

    // System errors (default)
    return new SystemError(code as any, message, context, cause);
  }

  /**
   * Create error from unknown error/exception
   */
  static fromUnknown(
    error: unknown,
    fallbackCode = ErrorCode.INTERNAL_SERVER_ERROR,
    context: ErrorContext = {}
  ): ThesisError {
    if (error instanceof ThesisError) {
      return error;
    }

    if (error instanceof Error) {
      return ErrorFactory.createFromCode(
        fallbackCode,
        error.message,
        context,
        error
      );
    }

    return ErrorFactory.createFromCode(
      fallbackCode,
      String(error),
      context
    );
  }
}

/**
 * Retry configuration for error handling
 */
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors?: ErrorCode[];
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
  retryableErrors: [
    ErrorCode.CONNECTION_TIMEOUT,
    ErrorCode.AI_SERVICE_ERROR,
    ErrorCode.EXTERNAL_SERVICE_UNAVAILABLE,
    ErrorCode.DATABASE_ERROR,
    ErrorCode.STORAGE_ERROR,
    ErrorCode.RATE_LIMIT_EXCEEDED
  ]
};

/**
 * Exponential backoff retry utility
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {},
  context: ErrorContext = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: ThesisError | undefined;

  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const thesisError = ErrorFactory.fromUnknown(error, ErrorCode.INTERNAL_SERVER_ERROR, {
        ...context,
        attempt: attempt + 1,
        maxRetries: finalConfig.maxRetries
      });

      lastError = thesisError;

      // Don't retry on last attempt or non-retryable errors
      if (attempt === finalConfig.maxRetries || !thesisError.isRetryable) {
        break;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        finalConfig.baseDelay * Math.pow(finalConfig.backoffMultiplier, attempt),
        finalConfig.maxDelay
      );

      console.warn(`Operation failed on attempt ${attempt + 1}, retrying in ${delay}ms`, {
        error: thesisError.toJSON()
      });

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError || new SystemError(ErrorCode.INTERNAL_SERVER_ERROR, 'Unknown error occurred', context);
}