/**
 * Critic Agent Validation Schemas
 * Zodスキーマによる型検証
 */

import { z } from 'zod';

/**
 * ビジネスアイデアのバリデーションスキーマ
 */
export const businessIdeaSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  description: z.string().min(1),
  targetCustomer: z.string().min(1),
  customerProblem: z.string().min(1),
  proposedSolution: z.string().min(1),
  revenueModel: z.string().min(1),
  estimatedRevenue: z.number().optional(),
  marketSize: z.string().optional(),
  competitors: z.array(z.string()).optional(),
  implementation: z.object({
    difficulty: z.enum(['low', 'medium', 'high']),
    timeframe: z.string(),
    requiredResources: z.array(z.string()),
  }).optional(),
});

/**
 * 市場スコアのバリデーションスキーマ
 */
export const marketScoreSchema = z.object({
  total: z.number().min(0).max(50),
  breakdown: z.object({
    marketSize: z.number().min(0).max(20),
    growthPotential: z.number().min(0).max(15),
    profitability: z.number().min(0).max(15),
  }),
  reasoning: z.string(),
  evidence: z.array(z.string()),
});

/**
 * ケイパビリティマッピングのバリデーションスキーマ
 */
export const capabilityMappingSchema = z.object({
  requiredCapabilities: z.array(z.object({
    name: z.string(),
    importance: z.enum(['critical', 'important', 'nice-to-have']),
    description: z.string(),
  })),
  mitsubishiCapabilities: z.array(z.object({
    category: z.enum(['real_estate_development', 'operations', 'finance', 'innovation']),
    name: z.string(),
    description: z.string(),
    specificAssets: z.array(z.string()).optional(),
  })),
  matchScore: z.number().min(0).max(100),
  gaps: z.array(z.string()),
});

/**
 * シナジーシナリオのバリデーションスキーマ
 */
export const synergyScenarioSchema = z.object({
  scenario: z.string(),
  keyAdvantages: z.array(z.string()),
  synergyMultiplier: z.number().min(1.0).max(1.5),
});

/**
 * シナリオ検証のバリデーションスキーマ
 */
export const scenarioValidationSchema = z.object({
  logicalConsistency: z.number().min(0).max(100),
  feasibility: z.number().min(0).max(100),
  uniqueness: z.number().min(0).max(100),
  overallCredibility: z.number().min(0).max(100),
  validationComments: z.array(z.string()),
});

/**
 * シナジースコアのバリデーションスキーマ
 */
export const synergyScoreSchema = z.object({
  total: z.number().min(0).max(50),
  breakdown: z.object({
    capabilityMatch: z.number().min(0).max(20),
    synergyEffect: z.number().min(0).max(15),
    uniqueAdvantage: z.number().min(0).max(15),
  }),
  capabilityMapping: capabilityMappingSchema,
  synergyScenario: synergyScenarioSchema,
  scenarioValidation: scenarioValidationSchema,
  reasoning: z.string(),
});

/**
 * 評価結果のバリデーションスキーマ
 */
export const evaluationResultSchema = z.object({
  ideaId: z.string(),
  ideaTitle: z.string(),
  marketScore: marketScoreSchema,
  synergyScore: synergyScoreSchema,
  totalScore: z.number().min(0).max(100),
  rank: z.number().min(1).max(5).optional(),
  recommendation: z.string(),
  risks: z.array(z.string()),
  opportunities: z.array(z.string()),
});

/**
 * 評価メタデータのバリデーションスキーマ
 */
export const evaluationMetadataSchema = z.object({
  evaluationId: z.string(),
  startTime: z.date(),
  endTime: z.date(),
  processingTime: z.number(),
  tokensUsed: z.number(),
  llmCalls: z.number(),
  cacheHits: z.number(),
  errors: z.array(z.string()),
});

/**
 * Critic入力のバリデーションスキーマ
 */
export const criticInputSchema = z.object({
  sessionId: z.string(),
  ideas: z.array(businessIdeaSchema).min(1).max(10),
  researchData: z.any().optional(),
  evaluationConfig: z.object({
    marketWeight: z.number().min(0).max(1).optional(),
    synergyWeight: z.number().min(0).max(1).optional(),
    minimumTotalScore: z.number().min(0).max(100).optional(),
    llmModel: z.string().optional(),
    temperature: z.number().min(0).max(1).optional(),
    maxRetries: z.number().min(0).max(5).optional(),
    cacheEnabled: z.boolean().optional(),
    cacheTTL: z.number().min(0).optional(),
  }).optional(),
});

/**
 * Critic出力のバリデーションスキーマ
 */
export const criticOutputSchema = z.object({
  sessionId: z.string(),
  evaluationResults: z.array(evaluationResultSchema),
  selectedIdea: evaluationResultSchema,
  summary: z.string(),
  metadata: evaluationMetadataSchema,
});

/**
 * LLM評価レスポンスのバリデーションスキーマ
 */
export const llmEvaluationResponseSchema = z.object({
  marketScore: z.object({
    total: z.number().min(0).max(50),
    breakdown: z.object({
      marketSize: z.number().min(0).max(20),
      growthPotential: z.number().min(0).max(15),
      profitability: z.number().min(0).max(15),
    }),
    reasoning: z.string(),
    evidence: z.array(z.string()),
  }),
  risks: z.array(z.string()),
  opportunities: z.array(z.string()),
  recommendation: z.string(),
});

/**
 * LLMシナジー評価レスポンスのバリデーションスキーマ
 */
export const llmSynergyResponseSchema = z.object({
  requiredCapabilities: z.array(z.object({
    name: z.string(),
    importance: z.enum(['critical', 'important', 'nice-to-have']),
    description: z.string(),
  })),
  matchedCapabilities: z.array(z.object({
    category: z.enum(['real_estate_development', 'operations', 'finance', 'innovation']),
    name: z.string(),
    description: z.string(),
    specificAssets: z.array(z.string()).optional(),
  })),
  matchScore: z.number().min(0).max(100),
  gaps: z.array(z.string()),
});

/**
 * LLMシナリオ生成レスポンスのバリデーションスキーマ
 */
export const llmScenarioResponseSchema = z.object({
  scenario: z.string(),
  keyAdvantages: z.array(z.string()),
  synergyMultiplier: z.number().min(1.0).max(1.5),
  capabilityUtilization: z.object({
    realEstateDevelopment: z.string().optional(),
    operations: z.string().optional(),
    finance: z.string().optional(),
    innovation: z.string().optional(),
  }),
});

/**
 * LLMシナリオ検証レスポンスのバリデーションスキーマ
 */
export const llmScenarioValidationResponseSchema = z.object({
  logicalConsistency: z.number().min(0).max(100),
  feasibility: z.number().min(0).max(100),
  uniqueness: z.number().min(0).max(100),
  overallCredibility: z.number().min(0).max(100),
  validationComments: z.array(z.string()),
  improvements: z.array(z.string()).optional(),
});

// 型エクスポート
export type BusinessIdea = z.infer<typeof businessIdeaSchema>;
export type MarketScore = z.infer<typeof marketScoreSchema>;
export type SynergyScore = z.infer<typeof synergyScoreSchema>;
export type EvaluationResult = z.infer<typeof evaluationResultSchema>;
export type CriticInput = z.infer<typeof criticInputSchema>;
export type CriticOutput = z.infer<typeof criticOutputSchema>;