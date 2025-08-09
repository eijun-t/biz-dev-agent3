/**
 * Ideator Types Test
 * 型定義とバリデーションのテスト
 */

import { describe, it, expect } from '@jest/globals';
import { v4 as uuidv4 } from 'uuid';
import {
  businessIdeaSchema,
  marketOpportunitySchema,
  customerPainSchema,
  ideatorOutputSchema,
  ideatorConfigSchema,
  llmConfigSchema
} from '../../lib/validations/ideator';
import type {
  BusinessIdea,
  MarketOpportunity,
  CustomerPain,
  IdeatorOutput
} from '../../lib/types/ideator';

describe('Ideator Type Validations', () => {
  describe('BusinessIdea Schema', () => {
    it('should validate a valid business idea', () => {
      const validIdea: BusinessIdea = {
        id: uuidv4(),
        title: '革新的なビジネスアイデア',
        description: 'これは革新的なビジネスアイデアの説明です。市場に大きなインパクトを与える可能性があります。',
        targetCustomers: ['企業', '個人事業主'],
        customerPains: ['効率性の欠如', 'コスト削減の必要性'],
        valueProposition: '業務効率を50%改善し、コストを30%削減します',
        revenueModel: 'SaaSモデルによる月額課金',
        estimatedRevenue: 1000000000,
        implementationDifficulty: 'medium',
        marketOpportunity: '成長市場において競合が少ない領域での展開'
      };

      const result = businessIdeaSchema.safeParse(validIdea);
      expect(result.success).toBe(true);
    });

    it('should reject idea with invalid title length', () => {
      const invalidIdea = {
        id: uuidv4(),
        title: 'これは30文字を超える非常に長いタイトルですので、バリデーションエラーになるはずです',
        description: '有効な説明文',
        targetCustomers: ['企業'],
        customerPains: ['課題'],
        valueProposition: '価値提供',
        revenueModel: '収益モデル',
        estimatedRevenue: 1000000000,
        implementationDifficulty: 'low',
        marketOpportunity: '市場機会'
      };

      const result = businessIdeaSchema.safeParse(invalidIdea);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('30文字以内');
      }
    });

    it('should reject idea with empty arrays', () => {
      const invalidIdea = {
        id: uuidv4(),
        title: '有効なタイトル',
        description: '有効な説明文',
        targetCustomers: [],  // 空配列
        customerPains: [],    // 空配列
        valueProposition: '価値提供',
        revenueModel: '収益モデル',
        estimatedRevenue: 1000000000,
        implementationDifficulty: 'high',
        marketOpportunity: '市場機会'
      };

      const result = businessIdeaSchema.safeParse(invalidIdea);
      expect(result.success).toBe(false);
    });

    it('should reject invalid implementation difficulty', () => {
      const invalidIdea = {
        id: uuidv4(),
        title: '有効なタイトル',
        description: '有効な説明文',
        targetCustomers: ['顧客'],
        customerPains: ['課題'],
        valueProposition: '価値提供',
        revenueModel: '収益モデル',
        estimatedRevenue: 1000000000,
        implementationDifficulty: 'very-high' as any,  // 無効な値
        marketOpportunity: '市場機会'
      };

      const result = businessIdeaSchema.safeParse(invalidIdea);
      expect(result.success).toBe(false);
    });
  });

  describe('MarketOpportunity Schema', () => {
    it('should validate a valid market opportunity', () => {
      const validOpportunity: MarketOpportunity = {
        id: uuidv4(),
        description: '急成長するデジタルトランスフォーメーション市場',
        marketSize: 5000000000000,  // 5兆円
        growthRate: 15.5,            // 15.5%成長
        unmetNeeds: ['自動化の需要', 'コスト削減'],
        competitiveGaps: ['大企業向けソリューションの不足']
      };

      const result = marketOpportunitySchema.safeParse(validOpportunity);
      expect(result.success).toBe(true);
    });

    it('should reject invalid growth rate', () => {
      const invalidOpportunity = {
        id: uuidv4(),
        description: '市場機会の説明',
        marketSize: 1000000000,
        growthRate: 2000,  // 2000%は範囲外
        unmetNeeds: ['ニーズ'],
        competitiveGaps: []
      };

      const result = marketOpportunitySchema.safeParse(invalidOpportunity);
      expect(result.success).toBe(false);
    });
  });

  describe('CustomerPain Schema', () => {
    it('should validate a valid customer pain', () => {
      const validPain: CustomerPain = {
        id: uuidv4(),
        description: '手作業による非効率なデータ処理',
        severity: 'high',
        frequency: 'frequent',
        currentSolutions: ['Excelによる手作業', '紙ベースの管理'],
        limitations: ['ヒューマンエラー', 'スケーラビリティの欠如']
      };

      const result = customerPainSchema.safeParse(validPain);
      expect(result.success).toBe(true);
    });

    it('should reject invalid severity level', () => {
      const invalidPain = {
        id: uuidv4(),
        description: '顧客の課題',
        severity: 'critical' as any,  // 無効な値
        frequency: 'occasional',
        currentSolutions: [],
        limitations: []
      };

      const result = customerPainSchema.safeParse(invalidPain);
      expect(result.success).toBe(false);
    });
  });

  describe('IdeatorOutput Schema', () => {
    it('should validate a complete ideator output with exactly 5 ideas', () => {
      const ideas: BusinessIdea[] = Array.from({ length: 5 }, (_, i) => ({
        id: uuidv4(),
        title: `ビジネスアイデア${i + 1}`,
        description: `これはビジネスアイデア${i + 1}の詳細な説明です。革新的な価値を提供します。`,
        targetCustomers: ['顧客セグメント1', '顧客セグメント2'],
        customerPains: ['課題1', '課題2'],
        valueProposition: '業務効率を50%改善し、コストを30%削減する価値提供',
        revenueModel: 'SaaSモデルによる月額課金制のサブスクリプション',
        estimatedRevenue: 1000000000,
        implementationDifficulty: 'medium',
        marketOpportunity: '急成長市場における先行者利益を獲得できる大きな機会'
      }));

      const validOutput: IdeatorOutput = {
        sessionId: uuidv4(),
        ideas,
        metadata: {
          generatedAt: new Date(),
          modelUsed: 'gpt-4o',
          tokensUsed: 5000,
          processingTimeMs: 15000,
          researchDataId: uuidv4()
        },
        qualityMetrics: {
          structureCompleteness: 95,
          contentConsistency: 88,
          marketClarity: 82
        }
      };

      const result = ideatorOutputSchema.safeParse(validOutput);
      if (!result.success) {
        console.error('Validation errors:', result.error.issues);
      }
      expect(result.success).toBe(true);
    });

    it('should reject output with less than 5 ideas', () => {
      const ideas: BusinessIdea[] = Array.from({ length: 3 }, (_, i) => ({
        id: uuidv4(),
        title: `アイデア${i + 1}`,
        description: `これはアイデア${i + 1}の詳細な説明です。十分な長さの説明文を含んでいます。`,
        targetCustomers: ['顧客'],
        customerPains: ['課題'],
        valueProposition: '価値提供の詳細な説明',
        revenueModel: '収益モデルの詳細な説明',
        estimatedRevenue: 1000000000,
        implementationDifficulty: 'low',
        marketOpportunity: '市場機会の詳細な説明'
      }));

      const invalidOutput = {
        sessionId: uuidv4(),
        ideas,  // 3個しかない
        metadata: {
          generatedAt: new Date(),
          modelUsed: 'gpt-4o',
          tokensUsed: 3000,
          processingTimeMs: 10000,
          researchDataId: uuidv4()
        },
        qualityMetrics: {
          structureCompleteness: 80,
          contentConsistency: 75,
          marketClarity: 70
        }
      };

      const result = ideatorOutputSchema.safeParse(invalidOutput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('5つのアイデア');
      }
    });

    it('should reject output with more than 5 ideas', () => {
      const ideas: BusinessIdea[] = Array.from({ length: 7 }, (_, i) => ({
        id: uuidv4(),
        title: `アイデア${i + 1}`,
        description: `これはアイデア${i + 1}の説明です。詳細な内容を含みます。`,
        targetCustomers: ['顧客'],
        customerPains: ['課題'],
        valueProposition: '価値提供',
        revenueModel: '収益モデル',
        estimatedRevenue: 1000000000,
        implementationDifficulty: 'medium',
        marketOpportunity: '市場機会'
      }));

      const invalidOutput = {
        sessionId: uuidv4(),
        ideas,  // 7個ある
        metadata: {
          generatedAt: new Date(),
          modelUsed: 'gpt-4o',
          tokensUsed: 7000,
          processingTimeMs: 20000,
          researchDataId: uuidv4()
        },
        qualityMetrics: {
          structureCompleteness: 90,
          contentConsistency: 85,
          marketClarity: 80
        }
      };

      const result = ideatorOutputSchema.safeParse(invalidOutput);
      expect(result.success).toBe(false);
    });

    it('should reject invalid quality metrics', () => {
      const ideas: BusinessIdea[] = Array.from({ length: 5 }, (_, i) => ({
        id: uuidv4(),
        title: `アイデア${i + 1}`,
        description: `これはアイデア${i + 1}の詳細な説明です。十分な長さの説明文を含んでいます。`,
        targetCustomers: ['顧客'],
        customerPains: ['課題'],
        valueProposition: '価値提供の詳細な説明',
        revenueModel: '収益モデルの詳細な説明',
        estimatedRevenue: 1000000000,
        implementationDifficulty: 'high',
        marketOpportunity: '市場機会の詳細な説明'
      }));

      const invalidOutput = {
        sessionId: uuidv4(),
        ideas,
        metadata: {
          generatedAt: new Date(),
          modelUsed: 'gpt-4o',
          tokensUsed: 5000,
          processingTimeMs: 15000,
          researchDataId: uuidv4()
        },
        qualityMetrics: {
          structureCompleteness: 150,  // 100を超える
          contentConsistency: -10,     // 負の値
          marketClarity: 50
        }
      };

      const result = ideatorOutputSchema.safeParse(invalidOutput);
      expect(result.success).toBe(false);
    });
  });

  describe('IdeatorConfig Schema', () => {
    it('should validate valid configuration', () => {
      const validConfig = {
        model: 'gpt-4o',
        temperature: 0.7,
        maxTokens: 8000,
        focusArea: 'デジタルトランスフォーメーション',
        constraints: ['予算1000万円以内', '実装期間6ヶ月'],
        targetRevenue: 1000000000,
        retryAttempts: 3,
        timeout: 60000
      };

      const result = ideatorConfigSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
    });

    it('should accept partial configuration', () => {
      const partialConfig = {
        temperature: 0.8,
        maxTokens: 5000
      };

      const result = ideatorConfigSchema.safeParse(partialConfig);
      expect(result.success).toBe(true);
    });

    it('should reject invalid temperature', () => {
      const invalidConfig = {
        temperature: 3.0  // 2.0を超える
      };

      const result = ideatorConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });
  });

  describe('LLMConfig Schema', () => {
    it('should validate valid LLM configuration', () => {
      const validConfig = {
        model: 'gpt-4o',
        temperature: 0.75,
        maxTokens: 8000,
        topP: 0.9,
        presencePenalty: 0.1,
        frequencyPenalty: 0.1
      };

      const result = llmConfigSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
    });

    it('should reject invalid penalty values', () => {
      const invalidConfig = {
        model: 'gpt-4o',
        temperature: 0.7,
        maxTokens: 8000,
        topP: 0.9,
        presencePenalty: 3.0,  // 2.0を超える
        frequencyPenalty: -3.0  // -2.0未満
      };

      const result = llmConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });
  });
});