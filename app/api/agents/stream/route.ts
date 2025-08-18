/**
 * Agent Stream API (SSE/WebSocket)
 * 
 * エージェント実行のリアルタイムストリーミング
 * Server-Sent Events (SSE)を使用した進捗配信
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAPILogger } from '@/lib/utils/logger';

const logger = createAPILogger('/api/agents/stream');

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// アクティブな接続を管理
const activeConnections = new Map<string, WritableStreamDefaultWriter>();

// エージェントの状態定義
interface AgentState {
  name: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  progress: number;
  currentTask?: string;
  output?: any;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

// ストリームイベントの型定義
interface StreamEvent {
  type: 'init' | 'progress' | 'output' | 'error' | 'complete';
  timestamp: string;
  sessionId: string;
  agent?: string;
  data: any;
}

/**
 * SSE接続を確立してエージェント実行をストリーミング
 */
export async function GET(request: NextRequest) {
  try {
    // 認証確認
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 });
    }

    // クエリパラメータからセッションID取得
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    
    if (!sessionId) {
      return new Response('Session ID required', { status: 400 });
    }

    // SSEストリームを作成
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const encoder = new TextEncoder();

    // 接続を登録
    activeConnections.set(`${sessionId}-${user.id}`, writer);
    
    // 初期接続イベントを送信
    await sendEvent(writer, encoder, {
      type: 'init',
      timestamp: new Date().toISOString(),
      sessionId,
      data: {
        message: 'Connected to agent stream',
        agents: getInitialAgentStates()
      }
    });

    // エージェント実行の監視を開始
    startAgentMonitoring(sessionId, writer, encoder);

    // クライアント切断時のクリーンアップ
    request.signal.addEventListener('abort', () => {
      activeConnections.delete(`${sessionId}-${user.id}`);
      logger.info('Client disconnected', { sessionId, userId: user.id });
    });

    // SSEレスポンスを返す
    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Nginxのバッファリング無効化
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    logger.error('Stream connection error', error as Error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

/**
 * エージェント実行を監視してイベントを配信
 */
async function startAgentMonitoring(
  sessionId: string,
  writer: WritableStreamDefaultWriter,
  encoder: TextEncoder
) {
  const agents: AgentState[] = [
    { name: 'Researcher', status: 'idle', progress: 0 },
    { name: 'Ideator', status: 'idle', progress: 0 },
    { name: 'Critic', status: 'idle', progress: 0 },
    { name: 'Analyst', status: 'idle', progress: 0 },
    { name: 'Writer', status: 'idle', progress: 0 }
  ];

  // Supabase Realtimeから実際のデータを取得
  const supabase = await createClient();
  
  // agent-logsテーブルを監視
  const subscription = supabase
    .channel(`agent-logs:${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'agent_logs',
        filter: `session_id=eq.${sessionId}`
      },
      async (payload) => {
        // リアルタイムデータを配信
        const agentName = payload.new?.agent_name || 'Unknown';
        const status = payload.new?.status || 'idle';
        const progress = payload.new?.progress || 0;
        
        await sendEvent(writer, encoder, {
          type: 'progress',
          timestamp: new Date().toISOString(),
          sessionId,
          agent: agentName,
          data: {
            status,
            progress,
            currentTask: payload.new?.current_task,
            output: payload.new?.output,
            estimatedTime: calculateEstimatedTime({ progress, startedAt: new Date(payload.new?.started_at) })
          }
        });
      }
    )
    .subscribe();

  // 既存エージェント状態を取得
  const { data: existingLogs } = await supabase
    .from('agent_logs')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  // 既存ログを即座に配信
  if (existingLogs) {
    for (const log of existingLogs) {
      await sendEvent(writer, encoder, {
        type: 'progress',
        timestamp: log.created_at,
        sessionId,
        agent: log.agent_name,
        data: {
          status: log.status,
          progress: log.progress,
          currentTask: log.current_task,
          output: log.output
        }
      });
    }
  }

  // 高頻度更新インターバル（100ms）
  const interval = setInterval(async () => {
    try {
      // エージェントの最新状態を取得
      const { data: latestStates } = await supabase
        .from('agent_logs')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!latestStates || latestStates.length === 0) return;

      // 各エージェントの状態を更新
      for (const state of latestStates) {
        const agent = agents.find(a => a.name === state.agent_name);
        if (agent) {
          agent.status = state.status as any;
          agent.progress = state.progress;
          agent.currentTask = state.current_task;
        }
      }

      // 全体進捗を計算
      const totalProgress = agents.reduce((sum, a) => sum + a.progress, 0) / agents.length;
      
      // Worker3のDataFlow.tsに適合するフォーマットで配信
      await sendEvent(writer, encoder, {
        type: 'progress',
        timestamp: new Date().toISOString(),
        sessionId,
        data: {
          agents: agents.map(a => ({
            name: a.name,
            status: a.status,
            progress: a.progress,
            currentTask: a.currentTask
          })),
          totalProgress,
          estimatedCompletion: calculateEstimatedCompletion(agents)
        }
      });

      // 完了チェック
      if (agents.every(a => a.progress >= 100)) {
        await sendEvent(writer, encoder, {
          type: 'complete',
          timestamp: new Date().toISOString(),
          sessionId,
          data: {
            message: 'All agents completed successfully',
            summary: generateSummary(agents)
          }
        });
        clearInterval(interval);
        subscription.unsubscribe();
      }
      
      // 進捗イベントを送信
      await sendEvent(writer, encoder, {
        type: 'progress',
        timestamp: new Date().toISOString(),
        sessionId,
        agent: currentAgent.name,
        data: {
          status: currentAgent.status,
          progress: currentAgent.progress,
          currentTask: currentAgent.currentTask,
          estimatedTime: calculateEstimatedTime(currentAgent)
        }
      });

      // エージェントが完了したら次へ
      if (currentAgent.progress >= 100) {
        currentAgent.status = 'completed';
        currentAgent.completedAt = new Date();
        currentAgent.output = generateAgentOutput(currentAgent.name);
        
        // 出力イベントを送信
        await sendEvent(writer, encoder, {
          type: 'output',
          timestamp: new Date().toISOString(),
          sessionId,
          agent: currentAgent.name,
          data: {
            output: currentAgent.output,
            duration: currentAgent.completedAt.getTime() - currentAgent.startedAt!.getTime()
          }
        });
        
        currentAgentIndex++;
      }
    } catch (error) {
      logger.error('Monitoring error', error as Error, { sessionId });
      
      // エラーイベントを送信
      await sendEvent(writer, encoder, {
        type: 'error',
        timestamp: new Date().toISOString(),
        sessionId,
        data: {
          error: (error as Error).message,
          agent: agents[currentAgentIndex]?.name
        }
      });
      
      clearInterval(interval);
    }
  }, 100); // 100ms間隔で更新
}

/**
 * SSEイベントを送信
 */
async function sendEvent(
  writer: WritableStreamDefaultWriter,
  encoder: TextEncoder,
  event: StreamEvent
) {
  const eventData = `data: ${JSON.stringify(event)}\n\n`;
  await writer.write(encoder.encode(eventData));
}

/**
 * 初期エージェント状態を取得
 */
function getInitialAgentStates(): AgentState[] {
  return [
    { name: 'Researcher', status: 'idle', progress: 0 },
    { name: 'Ideator', status: 'idle', progress: 0 },
    { name: 'Critic', status: 'idle', progress: 0 },
    { name: 'Analyst', status: 'idle', progress: 0 },
    { name: 'Writer', status: 'idle', progress: 0 }
  ];
}

/**
 * 推定残り時間を計算
 */
function calculateEstimatedTime(data: { progress: number; startedAt?: Date }): number {
  if (data.progress === 0) return 30000; // 30秒
  if (!data.startedAt) return 0;
  
  const elapsed = Date.now() - data.startedAt.getTime();
  const rate = data.progress / elapsed;
  const remaining = (100 - data.progress) / rate;
  
  return Math.round(remaining);
}

/**
 * 完了予定時刻を計算
 */
function calculateEstimatedCompletion(agents: AgentState[]): string {
  const remainingTimes = agents
    .filter(a => a.status === 'running' && a.progress < 100)
    .map(a => calculateEstimatedTime({ 
      progress: a.progress, 
      startedAt: a.startedAt 
    }));
  
  if (remainingTimes.length === 0) {
    return new Date().toISOString();
  }
  
  const maxRemaining = Math.max(...remainingTimes);
  return new Date(Date.now() + maxRemaining).toISOString();
}

/**
 * エージェント出力を生成（シミュレーション）
 */
function generateAgentOutput(agentName: string): any {
  const outputs: Record<string, any> = {
    Researcher: {
      sources: 10,
      keywords: ['AI', 'automation', 'business'],
      insights: 'Market analysis completed'
    },
    Ideator: {
      ideas: 5,
      topIdea: 'AI-powered business automation platform',
      score: 8.5
    },
    Critic: {
      evaluation: 'High potential',
      risks: ['Market competition', 'Technical complexity'],
      recommendations: ['Focus on niche market', 'MVP first']
    },
    Analyst: {
      marketSize: '$10B',
      growthRate: '25%',
      competitors: 12,
      opportunity: 'High'
    },
    Writer: {
      reportUrl: '/reports/sample-123',
      sections: 8,
      wordCount: 5000,
      format: 'HTML'
    }
  };
  
  return outputs[agentName] || {};
}

/**
 * 実行サマリーを生成
 */
function generateSummary(agents: AgentState[]): any {
  const totalDuration = agents.reduce((sum, agent) => {
    if (agent.startedAt && agent.completedAt) {
      return sum + (agent.completedAt.getTime() - agent.startedAt.getTime());
    }
    return sum;
  }, 0);
  
  return {
    totalAgents: agents.length,
    completed: agents.filter(a => a.status === 'completed').length,
    failed: agents.filter(a => a.status === 'error').length,
    totalDuration,
    averageDuration: totalDuration / agents.length
  };
}

/**
 * 特定のセッションにイベントをブロードキャスト
 */
export async function broadcastToSession(sessionId: string, event: StreamEvent) {
  const encoder = new TextEncoder();
  
  for (const [key, writer] of activeConnections.entries()) {
    if (key.startsWith(sessionId)) {
      try {
        await sendEvent(writer, encoder, event);
      } catch (error) {
        // 送信に失敗した接続は削除
        activeConnections.delete(key);
      }
    }
  }
}