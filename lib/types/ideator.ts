/**
 * Ideator Agent Type Definitions
 * ビジネスアイデア生成エージェントの型定義
 */

import type { EnhancedOutput } from '../agents/broad-researcher/enhanced-output-generator';

/**
 * ビジネスアイデアの個別定義
 */
export interface BusinessIdea {
  id: string;
  title: string;                          // 30文字以内のタイトル
  description: string;                     // 200文字程度の概要
  targetCustomers: string[];               // 想定顧客セグメント
  customerPains: string[];                 // 解決する顧客課題
  valueProposition: string;                // 提供価値
  revenueModel: string;                    // 収益構造・ビジネスモデル
  estimatedRevenue: number;                // 推定営業利益（円）
  implementationDifficulty: 'low' | 'medium' | 'high';  // 実装難易度
  marketOpportunity: string;               // 市場機会の説明
}

/**
 * 市場機会の詳細
 */
export interface MarketOpportunity {
  id: string;
  description: string;
  marketSize: number;                     // 市場規模（円）
  growthRate: number;                     // 成長率（%）
  unmetNeeds: string[];                   // 未解決ニーズ
  competitiveGaps: string[];              // 競合の隙間
}

/**
 * 顧客の課題・ペインポイント
 */
export interface CustomerPain {
  id: string;
  description: string;
  severity: 'low' | 'medium' | 'high';    // 深刻度
  frequency: 'rare' | 'occasional' | 'frequent';  // 発生頻度
  currentSolutions: string[];              // 現在の解決策
  limitations: string[];                   // 現在の解決策の限界
}

/**
 * Ideatorエージェントの出力
 */
export interface IdeatorOutput {
  sessionId: string;
  ideas: BusinessIdea[];                   // 正確に5つのアイデア
  metadata: {
    generatedAt: Date;
    modelUsed: string;
    tokensUsed: number;
    processingTimeMs: number;
    researchDataId: string;
  };
  qualityMetrics: {
    structureCompleteness: number;        // 構造完全性スコア (0-100)
    contentConsistency: number;           // 内容一貫性スコア (0-100)
    marketClarity: number;                // 市場機会明確性スコア (0-100)
  };
}

/**
 * Ideatorエージェントの入力
 */
export interface IdeatorInput {
  researchOutput: EnhancedOutput;
  config?: IdeatorConfig;
}

/**
 * Ideatorエージェントの設定
 */
export interface IdeatorConfig {
  model?: string;                         // 使用するLLMモデル
  temperature?: number;                    // 生成時の温度パラメータ
  maxTokens?: number;                     // 最大トークン数
  focusArea?: string;                     // 重点領域
  constraints?: string[];                 // 制約条件
  targetRevenue?: number;                 // 目標営業利益
  retryAttempts?: number;                 // リトライ回数
  timeout?: number;                        // タイムアウト（ミリ秒）
}

/**
 * LLM設定
 */
export interface LLMConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  presencePenalty: number;
  frequencyPenalty: number;
}

/**
 * 検証結果
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * 市場コンテキスト
 */
export interface MarketContext {
  opportunities: MarketOpportunity[];
  customerPains: CustomerPain[];
  trends: string[];
  competitiveLandscape: string;
}

/**
 * プロンプトコンテキスト
 */
export interface PromptContext {
  research: EnhancedOutput;
  marketContext: MarketContext;
  constraints?: string[];
  focusArea?: string;
}

/**
 * 使用量メタデータ
 */
export interface UsageMetadata {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  modelName: string;
  requestId?: string;
}

/**
 * エラーコード定義
 */
export enum IdeatorErrorCode {
  INSUFFICIENT_INPUT = 'INSUFFICIENT_INPUT',
  LLM_GENERATION_FAILED = 'LLM_GENERATION_FAILED',
  INVALID_OUTPUT_FORMAT = 'INVALID_OUTPUT_FORMAT',
  IDEA_COUNT_MISMATCH = 'IDEA_COUNT_MISMATCH',
  QUALITY_THRESHOLD_NOT_MET = 'QUALITY_THRESHOLD_NOT_MET',
  TOKEN_LIMIT_EXCEEDED = 'TOKEN_LIMIT_EXCEEDED',
  TIMEOUT = 'TIMEOUT',
  VALIDATION_FAILED = 'VALIDATION_FAILED'
}