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
      await this.logExecution('start', { 
        ideaCount: validatedInput.ideas.length,
        sessionId: validatedInput.sessionId,
      });

      // 評価パイプライン実行
      const output = await this.pipeline.evaluate(validatedInput);
      
      // 出力検証
      const validatedOutput = await this.validateOutput(output);
      
      // 成功ログ
      await this.logExecution('success', {
        selectedIdea: validatedOutput.selectedIdea.ideaTitle,
        totalScore: validatedOutput.selectedIdea.totalScore,
        processingTime: validatedOutput.metadata.processingTime,
      });

      return validatedOutput;
    } catch (error) {
      // エラー変換
      const criticError = toCriticError(error);
      
      // エラーログ
      await this.logExecution('error', {
        error: criticError.message,
        code: criticError.code,
        isRetryable: criticError.isRetryable,
      });

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

  /**
   * テスト用のモック評価
   */
  async mockEvaluate(input: CriticInput): Promise<CriticOutput> {
    // テスト用のモック実装
    const mockResults = input.ideas.map((idea, index) => ({
      ideaId: idea.id,
      ideaTitle: idea.title,
      marketScore: {
        total: 35 + index * 5,
        breakdown: {
          marketSize: 15,
          growthPotential: 10 + index * 2,
          profitability: 10 + index * 3,
        },
        reasoning: 'モック評価',
        evidence: ['テストエビデンス'],
      },
      synergyScore: {
        total: 40 - index * 3,
        breakdown: {
          capabilityMatch: 15,
          synergyEffect: 13 - index,
          uniqueAdvantage: 12 - index * 2,
        },
        capabilityMapping: {
          requiredCapabilities: [],
          mitsubishiCapabilities: [],
          matchScore: 80,
          gaps: [],
        },
        synergyScenario: {
          scenario: 'テストシナリオ',
          keyAdvantages: ['テスト優位性'],
          synergyMultiplier: 1.2,
        },
        scenarioValidation: {
          logicalConsistency: 85,
          feasibility: 80,
          uniqueness: 75,
          overallCredibility: 80,
          validationComments: ['テストコメント'],
        },
        reasoning: 'モックシナジー評価',
      },
      totalScore: 75 + index * 2,
      rank: index + 1,
      recommendation: 'テスト推奨',
      risks: ['テストリスク'],
      opportunities: ['テスト機会'],
    }));

    const selectedIdea = mockResults[0];

    return {
      sessionId: input.sessionId,
      evaluationResults: mockResults,
      selectedIdea,
      summary: 'モック評価完了',
      metadata: {
        evaluationId: 'mock-eval-id',
        startTime: new Date(),
        endTime: new Date(),
        processingTime: 1000,
        tokensUsed: 500,
        llmCalls: 3,
        cacheHits: 0,
        errors: [],
      },
    };
  }
}

/**
 * Factory function to create Critic Agent
 */
export function createCriticAgent(config?: CriticConfig): CriticAgent {
  return new CriticAgent(config);
}