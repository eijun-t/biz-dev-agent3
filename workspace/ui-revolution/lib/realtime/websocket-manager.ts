/**
 * WebSocket Manager for Real-time Data
 * Emergency Implementation by Worker3
 * High-performance bi-directional communication
 */

import { EventEmitter } from 'events';

interface WebSocketConfig {
  url?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  messageQueueSize?: number;
}

interface Message {
  type: string;
  channel?: string;
  data: any;
  timestamp: number;
  id?: string;
}

/**
 * High-performance WebSocket Manager
 */
export class WebSocketManager extends EventEmitter {
  private static instance: WebSocketManager;
  private ws: WebSocket | null = null;
  private config: Required<WebSocketConfig>;
  private reconnectAttempts = 0;
  private messageQueue: Message[] = [];
  private subscriptions = new Set<string>();
  private heartbeatTimer?: NodeJS.Timeout;
  private reconnectTimer?: NodeJS.Timeout;
  private isConnected = false;
  private metrics = {
    messagesReceived: 0,
    messagesSent: 0,
    reconnections: 0,
    errors: 0
  };
  
  private constructor(config: WebSocketConfig = {}) {
    super();
    
    this.config = {
      url: config.url || this.getWebSocketUrl(),
      reconnectInterval: config.reconnectInterval || 3000,
      maxReconnectAttempts: config.maxReconnectAttempts || 10,
      heartbeatInterval: config.heartbeatInterval || 30000,
      messageQueueSize: config.messageQueueSize || 100
    };
    
    // Auto-connect
    this.connect();
  }
  
  static getInstance(config?: WebSocketConfig): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager(config);
    }
    return WebSocketManager.instance;
  }
  
  /**
   * Connect to WebSocket server
   */
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }
    
    try {
      this.ws = new WebSocket(this.config.url);
      this.setupEventHandlers();
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.scheduleReconnect();
    }
  }
  
  /**
   * Setup WebSocket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.ws) return;
    
    this.ws.onopen = () => {
      console.log('✅ WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Start heartbeat
      this.startHeartbeat();
      
      // Resubscribe to channels
      this.subscriptions.forEach(channel => {
        this.subscribe(channel);
      });
      
      // Send queued messages
      this.flushMessageQueue();
      
      // Emit connection event
      this.emit('connected');
    };
    
    this.ws.onmessage = (event) => {
      this.metrics.messagesReceived++;
      
      try {
        const message: Message = JSON.parse(event.data);
        
        // Handle different message types
        switch (message.type) {
          case 'pong':
            // Heartbeat response
            break;
            
          case 'update':
            this.handleUpdate(message);
            break;
            
          case 'error':
            this.handleError(message);
            break;
            
          default:
            this.emit('message', message);
            if (message.channel) {
              this.emit(`channel:${message.channel}`, message.data);
            }
        }
      } catch (error) {
        console.error('Message parse error:', error);
        this.metrics.errors++;
      }
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.metrics.errors++;
      this.emit('error', error);
    };
    
    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.isConnected = false;
      this.stopHeartbeat();
      this.emit('disconnected');
      
      // Schedule reconnection
      if (this.reconnectAttempts < this.config.maxReconnectAttempts) {
        this.scheduleReconnect();
      }
    };
  }
  
  /**
   * Send message through WebSocket
   */
  send(message: Partial<Message>): void {
    const fullMessage: Message = {
      type: message.type || 'message',
      channel: message.channel,
      data: message.data,
      timestamp: Date.now(),
      id: this.generateId()
    };
    
    if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(fullMessage));
      this.metrics.messagesSent++;
    } else {
      // Queue message if not connected
      this.queueMessage(fullMessage);
    }
  }
  
  /**
   * Subscribe to a channel
   */
  subscribe(channel: string): void {
    this.subscriptions.add(channel);
    
    if (this.isConnected) {
      this.send({
        type: 'subscribe',
        channel,
        data: {}
      });
    }
  }
  
  /**
   * Unsubscribe from a channel
   */
  unsubscribe(channel: string): void {
    this.subscriptions.delete(channel);
    
    if (this.isConnected) {
      this.send({
        type: 'unsubscribe',
        channel,
        data: {}
      });
    }
  }
  
  /**
   * Handle update messages
   */
  private handleUpdate(message: Message): void {
    // Emit update event
    this.emit('update', message.data);
    
    // Channel-specific update
    if (message.channel) {
      this.emit(`update:${message.channel}`, message.data);
    }
  }
  
  /**
   * Handle error messages
   */
  private handleError(message: Message): void {
    console.error('Server error:', message.data);
    this.emit('server-error', message.data);
  }
  
  /**
   * Queue message for later sending
   */
  private queueMessage(message: Message): void {
    this.messageQueue.push(message);
    
    // Limit queue size
    if (this.messageQueue.length > this.config.messageQueueSize) {
      this.messageQueue.shift();
    }
  }
  
  /**
   * Send all queued messages
   */
  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.isConnected) {
      const message = this.messageQueue.shift();
      if (message) {
        this.send(message);
      }
    }
  }
  
  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected) {
        this.send({
          type: 'ping',
          data: { timestamp: Date.now() }
        });
      }
    }, this.config.heartbeatInterval);
  }
  
  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
  }
  
  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    this.reconnectAttempts++;
    this.metrics.reconnections++;
    
    const delay = Math.min(
      this.config.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1),
      30000
    );
    
    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }
  
  /**
   * Get WebSocket URL based on environment
   */
  private getWebSocketUrl(): string {
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      return `${protocol}//${host}/ws`;
    }
    return 'ws://localhost:3001/ws';
  }
  
  /**
   * Generate unique message ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    this.stopHeartbeat();
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.isConnected = false;
    this.messageQueue = [];
    this.subscriptions.clear();
  }
  
  /**
   * Get connection status
   */
  getStatus(): {
    connected: boolean;
    reconnectAttempts: number;
    queueSize: number;
    metrics: typeof this.metrics;
  } {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      queueSize: this.messageQueue.length,
      metrics: { ...this.metrics }
    };
  }
  
  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      messagesReceived: 0,
      messagesSent: 0,
      reconnections: 0,
      errors: 0
    };
  }
}

// Export singleton instance
export const wsManager = WebSocketManager.getInstance();

// Export types
export type { Message, WebSocketConfig };