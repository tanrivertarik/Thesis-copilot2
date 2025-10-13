/**
 * Error Handling Middleware
 * 
 * Express middleware for centralized error handling with proper logging,
 * user-friendly responses, and structured error reporting.
 */

import type { Request, Response, NextFunction } from 'express';
import { 
  ThesisError, 
  SystemError, 
  ErrorCode, 
  ErrorFactory,
  type ErrorContext 
} from '../utils/errors.js';
import { logger, generateRequestId, type RequestContext } from '../utils/logger.js';

// Extend Express Request to include our context
declare global {
  namespace Express {
    interface Request {
      context?: RequestContext;
      userId?: string;
    }
  }
}

/**
 * Request context middleware - adds request tracking
 */
export function requestContextMiddleware(req: Request, res: Response, next: NextFunction): void {
  req.context = {
    requestId: generateRequestId(),
    userId: req.userId,
    startTime: performance.now()
  };

  // Add request ID to response headers for tracing
  res.setHeader('X-Request-ID', req.context.requestId);

  logger.debug(`Request started: ${req.method} ${req.path}`, {
    requestId: req.context.requestId,
    userId: req.userId,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    additionalData: {
      method: req.method,
      path: req.path,
      query: req.query,
      bodySize: req.get('Content-Length')
    }
  });

  next();
}

/**
 * Error handling middleware - converts errors to user-friendly responses
 */
export function errorHandlerMiddleware(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Skip if response already sent
  if (res.headersSent) {
    return next(error);
  }

  const context: ErrorContext = {
    requestId: req.context?.requestId,
    userId: req.userId,
    additionalData: {
      method: req.method,
      path: req.path,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    }
  };

  // Convert to ThesisError if not already
  const thesisError = error instanceof ThesisError 
    ? error 
    : ErrorFactory.fromUnknown(error, ErrorCode.INTERNAL_SERVER_ERROR, context);

  // Log the error
  logger.error(
    `Request failed: ${req.method} ${req.path}`,
    thesisError,
    context
  );

  // Determine HTTP status code
  const statusCode = getHttpStatusCode(thesisError.code);

  // Build error response
  const errorResponse: ErrorResponse = {
    error: {
      code: thesisError.code,
      message: thesisError.userMessage.message,
      title: thesisError.userMessage.title,
      action: thesisError.userMessage.action,
      retryable: thesisError.isRetryable,
      requestId: context.requestId
    }
  };

  // Add debug information in development
  if (process.env.NODE_ENV !== 'production') {
    errorResponse.debug = {
      originalMessage: thesisError.message,
      stack: thesisError.stack,
      context: thesisError.context
    };
  }

  // Send error response
  res.status(statusCode).json(errorResponse);

  // Log request completion
  const duration = req.context ? performance.now() - req.context.startTime : 0;
  logger.logRequest(
    req.method,
    req.path,
    statusCode,
    duration,
    context,
    thesisError
  );
}

/**
 * Async error handler wrapper for route handlers
 */
export function asyncHandler<T extends Request, U extends Response>(
  fn: (req: T, res: U, next: NextFunction) => Promise<void>
) {
  return (req: T, res: U, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Validation error handler for request validation
 */
export function handleValidationError(
  errors: any[],
  req: Request
): never {
  const context: ErrorContext = {
    requestId: req.context?.requestId,
    userId: req.userId,
    additionalData: {
      validationErrors: errors,
      body: req.body,
      params: req.params,
      query: req.query
    }
  };

  const errorMessages = Array.isArray(errors) 
    ? errors.map(e => e.message || e.msg || String(e)).join('; ')
    : String(errors);

  throw ErrorFactory.createFromCode(
    ErrorCode.VALIDATION_ERROR,
    `Validation failed: ${errorMessages}`,
    context
  );
}

/**
 * Not found handler for unmatched routes
 */
export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
  const context: ErrorContext = {
    requestId: req.context?.requestId,
    userId: req.userId,
    additionalData: {
      method: req.method,
      path: req.path
    }
  };

  const error = ErrorFactory.createFromCode(
    ErrorCode.DOCUMENT_NOT_FOUND,
    `Route not found: ${req.method} ${req.path}`,
    context
  );

  next(error);
}

/**
 * Rate limiting error handler
 */
export function handleRateLimit(req: Request, res: Response, next: NextFunction): void {
  const context: ErrorContext = {
    requestId: req.context?.requestId,
    userId: req.userId,
    additionalData: {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    }
  };

  const error = ErrorFactory.createFromCode(
    ErrorCode.RATE_LIMIT_EXCEEDED,
    'Too many requests from this IP, please try again later',
    context
  );

  next(error);
}

/**
 * Request timeout handler
 */
export function timeoutHandler(timeout: number = 30000) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        const context: ErrorContext = {
          requestId: req.context?.requestId,
          userId: req.userId,
          additionalData: {
            timeout,
            method: req.method,
            path: req.path
          }
        };

        const error = ErrorFactory.createFromCode(
          ErrorCode.CONNECTION_TIMEOUT,
          `Request timeout after ${timeout}ms`,
          context
        );

        next(error);
      }
    }, timeout);

    // Clear timeout when response is finished
    res.on('finish', () => clearTimeout(timer));
    res.on('close', () => clearTimeout(timer));

    next();
  };
}

/**
 * Map error codes to HTTP status codes
 */
function getHttpStatusCode(errorCode: ErrorCode): number {
  const statusMap: Record<ErrorCode, number> = {
    // Authentication & Authorization (401, 403)
    [ErrorCode.AUTHENTICATION_FAILED]: 401,
    [ErrorCode.INVALID_TOKEN]: 401,
    [ErrorCode.TOKEN_EXPIRED]: 401,
    [ErrorCode.AUTHORIZATION_DENIED]: 403,

    // Validation & Input (400)
    [ErrorCode.VALIDATION_ERROR]: 400,
    [ErrorCode.INVALID_INPUT]: 400,
    [ErrorCode.MISSING_REQUIRED_FIELD]: 400,
    [ErrorCode.INVALID_FILE_TYPE]: 400,
    [ErrorCode.FILE_TOO_LARGE]: 413,

    // Not Found (404)
    [ErrorCode.DOCUMENT_NOT_FOUND]: 404,

    // Rate Limiting & Quotas (429)
    [ErrorCode.RATE_LIMIT_EXCEEDED]: 429,
    [ErrorCode.AI_QUOTA_EXCEEDED]: 429,
    [ErrorCode.QUOTA_EXCEEDED]: 429,

    // Timeouts (408)
    [ErrorCode.CONNECTION_TIMEOUT]: 408,

    // Service Unavailable (503)
    [ErrorCode.SERVICE_UNAVAILABLE]: 503,
    [ErrorCode.EXTERNAL_SERVICE_UNAVAILABLE]: 503,

    // Bad Gateway (502)
    [ErrorCode.AI_SERVICE_ERROR]: 502,

    // Internal Server Errors (500)
    [ErrorCode.DATABASE_ERROR]: 500,
    [ErrorCode.STORAGE_ERROR]: 500,
    [ErrorCode.INTERNAL_SERVER_ERROR]: 500,
    [ErrorCode.CONFIGURATION_ERROR]: 500,
    [ErrorCode.PDF_PROCESSING_FAILED]: 500,
    [ErrorCode.TEXT_EXTRACTION_FAILED]: 500,
    [ErrorCode.CHUNKING_FAILED]: 500,
    [ErrorCode.SOURCE_INGESTION_FAILED]: 500,
    [ErrorCode.EMBEDDING_GENERATION_FAILED]: 500,
    [ErrorCode.CONTENT_GENERATION_FAILED]: 500,
    [ErrorCode.RETRIEVAL_FAILED]: 500,
    [ErrorCode.DRAFTING_FAILED]: 500,
    [ErrorCode.CITATION_EXTRACTION_FAILED]: 500,
    [ErrorCode.CONSTITUTION_GENERATION_FAILED]: 500
  };

  return statusMap[errorCode] || 500;
}

/**
 * Error response interface
 */
interface ErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
    title: string;
    action?: string;
    retryable: boolean;
    requestId?: string;
  };
  debug?: {
    originalMessage: string;
    stack?: string;
    context: ErrorContext;
  };
}

/**
 * Health check with error handling
 */
export function healthCheck(req: Request, res: Response, next: NextFunction): void {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      requestId: req.context?.requestId,
      version: process.env.npm_package_version || 'unknown',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'unknown'
    };

    res.json(health);
  } catch (error) {
    next(error);
  }
}

/**
 * Graceful shutdown handler
 */
export function setupGracefulShutdown(server: any): void {
  const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2'] as const;

  signals.forEach(signal => {
    process.on(signal, () => {
      logger.info(`Received ${signal}, shutting down gracefully`);
      
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });

      // Force close after timeout
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    });
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', error);
    process.exit(1);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', reason as Error, {
      additionalData: { promise: promise.toString() }
    });
    process.exit(1);
  });
}