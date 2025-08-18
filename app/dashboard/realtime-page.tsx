'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { AgentChat } from '@/components/AgentChat/AgentChat'
import { Dashboard } from '@/components/Dashboard/Dashboard'
import { Settings } from '@/components/Settings/Settings'
import { logger } from '@/lib/utils/logger'
import { ErrorToastContainer, useErrorNotification } from '@/workspace/ui-revolution/components/ErrorNotification/ErrorToast'
import { PauseResumeControl, executionStore } from '@/workspace/ui-revolution/components/PauseResume/PauseResumeControl'
import { ConnectionBar, ConnectionStatus } from '@/components/ConnectionStatus/ConnectionStatus'
import { EnhancedWebSocket } from '@/workspace/ui-revolution/lib/websocket-enhanced'

// リアルタイムデータストア
interface RealtimeData {
  agents: Array<{
    name: string
    status: 'idle' | 'running' | 'paused' | 'completed' | 'error'
    progress: number
    lastUpdate: Date
  }>
  messages: number
  errors: number
  latency: number
}

export default function RealtimeDashboardPage() {
  const [activeTab, setActiveTab] = useState<'chat' | 'dashboard' | 'settings'>('dashboard')
  const [isLoading, setIsLoading] = useState(true)
  const [wsClient, setWsClient] = useState<EnhancedWebSocket | null>(null)
  const [realtimeData, setRealtimeData] = useState<RealtimeData>({
    agents: [],
    messages: 0,
    errors: 0,
    latency: 0
  })
  
  const supabase = createClientComponentClient()
  const { showSuccess, showError, showWarning } = useErrorNotification()

  useEffect(() => {
    // 初期化処理
    logger.info('Realtime Dashboard initialized')
    setIsLoading(false)
    
    // WebSocket接続初期化
    const ws = new EnhancedWebSocket('ws://localhost:3001', {
      autoReconnect: true,
      reconnectInterval: 2000,
      maxReconnectAttempts: 10
    })
    
    // リアルタイムデータ受信
    ws.on('message', (data: any) => {
      if (data.type === 'agent_update') {
        setRealtimeData(prev => ({
          ...prev,
          agents: prev.agents.map(agent => 
            agent.name === data.agent 
              ? { ...agent, status: data.status, progress: data.progress, lastUpdate: new Date() }
              : agent
          ),
          messages: prev.messages + 1
        }))
        
        // エージェント状態をストアに反映
        executionStore.setAgentState(data.agent, {
          state: data.status,
          progress: data.progress
        })
      }
      
      if (data.type === 'metrics') {
        setRealtimeData(prev => ({
          ...prev,
          latency: data.latency
        }))
      }
      
      if (data.type === 'error') {
        setRealtimeData(prev => ({
          ...prev,
          errors: prev.errors + 1
        }))
        showError('エージェントエラー', data.message)
      }
    })
    
    ws.on('connected', () => {
      showSuccess('接続成功', 'リアルタイムデータの受信を開始しました')
      
      // エージェント初期化
      const initialAgents = [
        'Researcher', 'Ideator', 'Critic', 'Analyst', 'Writer'
      ].map(name => ({
        name,
        status: 'idle' as const,
        progress: 0,
        lastUpdate: new Date()
      }))
      
      setRealtimeData(prev => ({
        ...prev,
        agents: initialAgents
      }))
    })
    
    ws.on('error', (error: Error) => {
      showError('接続エラー', error.message)
    })
    
    ws.on('reconnecting', ({ attempt, maxAttempts }: any) => {
      showWarning('再接続中', `接続を再試行しています (${attempt}/${maxAttempts})`)
    })
    
    ws.connect().then(() => {
      logger.info('WebSocket connected successfully')
    }).catch(error => {
      logger.error('WebSocket connection failed', error)
    })
    
    setWsClient(ws)
    
    return () => {
      ws.disconnect()
    }
  }, [showSuccess, showError, showWarning])

  // リアルタイムステータス表示
  const RealtimeStatus = () => (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
        <div className="text-2xl font-bold text-blue-500">{realtimeData.messages}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">メッセージ</div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
        <div className="text-2xl font-bold text-green-500">{realtimeData.latency}ms</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">レイテンシ</div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
        <div className="text-2xl font-bold text-red-500">{realtimeData.errors}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">エラー</div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
        <div className="text-2xl font-bold text-purple-500">
          {Math.round(realtimeData.agents.reduce((sum, a) => sum + a.progress, 0) / (realtimeData.agents.length || 1))}%
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">進捗率</div>
      </div>
    </div>
  )

  // エージェント進捗表示
  const AgentProgress = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
      <h3 className="text-lg font-bold mb-4">エージェント進捗</h3>
      <div className="space-y-3">
        {realtimeData.agents.map(agent => (
          <div key={agent.name} className="flex items-center gap-3">
            <div className="w-24 text-sm font-medium">{agent.name}</div>
            <div className="flex-1 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  agent.status === 'running' ? 'bg-blue-500' :
                  agent.status === 'paused' ? 'bg-yellow-500' :
                  agent.status === 'completed' ? 'bg-green-500' :
                  agent.status === 'error' ? 'bg-red-500' :
                  'bg-gray-400'
                }`}
                style={{ width: `${agent.progress}%` }}
              />
            </div>
            <div className="w-12 text-sm text-right">{agent.progress}%</div>
            <div className={`text-xs px-2 py-1 rounded-full ${
              agent.status === 'running' ? 'bg-blue-100 text-blue-700' :
              agent.status === 'paused' ? 'bg-yellow-100 text-yellow-700' :
              agent.status === 'completed' ? 'bg-green-100 text-green-700' :
              agent.status === 'error' ? 'bg-red-100 text-red-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {agent.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* エラー通知コンテナ */}
      <ErrorToastContainer />
      
      {/* 接続状態バー */}
      <ConnectionBar client={wsClient} />
      
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              AI Agent Dashboard - Realtime 100%
            </h1>
            <ConnectionStatus client={wsClient} showDetails />
          </div>
          
          {/* タブナビゲーション */}
          <div className="flex space-x-8 border-b border-gray-200 dark:border-gray-700">
            {(['chat', 'dashboard', 'settings'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {tab === 'chat' ? 'チャット' : 
                 tab === 'dashboard' ? 'ダッシュボード' : '設定'}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* 一時停止/再開コントロール */}
        <div className="mb-6">
          <PauseResumeControl wsClient={wsClient} />
        </div>
        
        {/* リアルタイムステータス */}
        <RealtimeStatus />
        
        {/* エージェント進捗 */}
        <AgentProgress />
        
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mt-6">
            {activeTab === 'chat' && <AgentChat />}
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'settings' && <Settings />}
          </div>
        )}
      </main>
    </div>
  )
}