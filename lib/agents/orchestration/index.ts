/**
 * Agent Orchestration Module
 * 
 * エージェントオーケストレーションのメインエクスポート
 */

// Core orchestration components
export { AgentGraph } from './agent-graph';
export { StateManager } from './state-manager';
export { 
  OrchestrationErrorHandler, 
  ErrorRecoveryStrategy,
  type RetryConfig,
  type ErrorCategory 
} from './error-handler';

// Services
export { getJobQueueService, JobQueueService, ConcurrencyController } from '@/lib/services/job-queue';
export { getProgressTrackerService, ProgressTrackerService } from '@/lib/services/progress-tracker';
export { getPerformanceMonitor, PerformanceMonitor } from '@/lib/services/performance-monitor';

// Types
export type {
  GraphState,
  Job,
  Checkpoint,
  ProgressEvent,
  OrchestrationError,
  OrchestrationErrorType,
  RecoveryAction,
  AnalystInput,
  AnalystOutput
} from '@/lib/types/orchestration';

// Validations
export {
  validateGraphState,
  validateJobInput,
  validateJob,
  validateProgressEvent,
  validateCheckpoint,
  validateGenerateRequest,
  validateGenerateResponse,
  GraphStateSchema,
  JobInputSchema,
  JobSchema,
  ProgressEventSchema,
  CheckpointSchema,
  GenerateRequestSchema,
  GenerateResponseSchema,
  type JobInput,
  type GenerateRequest,
  type GenerateResponse,
  type JobStatusResponse
} from '@/lib/validations/orchestration';

// Main orchestration function
import { AgentGraph } from './agent-graph';
import { getJobQueueService } from '@/lib/services/job-queue';
import { getProgressTrackerService } from '@/lib/services/progress-tracker';
import { getPerformanceMonitor } from '@/lib/services/performance-monitor';
import { createClient } from '@supabase/supabase-js';
import { SearchService } from '@/lib/services/serper/serper-search-service';
import { ChatOpenAI } from '@langchain/openai';
import type { JobInput } from '@/lib/validations/orchestration';

/**
 * メインオーケストレーション関数
 * テーマからレポート生成までの完全な処理を実行
 */
export async function orchestrateIdeation(
  userId: string,
  sessionId: string,
  input: JobInput
): Promise<any> {
  const jobQueue = getJobQueueService();
  const progressTracker = getProgressTrackerService();
  const performanceMonitor = getPerformanceMonitor();
  
  // Initialize required services for AgentGraph
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-key'
  );
  const searchService = new SearchService({ apiKey: process.env.SERPER_API_KEY! });
  const llm = new ChatOpenAI({
    modelName: 'gpt-4o',
    temperature: 0.7,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });
  
  const agentGraph = new AgentGraph({
    supabase,
    searchService,
    llm,
    enableCheckpoints: true,
  });
  
  let job;
  
  try {
    // パフォーマンス監視開始
    performanceMonitor.startSession(sessionId);
    
    // ジョブをキューに追加
    job = await jobQueue.enqueue(userId, sessionId, input);
    
    // 進捗追跡を開始
    await progressTracker.startTracking(sessionId);
    await progressTracker.updateProgress(sessionId, 0, 'Starting ideation process...');
    
    // スロットを待機
    await jobQueue.waitForSlot();
    
    // ジョブを処理中に更新
    await jobQueue.updateStatus(job.id, 'processing');
    
    // エージェントグラフを実行
    const result = await agentGraph.execute({
      sessionId,
      userId,
      theme: input.theme,
      options: input.options,
      onProgress: async (progress, message) => {
        await progressTracker.updateProgress(sessionId, progress, message);
      },
      onPhaseChange: async (phase, agent) => {
        await progressTracker.phaseChange(sessionId, phase, agent);
        performanceMonitor.updatePhase(sessionId, phase);
      },
      onAgentStart: async (agent) => {
        await progressTracker.agentStart(sessionId, agent);
        performanceMonitor.startAgent(sessionId, agent);
      },
      onAgentComplete: async (agent, output) => {
        await progressTracker.agentComplete(sessionId, agent, output);
        performanceMonitor.endAgent(sessionId, agent, {
          apiCalls: 1,
          tokensUsed: 0
        });
      },
      onError: async (error) => {
        await progressTracker.sendError(sessionId, error.message);
        performanceMonitor.recordError(sessionId, error);
      }
    });
    
    // ジョブを完了に更新
    await jobQueue.updateStatus(job.id, 'completed', result);
    
    // 進捗追跡を完了
    await progressTracker.sendCompleted(sessionId, result);
    
    // パフォーマンス監視終了
    await performanceMonitor.endSession(sessionId);
    
    return result;
    
  } catch (error: any) {
    // エラー処理
    if (job) {
      await jobQueue.updateStatus(job.id, 'failed', undefined, error.message);
    }
    
    await progressTracker.sendError(sessionId, error.message);
    performanceMonitor.recordError(sessionId, error);
    await performanceMonitor.endSession(sessionId);
    
    throw error;
  } finally {
    // クリーンアップ
    progressTracker.cleanup();
    agentGraph.cleanup();
  }
}

/**
 * チェックポイントからの再開
 */
export async function resumeIdeation(
  userId: string,
  sessionId: string
): Promise<any> {
  const progressTracker = getProgressTrackerService();
  const performanceMonitor = getPerformanceMonitor();
  
  // Initialize required services for AgentGraph
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-key'
  );
  const searchService = new SearchService({ apiKey: process.env.SERPER_API_KEY! });
  const llm = new ChatOpenAI({
    modelName: 'gpt-4o',
    temperature: 0.7,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });
  
  const agentGraph = new AgentGraph({
    supabase,
    searchService,
    llm,
    enableCheckpoints: true,
  });
  
  try {
    // パフォーマンス監視開始
    performanceMonitor.startSession(sessionId);
    
    // 進捗追跡を再開
    await progressTracker.startTracking(sessionId);
    await progressTracker.updateProgress(sessionId, -1, 'Resuming from checkpoint...');
    
    // チェックポイントから再開
    const result = await agentGraph.resumeFromCheckpoint(sessionId);
    
    // 進捗追跡を完了
    await progressTracker.sendCompleted(sessionId, result);
    
    // パフォーマンス監視終了
    await performanceMonitor.endSession(sessionId);
    
    return result;
    
  } catch (error: any) {
    await progressTracker.sendError(sessionId, error.message);
    performanceMonitor.recordError(sessionId, error);
    await performanceMonitor.endSession(sessionId);
    
    throw error;
  } finally {
    progressTracker.cleanup();
    agentGraph.cleanup();
  }
}

/**
 * ジョブステータスの取得
 */
export async function getJobStatus(jobId: string): Promise<any> {
  const jobQueue = getJobQueueService();
  return await jobQueue.getJob(jobId);
}

/**
 * ジョブのキャンセル
 */
export async function cancelJob(jobId: string): Promise<void> {
  const jobQueue = getJobQueueService();
  await jobQueue.cancelJob(jobId);
}