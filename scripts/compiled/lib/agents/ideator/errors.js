"use strict";
/**
 * Ideator Agent Errors
 * エラークラスとエラーハンドリング
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdeatorErrorCode = exports.formatErrorMessage = exports.isRetryableError = exports.IdeatorError = void 0;
var ideator_1 = require("../../types/ideator");
var constants_1 = require("./constants");
/**
 * Ideatorエージェント用カスタムエラークラス
 */
var IdeatorError = /** @class */ (function (_super) {
    __extends(IdeatorError, _super);
    function IdeatorError(message, code, details, retryable) {
        if (retryable === void 0) { retryable = true; }
        var _this = _super.call(this, message) || this;
        _this.name = 'IdeatorError';
        _this.code = code;
        _this.details = details;
        _this.timestamp = new Date();
        _this.retryable = retryable;
        // スタックトレースを適切に設定
        if (Error.captureStackTrace) {
            Error.captureStackTrace(_this, IdeatorError);
        }
        return _this;
    }
    /**
     * エラーコードからエラーメッセージを取得
     */
    IdeatorError.fromCode = function (code, details, customMessage) {
        var message = customMessage || constants_1.ERROR_MESSAGES[code] || 'Unknown error occurred';
        // 特定のエラーコードに対してリトライ不可を設定
        var nonRetryableCodes = [
            ideator_1.IdeatorErrorCode.INSUFFICIENT_INPUT,
            ideator_1.IdeatorErrorCode.VALIDATION_FAILED,
            ideator_1.IdeatorErrorCode.TOKEN_LIMIT_EXCEEDED
        ];
        var retryable = !nonRetryableCodes.includes(code);
        return new IdeatorError(message, code, details, retryable);
    };
    /**
     * 標準エラーからIdeatorErrorへの変換
     */
    IdeatorError.fromError = function (error, defaultCode) {
        if (defaultCode === void 0) { defaultCode = ideator_1.IdeatorErrorCode.LLM_GENERATION_FAILED; }
        if (error instanceof IdeatorError) {
            return error;
        }
        if (error instanceof Error) {
            // OpenAI/LangChainのエラーを解析
            var errorDetails = {
                originalMessage: error.message,
                stack: error.stack,
                name: error.name
            };
            // 特定のエラータイプを識別
            if (error.message.includes('token') || error.message.includes('context_length')) {
                return IdeatorError.fromCode(ideator_1.IdeatorErrorCode.TOKEN_LIMIT_EXCEEDED, errorDetails);
            }
            if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
                return IdeatorError.fromCode(ideator_1.IdeatorErrorCode.TIMEOUT, errorDetails);
            }
            if (error.message.includes('Invalid') || error.message.includes('validation')) {
                return IdeatorError.fromCode(ideator_1.IdeatorErrorCode.VALIDATION_FAILED, errorDetails);
            }
            if (error.status === 429) {
                // Rate limit error
                return new IdeatorError('Rate limit exceeded. Please retry after some time.', ideator_1.IdeatorErrorCode.LLM_GENERATION_FAILED, errorDetails, true // リトライ可能
                );
            }
            if (error.status === 401) {
                // Authentication error
                return new IdeatorError('Authentication failed. Please check API credentials.', ideator_1.IdeatorErrorCode.LLM_GENERATION_FAILED, errorDetails, false // リトライ不可
                );
            }
            return new IdeatorError(error.message, defaultCode, errorDetails, true);
        }
        // 未知のエラータイプ
        return new IdeatorError('An unknown error occurred', defaultCode, { originalError: error }, true);
    };
    /**
     * エラーを構造化されたオブジェクトとして取得
     */
    IdeatorError.prototype.toObject = function () {
        return {
            name: this.name,
            code: this.code,
            message: this.message,
            details: this.details,
            timestamp: this.timestamp,
            retryable: this.retryable,
            stack: this.stack
        };
    };
    /**
     * エラーをJSON文字列として取得
     */
    IdeatorError.prototype.toJSON = function () {
        return JSON.stringify(this.toObject(), null, 2);
    };
    return IdeatorError;
}(Error));
exports.IdeatorError = IdeatorError;
/**
 * エラーコードの判定ヘルパー
 */
var isRetryableError = function (error) {
    if (error instanceof IdeatorError) {
        return error.retryable;
    }
    if (error instanceof Error) {
        // ネットワークエラーやタイムアウトはリトライ可能
        if (error.message.includes('network') ||
            error.message.includes('timeout') ||
            error.message.includes('ECONNREFUSED') ||
            error.message.includes('ETIMEDOUT')) {
            return true;
        }
        // レート制限はリトライ可能
        if (error.status === 429) {
            return true;
        }
        // 認証エラーや検証エラーはリトライ不可
        if (error.status === 401 ||
            error.status === 403 ||
            error.message.includes('Invalid') ||
            error.message.includes('validation')) {
            return false;
        }
    }
    // デフォルトはリトライ可能
    return true;
};
exports.isRetryableError = isRetryableError;
/**
 * エラーメッセージのフォーマット
 */
var formatErrorMessage = function (error) {
    if (error instanceof IdeatorError) {
        return "[".concat(error.code, "] ").concat(error.message);
    }
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
};
exports.formatErrorMessage = formatErrorMessage;
var ideator_2 = require("../../types/ideator");
Object.defineProperty(exports, "IdeatorErrorCode", { enumerable: true, get: function () { return ideator_2.IdeatorErrorCode; } });
