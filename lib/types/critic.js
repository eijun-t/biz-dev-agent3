"use strict";
/**
 * Critic Agent Type Definitions
 * 評価・選定エージェントの型定義
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CriticError = exports.CriticErrorCode = void 0;
/**
 * エラーコード定義
 */
var CriticErrorCode;
(function (CriticErrorCode) {
    CriticErrorCode["INVALID_INPUT"] = "CRITIC_INVALID_INPUT";
    CriticErrorCode["LLM_ERROR"] = "CRITIC_LLM_ERROR";
    CriticErrorCode["EVALUATION_FAILED"] = "CRITIC_EVALUATION_FAILED";
    CriticErrorCode["TIMEOUT"] = "CRITIC_TIMEOUT";
    CriticErrorCode["CACHE_ERROR"] = "CRITIC_CACHE_ERROR";
    CriticErrorCode["CONFIG_ERROR"] = "CRITIC_CONFIG_ERROR";
})(CriticErrorCode || (exports.CriticErrorCode = CriticErrorCode = {}));
/**
 * Criticエラー型
 */
class CriticError extends Error {
    constructor(code, message, details, isRetryable = false) {
        super(message);
        this.code = code;
        this.details = details;
        this.isRetryable = isRetryable;
        this.name = 'CriticError';
    }
}
exports.CriticError = CriticError;
