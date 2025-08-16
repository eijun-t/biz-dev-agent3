/**
 * State Manager
 * 
 * エージェント間の状態管理とデータ変換
 */

import type { 
  GraphState, 
  AnalystOutput,
  OrchestrationError,
  OrchestrationErrorType 
} from '@/lib/types/orchestration';
import type { ResearcherOutput } from '@/lib/types/agents';
import type { IdeatorOutput } from '@/lib/types/ideator';
import type { CriticOutput } from '@/lib/types/critic';
import type { WriterInput, HTMLReport } from '@/lib/types/writer';
import { 
  validateGraphState,
  ResearcherOutputSchema,
  IdeatorOutputSchema,
  CriticOutputSchema,
  AnalystOutputSchema,
  WriterOutputSchema
} from '@/lib/validations/orchestration';

export class StateManager {
  private state: GraphState;
  
  constructor(initialState?: Partial<GraphState>) {
    const now = new Date();
    this.state = {
      sessionId: initialState?.sessionId || '',
      userId: initialState?.userId || '',
      theme: initialState?.theme || '',
      currentPhase: initialState?.currentPhase || 'initializing',
      currentAgent: initialState?.currentAgent || null,
      progress: initialState?.progress || 0,
      startTime: initialState?.startTime || now,
      lastUpdateTime: initialState?.lastUpdateTime || now,
      ...initialState
    };
  }
  
  /**
   * 入力データのバリデーション
   */
  validateInput(agent: string, input: any): { valid: boolean; errors?: string[] } {
    const errors: string[] = [];
    
    try {
      switch (agent) {
        case 'researcher':
          // Researcherは初期入力のみ必要
          if (!this.state.theme) {
            errors.push('Theme is required for researcher');
          }
          break;
          
        case 'ideator':
          if (!this.state.researcherOutput) {
            errors.push('Researcher output is required for ideator');
          }
          ResearcherOutputSchema.parse(this.state.researcherOutput);
          break;
          
        case 'critic':
          if (!this.state.ideatorOutput) {
            errors.push('Ideator output is required for critic');
          }
          IdeatorOutputSchema.parse(this.state.ideatorOutput);
          break;
          
        case 'analyst':
          if (!this.state.criticOutput) {
            errors.push('Critic output is required for analyst');
          }
          CriticOutputSchema.parse(this.state.criticOutput);
          break;
          
        case 'writer':
          if (!this.state.analystOutput) {
            errors.push('Analyst output is required for writer');
          }
          AnalystOutputSchema.parse(this.state.analystOutput);
          break;
          
        default:
          errors.push(`Unknown agent: ${agent}`);
      }
    } catch (error: any) {
      if (error.errors) {
        errors.push(...error.errors.map((e: any) => 
          `${e.path.join('.')}: ${e.message}`
        ));
      } else {
        errors.push(error.message);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }
  
  /**
   * エージェント出力の変換と保存
   */
  transformOutput(agent: string, output: any): void {
    switch (agent) {
      case 'researcher':
        this.state.researcherOutput = output as ResearcherOutput;
        break;
        
      case 'ideator':
        this.state.ideatorOutput = output as IdeatorOutput;
        break;
        
      case 'critic':
        this.state.criticOutput = output as CriticOutput;
        break;
        
      case 'analyst':
        this.state.analystOutput = output as AnalystOutput;
        break;
        
      case 'writer':
        this.state.writerOutput = output as HTMLReport;
        break;
        
      default:
        throw new Error(`Unknown agent: ${agent}`);
    }
    
    this.state.lastUpdateTime = new Date();
  }
  
  /**
   * 状態のマージ
   */
  mergeState(updates: Partial<GraphState>): void {
    this.state = {
      ...this.state,
      ...updates,
      lastUpdateTime: new Date()
    };
    
    // バリデーション
    validateGraphState(this.state);
  }
  
  /**
   * チェックポイント用のシリアライズ
   */
  serializeForCheckpoint(): string {
    // Date型をISO文字列に変換
    const serializable = JSON.parse(JSON.stringify(this.state, (key, value) => {
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    }));
    
    return JSON.stringify(serializable);
  }
  
  /**
   * チェックポイントからの復元
   */
  static deserializeFromCheckpoint(serialized: string): StateManager {
    const data = JSON.parse(serialized);
    
    // ISO文字列をDate型に変換
    const state = {
      ...data,
      startTime: new Date(data.startTime),
      lastUpdateTime: new Date(data.lastUpdateTime),
      error: data.error ? {
        ...data.error,
        timestamp: new Date(data.error.timestamp)
      } : undefined
    };
    
    return new StateManager(state);
  }
  
  /**
   * 次のエージェントの入力データを準備
   */
  prepareNextAgentInput(nextAgent: string): any {
    switch (nextAgent) {
      case 'researcher':
        return {
          theme: this.state.theme,
          sessionId: this.state.sessionId
        };
        
      case 'ideator':
        return {
          researchOutput: this.state.researcherOutput,
          config: {
            model: 'gpt-4o',
            temperature: 0.7
          }
        };
        
      case 'critic':
        return {
          sessionId: this.state.sessionId,
          ideas: this.state.ideatorOutput?.ideas || [],
          researchData: this.state.researcherOutput
        };
        
      case 'analyst':
        return {
          sessionId: this.state.sessionId,
          selectedIdea: this.state.criticOutput?.selectedIdea,
          researchData: this.state.researcherOutput
        };
        
      case 'writer':
        const writerInput: WriterInput = {
          sessionId: this.state.sessionId,
          ideaId: this.state.analystOutput?.ideaId || '',
          analystData: this.state.analystOutput?.analystData || {
            businessIdea: {},
            marketAnalysis: {
              tam: 0,
              pam: 0,
              sam: 0,
              growthRate: 0,
              competitors: [],
              marketTrends: [],
              regulations: []
            },
            synergyAnalysis: {
              totalScore: 0,
              breakdown: {},
              initiatives: [],
              risks: []
            },
            validationPlan: {
              phases: [],
              totalDuration: 0,
              requiredBudget: 0
            }
          },
          metadata: {
            generatedAt: new Date(),
            version: '1.0.0'
          }
        };
        return writerInput;
        
      default:
        throw new Error(`Unknown agent: ${nextAgent}`);
    }
  }
  
  /**
   * 進捗の計算
   */
  calculateProgress(): number {
    const phaseWeights = {
      initializing: 0,
      researching: 20,
      ideating: 40,
      critiquing: 60,
      analyzing: 80,
      writing: 95,
      completed: 100,
      error: this.state.progress // エラー時は現在の進捗を維持
    };
    
    return phaseWeights[this.state.currentPhase];
  }
  
  /**
   * フェーズの更新
   */
  updatePhase(phase: GraphState['currentPhase'], agent?: GraphState['currentAgent']): void {
    this.state.currentPhase = phase;
    this.state.currentAgent = agent || null;
    this.state.progress = this.calculateProgress();
    this.state.lastUpdateTime = new Date();
  }
  
  /**
   * エラーの記録
   */
  recordError(error: OrchestrationError): void {
    this.state.error = {
      message: error.message,
      agent: error.agent,
      timestamp: error.timestamp,
      retryCount: this.state.error?.retryCount || 0
    };
    this.state.currentPhase = 'error';
    this.state.lastUpdateTime = new Date();
  }
  
  /**
   * リトライカウントの増加
   */
  incrementRetryCount(): void {
    if (this.state.error) {
      this.state.error.retryCount++;
    }
  }
  
  /**
   * 現在の状態を取得
   */
  getState(): GraphState {
    return { ...this.state };
  }
  
  /**
   * 完了状態かチェック
   */
  isCompleted(): boolean {
    return this.state.currentPhase === 'completed';
  }
  
  /**
   * エラー状態かチェック
   */
  hasError(): boolean {
    return this.state.currentPhase === 'error';
  }
  
  /**
   * 全エージェントの出力が揃っているかチェック
   */
  hasAllOutputs(): boolean {
    return !!(
      this.state.researcherOutput &&
      this.state.ideatorOutput &&
      this.state.criticOutput &&
      this.state.analystOutput &&
      this.state.writerOutput
    );
  }
}