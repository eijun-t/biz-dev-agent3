/**
 * Structured Output Generator
 * 構造化された出力を生成するサービス
 */

import { z } from 'zod';
import { PromptTemplate } from '@langchain/core/prompts';
import { v4 as uuidv4 } from 'uuid';
import type {
  BusinessIdea,
  IdeatorOutput,
  MarketOpportunity,
  CustomerPain,
  IdeationRequest,
  IdeationContext
} from '../../types/ideator';
import {
  businessIdeaSchema,
  ideatorOutputSchema
} from '../../validations/ideator';
import { LLMIntegrationService } from './llm-integration-service';
import { IdeatorError, IdeatorErrorCode } from './errors';
import { IDEATION_CONFIG } from './constants';

/**
 * 構造化出力生成のためのプロンプトテンプレート
 */
const STRUCTURED_OUTPUT_PROMPT = new PromptTemplate({
  template: `あなたは革新的なビジネスアイデアを生成する専門家です。
以下の市場調査結果と分析に基づいて、{ideaCount}個のビジネスアイデアを生成してください。

## 市場調査結果
{researchSummary}

## 市場機会
{marketOpportunities}

## 顧客課題
{customerPains}

## 市場トレンド
{marketTrends}

## 競合状況
{competitiveLandscape}

## 生成要件
- 各アイデアは具体的で実現可能なものにしてください
- ターゲット顧客と解決する課題を明確にしてください
- 収益モデルを明確に説明してください
- 推定営業利益は現実的な数値にしてください
- 実装難易度を適切に評価してください

## 出力フォーマット
以下のJSON形式で出力してください：
{{
  "ideas": [
    {{
      "id": "unique-id",
      "title": "30文字以内のタイトル",
      "description": "200文字程度の詳細な説明",
      "targetCustomers": ["顧客セグメント1", "顧客セグメント2"],
      "customerPains": ["解決する課題1", "解決する課題2"],
      "valueProposition": "提供価値の明確な説明",
      "revenueModel": "収益構造の詳細",
      "estimatedRevenue": 10000000,
      "implementationDifficulty": "low|medium|high",
      "marketOpportunity": "市場機会の説明"
    }}
  ],
  "summary": "生成されたアイデアの全体的な要約",
  "metadata": {{
    "totalIdeas": {ideaCount},
    "averageRevenue": 0,
    "marketSize": 0,
    "generationDate": "ISO 8601形式の日時"
  }}
}}

JSONのみを出力し、他の説明は含めないでください。`,
  inputVariables: [
    'ideaCount',
    'researchSummary',
    'marketOpportunities',
    'customerPains',
    'marketTrends',
    'competitiveLandscape'
  ]
});

/**
 * 構造化出力ジェネレーター
 */
export class StructuredOutputGenerator {
  private llmService: LLMIntegrationService;

  constructor(llmService: LLMIntegrationService) {
    this.llmService = llmService;
  }

  /**
   * ビジネスアイデアを生成
   */
  async generateBusinessIdeas(
    context: IdeationContext,
    request: IdeationRequest
  ): Promise<IdeatorOutput> {
    try {
      // プロンプトを構築
      const prompt = await this.buildPrompt(context, request);

      // LLMで生成
      const response = await this.llmService.invokeStructured(
        prompt,
        ideatorOutputSchema,
        {
          temperature: request.temperature ?? 0.8,
          maxTokens: request.maxTokens ?? 8000
        }
      );

      // 生成されたアイデアを検証
      const validatedOutput = await this.validateAndEnrichOutput(
        response,
        context
      );

      return validatedOutput;
    } catch (error) {
      throw IdeatorError.fromError(
        error,
        IdeatorErrorCode.OUTPUT_GENERATION_FAILED
      );
    }
  }

  /**
   * 単一のビジネスアイデアを生成
   */
  async generateSingleIdea(
    context: IdeationContext,
    focus?: string
  ): Promise<BusinessIdea> {
    const singleIdeaPrompt = new PromptTemplate({
      template: `以下の市場調査結果に基づいて、1つの革新的なビジネスアイデアを生成してください。
${focus ? `特に「${focus}」に焦点を当ててください。` : ''}

## 市場調査結果
{researchSummary}

## 市場機会
{marketOpportunities}

## 顧客課題
{customerPains}

以下のJSON形式で1つのアイデアのみを出力してください：
{{
  "id": "unique-id",
  "title": "30文字以内のタイトル",
  "description": "200文字程度の詳細な説明",
  "targetCustomers": ["顧客セグメント"],
  "customerPains": ["解決する課題"],
  "valueProposition": "提供価値",
  "revenueModel": "収益構造",
  "estimatedRevenue": 10000000,
  "implementationDifficulty": "low|medium|high",
  "marketOpportunity": "市場機会"
}}`,
      inputVariables: ['researchSummary', 'marketOpportunities', 'customerPains']
    });

    const prompt = await singleIdeaPrompt.format({
      researchSummary: context.researchSummary || '',
      marketOpportunities: JSON.stringify(context.opportunities.slice(0, 3)),
      customerPains: JSON.stringify(context.customerPains.slice(0, 3))
    });

    const idea = await this.llmService.invokeStructured(
      prompt,
      businessIdeaSchema,
      {
        temperature: 0.9,
        maxTokens: 2000
      }
    );

    return idea;
  }

  /**
   * アイデアを洗練・改善
   */
  async refineIdea(
    idea: BusinessIdea,
    feedback: string
  ): Promise<BusinessIdea> {
    const refinePrompt = new PromptTemplate({
      template: `以下のビジネスアイデアをフィードバックに基づいて改善してください。

## 現在のアイデア
{currentIdea}

## フィードバック
{feedback}

改善されたアイデアを同じJSON形式で出力してください。`,
      inputVariables: ['currentIdea', 'feedback']
    });

    const prompt = await refinePrompt.format({
      currentIdea: JSON.stringify(idea, null, 2),
      feedback: feedback
    });

    const refinedIdea = await this.llmService.invokeStructured(
      prompt,
      businessIdeaSchema,
      {
        temperature: 0.7,
        maxTokens: 2000
      }
    );

    return refinedIdea;
  }

  /**
   * プロンプトを構築
   */
  private async buildPrompt(
    context: IdeationContext,
    request: IdeationRequest
  ): Promise<string> {
    const ideaCount = request.numberOfIdeas || IDEATION_CONFIG.defaultNumberOfIdeas;

    const prompt = await STRUCTURED_OUTPUT_PROMPT.format({
      ideaCount: ideaCount.toString(),
      researchSummary: context.researchSummary || '市場調査結果なし',
      marketOpportunities: this.formatMarketOpportunities(context.opportunities),
      customerPains: this.formatCustomerPains(context.customerPains),
      marketTrends: context.trends?.join('\n') || 'トレンド情報なし',
      competitiveLandscape: context.competitiveLandscape || '競合情報なし'
    });

    return prompt;
  }

  /**
   * 市場機会をフォーマット
   */
  private formatMarketOpportunities(opportunities: MarketOpportunity[]): string {
    if (!opportunities || opportunities.length === 0) {
      return '市場機会情報なし';
    }

    return opportunities
      .slice(0, 5)
      .map((opp, index) => 
        `${index + 1}. ${opp.description}\n` +
        `   - 市場規模: ${this.formatCurrency(opp.marketSize)}\n` +
        `   - 成長率: ${opp.growthRate}%\n` +
        `   - 未充足ニーズ: ${opp.unmetNeeds.join(', ')}`
      )
      .join('\n\n');
  }

  /**
   * 顧客課題をフォーマット
   */
  private formatCustomerPains(pains: CustomerPain[]): string {
    if (!pains || pains.length === 0) {
      return '顧客課題情報なし';
    }

    return pains
      .slice(0, 5)
      .map((pain, index) =>
        `${index + 1}. ${pain.description}\n` +
        `   - 深刻度: ${pain.severity}\n` +
        `   - 頻度: ${pain.frequency}\n` +
        `   - 現在の解決策の限界: ${pain.limitations.join(', ')}`
      )
      .join('\n\n');
  }

  /**
   * 通貨をフォーマット
   */
  private formatCurrency(amount: number): string {
    if (amount >= 1000000000000) {
      return `${(amount / 1000000000000).toFixed(1)}兆円`;
    } else if (amount >= 100000000) {
      return `${(amount / 100000000).toFixed(1)}億円`;
    } else if (amount >= 10000) {
      return `${(amount / 10000).toFixed(0)}万円`;
    } else {
      return `${amount}円`;
    }
  }

  /**
   * 出力を検証して補強
   */
  private async validateAndEnrichOutput(
    output: IdeatorOutput,
    context: IdeationContext
  ): Promise<IdeatorOutput> {
    // 各アイデアにIDを確保（UUID形式）
    const enrichedIdeas = output.ideas.map((idea, index) => ({
      ...idea,
      id: idea.id || uuidv4(),
      marketOpportunity: idea.marketOpportunity || 
        context.opportunities[0]?.description || 
        '市場機会の詳細分析が必要'
    }));

    // メタデータを計算
    const totalRevenue = enrichedIdeas.reduce(
      (sum, idea) => sum + (idea.estimatedRevenue || 0),
      0
    );
    const averageRevenue = enrichedIdeas.length > 0 
      ? totalRevenue / enrichedIdeas.length 
      : 0;

    const marketSize = context.opportunities.reduce(
      (sum, opp) => sum + (opp.marketSize || 0),
      0
    );

    return {
      ideas: enrichedIdeas,
      summary: output.summary || this.generateSummary(enrichedIdeas),
      metadata: {
        ...output.metadata,
        totalIdeas: enrichedIdeas.length,
        averageRevenue,
        marketSize,
        generationDate: output.metadata?.generationDate || new Date().toISOString()
      }
    };
  }

  /**
   * サマリーを生成
   */
  private generateSummary(ideas: BusinessIdea[]): string {
    if (ideas.length === 0) {
      return 'ビジネスアイデアが生成されませんでした。';
    }

    const highValueIdeas = ideas.filter(
      idea => idea.estimatedRevenue > 100000000
    );
    const easyImplementIdeas = ideas.filter(
      idea => idea.implementationDifficulty === 'low'
    );

    return `${ideas.length}個のビジネスアイデアを生成しました。` +
      `${highValueIdeas.length > 0 ? ` うち${highValueIdeas.length}個は1億円以上の営業利益が見込まれます。` : ''}` +
      `${easyImplementIdeas.length > 0 ? ` ${easyImplementIdeas.length}個は実装難易度が低く、早期に実現可能です。` : ''}`;
  }

  /**
   * アイデアをランキング
   */
  rankIdeas(ideas: BusinessIdea[]): BusinessIdea[] {
    return [...ideas].sort((a, b) => {
      // スコアリング: 収益性 (40%) + 実現可能性 (30%) + 市場適合性 (30%)
      const scoreA = this.calculateIdeaScore(a);
      const scoreB = this.calculateIdeaScore(b);
      return scoreB - scoreA;
    });
  }

  /**
   * アイデアのスコアを計算
   */
  private calculateIdeaScore(idea: BusinessIdea): number {
    let score = 0;

    // 収益性スコア (40%)
    const revenueScore = Math.min(idea.estimatedRevenue / 1000000000, 1) * 40;
    score += revenueScore;

    // 実現可能性スコア (30%)
    const feasibilityScore = 
      idea.implementationDifficulty === 'low' ? 30 :
      idea.implementationDifficulty === 'medium' ? 20 : 10;
    score += feasibilityScore;

    // 市場適合性スコア (30%)
    const marketFitScore = 
      (idea.targetCustomers.length * 5) + 
      (idea.customerPains.length * 5);
    score += Math.min(marketFitScore, 30);

    return score;
  }
}