/**
 * Pause/Resume Control Component
 * エージェント実行の一時停止・再開制御
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useErrorNotification } from '../ErrorNotification/ErrorToast';

// 実行状態
export enum ExecutionState {
  IDLE = 'idle',
  RUNNING = 'running',
  PAUSED = 'paused',
  STOPPED = 'stopped',
  ERROR = 'error'
}

// エージェント状態
interface AgentState {
  name: string;
  state: ExecutionState;
  progress: number;
  lastCheckpoint?: {
    timestamp: Date;
    data: any;
  };
}

// 状態管理ストア
class ExecutionStateStore {
  private static instance: ExecutionStateStore;
  private globalState: ExecutionState = ExecutionState.IDLE;
  private agentStates: Map<string, AgentState> = new Map();
  private listeners: Set<(state: ExecutionState, agents: AgentState[]) => void> = new Set();
  private checkpoints: Map<string, any> = new Map();

  static getInstance() {
    if (!ExecutionStateStore.instance) {
      ExecutionStateStore.instance = new ExecutionStateStore();
    }
    return ExecutionStateStore.instance;
  }

  // グローバル状態の更新
  setGlobalState(state: ExecutionState) {
    this.globalState = state;
    this.notifyListeners();
  }

  getGlobalState() {
    return this.globalState;
  }

  // エージェント状態の更新
  setAgentState(name: string, state: Partial<AgentState>) {
    const current = this.agentStates.get(name) || { name, state: ExecutionState.IDLE, progress: 0 };
    this.agentStates.set(name, { ...current, ...state });
    this.notifyListeners();
  }

  getAgentStates() {
    return Array.from(this.agentStates.values());
  }

  // チェックポイント保存
  saveCheckpoint(agentName: string, data: any) {
    this.checkpoints.set(agentName, {
      timestamp: new Date(),
      data
    });
    
    const agent = this.agentStates.get(agentName);
    if (agent) {
      agent.lastCheckpoint = this.checkpoints.get(agentName);
      this.agentStates.set(agentName, agent);
    }
  }

  getCheckpoint(agentName: string) {
    return this.checkpoints.get(agentName);
  }

  // リスナー管理
  subscribe(listener: (state: ExecutionState, agents: AgentState[]) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    const agents = this.getAgentStates();
    this.listeners.forEach(listener => listener(this.globalState, agents));
  }

  // 全エージェント一時停止
  pauseAll() {
    this.globalState = ExecutionState.PAUSED;
    this.agentStates.forEach((agent, name) => {
      if (agent.state === ExecutionState.RUNNING) {
        this.saveCheckpoint(name, { progress: agent.progress });
        this.setAgentState(name, { state: ExecutionState.PAUSED });
      }
    });
    this.notifyListeners();
  }

  // 全エージェント再開
  resumeAll() {
    this.globalState = ExecutionState.RUNNING;
    this.agentStates.forEach((agent, name) => {
      if (agent.state === ExecutionState.PAUSED) {
        this.setAgentState(name, { state: ExecutionState.RUNNING });
      }
    });
    this.notifyListeners();
  }

  // 全エージェント停止
  stopAll() {
    this.globalState = ExecutionState.STOPPED;
    this.agentStates.forEach((agent, name) => {
      this.setAgentState(name, { state: ExecutionState.STOPPED, progress: 0 });
    });
    this.checkpoints.clear();
    this.notifyListeners();
  }
}

export const executionStore = ExecutionStateStore.getInstance();

/**
 * 一時停止/再開コントロールコンポーネント
 */
export const PauseResumeControl: React.FC<{
  wsClient?: any;
  onStateChange?: (state: ExecutionState) => void;
}> = ({ wsClient, onStateChange }) => {
  const [state, setState] = useState<ExecutionState>(ExecutionState.IDLE);
  const [agents, setAgents] = useState<AgentState[]>([]);
  const [isPending, setIsPending] = useState(false);
  const { showSuccess, showWarning, showError } = useErrorNotification();

  useEffect(() => {
    const unsubscribe = executionStore.subscribe((newState, newAgents) => {
      setState(newState);
      setAgents(newAgents);
      onStateChange?.(newState);
    });
    return unsubscribe;
  }, [onStateChange]);

  // 開始処理
  const handleStart = useCallback(async () => {
    setIsPending(true);
    try {
      if (wsClient) {
        await wsClient.send({
          type: 'command',
          action: 'start_all'
        });
      }
      executionStore.setGlobalState(ExecutionState.RUNNING);
      showSuccess('実行開始', '全エージェントの実行を開始しました');
    } catch (error) {
      showError('開始エラー', '実行の開始に失敗しました');
      console.error(error);
    } finally {
      setIsPending(false);
    }
  }, [wsClient, showSuccess, showError]);

  // 一時停止処理
  const handlePause = useCallback(async () => {
    setIsPending(true);
    try {
      // 現在の進捗を保存
      const runningAgents = agents.filter(a => a.state === ExecutionState.RUNNING);
      
      if (wsClient) {
        await wsClient.send({
          type: 'command',
          action: 'pause_all',
          checkpoints: runningAgents.map(a => ({
            name: a.name,
            progress: a.progress
          }))
        });
      }
      
      executionStore.pauseAll();
      showWarning('一時停止', `${runningAgents.length}個のエージェントを一時停止しました`);
    } catch (error) {
      showError('一時停止エラー', '一時停止に失敗しました');
      console.error(error);
    } finally {
      setIsPending(false);
    }
  }, [agents, wsClient, showWarning, showError]);

  // 再開処理
  const handleResume = useCallback(async () => {
    setIsPending(true);
    try {
      const pausedAgents = agents.filter(a => a.state === ExecutionState.PAUSED);
      const checkpoints = pausedAgents.map(a => ({
        name: a.name,
        checkpoint: executionStore.getCheckpoint(a.name)
      }));

      if (wsClient) {
        await wsClient.send({
          type: 'command',
          action: 'resume_all',
          checkpoints
        });
      }

      executionStore.resumeAll();
      showSuccess('実行再開', `${pausedAgents.length}個のエージェントを再開しました`);
    } catch (error) {
      showError('再開エラー', '実行の再開に失敗しました');
      console.error(error);
    } finally {
      setIsPending(false);
    }
  }, [agents, wsClient, showSuccess, showError]);

  // 停止処理
  const handleStop = useCallback(async () => {
    setIsPending(true);
    try {
      if (wsClient) {
        await wsClient.send({
          type: 'command',
          action: 'stop_all'
        });
      }

      executionStore.stopAll();
      showWarning('実行停止', '全エージェントの実行を停止しました');
    } catch (error) {
      showError('停止エラー', '実行の停止に失敗しました');
      console.error(error);
    } finally {
      setIsPending(false);
    }
  }, [wsClient, showWarning, showError]);

  const getStateColor = () => {
    switch (state) {
      case ExecutionState.RUNNING: return 'bg-green-500';
      case ExecutionState.PAUSED: return 'bg-yellow-500';
      case ExecutionState.STOPPED: return 'bg-gray-500';
      case ExecutionState.ERROR: return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      {/* ステータス表示 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${getStateColor()}`} />
          <span className="font-medium text-gray-700 dark:text-gray-300">
            状態: {state.toUpperCase()}
          </span>
        </div>
        <div className="text-sm text-gray-500">
          実行中: {agents.filter(a => a.state === ExecutionState.RUNNING).length}/{agents.length}
        </div>
      </div>

      {/* コントロールボタン */}
      <div className="flex gap-2">
        {state === ExecutionState.IDLE && (
          <button
            onClick={handleStart}
            disabled={isPending}
            className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              開始
            </span>
          </button>
        )}

        {state === ExecutionState.RUNNING && (
          <button
            onClick={handlePause}
            disabled={isPending}
            className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              一時停止
            </span>
          </button>
        )}

        {state === ExecutionState.PAUSED && (
          <button
            onClick={handleResume}
            disabled={isPending}
            className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              再開
            </span>
          </button>
        )}

        <button
          onClick={handleStop}
          disabled={isPending || state === ExecutionState.IDLE || state === ExecutionState.STOPPED}
          className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          <span className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h6v4H9z" />
            </svg>
            停止
          </span>
        </button>
      </div>

      {/* エージェント進捗表示 */}
      <div className="space-y-2">
        {agents.map(agent => (
          <div key={agent.name} className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 w-20">
              {agent.name}
            </span>
            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  agent.state === ExecutionState.RUNNING ? 'bg-blue-500' :
                  agent.state === ExecutionState.PAUSED ? 'bg-yellow-500' :
                  agent.state === ExecutionState.ERROR ? 'bg-red-500' :
                  'bg-gray-400'
                }`}
                style={{ width: `${agent.progress}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 w-10 text-right">
              {agent.progress}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * 一時停止/再開フック
 */
export const usePauseResume = () => {
  const [state, setState] = useState<ExecutionState>(ExecutionState.IDLE);
  const [agents, setAgents] = useState<AgentState[]>([]);

  useEffect(() => {
    const unsubscribe = executionStore.subscribe((newState, newAgents) => {
      setState(newState);
      setAgents(newAgents);
    });
    return unsubscribe;
  }, []);

  return {
    state,
    agents,
    pause: () => executionStore.pauseAll(),
    resume: () => executionStore.resumeAll(),
    stop: () => executionStore.stopAll(),
    isRunning: state === ExecutionState.RUNNING,
    isPaused: state === ExecutionState.PAUSED,
    isStopped: state === ExecutionState.STOPPED
  };
};