/**
 * Agent Monitor Service
 * 
 * エージェントの実行状態監視・メトリクス収集・パフォーマンス追跡
 */

import { createServiceLogger } from '@/lib/utils/logger';
import { EventEmitter } from 'events';

const logger = createServiceLogger('AgentMonitorService');

// エージェント名
export enum AgentName {
  RESEARCHER = 'Researcher',
  IDEATOR = 'Ideator',
  CRITIC = 'Critic',
  ANALYST = 'Analyst',
  WRITER = 'Writer'
}

// エージェント状態
export enum AgentStatus {
  IDLE = 'idle',
  INITIALIZING = 'initializing',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  TIMEOUT = 'timeout'
}

// エージェント情報
export interface AgentInfo {
  name: AgentName;
  status: AgentStatus;
  progress: number; // 0-100
  currentTask?: string;
  startTime?: Date;
  endTime?: Date;
  error?: Error;
  metrics?: AgentMetrics;
  dependencies?: AgentName[];
}

// エージェントメトリクス
export interface AgentMetrics {
  executionTime?: number; // ms
  memoryUsage?: number; // MB
  cpuUsage?: number; // %
  apiCalls?: number;
  dataProcessed?: number; // bytes
  outputSize?: number; // bytes
  retryCount?: number;
  errorCount?: number;
}

// モニタリングイベント
export interface MonitorEvent {
  type: 'status_change' | 'progress_update' | 'error' | 'metric' | 'complete';
  timestamp: Date;
  agent: AgentName;
  data: any;
}

// セッション情報
export interface SessionInfo {
  id: string;
  startTime: Date;
  endTime?: Date;
  agents: Map<AgentName, AgentInfo>;
  status: 'active' | 'completed' | 'failed' | 'cancelled';
  totalProgress: number;
  errors: Error[];
}

// モニタリングオプション
export interface MonitorOptions {
  enableMetrics?: boolean;
  metricsInterval?: number; // ms
  enableAlerts?: boolean;
  alertThresholds?: AlertThresholds;
  maxSessionDuration?: number; // ms
  enableTrace?: boolean;
}

// アラート閾値
export interface AlertThresholds {
  executionTime?: number; // ms
  memoryUsage?: number; // MB
  errorRate?: number; // %
  timeoutDuration?: number; // ms
}

/**
 * エージェントモニターサービス
 */
export class AgentMonitorService extends EventEmitter {
  private sessions: Map<string, SessionInfo> = new Map();
  private options: Required<MonitorOptions>;
  private metricsTimer: NodeJS.Timeout | null = null;
  private activeMonitors: Map<string, NodeJS.Timeout> = new Map();

  constructor(options: MonitorOptions = {}) {
    super();
    
    this.options = {
      enableMetrics: true,
      metricsInterval: 5000, // 5秒
      enableAlerts: true,
      alertThresholds: {
        executionTime: 60000, // 1分
        memoryUsage: 500, // 500MB
        errorRate: 10, // 10%
        timeoutDuration: 300000, // 5分
        ...options.alertThresholds
      },
      maxSessionDuration: 3600000, // 1時間
      enableTrace: false,
      ...options
    };

    if (this.options.enableMetrics) {
      this.startMetricsCollection();
    }
  }

  /**
   * セッションを開始
   */
  startSession(sessionId: string): SessionInfo {
    if (this.sessions.has(sessionId)) {
      logger.warn('Session already exists', { sessionId });
      return this.sessions.get(sessionId)!;
    }

    const session: SessionInfo = {
      id: sessionId,
      startTime: new Date(),
      agents: new Map(),
      status: 'active',
      totalProgress: 0,
      errors: []
    };

    // 各エージェントを初期化
    Object.values(AgentName).forEach(name => {
      session.agents.set(name as AgentName, {
        name: name as AgentName,
        status: AgentStatus.IDLE,
        progress: 0
      });
    });

    this.sessions.set(sessionId, session);

    // セッションタイムアウト監視
    this.startSessionTimeout(sessionId);

    logger.info('Session started', { sessionId });
    this.emit('session:start', session);

    return session;
  }

  /**
   * セッションを終了
   */
  endSession(sessionId: string, status: 'completed' | 'failed' | 'cancelled' = 'completed'): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      logger.warn('Session not found', { sessionId });
      return;
    }

    session.endTime = new Date();
    session.status = status;

    // タイマークリア
    const timer = this.activeMonitors.get(sessionId);
    if (timer) {
      clearTimeout(timer);
      this.activeMonitors.delete(sessionId);
    }

    logger.info('Session ended', { 
      sessionId,
      status,
      duration: session.endTime.getTime() - session.startTime.getTime()
    });

    this.emit('session:end', session);
  }

  /**
   * エージェントの状態を更新
   */
  updateAgentStatus(
    sessionId: string,
    agentName: AgentName,
    status: AgentStatus,
    additionalInfo?: Partial<AgentInfo>
  ): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      logger.warn('Session not found', { sessionId });
      return;
    }

    const agent = session.agents.get(agentName);
    if (!agent) {
      logger.warn('Agent not found', { sessionId, agentName });
      return;
    }

    const previousStatus = agent.status;
    agent.status = status;

    // 開始時刻を記録
    if (status === AgentStatus.RUNNING && !agent.startTime) {
      agent.startTime = new Date();
    }

    // 終了時刻を記録
    if ([AgentStatus.COMPLETED, AgentStatus.FAILED, AgentStatus.TIMEOUT].includes(status)) {
      agent.endTime = new Date();
      
      // 実行時間を計算
      if (agent.startTime && agent.metrics) {
        agent.metrics.executionTime = agent.endTime.getTime() - agent.startTime.getTime();
      }
    }

    // 追加情報を更新
    if (additionalInfo) {
      Object.assign(agent, additionalInfo);
    }

    // アラートチェック
    if (this.options.enableAlerts) {
      this.checkAlerts(sessionId, agentName, agent);
    }

    // イベント発行
    const event: MonitorEvent = {
      type: 'status_change',
      timestamp: new Date(),
      agent: agentName,
      data: { previousStatus, newStatus: status }
    };

    this.emit('agent:status', event);
    this.logStatusChange(sessionId, agentName, previousStatus, status);

    // セッション全体の進捗を更新
    this.updateSessionProgress(sessionId);
  }

  /**
   * エージェントの進捗を更新
   */
  updateAgentProgress(
    sessionId: string,
    agentName: AgentName,
    progress: number,
    currentTask?: string
  ): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const agent = session.agents.get(agentName);
    if (!agent) return;

    agent.progress = Math.min(100, Math.max(0, progress));
    if (currentTask) {
      agent.currentTask = currentTask;
    }

    // イベント発行
    const event: MonitorEvent = {
      type: 'progress_update',
      timestamp: new Date(),
      agent: agentName,
      data: { progress, currentTask }
    };

    this.emit('agent:progress', event);

    // セッション全体の進捗を更新
    this.updateSessionProgress(sessionId);
  }

  /**
   * エラーを記録
   */
  recordError(sessionId: string, agentName: AgentName, error: Error): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const agent = session.agents.get(agentName);
    if (!agent) return;

    agent.error = error;
    agent.status = AgentStatus.FAILED;
    session.errors.push(error);

    if (!agent.metrics) {
      agent.metrics = {} as AgentMetrics;
    }
    agent.metrics.errorCount = (agent.metrics.errorCount || 0) + 1;

    // イベント発行
    const event: MonitorEvent = {
      type: 'error',
      timestamp: new Date(),
      agent: agentName,
      data: { error: error.message }
    };

    this.emit('agent:error', event);
    logger.error('Agent error recorded', error, { sessionId, agentName });

    // アラートチェック
    if (this.options.enableAlerts) {
      this.checkAlerts(sessionId, agentName, agent);
    }
  }

  /**
   * メトリクスを更新
   */
  updateMetrics(
    sessionId: string,
    agentName: AgentName,
    metrics: Partial<AgentMetrics>
  ): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const agent = session.agents.get(agentName);
    if (!agent) return;

    if (!agent.metrics) {
      agent.metrics = {} as AgentMetrics;
    }

    Object.assign(agent.metrics, metrics);

    // イベント発行
    const event: MonitorEvent = {
      type: 'metric',
      timestamp: new Date(),
      agent: agentName,
      data: metrics
    };

    this.emit('agent:metric', event);

    // アラートチェック
    if (this.options.enableAlerts) {
      this.checkAlerts(sessionId, agentName, agent);
    }
  }

  /**
   * セッション全体の進捗を更新
   */
  private updateSessionProgress(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    let totalProgress = 0;
    let activeAgents = 0;

    session.agents.forEach(agent => {
      if (agent.status !== AgentStatus.IDLE) {
        totalProgress += agent.progress;
        activeAgents++;
      }
    });

    session.totalProgress = activeAgents > 0 ? totalProgress / activeAgents : 0;

    // 全エージェント完了チェック
    const allCompleted = Array.from(session.agents.values()).every(
      agent => agent.status === AgentStatus.COMPLETED
    );

    if (allCompleted && session.status === 'active') {
      this.endSession(sessionId, 'completed');
    }
  }

  /**
   * アラートをチェック
   */
  private checkAlerts(sessionId: string, agentName: AgentName, agent: AgentInfo): void {
    const thresholds = this.options.alertThresholds;

    // 実行時間チェック
    if (agent.metrics?.executionTime && 
        agent.metrics.executionTime > thresholds.executionTime!) {
      this.emit('alert:execution_time', {
        sessionId,
        agentName,
        executionTime: agent.metrics.executionTime,
        threshold: thresholds.executionTime
      });
    }

    // メモリ使用量チェック
    if (agent.metrics?.memoryUsage &&
        agent.metrics.memoryUsage > thresholds.memoryUsage!) {
      this.emit('alert:memory', {
        sessionId,
        agentName,
        memoryUsage: agent.metrics.memoryUsage,
        threshold: thresholds.memoryUsage
      });
    }

    // エラー率チェック
    if (agent.metrics?.errorCount && agent.metrics?.apiCalls) {
      const errorRate = (agent.metrics.errorCount / agent.metrics.apiCalls) * 100;
      if (errorRate > thresholds.errorRate!) {
        this.emit('alert:error_rate', {
          sessionId,
          agentName,
          errorRate,
          threshold: thresholds.errorRate
        });
      }
    }
  }

  /**
   * セッションタイムアウト監視
   */
  private startSessionTimeout(sessionId: string): void {
    const timer = setTimeout(() => {
      const session = this.sessions.get(sessionId);
      if (session && session.status === 'active') {
        logger.warn('Session timeout', { sessionId });
        
        // タイムアウトしたエージェントをマーク
        session.agents.forEach(agent => {
          if (agent.status === AgentStatus.RUNNING) {
            agent.status = AgentStatus.TIMEOUT;
          }
        });
        
        this.endSession(sessionId, 'failed');
      }
    }, this.options.maxSessionDuration);

    this.activeMonitors.set(sessionId, timer);
  }

  /**
   * メトリクス収集を開始
   */
  private startMetricsCollection(): void {
    this.metricsTimer = setInterval(() => {
      this.sessions.forEach((session, sessionId) => {
        if (session.status === 'active') {
          session.agents.forEach((agent, agentName) => {
            if (agent.status === AgentStatus.RUNNING) {
              // シミュレートされたメトリクス（実際はプロセスから取得）
              this.updateMetrics(sessionId, agentName, {
                memoryUsage: Math.random() * 100,
                cpuUsage: Math.random() * 100,
                apiCalls: agent.metrics?.apiCalls || 0
              });
            }
          });
        }
      });
    }, this.options.metricsInterval);
  }

  /**
   * 状態変更をログ
   */
  private logStatusChange(
    sessionId: string,
    agentName: AgentName,
    previousStatus: AgentStatus,
    newStatus: AgentStatus
  ): void {
    if (this.options.enableTrace) {
      logger.debug('Agent status change', {
        sessionId,
        agentName,
        previousStatus,
        newStatus
      });
    }
  }

  /**
   * セッション情報を取得
   */
  getSession(sessionId: string): SessionInfo | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * アクティブセッション数を取得
   */
  getActiveSessionCount(): number {
    let count = 0;
    this.sessions.forEach(session => {
      if (session.status === 'active') count++;
    });
    return count;
  }

  /**
   * 統計情報を取得
   */
  getStats(): {
    activeSessions: number;
    totalSessions: number;
    averageProgress: number;
    errorRate: number;
  } {
    let activeSessions = 0;
    let totalProgress = 0;
    let totalErrors = 0;
    let totalAgents = 0;

    this.sessions.forEach(session => {
      if (session.status === 'active') {
        activeSessions++;
        totalProgress += session.totalProgress;
      }
      totalErrors += session.errors.length;
      totalAgents += session.agents.size;
    });

    return {
      activeSessions,
      totalSessions: this.sessions.size,
      averageProgress: activeSessions > 0 ? totalProgress / activeSessions : 0,
      errorRate: totalAgents > 0 ? (totalErrors / totalAgents) * 100 : 0
    };
  }

  /**
   * クリーンアップ
   */
  cleanup(): void {
    if (this.metricsTimer) {
      clearInterval(this.metricsTimer);
      this.metricsTimer = null;
    }

    this.activeMonitors.forEach(timer => clearTimeout(timer));
    this.activeMonitors.clear();

    this.removeAllListeners();
  }
}

// シングルトンインスタンス
export const agentMonitor = new AgentMonitorService();