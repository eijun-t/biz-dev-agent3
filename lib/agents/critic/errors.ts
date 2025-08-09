/**
 * Critic Agent Error Handling
 * エラーハンドリングとリトライロジック
 */

import { CriticError, CriticErrorCode } from '@/lib/types/critic';

/**
 * エラーがリトライ可能かどうかを判定
 */
export function isRetryableError(error: Error): boolean {
  if (error instanceof CriticError) {
    return error.isRetryable;
  }

  // Network errors are retryable
  if (error.message.includes('ECONNREFUSED') || 
      error.message.includes('ETIMEDOUT') ||
      error.message.includes('ENOTFOUND')) {
    return true;
  }

  // Rate limit errors are retryable
  if (error.message.includes('429') || 
      error.message.includes('rate limit') ||
      error.message.includes('Too Many Requests')) {
    return true;
  }

  // Temporary OpenAI errors are retryable
  if (error.message.includes('500') ||
      error.message.includes('502') ||
      error.message.includes('503') ||
      error.message.includes('504')) {
    return true;
  }

  return false;
}

/**
 * エラーをCriticErrorに変換
 */
export function toCriticError(error: unknown): CriticError {
  if (error instanceof CriticError) {
    return error;
  }

  if (error instanceof Error) {
    // Determine error code based on message
    let code = CriticErrorCode.EVALUATION_FAILED;
    let isRetryable = false;

    if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
      code = CriticErrorCode.TIMEOUT;
      isRetryable = true;
    } else if (error.message.includes('Invalid input') || error.message.includes('validation')) {
      code = CriticErrorCode.INVALID_INPUT;
      isRetryable = false;
    } else if (error.message.includes('LLM') || error.message.includes('OpenAI') || error.message.includes('GPT')) {
      code = CriticErrorCode.LLM_ERROR;
      isRetryable = isRetryableError(error);
    } else if (error.message.includes('cache')) {
      code = CriticErrorCode.CACHE_ERROR;
      isRetryable = false;
    } else if (error.message.includes('config')) {
      code = CriticErrorCode.CONFIG_ERROR;
      isRetryable = false;
    }

    return new CriticError(
      code,
      error.message,
      { originalError: error.stack },
      isRetryable
    );
  }

  // Unknown error
  return new CriticError(
    CriticErrorCode.EVALUATION_FAILED,
    'Unknown error occurred',
    { error: String(error) },
    false
  );
}

/**
 * リトライディレイを計算（指数バックオフ）
 */
export function calculateRetryDelay(attempt: number): number {
  // 1st attempt: 1000ms, 2nd: 2000ms, 3rd: 4000ms
  return Math.min(1000 * Math.pow(2, attempt - 1), 10000);
}

/**
 * リトライロジック
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 2,
  onRetry?: (attempt: number, error: Error) => void
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if error is retryable
      if (!isRetryableError(lastError)) {
        throw lastError;
      }

      // If this was the last attempt, throw the error
      if (attempt > maxRetries) {
        throw lastError;
      }

      // Calculate delay and wait
      const delay = calculateRetryDelay(attempt);
      
      // Call retry callback if provided
      if (onRetry) {
        onRetry(attempt, lastError);
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError || new Error('Retry failed');
}

/**
 * エラーメッセージをユーザーフレンドリーに変換
 */
export function formatErrorMessage(error: CriticError): string {
  switch (error.code) {
    case CriticErrorCode.INVALID_INPUT:
      return '入力データが不正です。ビジネスアイデアの形式を確認してください。';
    
    case CriticErrorCode.LLM_ERROR:
      return 'AI評価モデルへの接続に失敗しました。しばらく待ってから再試行してください。';
    
    case CriticErrorCode.EVALUATION_FAILED:
      return '評価処理中にエラーが発生しました。入力データを確認してください。';
    
    case CriticErrorCode.TIMEOUT:
      return '評価処理がタイムアウトしました。アイデアの数を減らすか、後で再試行してください。';
    
    case CriticErrorCode.CACHE_ERROR:
      return 'キャッシュアクセスエラーが発生しました。処理は継続されます。';
    
    case CriticErrorCode.CONFIG_ERROR:
      return '設定エラーが発生しました。評価設定を確認してください。';
    
    default:
      return `エラーが発生しました: ${error.message}`;
  }
}

/**
 * エラーログ用の詳細情報を生成
 */
export function getErrorDetails(error: CriticError): Record<string, any> {
  return {
    code: error.code,
    message: error.message,
    isRetryable: error.isRetryable,
    details: error.details,
    stack: error.stack,
    timestamp: new Date().toISOString(),
  };
}

/**
 * 部分的な結果を保存するためのエラーラッパー
 */
export class PartialResultError extends CriticError {
  constructor(
    message: string,
    public partialResults: any[],
    public failedItems: any[]
  ) {
    super(
      CriticErrorCode.EVALUATION_FAILED,
      message,
      { partialResults, failedItems },
      false
    );
    this.name = 'PartialResultError';
  }
}

/**
 * タイムアウトエラー
 */
export class TimeoutError extends CriticError {
  constructor(message: string, timeoutMs: number) {
    super(
      CriticErrorCode.TIMEOUT,
      message,
      { timeoutMs },
      true
    );
    this.name = 'TimeoutError';
  }
}

/**
 * タイムアウト付きPromise実行
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage?: string
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new TimeoutError(
        timeoutMessage || `Operation timed out after ${timeoutMs}ms`,
        timeoutMs
      ));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}