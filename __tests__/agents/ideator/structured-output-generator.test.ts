/**
 * Structured Output Generator Test
 * 構造化出力ジェネレーターのテスト
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { StructuredOutputGenerator } from '../../../lib/agents/ideator/structured-output-generator';
import { LLMIntegrationService } from '../../../lib/agents/ideator/llm-integration-service';
import type {
  BusinessIdea,
  IdeatorOutput,
  IdeationContext,
  IdeationRequest,
  MarketOpportunity,
  CustomerPain
} from '../../../lib/types/ideator';

// LLMIntegrationServiceのモック
jest.mock('../../../lib/agents/ideator/llm-integration-service');

describe('StructuredOutputGenerator', () => {
  let generator: StructuredOutputGenerator;
  let mockLLMService: jest.Mocked<LLMIntegrationService>;
  
  // テスト用のコンテキスト
  const testContext: IdeationContext = {
    opportunities: [
      {
        id: 'opp-1',
        description: 'AI活用による業務自動化市場',
        marketSize: 500000000000,
        growthRate: 25,
        unmetNeeds: ['中小企業向けの低価格ソリューション', '導入の簡易化'],
        competitiveGaps: ['使いやすさ', '日本語対応']
      },
      {
        id: 'opp-2',
        description: 'リモートワーク支援ツール市場',
        marketSize: 300000000000,
        growthRate: 20,
        unmetNeeds: ['セキュリティ強化', 'コラボレーション機能'],
        competitiveGaps: ['価格競争力', '統合性']
      }
    ],
    customerPains: [
      {
        id: 'pain-1',
        description: 'IT人材不足による開発遅延',
        severity: 'high',
        frequency: 'daily',
        currentSolutions: ['外注', '派遣'],
        limitations: ['コスト高', 'ノウハウ蓄積困難']
      },
      {
        id: 'pain-2',
        description: 'リモートワークでのコミュニケーション課題',
        severity: 'medium',
        frequency: 'daily',
        currentSolutions: ['Slack', 'Zoom'],
        limitations: ['ツール分散', '情報共有の非効率']
      }
    ],
    trends: ['AI/MLの民主化', 'ノーコード/ローコード', 'ハイブリッドワーク'],
    competitiveLandscape: '大手ベンダーは大企業向けに集中',
    researchSummary: 'デジタル変革市場は急成長中'
  };

  // テスト用のリクエスト
  const testRequest: IdeationRequest = {
    numberOfIdeas: 3,
    temperature: 0.8,
    maxTokens: 8000,
    focusAreas: ['AI活用', 'リモートワーク']
  };

  // モックレスポンス
  const mockIdeatorOutput: IdeatorOutput = {
    ideas: [
      {
        id: 'idea-1',
        title: 'AI開発アシスタント',
        description: 'プログラミング知識不要でAIアプリを開発できるプラットフォーム。中小企業でも簡単にAI活用が可能。',
        targetCustomers: ['中小企業', 'スタートアップ'],
        customerPains: ['IT人材不足', '開発コスト高'],
        valueProposition: 'ノーコードでAI開発を実現',
        revenueModel: 'SaaS型月額課金モデル',
        estimatedRevenue: 500000000,
        implementationDifficulty: 'medium',
        marketOpportunity: 'AI活用による業務自動化市場'
      },
      {
        id: 'idea-2',
        title: 'バーチャルオフィス2.0',
        description: 'VR技術を活用した次世代リモートワーク環境。まるでオフィスにいるような臨場感でコラボレーション。',
        targetCustomers: ['リモートチーム', 'グローバル企業'],
        customerPains: ['コミュニケーション不足', '孤独感'],
        valueProposition: '物理的距離を超えた協働環境',
        revenueModel: 'ユーザー数ベースの従量課金',
        estimatedRevenue: 300000000,
        implementationDifficulty: 'high',
        marketOpportunity: 'リモートワーク支援ツール市場'
      },
      {
        id: 'idea-3',
        title: 'スマート業務最適化AI',
        description: '企業の業務プロセスを分析し、自動で最適化提案を行うAIシステム。導入即効果を実感。',
        targetCustomers: ['製造業', '物流業'],
        customerPains: ['業務効率化', 'コスト削減'],
        valueProposition: 'AIによる継続的な業務改善',
        revenueModel: '成果報酬型＋基本料金',
        estimatedRevenue: 800000000,
        implementationDifficulty: 'low',
        marketOpportunity: 'AI活用による業務自動化市場'
      }
    ],
    summary: '3個のビジネスアイデアを生成しました。うち2個は1億円以上の営業利益が見込まれます。',
    metadata: {
      totalIdeas: 3,
      averageRevenue: 533333333,
      marketSize: 800000000000,
      generationDate: new Date().toISOString()
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // LLMサービスのモックセットアップ
    mockLLMService = {
      invokeStructured: jest.fn(),
      invokeWithRetry: jest.fn(),
      trackTokenUsage: jest.fn(),
      configureLLM: jest.fn(),
      getCurrentConfig: jest.fn(),
      getTokenUsage: jest.fn(),
      resetTokenUsage: jest.fn(),
      getPerformanceMetrics: jest.fn()
    } as any;

    generator = new StructuredOutputGenerator(mockLLMService);
  });

  describe('generateBusinessIdeas', () => {
    it('should generate multiple business ideas', async () => {
      mockLLMService.invokeStructured.mockResolvedValue(mockIdeatorOutput);

      const result = await generator.generateBusinessIdeas(testContext, testRequest);

      expect(result.ideas).toHaveLength(3);
      expect(result.ideas[0].title).toBe('AI開発アシスタント');
      expect(result.metadata.totalIdeas).toBe(3);
      expect(mockLLMService.invokeStructured).toHaveBeenCalledTimes(1);
    });

    it('should validate and enrich output', async () => {
      const incompleteOutput = {
        ...mockIdeatorOutput,
        ideas: mockIdeatorOutput.ideas.map(idea => ({
          ...idea,
          id: undefined // IDを削除
        })),
        metadata: undefined // メタデータを削除
      };

      mockLLMService.invokeStructured.mockResolvedValue(incompleteOutput as any);

      const result = await generator.generateBusinessIdeas(testContext, testRequest);

      // IDが自動生成されることを確認
      expect(result.ideas.every(idea => idea.id)).toBe(true);
      // メタデータが計算されることを確認
      expect(result.metadata.totalIdeas).toBe(3);
      expect(result.metadata.averageRevenue).toBeGreaterThan(0);
    });

    it('should handle empty opportunities gracefully', async () => {
      const emptyContext: IdeationContext = {
        ...testContext,
        opportunities: [],
        customerPains: []
      };

      mockLLMService.invokeStructured.mockResolvedValue(mockIdeatorOutput);

      const result = await generator.generateBusinessIdeas(emptyContext, testRequest);

      expect(result).toBeDefined();
      expect(result.ideas).toHaveLength(3);
    });
  });

  describe('generateSingleIdea', () => {
    it('should generate a single business idea', async () => {
      const singleIdea = mockIdeatorOutput.ideas[0];
      mockLLMService.invokeStructured.mockResolvedValue(singleIdea);

      const result = await generator.generateSingleIdea(testContext);

      expect(result).toEqual(singleIdea);
      expect(mockLLMService.invokeStructured).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          temperature: 0.9,
          maxTokens: 2000
        })
      );
    });

    it('should focus on specific area when provided', async () => {
      const singleIdea = mockIdeatorOutput.ideas[0];
      mockLLMService.invokeStructured.mockResolvedValue(singleIdea);

      const result = await generator.generateSingleIdea(testContext, 'AI活用');

      expect(result).toEqual(singleIdea);
      const callArgs = mockLLMService.invokeStructured.mock.calls[0];
      expect(callArgs[0]).toContain('AI活用');
    });
  });

  describe('refineIdea', () => {
    it('should refine an existing idea based on feedback', async () => {
      const originalIdea = mockIdeatorOutput.ideas[0];
      const refinedIdea = {
        ...originalIdea,
        description: '改善された説明文',
        estimatedRevenue: 1000000000
      };

      mockLLMService.invokeStructured.mockResolvedValue(refinedIdea);

      const result = await generator.refineIdea(
        originalIdea,
        '収益性をもっと高めてください'
      );

      expect(result.estimatedRevenue).toBe(1000000000);
      expect(result.description).toBe('改善された説明文');
    });
  });

  describe('rankIdeas', () => {
    it('should rank ideas by score', () => {
      const ideas = mockIdeatorOutput.ideas;
      const rankedIdeas = generator.rankIdeas(ideas);

      // スマート業務最適化AI（低難易度・高収益）が最上位になるはず
      expect(rankedIdeas[0].id).toBe('idea-3');
      expect(rankedIdeas[0].implementationDifficulty).toBe('low');
      expect(rankedIdeas[0].estimatedRevenue).toBe(800000000);
    });

    it('should handle empty array', () => {
      const rankedIdeas = generator.rankIdeas([]);
      expect(rankedIdeas).toEqual([]);
    });

    it('should not modify original array', () => {
      const ideas = [...mockIdeatorOutput.ideas];
      const originalOrder = ideas.map(i => i.id);
      
      generator.rankIdeas(ideas);
      
      const afterOrder = ideas.map(i => i.id);
      expect(afterOrder).toEqual(originalOrder);
    });
  });

  describe('edge cases', () => {
    it('should handle missing research summary', async () => {
      const contextWithoutSummary = {
        ...testContext,
        researchSummary: undefined
      };

      mockLLMService.invokeStructured.mockResolvedValue(mockIdeatorOutput);

      const result = await generator.generateBusinessIdeas(
        contextWithoutSummary,
        testRequest
      );

      expect(result).toBeDefined();
      expect(result.ideas).toHaveLength(3);
    });

    it('should handle missing trends', async () => {
      const contextWithoutTrends = {
        ...testContext,
        trends: undefined
      };

      mockLLMService.invokeStructured.mockResolvedValue(mockIdeatorOutput);

      const result = await generator.generateBusinessIdeas(
        contextWithoutTrends,
        testRequest
      );

      expect(result).toBeDefined();
      const callArgs = mockLLMService.invokeStructured.mock.calls[0];
      expect(callArgs[0]).toContain('トレンド情報なし');
    });

    it('should generate summary when not provided', async () => {
      const outputWithoutSummary = {
        ...mockIdeatorOutput,
        summary: undefined
      };

      mockLLMService.invokeStructured.mockResolvedValue(outputWithoutSummary as any);

      const result = await generator.generateBusinessIdeas(testContext, testRequest);

      expect(result.summary).toBeDefined();
      expect(result.summary).toContain('3個のビジネスアイデア');
    });

    it('should handle ideas with missing revenue', () => {
      const ideasWithMissingRevenue = [
        { ...mockIdeatorOutput.ideas[0], estimatedRevenue: 0 },
        { ...mockIdeatorOutput.ideas[1], estimatedRevenue: undefined as any },
        mockIdeatorOutput.ideas[2]
      ];

      const rankedIdeas = generator.rankIdeas(ideasWithMissingRevenue);
      
      expect(rankedIdeas).toBeDefined();
      expect(rankedIdeas.length).toBe(3);
    });
  });
});