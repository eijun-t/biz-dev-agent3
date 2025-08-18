/**
 * Agent State Management System
 * Emergency Implementation by Worker3
 * Centralized state for all agents
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { wsManager } from '../realtime/websocket-manager';
import { dataFetcher } from '../api/data-fetcher';

// Agent types
export type AgentStatus = 'idle' | 'processing' | 'completed' | 'error' | 'waiting';

export interface AgentMetrics {
  inputTokens: number;
  outputTokens: number;
  processingTime: number;
  accuracy?: number;
  cost?: number;
}

export interface Agent {
  id: string;
  name: string;
  type: 'researcher' | 'ideator' | 'critic' | 'analyst' | 'writer';
  status: AgentStatus;
  progress: number;
  currentTask?: string;
  metrics?: AgentMetrics;
  output?: any;
  error?: string;
  lastUpdate: Date;
  dependencies?: string[];
}

export interface Pipeline {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'completed' | 'failed' | 'paused';
  agents: Agent[];
  currentAgentId?: string;
  totalProgress: number;
  startTime?: Date;
  endTime?: Date;
  input?: any;
  output?: any;
  metrics?: {
    totalTime: number;
    totalCost: number;
    throughput: number;
    errorRate: number;
  };
}

interface AgentStateStore {
  // State
  pipelines: Map<string, Pipeline>;
  currentPipelineId?: string;
  agents: Map<string, Agent>;
  isRealtime: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  
  // Actions
  initializePipeline: (pipeline: Partial<Pipeline>) => string;
  updateAgent: (agentId: string, updates: Partial<Agent>) => void;
  updatePipeline: (pipelineId: string, updates: Partial<Pipeline>) => void;
  startPipeline: (pipelineId: string) => Promise<void>;
  stopPipeline: (pipelineId: string) => void;
  resetPipeline: (pipelineId: string) => void;
  setCurrentPipeline: (pipelineId: string) => void;
  connectRealtime: () => void;
  disconnectRealtime: () => void;
  
  // Computed
  getCurrentPipeline: () => Pipeline | undefined;
  getAgent: (agentId: string) => Agent | undefined;
  getPipelineProgress: (pipelineId: string) => number;
}

/**
 * Create Agent State Store
 */
export const useAgentStore = create<AgentStateStore>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // Initial state
        pipelines: new Map(),
        agents: new Map(),
        isRealtime: false,
        connectionStatus: 'disconnected',
        
        // Initialize pipeline
        initializePipeline: (pipelineData) => {
          const id = pipelineData.id || `pipeline-${Date.now()}`;
          
          const pipeline: Pipeline = {
            id,
            name: pipelineData.name || 'New Pipeline',
            status: 'idle',
            agents: pipelineData.agents || createDefaultAgents(),
            totalProgress: 0,
            ...pipelineData
          };
          
          set((state) => {
            state.pipelines.set(id, pipeline);
            
            // Add agents to global map
            pipeline.agents.forEach(agent => {
              state.agents.set(agent.id, agent);
            });
            
            if (!state.currentPipelineId) {
              state.currentPipelineId = id;
            }
          });
          
          return id;
        },
        
        // Update agent
        updateAgent: (agentId, updates) => {
          set((state) => {
            const agent = state.agents.get(agentId);
            if (agent) {
              Object.assign(agent, updates, {
                lastUpdate: new Date()
              });
              
              // Update pipeline progress
              const pipeline = Array.from(state.pipelines.values())
                .find(p => p.agents.some(a => a.id === agentId));
              
              if (pipeline) {
                const totalProgress = calculatePipelineProgress(pipeline.agents);
                pipeline.totalProgress = totalProgress;
                
                // Check if pipeline completed
                if (pipeline.agents.every(a => a.status === 'completed')) {
                  pipeline.status = 'completed';
                  pipeline.endTime = new Date();
                }
              }
            }
          });
        },
        
        // Update pipeline
        updatePipeline: (pipelineId, updates) => {
          set((state) => {
            const pipeline = state.pipelines.get(pipelineId);
            if (pipeline) {
              Object.assign(pipeline, updates);
            }
          });
        },
        
        // Start pipeline
        startPipeline: async (pipelineId) => {
          const pipeline = get().pipelines.get(pipelineId);
          if (!pipeline) return;
          
          set((state) => {
            const p = state.pipelines.get(pipelineId);
            if (p) {
              p.status = 'running';
              p.startTime = new Date();
              p.totalProgress = 0;
              
              // Reset agents
              p.agents.forEach(agent => {
                agent.status = 'idle';
                agent.progress = 0;
                agent.error = undefined;
              });
            }
          });
          
          // Start execution
          await executePipeline(pipeline, get().updateAgent);
        },
        
        // Stop pipeline
        stopPipeline: (pipelineId) => {
          set((state) => {
            const pipeline = state.pipelines.get(pipelineId);
            if (pipeline) {
              pipeline.status = 'paused';
              pipeline.agents.forEach(agent => {
                if (agent.status === 'processing') {
                  agent.status = 'idle';
                }
              });
            }
          });
        },
        
        // Reset pipeline
        resetPipeline: (pipelineId) => {
          set((state) => {
            const pipeline = state.pipelines.get(pipelineId);
            if (pipeline) {
              pipeline.status = 'idle';
              pipeline.totalProgress = 0;
              pipeline.startTime = undefined;
              pipeline.endTime = undefined;
              pipeline.output = undefined;
              
              pipeline.agents.forEach(agent => {
                agent.status = 'idle';
                agent.progress = 0;
                agent.output = undefined;
                agent.error = undefined;
              });
            }
          });
        },
        
        // Set current pipeline
        setCurrentPipeline: (pipelineId) => {
          set((state) => {
            state.currentPipelineId = pipelineId;
          });
        },
        
        // Connect to realtime updates
        connectRealtime: () => {
          // Subscribe to WebSocket updates
          wsManager.subscribe('agents');
          wsManager.subscribe('pipeline');
          
          // Handle updates
          wsManager.on('update:agents', (data) => {
            if (Array.isArray(data)) {
              data.forEach((agentData: any) => {
                get().updateAgent(agentData.id, agentData);
              });
            }
          });
          
          wsManager.on('update:pipeline', (data) => {
            get().updatePipeline(data.id, data);
          });
          
          // Update connection status
          wsManager.on('connected', () => {
            set({ connectionStatus: 'connected', isRealtime: true });
          });
          
          wsManager.on('disconnected', () => {
            set({ connectionStatus: 'disconnected', isRealtime: false });
          });
          
          // Connect
          wsManager.connect();
        },
        
        // Disconnect from realtime
        disconnectRealtime: () => {
          wsManager.unsubscribe('agents');
          wsManager.unsubscribe('pipeline');
          wsManager.disconnect();
          set({ isRealtime: false, connectionStatus: 'disconnected' });
        },
        
        // Get current pipeline
        getCurrentPipeline: () => {
          const id = get().currentPipelineId;
          return id ? get().pipelines.get(id) : undefined;
        },
        
        // Get agent
        getAgent: (agentId) => {
          return get().agents.get(agentId);
        },
        
        // Get pipeline progress
        getPipelineProgress: (pipelineId) => {
          const pipeline = get().pipelines.get(pipelineId);
          return pipeline?.totalProgress || 0;
        }
      }))
    ),
    {
      name: 'agent-state'
    }
  )
);

/**
 * Create default agents
 */
function createDefaultAgents(): Agent[] {
  const agentTypes: Agent['type'][] = ['researcher', 'ideator', 'critic', 'analyst', 'writer'];
  
  return agentTypes.map((type, index) => ({
    id: `agent-${type}`,
    name: type.charAt(0).toUpperCase() + type.slice(1),
    type,
    status: 'idle',
    progress: 0,
    lastUpdate: new Date(),
    dependencies: index > 0 ? [`agent-${agentTypes[index - 1]}`] : []
  }));
}

/**
 * Calculate pipeline progress
 */
function calculatePipelineProgress(agents: Agent[]): number {
  if (agents.length === 0) return 0;
  
  const totalProgress = agents.reduce((sum, agent) => sum + agent.progress, 0);
  return Math.round(totalProgress / agents.length);
}

/**
 * Execute pipeline (simulation)
 */
async function executePipeline(
  pipeline: Pipeline,
  updateAgent: (id: string, updates: Partial<Agent>) => void
): Promise<void> {
  // Sequential execution
  for (const agent of pipeline.agents) {
    // Check dependencies
    const dependenciesMet = !agent.dependencies || 
      agent.dependencies.every(depId => {
        const dep = pipeline.agents.find(a => a.id === depId);
        return dep?.status === 'completed';
      });
    
    if (!dependenciesMet) {
      updateAgent(agent.id, { status: 'waiting' });
      continue;
    }
    
    // Start processing
    updateAgent(agent.id, { 
      status: 'processing',
      progress: 0,
      currentTask: `Processing ${agent.type} task`
    });
    
    // Simulate progress
    for (let progress = 0; progress <= 100; progress += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      updateAgent(agent.id, { progress });
    }
    
    // Complete
    updateAgent(agent.id, {
      status: 'completed',
      progress: 100,
      output: { result: `${agent.type} output` },
      metrics: {
        inputTokens: Math.floor(Math.random() * 1000),
        outputTokens: Math.floor(Math.random() * 2000),
        processingTime: Math.random() * 5000
      }
    });
  }
}

// Export store and types
export default useAgentStore;