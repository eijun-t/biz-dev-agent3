/**
 * Realtime Store - 状態管理統合
 * リアルタイムデータの中央管理
 */

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

// エージェント状態
export interface AgentState {
  name: string
  status: 'idle' | 'running' | 'paused' | 'completed' | 'error'
  progress: number
  lastUpdate: Date
  checkpoint?: any
}

// システムメトリクス
export interface SystemMetrics {
  latency: number
  messageCount: number
  errorCount: number
  bandwidth: number
  uptime: number
}

// リアルタイムストア型定義
interface RealtimeStore {
  // 状態
  agents: Map<string, AgentState>
  metrics: SystemMetrics
  isConnected: boolean
  isPaused: boolean
  
  // アクション - エージェント
  updateAgent: (name: string, updates: Partial<AgentState>) => void
  resetAgent: (name: string) => void
  resetAllAgents: () => void
  
  // アクション - メトリクス
  updateMetrics: (metrics: Partial<SystemMetrics>) => void
  incrementMessage: () => void
  incrementError: () => void
  
  // アクション - 接続
  setConnected: (connected: boolean) => void
  
  // アクション - 一時停止
  pause: () => void
  resume: () => void
  
  // ヘルパー
  getAgentProgress: () => number
  getActiveAgents: () => AgentState[]
}

// リアルタイムストア実装
export const useRealtimeStore = create<RealtimeStore>()(
  devtools(
    persist(
      (set, get) => ({
        // 初期状態
        agents: new Map(),
        metrics: {
          latency: 0,
          messageCount: 0,
          errorCount: 0,
          bandwidth: 0,
          uptime: 0
        },
        isConnected: false,
        isPaused: false,
        
        // エージェント更新
        updateAgent: (name, updates) => set((state) => {
          const agents = new Map(state.agents)
          const current = agents.get(name) || {
            name,
            status: 'idle',
            progress: 0,
            lastUpdate: new Date()
          }
          agents.set(name, {
            ...current,
            ...updates,
            lastUpdate: new Date()
          })
          return { agents }
        }),
        
        // エージェントリセット
        resetAgent: (name) => set((state) => {
          const agents = new Map(state.agents)
          agents.set(name, {
            name,
            status: 'idle',
            progress: 0,
            lastUpdate: new Date()
          })
          return { agents }
        }),
        
        // 全エージェントリセット
        resetAllAgents: () => set(() => ({
          agents: new Map()
        })),
        
        // メトリクス更新
        updateMetrics: (metrics) => set((state) => ({
          metrics: { ...state.metrics, ...metrics }
        })),
        
        // メッセージカウント増加
        incrementMessage: () => set((state) => ({
          metrics: {
            ...state.metrics,
            messageCount: state.metrics.messageCount + 1
          }
        })),
        
        // エラーカウント増加
        incrementError: () => set((state) => ({
          metrics: {
            ...state.metrics,
            errorCount: state.metrics.errorCount + 1
          }
        })),
        
        // 接続状態設定
        setConnected: (connected) => set(() => ({
          isConnected: connected
        })),
        
        // 一時停止
        pause: () => set((state) => {
          const agents = new Map(state.agents)
          agents.forEach((agent, name) => {
            if (agent.status === 'running') {
              agents.set(name, {
                ...agent,
                status: 'paused',
                checkpoint: { progress: agent.progress, timestamp: new Date() }
              })
            }
          })
          return { agents, isPaused: true }
        }),
        
        // 再開
        resume: () => set((state) => {
          const agents = new Map(state.agents)
          agents.forEach((agent, name) => {
            if (agent.status === 'paused') {
              agents.set(name, {
                ...agent,
                status: 'running'
              })
            }
          })
          return { agents, isPaused: false }
        }),
        
        // 全体進捗取得
        getAgentProgress: () => {
          const state = get()
          const agents = Array.from(state.agents.values())
          if (agents.length === 0) return 0
          return Math.round(
            agents.reduce((sum, agent) => sum + agent.progress, 0) / agents.length
          )
        },
        
        // アクティブエージェント取得
        getActiveAgents: () => {
          const state = get()
          return Array.from(state.agents.values()).filter(
            agent => agent.status === 'running' || agent.status === 'paused'
          )
        }
      }),
      {
        name: 'realtime-store',
        partialize: (state) => ({
          agents: Array.from(state.agents.entries()),
          metrics: state.metrics
        }),
        merge: (persistedState: any, currentState) => ({
          ...currentState,
          agents: new Map(persistedState?.agents || []),
          metrics: persistedState?.metrics || currentState.metrics
        })
      }
    )
  )
)

// WebSocketイベントハンドラー
export const handleWebSocketMessage = (message: any) => {
  const store = useRealtimeStore.getState()
  
  switch (message.type) {
    case 'agent_update':
      store.updateAgent(message.agent, {
        status: message.status,
        progress: message.progress
      })
      break
      
    case 'metrics':
      store.updateMetrics({
        latency: message.latency,
        bandwidth: message.bandwidth
      })
      break
      
    case 'error':
      store.incrementError()
      break
      
    case 'connected':
      store.setConnected(true)
      break
      
    case 'disconnected':
      store.setConnected(false)
      break
  }
  
  store.incrementMessage()
}

// セレクター
export const selectAgents = () => useRealtimeStore(state => 
  Array.from(state.agents.values())
)

export const selectMetrics = () => useRealtimeStore(state => state.metrics)

export const selectConnectionStatus = () => useRealtimeStore(state => ({
  isConnected: state.isConnected,
  isPaused: state.isPaused
}))

export const selectProgress = () => useRealtimeStore(state => 
  state.getAgentProgress()
)