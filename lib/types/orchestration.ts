/**
 * Orchestration Type Definitions
 * 
 * エージェントオーケストレーション用の型定義
 */

import type { ResearcherOutput } from './agents';
import type { IdeatorOutput } from './ideator';
import type { CriticOutput } from './critic';
import type { HTMLReport } from './writer';

/**
 * Analystエージェントの入力
 */
export interface AnalystInput {
  sessionId: string;
  selectedIdea: any; // CriticOutputから選ばれたアイデア
  researchData?: any; // 追加の研究データ
}

/**
 * Analystエージェントの出力
 */
export interface AnalystOutput {
  sessionId: string;
  ideaId: string;
  analystData: {
    businessIdea: any;
    marketAnalysis: {
      tam: number;
      pam: number;
      sam: number;
      growthRate: number;
      competitors: any[];
      marketTrends: string[];
      regulations: string[];
    };
    synergyAnalysis: {
      totalScore: number;
      breakdown: Record<string, number>;
      initiatives: any[];
      risks: any[];
    };
    validationPlan: {
      phases: any[];
      totalDuration: number;
      requiredBudget: number;
    };
  };
  metadata: {
    generatedAt: Date;
    version: string;
    tokensUsed?: number;
    processingTimeMs?: number;
  };
}

/**
 * グラフ状態の型定義
 * LangGraphで管理される状態
 */
export interface GraphState {
  // Core fields
  sessionId: string;
  userId: string;
  theme: string;
  
  // Agent states
  currentPhase: 'initializing' | 'researching' | 'ideating' | 'critiquing' | 'analyzing' | 'writing' | 'completed' | 'error';
  currentAgent: 'researcher' | 'ideator' | 'critic' | 'analyst' | 'writer' | null;
  
  // Progress tracking
  progress: number; // 0-100
  startTime: Date;
  lastUpdateTime: Date;
  
  // Agent outputs
  researcherOutput?: ResearcherOutput;
  ideatorOutput?: IdeatorOutput;
  criticOutput?: CriticOutput;
  analystOutput?: AnalystOutput;
  writerOutput?: HTMLReport;
  
  // Error handling
  error?: {
    message: string;
    agent?: string;
    timestamp: Date;
    retryCount: number;
  };
}

/**
 * ジョブの型定義
 */
export interface Job {
  id: string;
  userId: string;
  sessionId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  priority: number;
  input: {
    theme: string;
    options?: Record<string, any>;
  };
  output?: any;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

/**
 * チェックポイントの型定義
 */
export interface Checkpoint {
  id: string;
  sessionId: string;
  state: GraphState;
  createdAt: Date;
}

/**
 * 進捗イベントの型定義
 */
export interface ProgressEvent {
  type: 'progress' | 'phase_change' | 'agent_start' | 'agent_complete' | 'error' | 'completed';
  sessionId: string;
  timestamp: Date;
  data: {
    progress?: number;
    phase?: GraphState['currentPhase'];
    agent?: GraphState['currentAgent'];
    message?: string;
    error?: string;
  };
}

/**
 * オーケストレーションエラー型
 */
export enum OrchestrationErrorType {
  AGENT_FAILURE = 'AGENT_FAILURE',
  TIMEOUT = 'TIMEOUT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  QUEUE_ERROR = 'QUEUE_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',
  CHECKPOINT_ERROR = 'CHECKPOINT_ERROR',
  UNKNOWN = 'UNKNOWN'
}

/**
 * エラーリカバリーアクション
 */
export enum RecoveryAction {
  RETRY = 'RETRY',
  RESUME_FROM_CHECKPOINT = 'RESUME_FROM_CHECKPOINT',
  SKIP_AGENT = 'SKIP_AGENT',
  SAVE_PARTIAL = 'SAVE_PARTIAL',
  ABORT = 'ABORT'
}

/**
 * オーケストレーションエラー
 */
export interface OrchestrationError {
  type: OrchestrationErrorType;
  message: string;
  agent?: string;
  details?: any;
  retryable: boolean;
  recoveryActions: RecoveryAction[];
  timestamp: Date;
}