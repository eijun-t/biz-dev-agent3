/**
 * Agent Status API
 * 
 * エージェントの現在状態を取得・更新
 * Worker3のProgressTracker.tsと連携
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAPILogger } from '@/lib/utils/logger';
import { agentMonitor, AgentName, AgentStatus } from '@/lib/services/agent-monitor';

const logger = createAPILogger('/api/agents/status');

export const runtime = 'edge';

// エージェント状態の型
interface AgentStatusData {
  sessionId: string;
  agentName: string;
  status: string;
  progress: number;
  currentTask?: string;
  output?: any;
  error?: string;
  startedAt?: string;
  completedAt?: string;
  metrics?: {
    executionTime?: number;
    apiCalls?: number;
    dataProcessed?: number;
  };
}

/**
 * エージェント状態を取得
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const agentName = searchParams.get('agent');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    // agent-logsテーブルから状態を取得
    let query = supabase
      .from('agent_logs')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });

    if (agentName) {
      query = query.eq('agent_name', agentName);
    }

    const { data: logs, error } = await query;

    if (error) {
      logger.error('Failed to fetch agent status', error);
      return NextResponse.json(
        { error: 'Failed to fetch status' },
        { status: 500 }
      );
    }

    // 最新状態を集約
    const statusMap = new Map<string, AgentStatusData>();
    
    logs?.forEach(log => {
      if (!statusMap.has(log.agent_name)) {
        statusMap.set(log.agent_name, {
          sessionId: log.session_id,
          agentName: log.agent_name,
          status: log.status,
          progress: log.progress || 0,
          currentTask: log.current_task,
          output: log.output,
          error: log.error,
          startedAt: log.started_at,
          completedAt: log.completed_at,
          metrics: log.metrics
        });
      }
    });

    // Worker3のDataFlow.tsに適合する形式で返す
    const response = {
      sessionId,
      timestamp: new Date().toISOString(),
      agents: Array.from(statusMap.values()),
      summary: {
        total: statusMap.size,
        running: Array.from(statusMap.values()).filter(a => a.status === 'running').length,
        completed: Array.from(statusMap.values()).filter(a => a.status === 'completed').length,
        failed: Array.from(statusMap.values()).filter(a => a.status === 'failed').length,
        averageProgress: statusMap.size > 0 
          ? Array.from(statusMap.values()).reduce((sum, a) => sum + a.progress, 0) / statusMap.size 
          : 0
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    logger.error('Status API error', error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * エージェント状態を更新
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      sessionId,
      agentName,
      status,
      progress,
      currentTask,
      output,
      error,
      metrics
    } = body;

    // バリデーション
    if (!sessionId || !agentName || !status) {
      return NextResponse.json(
        { error: 'Required fields missing' },
        { status: 400 }
      );
    }

    // agent-logsテーブルに挿入
    const logEntry = {
      id: crypto.randomUUID(),
      session_id: sessionId,
      agent_name: agentName,
      status,
      progress: progress || 0,
      current_task: currentTask,
      output,
      error,
      metrics,
      user_id: user.id,
      created_at: new Date().toISOString(),
      started_at: status === 'running' ? new Date().toISOString() : undefined,
      completed_at: status === 'completed' ? new Date().toISOString() : undefined
    };

    const { data, error: insertError } = await supabase
      .from('agent_logs')
      .insert(logEntry)
      .select()
      .single();

    if (insertError) {
      logger.error('Failed to update agent status', insertError);
      return NextResponse.json(
        { error: 'Failed to update status' },
        { status: 500 }
      );
    }

    // AgentMonitorサービスも更新
    if (agentMonitor.getSession(sessionId)) {
      agentMonitor.updateAgentStatus(
        sessionId,
        agentName as AgentName,
        status as AgentStatus,
        {
          progress,
          currentTask,
          error: error ? new Error(error) : undefined,
          metrics
        }
      );
    }

    logger.info('Agent status updated', {
      sessionId,
      agentName,
      status,
      progress
    });

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    logger.error('Update status error', error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * バッチ更新（複数エージェントの状態を一度に更新）
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { sessionId, updates } = body;

    if (!sessionId || !Array.isArray(updates)) {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }

    // バッチ挿入用のデータを準備
    const logEntries = updates.map(update => ({
      id: crypto.randomUUID(),
      session_id: sessionId,
      agent_name: update.agentName,
      status: update.status,
      progress: update.progress || 0,
      current_task: update.currentTask,
      output: update.output,
      error: update.error,
      metrics: update.metrics,
      user_id: user.id,
      created_at: new Date().toISOString()
    }));

    const { data, error: insertError } = await supabase
      .from('agent_logs')
      .insert(logEntries)
      .select();

    if (insertError) {
      logger.error('Failed to batch update status', insertError);
      return NextResponse.json(
        { error: 'Failed to batch update' },
        { status: 500 }
      );
    }

    logger.info('Batch status update', {
      sessionId,
      count: updates.length
    });

    return NextResponse.json({
      success: true,
      updated: data?.length || 0
    });

  } catch (error) {
    logger.error('Batch update error', error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}