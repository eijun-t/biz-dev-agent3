import { createServiceLogger } from '@/lib/utils/logger';

export enum WriterErrorCode {
  TIMEOUT = 'WRITER_TIMEOUT',
  DATA_INTEGRATION_FAILED = 'DATA_INTEGRATION_FAILED',
  GENERATION_FAILED = 'GENERATION_FAILED',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  PARTIAL_GENERATION = 'PARTIAL_GENERATION',
  UNKNOWN = 'UNKNOWN_ERROR'
}

export class WriterError extends Error {
  code: WriterErrorCode
  phase?: string
  partialContent?: any
  originalError?: Error

  constructor(
    message: string,
    code: WriterErrorCode,
    options?: {
      phase?: string
      partialContent?: any
      originalError?: Error
    }
  ) {
    super(message)
    this.name = 'WriterError'
    this.code = code
    this.phase = options?.phase
    this.partialContent = options?.partialContent
    this.originalError = options?.originalError
  }
}

export class WriterErrorHandler {
  private maxRetries: number = 3
  private baseDelay: number = 1000
  private maxDelay: number = 10000
  private logger = createServiceLogger('WriterErrorHandler')

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: {
      phase: string
      sessionId: string
      onPartialContent?: (content: any) => void
    }
  ): Promise<T> {
    let lastError: Error | undefined
    let partialContent: any = undefined

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await operation()
        return result
      } catch (error) {
        lastError = error as Error
        
        if (this.isRetriableError(error)) {
          const delay = this.calculateBackoffDelay(attempt)
          
          console.log(
            `Attempt ${attempt}/${this.maxRetries} failed for ${context.phase}. ` +
            `Retrying in ${delay}ms...`
          )
          
          if (context.onPartialContent && partialContent) {
            context.onPartialContent(partialContent)
          }
          
          await this.delay(delay)
        } else {
          throw new WriterError(
            `Non-retriable error in ${context.phase}: ${lastError.message}`,
            WriterErrorCode.GENERATION_FAILED,
            {
              phase: context.phase,
              partialContent,
              originalError: lastError
            }
          )
        }
      }
    }

    throw new WriterError(
      `Max retries (${this.maxRetries}) exceeded for ${context.phase}`,
      WriterErrorCode.GENERATION_FAILED,
      {
        phase: context.phase,
        partialContent,
        originalError: lastError
      }
    )
  }

  private isRetriableError(error: any): boolean {
    if (error instanceof WriterError) {
      return error.code === WriterErrorCode.TIMEOUT ||
             error.code === WriterErrorCode.PARTIAL_GENERATION
    }

    const errorMessage = error?.message?.toLowerCase() || ''
    const retriablePatterns = [
      'timeout',
      'network',
      'connection',
      'rate limit',
      'temporary',
      'unavailable'
    ]

    return retriablePatterns.some(pattern => errorMessage.includes(pattern))
  }

  private calculateBackoffDelay(attempt: number): number {
    const exponentialDelay = this.baseDelay * Math.pow(2, attempt - 1)
    const jitteredDelay = exponentialDelay * (0.5 + Math.random() * 0.5)
    return Math.min(jitteredDelay, this.maxDelay)
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async savePartialContent(
    sessionId: string,
    partialContent: any,
    phase: string
  ): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const key = `writer_partial_${sessionId}`
        const data = {
          sessionId,
          phase,
          content: partialContent,
          timestamp: Date.now()
        }
        window.localStorage.setItem(key, JSON.stringify(data))
      }
    } catch (error) {
      this.logger.error('Failed to save partial content', error as Error, {
        sessionId,
        phase
      })
    }
  }

  async loadPartialContent(sessionId: string): Promise<any | null> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const key = `writer_partial_${sessionId}`
        const data = window.localStorage.getItem(key)
        
        if (data) {
          const parsed = JSON.parse(data)
          const hourAgo = Date.now() - (60 * 60 * 1000)
          
          if (parsed.timestamp > hourAgo) {
            return parsed.content
          } else {
            window.localStorage.removeItem(key)
          }
        }
      }
    } catch (error) {
      this.logger.error('Failed to load partial content', error as Error, {
        sessionId
      })
    }
    
    return null
  }

  clearPartialContent(sessionId: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const key = `writer_partial_${sessionId}`
        window.localStorage.removeItem(key)
      }
    } catch (error) {
      this.logger.error('Failed to clear partial content', error as Error, {
        sessionId
      })
    }
  }

  formatUserMessage(error: WriterError): string {
    switch (error.code) {
      case WriterErrorCode.TIMEOUT:
        return 'レポート生成がタイムアウトしました。もう一度お試しください。'
      case WriterErrorCode.DATA_INTEGRATION_FAILED:
        return 'データ統合中にエラーが発生しました。入力データを確認してください。'
      case WriterErrorCode.GENERATION_FAILED:
        return `レポート生成中にエラーが発生しました（フェーズ: ${error.phase || '不明'}）。`
      case WriterErrorCode.VALIDATION_FAILED:
        return '入力データの検証に失敗しました。データ形式を確認してください。'
      case WriterErrorCode.PARTIAL_GENERATION:
        return 'レポートの一部のみ生成されました。完全なレポートを生成するには再試行してください。'
      default:
        return 'レポート生成中に予期しないエラーが発生しました。'
    }
  }
}