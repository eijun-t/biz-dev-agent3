/**
 * Market Scoring Service
 * 市場規模評価サービス
 */

import { BusinessIdea, MarketScore } from '@/lib/types/critic';
import { LLMEvaluator } from './llm-evaluator';
import { toCriticError } from '../errors';

/**
 * Market Scoring Service Configuration
 */
export interface MarketScoringConfig {
  llmModel?: string;
  temperature?: number;
  targetProfitThreshold?: number; // 目標営業利益閾値（デフォルト: 10億円）
}

/**
 * Market Scoring Service
 */
export class MarketScoringService {
  private llmEvaluator: LLMEvaluator;
  private config: Required<MarketScoringConfig>;

  constructor(config?: MarketScoringConfig) {
    this.config = {
      llmModel: config?.llmModel || 'gpt-4o',
      temperature: config?.temperature ?? 0.3,
      targetProfitThreshold: config?.targetProfitThreshold ?? 1_000_000_000, // 10億円
    };

    this.llmEvaluator = new LLMEvaluator({
      model: this.config.llmModel,
      temperature: this.config.temperature,
    });
  }

  /**
   * 市場評価を実行
   */
  async evaluateMarket(idea: BusinessIdea): Promise<MarketScore> {
    try {
      // LLMによる市場評価
      const llmResult = await this.llmEvaluator.evaluateMarket(idea);
      
      // スコア調整（営業利益10億円以上の重み付け）
      const adjustedScore = this.adjustScoreForProfitTarget(
        llmResult.marketScore,
        idea.estimatedRevenue
      );

      return {
        ...adjustedScore,
        evidence: [
          ...llmResult.marketScore.evidence,
          ...(idea.estimatedRevenue && idea.estimatedRevenue >= this.config.targetProfitThreshold
            ? [`営業利益${Math.floor(idea.estimatedRevenue / 100_000_000) / 10}億円達成可能`]
            : []),
        ],
      };
    } catch (error) {
      throw toCriticError(error);
    }
  }

  /**
   * 営業利益目標に基づくスコア調整
   */
  private adjustScoreForProfitTarget(
    baseScore: MarketScore,
    estimatedRevenue?: number
  ): MarketScore {
    if (!estimatedRevenue) {
      return baseScore;
    }

    let adjustedScore = { ...baseScore };
    
    // 10億円以上の営業利益が見込める場合、収益性スコアを上方修正
    if (estimatedRevenue >= this.config.targetProfitThreshold) {
      const profitMultiplier = Math.min(
        estimatedRevenue / this.config.targetProfitThreshold,
        2.0 // 最大2倍まで
      );

      // 収益性スコアを調整（最大15点の範囲内で）
      const adjustedProfitability = Math.min(
        Math.round(adjustedScore.breakdown.profitability * profitMultiplier),
        15
      );

      adjustedScore.breakdown.profitability = adjustedProfitability;
      
      // 合計スコアを再計算
      adjustedScore.total = 
        adjustedScore.breakdown.marketSize +
        adjustedScore.breakdown.growthPotential +
        adjustedScore.breakdown.profitability;

      // 50点を超えないように調整
      if (adjustedScore.total > 50) {
        const excess = adjustedScore.total - 50;
        adjustedScore.breakdown.profitability -= excess;
        adjustedScore.total = 50;
      }

      // 理由を更新
      adjustedScore.reasoning += ` 特に営業利益${Math.floor(estimatedRevenue / 100_000_000) / 10}億円が見込め、三菱地所の目標に合致。`;
    }

    return adjustedScore;
  }

  /**
   * 収益スコアの計算
   */
  calculateRevenueScore(estimatedRevenue?: number): number {
    if (!estimatedRevenue) {
      return 5; // デフォルトスコア
    }

    // 営業利益に基づくスコア計算
    if (estimatedRevenue >= 10_000_000_000) { // 100億円以上
      return 15;
    } else if (estimatedRevenue >= 5_000_000_000) { // 50億円以上
      return 13;
    } else if (estimatedRevenue >= 1_000_000_000) { // 10億円以上
      return 11;
    } else if (estimatedRevenue >= 500_000_000) { // 5億円以上
      return 8;
    } else if (estimatedRevenue >= 100_000_000) { // 1億円以上
      return 5;
    } else {
      return 2;
    }
  }

  /**
   * 成長性の分析
   */
  async analyzeGrowthPotential(
    idea: BusinessIdea,
    marketTrends?: string[]
  ): Promise<{
    score: number;
    analysis: string;
  }> {
    // 基本的な成長性指標
    const indicators: string[] = [];
    
    // DX・デジタル関連は高成長
    if (idea.description.includes('AI') || 
        idea.description.includes('DX') || 
        idea.description.includes('デジタル')) {
      indicators.push('デジタル変革関連');
    }

    // サステナビリティ関連は高成長
    if (idea.description.includes('脱炭素') || 
        idea.description.includes('SDGs') || 
        idea.description.includes('サステナ')) {
      indicators.push('サステナビリティ関連');
    }

    // 高齢化・医療関連は安定成長
    if (idea.description.includes('高齢') || 
        idea.description.includes('医療') || 
        idea.description.includes('ヘルスケア')) {
      indicators.push('高齢化社会対応');
    }

    // スコア計算
    let score = 7; // ベーススコア（横ばい）
    
    if (indicators.length >= 2) {
      score = 13; // 複数の成長要因
    } else if (indicators.length === 1) {
      score = 10; // 単一の成長要因
    }

    const analysis = indicators.length > 0
      ? `成長要因: ${indicators.join('、')}`
      : '安定的な市場成長が見込まれる';

    return { score, analysis };
  }

  /**
   * 市場規模の評価
   */
  assessMarketSize(marketSize?: string): {
    score: number;
    category: string;
  } {
    if (!marketSize) {
      return { score: 10, category: '中規模市場' };
    }

    // 市場規模の文字列から数値を抽出（簡易版）
    const sizeStr = marketSize.toLowerCase();
    
    if (sizeStr.includes('兆') || sizeStr.includes('trillion')) {
      return { score: 18, category: '超大規模市場（1兆円以上）' };
    } else if (sizeStr.includes('千億') || sizeStr.includes('1000億')) {
      return { score: 15, category: '大規模市場（1000億円以上）' };
    } else if (sizeStr.includes('百億') || sizeStr.includes('100億')) {
      return { score: 10, category: '中規模市場（100億円以上）' };
    } else if (sizeStr.includes('十億') || sizeStr.includes('10億')) {
      return { score: 5, category: '小規模市場（10億円以上）' };
    } else {
      return { score: 3, category: 'ニッチ市場' };
    }
  }

  /**
   * 詳細な市場評価レポート生成
   */
  async generateDetailedReport(
    idea: BusinessIdea,
    marketScore: MarketScore
  ): Promise<string> {
    const report = `
## 市場評価レポート: ${idea.title}

### 総合スコア: ${marketScore.total}/50点

#### 評価内訳:
- 市場規模: ${marketScore.breakdown.marketSize}/20点
- 成長性: ${marketScore.breakdown.growthPotential}/15点  
- 収益性: ${marketScore.breakdown.profitability}/15点

### 評価理由:
${marketScore.reasoning}

### エビデンス:
${marketScore.evidence.map(e => `- ${e}`).join('\n')}

### 市場分析:
- ターゲット顧客: ${idea.targetCustomer}
- 解決する課題: ${idea.customerProblem}
- 収益モデル: ${idea.revenueModel}
${idea.estimatedRevenue ? `- 想定営業利益: ${(idea.estimatedRevenue / 100_000_000).toFixed(1)}億円` : ''}
${idea.marketSize ? `- 市場規模: ${idea.marketSize}` : ''}
`;

    return report.trim();
  }
}