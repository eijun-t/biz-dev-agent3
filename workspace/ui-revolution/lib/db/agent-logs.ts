/**
 * Agent Logs Database Layer
 * エージェントログの永続化とクエリ
 */

import { createClient } from '@/lib/supabase/server';
import { createServiceLogger } from '@/lib/utils/logger';

const logger = createServiceLogger('AgentLogsDB');

// ログエントリの型定義
export interface AgentLogEntry {
  id: string;
  sessionId: string;
  agentName: string;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'failed';
  progress: number;
  currentTask?: string;
  output?: any;
  error?: string;
  metrics?: AgentMetrics;
  userId: string;
  createdAt: Date;
  updatedAt?: Date;
}

// エージェントメトリクス
export interface AgentMetrics {
  executionTime?: number;
  apiCalls?: number;
  dataProcessed?: number;
  memoryUsage?: number;
  cpuUsage?: number;
  throughput?: number;
  latency?: number;
}

// コマンドログ
export interface AgentCommandLog {
  id: string;
  sessionId: string;
  agentName: string;
  command: string;
  parameters?: Record<string, any>;
  userId: string;
  executedAt: Date;
  result?: any;
  error?: string;
}

// クエリオプション
export interface QueryOptions {
  sessionId?: string;
  agentName?: string;
  status?: string;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
  orderBy?: 'createdAt' | 'updatedAt' | 'progress';
  orderDirection?: 'asc' | 'desc';
}

/**
 * エージェントログデータベースクラス
 */
export class AgentLogsDB {
  private static instance: AgentLogsDB;

  public static getInstance(): AgentLogsDB {
    if (!AgentLogsDB.instance) {
      AgentLogsDB.instance = new AgentLogsDB();
    }
    return AgentLogsDB.instance;
  }

  /**
   * ログエントリを作成
   */
  async createLog(entry: Partial<AgentLogEntry>): Promise<AgentLogEntry> {
    try {
      const supabase = await createClient();
      
      const data = {
        id: entry.id || this.generateId(),
        session_id: entry.sessionId,
        agent_name: entry.agentName,
        status: entry.status,
        progress: entry.progress || 0,
        current_task: entry.currentTask,
        output: entry.output,
        error: entry.error,
        metrics: entry.metrics,
        user_id: entry.userId,
        created_at: new Date().toISOString()
      };

      const { data: result, error } = await supabase
        .from('agent_logs')
        .insert(data)
        .select()
        .single();

      if (error) throw error;

      logger.info('Log entry created', { 
        id: result.id, 
        agentName: entry.agentName 
      });

      return this.transformLog(result);

    } catch (error) {
      logger.error('Failed to create log entry', error as Error);
      throw error;
    }
  }

  /**
   * バッチでログを作成
   */
  async createBatchLogs(entries: Partial<AgentLogEntry>[]): Promise<AgentLogEntry[]> {
    try {
      const supabase = await createClient();
      
      const data = entries.map(entry => ({
        id: entry.id || this.generateId(),
        session_id: entry.sessionId,
        agent_name: entry.agentName,
        status: entry.status,
        progress: entry.progress || 0,
        current_task: entry.currentTask,
        output: entry.output,
        error: entry.error,
        metrics: entry.metrics,
        user_id: entry.userId,
        created_at: new Date().toISOString()
      }));

      const { data: results, error } = await supabase
        .from('agent_logs')
        .insert(data)
        .select();

      if (error) throw error;

      logger.info('Batch logs created', { count: results?.length || 0 });

      return results ? results.map(this.transformLog) : [];

    } catch (error) {
      logger.error('Failed to create batch logs', error as Error);
      throw error;
    }
  }

  /**
   * ログを更新
   */
  async updateLog(id: string, updates: Partial<AgentLogEntry>): Promise<AgentLogEntry> {
    try {
      const supabase = await createClient();
      
      const data: any = {
        updated_at: new Date().toISOString()
      };

      if (updates.status !== undefined) data.status = updates.status;
      if (updates.progress !== undefined) data.progress = updates.progress;
      if (updates.currentTask !== undefined) data.current_task = updates.currentTask;
      if (updates.output !== undefined) data.output = updates.output;
      if (updates.error !== undefined) data.error = updates.error;
      if (updates.metrics !== undefined) data.metrics = updates.metrics;

      const { data: result, error } = await supabase
        .from('agent_logs')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      logger.info('Log entry updated', { id });

      return this.transformLog(result);

    } catch (error) {
      logger.error('Failed to update log entry', error as Error);
      throw error;
    }
  }

  /**
   * ログをクエリ
   */
  async queryLogs(options: QueryOptions = {}): Promise<{
    logs: AgentLogEntry[];
    total: number;
  }> {
    try {
      const supabase = await createClient();
      
      let query = supabase
        .from('agent_logs')
        .select('*', { count: 'exact' });

      // フィルタ適用
      if (options.sessionId) {
        query = query.eq('session_id', options.sessionId);
      }
      if (options.agentName) {
        query = query.eq('agent_name', options.agentName);
      }
      if (options.status) {
        query = query.eq('status', options.status);
      }
      if (options.userId) {
        query = query.eq('user_id', options.userId);
      }
      if (options.startDate) {
        query = query.gte('created_at', options.startDate.toISOString());
      }
      if (options.endDate) {
        query = query.lte('created_at', options.endDate.toISOString());
      }

      // ソート
      const orderBy = options.orderBy || 'createdAt';
      const orderDirection = options.orderDirection || 'desc';
      query = query.order(
        orderBy === 'createdAt' ? 'created_at' : 
        orderBy === 'updatedAt' ? 'updated_at' : 
        'progress',
        { ascending: orderDirection === 'asc' }
      );

      // ページネーション
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.range(
          options.offset,
          options.offset + (options.limit || 10) - 1
        );
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        logs: data ? data.map(this.transformLog) : [],
        total: count || 0
      };

    } catch (error) {
      logger.error('Failed to query logs', error as Error);
      throw error;
    }
  }

  /**
   * 最新のログを取得
   */
  async getLatestLogs(
    sessionId: string,
    limit: number = 10
  ): Promise<AgentLogEntry[]> {
    const { logs } = await this.queryLogs({
      sessionId,
      limit,
      orderBy: 'createdAt',
      orderDirection: 'desc'
    });
    return logs;
  }

  /**
   * エージェントの最新状態を取得
   */
  async getAgentStatus(
    sessionId: string,
    agentName: string
  ): Promise<AgentLogEntry | null> {
    const { logs } = await this.queryLogs({
      sessionId,
      agentName,
      limit: 1,
      orderBy: 'createdAt',
      orderDirection: 'desc'
    });
    return logs[0] || null;
  }

  /**
   * セッションの全エージェント状態を取得
   */
  async getSessionStatus(sessionId: string): Promise<Map<string, AgentLogEntry>> {
    const { logs } = await this.queryLogs({
      sessionId,
      orderBy: 'createdAt',
      orderDirection: 'desc'
    });

    const statusMap = new Map<string, AgentLogEntry>();
    
    // 各エージェントの最新状態を取得
    logs.forEach(log => {
      if (!statusMap.has(log.agentName)) {
        statusMap.set(log.agentName, log);
      }
    });

    return statusMap;
  }

  /**
   * コマンドログを記録
   */
  async logCommand(command: Partial<AgentCommandLog>): Promise<AgentCommandLog> {
    try {
      const supabase = await createClient();
      
      const data = {
        id: command.id || this.generateId(),
        session_id: command.sessionId,
        agent_name: command.agentName,
        command: command.command,
        parameters: command.parameters,
        user_id: command.userId,
        executed_at: new Date().toISOString(),
        result: command.result,
        error: command.error
      };

      const { data: result, error } = await supabase
        .from('agent_commands')
        .insert(data)
        .select()
        .single();

      if (error) throw error;

      logger.info('Command logged', { 
        id: result.id,
        command: command.command 
      });

      return this.transformCommand(result);

    } catch (error) {
      logger.error('Failed to log command', error as Error);
      throw error;
    }
  }

  /**
   * メトリクスを集計
   */
  async aggregateMetrics(
    sessionId: string,
    agentName?: string
  ): Promise<{
    totalExecutionTime: number;
    totalApiCalls: number;
    totalDataProcessed: number;
    averageProgress: number;
    successRate: number;
  }> {
    try {
      const { logs } = await this.queryLogs({
        sessionId,
        agentName
      });

      let totalExecutionTime = 0;
      let totalApiCalls = 0;
      let totalDataProcessed = 0;
      let totalProgress = 0;
      let successCount = 0;

      logs.forEach(log => {
        if (log.metrics) {
          totalExecutionTime += log.metrics.executionTime || 0;
          totalApiCalls += log.metrics.apiCalls || 0;
          totalDataProcessed += log.metrics.dataProcessed || 0;
        }
        totalProgress += log.progress;
        if (log.status === 'completed') {
          successCount++;
        }
      });

      return {
        totalExecutionTime,
        totalApiCalls,
        totalDataProcessed,
        averageProgress: logs.length > 0 ? totalProgress / logs.length : 0,
        successRate: logs.length > 0 ? (successCount / logs.length) * 100 : 0
      };

    } catch (error) {
      logger.error('Failed to aggregate metrics', error as Error);
      throw error;
    }
  }

  /**
   * 古いログをクリーンアップ
   */
  async cleanupOldLogs(daysToKeep: number = 30): Promise<number> {
    try {
      const supabase = await createClient();
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const { data, error } = await supabase
        .from('agent_logs')
        .delete()
        .lt('created_at', cutoffDate.toISOString())
        .select();

      if (error) throw error;

      const count = data?.length || 0;
      logger.info('Old logs cleaned up', { count, daysToKeep });

      return count;

    } catch (error) {
      logger.error('Failed to cleanup old logs', error as Error);
      throw error;
    }
  }

  // ヘルパーメソッド
  private transformLog(data: any): AgentLogEntry {
    return {
      id: data.id,
      sessionId: data.session_id,
      agentName: data.agent_name,
      status: data.status,
      progress: data.progress,
      currentTask: data.current_task,
      output: data.output,
      error: data.error,
      metrics: data.metrics,
      userId: data.user_id,
      createdAt: new Date(data.created_at),
      updatedAt: data.updated_at ? new Date(data.updated_at) : undefined
    };
  }

  private transformCommand(data: any): AgentCommandLog {
    return {
      id: data.id,
      sessionId: data.session_id,
      agentName: data.agent_name,
      command: data.command,
      parameters: data.parameters,
      userId: data.user_id,
      executedAt: new Date(data.executed_at),
      result: data.result,
      error: data.error
    };
  }

  private generateId(): string {
    return `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// エクスポート
export const agentLogsDB = AgentLogsDB.getInstance();