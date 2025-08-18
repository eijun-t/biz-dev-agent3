/**
 * Simplified SSE Stream API - 30分スプリント実装
 * Worker3のDataFlow.tsxと即座に連携
 */

import { NextRequest } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// 5エージェントの初期状態
const AGENTS = ['Researcher', 'Ideator', 'Critic', 'Analyst', 'Writer'];

/**
 * SSEストリーミング - 認証不要の簡易版
 */
export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  
  // SSEストリームを作成
  const stream = new ReadableStream({
    async start(controller) {
      // 初期接続メッセージ
      const sendEvent = (data: any) => {
        const message = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      // 初期状態を送信
      sendEvent({
        type: 'init',
        timestamp: new Date().toISOString(),
        data: {
          message: 'Connected to SSE stream',
          agents: AGENTS.map(name => ({
            name,
            status: 'idle',
            progress: 0
          }))
        }
      });

      // エージェント状態をシミュレート
      const agentStates = AGENTS.map(name => ({
        name,
        status: 'idle' as 'idle' | 'running' | 'completed',
        progress: 0,
        startTime: 0
      }));

      let currentAgentIndex = 0;
      
      // 100ms間隔で更新
      const interval = setInterval(() => {
        try {
          // 全エージェント完了チェック
          if (currentAgentIndex >= AGENTS.length) {
            sendEvent({
              type: 'complete',
              timestamp: new Date().toISOString(),
              data: {
                message: 'All agents completed',
                totalDuration: Date.now() - agentStates[0].startTime
              }
            });
            clearInterval(interval);
            controller.close();
            return;
          }

          const currentAgent = agentStates[currentAgentIndex];
          
          // エージェントを開始
          if (currentAgent.status === 'idle') {
            currentAgent.status = 'running';
            currentAgent.startTime = Date.now();
          }
          
          // 進捗を更新（10%ずつ）
          currentAgent.progress = Math.min(currentAgent.progress + 10, 100);
          
          // Worker3のDataFlow形式でデータ送信
          sendEvent({
            type: 'progress',
            timestamp: new Date().toISOString(),
            agent: currentAgent.name,
            data: {
              agents: agentStates.map(a => ({
                name: a.name,
                status: a.status,
                progress: a.progress,
                currentTask: a.status === 'running' ? `Processing ${a.name} tasks...` : null
              })),
              totalProgress: agentStates.reduce((sum, a) => sum + a.progress, 0) / AGENTS.length,
              activeAgent: currentAgent.name,
              estimatedCompletion: new Date(Date.now() + (100 - currentAgent.progress) * 100).toISOString()
            }
          });
          
          // エージェント完了
          if (currentAgent.progress >= 100) {
            currentAgent.status = 'completed';
            
            sendEvent({
              type: 'output',
              timestamp: new Date().toISOString(),
              agent: currentAgent.name,
              data: {
                output: generateAgentOutput(currentAgent.name),
                duration: Date.now() - currentAgent.startTime
              }
            });
            
            currentAgentIndex++;
          }
        } catch (error) {
          sendEvent({
            type: 'error',
            timestamp: new Date().toISOString(),
            data: { error: (error as Error).message }
          });
        }
      }, 100); // 100ms間隔

      // クリーンアップ
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    }
  });

  // SSEレスポンスヘッダー
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    }
  });
}

// エージェント出力を生成
function generateAgentOutput(agentName: string): any {
  const outputs: Record<string, any> = {
    Researcher: {
      sources: 10,
      keywords: ['AI', 'automation', 'business'],
      insights: 'Market analysis completed'
    },
    Ideator: {
      ideas: 5,
      topIdea: 'AI-powered platform',
      score: 8.5
    },
    Critic: {
      evaluation: 'High potential',
      risks: ['Competition', 'Complexity'],
      recommendations: ['Focus on MVP']
    },
    Analyst: {
      marketSize: '$10B',
      growthRate: '25%',
      competitors: 12
    },
    Writer: {
      reportUrl: '/reports/demo',
      sections: 8,
      wordCount: 5000
    }
  };
  
  return outputs[agentName] || {};
}