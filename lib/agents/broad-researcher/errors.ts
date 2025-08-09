/**
 * Custom error classes for Broad Researcher Agent
 */

/**
 * Base error class for agent-related errors
 */
export class AgentError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly retryable: boolean = false,
    public readonly details?: any
  ) {
    super(message)
    this.name = 'AgentError'
  }
}

/**
 * Error thrown when query generation fails
 */
export class QueryGenerationError extends AgentError {
  constructor(message: string, details?: any) {
    super(message, 'QUERY_GENERATION_ERROR', true, details)
    this.name = 'QueryGenerationError'
  }
}

/**
 * Error thrown when search execution fails
 */
export class SearchExecutionError extends AgentError {
  constructor(message: string, details?: any) {
    super(message, 'SEARCH_EXECUTION_ERROR', true, details)
    this.name = 'SearchExecutionError'
  }
}

/**
 * Error thrown when result processing fails
 */
export class ResultProcessingError extends AgentError {
  constructor(message: string, details?: any) {
    super(message, 'RESULT_PROCESSING_ERROR', false, details)
    this.name = 'ResultProcessingError'
  }
}

/**
 * Error thrown when summary generation fails
 */
export class SummaryGenerationError extends AgentError {
  constructor(message: string, details?: any) {
    super(message, 'SUMMARY_GENERATION_ERROR', true, details)
    this.name = 'SummaryGenerationError'
  }
}

/**
 * Error thrown when token limit is exceeded
 */
export class TokenLimitError extends AgentError {
  constructor(tokensUsed: number, limit: number) {
    super(
      `トークン上限を超過しました。使用: ${tokensUsed}, 上限: ${limit}`,
      'TOKEN_LIMIT_ERROR',
      false,
      { tokensUsed, limit }
    )
    this.name = 'TokenLimitError'
  }
}

/**
 * Error thrown when API cost limit is exceeded
 */
export class CostLimitError extends AgentError {
  constructor(currentCost: number, limit: number) {
    super(
      `APIコスト上限を超過しました。現在: ¥${currentCost}, 上限: ¥${limit}`,
      'COST_LIMIT_ERROR',
      false,
      { currentCost, limit }
    )
    this.name = 'CostLimitError'
  }
}

/**
 * Error thrown when execution timeout occurs
 */
export class ExecutionTimeoutError extends AgentError {
  constructor(timeout: number) {
    super(
      `実行時間が上限（${timeout}ms）を超過しました`,
      'EXECUTION_TIMEOUT_ERROR',
      false,
      { timeout }
    )
    this.name = 'ExecutionTimeoutError'
  }
}

/**
 * Error handler utility
 */
export class ErrorHandler {
  /**
   * Wrap an error with additional context
   */
  static wrapError(error: unknown, context: string): AgentError {
    if (error instanceof AgentError) {
      return error
    }

    if (error instanceof Error) {
      return new AgentError(
        `${context}: ${error.message}`,
        'WRAPPED_ERROR',
        false,
        { originalError: error.name, stack: error.stack }
      )
    }

    return new AgentError(
      `${context}: 不明なエラー`,
      'UNKNOWN_ERROR',
      false,
      { error: String(error) }
    )
  }

  /**
   * Determine if an error is retryable
   */
  static isRetryable(error: unknown): boolean {
    if (error instanceof AgentError) {
      return error.retryable
    }

    // Network errors are typically retryable
    if (error instanceof Error) {
      const message = error.message.toLowerCase()
      return (
        message.includes('network') ||
        message.includes('timeout') ||
        message.includes('connection') ||
        message.includes('econnrefused')
      )
    }

    return false
  }

  /**
   * Create a user-friendly error message
   */
  static getUserMessage(error: unknown): string {
    if (error instanceof TokenLimitError) {
      return 'トークン使用量が上限に達しました。より簡潔なテーマでお試しください。'
    }

    if (error instanceof CostLimitError) {
      return '月間のAPIコスト上限に達しました。管理者にお問い合わせください。'
    }

    if (error instanceof ExecutionTimeoutError) {
      return '処理時間が上限を超えました。より具体的なテーマでお試しください。'
    }

    if (error instanceof QueryGenerationError) {
      return '検索クエリの生成に失敗しました。テーマを変更してお試しください。'
    }

    if (error instanceof SearchExecutionError) {
      return 'Web検索の実行中にエラーが発生しました。しばらくしてから再度お試しください。'
    }

    if (error instanceof ResultProcessingError) {
      return '検索結果の処理中にエラーが発生しました。'
    }

    if (error instanceof SummaryGenerationError) {
      return '要約の生成に失敗しました。収集したデータは個別に確認できます。'
    }

    if (error instanceof AgentError) {
      return error.message
    }

    return '予期しないエラーが発生しました。しばらくしてから再度お試しください。'
  }
}