/**
 * Critic Agent Type Definitions
 * 評価・選定エージェントの型定義
 */

import { z } from 'zod';

/**
 * Critic Agent Input - Ideatorからの出力を受け取る
 */
export interface CriticInput {
  sessionId: string;
  ideas: BusinessIdea[];
  researchData?: any; // Researcherからのデータ（参考用）
  evaluationConfig?: CriticConfig;
}

/**
 * ビジネスアイデア（Ideatorからの形式）
 */
export interface BusinessIdea {
  id: string;
  title: string;
  description: string;
  targetCustomer: string;
  customerProblem: string;
  proposedSolution: string;
  revenueModel: string;
  estimatedRevenue?: number; // 年間営業利益（円）
  marketSize?: string;
  competitors?: string[];
  implementation?: {
    difficulty: 'low' | 'medium' | 'high';
    timeframe: string;
    requiredResources: string[];
  };
}

/**
 * 市場評価スコア (0-50点)
 */
export interface MarketScore {
  total: number; // 0-50
  breakdown: {
    marketSize: number; // 0-20
    growthPotential: number; // 0-15
    profitability: number; // 0-15
  };
  reasoning: string;
  evidence: string[];
}

/**
 * 三菱地所シナジースコア (0-50点)
 */
export interface SynergyScore {
  total: number; // 0-50
  breakdown: {
    capabilityMatch: number; // 0-20 (ケイパビリティマッチ度)
    synergyEffect: number; // 0-15 (シナジー効果)
    uniqueAdvantage: number; // 0-15 (独自優位性)
  };
  capabilityMapping: CapabilityMapping;
  synergyScenario: SynergyScenario;
  scenarioValidation: ScenarioValidation;
  reasoning: string;
}

/**
 * ケイパビリティマッピング
 */
export interface CapabilityMapping {
  requiredCapabilities: RequiredCapability[];
  mitsubishiCapabilities: MitsubishiCapability[];
  matchScore: number; // 0-100%
  gaps: string[];
}

/**
 * 必要なケイパビリティ
 */
export interface RequiredCapability {
  name: string;
  importance: 'critical' | 'important' | 'nice-to-have';
  description: string;
}

/**
 * 三菱地所のケイパビリティ
 */
export interface MitsubishiCapability {
  category: 'real_estate_development' | 'operations' | 'finance' | 'innovation';
  name: string;
  description: string;
  specificAssets?: string[]; // 丸の内30棟、テナント3000社など
}

/**
 * シナジーシナリオ
 */
export interface SynergyScenario {
  scenario: string; // 具体的な活用ストーリー
  keyAdvantages: string[]; // 主要な優位性
  synergyMultiplier: number; // 1.0-1.5 (シナジー乗数効果)
}

/**
 * シナリオ検証結果
 */
export interface ScenarioValidation {
  logicalConsistency: number; // 0-100 (論理的整合性)
  feasibility: number; // 0-100 (実現可能性)
  uniqueness: number; // 0-100 (独自性・他社との差別化)
  overallCredibility: number; // 0-100 (総合的な納得度)
  validationComments: string[];
}

/**
 * 個別アイデアの評価結果
 */
export interface EvaluationResult {
  ideaId: string;
  ideaTitle: string;
  marketScore: MarketScore;
  synergyScore: SynergyScore;
  totalScore: number; // 0-100
  rank?: number; // 1-5の順位
  recommendation: string;
  risks: string[];
  opportunities: string[];
}

/**
 * 評価メタデータ
 */
export interface EvaluationMetadata {
  evaluationId: string;
  startTime: Date;
  endTime: Date;
  processingTime: number; // ミリ秒
  tokensUsed: number;
  llmCalls: number;
  cacheHits: number;
  errors: string[];
}

/**
 * Critic Agent Output
 */
export interface CriticOutput {
  sessionId: string;
  evaluationResults: EvaluationResult[];
  selectedIdea: EvaluationResult; // 最高評価のアイデア
  summary: string;
  metadata: EvaluationMetadata;
}

/**
 * Critic設定
 */
export interface CriticConfig {
  marketWeight?: number; // デフォルト: 0.5
  synergyWeight?: number; // デフォルト: 0.5
  minimumTotalScore?: number; // デフォルト: 60
  llmModel?: string; // デフォルト: gpt-4o
  temperature?: number; // デフォルト: 0.3
  maxRetries?: number; // デフォルト: 2
  cacheEnabled?: boolean; // デフォルト: true
  cacheTTL?: number; // デフォルト: 3600000 (1時間)
}

/**
 * エラーコード定義
 */
export enum CriticErrorCode {
  INVALID_INPUT = 'CRITIC_INVALID_INPUT',
  LLM_ERROR = 'CRITIC_LLM_ERROR',
  EVALUATION_FAILED = 'CRITIC_EVALUATION_FAILED',
  TIMEOUT = 'CRITIC_TIMEOUT',
  CACHE_ERROR = 'CRITIC_CACHE_ERROR',
  CONFIG_ERROR = 'CRITIC_CONFIG_ERROR',
}

/**
 * Criticエラー型
 */
export class CriticError extends Error {
  constructor(
    public code: CriticErrorCode,
    message: string,
    public details?: any,
    public isRetryable: boolean = false
  ) {
    super(message);
    this.name = 'CriticError';
  }
}