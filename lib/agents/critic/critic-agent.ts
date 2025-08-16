/**
 * Critic Agent
 * ビジネスアイデアの評価・選定エージェント
 */

import { BaseAgent } from '@/lib/interfaces/base-agent';
import {
  CriticInput,
  CriticOutput,
  CriticConfig,
  CriticError,
  CriticErrorCode,
} from '@/lib/types/critic';
import { ChatOpenAI } from '@langchain/openai';
import { criticInputSchema, criticOutputSchema } from '@/lib/validations/critic';
import { EvaluationPipeline } from './services/evaluation-pipeline';
import { toCriticError, formatErrorMessage } from './errors';

/**
 * Critic Agent Implementation
 */
export class CriticAgent extends BaseAgent<CriticInput, CriticOutput> {
  private pipeline: EvaluationPipeline;
  private config: CriticConfig;

  constructor(config?: CriticConfig) {
    super();
    this.config = config || {};
    this.pipeline = new EvaluationPipeline(this.config);
  }

  /**
   * エージェント名を返す
   */
  getAgentName(): string {
    return 'critic';
  }

  /**
   * エージェントの説明を返す
   */
  getDescription(): string {
    return 'ビジネスアイデアを市場規模とシナジーの観点から評価し、最適なアイデアを選定します';
  }

  /**
   * 評価を実行
   */
  async execute(input: CriticInput): Promise<CriticOutput> {
    try {
      // 入力検証
      const validatedInput = await this.validateInput(input);
      
      // ログ記録
      // await this.logExecution('start', { 
      //   ideaCount: validatedInput.ideas.length,
      //   sessionId: validatedInput.sessionId,
      // });

      // 評価パイプライン実行
      const output = await this.pipeline.evaluate(validatedInput);
      
      // 出力検証
      const validatedOutput = await this.validateOutput(output);
      
      // 成功ログ
      // await this.logExecution('success', {
      //   selectedIdea: validatedOutput.selectedIdea.ideaTitle,
      //   totalScore: validatedOutput.selectedIdea.totalScore,
      //   processingTime: validatedOutput.metadata.processingTime,
      // });

      return validatedOutput;
    } catch (error) {
      // エラー変換
      const criticError = toCriticError(error);
      
      // エラーログ
      // await this.logExecution('error', {
      //   error: criticError.message,
      //   code: criticError.code,
      //   isRetryable: criticError.isRetryable,
      // });

      // ユーザーフレンドリーなメッセージでエラーを投げる
      throw new Error(formatErrorMessage(criticError));
    }
  }

  /**
   * 入力の検証
   */
  protected async validateInput(input: CriticInput): Promise<CriticInput> {
    try {
      return criticInputSchema.parse(input);
    } catch (error) {
      throw new CriticError(
        CriticErrorCode.INVALID_INPUT,
        '入力データの検証に失敗しました',
        error,
        false
      );
    }
  }

  /**
   * 出力の検証
   */
  protected async validateOutput(output: CriticOutput): Promise<CriticOutput> {
    try {
      return criticOutputSchema.parse(output);
    } catch (error) {
      throw new CriticError(
        CriticErrorCode.EVALUATION_FAILED,
        '出力データの検証に失敗しました',
        error,
        false
      );
    }
  }

  /**
   * アイデアを評価
   */
  async evaluate(input: CriticInput): Promise<CriticOutput> {
    const llm = new ChatOpenAI({
      modelName: this.config.model,
      temperature: 0.3,
      maxTokens: this.config.maxTokens,
      apiKey: process.env.OPENAI_API_KEY,
    });

    const evaluationPrompt = `あなたは三菱地所の新事業評価の専門家です。
以下のビジネスアイデアを厳密に評価してください。

# 評価基準（100点満点）
1. 市場規模とポテンシャル (35点)
2. 三菱地所とのシナジー (40点)
3. 実現可能性 (15点)
4. 独自性・競争優位性 (10点)

# アイデア一覧
${input.ideas.map((idea, i) => `
## アイデア${i + 1}: ${idea.title}
説明: ${idea.description}
対象市場: ${idea.targetMarket}
ビジネスモデル: ${idea.businessModel}
独自価値: ${idea.uniqueValue}
`).join('\n')}

JSON形式で回答:
{
  "evaluations": [
    {
      "ideaIndex": 0,
      "ideaId": "ID",
      "title": "タイトル",
      "marketScore": {
        "total": 30,
        "breakdown": {
          "marketSize": 12,
          "growthPotential": 9,
          "profitability": 9
        },
        "reasoning": "理由"
      },
      "synergyScore": {
        "total": 35,
        "breakdown": {
          "capabilityMatch": 18,
          "synergyEffect": 9,
          "uniqueAdvantage": 8
        },
        "reasoning": "理由"
      },
      "feasibilityScore": 12,
      "uniquenessScore": 8,
      "totalScore": 85,
      "recommendation": "推奨事項",
      "risks": ["リスク1"],
      "opportunities": ["機会1"]
    }
  ],
  "selectedIndex": 0,
  "summary": "サマリー"
}`;

    console.log('[CriticAgent] 🤖 Calling OpenAI GPT-4 to evaluate ideas...');
    const response = await llm.invoke(evaluationPrompt);
    console.log('[CriticAgent] ✅ GPT-4 evaluation completed');
    const content = response.content.toString();
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse evaluation response');
    }
    
    const evaluation = JSON.parse(jsonMatch[0]);
    const evaluationResults = evaluation.evaluations.map((item: any) => ({
      ideaId: item.ideaId || input.ideas[item.ideaIndex]?.id,
      ideaTitle: item.title,
      marketScore: item.marketScore,
      synergyScore: {
        ...item.synergyScore,
        capabilityMapping: {
          requiredCapabilities: [],
          mitsubishiCapabilities: [],
          matchScore: item.synergyScore.total * 2.5,
          gaps: [],
        },
        synergyScenario: {
          scenario: item.synergyScore.reasoning,
          keyAdvantages: item.opportunities || [],
          synergyMultiplier: 1.0 + (item.synergyScore.total / 100),
        },
        scenarioValidation: {
          logicalConsistency: 80,
          feasibility: item.feasibilityScore * 6.67,
          uniqueness: item.uniquenessScore * 10,
          overallCredibility: item.totalScore,
          validationComments: [item.recommendation],
        },
      },
      totalScore: item.totalScore,
      rank: 0,
      recommendation: item.recommendation,
      risks: item.risks || [],
      opportunities: item.opportunities || [],
    }));

    evaluationResults.sort((a, b) => b.totalScore - a.totalScore);
    evaluationResults.forEach((result, index) => {
      result.rank = index + 1;
    });

    const selectedIdea = evaluationResults[0];
    const selectedIdeas = evaluationResults.slice(0, 3);

    return {
      sessionId: input.sessionId,
      evaluationResults,
      selectedIdea,
      selectedIdeas,
      summary: evaluation.summary,
      metadata: {
        evaluationId: `eval-${Date.now()}`,
        startTime: new Date(),
        endTime: new Date(),
        processingTime: Date.now(),
        tokensUsed: 0,
        llmCalls: 1,
        cacheHits: 0,
        errors: [],
      },
    };
  }

  /**
   * 評価設定を更新
   */
  updateConfig(config: Partial<CriticConfig>): void {
    this.config = { ...this.config, ...config };
    this.pipeline = new EvaluationPipeline(this.config);
  }

  /**
   * 現在の設定を取得
   */
  getConfig(): CriticConfig {
    return { ...this.config };
  }

  /**
   * エージェントの状態を取得
   */
  async getStatus(): Promise<{
    ready: boolean;
    config: CriticConfig;
    capabilities: string[];
  }> {
    return {
      ready: true,
      config: this.getConfig(),
      capabilities: [
        '市場規模評価（0-50点）',
        '三菱地所シナジー評価（0-50点）',
        '3段階シナジー検証（ケイパビリティ→シナリオ→検証）',
        '並列評価処理',
        '最優秀アイデア自動選定',
      ],
    };
  }

}

/**
 * Factory function to create Critic Agent
 */
export function createCriticAgent(config?: CriticConfig): CriticAgent {
  return new CriticAgent(config);
}