/**
 * Advanced Error Handling System
 * MVP Worker3 Support for Worker2
 * Real-time error recovery and resilience
 */

import { EventEmitter } from 'events';

type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';
type ErrorCategory = 'network' | 'websocket' | 'api' | 'database' | 'validation' | 'ui';

interface ErrorContext {
  severity: ErrorSeverity;
  category: ErrorCategory;
  component?: string;
  action?: string;
  userId?: string;
  timestamp: Date;
  retryCount?: number;
  metadata?: Record<string, any>;
}

interface ErrorRecoveryStrategy {
  shouldRetry: boolean;
  retryDelay?: number;
  maxRetries?: number;
  fallbackAction?: () => void;
  notifyUser?: boolean;
  logToServer?: boolean;
}

/**
 * Central Error Handler
 * Manages all application errors with smart recovery
 */
export class ErrorHandler extends EventEmitter {
  private static instance: ErrorHandler;
  private errorQueue: Array<Error & ErrorContext> = [];
  private retryTimers = new Map<string, NodeJS.Timeout>();
  private errorCounts = new Map<string, number>();
  private isOffline = false;

  private constructor() {
    super();
    this.setupGlobalHandlers();
    this.startHealthCheck();
  }

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Handle error with automatic recovery
   */
  async handleError(
    error: Error,
    context: Partial<ErrorContext> = {}
  ): Promise<void> {
    const fullContext: ErrorContext = {
      severity: context.severity || this.determineSeverity(error),
      category: context.category || this.categorizeError(error),
      timestamp: new Date(),
      retryCount: 0,
      ...context
    };

    // Enrich error with context
    const enrichedError = Object.assign(error, fullContext);
    
    // Add to queue for batch processing
    this.errorQueue.push(enrichedError);

    // Get recovery strategy
    const strategy = this.getRecoveryStrategy(enrichedError);

    // Execute recovery
    await this.executeRecovery(enrichedError, strategy);

    // Emit for monitoring
    this.emit('error', enrichedError);
  }

  /**
   * Determine error severity automatically
   */
  private determineSeverity(error: Error): ErrorSeverity {
    const message = error.message.toLowerCase();
    
    if (message.includes('critical') || message.includes('fatal')) {
      return 'critical';
    }
    if (message.includes('failed') || message.includes('error')) {
      return 'high';
    }
    if (message.includes('warning') || message.includes('retry')) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Categorize error automatically
   */
  private categorizeError(error: Error): ErrorCategory {
    const message = error.message.toLowerCase();
    const name = error.name?.toLowerCase() || '';

    if (message.includes('websocket') || message.includes('ws://')) {
      return 'websocket';
    }
    if (message.includes('network') || message.includes('fetch')) {
      return 'network';
    }
    if (message.includes('api') || message.includes('endpoint')) {
      return 'api';
    }
    if (message.includes('database') || message.includes('supabase')) {
      return 'database';
    }
    if (message.includes('validation') || name.includes('validation')) {
      return 'validation';
    }
    return 'ui';
  }

  /**
   * Get recovery strategy based on error type
   */
  private getRecoveryStrategy(
    error: Error & ErrorContext
  ): ErrorRecoveryStrategy {
    const strategies: Record<ErrorCategory, ErrorRecoveryStrategy> = {
      websocket: {
        shouldRetry: true,
        retryDelay: 1000,
        maxRetries: 5,
        fallbackAction: () => this.fallbackToPolling(),
        notifyUser: false,
        logToServer: true
      },
      network: {
        shouldRetry: true,
        retryDelay: 2000,
        maxRetries: 3,
        fallbackAction: () => this.useOfflineMode(),
        notifyUser: true,
        logToServer: false
      },
      api: {
        shouldRetry: true,
        retryDelay: 1500,
        maxRetries: 3,
        fallbackAction: () => this.useCachedData(),
        notifyUser: true,
        logToServer: true
      },
      database: {
        shouldRetry: true,
        retryDelay: 3000,
        maxRetries: 2,
        fallbackAction: () => this.useLocalStorage(),
        notifyUser: true,
        logToServer: true
      },
      validation: {
        shouldRetry: false,
        notifyUser: true,
        logToServer: false
      },
      ui: {
        shouldRetry: false,
        notifyUser: false,
        logToServer: true
      }
    };

    return strategies[error.category] || strategies.ui;
  }

  /**
   * Execute recovery strategy
   */
  private async executeRecovery(
    error: Error & ErrorContext,
    strategy: ErrorRecoveryStrategy
  ): Promise<void> {
    const errorKey = `${error.category}-${error.message}`;
    const retryCount = this.errorCounts.get(errorKey) || 0;

    // Check if should retry
    if (strategy.shouldRetry && retryCount < (strategy.maxRetries || 3)) {
      this.errorCounts.set(errorKey, retryCount + 1);
      
      // Schedule retry
      const timer = setTimeout(() => {
        this.emit('retry', { error, attempt: retryCount + 1 });
        this.retryTimers.delete(errorKey);
      }, strategy.retryDelay || 1000);
      
      this.retryTimers.set(errorKey, timer);
    } else if (strategy.fallbackAction) {
      // Execute fallback
      strategy.fallbackAction();
    }

    // Notify user if needed
    if (strategy.notifyUser) {
      this.notifyUser(error);
    }

    // Log to server if needed
    if (strategy.logToServer && !this.isOffline) {
      await this.logToServer(error);
    }
  }

  /**
   * Fallback to polling when WebSocket fails
   */
  private fallbackToPolling(): void {
    console.log('🔄 Falling back to polling mode');
    this.emit('fallback', { type: 'polling', reason: 'websocket_failure' });
  }

  /**
   * Switch to offline mode
   */
  private useOfflineMode(): void {
    console.log('📴 Switching to offline mode');
    this.isOffline = true;
    this.emit('offline', { timestamp: new Date() });
  }

  /**
   * Use cached data as fallback
   */
  private useCachedData(): void {
    console.log('💾 Using cached data');
    this.emit('cache-fallback', { timestamp: new Date() });
  }

  /**
   * Use localStorage as database fallback
   */
  private useLocalStorage(): void {
    console.log('🗄️ Using localStorage fallback');
    this.emit('storage-fallback', { timestamp: new Date() });
  }

  /**
   * Notify user about error
   */
  private notifyUser(error: Error & ErrorContext): void {
    const messages: Record<ErrorSeverity, string> = {
      low: `Minor issue: ${error.message}`,
      medium: `Warning: ${error.message}`,
      high: `Error: ${error.message}`,
      critical: `Critical Error: ${error.message}`
    };

    this.emit('user-notification', {
      message: messages[error.severity],
      severity: error.severity,
      category: error.category
    });
  }

  /**
   * Log error to server
   */
  private async logToServer(error: Error & ErrorContext): Promise<void> {
    try {
      await fetch('/api/errors/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          context: error
        })
      });
    } catch (logError) {
      console.error('Failed to log error to server:', logError);
    }
  }

  /**
   * Setup global error handlers
   */
  private setupGlobalHandlers(): void {
    // Browser global error handler
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.handleError(new Error(event.message), {
          severity: 'high',
          category: 'ui'
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.handleError(new Error(event.reason?.message || 'Unhandled Promise rejection'), {
          severity: 'high',
          category: 'api'
        });
      });
    }

    // Node.js global error handler
    if (typeof process !== 'undefined') {
      process.on('uncaughtException', (error) => {
        this.handleError(error, {
          severity: 'critical',
          category: 'api'
        });
      });

      process.on('unhandledRejection', (reason) => {
        this.handleError(new Error(String(reason)), {
          severity: 'critical',
          category: 'api'
        });
      });
    }
  }

  /**
   * Start health check monitoring
   */
  private startHealthCheck(): void {
    setInterval(() => {
      // Clear old errors
      const now = Date.now();
      this.errorQueue = this.errorQueue.filter(
        (error) => now - error.timestamp.getTime() < 3600000 // Keep 1 hour
      );

      // Check if back online
      if (this.isOffline) {
        this.checkConnection();
      }

      // Emit health status
      this.emit('health', {
        errorCount: this.errorQueue.length,
        isOffline: this.isOffline,
        retryQueueSize: this.retryTimers.size
      });
    }, 30000); // Every 30 seconds
  }

  /**
   * Check connection status
   */
  private async checkConnection(): Promise<void> {
    try {
      const response = await fetch('/api/health', {
        method: 'HEAD',
        mode: 'no-cors'
      });
      
      if (response.ok || response.type === 'opaque') {
        this.isOffline = false;
        this.emit('online', { timestamp: new Date() });
      }
    } catch {
      // Still offline
    }
  }

  /**
   * Get error statistics
   */
  getStatistics(): {
    total: number;
    bySeverity: Record<ErrorSeverity, number>;
    byCategory: Record<ErrorCategory, number>;
    recentErrors: Array<Error & ErrorContext>;
  } {
    const bySeverity: Record<ErrorSeverity, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    };

    const byCategory: Record<ErrorCategory, number> = {
      network: 0,
      websocket: 0,
      api: 0,
      database: 0,
      validation: 0,
      ui: 0
    };

    this.errorQueue.forEach((error) => {
      bySeverity[error.severity]++;
      byCategory[error.category]++;
    });

    return {
      total: this.errorQueue.length,
      bySeverity,
      byCategory,
      recentErrors: this.errorQueue.slice(-10)
    };
  }

  /**
   * Clear all errors and reset state
   */
  clearAll(): void {
    this.errorQueue = [];
    this.errorCounts.clear();
    this.retryTimers.forEach((timer) => clearTimeout(timer));
    this.retryTimers.clear();
    this.emit('cleared', { timestamp: new Date() });
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();

// Export types
export type { ErrorContext, ErrorRecoveryStrategy, ErrorSeverity, ErrorCategory };