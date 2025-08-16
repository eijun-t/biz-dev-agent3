/**
 * Ideator Agent Adapter
 * 
 * 既存のIdeatorAgentをBaseAgentインターフェースに適合させるアダプター
 */

import { BaseAgent, BaseAgentContext, AgentExecutionResult } from '@/lib/interfaces/base-agent';
import { IdeatorAgent as CoreIdeatorAgent } from './ideator-agent';
import type { IdeatorOutput } from '@/lib/types/ideator';
import type { ResearcherOutput } from '@/lib/types/agents';
import { ChatOpenAI } from '@langchain/openai';

/**
 * Ideatorエージェントの入力型
 */
export interface IdeatorInput {
  researchOutput: ResearcherOutput;
  config?: {
    model?: string;
    temperature?: number;
  };
}

/**
 * BaseAgentインターフェースに適合するIdeatorAgentアダプター
 */
export class IdeatorAgentAdapter extends BaseAgent {
  private coreAgent: CoreIdeatorAgent;

  constructor(context: BaseAgentContext) {
    super(context);
    
    // CoreIdeatorAgentを初期化
    const llm = new ChatOpenAI({
      modelName: context.model || 'gpt-4o',
      temperature: context.temperature || 0.7,
      maxTokens: context.maxTokens || 4000,
    });

    this.coreAgent = new CoreIdeatorAgent({
      llm,
      config: {
        llmConfig: {
          model: context.model || 'gpt-4o',
          temperature: context.temperature || 0.7,
          maxTokens: context.maxTokens || 4000,
        },
      },
      enableValidation: true,
      enableLogging: true,
    });
  }

  /**
   * エージェント名を返す
   */
  getAgentName(): 'ideator' {
    return 'ideator';
  }

  /**
   * Ideatorエージェントの実行
   */
  async execute(input: IdeatorInput): Promise<AgentExecutionResult> {
    const startTime = Date.now();

    try {
      const messages = [
        this.createMessage('Ideator agent execution started', { input: { sessionId: this.context.sessionId } }),
      ];

      // ResearcherOutputから実際のresearchデータを取得
      const researchData = input.researchOutput.research || input.researchOutput;
      
      // 研究データからアイディエーション用の入力を準備
      const ideationRequest = {
        numberOfIdeas: 5,
        temperature: input.config?.temperature || 0.7,
        targetMarket: researchData.targetMarkets?.[0] || 'General',
      };

      messages.push(this.createMessage('Research data processed for ideation', {
        theme: researchData.theme || 'General',
        researchDataAvailable: !!researchData,
      }));

      // コアエージェントでアイディエーション実行
      console.log('[IdeatorAgent] 🤖 Calling OpenAI GPT-4 to generate business ideas...');
      // generateIdeasメソッドは第1引数にresearchOutput、第2引数にrequestを受け取る
      const result = await this.coreAgent.generateIdeas(researchData, ideationRequest);
      console.log('[IdeatorAgent] ✅ GPT-4 returned', result.ideas?.length || 0, 'ideas');

      // 結果の検証
      if (!result || !result.ideas || !Array.isArray(result.ideas)) {
        console.error('Invalid result from generateIdeas:', result);
        throw new Error('Failed to generate ideas: Invalid result structure');
      }

      messages.push(this.createMessage('Business ideas generated', {
        count: result.ideas.length,
        avgScore: result.ideas.length > 0 ? result.ideas.reduce((sum, idea) => sum + (idea.score || 0), 0) / result.ideas.length : 0,
      }));

      // 結果の変換
      const ideatorOutput: IdeatorOutput = {
        sessionId: this.context.sessionId,
        ideas: result.ideas,
        metadata: {
          generatedAt: new Date(),
          version: result.metadata?.version || '1.0.0',
          processingTimeMs: Date.now() - startTime,
          tokensUsed: result.metadata?.tokensUsed || 0,
          model: this.context.model || 'gpt-4o',
          requestId: result.requestId || crypto.randomUUID(),
        },
        metrics: {
          totalIdeas: result.ideas.length,
          avgFeasibilityScore: result.ideas.length > 0 ? result.ideas.reduce((sum, idea) => sum + (idea.feasibilityScore || 0), 0) / result.ideas.length : 0,
          avgMarketScore: result.ideas.length > 0 ? result.ideas.reduce((sum, idea) => sum + (idea.marketScore || 0), 0) / result.ideas.length : 0,
          avgInnovationScore: result.ideas.length > 0 ? result.ideas.reduce((sum, idea) => sum + (idea.innovationScore || 0), 0) / result.ideas.length : 0,
        },
      };

      messages.push(this.createMessage('Ideator agent execution completed successfully', {
        processingTimeMs: ideatorOutput.metadata.processingTimeMs,
        totalIdeas: ideatorOutput.metrics.totalIdeas,
      }));

      return {
        success: true,
        data: ideatorOutput,
        messages,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        success: false,
        error: `Ideator agent failed: ${errorMessage}`,
        messages: [
          this.createMessage('Ideator agent execution failed', { error: errorMessage }),
        ],
      };
    }
  }

  /**
   * エージェントの設定を取得
   */
  getConfig() {
    return {
      name: 'ideator',
      version: '1.0.0',
      description: 'Business idea generation agent',
      capabilities: [
        'Creative idea generation',
        'Market-based ideation',
        'Feasibility scoring',
        'Innovation assessment',
      ],
      isStub: false,
    };
  }
}