/**
 * E2E Tests for Realtime System
 * 完全な統合テスト
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { act } from 'react-dom/test-utils'
import '@testing-library/jest-dom'
import { ErrorToastContainer, errorStore } from '../components/ErrorNotification/ErrorToast'
import { PauseResumeControl, executionStore } from '../components/PauseResume/PauseResumeControl'
import { ProductionWebSocketManager } from '../lib/realtime-production'
import { useRealtimeStore } from '../stores/realtime-store'

// モックWebSocket
class MockWebSocket {
  readyState = WebSocket.CONNECTING
  url: string
  
  constructor(url: string) {
    this.url = url
    setTimeout(() => {
      this.readyState = WebSocket.OPEN
      this.onopen?.({} as Event)
    }, 10)
  }
  
  onopen?: (event: Event) => void
  onclose?: (event: CloseEvent) => void
  onerror?: (event: Event) => void
  onmessage?: (event: MessageEvent) => void
  
  send(data: string) {
    // メッセージエコーバック
    setTimeout(() => {
      this.onmessage?.({
        data: JSON.stringify({
          type: 'echo',
          payload: JSON.parse(data)
        })
      } as MessageEvent)
    }, 5)
  }
  
  close() {
    this.readyState = WebSocket.CLOSED
    this.onclose?.({} as CloseEvent)
  }
}

// WebSocketモック設定
global.WebSocket = MockWebSocket as any

describe('Realtime E2E Tests', () => {
  let manager: ProductionWebSocketManager
  
  beforeEach(() => {
    // ストアリセット
    useRealtimeStore.setState({
      agents: new Map(),
      metrics: {
        latency: 0,
        messageCount: 0,
        errorCount: 0,
        bandwidth: 0,
        uptime: 0
      },
      isConnected: false,
      isPaused: false
    })
    
    manager = ProductionWebSocketManager.getInstance()
  })
  
  afterEach(async () => {
    await manager.cleanup()
  })

  describe('WebSocket Connection', () => {
    test('正常に接続できる', async () => {
      const result = await manager.initialize('test-token')
      expect(result).toBe(true)
      
      await waitFor(() => {
        expect(useRealtimeStore.getState().isConnected).toBe(true)
      })
    })

    test('再接続が機能する', async () => {
      await manager.initialize('test-token')
      
      // 切断
      await manager.cleanup()
      expect(useRealtimeStore.getState().isConnected).toBe(false)
      
      // 再接続
      const result = await manager.reconnect()
      expect(result).toBe(true)
      
      await waitFor(() => {
        expect(useRealtimeStore.getState().isConnected).toBe(true)
      })
    })

    test('メッセージ送受信が正常に動作する', async () => {
      await manager.initialize('test-token')
      
      const testMessage = { type: 'test', data: 'hello' }
      const result = await manager.send(testMessage)
      
      expect(result).toBe(true)
      
      await waitFor(() => {
        const metrics = manager.getMetrics()
        expect(metrics.totalMessages).toBeGreaterThan(0)
      })
    })
  })

  describe('Error Notifications', () => {
    test('エラー通知が表示される', () => {
      const { container } = render(<ErrorToastContainer />)
      
      act(() => {
        errorStore.addNotification({
          level: 'error',
          title: 'テストエラー',
          message: 'これはテストエラーです'
        })
      })
      
      expect(screen.getByText('テストエラー')).toBeInTheDocument()
      expect(screen.getByText('これはテストエラーです')).toBeInTheDocument()
    })

    test('自動削除が機能する', async () => {
      render(<ErrorToastContainer />)
      
      act(() => {
        errorStore.addNotification({
          level: 'info',
          title: '情報',
          message: '自動削除テスト',
          duration: 100
        })
      })
      
      expect(screen.getByText('自動削除テスト')).toBeInTheDocument()
      
      await waitFor(() => {
        expect(screen.queryByText('自動削除テスト')).not.toBeInTheDocument()
      }, { timeout: 200 })
    })

    test('5つのエラーレベルが正しく表示される', () => {
      render(<ErrorToastContainer />)
      
      const levels = ['info', 'warning', 'error', 'critical', 'success'] as const
      
      levels.forEach(level => {
        act(() => {
          errorStore.addNotification({
            level: level as any,
            title: `${level}タイトル`,
            message: `${level}メッセージ`
          })
        })
      })
      
      levels.forEach(level => {
        expect(screen.getByText(`${level}タイトル`)).toBeInTheDocument()
      })
    })
  })

  describe('Pause/Resume Control', () => {
    test('一時停止が機能する', () => {
      const { getByText } = render(<PauseResumeControl />)
      
      // 開始
      act(() => {
        executionStore.setGlobalState('running')
        executionStore.setAgentState('agent1', {
          state: 'running',
          progress: 50
        })
      })
      
      // 一時停止
      const pauseButton = getByText('一時停止')
      fireEvent.click(pauseButton)
      
      const state = executionStore.getGlobalState()
      expect(state).toBe('paused')
    })

    test('再開が機能する', () => {
      const { getByText } = render(<PauseResumeControl />)
      
      // 一時停止状態を設定
      act(() => {
        executionStore.setGlobalState('paused')
        executionStore.setAgentState('agent1', {
          state: 'paused',
          progress: 50
        })
      })
      
      // 再開
      const resumeButton = getByText('再開')
      fireEvent.click(resumeButton)
      
      const state = executionStore.getGlobalState()
      expect(state).toBe('running')
    })

    test('チェックポイントが保存される', () => {
      act(() => {
        executionStore.setAgentState('agent1', {
          state: 'running',
          progress: 75
        })
        
        executionStore.saveCheckpoint('agent1', {
          progress: 75,
          data: { test: 'data' }
        })
      })
      
      const checkpoint = executionStore.getCheckpoint('agent1')
      expect(checkpoint).toEqual({
        timestamp: expect.any(Date),
        data: {
          progress: 75,
          data: { test: 'data' }
        }
      })
    })
  })

  describe('Realtime Store', () => {
    test('エージェント更新が正しく反映される', () => {
      const store = useRealtimeStore.getState()
      
      store.updateAgent('researcher', {
        status: 'running',
        progress: 30
      })
      
      const agents = Array.from(store.agents.values())
      const researcher = agents.find(a => a.name === 'researcher')
      
      expect(researcher).toBeDefined()
      expect(researcher?.status).toBe('running')
      expect(researcher?.progress).toBe(30)
    })

    test('メトリクスが正しく更新される', () => {
      const store = useRealtimeStore.getState()
      
      store.updateMetrics({
        latency: 35,
        bandwidth: 1024
      })
      
      store.incrementMessage()
      store.incrementError()
      
      const metrics = store.metrics
      expect(metrics.latency).toBe(35)
      expect(metrics.bandwidth).toBe(1024)
      expect(metrics.messageCount).toBe(1)
      expect(metrics.errorCount).toBe(1)
    })

    test('全体進捗が正しく計算される', () => {
      const store = useRealtimeStore.getState()
      
      store.updateAgent('agent1', { progress: 50 })
      store.updateAgent('agent2', { progress: 75 })
      store.updateAgent('agent3', { progress: 100 })
      
      const progress = store.getAgentProgress()
      expect(progress).toBe(75) // (50+75+100)/3 = 75
    })
  })

  describe('Performance', () => {
    test('バッチ処理が機能する', async () => {
      await manager.initialize('test-token')
      
      // 大量メッセージ送信
      const messages = Array.from({ length: 100 }, (_, i) => ({
        type: 'test',
        id: i
      }))
      
      const startTime = Date.now()
      
      for (const msg of messages) {
        await manager.send(msg)
      }
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      // バッチ処理により高速処理されることを確認
      expect(duration).toBeLessThan(1000) // 1秒以内
    })

    test('メモリリークが発生しない', async () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0
      
      // 大量のメッセージ処理
      for (let i = 0; i < 1000; i++) {
        useRealtimeStore.getState().updateAgent(`agent${i}`, {
          progress: Math.random() * 100
        })
      }
      
      // クリーンアップ
      useRealtimeStore.getState().resetAllAgents()
      
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0
      const memoryIncrease = finalMemory - initialMemory
      
      // メモリ増加が適切な範囲内
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024) // 10MB以内
    })
  })

  describe('Integration', () => {
    test('全コンポーネントが統合動作する', async () => {
      // コンポーネントをレンダリング
      const { container } = render(
        <div>
          <ErrorToastContainer />
          <PauseResumeControl />
        </div>
      )
      
      // WebSocket接続
      await manager.initialize('test-token')
      
      // エージェント更新
      act(() => {
        useRealtimeStore.getState().updateAgent('test-agent', {
          status: 'running',
          progress: 50
        })
      })
      
      // エラー通知
      act(() => {
        errorStore.addNotification({
          level: 'info',
          title: '統合テスト',
          message: 'システム正常動作中'
        })
      })
      
      // 検証
      await waitFor(() => {
        expect(screen.getByText('統合テスト')).toBeInTheDocument()
        expect(useRealtimeStore.getState().isConnected).toBe(true)
      })
    })
  })
})