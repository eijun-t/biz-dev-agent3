/**
 * Structured Logging System
 * 
 * Provides environment-aware logging with multiple levels and formats
 * Replaces console.error with structured, production-ready logging
 */

import { format } from 'date-fns';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

export interface LogContext {
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: Error;
  stack?: string;
}

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;
  private enableConsole: boolean;
  private logFormat: 'json' | 'text';
  private isDevelopment: boolean;

  private constructor() {
    // Initialize from environment variables
    this.logLevel = (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO;
    this.enableConsole = process.env.ENABLE_CONSOLE_LOG !== 'false';
    this.logFormat = (process.env.LOG_FORMAT as 'json' | 'text') || 'json';
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Check if a log level should be output based on current configuration
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex <= currentLevelIndex;
  }

  /**
   * Format log entry based on configuration
   */
  private formatLogEntry(entry: LogEntry): string {
    if (this.logFormat === 'json') {
      return JSON.stringify({
        ...entry,
        env: process.env.NODE_ENV,
        service: 'biz-dev-agent'
      });
    }

    // Text format for development
    const levelEmoji = {
      [LogLevel.ERROR]: '❌',
      [LogLevel.WARN]: '⚠️',
      [LogLevel.INFO]: 'ℹ️',
      [LogLevel.DEBUG]: '🔍'
    };

    let output = `${levelEmoji[entry.level]} [${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}`;
    
    if (entry.context) {
      output += `\n   Context: ${JSON.stringify(entry.context, null, 2)}`;
    }
    
    if (entry.error && entry.stack) {
      output += `\n   Stack: ${entry.stack}`;
    }

    return output;
  }

  /**
   * Internal log method
   */
  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
      level,
      message,
      context,
      error: error ? { name: error.name, message: error.message } as any : undefined,
      stack: error?.stack
    };

    const formattedEntry = this.formatLogEntry(entry);

    // Output to console if enabled
    if (this.enableConsole) {
      switch (level) {
        case LogLevel.ERROR:
          console.error(formattedEntry);
          break;
        case LogLevel.WARN:
          console.warn(formattedEntry);
          break;
        case LogLevel.INFO:
          console.info(formattedEntry);
          break;
        case LogLevel.DEBUG:
          console.debug(formattedEntry);
          break;
      }
    }

    // In production, send to external logging service
    if (!this.isDevelopment && level === LogLevel.ERROR) {
      this.sendToExternalLogger(entry);
    }
  }

  /**
   * Send logs to external service (e.g., Sentry, DataDog)
   */
  private async sendToExternalLogger(entry: LogEntry): Promise<void> {
    // TODO: Implement integration with external logging service
    // For now, we'll just store critical errors
    if (typeof window === 'undefined') {
      // Server-side logging
      try {
        // Could write to file or send to logging service
        const fs = await import('fs/promises');
        const logFile = `./logs/error-${format(new Date(), 'yyyy-MM-dd')}.log`;
        await fs.appendFile(logFile, JSON.stringify(entry) + '\n').catch(() => {
          // Silently fail if logs directory doesn't exist
        });
      } catch {
        // Silently fail in production
      }
    }
  }

  // Public logging methods
  public error(message: string, error?: Error, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  public warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  public info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  public debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Create a child logger with additional context
   */
  public child(context: LogContext): LoggerWithContext {
    return new LoggerWithContext(this, context);
  }

  /**
   * Log method execution time
   */
  public async measureTime<T>(
    operation: string,
    fn: () => Promise<T>,
    context?: LogContext
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      
      this.debug(`${operation} completed`, {
        ...context,
        duration_ms: duration
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.error(`${operation} failed`, error as Error, {
        ...context,
        duration_ms: duration
      });
      
      throw error;
    }
  }
}

/**
 * Logger with additional context
 */
class LoggerWithContext {
  constructor(
    private parent: Logger,
    private context: LogContext
  ) {}

  public error(message: string, error?: Error, additionalContext?: LogContext): void {
    this.parent.error(message, error, { ...this.context, ...additionalContext });
  }

  public warn(message: string, additionalContext?: LogContext): void {
    this.parent.warn(message, { ...this.context, ...additionalContext });
  }

  public info(message: string, additionalContext?: LogContext): void {
    this.parent.info(message, { ...this.context, ...additionalContext });
  }

  public debug(message: string, additionalContext?: LogContext): void {
    this.parent.debug(message, { ...this.context, ...additionalContext });
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Export convenience functions for backward compatibility
export const logError = (message: string, error?: Error, context?: LogContext) => 
  logger.error(message, error, context);

export const logWarn = (message: string, context?: LogContext) => 
  logger.warn(message, context);

export const logInfo = (message: string, context?: LogContext) => 
  logger.info(message, context);

export const logDebug = (message: string, context?: LogContext) => 
  logger.debug(message, context);

// Agent-specific logger factory
export function createAgentLogger(agentName: string): LoggerWithContext {
  return logger.child({ agent: agentName });
}

// API-specific logger factory
export function createAPILogger(endpoint: string): LoggerWithContext {
  return logger.child({ api: endpoint });
}

// Service-specific logger factory  
export function createServiceLogger(service: string): LoggerWithContext {
  return logger.child({ service });
}