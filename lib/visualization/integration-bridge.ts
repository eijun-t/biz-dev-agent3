/**
 * Integration Bridge for Visualization Components
 * Connects Worker1 UI components and Worker2 WebSocket data to visualization
 */

import { EventEmitter } from 'events';
import { getFlowEngine } from './flow-engine';

export interface IntegrationData {
  source: string;
  type: 'ui_event' | 'websocket_data' | 'api_response' | 'user_action';
  data: any;
  timestamp: Date;
}

export interface WebSocketMessage {
  type: 'agent_status' | 'metrics' | 'progress' | 'error';
  agentId?: string;
  payload: any;
}

/**
 * Integration Bridge Class
 * Manages data flow between different workers and visualization components
 */
export class IntegrationBridge extends EventEmitter {
  private static instance: IntegrationBridge;
  private websocket: WebSocket | null = null;
  private flowEngine = getFlowEngine();
  private dataBuffer: IntegrationData[] = [];
  private isConnected = false;
  
  private constructor() {
    super();
    this.setupEventListeners();
  }
  
  /**
   * Get singleton instance
   */
  static getInstance(): IntegrationBridge {
    if (!IntegrationBridge.instance) {
      IntegrationBridge.instance = new IntegrationBridge();
    }
    return IntegrationBridge.instance;
  }
  
  /**
   * Setup internal event listeners
   */
  private setupEventListeners() {
    // Listen for flow engine updates
    this.flowEngine.subscribe((state) => {
      this.emit('flow-update', state);
    });
  }
  
  /**
   * Connect to Worker2's WebSocket server
   */
  connectWebSocket(url: string = 'ws://localhost:3001/ws') {
    if (this.websocket && this.isConnected) {
      console.log('WebSocket already connected');
      return;
    }
    
    try {
      this.websocket = new WebSocket(url);
      
      this.websocket.onopen = () => {
        this.isConnected = true;
        console.log('WebSocket connected');
        this.emit('websocket-connected');
        
        // Send initial handshake
        this.sendWebSocketMessage({
          type: 'agent_status',
          payload: { status: 'visualization_ready' }
        });
      };
      
      this.websocket.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleWebSocketMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
      
      this.websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.emit('websocket-error', error);
      };
      
      this.websocket.onclose = () => {
        this.isConnected = false;
        console.log('WebSocket disconnected');
        this.emit('websocket-disconnected');
        
        // Attempt reconnection after 5 seconds
        setTimeout(() => this.connectWebSocket(url), 5000);
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      this.emit('websocket-error', error);
    }
  }
  
  /**
   * Handle incoming WebSocket messages
   */
  private handleWebSocketMessage(message: WebSocketMessage) {
    const integrationData: IntegrationData = {
      source: 'websocket',
      type: 'websocket_data',
      data: message,
      timestamp: new Date()
    };
    
    this.dataBuffer.push(integrationData);
    this.emit('data-received', integrationData);
    
    // Update flow engine based on message type
    switch (message.type) {
      case 'agent_status':
        if (message.agentId && message.payload.status) {
          this.flowEngine.updateAgentStatus(
            message.agentId,
            message.payload.status,
            message.payload.progress
          );
        }
        break;
        
      case 'metrics':
        this.emit('metrics-update', message.payload);
        break;
        
      case 'progress':
        this.emit('progress-update', message.payload);
        break;
        
      case 'error':
        this.emit('error', message.payload);
        break;
    }
  }
  
  /**
   * Send message through WebSocket
   */
  sendWebSocketMessage(message: WebSocketMessage) {
    if (this.websocket && this.isConnected) {
      this.websocket.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, queuing message');
      // Queue message for later sending
      this.once('websocket-connected', () => {
        this.sendWebSocketMessage(message);
      });
    }
  }
  
  /**
   * Bridge UI component events to visualization
   */
  bridgeUIEvent(componentName: string, eventType: string, data: any) {
    const integrationData: IntegrationData = {
      source: `ui_${componentName}`,
      type: 'ui_event',
      data: { eventType, ...data },
      timestamp: new Date()
    };
    
    this.dataBuffer.push(integrationData);
    this.emit('ui-event', integrationData);
    
    // Handle specific UI events
    if (eventType === 'agent_click') {
      this.flowEngine.updateAgentStatus(data.agentId, 'running', 0);
      this.simulateAgentProgress(data.agentId);
    }
  }
  
  /**
   * Simulate agent progress for demo/testing
   */
  private simulateAgentProgress(agentId: string) {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      this.flowEngine.updateAgentStatus(agentId, 'running', progress);
      
      // Send progress through WebSocket
      this.sendWebSocketMessage({
        type: 'progress',
        agentId,
        payload: { progress }
      });
      
      if (progress >= 100) {
        clearInterval(interval);
        this.flowEngine.updateAgentStatus(agentId, 'completed', 100);
        
        // Send completion status
        this.sendWebSocketMessage({
          type: 'agent_status',
          agentId,
          payload: { status: 'completed', progress: 100 }
        });
      }
    }, 500);
  }
  
  /**
   * Get buffered data for replay/analysis
   */
  getDataBuffer(limit?: number): IntegrationData[] {
    if (limit) {
      return this.dataBuffer.slice(-limit);
    }
    return [...this.dataBuffer];
  }
  
  /**
   * Clear data buffer
   */
  clearDataBuffer() {
    this.dataBuffer = [];
  }
  
  /**
   * Export integration data for analysis
   */
  exportData(): string {
    return JSON.stringify({
      buffer: this.dataBuffer,
      flowState: this.flowEngine.getState(),
      metrics: this.flowEngine.getMetrics(),
      timestamp: new Date().toISOString()
    }, null, 2);
  }
  
  /**
   * Import integration data for replay
   */
  importData(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.buffer) {
        this.dataBuffer = data.buffer;
      }
      if (data.flowState) {
        this.flowEngine.importState(JSON.stringify(data.flowState));
      }
      this.emit('data-imported', data);
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }
  
  /**
   * Disconnect and cleanup
   */
  disconnect() {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    this.isConnected = false;
    this.removeAllListeners();
  }
}

// Export singleton instance getter
export function getIntegrationBridge(): IntegrationBridge {
  return IntegrationBridge.getInstance();
}

// React Hook for using the integration bridge
export function useIntegrationBridge() {
  const bridge = getIntegrationBridge();
  
  return {
    bridge,
    connectWebSocket: (url?: string) => bridge.connectWebSocket(url),
    bridgeUIEvent: (component: string, event: string, data: any) => 
      bridge.bridgeUIEvent(component, event, data),
    sendMessage: (message: WebSocketMessage) => bridge.sendWebSocketMessage(message),
    getBuffer: (limit?: number) => bridge.getDataBuffer(limit),
    exportData: () => bridge.exportData(),
    importData: (data: string) => bridge.importData(data)
  };
}