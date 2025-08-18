/**
 * Agent Stream Hook for Worker3 Integration
 * DataFlow.tsxとの連携用
 */

import { useEffect, useState, useCallback, useRef } from 'react';

// エージェント状態の型定義
export interface AgentStreamData {
  name: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  progress: number;
  currentTask?: string;
}

// ストリームイベントの型定義
export interface StreamEvent {
  type: 'init' | 'progress' | 'output' | 'error' | 'complete';
  timestamp: string;
  agent?: string;
  data: {
    agents?: AgentStreamData[];
    totalProgress?: number;
    activeAgent?: string;
    estimatedCompletion?: string;
    output?: any;
    error?: string;
    message?: string;
  };
}

// フックのオプション
interface UseAgentStreamOptions {
  sessionId?: string;
  autoConnect?: boolean;
  onProgress?: (data: StreamEvent) => void;
  onComplete?: (data: StreamEvent) => void;
  onError?: (error: Error) => void;
}

/**
 * SSEストリームに接続してエージェント状態を取得
 */
export function useAgentStream(options: UseAgentStreamOptions = {}) {
  const {
    sessionId = `session-${Date.now()}`,
    autoConnect = true,
    onProgress,
    onComplete,
    onError
  } = options;

  const [agents, setAgents] = useState<AgentStreamData[]>([]);
  const [totalProgress, setTotalProgress] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const eventSourceRef = useRef<EventSource | null>(null);

  // SSE接続を開始
  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setIsConnected(false);
    setError(null);

    // シンプルなエンドポイントを使用
    const url = `/api/agents/stream-simple?sessionId=${sessionId}`;
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      console.log('✅ SSE Connected');
    };

    eventSource.onmessage = (event) => {
      try {
        const data: StreamEvent = JSON.parse(event.data);
        
        // イベントタイプごとに処理
        switch (data.type) {
          case 'init':
            if (data.data.agents) {
              setAgents(data.data.agents);
            }
            break;
            
          case 'progress':
            if (data.data.agents) {
              setAgents(data.data.agents);
            }
            if (data.data.totalProgress !== undefined) {
              setTotalProgress(data.data.totalProgress);
            }
            onProgress?.(data);
            break;
            
          case 'output':
            // エージェント出力を処理
            console.log(`📦 Output from ${data.agent}:`, data.data.output);
            break;
            
          case 'complete':
            setIsComplete(true);
            onComplete?.(data);
            eventSource.close();
            break;
            
          case 'error':
            const errorObj = new Error(data.data.error || 'Stream error');
            setError(errorObj);
            onError?.(errorObj);
            break;
        }
      } catch (error) {
        console.error('Parse error:', error);
      }
    };

    eventSource.onerror = (error) => {
      setIsConnected(false);
      const errorObj = new Error('SSE connection error');
      setError(errorObj);
      onError?.(errorObj);
      eventSource.close();
    };

    return eventSource;
  }, [sessionId, onProgress, onComplete, onError]);

  // 接続を切断
  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    }
  }, []);

  // 自動接続
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  // Worker3のDataFlow.tsx用のデータ変換
  const getDataFlowFormat = useCallback(() => {
    return {
      nodes: agents.map((agent, index) => ({
        id: agent.name.toLowerCase(),
        name: agent.name,
        group: index,
        value: agent.progress
      })),
      links: agents.slice(0, -1).map((agent, index) => ({
        source: agent.name.toLowerCase(),
        target: agents[index + 1].name.toLowerCase(),
        value: agent.progress > 0 ? 1 : 0
      })),
      flow: {
        totalProgress,
        activeAgents: agents.filter(a => a.status === 'running').length,
        completedAgents: agents.filter(a => a.status === 'completed').length
      }
    };
  }, [agents, totalProgress]);

  return {
    // 状態
    agents,
    totalProgress,
    isConnected,
    isComplete,
    error,
    
    // アクション
    connect,
    disconnect,
    
    // Worker3用データ
    getDataFlowFormat,
    
    // 便利なヘルパー
    getAgent: (name: string) => agents.find(a => a.name === name),
    isAllComplete: () => agents.every(a => a.status === 'completed'),
    getActiveAgent: () => agents.find(a => a.status === 'running')
  };
}