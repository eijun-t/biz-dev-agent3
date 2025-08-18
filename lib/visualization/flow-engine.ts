/**
 * Flow Engine for Agent Pipeline Visualization
 * Handles the rendering logic for agent flow diagrams
 */

export interface AgentNode {
  id: string;
  name: string;
  type: 'researcher' | 'ideator' | 'critic' | 'analyst' | 'writer';
  status: 'idle' | 'running' | 'completed' | 'error';
  progress: number;
  position: { x: number; y: number };
  data?: any;
  duration?: number;
  startTime?: Date;
  endTime?: Date;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  animated: boolean;
  label?: string;
  data?: any;
  status: 'pending' | 'active' | 'completed';
}

export interface FlowState {
  nodes: AgentNode[];
  edges: FlowEdge[];
  activeNodeId: string | null;
  zoom: number;
  pan: { x: number; y: number };
}

/**
 * FlowEngine class manages the visualization state and animations
 */
export class FlowEngine {
  private state: FlowState;
  private animationFrame: number | null = null;
  private subscribers: Set<(state: FlowState) => void> = new Set();

  constructor() {
    this.state = this.getInitialState();
  }

  /**
   * Initialize the default flow state with 5 agents
   */
  private getInitialState(): FlowState {
    const agents: AgentNode[] = [
      {
        id: 'researcher',
        name: 'Broad Researcher',
        type: 'researcher',
        status: 'idle',
        progress: 0,
        position: { x: 100, y: 200 }
      },
      {
        id: 'ideator',
        name: 'Ideator',
        type: 'ideator',
        status: 'idle',
        progress: 0,
        position: { x: 300, y: 200 }
      },
      {
        id: 'critic',
        name: 'Critic',
        type: 'critic',
        status: 'idle',
        progress: 0,
        position: { x: 500, y: 200 }
      },
      {
        id: 'analyst',
        name: 'Analyst',
        type: 'analyst',
        status: 'idle',
        progress: 0,
        position: { x: 700, y: 200 }
      },
      {
        id: 'writer',
        name: 'Writer',
        type: 'writer',
        status: 'idle',
        progress: 0,
        position: { x: 900, y: 200 }
      }
    ];

    const edges: FlowEdge[] = [
      {
        id: 'e1',
        source: 'researcher',
        target: 'ideator',
        animated: false,
        status: 'pending'
      },
      {
        id: 'e2',
        source: 'ideator',
        target: 'critic',
        animated: false,
        status: 'pending'
      },
      {
        id: 'e3',
        source: 'critic',
        target: 'analyst',
        animated: false,
        status: 'pending'
      },
      {
        id: 'e4',
        source: 'analyst',
        target: 'writer',
        animated: false,
        status: 'pending'
      }
    ];

    return {
      nodes: agents,
      edges,
      activeNodeId: null,
      zoom: 1,
      pan: { x: 0, y: 0 }
    };
  }

  /**
   * Subscribe to state changes
   */
  subscribe(callback: (state: FlowState) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Notify all subscribers of state changes
   */
  private notify() {
    this.subscribers.forEach(callback => callback(this.state));
  }

  /**
   * Update agent status
   */
  updateAgentStatus(agentId: string, status: AgentNode['status'], progress?: number) {
    const node = this.state.nodes.find(n => n.id === agentId);
    if (node) {
      node.status = status;
      if (progress !== undefined) {
        node.progress = Math.min(100, Math.max(0, progress));
      }
      
      if (status === 'running') {
        node.startTime = new Date();
        this.state.activeNodeId = agentId;
        this.animateEdges(agentId);
      } else if (status === 'completed') {
        node.endTime = new Date();
        if (node.startTime) {
          node.duration = node.endTime.getTime() - node.startTime.getTime();
        }
        this.completeEdges(agentId);
      }
      
      this.notify();
    }
  }

  /**
   * Animate edges for active agent
   */
  private animateEdges(agentId: string) {
    const incomingEdge = this.state.edges.find(e => e.target === agentId);
    if (incomingEdge) {
      incomingEdge.animated = true;
      incomingEdge.status = 'active';
    }
  }

  /**
   * Mark edges as completed
   */
  private completeEdges(agentId: string) {
    const outgoingEdge = this.state.edges.find(e => e.source === agentId);
    if (outgoingEdge) {
      outgoingEdge.status = 'completed';
      outgoingEdge.animated = false;
    }
  }

  /**
   * Update zoom level
   */
  setZoom(zoom: number) {
    this.state.zoom = Math.min(2, Math.max(0.5, zoom));
    this.notify();
  }

  /**
   * Update pan position
   */
  setPan(x: number, y: number) {
    this.state.pan = { x, y };
    this.notify();
  }

  /**
   * Get current state
   */
  getState(): FlowState {
    return { ...this.state };
  }

  /**
   * Calculate optimal layout for nodes
   */
  autoLayout() {
    const nodeCount = this.state.nodes.length;
    const width = 1200;
    const height = 400;
    const nodeSpacing = width / (nodeCount + 1);
    
    this.state.nodes.forEach((node, index) => {
      node.position = {
        x: nodeSpacing * (index + 1),
        y: height / 2
      };
    });
    
    this.notify();
  }

  /**
   * Reset flow to initial state
   */
  reset() {
    this.state = this.getInitialState();
    this.notify();
  }

  /**
   * Simulate flow execution
   */
  async simulateFlow(delay: number = 2000) {
    const agents = ['researcher', 'ideator', 'critic', 'analyst', 'writer'];
    
    for (const agentId of agents) {
      // Start agent
      this.updateAgentStatus(agentId, 'running', 0);
      
      // Simulate progress
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, delay / 10));
        this.updateAgentStatus(agentId, 'running', progress);
      }
      
      // Complete agent
      this.updateAgentStatus(agentId, 'completed', 100);
      
      // Small delay before next agent
      await new Promise(resolve => setTimeout(resolve, delay / 5));
    }
  }

  /**
   * Export flow state as JSON
   */
  exportState(): string {
    return JSON.stringify(this.state, null, 2);
  }

  /**
   * Import flow state from JSON
   */
  importState(jsonString: string) {
    try {
      const imported = JSON.parse(jsonString);
      if (imported.nodes && imported.edges) {
        this.state = imported;
        this.notify();
        return true;
      }
    } catch (error) {
      console.error('Failed to import state:', error);
    }
    return false;
  }

  /**
   * Get execution metrics
   */
  getMetrics() {
    const completedNodes = this.state.nodes.filter(n => n.status === 'completed');
    const totalDuration = completedNodes.reduce((sum, node) => sum + (node.duration || 0), 0);
    const avgDuration = completedNodes.length > 0 ? totalDuration / completedNodes.length : 0;
    
    return {
      totalNodes: this.state.nodes.length,
      completedNodes: completedNodes.length,
      totalDuration,
      avgDuration,
      progress: (completedNodes.length / this.state.nodes.length) * 100
    };
  }
}

// Singleton instance
let flowEngineInstance: FlowEngine | null = null;

export function getFlowEngine(): FlowEngine {
  if (!flowEngineInstance) {
    flowEngineInstance = new FlowEngine();
  }
  return flowEngineInstance;
}

// Helper functions for rendering
export const getNodeColor = (status: AgentNode['status']): string => {
  switch (status) {
    case 'idle': return '#e2e8f0';
    case 'running': return '#3b82f6';
    case 'completed': return '#10b981';
    case 'error': return '#ef4444';
    default: return '#e2e8f0';
  }
};

export const getEdgeColor = (status: FlowEdge['status']): string => {
  switch (status) {
    case 'pending': return '#cbd5e1';
    case 'active': return '#3b82f6';
    case 'completed': return '#10b981';
    default: return '#cbd5e1';
  }
};