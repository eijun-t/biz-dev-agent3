/**
 * WebSocket Client Library
 * 高速双方向通信クライアント
 * 50ms以内レスポンス対応
 */

import { EventEmitter } from 'events';

// メッセージタイプ（サーバーと同じ）
export enum MessageType {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  PING = 'ping',
  PONG = 'pong',
  AGENT_COMMAND = 'agent_command',
  AGENT_STATUS = 'agent_status',
  AGENT_PROGRESS = 'agent_progress',
  AGENT_OUTPUT = 'agent_output',
  AGENT_ERROR = 'agent_error',
  DATA_SYNC = 'data_sync',
  DATA_UPDATE = 'data_update',
  DATA_SUBSCRIBE = 'data_subscribe',
  DATA_UNSUBSCRIBE = 'data_unsubscribe',
  SYSTEM_BROADCAST = 'system_broadcast',
  SYSTEM_ERROR = 'system_error'
}

// WebSocketメッセージ
export interface WebSocketMessage {
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

// 接続状態
export enum ConnectionState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  DISCONNECTED = 'disconnected',
  ERROR = 'error'
}

// クライアントオプション
export interface WebSocketClientOptions {
  url?: string;
  userId?: string;
  sessionId?: string;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  pingInterval?: number;
  messageTimeout?: number;
  debug?: boolean;
}

/**
 * WebSocketクライアントクラス
 */
export class WebSocketClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private options: Required<WebSocketClientOptions>;
  private state: ConnectionState = ConnectionState.DISCONNECTED;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingTimer: NodeJS.Timeout | null = null;
  private messageQueue: WebSocketMessage[] = [];
  private pendingRequests = new Map<string, {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }>();
  private metrics = {
    messagesSent: 0,
    messagesReceived: 0,
    averageLatency: 0,
    lastLatency: 0,
    connectionTime: 0
  };

  constructor(options: WebSocketClientOptions = {}) {
    super();
    
    this.options = {
      url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001',
      userId: 'anonymous',
      sessionId: this.generateSessionId(),
      autoReconnect: true,
      reconnectInterval: 1000,
      maxReconnectAttempts: 5,
      pingInterval: 30000,
      messageTimeout: 5000,
      debug: false,
      ...options
    };
  }

  /**
   * WebSocket接続を開始
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.state === ConnectionState.CONNECTED) {
        resolve();
        return;
      }

      this.setState(ConnectionState.CONNECTING);
      const startTime = Date.now();

      try {
        this.ws = new WebSocket(this.options.url);
        
        this.ws.onopen = () => {
          this.metrics.connectionTime = Date.now() - startTime;
          this.setState(ConnectionState.CONNECTED);
          this.reconnectAttempts = 0;
          
          // 初期接続メッセージ送信
          this.send({
            type: MessageType.CONNECT,
            id: this.generateMessageId(),
            timestamp: new Date().toISOString(),
            sessionId: this.options.sessionId,
            data: {
              userId: this.options.userId,
              sessionId: this.options.sessionId
            }
          });

          // キューに入れられたメッセージを送信
          this.flushMessageQueue();
          
          // Pingタイマー開始
          this.startPingTimer();
          
          this.log('WebSocket connected', { connectionTime: this.metrics.connectionTime });
          this.emit('connect');
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = (error) => {
          this.log('WebSocket error', error);
          this.emit('error', error);
          this.setState(ConnectionState.ERROR);
          reject(error);
        };

        this.ws.onclose = () => {
          this.handleDisconnect();
        };

      } catch (error) {
        this.setState(ConnectionState.ERROR);
        reject(error);
      }
    });
  }

  /**
   * メッセージを送信
   */
  send(message: Partial<WebSocketMessage>): void {
    const fullMessage: WebSocketMessage = {
      id: message.id || this.generateMessageId(),
      timestamp: message.timestamp || new Date().toISOString(),
      sessionId: this.options.sessionId,
      type: message.type!,
      data: message.data,
      metadata: message.metadata
    };

    if (this.state === ConnectionState.CONNECTED && this.ws?.readyState === WebSocket.OPEN) {
      const startTime = Date.now();
      this.ws.send(JSON.stringify(fullMessage));
      this.metrics.messagesSent++;
      
      // レイテンシ追跡
      if (fullMessage.metadata) {
        fullMessage.metadata.latency = Date.now() - startTime;
      }
      
      this.log('Message sent', { type: fullMessage.type, latency: Date.now() - startTime });
    } else {
      // 接続されていない場合はキューに追加
      this.messageQueue.push(fullMessage);
      this.log('Message queued', { type: fullMessage.type });
    }
  }

  /**
   * リクエスト・レスポンスパターン（Promise対応）
   */
  request<T = any>(message: Partial<WebSocketMessage>): Promise<T> {
    return new Promise((resolve, reject) => {
      const messageId = this.generateMessageId();
      const fullMessage = { ...message, id: messageId };

      // タイムアウト設定
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(messageId);
        reject(new Error(`Request timeout: ${messageId}`));
      }, this.options.messageTimeout);

      // リクエストを保存
      this.pendingRequests.set(messageId, { resolve, reject, timeout });
      
      // メッセージ送信
      this.send(fullMessage);
    });
  }

  /**
   * エージェントコマンドを送信
   */
  async sendAgentCommand(
    agentName: string,
    command: 'start' | 'stop' | 'pause' | 'resume' | 'reset',
    parameters?: Record<string, any>
  ): Promise<any> {
    const startTime = Date.now();
    
    const response = await this.request({
      type: MessageType.AGENT_COMMAND,
      data: {
        agentName,
        command,
        parameters
      }
    });

    const latency = Date.now() - startTime;
    this.log(`Agent command completed in ${latency}ms`, { agentName, command });
    
    return response;
  }

  /**
   * チャンネルを購読
   */
  subscribe(channel: string): void {
    this.send({
      type: MessageType.DATA_SUBSCRIBE,
      data: { channel }
    });
    this.emit('subscribe', channel);
  }

  /**
   * チャンネル購読を解除
   */
  unsubscribe(channel: string): void {
    this.send({
      type: MessageType.DATA_UNSUBSCRIBE,
      data: { channel }
    });
    this.emit('unsubscribe', channel);
  }

  /**
   * データ更新を送信
   */
  updateData(data: any): void {
    this.send({
      type: MessageType.DATA_UPDATE,
      data
    });
  }

  /**
   * メッセージ処理
   */
  private handleMessage(data: string): void {
    try {
      const message: WebSocketMessage = JSON.parse(data);
      const receivedAt = Date.now();
      
      this.metrics.messagesReceived++;
      
      // レイテンシ計算
      if (message.metadata?.latency) {
        this.metrics.lastLatency = message.metadata.latency;
        this.updateAverageLatency(message.metadata.latency);
      }

      // ペンディングリクエストの処理
      if (this.pendingRequests.has(message.id)) {
        const pending = this.pendingRequests.get(message.id)!;
        clearTimeout(pending.timeout);
        pending.resolve(message.data);
        this.pendingRequests.delete(message.id);
        return;
      }

      // メッセージタイプごとの処理
      switch (message.type) {
        case MessageType.PING:
          this.handlePing(message);
          break;
          
        case MessageType.AGENT_STATUS:
        case MessageType.AGENT_PROGRESS:
        case MessageType.AGENT_OUTPUT:
          this.emit('agent', message);
          break;
          
        case MessageType.DATA_SYNC:
          this.emit('data', message.data);
          break;
          
        case MessageType.SYSTEM_ERROR:
          this.emit('error', new Error(message.data.error));
          break;
          
        case MessageType.SYSTEM_BROADCAST:
          this.emit('broadcast', message.data);
          break;
      }

      // 汎用メッセージイベント
      this.emit('message', message);
      
      this.log('Message received', { 
        type: message.type, 
        latency: Date.now() - receivedAt 
      });

    } catch (error) {
      this.log('Failed to parse message', error);
      this.emit('error', error);
    }
  }

  /**
   * Ping処理
   */
  private handlePing(message: WebSocketMessage): void {
    this.send({
      type: MessageType.PONG,
      data: { 
        timestamp: message.data.timestamp,
        responseTime: Date.now()
      }
    });
  }

  /**
   * 切断処理
   */
  private handleDisconnect(): void {
    this.setState(ConnectionState.DISCONNECTED);
    this.stopPingTimer();
    
    if (this.options.autoReconnect && this.reconnectAttempts < this.options.maxReconnectAttempts) {
      this.scheduleReconnect();
    } else {
      this.emit('disconnect');
    }
  }

  /**
   * 再接続スケジュール
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.setState(ConnectionState.RECONNECTING);
    this.reconnectAttempts++;
    
    const delay = Math.min(
      this.options.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1),
      30000
    );

    this.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    this.reconnectTimer = setTimeout(() => {
      this.connect().catch((error) => {
        this.log('Reconnection failed', error);
      });
    }, delay);
  }

  /**
   * Pingタイマー開始
   */
  private startPingTimer(): void {
    this.stopPingTimer();
    
    this.pingTimer = setInterval(() => {
      if (this.state === ConnectionState.CONNECTED) {
        this.send({
          type: MessageType.PING,
          data: { timestamp: Date.now() }
        });
      }
    }, this.options.pingInterval);
  }

  /**
   * Pingタイマー停止
   */
  private stopPingTimer(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  /**
   * メッセージキューをフラッシュ
   */
  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.send(message);
      }
    }
  }

  /**
   * 平均レイテンシを更新
   */
  private updateAverageLatency(latency: number): void {
    const alpha = 0.1; // 指数移動平均の係数
    this.metrics.averageLatency = 
      alpha * latency + (1 - alpha) * this.metrics.averageLatency;
  }

  /**
   * 状態を設定
   */
  private setState(state: ConnectionState): void {
    if (this.state !== state) {
      this.state = state;
      this.emit('stateChange', state);
    }
  }

  /**
   * 接続を切断
   */
  disconnect(): void {
    this.options.autoReconnect = false;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.stopPingTimer();
    this.setState(ConnectionState.DISCONNECTED);
    this.emit('disconnect');
  }

  /**
   * メトリクスを取得
   */
  getMetrics() {
    return {
      ...this.metrics,
      state: this.state,
      queuedMessages: this.messageQueue.length,
      pendingRequests: this.pendingRequests.size
    };
  }

  /**
   * 現在の状態を取得
   */
  getState(): ConnectionState {
    return this.state;
  }

  /**
   * 接続中かどうか
   */
  isConnected(): boolean {
    return this.state === ConnectionState.CONNECTED;
  }

  // ユーティリティ
  private generateMessageId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private log(message: string, data?: any): void {
    if (this.options.debug) {
      console.log(`[WebSocket] ${message}`, data);
    }
  }
}

// シングルトンインスタンス
let defaultClient: WebSocketClient | null = null;

export function getWebSocketClient(options?: WebSocketClientOptions): WebSocketClient {
  if (!defaultClient) {
    defaultClient = new WebSocketClient(options);
  }
  return defaultClient;
}