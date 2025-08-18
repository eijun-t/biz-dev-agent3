/**
 * Realtime Service
 * 
 * WebSocket/SSE接続の管理とリアルタイムデータ配信
 */

import { createServiceLogger } from '@/lib/utils/logger';

const logger = createServiceLogger('RealtimeService');

// 接続状態
export enum ConnectionState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error'
}

// イベントタイプ
export enum EventType {
  INIT = 'init',
  PROGRESS = 'progress',
  OUTPUT = 'output',
  ERROR = 'error',
  COMPLETE = 'complete',
  HEARTBEAT = 'heartbeat'
}

// リアルタイムイベント
export interface RealtimeEvent {
  type: EventType;
  timestamp: string;
  sessionId: string;
  agent?: string;
  data: any;
}

// 接続オプション
export interface ConnectionOptions {
  url: string;
  sessionId: string;
  reconnect?: boolean;
  reconnectInterval?: number;
  reconnectAttempts?: number;
  heartbeatInterval?: number;
  onMessage?: (event: RealtimeEvent) => void;
  onStateChange?: (state: ConnectionState) => void;
  onError?: (error: Error) => void;
}

/**
 * リアルタイムサービスクラス
 */
export class RealtimeService {
  private eventSource: EventSource | null = null;
  private state: ConnectionState = ConnectionState.DISCONNECTED;
  private options: Required<ConnectionOptions>;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private reconnectCount = 0;
  private messageQueue: RealtimeEvent[] = [];
  private lastEventTime = Date.now();

  constructor(options: ConnectionOptions) {
    this.options = {
      reconnect: true,
      reconnectInterval: 1000,
      reconnectAttempts: 5,
      heartbeatInterval: 30000,
      onMessage: () => {},
      onStateChange: () => {},
      onError: () => {},
      ...options
    };
  }

  /**
   * 接続を開始
   */
  public connect(): void {
    if (this.state === ConnectionState.CONNECTED || 
        this.state === ConnectionState.CONNECTING) {
      return;
    }

    this.setState(ConnectionState.CONNECTING);
    this.establishConnection();
  }

  /**
   * 接続を確立
   */
  private establishConnection(): void {
    try {
      const url = `${this.options.url}?sessionId=${this.options.sessionId}`;
      this.eventSource = new EventSource(url);

      this.eventSource.onopen = () => {
        logger.info('Connection established', { sessionId: this.options.sessionId });
        this.setState(ConnectionState.CONNECTED);
        this.reconnectCount = 0;
        this.startHeartbeat();
        this.processQueuedMessages();
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data: RealtimeEvent = JSON.parse(event.data);
          this.lastEventTime = Date.now();
          this.handleMessage(data);
        } catch (error) {
          logger.error('Failed to parse message', error as Error);
        }
      };

      this.eventSource.onerror = (error) => {
        logger.error('Connection error', new Error('EventSource error'));
        this.handleConnectionError();
      };

    } catch (error) {
      logger.error('Failed to establish connection', error as Error);
      this.setState(ConnectionState.ERROR);
      this.options.onError(error as Error);
      this.scheduleReconnect();
    }
  }

  /**
   * メッセージを処理
   */
  private handleMessage(event: RealtimeEvent): void {
    // ハートビートメッセージはスキップ
    if (event.type === EventType.HEARTBEAT) {
      return;
    }

    // コールバックを実行
    this.options.onMessage(event);

    // 特定のイベントタイプに応じた処理
    switch (event.type) {
      case EventType.COMPLETE:
        logger.info('Session completed', { sessionId: event.sessionId });
        break;
      case EventType.ERROR:
        logger.error('Agent error received', new Error(event.data.error));
        break;
    }
  }

  /**
   * 接続エラーを処理
   */
  private handleConnectionError(): void {
    this.cleanup();
    this.setState(ConnectionState.DISCONNECTED);
    
    if (this.options.reconnect && this.reconnectCount < this.options.reconnectAttempts) {
      this.scheduleReconnect();
    } else {
      this.setState(ConnectionState.ERROR);
      this.options.onError(new Error('Maximum reconnection attempts reached'));
    }
  }

  /**
   * 再接続をスケジュール
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    const delay = Math.min(
      this.options.reconnectInterval * Math.pow(2, this.reconnectCount),
      30000 // 最大30秒
    );

    this.setState(ConnectionState.RECONNECTING);
    this.reconnectCount++;

    logger.info('Scheduling reconnection', { 
      attempt: this.reconnectCount,
      delay 
    });

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * ハートビートを開始
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatTimer = setInterval(() => {
      const timeSinceLastEvent = Date.now() - this.lastEventTime;
      
      // 長時間イベントがない場合は接続を確認
      if (timeSinceLastEvent > this.options.heartbeatInterval * 2) {
        logger.warn('No events received, checking connection');
        this.handleConnectionError();
      }
    }, this.options.heartbeatInterval);
  }

  /**
   * ハートビートを停止
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * 状態を設定
   */
  private setState(state: ConnectionState): void {
    if (this.state !== state) {
      this.state = state;
      this.options.onStateChange(state);
    }
  }

  /**
   * キューに入れられたメッセージを処理
   */
  private processQueuedMessages(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.handleMessage(message);
      }
    }
  }

  /**
   * 接続を切断
   */
  public disconnect(): void {
    logger.info('Disconnecting', { sessionId: this.options.sessionId });
    this.cleanup();
    this.setState(ConnectionState.DISCONNECTED);
  }

  /**
   * リソースをクリーンアップ
   */
  private cleanup(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    this.stopHeartbeat();

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * 現在の接続状態を取得
   */
  public getState(): ConnectionState {
    return this.state;
  }

  /**
   * 接続中かどうか
   */
  public isConnected(): boolean {
    return this.state === ConnectionState.CONNECTED;
  }

  /**
   * メッセージをキューに追加（オフライン時）
   */
  public queueMessage(event: RealtimeEvent): void {
    if (this.messageQueue.length < 100) { // 最大100メッセージ
      this.messageQueue.push(event);
    }
  }

  /**
   * 統計情報を取得
   */
  public getStats(): {
    state: ConnectionState;
    reconnectCount: number;
    queuedMessages: number;
    lastEventTime: number;
    uptime: number;
  } {
    return {
      state: this.state,
      reconnectCount: this.reconnectCount,
      queuedMessages: this.messageQueue.length,
      lastEventTime: this.lastEventTime,
      uptime: this.state === ConnectionState.CONNECTED 
        ? Date.now() - this.lastEventTime 
        : 0
    };
  }
}

/**
 * シングルトンインスタンス管理
 */
class RealtimeManager {
  private static instance: RealtimeManager;
  private connections: Map<string, RealtimeService> = new Map();

  public static getInstance(): RealtimeManager {
    if (!RealtimeManager.instance) {
      RealtimeManager.instance = new RealtimeManager();
    }
    return RealtimeManager.instance;
  }

  /**
   * 接続を作成または取得
   */
  public getConnection(sessionId: string, options?: Partial<ConnectionOptions>): RealtimeService {
    let connection = this.connections.get(sessionId);
    
    if (!connection) {
      connection = new RealtimeService({
        url: '/api/agents/stream',
        sessionId,
        ...options
      });
      this.connections.set(sessionId, connection);
    }
    
    return connection;
  }

  /**
   * 接続を削除
   */
  public removeConnection(sessionId: string): void {
    const connection = this.connections.get(sessionId);
    if (connection) {
      connection.disconnect();
      this.connections.delete(sessionId);
    }
  }

  /**
   * 全接続を切断
   */
  public disconnectAll(): void {
    this.connections.forEach(connection => {
      connection.disconnect();
    });
    this.connections.clear();
  }

  /**
   * アクティブな接続数を取得
   */
  public getActiveConnections(): number {
    let count = 0;
    this.connections.forEach(connection => {
      if (connection.isConnected()) {
        count++;
      }
    });
    return count;
  }
}

export const realtimeManager = RealtimeManager.getInstance();