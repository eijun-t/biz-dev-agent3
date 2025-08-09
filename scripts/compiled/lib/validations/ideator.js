"use strict";
/**
 * Ideator Agent Validation Schemas
 * Zodを使用したバリデーションスキーマ定義
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validationResultSchema = exports.marketContextSchema = exports.llmConfigSchema = exports.ideatorConfigSchema = exports.ideatorOutputSchema = exports.customerPainSchema = exports.marketOpportunitySchema = exports.businessIdeaSchema = void 0;
var zod_1 = require("zod");
/**
 * ビジネスアイデアのバリデーションスキーマ
 */
exports.businessIdeaSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    title: zod_1.z.string().min(1).max(30, 'タイトルは30文字以内で入力してください'),
    description: zod_1.z.string().min(10).max(500, '概要は10-500文字で入力してください'),
    targetCustomers: zod_1.z.array(zod_1.z.string().min(1)).min(1, '少なくとも1つの顧客セグメントが必要です'),
    customerPains: zod_1.z.array(zod_1.z.string().min(1)).min(1, '少なくとも1つの顧客課題が必要です'),
    valueProposition: zod_1.z.string().min(10, '提供価値を10文字以上で記述してください'),
    revenueModel: zod_1.z.string().min(10, '収益モデルを10文字以上で記述してください'),
    estimatedRevenue: zod_1.z.number().min(0, '推定営業利益は0以上である必要があります'),
    implementationDifficulty: zod_1.z.enum(['low', 'medium', 'high']),
    marketOpportunity: zod_1.z.string().min(10, '市場機会を10文字以上で記述してください')
});
/**
 * 市場機会のバリデーションスキーマ
 */
exports.marketOpportunitySchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    description: zod_1.z.string().min(10),
    marketSize: zod_1.z.number().min(0),
    growthRate: zod_1.z.number().min(-100).max(1000),
    unmetNeeds: zod_1.z.array(zod_1.z.string().min(1)).min(1),
    competitiveGaps: zod_1.z.array(zod_1.z.string().min(1))
});
/**
 * 顧客課題のバリデーションスキーマ
 */
exports.customerPainSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    description: zod_1.z.string().min(10),
    severity: zod_1.z.enum(['low', 'medium', 'high']),
    frequency: zod_1.z.enum(['rare', 'occasional', 'frequent', 'daily']),
    currentSolutions: zod_1.z.array(zod_1.z.string()),
    limitations: zod_1.z.array(zod_1.z.string())
});
/**
 * Ideator出力のバリデーションスキーマ
 */
exports.ideatorOutputSchema = zod_1.z.object({
    sessionId: zod_1.z.string().uuid(),
    ideas: zod_1.z.array(exports.businessIdeaSchema).length(5, '正確に5つのアイデアが必要です'),
    metadata: zod_1.z.object({
        generatedAt: zod_1.z.date(),
        modelUsed: zod_1.z.string().min(1),
        tokensUsed: zod_1.z.number().min(0),
        processingTimeMs: zod_1.z.number().min(0),
        researchDataId: zod_1.z.string()
    }),
    qualityMetrics: zod_1.z.object({
        structureCompleteness: zod_1.z.number().min(0).max(100),
        contentConsistency: zod_1.z.number().min(0).max(100),
        marketClarity: zod_1.z.number().min(0).max(100)
    })
});
/**
 * Ideator設定のバリデーションスキーマ
 */
exports.ideatorConfigSchema = zod_1.z.object({
    model: zod_1.z.string().optional(),
    temperature: zod_1.z.number().min(0).max(2).optional(),
    maxTokens: zod_1.z.number().min(100).max(32000).optional(),
    focusArea: zod_1.z.string().optional(),
    constraints: zod_1.z.array(zod_1.z.string()).optional(),
    targetRevenue: zod_1.z.number().min(0).optional(),
    retryAttempts: zod_1.z.number().min(0).max(10).optional(),
    timeout: zod_1.z.number().min(1000).max(300000).optional()
});
/**
 * LLM設定のバリデーションスキーマ
 */
exports.llmConfigSchema = zod_1.z.object({
    model: zod_1.z.string().min(1),
    temperature: zod_1.z.number().min(0).max(2),
    maxTokens: zod_1.z.number().min(100).max(32000),
    topP: zod_1.z.number().min(0).max(1),
    presencePenalty: zod_1.z.number().min(-2).max(2),
    frequencyPenalty: zod_1.z.number().min(-2).max(2)
});
/**
 * 市場コンテキストのバリデーションスキーマ
 */
exports.marketContextSchema = zod_1.z.object({
    opportunities: zod_1.z.array(exports.marketOpportunitySchema),
    customerPains: zod_1.z.array(exports.customerPainSchema),
    trends: zod_1.z.array(zod_1.z.string().min(1)),
    competitiveLandscape: zod_1.z.string().min(10)
});
/**
 * バリデーション結果のバリデーションスキーマ
 */
exports.validationResultSchema = zod_1.z.object({
    isValid: zod_1.z.boolean(),
    errors: zod_1.z.array(zod_1.z.string()),
    warnings: zod_1.z.array(zod_1.z.string())
});
