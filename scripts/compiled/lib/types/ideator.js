"use strict";
/**
 * Ideator Agent Type Definitions
 * ビジネスアイデア生成エージェントの型定義
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdeatorErrorCode = void 0;
/**
 * エラーコード定義
 */
var IdeatorErrorCode;
(function (IdeatorErrorCode) {
    IdeatorErrorCode["INSUFFICIENT_INPUT"] = "INSUFFICIENT_INPUT";
    IdeatorErrorCode["LLM_GENERATION_FAILED"] = "LLM_GENERATION_FAILED";
    IdeatorErrorCode["INVALID_OUTPUT_FORMAT"] = "INVALID_OUTPUT_FORMAT";
    IdeatorErrorCode["IDEA_COUNT_MISMATCH"] = "IDEA_COUNT_MISMATCH";
    IdeatorErrorCode["QUALITY_THRESHOLD_NOT_MET"] = "QUALITY_THRESHOLD_NOT_MET";
    IdeatorErrorCode["TOKEN_LIMIT_EXCEEDED"] = "TOKEN_LIMIT_EXCEEDED";
    IdeatorErrorCode["TIMEOUT"] = "TIMEOUT";
    IdeatorErrorCode["VALIDATION_FAILED"] = "VALIDATION_FAILED";
})(IdeatorErrorCode || (exports.IdeatorErrorCode = IdeatorErrorCode = {}));
