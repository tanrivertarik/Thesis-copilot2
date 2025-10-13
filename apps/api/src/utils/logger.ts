/**
 * Logging Utility
 * 
 * Structured logging for debugging, monitoring, and error tracking
 * in Thesis Copilot services.
 */

import { ThesisError, ErrorContext } from './errors.js';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn', 
  INFO = 'info',
  DEBUG = 'debug'
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  service?: string;
  userId?: string;
  projectId?: string;
  requestId?: string;
  duration?: number;
  metadata?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    code?: string;
    stack?: string;
    context?: ErrorContext;
  };
}

class Logger {
  private serviceName: string;
  private isProduction: boolean;

  constructor(serviceName = 'thesis-copilot-api') {
    this.serviceName = serviceName;
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  /**
   * Log an error with full context
   */
  error(message: string, error?: Error | ThesisError, context: ErrorContext = {}): void {
    const logEntry: LogEntry = {
      level: LogLevel.ERROR,
      message,
      timestamp: new Date().toISOString(),
      service: this.serviceName,
      userId: context.userId,
      projectId: context.projectId,
      requestId: context.requestId,
      metadata: context.additionalData
    };

    if (error) {
      if (error instanceof ThesisError) {
        logEntry.error = {
          name: error.name,
          message: error.message,
          code: error.code,
          stack: this.isProduction ? undefined : error.stack,
          context: error.context
        };
      } else {
        logEntry.error = {
          name: error.name,
          message: error.message,
          stack: this.isProduction ? undefined : error.stack
        };
      }
    }

    this.writeLog(logEntry);
  }

  /**
   * Log a warning
   */
  warn(message: string, context: ErrorContext = {}, metadata?: Record<string, unknown>): void {
    const logEntry: LogEntry = {
      level: LogLevel.WARN,
      message,
      timestamp: new Date().toISOString(),
      service: this.serviceName,
      userId: context.userId,
      projectId: context.projectId,
      requestId: context.requestId,
      metadata: { ...context.additionalData, ...metadata }
    };

    this.writeLog(logEntry);
  }

  /**
   * Log informational message
   */
  info(message: string, context: ErrorContext = {}, metadata?: Record<string, unknown>): void {
    const logEntry: LogEntry = {
      level: LogLevel.INFO,
      message,
      timestamp: new Date().toISOString(),
      service: this.serviceName,
      userId: context.userId,
      projectId: context.projectId,
      requestId: context.requestId,
      metadata: { ...context.additionalData, ...metadata }
    };

    this.writeLog(logEntry);
  }

  /**
   * Log debug information (only in development)
   */
  debug(message: string, context: ErrorContext = {}, metadata?: Record<string, unknown>): void {
    if (this.isProduction) return;

    const logEntry: LogEntry = {
      level: LogLevel.DEBUG,
      message,
      timestamp: new Date().toISOString(),
      service: this.serviceName,
      userId: context.userId,
      projectId: context.projectId,
      requestId: context.requestId,
      metadata: { ...context.additionalData, ...metadata }
    };

    this.writeLog(logEntry);
  }

  /**
   * Log API request/response
   */
  logRequest(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    context: ErrorContext = {},
    error?: Error | ThesisError
  ): void {
    const level = statusCode >= 500 ? LogLevel.ERROR : statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;
    
    const logEntry: LogEntry = {
      level,
      message: `${method} ${path} ${statusCode}`,
      timestamp: new Date().toISOString(),
      service: this.serviceName,
      userId: context.userId,
      projectId: context.projectId,
      requestId: context.requestId,
      duration,
      metadata: {
        method,
        path,
        statusCode,
        ...context.additionalData
      }
    };

    if (error) {
      if (error instanceof ThesisError) {
        logEntry.error = {
          name: error.name,
          message: error.message,
          code: error.code,
          stack: this.isProduction ? undefined : error.stack,
          context: error.context
        };
      } else {
        logEntry.error = {
          name: error.name,
          message: error.message,
          stack: this.isProduction ? undefined : error.stack
        };
      }
    }

    this.writeLog(logEntry);
  }

  /**
   * Log service performance metrics
   */
  logMetrics(operation: string, duration: number, context: ErrorContext = {}, metadata?: Record<string, unknown>): void {
    const logEntry: LogEntry = {
      level: LogLevel.INFO,
      message: `${operation} completed in ${duration}ms`,
      timestamp: new Date().toISOString(),
      service: this.serviceName,
      userId: context.userId,
      projectId: context.projectId,
      requestId: context.requestId,
      duration,
      metadata: {
        operation,
        ...context.additionalData,
        ...metadata
      }
    };

    this.writeLog(logEntry);
  }

  /**
   * Write log entry to output
   */
  private writeLog(logEntry: LogEntry): void {
    if (this.isProduction) {
      // In production, use structured JSON logging
      console.log(JSON.stringify(logEntry));
    } else {
      // In development, use more readable format
      const timestamp = logEntry.timestamp;
      const level = logEntry.level.toUpperCase().padEnd(5);
      const service = logEntry.service;
      const message = logEntry.message;
      
      let output = `[${timestamp}] ${level} [${service}] ${message}`;

      // Add context information
      if (logEntry.userId || logEntry.projectId || logEntry.requestId) {
        const contextParts = [];
        if (logEntry.userId) contextParts.push(`user:${logEntry.userId}`);
        if (logEntry.projectId) contextParts.push(`project:${logEntry.projectId}`);
        if (logEntry.requestId) contextParts.push(`req:${logEntry.requestId}`);
        if (logEntry.duration) contextParts.push(`${logEntry.duration}ms`);
        output += ` [${contextParts.join(' | ')}]`;
      }

      // Add metadata
      if (logEntry.metadata && Object.keys(logEntry.metadata).length > 0) {
        output += `\n  Metadata: ${JSON.stringify(logEntry.metadata, null, 2)}`;
      }

      // Add error details
      if (logEntry.error) {
        output += `\n  Error: ${logEntry.error.name}: ${logEntry.error.message}`;
        if (logEntry.error.code) {
          output += ` [${logEntry.error.code}]`;
        }
        if (logEntry.error.stack) {
          output += `\n  Stack: ${logEntry.error.stack}`;
        }
        if (logEntry.error.context) {
          output += `\n  Context: ${JSON.stringify(logEntry.error.context, null, 2)}`;
        }
      }

      // Use appropriate console method based on level
      switch (logEntry.level) {
        case LogLevel.ERROR:
          console.error(output);
          break;
        case LogLevel.WARN:
          console.warn(output);
          break;
        case LogLevel.DEBUG:
          console.debug(output);
          break;
        default:
          console.log(output);
      }
    }
  }
}

// Export singleton logger instance
export const logger = new Logger();

/**
 * Create a child logger with a specific service name
 */
export function createLogger(serviceName: string): Logger {
  return new Logger(serviceName);
}

/**
 * Performance measurement decorator
 */
export function logPerformance(operation: string, context: ErrorContext = {}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const startTime = performance.now();
      
      try {
        const result = await method.apply(this, args);
        const duration = performance.now() - startTime;
        
        logger.logMetrics(
          `${target.constructor.name}.${propertyName}`,
          duration,
          context,
          { operation, args: args.map((arg, i) => `arg${i}: ${typeof arg}`) }
        );

        return result;
      } catch (error) {
        const duration = performance.now() - startTime;
        
        logger.error(
          `${target.constructor.name}.${propertyName} failed after ${duration}ms`,
          error as Error,
          context
        );

        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Request context middleware utility
 */
export interface RequestContext {
  requestId: string;
  userId?: string;
  projectId?: string;
  startTime: number;
}

export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function createRequestContext(userId?: string, projectId?: string): RequestContext {
  return {
    requestId: generateRequestId(),
    userId,
    projectId,
    startTime: performance.now()
  };
}

export function logRequestCompletion(
  context: RequestContext,
  method: string,
  path: string,
  statusCode: number,
  error?: Error | ThesisError
): void {
  const duration = performance.now() - context.startTime;
  
  logger.logRequest(
    method,
    path,
    statusCode,
    duration,
    {
      userId: context.userId,
      projectId: context.projectId,
      requestId: context.requestId
    },
    error
  );
}