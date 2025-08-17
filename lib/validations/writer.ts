/**
 * Writer Agent Validation Schemas
 * Writerエージェント用バリデーションスキーマ
 */

import { z } from 'zod';

/**
 * 顧客ターゲットスキーマ
 */
const targetCustomerSchema = z.object({
  segment: z.string().min(1, 'セグメントは必須です'),
  ageRange: z.string().min(1, '年齢層は必須です'),
  occupation: z.string().min(1, '職業は必須です'),
  needs: z.array(z.string()).min(1, 'ニーズは1つ以上必要です'),
});

/**
 * 顧客課題スキーマ
 */
const customerProblemSchema = z.object({
  problems: z.array(z.string()).min(1, '課題は1つ以上必要です').max(5, '課題は最大5つまでです'),
  priority: z.enum(['high', 'medium', 'low']),
});

/**
 * 価値提案スキーマ
 */
const valuePropositionSchema = z.object({
  uniqueValue: z.string().min(1, '独自価値は必須です'),
  competitiveAdvantage: z.array(z.string()).min(1, '競合優位性は1つ以上必要です'),
});

/**
 * 収益構造スキーマ
 */
const revenueStructureSchema = z.object({
  sources: z.array(z.string()).min(1, '収益源は1つ以上必要です'),
  pricing: z.string().min(1, '価格設定は必須です'),
  costStructure: z.string().min(1, 'コスト構造は必須です'),
});

/**
 * ビジネスアイデアスキーマ
 */
export const businessIdeaSchema = z.object({
  id: z.string().uuid('有効なUUIDである必要があります'),
  title: z.string().min(1, 'タイトルは必須です').max(100, 'タイトルは100文字以内です'),
  description: z.string().min(1, '説明は必須です'),
  targetCustomer: targetCustomerSchema,
  customerProblem: customerProblemSchema,
  valueProposition: valuePropositionSchema,
  revenueStructure: revenueStructureSchema,
});

/**
 * 競合企業スキーマ
 */
const competitorSchema = z.object({
  name: z.string().min(1, '企業名は必須です'),
  marketShare: z.number().min(0).max(100, '市場シェアは0-100の範囲です'),
  strengths: z.array(z.string()).min(1, '強みは1つ以上必要です'),
  weaknesses: z.array(z.string()).min(1, '弱みは1つ以上必要です'),
  revenue: z.number().min(0).optional(),
});

/**
 * 市場分析スキーマ
 */
export const marketAnalysisSchema = z.object({
  tam: z.union([
    z.number(),
    z.string().transform((val) => parseFloat(val))
  ]).refine((val) => !isNaN(Number(val)) && Number(val) >= 0, 'TAMは0以上である必要があります'),
  pam: z.union([
    z.number(),
    z.string().transform((val) => parseFloat(val))
  ]).refine((val) => !isNaN(Number(val)) && Number(val) >= 0, 'PAMは0以上である必要があります'),
  sam: z.union([
    z.number(),
    z.string().transform((val) => parseFloat(val))
  ]).refine((val) => !isNaN(Number(val)) && Number(val) >= 0, 'SAMは0以上である必要があります'),
  growthRate: z.union([
    z.number(),
    z.string().transform((val) => parseFloat(val))
  ]).refine((val) => !isNaN(Number(val)) && Number(val) >= -100 && Number(val) <= 1000, '成長率は妥当な範囲内である必要があります'),
  competitors: z.array(competitorSchema).max(10, '競合は最大10社までです'),
  marketTrends: z.array(z.string()),
  regulations: z.array(z.string()),
});

/**
 * シナジー分析スキーマ
 */
export const synergyAnalysisSchema = z.object({
  totalScore: z.number().min(0).max(100, 'スコアは0-100の範囲です'),
  breakdown: z.object({
    realEstateUtilization: z.number().min(0).max(100),
    customerBaseUtilization: z.number().min(0).max(100),
    brandValueEnhancement: z.number().min(0).max(100),
  }),
  initiatives: z.array(
    z.object({
      title: z.string().min(1, 'タイトルは必須です'),
      priority: z.enum(['high', 'medium', 'low']),
      expectedImpact: z.string().min(1, '期待効果は必須です'),
    })
  ),
  risks: z.array(
    z.object({
      description: z.string().min(1, 'リスク説明は必須です'),
      mitigation: z.string().min(1, '対策は必須です'),
    })
  ),
});

/**
 * 検証フェーズスキーマ
 */
const validationPhaseSchema = z.object({
  name: z.enum(['POC', 'Pilot', 'FullScale']),
  duration: z.number().min(1).max(36, '期間は1-36ヶ月の範囲です'),
  milestones: z.array(z.string()).min(1, 'マイルストーンは1つ以上必要です'),
  kpis: z.array(
    z.object({
      metric: z.string().min(1, 'KPI名は必須です'),
      target: z.union([z.string(), z.number()]),
    })
  ).min(1, 'KPIは1つ以上必要です'),
  requiredResources: z.object({
    personnel: z.number().min(1, '人員は1人以上必要です'),
    budget: z.number().min(0, '予算は0以上である必要があります'),
    technology: z.array(z.string()),
  }),
  goNoGoCriteria: z.array(z.string()).min(1, 'Go/No-Go基準は1つ以上必要です'),
});

/**
 * 検証計画スキーマ
 */
export const validationPlanSchema = z.object({
  phases: z.array(validationPhaseSchema).min(1).max(3, 'フェーズは1-3個の範囲です'),
  totalDuration: z.number().min(1).max(60, '総期間は1-60ヶ月の範囲です'),
  requiredBudget: z.number().min(0, '予算は0以上である必要があります'),
});

/**
 * WriterInput検証スキーマ
 */
export const writerInputSchema = z.object({
  sessionId: z.string().uuid('有効なセッションIDである必要があります'),
  ideaId: z.string().uuid('有効なアイデアIDである必要があります'),
  analystData: z.object({
    businessIdea: businessIdeaSchema,
    marketAnalysis: marketAnalysisSchema,
    synergyAnalysis: synergyAnalysisSchema,
    validationPlan: validationPlanSchema,
  }),
  metadata: z.object({
    generatedAt: z.date(),
    version: z.string().regex(/^\d+\.\d+\.\d+$/, 'バージョンはsemver形式である必要があります'),
  }),
});

/**
 * レポートセクションスキーマ
 */
export const reportSectionSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['summary', 'business_model', 'market', 'synergy', 'validation']),
  title: z.string().min(1, 'タイトルは必須です'),
  content: z.string().min(1, 'コンテンツは必須です'),
  order: z.number().min(0).max(10),
});

/**
 * レポートメトリクススキーマ
 */
export const reportMetricsSchema = z.object({
  tam: z.number().min(0, 'TAMは0以上である必要があります'),
  pam: z.number().min(0, 'PAMは0以上である必要があります'),
  sam: z.number().min(0, 'SAMは0以上である必要があります'),
  revenueProjection3Y: z.number().min(0, '収益予測は0以上である必要があります'),
  synergyScore: z.number().min(0).max(100, 'シナジースコアは0-100の範囲です'),
  implementationDifficulty: z.enum(['low', 'medium', 'high']),
  timeToMarket: z.number().min(1).max(60, '市場投入期間は1-60ヶ月の範囲です'),
});

/**
 * HTMLレポートスキーマ
 */
export const htmlReportSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid(),
  ideaId: z.string().uuid(),
  title: z.string().min(1).max(200, 'タイトルは1-200文字の範囲です'),
  htmlContent: z.string().min(1, 'HTMLコンテンツは必須です'),
  sections: z.array(reportSectionSchema).min(5).max(5, 'セクションは5つ必要です'),
  metrics: reportMetricsSchema,
  generatedAt: z.date(),
  generationTime: z.number().min(0).max(60000, '生成時間は60秒以内である必要があります'),
});

/**
 * サマリーセクション検証
 */
export const summarySectionSchema = z.object({
  content: z.string().max(300, 'サマリーは300文字以内である必要があります'),
  keyPoints: z.array(z.string()).max(5, 'キーポイントは最大5つまでです'),
});

/**
 * 通貨値検証（円単位）
 */
export const currencySchema = z.number()
  .min(0, '金額は0以上である必要があります')
  .max(Number.MAX_SAFE_INTEGER, '金額が大きすぎます')
  .refine(
    (val) => Number.isInteger(val),
    '金額は整数である必要があります'
  );

/**
 * 通貨フォーマット検証
 */
export const currencyFormatSchema = z.string().regex(
  /^¥[\d,]+$/,
  '通貨フォーマットは¥1,000,000形式である必要があります'
);

/**
 * エラーレスポンススキーマ
 */
export const errorResponseSchema = z.object({
  status: z.number().min(400).max(599),
  message: z.string().min(1),
  detail: z.string().optional(),
});

// Type exports
export type WriterInput = z.infer<typeof writerInputSchema>;
export type BusinessIdea = z.infer<typeof businessIdeaSchema>;
export type MarketAnalysis = z.infer<typeof marketAnalysisSchema>;
export type SynergyAnalysis = z.infer<typeof synergyAnalysisSchema>;
export type ValidationPlan = z.infer<typeof validationPlanSchema>;
export type HTMLReport = z.infer<typeof htmlReportSchema>;
export type ReportSection = z.infer<typeof reportSectionSchema>;
export type ReportMetrics = z.infer<typeof reportMetricsSchema>;