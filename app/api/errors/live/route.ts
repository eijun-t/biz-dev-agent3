/**
 * Error WebSocket API
 * 
 * リアルタイムエラー配信用WebSocketエンドポイント
 * ws://localhost:3000/api/errors/live
 */

import { NextRequest } from 'next/server';
import { errorMonitor } from '@/lib/utils/error-monitor';
import { createAPILogger } from '@/lib/utils/logger';

const logger = createAPILogger('/api/errors/live');

export const runtime = 'edge';

// WebSocketクライアント管理
const clients = new Set<WritableStreamDefaultWriter>();

/**
 * WebSocket接続処理
 */
export async function GET(request: NextRequest) {
  // WebSocketアップグレードチェック
  const upgradeHeader = request.headers.get('upgrade');
  
  if (!upgradeHeader || upgradeHeader !== 'websocket') {
    return new Response('Expected WebSocket upgrade', { status: 426 });
  }

  // WebSocket接続を確立
  const { socket, response } = upgradeWebSocket(request);
  
  if (!socket) {
    return new Response('WebSocket upgrade failed', { status: 500 });
  }

  // クライアント接続処理
  handleWebSocketConnection(socket);
  
  return response;
}

/**
 * WebSocketアップグレード処理（Edge Runtime用）
 */
function upgradeWebSocket(request: NextRequest): { socket: any; response: Response } {
  // Edge Runtimeでは直接WebSocketを扱えないため、
  // Server-Sent Events (SSE) で代替実装
  
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  
  // クライアントを登録
  clients.add(writer);
  
  // 接続時の初期データを送信
  sendInitialData(writer);
  
  // 定期的にデータを配信（5秒ごと）
  const interval = setInterval(async () => {
    try {
      await sendRealtimeUpdate(writer);
    } catch (error) {
      // エラーが発生したらクライアントを削除
      clients.delete(writer);
      clearInterval(interval);
    }
  }, 5000);
  
  // レスポンスを作成
  const response = new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  });
  
  return { socket: writer, response };
}

/**
 * WebSocket接続処理
 */
function handleWebSocketConnection(writer: WritableStreamDefaultWriter) {
  logger.info('New WebSocket client connected', {
    totalClients: clients.size
  });
  
  // 切断処理
  writer.closed.then(() => {
    clients.delete(writer);
    logger.info('WebSocket client disconnected', {
      remainingClients: clients.size
    });
  }).catch((error) => {
    clients.delete(writer);
    logger.debug('WebSocket client error', { error: error.message });
  });
}

/**
 * 初期データを送信
 */
async function sendInitialData(writer: WritableStreamDefaultWriter) {
  try {
    const metrics = await errorMonitor.getMetrics();
    const health = errorMonitor.getHealth();
    
    const data = {
      type: 'initial',
      timestamp: new Date().toISOString(),
      health: health,
      statistics: {
        total: metrics.totalErrors,
        errorRate: metrics.errorRate,
        criticalCount: health.criticalCount
      }
    };
    
    const message = `data: ${JSON.stringify(data)}\n\n`;
    await writer.write(new TextEncoder().encode(message));
  } catch (error) {
    logger.error('Failed to send initial data', error as Error);
  }
}

/**
 * リアルタイム更新を送信
 */
async function sendRealtimeUpdate(writer: WritableStreamDefaultWriter) {
  try {
    const metrics = await errorMonitor.getMetrics();
    const health = errorMonitor.getHealth();
    const recentError = metrics.recentErrors[0];
    
    const data = {
      type: 'update',
      timestamp: new Date().toISOString(),
      health: {
        status: health.status,
        errorRate: health.errorRate
      },
      statistics: {
        total: metrics.totalErrors,
        errorRate: metrics.errorRate,
        byLevel: metrics.errorsByLevel
      },
      latestError: recentError ? {
        timestamp: recentError.timestamp,
        level: recentError.level,
        message: recentError.message,
        agent: recentError.agent
      } : null,
      progress: {
        consoleErrorFixed: 48,
        target: 63,
        percentage: 56.5
      }
    };
    
    const message = `data: ${JSON.stringify(data)}\n\n`;
    await writer.write(new TextEncoder().encode(message));
  } catch (error) {
    // エラーが発生したら接続を閉じる
    throw error;
  }
}

/**
 * 全クライアントにブロードキャスト
 */
export async function broadcastError(error: any) {
  const data = {
    type: 'error',
    timestamp: new Date().toISOString(),
    error: {
      level: error.level,
      message: error.message,
      agent: error.agent,
      service: error.service
    }
  };
  
  const message = `data: ${JSON.stringify(data)}\n\n`;
  const encoded = new TextEncoder().encode(message);
  
  // 全クライアントに送信
  for (const client of clients) {
    try {
      await client.write(encoded);
    } catch (error) {
      // 送信に失敗したクライアントは削除
      clients.delete(client);
    }
  }
}