/**
 * Ideator Agent Errors
 * エラークラスとエラーハンドリング
 */

import { IdeatorErrorCode } from '../../types/ideator';
import { ERROR_MESSAGES } from './constants';

/**
 * Ideatorエージェント用カスタムエラークラス
 */
export class IdeatorError extends Error {
  public readonly code: IdeatorErrorCode;
  public readonly details?: any;
  public readonly timestamp: Date;
  public readonly retryable: boolean;

  constructor(
    message: string,
    code: IdeatorErrorCode,
    details?: any,
    retryable: boolean = true
  ) {
    super(message);
    this.name = 'IdeatorError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date();
    this.retryable = retryable;

    // スタックトレースを適切に設定
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, IdeatorError);
    }
  }

  /**
   * エラーコードからエラーメッセージを取得
   */
  static fromCode(
    code: IdeatorErrorCode,
    details?: any,
    customMessage?: string
  ): IdeatorError {
    const message = customMessage || ERROR_MESSAGES[code] || 'Unknown error occurred';
    
    // 特定のエラーコードに対してリトライ不可を設定
    const nonRetryableCodes: IdeatorErrorCode[] = [
      IdeatorErrorCode.INSUFFICIENT_INPUT,
      IdeatorErrorCode.VALIDATION_FAILED,
      IdeatorErrorCode.TOKEN_LIMIT_EXCEEDED
    ];
    
    const retryable = !nonRetryableCodes.includes(code);
    
    return new IdeatorError(message, code, details, retryable);
  }

  /**
   * 標準エラーからIdeatorErrorへの変換
   */
  static fromError(
    error: unknown,
    defaultCode: IdeatorErrorCode = IdeatorErrorCode.LLM_GENERATION_FAILED
  ): IdeatorError {
    if (error instanceof IdeatorError) {
      return error;
    }

    if (error instanceof Error) {
      // OpenAI/LangChainのエラーを解析
      const errorDetails = {
        originalMessage: error.message,
        stack: error.stack,
        name: error.name
      };

      // 特定のエラータイプを識別
      if (error.message.includes('token') || error.message.includes('context_length')) {
        return IdeatorError.fromCode(
          IdeatorErrorCode.TOKEN_LIMIT_EXCEEDED,
          errorDetails
        );
      }

      if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
        return IdeatorError.fromCode(
          IdeatorErrorCode.TIMEOUT,
          errorDetails
        );
      }

      if (error.message.includes('Invalid') || error.message.includes('validation')) {
        return IdeatorError.fromCode(
          IdeatorErrorCode.VALIDATION_FAILED,
          errorDetails
        );
      }

      if ((error as any).status === 429) {
        // Rate limit error
        return new IdeatorError(
          'Rate limit exceeded. Please retry after some time.',
          IdeatorErrorCode.LLM_GENERATION_FAILED,
          errorDetails,
          true // リトライ可能
        );
      }

      if ((error as any).status === 401) {
        // Authentication error
        return new IdeatorError(
          'Authentication failed. Please check API credentials.',
          IdeatorErrorCode.LLM_GENERATION_FAILED,
          errorDetails,
          false // リトライ不可
        );
      }

      return new IdeatorError(
        error.message,
        defaultCode,
        errorDetails,
        true
      );
    }

    // 未知のエラータイプ
    return new IdeatorError(
      'An unknown error occurred',
      defaultCode,
      { originalError: error },
      true
    );
  }

  /**
   * エラーを構造化されたオブジェクトとして取得
   */
  toObject() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp,
      retryable: this.retryable,
      stack: this.stack
    };
  }

  /**
   * エラーをJSON文字列として取得
   */
  toJSON(): string {
    return JSON.stringify(this.toObject(), null, 2);
  }
}

/**
 * エラーコードの判定ヘルパー
 */
export const isRetryableError = (error: unknown): boolean => {
  if (error instanceof IdeatorError) {
    return error.retryable;
  }
  
  if (error instanceof Error) {
    // ネットワークエラーやタイムアウトはリトライ可能
    if (
      error.message.includes('network') ||
      error.message.includes('timeout') ||
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('ETIMEDOUT')
    ) {
      return true;
    }

    // レート制限はリトライ可能
    if ((error as any).status === 429) {
      return true;
    }

    // 認証エラーや検証エラーはリトライ不可
    if (
      (error as any).status === 401 ||
      (error as any).status === 403 ||
      error.message.includes('Invalid') ||
      error.message.includes('validation')
    ) {
      return false;
    }
  }

  // デフォルトはリトライ可能
  return true;
};

/**
 * エラーメッセージのフォーマット
 */
export const formatErrorMessage = (error: unknown): string => {
  if (error instanceof IdeatorError) {
    return `[${error.code}] ${error.message}`;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return String(error);
};

export { IdeatorErrorCode } from '../../types/ideator';