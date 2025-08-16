/**
 * Writer Agent Type Definitions
 * Writerエージェント用の型定義
 */

import { z } from 'zod';

/**
 * Analystエージェントからの入力データ
 */
export interface WriterInput {
  sessionId: string;
  ideaId: string;
  analystData: {
    businessIdea: BusinessIdea;
    marketAnalysis: MarketAnalysis;
    synergyAnalysis: SynergyAnalysis;
    validationPlan: ValidationPlan;
  };
  metadata: {
    generatedAt: Date;
    version: string;
  };
}

/**
 * ビジネスアイデアデータ
 */
export interface BusinessIdea {
  id: string;
  title: string;
  description: string;
  targetCustomer: {
    segment: string;
    ageRange: string;
    occupation: string;
    needs: string[];
  };
  customerProblem: {
    problems: string[];
    priority: 'high' | 'medium' | 'low';
  };
  valueProposition: {
    uniqueValue: string;
    competitiveAdvantage: string[];
  };
  revenueStructure: {
    sources: string[];
    pricing: string;
    costStructure: string;
  };
}

/**
 * 市場分析データ
 */
export interface MarketAnalysis {
  tam: number; // 円単位
  pam: number; // 円単位
  sam: number; // 円単位
  growthRate: number; // パーセント
  competitors: Competitor[];
  marketTrends: string[];
  regulations: string[];
}

/**
 * 競合企業データ
 */
export interface Competitor {
  name: string;
  marketShare: number;
  strengths: string[];
  weaknesses: string[];
  revenue?: number; // 円単位
}

/**
 * 三菱地所シナジー分析
 */
export interface SynergyAnalysis {
  totalScore: number; // 0-100
  breakdown: {
    realEstateUtilization: number; // 0-100
    customerBaseUtilization: number; // 0-100
    brandValueEnhancement: number; // 0-100
  };
  initiatives: {
    title: string;
    priority: 'high' | 'medium' | 'low';
    expectedImpact: string;
  }[];
  risks: {
    description: string;
    mitigation: string;
  }[];
}

/**
 * 検証計画データ
 */
export interface ValidationPlan {
  phases: ValidationPhase[];
  totalDuration: number; // months
  requiredBudget: number; // 円単位
}

/**
 * 検証フェーズ
 */
export interface ValidationPhase {
  name: 'POC' | 'Pilot' | 'FullScale';
  duration: number; // months
  milestones: string[];
  kpis: {
    metric: string;
    target: string | number;
  }[];
  requiredResources: {
    personnel: number;
    budget: number; // 円単位
    technology: string[];
  };
  goNoGoCriteria: string[];
}

/**
 * 生成されたHTMLレポート
 */
export interface HTMLReport {
  id: string;
  sessionId: string;
  ideaId: string;
  title: string;
  htmlContent: string;
  sections: ReportSection[];
  metrics: ReportMetrics;
  generatedAt: Date;
  generationTime: number; // milliseconds
}

/**
 * セクションタイプ
 */
export type SectionType = 'summary' | 'business_model' | 'market' | 'synergy' | 'validation' | 'executive_summary' | 'business_idea' | 'market_analysis' | 'synergy_analysis' | 'validation_plan';

/**
 * レポートセクション
 */
export interface ReportSection {
  id: string;
  type: SectionType;
  title: string;
  content: string; // HTML string
  order: number;
}

/**
 * レポートメトリクス
 */
export interface ReportMetrics {
  tam: number; // 円
  pam: number; // 円
  sam: number; // 円
  revenueProjection3Y: number; // 円
  synergyScore: number; // 0-100
  implementationDifficulty: 'low' | 'medium' | 'high';
  timeToMarket: number; // months
}

/**
 * 統合データ（データ統合サービス出力）
 */
export interface IntegratedData {
  businessIdea: BusinessIdea;
  marketAnalysis: MarketAnalysis;
  synergyAnalysis: SynergyAnalysis;
  validationPlan: ValidationPlan;
  dataQuality: {
    completeness: number; // 0-100
    consistency: boolean;
    warnings: string[];
  };
}

/**
 * 検証結果
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

/**
 * バリデーションエラー
 */
export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

/**
 * Writerエラー型
 */
export enum WriterErrorType {
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_DATA = 'MISSING_REQUIRED_DATA',
  GENERATION_TIMEOUT = 'GENERATION_TIMEOUT',
  TEMPLATE_ERROR = 'TEMPLATE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR'
}

/**
 * Writerエラー
 */
export interface WriterError {
  type: WriterErrorType;
  message: string;
  detail?: string;
  partialData?: Partial<HTMLReport>;
  context?: Record<string, unknown>;
}

/**
 * エラーレスポンス
 */
export interface ErrorResponse {
  status: number;
  message: string;
  detail?: string;
}