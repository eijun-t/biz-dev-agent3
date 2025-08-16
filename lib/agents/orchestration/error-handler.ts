/**
 * Orchestration Error Handler
 * 
 * エラーハンドリングとリトライ機構
 */

import type {
  OrchestrationError,
  OrchestrationErrorType,
  RecoveryAction,
  GraphState,
  Checkpoint
} from '@/lib/types/orchestration';
import { StateManager } from './state-manager';
import { createServiceClient } from '@/lib/supabase/service';

export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

export interface ErrorCategory {
  type: OrchestrationErrorType;
  retryable: boolean;
  recoveryActions: RecoveryAction[];
  defaultMessage: string;
}

/**
 * エラーカテゴリの定義
 */
const ERROR_CATEGORIES: Record<string, ErrorCategory> = {
  AGENT_FAILURE: {
    type: 'AGENT_FAILURE' as OrchestrationErrorType,
    retryable: true,
    recoveryActions: ['RETRY', 'RESUME_FROM_CHECKPOINT', 'SAVE_PARTIAL'],
    defaultMessage: 'Agent execution failed'
  },
  TIMEOUT: {
    type: 'TIMEOUT' as OrchestrationErrorType,
    retryable: true,
    recoveryActions: ['RETRY', 'RESUME_FROM_CHECKPOINT'],
    defaultMessage: 'Operation timed out'
  },
  VALIDATION_ERROR: {
    type: 'VALIDATION_ERROR' as OrchestrationErrorType,
    retryable: false,
    recoveryActions: ['ABORT', 'SAVE_PARTIAL'],
    defaultMessage: 'Data validation failed'
  },
  NETWORK_ERROR: {
    type: 'NETWORK_ERROR' as OrchestrationErrorType,
    retryable: true,
    recoveryActions: ['RETRY', 'RESUME_FROM_CHECKPOINT'],
    defaultMessage: 'Network connection error'
  },
  DATABASE_ERROR: {
    type: 'DATABASE_ERROR' as OrchestrationErrorType,
    retryable: true,
    recoveryActions: ['RETRY'],
    defaultMessage: 'Database operation failed'
  },
  RATE_LIMIT: {
    type: 'RATE_LIMIT' as OrchestrationErrorType,
    retryable: true,
    recoveryActions: ['RETRY'],
    defaultMessage: 'Rate limit exceeded'
  },
  CHECKPOINT_ERROR: {
    type: 'CHECKPOINT_ERROR' as OrchestrationErrorType,
    retryable: false,
    recoveryActions: ['SKIP_AGENT', 'ABORT'],
    defaultMessage: 'Checkpoint operation failed'
  },
  UNKNOWN: {
    type: 'UNKNOWN' as OrchestrationErrorType,
    retryable: false,
    recoveryActions: ['ABORT', 'SAVE_PARTIAL'],
    defaultMessage: 'Unknown error occurred'
  }
};

export class OrchestrationErrorHandler {
  private retryConfig: RetryConfig;
  private supabase;
  
  constructor(retryConfig?: Partial<RetryConfig>) {
    this.retryConfig = {
      maxRetries: retryConfig?.maxRetries ?? 3,
      initialDelayMs: retryConfig?.initialDelayMs ?? 1000,
      maxDelayMs: retryConfig?.maxDelayMs ?? 30000,
      backoffMultiplier: retryConfig?.backoffMultiplier ?? 2,
      ...retryConfig
    };
    this.supabase = createServiceClient();
  }
  
  /**
   * エラーハンドリング
   */
  async handleError(
    error: any,
    context: {
      sessionId: string;
      agent?: string;
      operation?: string;
      retryCount?: number;
    }
  ): Promise<OrchestrationError> {
    const errorType = this.categorizeError(error);
    const category = ERROR_CATEGORIES[errorType] || ERROR_CATEGORIES.UNKNOWN;
    
    const orchestrationError: OrchestrationError = {
      type: category.type,
      message: error.message || category.defaultMessage,
      agent: context.agent,
      details: {
        operation: context.operation,
        originalError: error.stack || error.toString(),
        code: error.code,
        statusCode: error.statusCode
      },
      retryable: category.retryable,
      recoveryActions: category.recoveryActions,
      timestamp: new Date()
    };
    
    // エラーログをデータベースに記録
    await this.logError(orchestrationError, context.sessionId);
    
    return orchestrationError;
  }
  
  /**
   * リトライ実行
   */
  async retry<T>(
    operation: () => Promise<T>,
    context: {
      sessionId: string;
      agent?: string;
      operationName?: string;
    }
  ): Promise<T> {
    let lastError: any;
    let retryCount = 0;
    
    while (retryCount < this.retryConfig.maxRetries) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        retryCount++;
        
        const orchestrationError = await this.handleError(error, {
          ...context,
          retryCount
        });
        
        if (!this.shouldRetry(orchestrationError, retryCount)) {
          throw orchestrationError;
        }
        
        const delay = this.calculateBackoffDelay(retryCount);
        console.log(
          `Retrying ${context.operationName || 'operation'} (attempt ${retryCount}/${this.retryConfig.maxRetries}) after ${delay}ms`
        );
        
        await this.sleep(delay);
      }
    }
    
    // 最大リトライ回数に達した
    const finalError = await this.handleError(lastError, {
      ...context,
      retryCount
    });
    
    throw finalError;
  }
  
  /**
   * リトライすべきか判定
   */
  shouldRetry(error: OrchestrationError, retryCount: number): boolean {
    if (retryCount >= this.retryConfig.maxRetries) {
      return false;
    }
    
    if (!error.retryable) {
      return false;
    }
    
    // レート制限の場合は特別な処理
    if (error.type === 'RATE_LIMIT') {
      const retryAfter = error.details?.retryAfter;
      if (retryAfter && retryAfter > this.retryConfig.maxDelayMs) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * バックオフ遅延の計算
   */
  private calculateBackoffDelay(retryCount: number): number {
    const exponentialDelay = 
      this.retryConfig.initialDelayMs * 
      Math.pow(this.retryConfig.backoffMultiplier, retryCount - 1);
    
    const jitteredDelay = exponentialDelay * (0.5 + Math.random() * 0.5);
    
    return Math.min(jitteredDelay, this.retryConfig.maxDelayMs);
  }
  
  /**
   * エラーの分類
   */
  private categorizeError(error: any): string {
    // ネットワークエラー
    if (
      error.code === 'ECONNREFUSED' ||
      error.code === 'ENOTFOUND' ||
      error.code === 'ETIMEDOUT' ||
      error.message?.includes('fetch failed')
    ) {
      return 'NETWORK_ERROR';
    }
    
    // タイムアウト
    if (
      error.code === 'TIMEOUT' ||
      error.message?.includes('timeout') ||
      error.message?.includes('timed out')
    ) {
      return 'TIMEOUT';
    }
    
    // レート制限
    if (
      error.statusCode === 429 ||
      error.code === 'RATE_LIMIT' ||
      error.message?.includes('rate limit')
    ) {
      return 'RATE_LIMIT';
    }
    
    // バリデーションエラー
    if (
      error.statusCode === 400 ||
      error.code === 'VALIDATION_ERROR' ||
      error.message?.includes('validation')
    ) {
      return 'VALIDATION_ERROR';
    }
    
    // データベースエラー
    if (
      error.code?.startsWith('PGRST') ||
      error.code?.startsWith('42') ||
      error.message?.includes('database')
    ) {
      return 'DATABASE_ERROR';
    }
    
    // エージェントエラー
    if (
      error.message?.includes('agent') ||
      error.message?.includes('Agent')
    ) {
      return 'AGENT_FAILURE';
    }
    
    // チェックポイントエラー
    if (error.message?.includes('checkpoint')) {
      return 'CHECKPOINT_ERROR';
    }
    
    return 'UNKNOWN';
  }
  
  /**
   * エラーログの記録
   */
  private async logError(
    error: OrchestrationError,
    sessionId: string
  ): Promise<void> {
    try {
      await this.supabase
        .from('system_logs')
        .insert({
          session_id: sessionId,
          action: 'orchestration_error',
          details: {
            type: error.type,
            message: error.message,
            agent: error.agent,
            details: error.details,
            retryable: error.retryable,
            recoveryActions: error.recoveryActions
          },
          created_at: error.timestamp.toISOString()
        });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  }
  
  /**
   * スリープユーティリティ
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Error Recovery Strategy
 * エラーリカバリー戦略の実装
 */
export class ErrorRecoveryStrategy {
  private errorHandler: OrchestrationErrorHandler;
  private supabase;
  
  constructor(errorHandler: OrchestrationErrorHandler) {
    this.errorHandler = errorHandler;
    this.supabase = createServiceClient();
  }
  
  /**
   * リカバリー実行
   */
  async recover(
    error: OrchestrationError,
    stateManager: StateManager,
    sessionId: string
  ): Promise<RecoveryAction> {
    const state = stateManager.getState();
    const selectedAction = this.selectRecoveryAction(error, state);
    
    switch (selectedAction) {
      case 'RETRY':
        // リトライカウントを増加
        stateManager.incrementRetryCount();
        return 'RETRY';
        
      case 'RESUME_FROM_CHECKPOINT':
        await this.resumeFromCheckpoint(sessionId, stateManager);
        return 'RESUME_FROM_CHECKPOINT';
        
      case 'SKIP_AGENT':
        await this.skipCurrentAgent(stateManager);
        return 'SKIP_AGENT';
        
      case 'SAVE_PARTIAL':
        await this.savePartialResults(stateManager, sessionId);
        return 'SAVE_PARTIAL';
        
      case 'ABORT':
      default:
        await this.abort(stateManager, sessionId, error);
        return 'ABORT';
    }
  }
  
  /**
   * リカバリーアクションの選択
   */
  private selectRecoveryAction(
    error: OrchestrationError,
    state: GraphState
  ): RecoveryAction {
    // バリデーションエラーは即座に中止
    if (error.type === 'VALIDATION_ERROR') {
      return 'ABORT';
    }
    
    // リトライ回数が上限に達していない場合はリトライ
    const retryCount = state.error?.retryCount || 0;
    if (error.retryable && retryCount < 3) {
      return 'RETRY';
    }
    
    // チェックポイントが存在する場合は再開を試みる
    if (
      error.recoveryActions.includes('RESUME_FROM_CHECKPOINT') &&
      state.currentPhase !== 'initializing'
    ) {
      return 'RESUME_FROM_CHECKPOINT';
    }
    
    // 部分結果の保存が可能な場合
    if (
      error.recoveryActions.includes('SAVE_PARTIAL') &&
      this.hasPartialResults(state)
    ) {
      return 'SAVE_PARTIAL';
    }
    
    // それ以外は中止
    return 'ABORT';
  }
  
  /**
   * チェックポイントからの再開
   */
  private async resumeFromCheckpoint(
    sessionId: string,
    stateManager: StateManager
  ): Promise<void> {
    const { data: checkpoint } = await this.supabase
      .from('checkpoints')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (checkpoint) {
      const restoredManager = StateManager.deserializeFromCheckpoint(
        JSON.stringify(checkpoint.state)
      );
      stateManager.mergeState(restoredManager.getState());
      console.log(`Resumed from checkpoint at phase: ${checkpoint.state.currentPhase}`);
    }
  }
  
  /**
   * 現在のエージェントをスキップ
   */
  private async skipCurrentAgent(stateManager: StateManager): Promise<void> {
    const state = stateManager.getState();
    const nextPhase = this.getNextPhase(state.currentPhase);
    
    if (nextPhase) {
      stateManager.updatePhase(nextPhase, this.getAgentForPhase(nextPhase));
      console.log(`Skipped ${state.currentAgent}, moving to ${nextPhase}`);
    }
  }
  
  /**
   * 部分結果の保存
   */
  private async savePartialResults(
    stateManager: StateManager,
    sessionId: string
  ): Promise<void> {
    const state = stateManager.getState();
    
    // 部分結果をデータベースに保存
    await this.supabase
      .from('ideation_sessions')
      .update({
        status: 'error',
        error_message: `Partial results saved at ${state.currentPhase}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);
    
    // チェックポイントも保存
    await this.supabase
      .from('checkpoints')
      .insert({
        session_id: sessionId,
        state: JSON.parse(stateManager.serializeForCheckpoint()),
        created_at: new Date().toISOString()
      });
    
    console.log(`Partial results saved for session ${sessionId}`);
  }
  
  /**
   * 処理の中止
   */
  private async abort(
    stateManager: StateManager,
    sessionId: string,
    error: OrchestrationError
  ): Promise<void> {
    stateManager.updatePhase('error');
    stateManager.recordError(error);
    
    // セッションステータスを更新
    await this.supabase
      .from('ideation_sessions')
      .update({
        status: 'error',
        error_message: error.message,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);
    
    console.error(`Aborted session ${sessionId}: ${error.message}`);
  }
  
  /**
   * 部分結果が存在するかチェック
   */
  private hasPartialResults(state: GraphState): boolean {
    return !!(
      state.researcherOutput ||
      state.ideatorOutput ||
      state.criticOutput ||
      state.analystOutput
    );
  }
  
  /**
   * 次のフェーズを取得
   */
  private getNextPhase(
    currentPhase: GraphState['currentPhase']
  ): GraphState['currentPhase'] | null {
    const phaseOrder: GraphState['currentPhase'][] = [
      'initializing',
      'researching',
      'ideating',
      'critiquing',
      'analyzing',
      'writing',
      'completed'
    ];
    
    const currentIndex = phaseOrder.indexOf(currentPhase);
    if (currentIndex >= 0 && currentIndex < phaseOrder.length - 1) {
      return phaseOrder[currentIndex + 1];
    }
    
    return null;
  }
  
  /**
   * フェーズに対応するエージェントを取得
   */
  private getAgentForPhase(
    phase: GraphState['currentPhase']
  ): GraphState['currentAgent'] {
    const phaseAgentMap: Record<string, GraphState['currentAgent']> = {
      researching: 'researcher',
      ideating: 'ideator',
      critiquing: 'critic',
      analyzing: 'analyst',
      writing: 'writer'
    };
    
    return phaseAgentMap[phase] || null;
  }
}