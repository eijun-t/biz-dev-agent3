/**
 * Creative Prompt Builder Test
 * プロンプト構築サービスのテスト
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { CreativePromptBuilder } from '../../../lib/agents/ideator/creative-prompt-builder';
import type { EnhancedOutput } from '../../../lib/agents/broad-researcher/enhanced-output-generator';
import type { MarketOpportunity, CustomerPain } from '../../../lib/types/ideator';

// モックデータ
const mockEnhancedOutput: EnhancedOutput = {
  processedResearch: {
    summary: 'デジタルトランスフォーメーション市場は急速に成長しており、特に中小企業向けのソリューションが不足している。',
    sources: ['https://example.com/report1', 'https://example.com/report2'],
    queries: ['DX市場動向', '中小企業のデジタル化']
  },
  facts: [
    '日本のDX市場は2025年までに3兆円規模に成長予測',
    '中小企業の70%がデジタル化に課題を抱えている',
    '既存ソリューションの導入コストが高い'
  ],
  metrics: {
    marketSize: 3000000000000,
    growthRate: 15.5,
    adoptionRate: 30
  },
  entities: [
    { name: 'Salesforce', type: 'competitor', relevance: 0.8 },
    { name: '中小企業', type: 'target_market', relevance: 0.9 }
  ],
  detailedAnalysis: {
    marketTrends: [
      'クラウドベースソリューションへの移行',
      'AI/ML技術の民主化',
      'ローコード/ノーコードプラットフォームの普及'
    ],
    competitiveLandscape: '大手ベンダーは大企業向けに集中しており、中小企業向けの手頃なソリューションが不足',
    opportunities: [
      '中小企業向けの簡易DXソリューション',
      '業界特化型のデジタル化支援',
      'ローカルビジネス向けのAI活用ツール'
    ],
    challenges: [
      'IT人材の不足',
      '初期投資コストの高さ',
      '変化への抵抗'
    ],
    recommendations: [
      '段階的な導入アプローチの採用',
      'ROIの明確な提示',
      'ユーザー教育プログラムの提供'
    ]
  }
};

describe('CreativePromptBuilder', () => {
  let builder: CreativePromptBuilder;

  beforeEach(() => {
    builder = new CreativePromptBuilder();
  });

  describe('extractOpportunities', () => {
    it('should extract market opportunities from enhanced output', () => {
      const opportunities = builder.extractOpportunities(mockEnhancedOutput);

      expect(opportunities).toBeInstanceOf(Array);
      expect(opportunities.length).toBeGreaterThan(0);
      
      const firstOpportunity = opportunities[0];
      expect(firstOpportunity).toHaveProperty('id');
      expect(firstOpportunity).toHaveProperty('description');
      expect(firstOpportunity).toHaveProperty('marketSize');
      expect(firstOpportunity).toHaveProperty('growthRate');
      expect(firstOpportunity).toHaveProperty('unmetNeeds');
      expect(firstOpportunity).toHaveProperty('competitiveGaps');
    });

    it('should identify unmet needs from analysis', () => {
      const opportunities = builder.extractOpportunities(mockEnhancedOutput);
      const unmetNeeds = opportunities.flatMap(o => o.unmetNeeds);

      expect(unmetNeeds).toContain('中小企業向けの手頃な価格のソリューション');
    });

    it('should calculate market size from metrics', () => {
      const opportunities = builder.extractOpportunities(mockEnhancedOutput);
      const totalMarketSize = opportunities.reduce((sum, o) => sum + o.marketSize, 0);

      expect(totalMarketSize).toBeGreaterThan(0);
      expect(totalMarketSize).toBeLessThanOrEqual(mockEnhancedOutput.metrics.marketSize);
    });
  });

  describe('identifyCustomerPains', () => {
    it('should identify customer pains from enhanced output', () => {
      const pains = builder.identifyCustomerPains(mockEnhancedOutput);

      expect(pains).toBeInstanceOf(Array);
      expect(pains.length).toBeGreaterThan(0);

      const firstPain = pains[0];
      expect(firstPain).toHaveProperty('id');
      expect(firstPain).toHaveProperty('description');
      expect(firstPain).toHaveProperty('severity');
      expect(firstPain).toHaveProperty('frequency');
      expect(firstPain).toHaveProperty('currentSolutions');
      expect(firstPain).toHaveProperty('limitations');
    });

    it('should categorize pain severity based on impact', () => {
      const pains = builder.identifyCustomerPains(mockEnhancedOutput);
      const highSeverityPains = pains.filter(p => p.severity === 'high');

      expect(highSeverityPains.length).toBeGreaterThan(0);
      expect(highSeverityPains.some(p => 
        p.description.includes('コスト') || p.description.includes('人材')
      )).toBe(true);
    });

    it('should identify current solution limitations', () => {
      const pains = builder.identifyCustomerPains(mockEnhancedOutput);
      const limitations = pains.flatMap(p => p.limitations);

      expect(limitations.length).toBeGreaterThan(0);
      expect(limitations.some(l => l.includes('高い') || l.includes('複雑'))).toBe(true);
    });
  });

  describe('buildIdeationPrompt', () => {
    it('should build a comprehensive ideation prompt', () => {
      const prompt = builder.buildIdeationPrompt(mockEnhancedOutput);

      expect(prompt).toBeDefined();
      expect(prompt.inputVariables).toContain('research_summary');
      expect(prompt.inputVariables).toContain('market_opportunities');
      expect(prompt.inputVariables).toContain('customer_pains');
    });

    it('should include market context in prompt', async () => {
      const prompt = builder.buildIdeationPrompt(mockEnhancedOutput);
      const formattedPrompt = await prompt.format({
        research_summary: mockEnhancedOutput.processedResearch.summary,
        market_opportunities: JSON.stringify(builder.extractOpportunities(mockEnhancedOutput)),
        customer_pains: JSON.stringify(builder.identifyCustomerPains(mockEnhancedOutput)),
        facts: mockEnhancedOutput.facts.join('\n'),
        trends: mockEnhancedOutput.detailedAnalysis.marketTrends.join('\n')
      });

      expect(formattedPrompt).toContain('市場調査結果');
      expect(formattedPrompt).toContain('顧客課題');
      expect(formattedPrompt).toContain('5つ');
    });

    it('should format prompt for JSON output', async () => {
      const prompt = builder.buildIdeationPrompt(mockEnhancedOutput);
      const formattedPrompt = await prompt.format({
        research_summary: mockEnhancedOutput.processedResearch.summary,
        market_opportunities: '[]',
        customer_pains: '[]',
        facts: '',
        trends: ''
      });

      expect(formattedPrompt).toContain('JSON');
      expect(formattedPrompt).toContain('フォーマット');
    });
  });

  describe('extractTrends', () => {
    it('should extract market trends from analysis', () => {
      const trends = builder.extractTrends(mockEnhancedOutput);

      expect(trends).toBeInstanceOf(Array);
      expect(trends.length).toBeGreaterThan(0);
      expect(trends).toContain('クラウドベースソリューションへの移行');
      expect(trends).toContain('AI/ML技術の民主化');
    });
  });

  describe('summarizeCompetitiveLandscape', () => {
    it('should summarize competitive landscape', () => {
      const summary = builder.summarizeCompetitiveLandscape(mockEnhancedOutput);

      expect(summary).toBeDefined();
      expect(summary.length).toBeGreaterThan(10);
      expect(summary).toContain('大手ベンダー');
      expect(summary).toContain('中小企業');
    });
  });

  describe('analyzeMarketContext', () => {
    it('should create comprehensive market context', () => {
      const context = builder.analyzeMarketContext(mockEnhancedOutput);

      expect(context).toHaveProperty('opportunities');
      expect(context).toHaveProperty('customerPains');
      expect(context).toHaveProperty('trends');
      expect(context).toHaveProperty('competitiveLandscape');

      expect(context.opportunities.length).toBeGreaterThan(0);
      expect(context.customerPains.length).toBeGreaterThan(0);
      expect(context.trends.length).toBeGreaterThan(0);
      expect(context.competitiveLandscape.length).toBeGreaterThan(10);
    });
  });

  describe('edge cases', () => {
    it('should handle empty enhanced output gracefully', () => {
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

      const opportunities = builder.extractOpportunities(emptyOutput);
      const pains = builder.identifyCustomerPains(emptyOutput);

      expect(opportunities).toEqual([]);
      expect(pains).toEqual([]);
    });

    it('should handle missing metrics gracefully', () => {
      const outputWithoutMetrics = {
        ...mockEnhancedOutput,
        metrics: {}
      };

      const opportunities = builder.extractOpportunities(outputWithoutMetrics);
      expect(opportunities).toBeInstanceOf(Array);
      expect(opportunities.every(o => o.marketSize === 0)).toBe(true);
    });

    it('should handle missing detailed analysis', () => {
      const outputWithoutAnalysis = {
        ...mockEnhancedOutput,
        facts: [], // factsも空にする
        entities: [], // entitiesも空にする
        detailedAnalysis: {
          marketTrends: [],
          competitiveLandscape: '',
          opportunities: [],
          challenges: [],
          recommendations: []
        }
      };

      const trends = builder.extractTrends(outputWithoutAnalysis);
      const landscape = builder.summarizeCompetitiveLandscape(outputWithoutAnalysis);

      expect(trends).toEqual([]);
      expect(landscape).toBe('競合情報が不足しています');
    });
  });
});