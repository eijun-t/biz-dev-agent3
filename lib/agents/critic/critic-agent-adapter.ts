/**
 * Critic Agent Adapter
 * 
 * 既存のCriticAgentをBaseAgentインターフェースに適合させるアダプター
 */

import { BaseAgent, BaseAgentContext, AgentExecutionResult } from '@/lib/interfaces/base-agent';
import { CriticAgent as CoreCriticAgent } from './critic-agent';
import type { CriticInput, CriticOutput } from '@/lib/types/critic';
import type { ResearcherOutput } from '@/lib/types/agents';
import type { IdeatorOutput } from '@/lib/types/ideator';
import { createAgentLogger } from '@/lib/utils/logger';

/**
 * Criticエージェントの入力型（アダプター用）
 */
export interface CriticAgentInput {
  sessionId: string;
  ideas: any[]; // IdeatorOutputからのアイデア
  researchData?: ResearcherOutput; // 追加の研究データ
}

/**
 * BaseAgentインターフェースに適合するCriticAgentアダプター
 */
export class CriticAgentAdapter extends BaseAgent {
  private coreAgent: CoreCriticAgent;
  private logger = createAgentLogger('CriticAgentAdapter');

  constructor(context: BaseAgentContext) {
    super(context);
    
    // CoreCriticAgentを初期化
    this.coreAgent = new CoreCriticAgent({
      model: context.model || 'gpt-4o',
      temperature: context.temperature || 0.7,
      maxTokens: context.maxTokens || 4000,
    });
  }

  /**
   * エージェント名を返す
   */
  getAgentName(): string {
    return 'Critic';
  }

  /**
   * Criticエージェントを実行
   * IdeatorOutputを受け取り、評価・選定を行う
   */
  async execute(input: any): Promise<AgentExecutionResult> {
    try {
      console.log('CriticAgentAdapter input:', JSON.stringify(input, null, 2));
      
      // 入力の検証
      if (!input?.ideatorOutput?.ideas || !Array.isArray(input.ideatorOutput.ideas)) {
        this.logger.error('Invalid input structure', undefined, {
          hasIdeatorOutput: !!input?.ideatorOutput,
          hasIdeas: !!input?.ideatorOutput?.ideas,
          isArray: Array.isArray(input?.ideatorOutput?.ideas),
          actualInput: input
        });
        throw new Error('Invalid input: ideatorOutput.ideas is required and must be an array');
      }

      // CoreCriticAgent用の入力を準備
      const criticInput: CriticInput = {
        sessionId: input.sessionId || '',
        ideas: input.ideatorOutput.ideas.map((idea: any) => ({
          id: idea.id || `idea-${Date.now()}-${Math.random()}`,
          title: idea.title || '',
          description: idea.description || '',
          targetMarket: idea.targetMarket || '',
          businessModel: idea.businessModel || '',
          uniqueValue: idea.uniqueValue || '',
          implementation: idea.implementation || '',
          marketSize: idea.marketSize || '',
          competition: idea.competition || '',
          risks: idea.risks || [],
          opportunities: idea.opportunities || [],
        })),
        researchData: input.researcherOutput || {
          marketOverview: '',
          trends: [],
          competitors: [],
          opportunities: [],
          challenges: [],
          regionalInsights: {},
          searchMetadata: {
            totalSearches: 0,
            successfulSearches: 0,
            failedSearches: 0,
            searchQueries: []
          }
        },
      };

      // 評価を実行
      const result = await this.coreAgent.evaluate(criticInput);

      // 結果を返す
      return {
        success: true,
        data: result,
        metadata: {
          executionTime: Date.now(),
          tokensUsed: 0, // TODO: 実際のトークン使用量を追跡
          model: this.context.model || 'gpt-4o',
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      return {
        success: false,
        error: errorMessage,
        metadata: {
          executionTime: Date.now(),
          tokensUsed: 0,
          model: this.context.model || 'gpt-4o',
        },
      };
    }
  }

  /**
   * エージェントの設定を取得
   */
  getConfig(): Record<string, any> {
    return {
      name: this.getAgentName(),
      model: this.context.model || 'gpt-4o',
      temperature: this.context.temperature || 0.7,
      maxTokens: this.context.maxTokens || 4000,
      evaluationCriteria: {
        marketSize: 50,
        synergy: 50,
      },
    };
  }
}