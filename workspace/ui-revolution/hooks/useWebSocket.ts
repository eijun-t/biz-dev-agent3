/**
 * WebSocket React Hook
 * 双方向通信の簡単な統合
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { 
  WebSocketClient, 
  WebSocketMessage, 
  ConnectionState, 
  MessageType,
  WebSocketClientOptions 
} from '../lib/websocket-client';

// Hook オプション
interface UseWebSocketOptions extends WebSocketClientOptions {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onMessage?: (message: WebSocketMessage) => void;
  onAgent?: (message: WebSocketMessage) => void;
  onData?: (data: any) => void;
  onError?: (error: Error) => void;
}

// Hook 戻り値
interface UseWebSocketReturn {
  // 状態
  isConnected: boolean;
  connectionState: ConnectionState;
  metrics: {
    messagesSent: number;
    messagesReceived: number;
    averageLatency: number;
    lastLatency: number;
  };
  
  // エージェント状態
  agents: Map<string, AgentState>;
  
  // アクション
  connect: () => Promise<void>;
  disconnect: () => void;
  sendCommand: (agentName: string, command: string, params?: any) => Promise<any>;
  subscribe: (channel: string) => void;
  unsubscribe: (channel: string) => void;
  updateData: (data: any) => void;
  
  // ユーティリティ
  getAgent: (name: string) => AgentState | undefined;
  getAllAgents: () => AgentState[];
  getTotalProgress: () => number;
}

// エージェント状態
interface AgentState {
  name: string;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'error';
  progress: number;
  currentTask?: string;
  output?: any;
  lastUpdate: Date;
}

/**
 * WebSocket Hook
 */
export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [metrics, setMetrics] = useState({
    messagesSent: 0,
    messagesReceived: 0,
    averageLatency: 0,
    lastLatency: 0
  });
  const [agents, setAgents] = useState<Map<string, AgentState>>(new Map());
  
  const clientRef = useRef<WebSocketClient | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // WebSocketクライアント初期化
  useEffect(() => {
    if (!clientRef.current) {
      clientRef.current = new WebSocketClient({
        ...options,
        debug: true
      });

      const client = clientRef.current;

      // イベントリスナー設定
      client.on('connect', () => {
        setIsConnected(true);
        setConnectionState(ConnectionState.CONNECTED);
        options.onConnect?.();
      });

      client.on('disconnect', () => {
        setIsConnected(false);
        setConnectionState(ConnectionState.DISCONNECTED);
        options.onDisconnect?.();
      });

      client.on('stateChange', (state: ConnectionState) => {
        setConnectionState(state);
      });

      client.on('message', (message: WebSocketMessage) => {
        // メトリクス更新
        updateMetrics();
        options.onMessage?.(message);
      });

      client.on('agent', (message: WebSocketMessage) => {
        handleAgentMessage(message);
        options.onAgent?.(message);
      });

      client.on('data', (data: any) => {
        options.onData?.(data);
      });

      client.on('error', (error: Error) => {
        console.error('WebSocket error:', error);
        options.onError?.(error);
      });

      // 自動接続
      if (options.autoReconnect !== false) {
        client.connect().catch(console.error);
      }
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  // メトリクス更新
  const updateMetrics = useCallback(() => {
    if (clientRef.current) {
      const clientMetrics = clientRef.current.getMetrics();
      setMetrics({
        messagesSent: clientMetrics.messagesSent,
        messagesReceived: clientMetrics.messagesReceived,
        averageLatency: Math.round(clientMetrics.averageLatency),
        lastLatency: Math.round(clientMetrics.lastLatency)
      });
    }
  }, []);

  // エージェントメッセージ処理
  const handleAgentMessage = useCallback((message: WebSocketMessage) => {
    if (!message.data.agentName) return;

    setAgents(prev => {
      const updated = new Map(prev);
      const existing = updated.get(message.data.agentName) || {
        name: message.data.agentName,
        status: 'idle',
        progress: 0,
        lastUpdate: new Date()
      };

      // 状態更新
      if (message.type === MessageType.AGENT_STATUS) {
        existing.status = message.data.status;
      }
      if (message.type === MessageType.AGENT_PROGRESS) {
        existing.progress = message.data.progress;
        existing.currentTask = message.data.currentTask;
      }
      if (message.type === MessageType.AGENT_OUTPUT) {
        existing.output = message.data.output;
      }
      if (message.type === MessageType.AGENT_ERROR) {
        existing.status = 'error';
      }
      
      existing.lastUpdate = new Date();
      updated.set(message.data.agentName, existing);
      
      return updated;
    });
  }, []);

  // 接続
  const connect = useCallback(async () => {
    if (clientRef.current && !clientRef.current.isConnected()) {
      await clientRef.current.connect();
    }
  }, []);

  // 切断
  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.disconnect();
    }
  }, []);

  // エージェントコマンド送信
  const sendCommand = useCallback(async (
    agentName: string,
    command: string,
    params?: any
  ) => {
    if (!clientRef.current || !clientRef.current.isConnected()) {
      throw new Error('WebSocket not connected');
    }

    const startTime = Date.now();
    const response = await clientRef.current.sendAgentCommand(
      agentName,
      command as any,
      params
    );
    
    const latency = Date.now() - startTime;
    console.log(`Command executed in ${latency}ms`);
    
    return response;
  }, []);

  // チャンネル購読
  const subscribe = useCallback((channel: string) => {
    if (clientRef.current && clientRef.current.isConnected()) {
      clientRef.current.subscribe(channel);
    }
  }, []);

  // チャンネル購読解除
  const unsubscribe = useCallback((channel: string) => {
    if (clientRef.current && clientRef.current.isConnected()) {
      clientRef.current.unsubscribe(channel);
    }
  }, []);

  // データ更新
  const updateData = useCallback((data: any) => {
    if (clientRef.current && clientRef.current.isConnected()) {
      clientRef.current.updateData(data);
    }
  }, []);

  // エージェント取得
  const getAgent = useCallback((name: string) => {
    return agents.get(name);
  }, [agents]);

  // 全エージェント取得
  const getAllAgents = useCallback(() => {
    return Array.from(agents.values());
  }, [agents]);

  // 総進捗率計算
  const getTotalProgress = useCallback(() => {
    const allAgents = Array.from(agents.values());
    if (allAgents.length === 0) return 0;
    
    const totalProgress = allAgents.reduce((sum, agent) => sum + agent.progress, 0);
    return Math.round(totalProgress / allAgents.length);
  }, [agents]);

  return {
    // 状態
    isConnected,
    connectionState,
    metrics,
    agents,
    
    // アクション
    connect,
    disconnect,
    sendCommand,
    subscribe,
    unsubscribe,
    updateData,
    
    // ユーティリティ
    getAgent,
    getAllAgents,
    getTotalProgress
  };
}

/**
 * Worker3のDataFlow連携用Hook
 */
export function useWebSocketForDataFlow() {
  const ws = useWebSocket({
    autoReconnect: true,
    pingInterval: 10000
  });

  // DataFlow形式に変換
  const getDataFlowFormat = useCallback(() => {
    const agents = ws.getAllAgents();
    
    return {
      nodes: agents.map((agent, index) => ({
        id: agent.name.toLowerCase(),
        name: agent.name,
        group: index,
        value: agent.progress,
        status: agent.status
      })),
      links: agents.slice(0, -1).map((agent, index) => ({
        source: agent.name.toLowerCase(),
        target: agents[index + 1].name.toLowerCase(),
        value: agent.progress > 0 ? agent.progress / 100 : 0,
        active: agent.status === 'running'
      })),
      metrics: {
        totalProgress: ws.getTotalProgress(),
        activeAgents: agents.filter(a => a.status === 'running').length,
        completedAgents: agents.filter(a => a.status === 'completed').length,
        latency: ws.metrics.averageLatency
      }
    };
  }, [ws]);

  return {
    ...ws,
    getDataFlowFormat
  };
}