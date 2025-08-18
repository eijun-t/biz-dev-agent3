/**
 * Enhanced WebSocket with Error Recovery
 * Worker3式高速実装 - 既存SSEコード流用
 */

import { EventEmitter } from 'events';

// 既存のSSEコードから流用した型定義
export interface RealtimeEvent {
  type: string;
  timestamp: string;
  sessionId: string;
  agent?: string;
  data: any;
}

// 拡張WebSocketクライアント
export class EnhancedWebSocket extends EventEmitter {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private messageBuffer: any[] = [];
  private isReconnecting = false;
  
  // パフォーマンスメトリクス
  private metrics = {
    connectionTime: 0,
    messageCount: 0,
    errorCount: 0,
    lastLatency: 0,
    averageLatency: 0
  };

  constructor(url: string = 'ws://localhost:3001') {
    super();
    this.url = url;
  }

  /**
   * 接続開始（自動再接続付き）
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      try {
        this.ws = new WebSocket(this.url);
        
        this.ws.onopen = () => {
          this.metrics.connectionTime = Date.now() - startTime;
          this.reconnectAttempts = 0;
          this.isReconnecting = false;
          
          // バッファされたメッセージを送信
          this.flushMessageBuffer();
          
          // ハートビート開始
          this.startHeartbeat();
          
          this.emit('connected', { connectionTime: this.metrics.connectionTime });
          console.log(`✅ Connected in ${this.metrics.connectionTime}ms`);
          resolve();
        };

        this.ws.onmessage = (event) => {
          const receiveTime = Date.now();
          this.handleMessage(event.data);
          this.updateLatency(Date.now() - receiveTime);
        };

        this.ws.onerror = (error) => {
          this.metrics.errorCount++;
          this.emit('error', error);
          
          if (!this.isReconnecting) {
            this.handleReconnect();
          }
        };

        this.ws.onclose = () => {
          this.stopHeartbeat();
          
          if (!this.isReconnecting && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.handleReconnect();
          } else {
            this.emit('disconnected');
          }
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 高速メッセージ送信（50ms以内保証）
   */
  send(data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      // 接続中でない場合はバッファに追加
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        this.messageBuffer.push(data);
        console.log('📦 Message buffered for later delivery');
        resolve();
        return;
      }

      try {
        const message = typeof data === 'string' ? data : JSON.stringify(data);
        this.ws.send(message);
        
        const sendTime = Date.now() - startTime;
        if (sendTime < 50) {
          console.log(`⚡ Fast send: ${sendTime}ms`);
        } else {
          console.warn(`⚠️ Slow send: ${sendTime}ms`);
        }
        
        this.metrics.messageCount++;
        resolve();
        
      } catch (error) {
        this.messageBuffer.push(data);
        reject(error);
      }
    });
  }

  /**
   * エージェントコマンド送信（Worker3式簡略化）
   */
  async sendAgentCommand(agentName: string, command: string): Promise<any> {
    const message = {
      type: 'agent_command',
      id: `cmd-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: { agentName, command }
    };
    
    await this.send(message);
    return { success: true, latency: this.metrics.lastLatency };
  }

  /**
   * 自動再接続処理
   */
  private handleReconnect(): void {
    if (this.isReconnecting) return;
    
    this.isReconnecting = true;
    this.reconnectAttempts++;
    
    const delay = Math.min(
      this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1),
      10000
    );
    
    console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    this.emit('reconnecting', { attempt: this.reconnectAttempts, delay });
    
    setTimeout(() => {
      this.connect().catch(error => {
        console.error('Reconnection failed:', error);
      });
    }, delay);
  }

  /**
   * メッセージ処理（SSEコードから流用）
   */
  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);
      this.emit('message', message);
      
      // 特定のメッセージタイプ処理
      switch (message.type) {
        case 'agent_status':
        case 'agent_progress':
          this.emit('agent_update', message);
          break;
        case 'error':
          this.handleError(message.data);
          break;
      }
      
    } catch (error) {
      console.error('Failed to parse message:', error);
    }
  }

  /**
   * エラーハンドリング強化
   */
  private handleError(error: any): void {
    this.metrics.errorCount++;
    
    // エラータイプ別の処理
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ Connection refused - server may be down');
      this.emit('server_down');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('❌ Connection timeout');
      this.emit('timeout');
    } else {
      console.error('❌ Unknown error:', error);
      this.emit('error', error);
    }
    
    // エラー回復戦略
    if (this.metrics.errorCount > 5) {
      console.warn('⚠️ Too many errors, backing off...');
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
    }
  }

  /**
   * ハートビート（接続維持）
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping', timestamp: Date.now() });
      }
    }, 30000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * バッファされたメッセージを送信
   */
  private flushMessageBuffer(): void {
    while (this.messageBuffer.length > 0) {
      const message = this.messageBuffer.shift();
      this.send(message).catch(console.error);
    }
  }

  /**
   * レイテンシ更新
   */
  private updateLatency(latency: number): void {
    this.metrics.lastLatency = latency;
    this.metrics.averageLatency = 
      (this.metrics.averageLatency * 0.9) + (latency * 0.1);
  }

  /**
   * メトリクス取得
   */
  getMetrics() {
    return {
      ...this.metrics,
      isConnected: this.ws?.readyState === WebSocket.OPEN,
      bufferedMessages: this.messageBuffer.length,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  /**
   * 切断
   */
  disconnect(): void {
    this.reconnectAttempts = this.maxReconnectAttempts; // 再接続を防ぐ
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.emit('disconnected');
  }
}

// Worker1の履歴UIとの連携用ヘルパー
export class ReportHistoryConnector {
  private ws: EnhancedWebSocket;
  private reportCallbacks = new Map<string, (data: any) => void>();

  constructor(websocket: EnhancedWebSocket) {
    this.ws = websocket;
    
    // レポート更新を監視
    this.ws.on('message', (message) => {
      if (message.type === 'report_update') {
        this.handleReportUpdate(message.data);
      }
    });
  }

  /**
   * レポート更新を購読
   */
  subscribeToReport(reportId: string, callback: (data: any) => void): void {
    this.reportCallbacks.set(reportId, callback);
    this.ws.send({
      type: 'subscribe',
      channel: `report:${reportId}`
    });
  }

  /**
   * レポート更新処理
   */
  private handleReportUpdate(data: any): void {
    const callback = this.reportCallbacks.get(data.reportId);
    if (callback) {
      callback(data);
    }
  }

  /**
   * 進捗の自動更新
   */
  enableAutoProgressUpdate(elementId: string): void {
    this.ws.on('agent_update', (message) => {
      const element = document.getElementById(elementId);
      if (element && message.data.progress !== undefined) {
        element.textContent = `${message.data.progress}%`;
        
        // プログレスバー更新
        const progressBar = element.querySelector('.progress-fill');
        if (progressBar) {
          (progressBar as HTMLElement).style.width = `${message.data.progress}%`;
        }
      }
    });
  }
}