"use strict";
/**
 * Ideator Agent Constants
 * エージェントで使用する定数定義
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.METRICS = exports.ERROR_MESSAGES = exports.LOG_LEVELS = exports.CACHE_CONFIG = exports.PROMPT_CONFIG = exports.IDEA_GENERATION = exports.QUALITY_THRESHOLDS = exports.TIMEOUT_CONFIG = exports.RETRY_CONFIG = exports.DEFAULT_LLM_CONFIG = void 0;
/**
 * デフォルトのLLM設定
 */
exports.DEFAULT_LLM_CONFIG = {
    model: 'gpt-4o',
    temperature: 0.75, // 創造性と一貫性のバランス
    maxTokens: 8000,
    topP: 0.9,
    presencePenalty: 0.1,
    frequencyPenalty: 0.1
};
/**
 * リトライ設定
 */
exports.RETRY_CONFIG = {
    maxAttempts: 3,
    baseDelay: 1000, // 1秒
    maxDelay: 10000, // 10秒
    backoffMultiplier: 2
};
/**
 * タイムアウト設定
 */
exports.TIMEOUT_CONFIG = {
    default: 60000, // 60秒
    llmCall: 30000, // 30秒
    validation: 5000 // 5秒
};
/**
 * 品質閾値
 */
exports.QUALITY_THRESHOLDS = {
    structureCompleteness: 80, // 構造完全性の最小スコア
    contentConsistency: 70, // 内容一貫性の最小スコア
    marketClarity: 60 // 市場機会明確性の最小スコア
};
/**
 * アイデア生成設定
 */
exports.IDEA_GENERATION = {
    requiredCount: 5, // 必要なアイデア数
    minTitleLength: 5, // タイトルの最小文字数
    maxTitleLength: 30, // タイトルの最大文字数
    minDescriptionLength: 50, // 説明の最小文字数
    maxDescriptionLength: 500, // 説明の最大文字数
    targetRevenue: 1000000000 // 目標営業利益（10億円）
};
/**
 * プロンプトテンプレート設定
 */
exports.PROMPT_CONFIG = {
    systemRole: 'あなたは革新的なビジネスアイデアを生成する専門家です。',
    outputFormat: 'JSON',
    language: 'Japanese',
    contextWindow: 128000 // GPT-4oのコンテキストウィンドウ
};
/**
 * キャッシュ設定
 */
exports.CACHE_CONFIG = {
    ttl: 3600000, // 1時間
    maxSize: 100, // 最大キャッシュ数
    checkPeriod: 600000 // 10分ごとにクリーンアップ
};
/**
 * ログレベル
 */
exports.LOG_LEVELS = {
    DEBUG: 'debug',
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error'
};
/**
 * エラーメッセージ
 */
exports.ERROR_MESSAGES = {
    INSUFFICIENT_INPUT: '入力データが不十分です。EnhancedOutputが必要です。',
    LLM_GENERATION_FAILED: 'LLMによるアイデア生成に失敗しました。',
    INVALID_OUTPUT_FORMAT: 'LLMの出力形式が無効です。',
    IDEA_COUNT_MISMATCH: "\u751F\u6210\u3055\u308C\u305F\u30A2\u30A4\u30C7\u30A2\u306E\u6570\u304C".concat(exports.IDEA_GENERATION.requiredCount, "\u500B\u3067\u306F\u3042\u308A\u307E\u305B\u3093\u3002"),
    QUALITY_THRESHOLD_NOT_MET: '生成されたアイデアが品質基準を満たしていません。',
    TOKEN_LIMIT_EXCEEDED: 'トークン制限を超過しました。',
    TIMEOUT: 'タイムアウトしました。',
    VALIDATION_FAILED: 'バリデーションに失敗しました。'
};
/**
 * メトリクス名
 */
exports.METRICS = {
    GENERATION_TIME: 'ideator.generation_time',
    TOKEN_USAGE: 'ideator.token_usage',
    SUCCESS_RATE: 'ideator.success_rate',
    QUALITY_SCORE: 'ideator.quality_score',
    RETRY_COUNT: 'ideator.retry_count'
};
