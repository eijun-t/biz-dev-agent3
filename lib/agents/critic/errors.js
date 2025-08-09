"use strict";
/**
 * Critic Agent Error Handling
 * エラーハンドリングとリトライロジック
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeoutError = exports.PartialResultError = void 0;
exports.isRetryableError = isRetryableError;
exports.toCriticError = toCriticError;
exports.calculateRetryDelay = calculateRetryDelay;
exports.retryWithBackoff = retryWithBackoff;
exports.formatErrorMessage = formatErrorMessage;
exports.getErrorDetails = getErrorDetails;
exports.withTimeout = withTimeout;
const critic_1 = require("@/lib/types/critic");
/**
 * エラーがリトライ可能かどうかを判定
 */
function isRetryableError(error) {
    if (error instanceof critic_1.CriticError) {
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
function toCriticError(error) {
    if (error instanceof critic_1.CriticError) {
        return error;
    }
    if (error instanceof Error) {
        // Determine error code based on message
        let code = critic_1.CriticErrorCode.EVALUATION_FAILED;
        let isRetryable = false;
        if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
            code = critic_1.CriticErrorCode.TIMEOUT;
            isRetryable = true;
        }
        else if (error.message.includes('Invalid input') || error.message.includes('validation')) {
            code = critic_1.CriticErrorCode.INVALID_INPUT;
            isRetryable = false;
        }
        else if (error.message.includes('LLM') || error.message.includes('OpenAI') || error.message.includes('GPT')) {
            code = critic_1.CriticErrorCode.LLM_ERROR;
            isRetryable = isRetryableError(error);
        }
        else if (error.message.includes('cache')) {
            code = critic_1.CriticErrorCode.CACHE_ERROR;
            isRetryable = false;
        }
        else if (error.message.includes('config')) {
            code = critic_1.CriticErrorCode.CONFIG_ERROR;
            isRetryable = false;
        }
        return new critic_1.CriticError(code, error.message, { originalError: error.stack }, isRetryable);
    }
    // Unknown error
    return new critic_1.CriticError(critic_1.CriticErrorCode.EVALUATION_FAILED, 'Unknown error occurred', { error: String(error) }, false);
}
/**
 * リトライディレイを計算（指数バックオフ）
 */
function calculateRetryDelay(attempt) {
    // 1st attempt: 1000ms, 2nd: 2000ms, 3rd: 4000ms
    return Math.min(1000 * Math.pow(2, attempt - 1), 10000);
}
/**
 * リトライロジック
 */
async function retryWithBackoff(fn, maxRetries = 2, onRetry) {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
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
function formatErrorMessage(error) {
    switch (error.code) {
        case critic_1.CriticErrorCode.INVALID_INPUT:
            return '入力データが不正です。ビジネスアイデアの形式を確認してください。';
        case critic_1.CriticErrorCode.LLM_ERROR:
            return 'AI評価モデルへの接続に失敗しました。しばらく待ってから再試行してください。';
        case critic_1.CriticErrorCode.EVALUATION_FAILED:
            return '評価処理中にエラーが発生しました。入力データを確認してください。';
        case critic_1.CriticErrorCode.TIMEOUT:
            return '評価処理がタイムアウトしました。アイデアの数を減らすか、後で再試行してください。';
        case critic_1.CriticErrorCode.CACHE_ERROR:
            return 'キャッシュアクセスエラーが発生しました。処理は継続されます。';
        case critic_1.CriticErrorCode.CONFIG_ERROR:
            return '設定エラーが発生しました。評価設定を確認してください。';
        default:
            return `エラーが発生しました: ${error.message}`;
    }
}
/**
 * エラーログ用の詳細情報を生成
 */
function getErrorDetails(error) {
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
class PartialResultError extends critic_1.CriticError {
    constructor(message, partialResults, failedItems) {
        super(critic_1.CriticErrorCode.EVALUATION_FAILED, message, { partialResults, failedItems }, false);
        this.partialResults = partialResults;
        this.failedItems = failedItems;
        this.name = 'PartialResultError';
    }
}
exports.PartialResultError = PartialResultError;
/**
 * タイムアウトエラー
 */
class TimeoutError extends critic_1.CriticError {
    constructor(message, timeoutMs) {
        super(critic_1.CriticErrorCode.TIMEOUT, message, { timeoutMs }, true);
        this.name = 'TimeoutError';
    }
}
exports.TimeoutError = TimeoutError;
/**
 * タイムアウト付きPromise実行
 */
async function withTimeout(promise, timeoutMs, timeoutMessage) {
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
            reject(new TimeoutError(timeoutMessage || `Operation timed out after ${timeoutMs}ms`, timeoutMs));
        }, timeoutMs);
    });
    return Promise.race([promise, timeoutPromise]);
}
