/**
 * Agent Graph
 * 
 * LangGraphを使用したエージェントワークフローの管理
 */

import { StateGraph, START, END, Annotation } from '@langchain/langgraph';
import { RunnableConfig } from '@langchain/core/runnables';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { BaseLanguageModel } from '@langchain/core/language_models/base';
import type { 
  GraphState, 
  ProgressEvent, 
  OrchestrationError
} from '@/lib/types/orchestration';
import { 
  OrchestrationErrorType,
  RecoveryAction 
} from '@/lib/types/orchestration';
import type { AgentExecutionResult } from '@/lib/interfaces/base-agent';
import { StateManager } from './state-manager';
import { CheckpointerAdapter } from './checkpointer-adapter';
import { ProductionResearcherAgent } from '../broad-researcher/production-researcher-agent';
import { IdeatorAgentAdapter } from '../ideator/ideator-agent-adapter';
import { CriticAgentAdapter } from '../critic/critic-agent-adapter';
import { AnalystAgent } from '../analyst/analyst-agent';
import { WriterAgent } from '../writer/writer-agent';
import { SerperSearchService } from '@/lib/services/serper/serper-search-service';

/**
 * エージェントグラフの設定オプション
 */
export interface AgentGraphOptions {
  supabase: SupabaseClient;
  llm: BaseLanguageModel;
  searchService: SerperSearchService;
  enableCheckpoints?: boolean;
  maxRetries?: number;
  timeout?: number;
  onProgress?: (event: ProgressEvent) => void;
  onError?: (error: OrchestrationError) => void;
}

/**
 * エージェント実行結果の型
 */
interface AgentExecutionResponse {
  state: GraphState;
  result?: AgentExecutionResult;
  error?: OrchestrationError;
}

/**
 * Agent Graph Class
 * LangGraphを使用してエージェント間のワークフローを管理する
 */
export class AgentGraph {
  private graph!: StateGraph<any, Partial<GraphState>>;
  private stateManager!: StateManager;
  private checkpointer: CheckpointerAdapter;
  private options: Required<AgentGraphOptions>;
  private retryDelay: number = 1000; // milliseconds
  private agents!: {
    researcher: ProductionResearcherAgent;
    ideator: IdeatorAgentAdapter;
    critic: CriticAgentAdapter;
    analyst: AnalystAgent;
    writer: WriterAgent;
  };

  constructor(options: AgentGraphOptions) {
    this.options = {
      enableCheckpoints: true,
      maxRetries: 3,
      timeout: 300000, // 5分
      onProgress: () => {},
      onError: () => {},
      ...options,
    };

    this.checkpointer = new CheckpointerAdapter(this.options.supabase);
    this.stateManager = new StateManager();
    
    // エージェントの初期化
    this.initializeAgents();
    
    // グラフの構築
    this.buildGraph();
  }

  /**
   * エージェントの初期化
   */
  private initializeAgents(): void {
    const baseContext = {
      sessionId: '',
      userId: '',
      model: 'gpt-4o',
      temperature: 0.7,
      maxTokens: 4000,
    };

    this.agents = {
      researcher: new ProductionResearcherAgent(
        baseContext,
        this.options.searchService,
        this.options.llm,
        this.options.supabase
      ),
      ideator: new IdeatorAgentAdapter(baseContext),
      critic: new CriticAgentAdapter(baseContext),
      analyst: new AnalystAgent(baseContext),
      writer: new WriterAgent({
        ...baseContext,
        timeout: this.options.timeout,
      }),
    };
  }

  /**
   * グラフの構築
   */
  private buildGraph(): void {
    // Define state using Annotation for LangGraph
    const GraphAnnotation = Annotation.Root({
      sessionId: Annotation<string>({
        reducer: (_, updateValue) => updateValue,
        default: () => '',
      }),
      userId: Annotation<string>({
        reducer: (_, updateValue) => updateValue,
        default: () => '',
      }),
      theme: Annotation<string>({
        reducer: (_, updateValue) => updateValue,
        default: () => '',
      }),
      currentPhase: Annotation<string>({
        reducer: (_, updateValue) => updateValue,
        default: () => 'initializing',
      }),
      currentAgent: Annotation<string | null>({
        reducer: (_, updateValue) => updateValue,
        default: () => null,
      }),
      progress: Annotation<number>({
        reducer: (_, updateValue) => updateValue,
        default: () => 0,
      }),
      researcherOutput: Annotation<any>({
        reducer: (_, updateValue) => updateValue,
        default: () => null,
      }),
      ideatorOutput: Annotation<any>({
        reducer: (_, updateValue) => updateValue,
        default: () => null,
      }),
      criticOutput: Annotation<any>({
        reducer: (_, updateValue) => updateValue,
        default: () => null,
      }),
      analystOutput: Annotation<any>({
        reducer: (_, updateValue) => updateValue,
        default: () => null,
      }),
      writerOutput: Annotation<any>({
        reducer: (_, updateValue) => updateValue,
        default: () => null,
      }),
    });

    // StateGraphの作成
    this.graph = new StateGraph(GraphAnnotation) as any;
    
    // Note: We'll use our own execution logic instead of adding nodes/edges
    // This is because we need fine-grained control over agent execution
  }

  /**
   * Researcherエージェントの実行
   */
  private async executeResearcher(state: GraphState): Promise<Partial<GraphState>> {
    return this.executeAgentWithRetry('researcher', state, async (agentState) => {
      console.log('=== EXECUTING RESEARCHER (本番) ===');
      console.log('Theme:', agentState.theme);
      
      this.updateContext(agentState.sessionId, agentState.userId);
      this.stateManager.mergeState(agentState);
      
      const input = this.stateManager.prepareNextAgentInput('researcher');
      console.log('Researcher input:', input);
      const result = await this.agents.researcher.execute(input);
      
      if (!result.success) {
        throw new Error(result.error || 'Researcher execution failed');
      }
      
      return {
        currentPhase: 'researching' as const,
        currentAgent: 'researcher' as const,
        researcherOutput: result.data,
        progress: 20,
        lastUpdateTime: new Date(),
      };
    });
  }

  /**
   * Ideatorエージェントの実行
   */
  private async executeIdeator(state: GraphState): Promise<Partial<GraphState>> {
    return this.executeAgentWithRetry('ideator', state, async (agentState) => {
      this.updateContext(agentState.sessionId, agentState.userId);
      this.stateManager.mergeState(agentState);
      
      const input = {
        researchOutput: agentState.researcherOutput!,
        config: {
          model: 'gpt-4o',
          temperature: 0.7,
        },
      };
      
      const result = await this.agents.ideator.execute(input);
      
      if (!result.success) {
        throw new Error(result.error || 'Ideator execution failed');
      }
      
      return {
        currentPhase: 'ideating' as const,
        currentAgent: 'ideator' as const,
        ideatorOutput: result.data,
        progress: 40,
        lastUpdateTime: new Date(),
      };
    });
  }

  /**
   * Criticエージェントの実行
   */
  private async executeCritic(state: GraphState): Promise<Partial<GraphState>> {
    return this.executeAgentWithRetry('critic', state, async (agentState) => {
      this.updateContext(agentState.sessionId, agentState.userId);
      this.stateManager.mergeState(agentState);
      
      const input = {
        sessionId: agentState.sessionId,
        ideas: agentState.ideatorOutput?.ideas || [],
        researchData: agentState.researcherOutput,
      };
      
      const result = await this.agents.critic.execute(input);
      
      if (!result.success) {
        throw new Error(result.error || 'Critic execution failed');
      }
      
      return {
        currentPhase: 'critiquing' as const,
        currentAgent: 'critic' as const,
        criticOutput: result.data,
        progress: 60,
        lastUpdateTime: new Date(),
      };
    });
  }

  /**
   * Analystエージェントの実行
   */
  private async executeAnalyst(state: GraphState): Promise<Partial<GraphState>> {
    return this.executeAgentWithRetry('analyst', state, async (agentState) => {
      this.updateContext(agentState.sessionId, agentState.userId);
      this.stateManager.mergeState(agentState);
      
      const input = {
        sessionId: agentState.sessionId,
        selectedIdea: agentState.criticOutput?.selectedIdea,
        researchData: agentState.researcherOutput,
      };
      
      const result = await this.agents.analyst.execute(input);
      
      if (!result.success) {
        throw new Error(result.error || 'Analyst execution failed');
      }
      
      return {
        currentPhase: 'analyzing' as const,
        currentAgent: 'analyst' as const,
        analystOutput: result.data,
        progress: 80,
        lastUpdateTime: new Date(),
      };
    });
  }

  /**
   * Writerエージェントの実行
   */
  private async executeWriter(state: GraphState): Promise<Partial<GraphState>> {
    return this.executeAgentWithRetry('writer', state, async (agentState) => {
      this.updateContext(agentState.sessionId, agentState.userId);
      this.stateManager.mergeState(agentState);
      
      const input = this.stateManager.prepareNextAgentInput('writer');
      const result = await this.agents.writer.execute(input);
      
      if (!result.success) {
        throw new Error(result.error || 'Writer execution failed');
      }
      
      return {
        currentPhase: 'completed' as const,
        currentAgent: 'writer' as const,
        writerOutput: result.data,
        progress: 100,
        lastUpdateTime: new Date(),
      };
    });
  }

  /**
   * リトライ機構付きエージェント実行
   */
  private async executeAgentWithRetry<T>(
    agentName: string,
    state: GraphState,
    executor: (state: GraphState) => Promise<T>
  ): Promise<T> {
    let lastError: Error | undefined;
    
    for (let attempt = 1; attempt <= this.options.maxRetries; attempt++) {
      try {
        // 進捗通知
        this.options.onProgress({
          type: 'agent_start',
          sessionId: state.sessionId,
          timestamp: new Date(),
          data: {
            agent: agentName as GraphState['currentAgent'],
            message: `Starting ${agentName} agent (attempt ${attempt}/${this.options.maxRetries})`
          }
        });

        const result = await Promise.race([
          executor(state),
          this.createTimeoutPromise()
        ]);

        // 成功時の進捗通知
        this.options.onProgress({
          type: 'agent_complete',
          sessionId: state.sessionId,
          timestamp: new Date(),
          data: {
            agent: agentName as GraphState['currentAgent'],
            message: `Completed ${agentName} agent successfully`
          }
        });

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(`${agentName} execution failed`);
        
        // リトライ可能なエラーかチェック
        const orchestrationError = this.createOrchestrationError(agentName, lastError);
        
        if (attempt === this.options.maxRetries || !orchestrationError.retryable) {
          this.options.onError(orchestrationError);
          throw lastError;
        }

        // リトライ前の待機
        await this.delay(this.retryDelay * attempt);
      }
    }

    throw lastError || new Error(`${agentName} execution failed after ${this.options.maxRetries} attempts`);
  }

  /**
   * エージェントコンテキストの更新
   */
  private updateContext(sessionId: string, userId: string): void {
    // 各エージェントのコンテキストを更新
    Object.values(this.agents).forEach(agent => {
      if (agent && typeof agent.updateContext === 'function') {
        agent.updateContext({ sessionId, userId });
      }
    });
  }

  /**
   * タイムアウトPromiseの作成
   */
  private createTimeoutPromise(): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Agent execution timeout after ${this.options.timeout}ms`));
      }, this.options.timeout);
    });
  }

  /**
   * 遅延処理
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * オーケストレーションエラーの作成
   */
  private createOrchestrationError(agent: string, error: Error): OrchestrationError {
    // エラーの種類を判定
    let errorType = OrchestrationErrorType.AGENT_FAILURE;
    let retryable = true;

    if (error.message.includes('timeout')) {
      errorType = OrchestrationErrorType.TIMEOUT;
    } else if (error.message.includes('validation')) {
      errorType = OrchestrationErrorType.VALIDATION_ERROR;
      retryable = false;
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      errorType = OrchestrationErrorType.NETWORK_ERROR;
    } else if (error.message.includes('rate limit')) {
      errorType = OrchestrationErrorType.RATE_LIMIT;
    }

    return {
      type: errorType,
      message: error.message,
      agent,
      details: { stack: error.stack },
      retryable,
      recoveryActions: retryable ? [RecoveryAction.RETRY] : [RecoveryAction.ABORT],
      timestamp: new Date()
    };
  }

  /**
   * ワークフロー全体の実行（簡易版）
   */
  async execute(initialState: any, sessionId: string): Promise<any> {
    console.log(`AgentGraph.execute called with sessionId: ${sessionId}`);
    const startTime = Date.now();
    
    try {
      // プログレスイベントを発火
      if (this.options.onProgress) {
        await this.options.onProgress({
          type: 'phase_transition',
          sessionId,
          timestamp: new Date(),
          data: {
            phase: 'リサーチャーエージェント実行中',
            progress: 20
          }
        });
      }

      // 簡易版の実行 - 各エージェントをシミュレート
      await this.delay(2000);
      
      if (this.options.onProgress) {
        await this.options.onProgress({
          type: 'phase_transition',
          sessionId,
          timestamp: new Date(),
          data: {
            phase: 'アイディエーターエージェント実行中',
            progress: 40
          }
        });
      }

      await this.delay(2000);
      
      if (this.options.onProgress) {
        await this.options.onProgress({
          type: 'phase_transition',
          sessionId,
          timestamp: new Date(),
          data: {
            phase: 'クリティックエージェント実行中',
            progress: 60
          }
        });
      }

      await this.delay(2000);
      
      if (this.options.onProgress) {
        await this.options.onProgress({
          type: 'phase_transition',
          sessionId,
          timestamp: new Date(),
          data: {
            phase: 'アナリストエージェント実行中',
            progress: 80
          }
        });
      }

      await this.delay(2000);
      
      if (this.options.onProgress) {
        await this.options.onProgress({
          type: 'phase_transition',
          sessionId,
          timestamp: new Date(),
          data: {
            phase: 'ライターエージェント実行中',
            progress: 95
          }
        });
      }

      await this.delay(2000);

      // 最終状態を返す
      const finalState = {
        ...initialState,
        selected_ideas: [
          {
            title: `AI搭載${initialState.theme}プラットフォーム`,
            description: 'AIを活用した革新的なソリューション',
            score: 95
          },
          {
            title: `${initialState.theme}マーケットプレイス`,
            description: 'B2Bマッチングプラットフォーム',
            score: 92
          },
          {
            title: `${initialState.theme}自動化システム`,
            description: '業務プロセスの完全自動化',
            score: 90
          }
        ],
        market_analysis: {
          market_size: '500億円',
          growth_rate: '年15%',
          key_players: ['Company A', 'Company B', 'Company C']
        },
        reports: [
          `# ${initialState.theme} ビジネスアイデアレポート\n\n## エグゼクティブサマリー\n\n本レポートでは、${initialState.theme}に関する5個のビジネスアイデアを分析し、最も有望な3つを選定しました。\n\n## 選定されたアイデア\n\n### 1. AI搭載${initialState.theme}プラットフォーム\n- スコア: 95/100\n- 市場規模: 200億円\n- 実現可能性: 高\n\n### 2. ${initialState.theme}マーケットプレイス\n- スコア: 92/100\n- 市場規模: 150億円\n- 実現可能性: 中\n\n### 3. ${initialState.theme}自動化システム\n- スコア: 90/100\n- 市場規模: 100億円\n- 実現可能性: 高\n\n## 市場分析\n\n現在の市場規模は500億円で、年15%の成長率を示しています。主要プレイヤーとしてCompany A、Company B、Company Cが存在しますが、新規参入の余地は十分にあります。\n\n## 推奨事項\n\n1. AI搭載プラットフォームの開発を最優先に進める\n2. MVP開発期間: 3ヶ月\n3. 初期投資額: 5000万円\n4. ROI予測: 2年で200%\n\n## 結論\n\n${initialState.theme}市場は高い成長ポテンシャルを持ち、特にAI技術を活用したソリューションが有望です。`
        ],
        progress: 100,
        currentPhase: 'completed',
        executionTime: Date.now() - startTime
      };

      console.log(`AgentGraph execution completed in ${finalState.executionTime}ms`);
      return finalState;

    } catch (error) {
      console.error('AgentGraph execution error:', error);
      if (this.options.onError) {
        await this.options.onError({
          type: OrchestrationErrorType.AGENT_FAILURE,
          message: error instanceof Error ? error.message : 'Unknown error',
          agent: 'orchestrator',
          retryable: false,
          recoveryActions: [RecoveryAction.ABORT],
          timestamp: new Date()
        });
      }
      throw error;
    }
  }

  /**
   * ワークフロー全体の実行（フル版 - 後で実装）
   */
  async executeFull(input: {
    sessionId: string;
    userId: string;
    theme: string;
    options?: any;
    onProgress?: (progress: number, message: string) => Promise<void>;
    onPhaseChange?: (phase: string, agent: string) => Promise<void>;
    onAgentStart?: (agent: string) => Promise<void>;
    onAgentComplete?: (agent: string, output: any) => Promise<void>;
    onError?: (error: Error) => Promise<void>;
  }): Promise<AgentExecutionResult> {
    console.log('=== EXECUTEFULL CALLED (本番版) ===');
    console.log('Theme:', input.theme);
    console.log('SessionId:', input.sessionId);
    const startTime = Date.now();
    
    try {
      // StateManagerの初期化
      this.stateManager = new StateManager({
        sessionId: input.sessionId,
        userId: input.userId,
        theme: input.theme,
        currentPhase: 'initializing',
        currentAgent: null,
        progress: 0,
        startTime: new Date(),
        lastUpdateTime: new Date()
      });

      // 実行設定
      const config: RunnableConfig = {
        configurable: {
          sessionId: input.sessionId,
          userId: input.userId
        },
        metadata: {
          theme: input.theme,
          startTime: new Date().toISOString()
        }
      };

      // グラフの実行 - sequential execution of agents
      let currentState = this.stateManager.getState();
      
      // Execute agents in sequence: researcher → ideator → critic → analyst → writer
      if (input.onAgentStart) await input.onAgentStart('researcher');
      if (input.onPhaseChange) await input.onPhaseChange('researching', 'researcher');
      currentState = { ...currentState, ...(await this.executeResearcher(currentState)) };
      this.stateManager.mergeState(currentState);
      if (input.onAgentComplete) await input.onAgentComplete('researcher', currentState.researcherOutput);
      if (input.onProgress) await input.onProgress(20, 'Research completed');
      
      if (input.onAgentStart) await input.onAgentStart('ideator');
      if (input.onPhaseChange) await input.onPhaseChange('ideating', 'ideator');
      currentState = { ...currentState, ...(await this.executeIdeator(currentState)) };
      this.stateManager.mergeState(currentState);
      if (input.onAgentComplete) await input.onAgentComplete('ideator', currentState.ideatorOutput);
      if (input.onProgress) await input.onProgress(40, 'Ideas generated');
      
      if (input.onAgentStart) await input.onAgentStart('critic');
      if (input.onPhaseChange) await input.onPhaseChange('evaluating', 'critic');
      currentState = { ...currentState, ...(await this.executeCritic(currentState)) };
      this.stateManager.mergeState(currentState);
      if (input.onAgentComplete) await input.onAgentComplete('critic', currentState.criticOutput);
      if (input.onProgress) await input.onProgress(60, 'Ideas evaluated');
      
      if (input.onAgentStart) await input.onAgentStart('analyst');
      if (input.onPhaseChange) await input.onPhaseChange('analyzing', 'analyst');
      currentState = { ...currentState, ...(await this.executeAnalyst(currentState)) };
      this.stateManager.mergeState(currentState);
      if (input.onAgentComplete) await input.onAgentComplete('analyst', currentState.analystOutput);
      if (input.onProgress) await input.onProgress(80, 'Analysis completed');
      
      if (input.onAgentStart) await input.onAgentStart('writer');
      if (input.onPhaseChange) await input.onPhaseChange('writing', 'writer');
      currentState = { ...currentState, ...(await this.executeWriter(currentState)) };
      this.stateManager.mergeState(currentState);
      if (input.onAgentComplete) await input.onAgentComplete('writer', currentState.writerOutput);
      if (input.onProgress) await input.onProgress(100, 'Report generated');
      
      const finalState = currentState;

      return {
        success: true,
        data: {
          sessionId: input.sessionId,
          finalState,
          executionTime: Date.now() - startTime,
          allOutputs: {
            researcher: finalState.researcherOutput,
            ideator: finalState.ideatorOutput,
            critic: finalState.criticOutput,
            analyst: finalState.analystOutput,
            writer: finalState.writerOutput
          }
        },
        messages: [{
          agent: 'writer',
          message: 'ワークフロー実行が完了しました',
          timestamp: new Date().toISOString(),
          data: { executionTime: Date.now() - startTime }
        }]
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      if (input.onError && error instanceof Error) await input.onError(error);
      
      return {
        success: false,
        error: errorMessage,
        messages: [{
          agent: 'writer',
          message: `ワークフロー実行中にエラーが発生しました: ${errorMessage}`,
          timestamp: new Date().toISOString(),
          data: { executionTime: Date.now() - startTime }
        }]
      };
    }
  }

  /**
   * チェックポイントからのリジューム
   */
  async resumeFromCheckpoint(sessionId: string): Promise<AgentExecutionResult> {
    try {
      // 最新のチェックポイントを取得
      const latestState = await this.checkpointer.getLatestCheckpoint(sessionId);
      
      if (!latestState) {
        throw new Error(`No checkpoint found for session: ${sessionId}`);
      }

      // StateManagerを復元
      this.stateManager = new StateManager(latestState);

      // 実行設定
      const config: RunnableConfig = {
        configurable: {
          sessionId,
          userId: latestState.userId,
          resumeFromCheckpoint: true
        },
        metadata: {
          theme: latestState.theme,
          resumeTime: new Date().toISOString()
        }
      };

      // 現在の状態から継続実行 - determine where to resume
      let currentState = latestState;
      
      // Resume from the appropriate phase
      switch (latestState.currentPhase) {
        case 'initializing':
        case 'researching':
          currentState = { ...currentState, ...(await this.executeResearcher(currentState)) };
          this.stateManager.mergeState(currentState);
          // fall through
        case 'ideating':
          if (latestState.currentPhase === 'researching' || latestState.currentPhase === 'initializing') {
            currentState = { ...currentState, ...(await this.executeIdeator(currentState)) };
            this.stateManager.mergeState(currentState);
          }
          // fall through
        case 'critiquing':
          if (!currentState.criticOutput) {
            currentState = { ...currentState, ...(await this.executeCritic(currentState)) };
            this.stateManager.mergeState(currentState);
          }
          // fall through
        case 'analyzing':
          if (!currentState.analystOutput) {
            currentState = { ...currentState, ...(await this.executeAnalyst(currentState)) };
            this.stateManager.mergeState(currentState);
          }
          // fall through
        case 'writing':
          if (!currentState.writerOutput) {
            currentState = { ...currentState, ...(await this.executeWriter(currentState)) };
            this.stateManager.mergeState(currentState);
          }
          break;
        case 'completed':
          // Already completed
          break;
      }
      
      const finalState = currentState;

      return {
        success: true,
        data: {
          sessionId,
          finalState,
          resumed: true,
          allOutputs: {
            researcher: finalState.researcherOutput,
            ideator: finalState.ideatorOutput,
            critic: finalState.criticOutput,
            analyst: finalState.analystOutput,
            writer: finalState.writerOutput
          }
        },
        messages: [{
          agent: 'writer',
          message: 'チェックポイントからの復元が完了しました',
          timestamp: new Date().toISOString(),
          data: { resumedFrom: latestState.currentPhase }
        }]
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Resume failed';
      
      return {
        success: false,
        error: errorMessage,
        messages: [{
          agent: 'writer',
          message: `復元中にエラーが発生しました: ${errorMessage}`,
          timestamp: new Date().toISOString()
        }]
      };
    }
  }

  /**
   * 実行状態の取得
   */
  async getExecutionStatus(sessionId: string): Promise<{
    status: GraphState['currentPhase'];
    progress: number;
    currentAgent: GraphState['currentAgent'];
    lastUpdateTime: Date;
    error?: string;
  }> {
    try {
      const latestState = await this.checkpointer.getLatestCheckpoint(sessionId);
      
      if (!latestState) {
        return {
          status: 'initializing',
          progress: 0,
          currentAgent: null,
          lastUpdateTime: new Date()
        };
      }

      return {
        status: latestState.currentPhase,
        progress: latestState.progress,
        currentAgent: latestState.currentAgent,
        lastUpdateTime: latestState.lastUpdateTime,
        error: latestState.error?.message
      };
    } catch (error) {
      throw new Error(`Failed to get execution status: ${error}`);
    }
  }

  /**
   * チェックポイントの削除
   */
  async clearCheckpoints(sessionId: string): Promise<void> {
    await this.checkpointer.delete(sessionId);
  }

  /**
   * リソースのクリーンアップ
   */
  async cleanup(): Promise<void> {
    // チェックポイントのクリーンアップ（7日以上古いもの）
    await this.checkpointer.cleanup(7);
  }

  /**
   * グラフの可視化用情報取得（デバッグ用）
   */
  getGraphInfo(): {
    nodes: string[];
    edges: Array<{ from: string; to: string }>;
    currentState?: GraphState;
  } {
    return {
      nodes: ['researcher', 'ideator', 'critic', 'analyst', 'writer'],
      edges: [
        { from: 'START', to: 'researcher' },
        { from: 'researcher', to: 'ideator' },
        { from: 'ideator', to: 'critic' },
        { from: 'critic', to: 'analyst' },
        { from: 'analyst', to: 'writer' },
        { from: 'writer', to: 'END' }
      ],
      currentState: this.stateManager?.getState()
    };
  }
}