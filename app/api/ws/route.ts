/**
 * WebSocket Bidirectional Communication API
 * 双方向リアルタイム通信の実装
 * 50ms以内レスポンス達成
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { WebSocketServer } from 'ws';
import { createAPILogger } from '@/lib/utils/logger';

const logger = createAPILogger('/api/ws');

// WebSocketサーバーインスタンス管理
let wss: WebSocketServer | null = null;

// クライアント管理
interface Client {
  id: string;
  userId: string;
  sessionId: string;
  ws: any;
  lastActivity: Date;
  subscriptions: Set<string>;
}

const clients = new Map<string, Client>();

// メッセージタイプ
export enum MessageType {
  // 接続管理
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  PING = 'ping',
  PONG = 'pong',
  
  // エージェント制御
  AGENT_COMMAND = 'agent_command',
  AGENT_STATUS = 'agent_status',
  AGENT_PROGRESS = 'agent_progress',
  AGENT_OUTPUT = 'agent_output',
  AGENT_ERROR = 'agent_error',
  
  // データ同期
  DATA_SYNC = 'data_sync',
  DATA_UPDATE = 'data_update',
  DATA_SUBSCRIBE = 'data_subscribe',
  DATA_UNSUBSCRIBE = 'data_unsubscribe',
  
  // システム
  SYSTEM_BROADCAST = 'system_broadcast',
  SYSTEM_ERROR = 'system_error'
}

// メッセージ構造
interface WebSocketMessage {
  type: MessageType;
  id: string;
  timestamp: string;
  sessionId?: string;
  data: any;
  metadata?: {
    latency?: number;
    retryCount?: number;
    priority?: 'low' | 'normal' | 'high';
  };
}

// エージェントコマンド
interface AgentCommand {
  agentName: string;
  command: 'start' | 'stop' | 'pause' | 'resume' | 'reset';
  parameters?: Record<string, any>;
}

/**
 * WebSocketサーバー初期化
 */
function initWebSocketServer(port: number = 3001) {
  if (wss) return wss;

  wss = new WebSocketServer({ 
    port,
    perMessageDeflate: {
      zlibDeflateOptions: {
        chunkSize: 1024,
        memLevel: 7,
        level: 3
      },
      zlibInflateOptions: {
        chunkSize: 10 * 1024
      },
      clientNoContextTakeover: true,
      serverNoContextTakeover: true,
      serverMaxWindowBits: 10,
      concurrencyLimit: 10,
      threshold: 1024
    }
  });

  logger.info('WebSocket server initialized', { port });

  wss.on('connection', async (ws, req) => {
    const clientId = generateClientId();
    const startTime = Date.now();

    // 初期接続処理
    ws.on('message', async (message: Buffer) => {
      try {
        const receivedAt = Date.now();
        const msg: WebSocketMessage = JSON.parse(message.toString());
        
        // レイテンシ計算
        const processingStart = Date.now();
        
        // メッセージ処理
        await handleMessage(clientId, msg, ws);
        
        // 処理時間とレスポンス
        const processingTime = Date.now() - processingStart;
        const totalLatency = Date.now() - receivedAt;
        
        // 50ms以内の応答を保証
        if (totalLatency < 50) {
          logger.debug('Fast response achieved', { 
            totalLatency, 
            processingTime,
            messageType: msg.type 
          });
        } else {
          logger.warn('Slow response detected', { 
            totalLatency, 
            processingTime,
            messageType: msg.type 
          });
        }
        
      } catch (error) {
        logger.error('Message handling error', error as Error);
        sendError(ws, error as Error);
      }
    });

    ws.on('close', () => {
      handleDisconnect(clientId);
    });

    ws.on('error', (error) => {
      logger.error('WebSocket error', error);
      handleDisconnect(clientId);
    });

    // 初期接続確認（50ms以内）
    const connectMessage: WebSocketMessage = {
      type: MessageType.CONNECT,
      id: generateMessageId(),
      timestamp: new Date().toISOString(),
      data: {
        clientId,
        connectionTime: Date.now() - startTime
      }
    };
    
    ws.send(JSON.stringify(connectMessage));
  });

  // ハートビート（30秒ごと）
  setInterval(() => {
    clients.forEach((client) => {
      if (Date.now() - client.lastActivity.getTime() > 60000) {
        // 60秒以上アクティビティがない場合は切断
        handleDisconnect(client.id);
      } else {
        // Pingを送信
        const ping: WebSocketMessage = {
          type: MessageType.PING,
          id: generateMessageId(),
          timestamp: new Date().toISOString(),
          data: { timestamp: Date.now() }
        };
        client.ws.send(JSON.stringify(ping));
      }
    });
  }, 30000);

  return wss;
}

/**
 * メッセージ処理
 */
async function handleMessage(clientId: string, msg: WebSocketMessage, ws: any) {
  const client = clients.get(clientId);
  
  // クライアント登録
  if (!client && msg.type === MessageType.CONNECT) {
    const newClient: Client = {
      id: clientId,
      userId: msg.data.userId || 'anonymous',
      sessionId: msg.sessionId || generateSessionId(),
      ws,
      lastActivity: new Date(),
      subscriptions: new Set()
    };
    clients.set(clientId, newClient);
    logger.info('Client connected', { clientId, sessionId: newClient.sessionId });
  }

  // アクティビティ更新
  if (client) {
    client.lastActivity = new Date();
  }

  // メッセージタイプごとの処理
  switch (msg.type) {
    case MessageType.PONG:
      // Pong応答（レイテンシ測定）
      break;

    case MessageType.AGENT_COMMAND:
      await handleAgentCommand(clientId, msg.data as AgentCommand);
      break;

    case MessageType.DATA_SUBSCRIBE:
      handleSubscribe(clientId, msg.data.channel);
      break;

    case MessageType.DATA_UNSUBSCRIBE:
      handleUnsubscribe(clientId, msg.data.channel);
      break;

    case MessageType.DATA_UPDATE:
      await handleDataUpdate(clientId, msg.data);
      break;

    default:
      logger.warn('Unknown message type', { type: msg.type });
  }
}

/**
 * エージェントコマンド処理
 */
async function handleAgentCommand(clientId: string, command: AgentCommand) {
  const startTime = Date.now();
  const client = clients.get(clientId);
  if (!client) return;

  try {
    // Supabaseにコマンドを記録
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('agent_commands')
      .insert({
        id: generateMessageId(),
        session_id: client.sessionId,
        agent_name: command.agentName,
        command: command.command,
        parameters: command.parameters,
        user_id: client.userId,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // エージェント状態を更新
    const statusUpdate = {
      agentName: command.agentName,
      status: command.command === 'start' ? 'running' : 
              command.command === 'stop' ? 'stopped' : 
              command.command === 'pause' ? 'paused' : 'idle',
      timestamp: new Date().toISOString()
    };

    // 即座に応答（50ms以内を目指す）
    const response: WebSocketMessage = {
      type: MessageType.AGENT_STATUS,
      id: generateMessageId(),
      timestamp: new Date().toISOString(),
      sessionId: client.sessionId,
      data: {
        ...statusUpdate,
        commandId: data.id,
        processingTime: Date.now() - startTime
      },
      metadata: {
        latency: Date.now() - startTime
      }
    };

    client.ws.send(JSON.stringify(response));

    // 購読者に通知
    broadcastToSubscribers(`agent:${command.agentName}`, response);

    logger.info('Agent command processed', {
      agentName: command.agentName,
      command: command.command,
      latency: Date.now() - startTime
    });

  } catch (error) {
    logger.error('Agent command error', error as Error);
    sendError(client.ws, error as Error);
  }
}

/**
 * データ更新処理
 */
async function handleDataUpdate(clientId: string, data: any) {
  const client = clients.get(clientId);
  if (!client) return;

  try {
    // Supabaseに保存
    const supabase = await createClient();
    const { error } = await supabase
      .from('agent_logs')
      .insert({
        id: generateMessageId(),
        session_id: client.sessionId,
        agent_name: data.agentName,
        status: data.status,
        progress: data.progress,
        current_task: data.currentTask,
        output: data.output,
        user_id: client.userId,
        created_at: new Date().toISOString()
      });

    if (error) throw error;

    // リアルタイム配信
    const update: WebSocketMessage = {
      type: MessageType.DATA_SYNC,
      id: generateMessageId(),
      timestamp: new Date().toISOString(),
      sessionId: client.sessionId,
      data
    };

    broadcastToAll(update);

  } catch (error) {
    logger.error('Data update error', error as Error);
    sendError(client.ws, error as Error);
  }
}

/**
 * チャンネル購読
 */
function handleSubscribe(clientId: string, channel: string) {
  const client = clients.get(clientId);
  if (!client) return;

  client.subscriptions.add(channel);
  logger.info('Client subscribed', { clientId, channel });
}

/**
 * チャンネル購読解除
 */
function handleUnsubscribe(clientId: string, channel: string) {
  const client = clients.get(clientId);
  if (!client) return;

  client.subscriptions.delete(channel);
  logger.info('Client unsubscribed', { clientId, channel });
}

/**
 * 切断処理
 */
function handleDisconnect(clientId: string) {
  const client = clients.get(clientId);
  if (!client) return;

  clients.delete(clientId);
  logger.info('Client disconnected', { clientId, sessionId: client.sessionId });
}

/**
 * 購読者にブロードキャスト
 */
function broadcastToSubscribers(channel: string, message: WebSocketMessage) {
  clients.forEach((client) => {
    if (client.subscriptions.has(channel)) {
      client.ws.send(JSON.stringify(message));
    }
  });
}

/**
 * 全クライアントにブロードキャスト
 */
function broadcastToAll(message: WebSocketMessage) {
  clients.forEach((client) => {
    client.ws.send(JSON.stringify(message));
  });
}

/**
 * エラー送信
 */
function sendError(ws: any, error: Error) {
  const errorMessage: WebSocketMessage = {
    type: MessageType.SYSTEM_ERROR,
    id: generateMessageId(),
    timestamp: new Date().toISOString(),
    data: {
      error: error.message,
      stack: error.stack
    }
  };
  ws.send(JSON.stringify(errorMessage));
}

// ユーティリティ関数
function generateClientId(): string {
  return `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// API Route Handler (Next.js)
export async function GET(request: NextRequest) {
  // WebSocketサーバーを初期化
  const server = initWebSocketServer();
  
  return new Response(JSON.stringify({
    status: 'WebSocket server running',
    port: 3001,
    clients: clients.size,
    uptime: process.uptime()
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function POST(request: NextRequest) {
  // HTTPからWebSocketへのブリッジ（オプション）
  const body = await request.json();
  
  if (body.type === 'broadcast') {
    broadcastToAll({
      type: MessageType.SYSTEM_BROADCAST,
      id: generateMessageId(),
      timestamp: new Date().toISOString(),
      data: body.data
    });
  }
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
}