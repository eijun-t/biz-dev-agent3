/**
 * Test Dashboard - 動作確認用ダッシュボード
 */

'use client'

import React, { useState, useEffect } from 'react'
import { ErrorToastContainer, useErrorNotification } from './ErrorNotification/ErrorToast'
import { PauseResumeControl, executionStore } from './PauseResume/PauseResumeControl'
import { Breadcrumb } from './Navigation/Breadcrumb'
import { AnimatedCard, AnimatedProgress, AnimatedSpinner } from './Animations/AnimatedComponents'
import { ResponsiveContainer, useResponsive } from './Responsive/ResponsiveLayout'
import { ThemeProvider, ThemeToggle } from '../hooks/useTheme'
import { useShortcuts, CommandPalette } from '../hooks/useShortcuts'
import { useNavigation } from '../hooks/useNavigation'
import { EnhancedWebSocket } from '../lib/websocket-enhanced'
import { useRealtimeStore } from '../stores/realtime-store'

export const TestDashboard = () => {
  const [wsClient, setWsClient] = useState<EnhancedWebSocket | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { showSuccess, showError, showWarning, showInfo } = useErrorNotification()
  const { deviceType } = useResponsive()
  const { navigate, canGoBack, goBack } = useNavigation()
  const realtimeStore = useRealtimeStore()

  // WebSocket初期化
  useEffect(() => {
    const ws = new EnhancedWebSocket('ws://localhost:3001', {
      autoReconnect: true,
      reconnectInterval: 2000
    })

    ws.on('connected', () => {
      showSuccess('接続成功', 'WebSocketサーバーに接続しました')
      realtimeStore.setConnected(true)
    })

    ws.on('error', (error: Error) => {
      showError('接続エラー', error.message)
    })

    ws.connect().catch(console.error)
    setWsClient(ws)
    setIsLoading(false)

    return () => {
      ws.disconnect()
    }
  }, [showSuccess, showError, realtimeStore])

  // ショートカットキー設定
  useShortcuts({
    test: {
      key: 't',
      ctrl: true,
      description: 'テスト実行',
      handler: () => {
        showInfo('テスト', 'ショートカットキーが動作しています')
      },
      preventDefault: true
    }
  })

  // テストデータ
  const agents = [
    { name: 'Researcher', progress: 75, status: 'running' },
    { name: 'Ideator', progress: 50, status: 'running' },
    { name: 'Critic', progress: 90, status: 'completed' },
    { name: 'Analyst', progress: 30, status: 'paused' },
    { name: 'Writer', progress: 0, status: 'idle' }
  ]

  const breadcrumbItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Agents', href: '/dashboard/agents' },
    { label: 'Test', active: true }
  ]

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
        {/* エラー通知 */}
        <ErrorToastContainer />
        
        {/* コマンドパレット */}
        <CommandPalette />

        {/* ヘッダー */}
        <header className="bg-white dark:bg-gray-800 shadow">
          <ResponsiveContainer className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  UI Revolution Test Dashboard
                </h1>
                <Breadcrumb items={breadcrumbItems} className="mt-2" />
              </div>
              <div className="flex items-center gap-4">
                <ThemeToggle />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {deviceType.toUpperCase()}
                </span>
              </div>
            </div>
          </ResponsiveContainer>
        </header>

        {/* メインコンテンツ */}
        <ResponsiveContainer className="py-8">
          {isLoading ? (
            <div className="flex justify-center">
              <AnimatedSpinner size={60} />
            </div>
          ) : (
            <div className="space-y-6">
              {/* 一時停止/再開コントロール */}
              <AnimatedCard>
                <h2 className="text-xl font-bold mb-4">実行制御</h2>
                <PauseResumeControl wsClient={wsClient} />
              </AnimatedCard>

              {/* エージェント進捗 */}
              <AnimatedCard delay={0.1}>
                <h2 className="text-xl font-bold mb-4">エージェント進捗</h2>
                <div className="space-y-4">
                  {agents.map((agent, index) => (
                    <div key={agent.name} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{agent.name}</span>
                        <span className="text-gray-600 dark:text-gray-400">
                          {agent.progress}%
                        </span>
                      </div>
                      <AnimatedProgress 
                        progress={agent.progress}
                        color={
                          agent.status === 'completed' ? 'bg-green-500' :
                          agent.status === 'paused' ? 'bg-yellow-500' :
                          agent.status === 'running' ? 'bg-blue-500' :
                          'bg-gray-400'
                        }
                      />
                    </div>
                  ))}
                </div>
              </AnimatedCard>

              {/* テストボタン */}
              <AnimatedCard delay={0.2}>
                <h2 className="text-xl font-bold mb-4">通知テスト</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <button
                    onClick={() => showInfo('情報', 'これは情報メッセージです')}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                  >
                    Info
                  </button>
                  <button
                    onClick={() => showWarning('警告', 'これは警告メッセージです')}
                    className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors"
                  >
                    Warning
                  </button>
                  <button
                    onClick={() => showError('エラー', 'これはエラーメッセージです')}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                  >
                    Error
                  </button>
                  <button
                    onClick={() => showSuccess('成功', 'これは成功メッセージです')}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                  >
                    Success
                  </button>
                  <button
                    onClick={() => {
                      executionStore.setGlobalState('running')
                      showInfo('実行開始', 'エージェントを起動しました')
                    }}
                    className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
                  >
                    Start
                  </button>
                </div>
              </AnimatedCard>

              {/* メトリクス */}
              <AnimatedCard delay={0.3}>
                <h2 className="text-xl font-bold mb-4">システムメトリクス</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-500">
                      {realtimeStore.metrics.latency}ms
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      レイテンシ
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-500">
                      {realtimeStore.metrics.messageCount}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      メッセージ
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="text-2xl font-bold text-red-500">
                      {realtimeStore.metrics.errorCount}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      エラー
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="text-2xl font-bold text-purple-500">
                      {realtimeStore.isConnected ? 'ON' : 'OFF'}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      接続状態
                    </div>
                  </div>
                </div>
              </AnimatedCard>

              {/* ショートカットヘルプ */}
              <AnimatedCard delay={0.4}>
                <h2 className="text-xl font-bold mb-4">キーボードショートカット</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>コマンドパレット</span>
                    <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">
                      Cmd/Ctrl + K
                    </kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>新規作成</span>
                    <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">
                      Cmd/Ctrl + N
                    </kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>テスト実行</span>
                    <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">
                      Cmd/Ctrl + T
                    </kbd>
                  </div>
                </div>
              </AnimatedCard>
            </div>
          )}
        </ResponsiveContainer>
      </div>
    </ThemeProvider>
  )
}

export default TestDashboard