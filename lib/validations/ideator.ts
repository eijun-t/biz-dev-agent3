/**
 * Ideator Agent Validation Schemas
 * Zodを使用したバリデーションスキーマ定義
 */

import { z } from 'zod';

/**
 * ビジネスアイデアのバリデーションスキーマ
 */
export const businessIdeaSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(30, 'タイトルは30文字以内で入力してください'),
  description: z.string().min(10).max(500, '概要は10-500文字で入力してください'),
  targetCustomers: z.array(z.string().min(1)).min(1, '少なくとも1つの顧客セグメントが必要です'),
  customerPains: z.array(z.string().min(1)).min(1, '少なくとも1つの顧客課題が必要です'),
  valueProposition: z.string().min(10, '提供価値を10文字以上で記述してください'),
  revenueModel: z.string().min(10, '収益モデルを10文字以上で記述してください'),
  estimatedRevenue: z.number().min(0, '推定営業利益は0以上である必要があります'),
  implementationDifficulty: z.enum(['low', 'medium', 'high']),
  marketOpportunity: z.string().min(10, '市場機会を10文字以上で記述してください')
});

/**
 * 市場機会のバリデーションスキーマ
 */
export const marketOpportunitySchema = z.object({
  id: z.string().min(1),
  description: z.string().min(10),
  marketSize: z.number().min(0),
  growthRate: z.number().min(-100).max(1000),
  unmetNeeds: z.array(z.string().min(1)).min(1),
  competitiveGaps: z.array(z.string().min(1))
});

/**
 * 顧客課題のバリデーションスキーマ
 */
export const customerPainSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(10),
  severity: z.enum(['low', 'medium', 'high']),
  frequency: z.enum(['rare', 'occasional', 'frequent', 'daily']),
  currentSolutions: z.array(z.string()),
  limitations: z.array(z.string())
});

/**
 * Ideator出力のバリデーションスキーマ
 */
export const ideatorOutputSchema = z.object({
  sessionId: z.string().uuid().optional(),
  ideas: z.array(businessIdeaSchema).min(1, '少なくとも1つのアイデアが必要です'),
  summary: z.string().optional(),
  metadata: z.object({
    generatedAt: z.date().optional(),
    modelUsed: z.string().min(1).optional(),
    tokensUsed: z.number().min(0).optional(),
    processingTimeMs: z.number().min(0).optional(),
    researchDataId: z.string().optional(),
    totalIdeas: z.number().optional(),
    averageRevenue: z.number().optional(),
    marketSize: z.number().optional(),
    generationDate: z.string().optional()
  }).optional(),
  qualityMetrics: z.object({
    structureCompleteness: z.number().min(0).max(100),
    contentConsistency: z.number().min(0).max(100),
    marketClarity: z.number().min(0).max(100)
  }).optional()
});

/**
 * Ideator設定のバリデーションスキーマ
 */
export const ideatorConfigSchema = z.object({
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(100).max(32000).optional(),
  focusArea: z.string().optional(),
  constraints: z.array(z.string()).optional(),
  targetRevenue: z.number().min(0).optional(),
  retryAttempts: z.number().min(0).max(10).optional(),
  timeout: z.number().min(1000).max(300000).optional()
});

/**
 * LLM設定のバリデーションスキーマ
 */
export const llmConfigSchema = z.object({
  model: z.string().min(1),
  temperature: z.number().min(0).max(2),
  maxTokens: z.number().min(100).max(32000),
  topP: z.number().min(0).max(1),
  presencePenalty: z.number().min(-2).max(2),
  frequencyPenalty: z.number().min(-2).max(2)
});

/**
 * 市場コンテキストのバリデーションスキーマ
 */
export const marketContextSchema = z.object({
  opportunities: z.array(marketOpportunitySchema),
  customerPains: z.array(customerPainSchema),
  trends: z.array(z.string().min(1)),
  competitiveLandscape: z.string().min(10)
});

/**
 * バリデーション結果のバリデーションスキーマ
 */
export const validationResultSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(z.string()),
  warnings: z.array(z.string())
});

/**
 * 型エクスポート
 */
export type BusinessIdea = z.infer<typeof businessIdeaSchema>;
export type MarketOpportunity = z.infer<typeof marketOpportunitySchema>;
export type CustomerPain = z.infer<typeof customerPainSchema>;
export type IdeatorOutput = z.infer<typeof ideatorOutputSchema>;
export type IdeatorConfig = z.infer<typeof ideatorConfigSchema>;
export type LLMConfig = z.infer<typeof llmConfigSchema>;
export type MarketContext = z.infer<typeof marketContextSchema>;
export type ValidationResult = z.infer<typeof validationResultSchema>;