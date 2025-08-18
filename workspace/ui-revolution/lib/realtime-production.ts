/**
 * Production-Ready Realtime System
 * 本番環境統合・パフォーマンス最適化
 */

import { EnhancedWebSocket } from './websocket-enhanced'
import { useRealtimeStore, handleWebSocketMessage } from '../stores/realtime-store'
import { errorStore } from '../components/ErrorNotification/ErrorToast'
import { executionStore } from '../components/PauseResume/PauseResumeControl'

// 本番環境設定
const PRODUCTION_CONFIG = {
  // WebSocket設定
  WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'wss://api.production.com/ws',
  WS_PROTOCOL: process.env.NEXT_PUBLIC_WS_PROTOCOL || 'wss',
  
  // 接続設定
  RECONNECT_INTERVAL: 3000,
  MAX_RECONNECT_ATTEMPTS: 15,
  HEARTBEAT_INTERVAL: 30000,
  CONNECTION_TIMEOUT: 10000,
  
  // パフォーマンス設定
  MESSAGE_BATCH_SIZE: 50,
  MESSAGE_THROTTLE_MS: 100,
  MAX_MESSAGE_QUEUE: 1000,
  
  // セキュリティ
  USE_AUTH: true,
  AUTH_TOKEN_KEY: 'ws_auth_token',
  REFRESH_TOKEN_INTERVAL: 3600000 // 1時間
}

/**
 * 本番用WebSocketマネージャー
 */
export class ProductionWebSocketManager {
  private static instance: ProductionWebSocketManager
  private ws: EnhancedWebSocket | null = null
  private messageQueue: any[] = []
  private batchTimer: NodeJS.Timeout | null = null
  private metrics = {
    totalMessages: 0,
    totalErrors: 0,
    totalReconnects: 0,
    startTime: Date.now(),
    lastError: null as Date | null,
    averageLatency: 0,
    latencyHistory: [] as number[]
  }

  static getInstance() {
    if (!ProductionWebSocketManager.instance) {
      ProductionWebSocketManager.instance = new ProductionWebSocketManager()
    }
    return ProductionWebSocketManager.instance
  }

  // 接続初期化
  async initialize(authToken?: string) {
    try {
      // 既存接続をクリーンアップ
      if (this.ws) {
        await this.cleanup()
      }

      // WebSocket URL構築
      const wsUrl = this.buildWebSocketUrl(authToken)
      
      // EnhancedWebSocket作成
      this.ws = new EnhancedWebSocket(wsUrl, {
        autoReconnect: true,
        reconnectInterval: PRODUCTION_CONFIG.RECONNECT_INTERVAL,
        maxReconnectAttempts: PRODUCTION_CONFIG.MAX_RECONNECT_ATTEMPTS,
        heartbeatInterval: PRODUCTION_CONFIG.HEARTBEAT_INTERVAL,
        connectionTimeout: PRODUCTION_CONFIG.CONNECTION_TIMEOUT
      })

      // イベントハンドラー設定
      this.setupEventHandlers()
      
      // 接続開始
      await this.ws.connect()
      
      // ハートビート開始
      this.startHeartbeat()
      
      // メトリクス記録
      this.metrics.startTime = Date.now()
      
      return true
    } catch (error) {
      console.error('[Production WS] Initialization failed:', error)
      this.handleError(error as Error)
      return false
    }
  }

  // WebSocket URL構築
  private buildWebSocketUrl(authToken?: string): string {
    const baseUrl = PRODUCTION_CONFIG.WS_URL
    const params = new URLSearchParams()
    
    if (PRODUCTION_CONFIG.USE_AUTH && authToken) {
      params.append('token', authToken)
    }
    
    params.append('client', 'web')
    params.append('version', process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0')
    
    return `${baseUrl}?${params.toString()}`
  }

  // イベントハンドラー設定
  private setupEventHandlers() {
    if (!this.ws) return

    // 接続成功
    this.ws.on('connected', () => {
      console.log('[Production WS] Connected successfully')
      useRealtimeStore.getState().setConnected(true)
      errorStore.addNotification({
        level: 'success',
        title: '接続成功',
        message: 'リアルタイムサーバーに接続しました'
      })
    })

    // メッセージ受信
    this.ws.on('message', (data: any) => {
      this.handleMessage(data)
    })

    // エラー処理
    this.ws.on('error', (error: Error) => {
      this.handleError(error)
    })

    // 再接続
    this.ws.on('reconnecting', ({ attempt, maxAttempts }: any) => {
      this.metrics.totalReconnects++
      errorStore.addNotification({
        level: 'warning',
        title: '再接続中',
        message: `接続を再試行しています (${attempt}/${maxAttempts})`
      })
    })

    // 切断
    this.ws.on('disconnected', () => {
      useRealtimeStore.getState().setConnected(false)
    })
  }

  // メッセージ処理（バッチング対応）
  private handleMessage(data: any) {
    this.metrics.totalMessages++
    
    // レイテンシ計測
    if (data.timestamp) {
      const latency = Date.now() - data.timestamp
      this.updateLatency(latency)
    }

    // メッセージキューに追加
    this.messageQueue.push(data)
    
    // バッチ処理
    if (this.messageQueue.length >= PRODUCTION_CONFIG.MESSAGE_BATCH_SIZE) {
      this.processBatch()
    } else if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => {
        this.processBatch()
      }, PRODUCTION_CONFIG.MESSAGE_THROTTLE_MS)
    }
  }

  // バッチ処理
  private processBatch() {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer)
      this.batchTimer = null
    }

    const batch = this.messageQueue.splice(0, PRODUCTION_CONFIG.MESSAGE_BATCH_SIZE)
    
    // RequestIdleCallbackで処理
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        batch.forEach(message => {
          handleWebSocketMessage(message)
        })
      })
    } else {
      // フォールバック
      setTimeout(() => {
        batch.forEach(message => {
          handleWebSocketMessage(message)
        })
      }, 0)
    }
  }

  // レイテンシ更新
  private updateLatency(latency: number) {
    this.metrics.latencyHistory.push(latency)
    
    // 最新100件のみ保持
    if (this.metrics.latencyHistory.length > 100) {
      this.metrics.latencyHistory.shift()
    }
    
    // 平均計算
    const sum = this.metrics.latencyHistory.reduce((a, b) => a + b, 0)
    this.metrics.averageLatency = Math.round(sum / this.metrics.latencyHistory.length)
    
    // ストアに反映
    useRealtimeStore.getState().updateMetrics({
      latency: this.metrics.averageLatency
    })
  }

  // エラーハンドリング
  private handleError(error: Error) {
    this.metrics.totalErrors++
    this.metrics.lastError = new Date()
    
    console.error('[Production WS] Error:', error)
    
    errorStore.addNotification({
      level: 'error',
      title: 'WebSocketエラー',
      message: error.message,
      metadata: {
        errorCode: 'WS_ERROR',
        stack: error.stack
      }
    })
  }

  // ハートビート
  private heartbeatTimer: NodeJS.Timeout | null = null
  
  private startHeartbeat() {
    this.stopHeartbeat()
    
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.isConnected()) {
        this.ws.send({
          type: 'heartbeat',
          timestamp: Date.now()
        })
      }
    }, PRODUCTION_CONFIG.HEARTBEAT_INTERVAL)
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  // メッセージ送信（最適化済み）
  async send(data: any): Promise<boolean> {
    if (!this.ws?.isConnected()) {
      console.error('[Production WS] Not connected')
      return false
    }

    try {
      // タイムスタンプ追加
      const message = {
        ...data,
        timestamp: Date.now(),
        clientId: this.getClientId()
      }
      
      await this.ws.send(message)
      return true
    } catch (error) {
      this.handleError(error as Error)
      return false
    }
  }

  // クライアントID取得
  private getClientId(): string {
    let clientId = localStorage.getItem('ws_client_id')
    if (!clientId) {
      clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('ws_client_id', clientId)
    }
    return clientId
  }

  // メトリクス取得
  getMetrics() {
    return {
      ...this.metrics,
      uptime: Date.now() - this.metrics.startTime,
      isConnected: this.ws?.isConnected() || false,
      queueSize: this.messageQueue.length
    }
  }

  // クリーンアップ
  async cleanup() {
    this.stopHeartbeat()
    
    if (this.batchTimer) {
      clearTimeout(this.batchTimer)
      this.batchTimer = null
    }
    
    if (this.ws) {
      await this.ws.disconnect()
      this.ws = null
    }
    
    this.messageQueue = []
  }

  // 再接続
  async reconnect() {
    await this.cleanup()
    const authToken = localStorage.getItem(PRODUCTION_CONFIG.AUTH_TOKEN_KEY) || undefined
    return this.initialize(authToken)
  }
}

/**
 * React Hook for Production WebSocket
 */
export const useProductionWebSocket = () => {
  const [manager] = useState(() => ProductionWebSocketManager.getInstance())
  const [isConnected, setIsConnected] = useState(false)
  const [metrics, setMetrics] = useState<any>(null)

  useEffect(() => {
    // 初期化
    const authToken = localStorage.getItem(PRODUCTION_CONFIG.AUTH_TOKEN_KEY) || undefined
    
    manager.initialize(authToken).then(success => {
      setIsConnected(success)
    })

    // メトリクス更新
    const metricsInterval = setInterval(() => {
      setMetrics(manager.getMetrics())
    }, 1000)

    // クリーンアップ
    return () => {
      clearInterval(metricsInterval)
      manager.cleanup()
    }
  }, [manager])

  return {
    isConnected,
    metrics,
    send: (data: any) => manager.send(data),
    reconnect: () => manager.reconnect(),
    cleanup: () => manager.cleanup()
  }
}

import { useState, useEffect } from 'react'

/**
 * パフォーマンス最適化ユーティリティ
 */
export const performanceOptimizations = {
  // メッセージデバウンス
  debounceMessages: (callback: Function, delay: number) => {
    let timer: NodeJS.Timeout
    return (...args: any[]) => {
      clearTimeout(timer)
      timer = setTimeout(() => callback(...args), delay)
    }
  },

  // メッセージスロットル
  throttleMessages: (callback: Function, limit: number) => {
    let inThrottle = false
    return (...args: any[]) => {
      if (!inThrottle) {
        callback(...args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  },

  // バッチ処理
  batchProcessor: (items: any[], processor: Function, batchSize: number) => {
    const batches = []
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize))
    }
    
    return Promise.all(batches.map(batch => processor(batch)))
  },

  // メモリ最適化
  optimizeMemory: () => {
    if ('gc' in window) {
      (window as any).gc()
    }
  }
}