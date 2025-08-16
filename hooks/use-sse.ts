'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { ProgressEvent } from '@/lib/types/orchestration'

export interface UseSSEOptions {
  url?: string
  sessionId?: string
  autoConnect?: boolean
  reconnectAttempts?: number
  reconnectInterval?: number
  onOpen?: () => void
  onError?: (error: Event) => void
  onMessage?: (event: ProgressEvent) => void
  onClose?: () => void
}

export interface UseSSEReturn {
  connect: (url: string) => void
  disconnect: () => void
  isConnected: boolean
  isConnecting: boolean
  lastEvent: ProgressEvent | null
  connectionAttempts: number
  error: string | null
}

/**
 * SSE接続を管理するカスタムフック
 * EventSource の自動再接続、エラーハンドリング、クリーンアップを提供
 */
export function useSSE(options: UseSSEOptions = {}): UseSSEReturn {
  const {
    autoConnect = false,
    reconnectAttempts = 5,
    reconnectInterval = 2000,
    onOpen,
    onError,
    onMessage,
    onClose
  } = options

  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [lastEvent, setLastEvent] = useState<ProgressEvent | null>(null)
  const [connectionAttempts, setConnectionAttempts] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const currentUrlRef = useRef<string | null>(null)
  const shouldReconnectRef = useRef(true)

  // EventSourceを作成してイベントハンドラーを設定
  const createEventSource = useCallback((url: string) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    setIsConnecting(true)
    setError(null)

    const eventSource = new EventSource(url)
    eventSourceRef.current = eventSource
    currentUrlRef.current = url

    eventSource.onopen = () => {
      console.log('SSE connection opened')
      setIsConnected(true)
      setIsConnecting(false)
      setConnectionAttempts(0)
      setError(null)
      onOpen?.()
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        // ProgressEvent として処理
        if (data.type && data.sessionId && data.timestamp) {
          const progressEvent: ProgressEvent = {
            type: data.type,
            sessionId: data.sessionId,
            timestamp: new Date(data.timestamp),
            data: data.data || {}
          }
          
          setLastEvent(progressEvent)
          onMessage?.(progressEvent)
        } else {
          // 接続確認メッセージなど
          console.log('SSE message received:', data)
        }
      } catch (error) {
        console.error('Failed to parse SSE message:', error)
        setError('メッセージの解析に失敗しました')
      }
    }

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error)
      setIsConnected(false)
      setIsConnecting(false)
      
      const errorMessage = eventSource.readyState === EventSource.CLOSED 
        ? '接続が閉じられました' 
        : '接続エラーが発生しました'
      
      setError(errorMessage)
      onError?.(error)

      // 再接続を試行
      if (shouldReconnectRef.current && connectionAttempts < reconnectAttempts) {
        const nextAttempt = connectionAttempts + 1
        setConnectionAttempts(nextAttempt)
        
        console.log(`Reconnecting in ${reconnectInterval}ms (attempt ${nextAttempt}/${reconnectAttempts})`)
        
        reconnectTimeoutRef.current = setTimeout(() => {
          if (shouldReconnectRef.current && currentUrlRef.current) {
            createEventSource(currentUrlRef.current)
          }
        }, reconnectInterval * nextAttempt) // 指数バックオフ
      } else if (connectionAttempts >= reconnectAttempts) {
        setError('最大再接続回数に達しました')
      }
    }

    eventSource.onclose = () => {
      console.log('SSE connection closed')
      setIsConnected(false)
      setIsConnecting(false)
      onClose?.()
    }

    return eventSource
  }, [connectionAttempts, reconnectAttempts, reconnectInterval, onOpen, onError, onMessage, onClose])

  // 接続開始
  const connect = useCallback((url: string) => {
    shouldReconnectRef.current = true
    setConnectionAttempts(0)
    createEventSource(url)
  }, [createEventSource])

  // 接続終了
  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    
    setIsConnected(false)
    setIsConnecting(false)
    setConnectionAttempts(0)
    setError(null)
    currentUrlRef.current = null
  }, [])

  // 自動接続
  useEffect(() => {
    if (autoConnect && options.url) {
      connect(options.url)
    }
    
    return () => {
      disconnect()
    }
  }, [autoConnect, options.url, connect, disconnect])

  // コンポーネントアンマウント時のクリーンアップ
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    connect,
    disconnect,
    isConnected,
    isConnecting,
    lastEvent,
    connectionAttempts,
    error
  }
}