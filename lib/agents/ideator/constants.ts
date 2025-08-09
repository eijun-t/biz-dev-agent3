/**
 * Ideator Agent Constants
 * エージェントで使用する定数定義
 */

/**
 * デフォルトのLLM設定
 */
export const DEFAULT_LLM_CONFIG = {
  model: 'gpt-4o',
  temperature: 0.75,  // 創造性と一貫性のバランス
  maxTokens: 8000,
  topP: 0.9,
  presencePenalty: 0.1,
  frequencyPenalty: 0.1
} as const;

/**
 * リトライ設定
 */
export const RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelay: 1000,  // 1秒
  maxDelay: 10000,  // 10秒
  backoffMultiplier: 2
} as const;

/**
 * タイムアウト設定
 */
export const TIMEOUT_CONFIG = {
  default: 60000,    // 60秒
  llmCall: 30000,    // 30秒
  validation: 5000   // 5秒
} as const;

/**
 * 品質閾値
 */
export const QUALITY_THRESHOLDS = {
  structureCompleteness: 80,  // 構造完全性の最小スコア
  contentConsistency: 70,     // 内容一貫性の最小スコア
  marketClarity: 60           // 市場機会明確性の最小スコア
} as const;

/**
 * アイデア生成設定
 */
export const IDEA_GENERATION = {
  requiredCount: 5,           // 必要なアイデア数
  minTitleLength: 5,          // タイトルの最小文字数
  maxTitleLength: 30,         // タイトルの最大文字数
  minDescriptionLength: 50,   // 説明の最小文字数
  maxDescriptionLength: 500,  // 説明の最大文字数
  targetRevenue: 1_000_000_000  // 目標営業利益（10億円）
} as const;

/**
 * アイディエーション設定（エイリアス）
 */
export const IDEATION_CONFIG = IDEA_GENERATION;

/**
 * プロンプトテンプレート設定
 */
export const PROMPT_CONFIG = {
  systemRole: 'あなたは革新的なビジネスアイデアを生成する専門家です。',
  outputFormat: 'JSON',
  language: 'Japanese',
  contextWindow: 128000  // GPT-4oのコンテキストウィンドウ
} as const;

/**
 * キャッシュ設定
 */
export const CACHE_CONFIG = {
  ttl: 3600000,      // 1時間
  maxSize: 100,      // 最大キャッシュ数
  checkPeriod: 600000  // 10分ごとにクリーンアップ
} as const;

/**
 * ログレベル
 */
export const LOG_LEVELS = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error'
} as const;

/**
 * エラーメッセージ
 */
export const ERROR_MESSAGES = {
  INSUFFICIENT_INPUT: '入力データが不十分です。EnhancedOutputが必要です。',
  LLM_GENERATION_FAILED: 'LLMによるアイデア生成に失敗しました。',
  INVALID_OUTPUT_FORMAT: 'LLMの出力形式が無効です。',
  IDEA_COUNT_MISMATCH: `生成されたアイデアの数が${IDEA_GENERATION.requiredCount}個ではありません。`,
  QUALITY_THRESHOLD_NOT_MET: '生成されたアイデアが品質基準を満たしていません。',
  TOKEN_LIMIT_EXCEEDED: 'トークン制限を超過しました。',
  TIMEOUT: 'タイムアウトしました。',
  VALIDATION_FAILED: 'バリデーションに失敗しました。'
} as const;

/**
 * メトリクス名
 */
export const METRICS = {
  GENERATION_TIME: 'ideator.generation_time',
  TOKEN_USAGE: 'ideator.token_usage',
  SUCCESS_RATE: 'ideator.success_rate',
  QUALITY_SCORE: 'ideator.quality_score',
  RETRY_COUNT: 'ideator.retry_count'
} as const;