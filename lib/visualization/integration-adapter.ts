/**
 * Integration Adapter for Worker1 and Worker2
 * Quick integration helper for existing components
 */

import { EventEmitter } from 'events';

// Worker1 UI Integration
export interface Worker1Integration {
  component: string;
  agentPipeline?: any;
  dataFlow?: any;
  onAgentClick?: (agentId: string) => void;
  onDataUpdate?: (data: any) => void;
}

// Worker2 SSE Integration
export interface Worker2Integration {
  endpoint: string;
  onMessage?: (data: any) => void;
  onError?: (error: any) => void;
  reconnectInterval?: number;
}

/**
 * Quick Integration Adapter
 */
export class IntegrationAdapter extends EventEmitter {
  private sseConnection: EventSource | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;

  /**
   * Connect Worker1 UI components
   */
  connectWorker1(config: Worker1Integration) {
    // Export integration code for NewProject.tsx
    return {
      imports: `
import AgentPipeline from '@/components/visualization/AgentPipeline';
import DataFlow from '@/components/visualization/DataFlow';
import { getFlowEngine } from '@/lib/visualization/flow-engine';`,
      
      component: `
{/* Agent Pipeline Visualization */}
<div className="mt-6 p-4 bg-white rounded-lg shadow">
  <AgentPipeline 
    interactive={true}
    autoPlay={false}
    showMetrics={true}
  />
</div>`,
      
      handlers: `
// Handle agent clicks
const handleAgentClick = (agentId: string) => {
  console.log('Agent clicked:', agentId);
  // Trigger agent execution
  const flowEngine = getFlowEngine();
  flowEngine.updateAgentStatus(agentId, 'running', 0);
};`,
      
      setup: `
// Add to your component
useEffect(() => {
  const flowEngine = getFlowEngine();
  const unsubscribe = flowEngine.subscribe((state) => {
    console.log('Flow state updated:', state);
  });
  return unsubscribe;
}, []);`
    };
  }

  /**
   * Connect Worker2 SSE stream
   */
  connectWorker2(config: Worker2Integration) {
    if (this.sseConnection) {
      this.sseConnection.close();
    }

    try {
      this.sseConnection = new EventSource(config.endpoint);

      this.sseConnection.onopen = () => {
        console.log('SSE connected to:', config.endpoint);
        this.emit('sse-connected');
      };

      this.sseConnection.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.emit('sse-data', data);
          
          // Transform SSE data for visualization
          const visualData = this.transformSSEData(data);
          this.emit('visual-data', visualData);
          
          if (config.onMessage) {
            config.onMessage(visualData);
          }
        } catch (error) {
          console.error('SSE parse error:', error);
        }
      };

      this.sseConnection.onerror = (error) => {
        console.error('SSE error:', error);
        this.emit('sse-error', error);
        
        if (config.onError) {
          config.onError(error);
        }

        // Auto-reconnect
        if (config.reconnectInterval) {
          this.scheduleReconnect(config);
        }
      };

      return {
        imports: `
import DataFlow from '@/components/visualization/DataFlow';
import { useState, useEffect } from 'react';`,
        
        component: `
{/* Real-time Data Flow */}
<div className="mt-6 p-4 bg-white rounded-lg shadow">
  <DataFlow 
    dataPoints={sseDataPoints}
    realtime={true}
    animationSpeed={1000}
  />
</div>`,
        
        state: `
const [sseDataPoints, setSSEDataPoints] = useState([]);
const [sseConnection, setSSEConnection] = useState(null);`,
        
        setup: `
// SSE Connection setup
useEffect(() => {
  const eventSource = new EventSource('/api/agents/stream');
  
  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    // Transform for visualization
    const dataPoint = {
      id: \`data-\${Date.now()}\`,
      source: data.agent || 'unknown',
      target: data.nextAgent || 'unknown',
      value: data.confidence || Math.random() * 100,
      type: data.type || 'research',
      timestamp: Date.now()
    };
    
    setSSEDataPoints(prev => [...prev.slice(-99), dataPoint]);
  };
  
  eventSource.onerror = (error) => {
    console.error('SSE error:', error);
    eventSource.close();
  };
  
  setSSEConnection(eventSource);
  
  return () => {
    eventSource.close();
  };
}, []);`
      };
    } catch (error) {
      console.error('Failed to connect SSE:', error);
      throw error;
    }
  }

  /**
   * Transform SSE data for visualization components
   */
  private transformSSEData(sseData: any) {
    return {
      id: `data-${Date.now()}-${Math.random()}`,
      source: sseData.currentAgent || 'unknown',
      target: sseData.nextAgent || 'unknown', 
      value: sseData.confidence || sseData.score || Math.random() * 100,
      type: sseData.type || 'process',
      timestamp: Date.now(),
      metadata: sseData
    };
  }

  /**
   * Schedule reconnection
   */
  private scheduleReconnect(config: Worker2Integration) {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = setTimeout(() => {
      console.log('Attempting SSE reconnection...');
      this.connectWorker2(config);
    }, config.reconnectInterval || 5000);
  }

  /**
   * Disconnect all connections
   */
  disconnect() {
    if (this.sseConnection) {
      this.sseConnection.close();
      this.sseConnection = null;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.removeAllListeners();
  }

  /**
   * Generate integration code snippets
   */
  static generateIntegrationCode() {
    return {
      worker1: `
// === Worker1 Integration Example ===
// Add to NewProject.tsx or any UI component

import AgentPipeline from '@/components/visualization/AgentPipeline';
import { getFlowEngine } from '@/lib/visualization/flow-engine';

export default function NewProject() {
  const flowEngine = getFlowEngine();
  
  // In your JSX:
  return (
    <div>
      {/* Your existing UI */}
      
      {/* Add Agent Pipeline */}
      <AgentPipeline 
        interactive={true}
        autoPlay={false}
        showMetrics={true}
      />
    </div>
  );
}`,

      worker2: `
// === Worker2 Integration Example ===
// Add to your SSE handling component

import DataFlow from '@/components/visualization/DataFlow';

export default function SSEMonitor() {
  const [dataPoints, setDataPoints] = useState([]);
  
  useEffect(() => {
    const sse = new EventSource('/api/agents/stream');
    
    sse.onmessage = (e) => {
      const data = JSON.parse(e.data);
      
      // Transform and add to visualization
      const point = {
        id: Date.now().toString(),
        source: data.agent,
        target: data.nextAgent,
        value: data.score,
        type: data.type,
        timestamp: Date.now()
      };
      
      setDataPoints(prev => [...prev.slice(-99), point]);
    };
    
    return () => sse.close();
  }, []);
  
  return <DataFlow dataPoints={dataPoints} realtime={true} />;
}`,

      combined: `
// === Combined Integration ===
import IntegratedDashboard from '@/components/visualization/IntegratedDashboard';

export default function Dashboard() {
  return (
    <IntegratedDashboard 
      websocketUrl="ws://localhost:3001/ws"
      layout="grid"
    />
  );
}`
    };
  }
}

// Export singleton
export const integrationAdapter = new IntegrationAdapter();