/**
 * Creative Prompt Builder
 * 市場機会と顧客課題を抽出し、創造的なプロンプトを構築
 */

import { v4 as uuidv4 } from 'uuid';
import { PromptTemplate, ChatPromptTemplate } from '@langchain/core/prompts';
import type { EnhancedOutput } from '../broad-researcher/enhanced-output-generator';
import type { 
  MarketOpportunity, 
  CustomerPain, 
  MarketContext 
} from '../../types/ideator';
import { PROMPT_CONFIG, IDEA_GENERATION } from './constants';

export class CreativePromptBuilder {
  /**
   * EnhancedOutputから市場機会を抽出
   */
  extractOpportunities(data: EnhancedOutput): MarketOpportunity[] {
    const opportunities: MarketOpportunity[] = [];

    // detailedAnalysisから機会を抽出
    if (data.detailedAnalysis?.opportunities) {
      data.detailedAnalysis.opportunities.forEach((opp, index) => {
        const marketSize = this.estimateMarketSize(data, index);
        const growthRate = data.metrics?.growthRate || 10;

        opportunities.push({
          id: uuidv4(),
          description: opp,
          marketSize,
          growthRate,
          unmetNeeds: this.extractUnmetNeeds(data, opp),
          competitiveGaps: this.extractCompetitiveGaps(data, opp)
        });
      });
    }

    // factsから追加の機会を特定（factsが存在する場合のみ）
    if (data.facts && Array.isArray(data.facts)) {
      const additionalOpportunities = this.identifyOpportunitiesFromFacts(data.facts);
      opportunities.push(...additionalOpportunities);
    }

    return opportunities;
  }

  /**
   * EnhancedOutputから顧客課題を特定
   */
  identifyCustomerPains(data: EnhancedOutput): CustomerPain[] {
    const pains: CustomerPain[] = [];

    // challengesから課題を抽出
    if (data.detailedAnalysis?.challenges) {
      data.detailedAnalysis.challenges.forEach(challenge => {
        pains.push({
          id: uuidv4(),
          description: challenge,
          severity: this.assessSeverity(challenge),
          frequency: this.assessFrequency(challenge),
          currentSolutions: this.identifyCurrentSolutions(data, challenge),
          limitations: this.identifyLimitations(data, challenge)
        });
      });
    }

    // factsから追加の課題を特定（factsが存在する場合のみ）
    if (data.facts && Array.isArray(data.facts)) {
      const additionalPains = this.identifyPainsFromFacts(data.facts);
      pains.push(...additionalPains);
    }

    return pains;
  }

  /**
   * アイディエーション用のプロンプトを構築
   */
  buildIdeationPrompt(research: EnhancedOutput): PromptTemplate {
    const template = `${PROMPT_CONFIG.systemRole}

以下の市場調査結果に基づいて、革新的なビジネスアイデアを正確に${IDEA_GENERATION.requiredCount}つ生成してください。

## 市場調査結果
{research_summary}

## 重要な事実
{facts}

## 市場機会
{market_opportunities}

## 顧客課題
{customer_pains}

## 市場トレンド
{trends}

## 要件
1. 各アイデアは営業利益${IDEA_GENERATION.targetRevenue.toLocaleString()}円規模の実現可能性を持つこと
2. 明確な顧客セグメントと解決する課題を特定すること
3. 具体的な収益モデルを提示すること
4. 実装難易度（low/medium/high）を評価すること
5. 市場機会を明確に説明すること

## 出力フォーマット
以下のJSON形式で、正確に${IDEA_GENERATION.requiredCount}つのアイデアを生成してください：

\`\`\`json
[
  {{
    "title": "30文字以内のタイトル",
    "description": "200文字程度の詳細な説明",
    "targetCustomers": ["顧客セグメント1", "顧客セグメント2"],
    "customerPains": ["解決する課題1", "解決する課題2"],
    "valueProposition": "提供価値の詳細な説明（10文字以上）",
    "revenueModel": "収益モデルの詳細な説明（10文字以上）",
    "estimatedRevenue": 推定営業利益（数値）,
    "implementationDifficulty": "low/medium/high",
    "marketOpportunity": "市場機会の詳細な説明（10文字以上）"
  }}
]
\`\`\`

必ず${IDEA_GENERATION.requiredCount}つのアイデアを生成し、各フィールドに適切な値を設定してください。`;

    return new PromptTemplate({
      template,
      inputVariables: [
        'research_summary',
        'facts',
        'market_opportunities',
        'customer_pains',
        'trends'
      ]
    });
  }

  /**
   * 市場トレンドを抽出
   */
  extractTrends(data: EnhancedOutput): string[] {
    const trends: string[] = [];

    if (data.detailedAnalysis?.marketTrends && data.detailedAnalysis.marketTrends.length > 0) {
      trends.push(...data.detailedAnalysis.marketTrends);
    }

    // factsからトレンドを抽出（detailedAnalysisが空の場合のみ）
    if (trends.length === 0) {
      const trendKeywords = ['成長', '増加', '拡大', '普及', '移行', '変化'];
      data.facts.forEach(fact => {
        if (trendKeywords.some(keyword => fact.includes(keyword))) {
          trends.push(fact);
        }
      });
    }

    return [...new Set(trends)]; // 重複を除去
  }

  /**
   * 競合状況をサマライズ
   */
  summarizeCompetitiveLandscape(data: EnhancedOutput): string {
    if (data.detailedAnalysis?.competitiveLandscape) {
      return data.detailedAnalysis.competitiveLandscape;
    }

    // エンティティから競合情報を構築
    const competitors = data.entities
      ?.filter(e => e.type === 'competitor')
      .map(e => e.name);

    if (competitors && competitors.length > 0) {
      return `主要競合: ${competitors.join(', ')}。詳細な競合分析は不足しています。`;
    }

    return '競合情報が不足しています';
  }

  /**
   * 市場コンテキストを分析
   */
  analyzeMarketContext(data: EnhancedOutput): MarketContext {
    return {
      opportunities: this.extractOpportunities(data),
      customerPains: this.identifyCustomerPains(data),
      trends: this.extractTrends(data),
      competitiveLandscape: this.summarizeCompetitiveLandscape(data)
    };
  }

  // Private helper methods

  private estimateMarketSize(data: EnhancedOutput, index: number): number {
    const baseMarketSize = data.metrics?.marketSize || 0;
    if (baseMarketSize === 0) return 0;

    // 各機会に市場の一部を割り当て
    const opportunityCount = data.detailedAnalysis?.opportunities?.length || 1;
    return Math.floor(baseMarketSize / opportunityCount);
  }

  private extractUnmetNeeds(data: EnhancedOutput, opportunity: string): string[] {
    const needs: string[] = [];

    // 機会の説明から未解決ニーズを推測
    if (opportunity.includes('不足')) {
      needs.push('既存ソリューションの不足');
    }
    if (opportunity.includes('中小企業')) {
      needs.push('中小企業向けの手頃な価格のソリューション');
    }
    if (opportunity.includes('簡易') || opportunity.includes('シンプル')) {
      needs.push('使いやすいシンプルなソリューション');
    }
    if (opportunity.includes('AI') || opportunity.includes('自動')) {
      needs.push('AI/自動化による効率化');
    }

    // challengesからも抽出
    if (data.detailedAnalysis?.challenges) {
      data.detailedAnalysis.challenges.forEach(challenge => {
        if (challenge.includes('不足') || challenge.includes('欠如')) {
          needs.push(challenge);
        }
      });
    }

    return needs.length > 0 ? needs : ['一般的な改善ニーズ'];
  }

  private extractCompetitiveGaps(data: EnhancedOutput, opportunity: string): string[] {
    const gaps: string[] = [];

    // 競合状況から隙間を特定
    const landscape = data.detailedAnalysis?.competitiveLandscape || '';
    
    if (landscape.includes('大企業向け')) {
      gaps.push('中小企業向けソリューションの不在');
    }
    if (landscape.includes('高価') || landscape.includes('高い')) {
      gaps.push('手頃な価格のソリューションの不足');
    }
    if (opportunity.includes('特化')) {
      gaps.push('業界特化型ソリューションの不足');
    }

    return gaps;
  }

  private identifyOpportunitiesFromFacts(facts: string[]): MarketOpportunity[] {
    const opportunities: MarketOpportunity[] = [];

    // factsからの追加機会は制限する（重複カウントを避ける）
    const relevantFacts = facts.filter(fact => 
      (fact.includes('成長') || fact.includes('拡大')) && 
      !fact.includes('DX市場') // 既にdetailedAnalysisで処理済みのものは除外
    );

    relevantFacts.slice(0, 1).forEach(fact => { // 最大1つの追加機会のみ
      const marketSizeMatch = fact.match(/(\d+[\d,]*)\s*(億|兆)/);
      const marketSize = marketSizeMatch 
        ? this.parseMarketSize(marketSizeMatch[0])
        : 100000000000; // デフォルト1000億円

      opportunities.push({
        id: uuidv4(),
        description: fact,
        marketSize,
        growthRate: 15, // デフォルト成長率
        unmetNeeds: ['成長市場での先行者利益'],
        competitiveGaps: ['新規参入の機会']
      });
    });

    return opportunities;
  }

  private identifyPainsFromFacts(facts: string[]): CustomerPain[] {
    const pains: CustomerPain[] = [];

    facts.forEach(fact => {
      if (fact.includes('課題') || fact.includes('問題') || fact.includes('困難')) {
        pains.push({
          id: uuidv4(),
          description: fact,
          severity: 'medium',
          frequency: 'frequent',
          currentSolutions: ['既存の手動プロセス'],
          limitations: ['効率性の欠如', 'スケーラビリティの制限']
        });
      }
    });

    return pains;
  }

  private assessSeverity(challenge: string): 'low' | 'medium' | 'high' {
    const highSeverityKeywords = ['深刻', '重大', 'コスト', '人材', '不足'];
    const lowSeverityKeywords = ['軽微', '小さい', '一部'];

    if (highSeverityKeywords.some(keyword => challenge.includes(keyword))) {
      return 'high';
    }
    if (lowSeverityKeywords.some(keyword => challenge.includes(keyword))) {
      return 'low';
    }
    return 'medium';
  }

  private assessFrequency(challenge: string): 'rare' | 'occasional' | 'frequent' {
    const frequentKeywords = ['常に', '頻繁', '日常', '継続'];
    const rareKeywords = ['稀', 'まれ', '時々'];

    if (frequentKeywords.some(keyword => challenge.includes(keyword))) {
      return 'frequent';
    }
    if (rareKeywords.some(keyword => challenge.includes(keyword))) {
      return 'rare';
    }
    return 'occasional';
  }

  private identifyCurrentSolutions(data: EnhancedOutput, challenge: string): string[] {
    const solutions: string[] = [];

    // エンティティから既存ソリューションを特定
    const competitors = data.entities
      ?.filter(e => e.type === 'competitor')
      .map(e => e.name);

    if (competitors && competitors.length > 0) {
      solutions.push(...competitors.map(c => `${c}のソリューション`));
    }

    // 一般的なソリューションを追加
    if (challenge.includes('手動') || challenge.includes('人力')) {
      solutions.push('手動プロセス');
    }
    if (challenge.includes('Excel') || challenge.includes('スプレッドシート')) {
      solutions.push('Excelによる管理');
    }

    return solutions.length > 0 ? solutions : ['既存の代替ソリューション'];
  }

  private identifyLimitations(data: EnhancedOutput, challenge: string): string[] {
    const limitations: string[] = [];

    if (challenge.includes('高い') || challenge.includes('コスト')) {
      limitations.push('高いコスト');
    }
    if (challenge.includes('複雑')) {
      limitations.push('複雑な操作');
    }
    if (challenge.includes('時間')) {
      limitations.push('時間がかかる');
    }
    if (challenge.includes('エラー')) {
      limitations.push('エラーが発生しやすい');
    }

    return limitations.length > 0 ? limitations : ['効率性の欠如'];
  }

  private parseMarketSize(text: string): number {
    const numMatch = text.match(/(\d+[\d,]*)/);
    if (!numMatch) return 0;

    const num = parseFloat(numMatch[0].replace(/,/g, ''));
    
    if (text.includes('兆')) {
      return num * 1000000000000;
    }
    if (text.includes('億')) {
      return num * 100000000;
    }
    
    return num;
  }
}