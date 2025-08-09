/**
 * Ideator Agent Integration Test
 * Ideatorエージェントの統合テスト
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { IdeatorAgent } from '../../lib/agents/ideator';
import type { EnhancedOutput } from '../../lib/agents/broad-researcher/enhanced-output-generator';
import type { IdeationRequest } from '../../lib/types/ideator';

// モックLLMの設定
const mockLLM = {
  invoke: jest.fn(),
  _modelType: jest.fn().mockReturnValue('chat'),
  _llmType: jest.fn().mockReturnValue('openai')
};

describe('IdeatorAgent Integration', () => {
  let ideatorAgent: IdeatorAgent;
  
  // テスト用のEnhancedOutput
  const mockEnhancedOutput: EnhancedOutput = {
    processedResearch: {
      summary: 'AI市場は急速に成長しており、特に中小企業向けのソリューションに大きな機会があります。',
      sources: [
        'https://example.com/ai-market-report',
        'https://example.com/sme-digital-transformation'
      ],
      queries: ['AI market opportunities', 'SME digitalization']
    },
    facts: [
      'AI市場は2025年までに10兆円規模に成長予測',
      '中小企業の70%がデジタル化に課題を抱えている',
      '既存ソリューションは高価で複雑'
    ],
    metrics: {
      marketSize: 10000000000000,
      growthRate: 25,
      adoptionRate: 30
    },
    entities: [
      { name: 'OpenAI', type: 'competitor', relevance: 0.9 },
      { name: '中小企業', type: 'target_market', relevance: 0.95 }
    ],
    detailedAnalysis: {
      marketTrends: [
        'AI/MLの民主化',
        'ノーコード/ローコードプラットフォームの普及',
        'エッジAIの成長'
      ],
      competitiveLandscape: '大手テック企業が大企業向けに集中、中小企業市場にギャップ',
      opportunities: [
        '中小企業向けAIソリューション',
        '業界特化型AI',
        'AI教育・トレーニング'
      ],
      challenges: [
        'AI人材不足',
        '初期投資コスト',
        'データプライバシー懸念'
      ],
      recommendations: [
        '段階的導入アプローチ',
        'パートナーシップ戦略',
        'ユーザー教育プログラム'
      ]
    }
  };

  // モックのビジネスアイデア
  const mockBusinessIdea = {
    id: 'idea-test-1',
    title: 'AI業務自動化プラットフォーム',
    description: '中小企業向けのノーコードAI自動化プラットフォーム。簡単な設定で業務プロセスを自動化し、生産性を向上させます。月額制で手軽に導入可能。',
    targetCustomers: ['中小企業', 'スタートアップ', '個人事業主'],
    customerPains: ['人材不足', '業務効率化', 'コスト削減'],
    valueProposition: 'プログラミング不要で業務自動化を実現し、人的リソースを戦略的業務に集中可能',
    revenueModel: 'SaaS型月額課金（基本プラン5万円/月、プロプラン15万円/月）',
    estimatedRevenue: 600000000,
    implementationDifficulty: 'medium' as const,
    marketOpportunity: '中小企業のDX需要増加による巨大市場機会'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // モックLLMの応答設定
    mockLLM.invoke.mockResolvedValue({
      content: JSON.stringify({
        ideas: [mockBusinessIdea],
        summary: '1個のビジネスアイデアを生成しました',
        metadata: {
          totalIdeas: 1,
          averageRevenue: 600000000,
          marketSize: 10000000000000,
          generationDate: new Date().toISOString()
        }
      }),
      response_metadata: {
        usage: {
          prompt_tokens: 1000,
          completion_tokens: 2000,
          total_tokens: 3000
        }
      }
    });

    // IdeatorAgentの初期化（モックLLMを使用）
    ideatorAgent = new IdeatorAgent({
      llm: mockLLM as any,
      enableValidation: true,
      enableLogging: false
    });
  });

  describe('generateIdeas', () => {
    it('should generate business ideas from enhanced research output', async () => {
      const request: IdeationRequest = {
        numberOfIdeas: 3,
        temperature: 0.8,
        focusAreas: ['AI', '中小企業']
      };

      const result = await ideatorAgent.generateIdeas(mockEnhancedOutput, request);

      expect(result).toBeDefined();
      expect(result.ideas).toBeInstanceOf(Array);
      expect(result.ideas.length).toBeGreaterThan(0);
      expect(result.ideas[0].title).toBeDefined();
      expect(result.ideas[0].estimatedRevenue).toBeGreaterThan(0);
      expect(result.summary).toBeDefined();
      expect(result.metadata).toBeDefined();
    });

    it('should validate generated ideas', async () => {
      const result = await ideatorAgent.generateIdeas(mockEnhancedOutput);

      // 各アイデアが有効であることを確認
      for (const idea of result.ideas) {
        const validation = ideatorAgent.validateIdea(idea);
        expect(validation.isValid).toBe(true);
        expect(validation.qualityScore).toBeGreaterThan(60);
      }
    });

    it('should rank ideas by quality', async () => {
      // 複数のアイデアを返すようにモックを設定
      const multipleIdeas = [
        { ...mockBusinessIdea, id: 'idea-1', estimatedRevenue: 1000000000, implementationDifficulty: 'low' },
        { ...mockBusinessIdea, id: 'idea-2', estimatedRevenue: 500000000, implementationDifficulty: 'high' },
        { ...mockBusinessIdea, id: 'idea-3', estimatedRevenue: 800000000, implementationDifficulty: 'medium' }
      ];

      mockLLM.invoke.mockResolvedValue({
        content: JSON.stringify({
          ideas: multipleIdeas,
          summary: '3個のアイデアを生成',
          metadata: {
            totalIdeas: 3,
            averageRevenue: 766666666,
            marketSize: 10000000000000,
            generationDate: new Date().toISOString()
          }
        }),
        response_metadata: {}
      });

      const result = await ideatorAgent.generateIdeas(mockEnhancedOutput);

      // 最初のアイデアが最高スコアであることを確認
      expect(result.ideas[0].id).toBe('idea-1');
      expect(result.ideas.length).toBe(3);
    });
  });

  describe('generateSingleIdea', () => {
    it('should generate a single focused idea', async () => {
      mockLLM.invoke.mockResolvedValue({
        content: JSON.stringify(mockBusinessIdea),
        response_metadata: {}
      });

      const idea = await ideatorAgent.generateSingleIdea(
        mockEnhancedOutput,
        'AI教育プラットフォーム'
      );

      expect(idea).toBeDefined();
      expect(idea.title).toBeDefined();
      expect(idea.targetCustomers.length).toBeGreaterThan(0);
      expect(idea.customerPains.length).toBeGreaterThan(0);
    });
  });

  describe('refineIdea', () => {
    it('should refine an idea based on feedback', async () => {
      const refinedIdea = {
        ...mockBusinessIdea,
        title: 'AI業務最適化スイート',
        estimatedRevenue: 1200000000,
        description: 'より包括的なAIソリューションスイート。業務自動化に加え、データ分析、予測機能を提供。'
      };

      mockLLM.invoke.mockResolvedValue({
        content: JSON.stringify(refinedIdea),
        response_metadata: {}
      });

      const result = await ideatorAgent.refineIdea(
        mockBusinessIdea,
        '収益性を高め、より包括的なソリューションにしてください'
      );

      expect(result.estimatedRevenue).toBeGreaterThan(mockBusinessIdea.estimatedRevenue);
      expect(result.title).not.toBe(mockBusinessIdea.title);
    });
  });

  describe('analyzeIdea', () => {
    it('should analyze strengths and weaknesses of an idea', () => {
      const analysis = ideatorAgent.analyzeIdea(mockBusinessIdea);

      expect(analysis.strengths).toBeInstanceOf(Array);
      expect(analysis.weaknesses).toBeInstanceOf(Array);
      expect(analysis.validationResult).toBeDefined();
      expect(analysis.suggestions).toBeInstanceOf(Array);

      // 中程度の収益と実装難易度なので、いくつかの強みがあるはず
      expect(analysis.strengths.length).toBeGreaterThan(0);
    });
  });

  describe('getMetrics', () => {
    it('should track token usage and performance metrics', async () => {
      await ideatorAgent.generateIdeas(mockEnhancedOutput);

      const metrics = ideatorAgent.getMetrics();

      expect(metrics.tokenUsage).toBeDefined();
      expect(metrics.tokenUsage.totalTokens).toBeGreaterThan(0);
      expect(metrics.performanceMetrics).toBeDefined();
    });

    it('should reset metrics', async () => {
      await ideatorAgent.generateIdeas(mockEnhancedOutput);
      
      ideatorAgent.resetMetrics();
      const metrics = ideatorAgent.getMetrics();

      expect(metrics.tokenUsage.totalTokens).toBe(0);
      expect(metrics.tokenUsage.promptTokens).toBe(0);
      expect(metrics.tokenUsage.completionTokens).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should handle LLM errors gracefully', async () => {
      mockLLM.invoke.mockRejectedValue(new Error('LLM API error'));

      await expect(
        ideatorAgent.generateIdeas(mockEnhancedOutput)
      ).rejects.toThrow();
    });

    it('should handle invalid output format', async () => {
      mockLLM.invoke.mockResolvedValue({
        content: 'Invalid JSON response',
        response_metadata: {}
      });

      await expect(
        ideatorAgent.generateIdeas(mockEnhancedOutput)
      ).rejects.toThrow();
    });

    it('should handle empty research output', async () => {
      const emptyOutput: EnhancedOutput = {
        processedResearch: {
          summary: '',
          sources: [],
          queries: []
        },
        facts: [],
        metrics: {},
        entities: [],
        detailedAnalysis: {
          marketTrends: [],
          competitiveLandscape: '',
          opportunities: [],
          challenges: [],
          recommendations: []
        }
      };

      mockLLM.invoke.mockResolvedValue({
        content: JSON.stringify({
          ideas: [],
          summary: 'No ideas generated',
          metadata: {
            totalIdeas: 0,
            averageRevenue: 0,
            marketSize: 0,
            generationDate: new Date().toISOString()
          }
        }),
        response_metadata: {}
      });

      const result = await ideatorAgent.generateIdeas(emptyOutput);
      
      expect(result.ideas).toEqual([]);
      expect(result.metadata.totalIdeas).toBe(0);
    });
  });
});