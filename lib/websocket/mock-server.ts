/**
 * Mock WebSocket Server for Testing Integration
 * Simulates Worker2's WebSocket server for development
 */

import { WebSocketServer } from 'ws';
import { createServer } from 'http';

interface Client {
  id: string;
  ws: any;
  subscriptions: Set<string>;
}

export class MockWebSocketServer {
  private wss: WebSocketServer | null = null;
  private server: any = null;
  private clients: Map<string, Client> = new Map();
  private port: number;
  private simulationInterval: NodeJS.Timeout | null = null;

  constructor(port: number = 3001) {
    this.port = port;
  }

  /**
   * Start the mock WebSocket server
   */
  start() {
    // Create HTTP server
    this.server = createServer();
    
    // Create WebSocket server
    this.wss = new WebSocketServer({ 
      server: this.server,
      path: '/ws'
    });

    this.wss.on('connection', (ws, req) => {
      const clientId = this.generateClientId();
      const client: Client = {
        id: clientId,
        ws,
        subscriptions: new Set()
      };
      
      this.clients.set(clientId, client);
      console.log(`Client connected: ${clientId}`);

      // Send welcome message
      this.sendToClient(clientId, {
        type: 'connection',
        payload: {
          clientId,
          message: 'Connected to mock WebSocket server',
          timestamp: new Date().toISOString()
        }
      });

      // Handle messages from client
      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleClientMessage(clientId, message);
        } catch (error) {
          console.error('Failed to parse message:', error);
        }
      });

      // Handle client disconnect
      ws.on('close', () => {
        console.log(`Client disconnected: ${clientId}`);
        this.clients.delete(clientId);
      });

      ws.on('error', (error) => {
        console.error(`Client error (${clientId}):`, error);
      });
    });

    // Start server
    this.server.listen(this.port, () => {
      console.log(`Mock WebSocket server running on ws://localhost:${this.port}/ws`);
      this.startSimulation();
    });
  }

  /**
   * Handle messages from clients
   */
  private handleClientMessage(clientId: string, message: any) {
    console.log(`Message from ${clientId}:`, message);

    switch (message.type) {
      case 'subscribe':
        this.handleSubscribe(clientId, message.payload);
        break;
        
      case 'unsubscribe':
        this.handleUnsubscribe(clientId, message.payload);
        break;
        
      case 'agent_status':
        this.broadcastAgentStatus(message.payload);
        break;
        
      case 'request_metrics':
        this.sendMetrics(clientId);
        break;
        
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  /**
   * Handle subscription requests
   */
  private handleSubscribe(clientId: string, topics: string[]) {
    const client = this.clients.get(clientId);
    if (client) {
      topics.forEach(topic => client.subscriptions.add(topic));
      console.log(`Client ${clientId} subscribed to:`, topics);
    }
  }

  /**
   * Handle unsubscribe requests
   */
  private handleUnsubscribe(clientId: string, topics: string[]) {
    const client = this.clients.get(clientId);
    if (client) {
      topics.forEach(topic => client.subscriptions.delete(topic));
      console.log(`Client ${clientId} unsubscribed from:`, topics);
    }
  }

  /**
   * Send message to specific client
   */
  private sendToClient(clientId: string, message: any) {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === 1) { // WebSocket.OPEN
      client.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Broadcast message to all clients
   */
  private broadcast(message: any, topic?: string) {
    this.clients.forEach((client, clientId) => {
      if (!topic || client.subscriptions.has(topic)) {
        this.sendToClient(clientId, message);
      }
    });
  }

  /**
   * Broadcast agent status update
   */
  private broadcastAgentStatus(status: any) {
    this.broadcast({
      type: 'agent_status',
      agentId: status.agentId,
      payload: status,
      timestamp: new Date().toISOString()
    }, 'agent_status');
  }

  /**
   * Send metrics to client
   */
  private sendMetrics(clientId: string) {
    const metrics = this.generateMockMetrics();
    this.sendToClient(clientId, {
      type: 'metrics',
      payload: metrics,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Generate mock metrics
   */
  private generateMockMetrics() {
    return {
      p50: 40 + Math.random() * 20,
      p95: 80 + Math.random() * 40,
      p99: 120 + Math.random() * 60,
      throughput: 1200 + Math.random() * 400,
      errorRate: Math.random() * 0.02,
      cpuUsage: 30 + Math.random() * 40,
      memoryUsage: 40 + Math.random() * 30,
      activeAgents: Math.floor(Math.random() * 5) + 1,
      queuedTasks: Math.floor(Math.random() * 10),
      completedTasks: Math.floor(Math.random() * 100)
    };
  }

  /**
   * Start simulation for testing
   */
  private startSimulation() {
    const agents = ['researcher', 'ideator', 'critic', 'analyst', 'writer'];
    let currentAgentIndex = 0;

    // Simulate agent pipeline execution
    this.simulationInterval = setInterval(() => {
      // Send metrics update
      this.broadcast({
        type: 'metrics',
        payload: this.generateMockMetrics(),
        timestamp: new Date().toISOString()
      }, 'metrics');

      // Simulate agent progress
      if (Math.random() > 0.7) {
        const agentId = agents[currentAgentIndex];
        const progress = Math.floor(Math.random() * 100);
        
        this.broadcast({
          type: 'progress',
          agentId,
          payload: {
            taskId: `task-${agentId}-${Date.now()}`,
            progress,
            status: progress === 100 ? 'completed' : 'in_progress'
          },
          timestamp: new Date().toISOString()
        }, 'progress');

        if (progress === 100) {
          currentAgentIndex = (currentAgentIndex + 1) % agents.length;
        }
      }

      // Simulate data flow
      if (Math.random() > 0.5) {
        const sourceIdx = Math.floor(Math.random() * (agents.length - 1));
        const targetIdx = sourceIdx + 1;
        
        this.broadcast({
          type: 'data_flow',
          payload: {
            source: agents[sourceIdx],
            target: agents[targetIdx],
            value: Math.random() * 100,
            dataType: ['research', 'idea', 'evaluation', 'analysis'][sourceIdx]
          },
          timestamp: new Date().toISOString()
        }, 'data_flow');
      }

      // Simulate occasional errors
      if (Math.random() > 0.95) {
        this.broadcast({
          type: 'error',
          payload: {
            agentId: agents[Math.floor(Math.random() * agents.length)],
            error: 'Simulated error for testing',
            severity: Math.random() > 0.5 ? 'warning' : 'error'
          },
          timestamp: new Date().toISOString()
        }, 'errors');
      }
    }, 2000);
  }

  /**
   * Stop the mock server
   */
  stop() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }

    this.clients.forEach((client) => {
      client.ws.close();
    });
    this.clients.clear();

    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }

    if (this.server) {
      this.server.close();
      this.server = null;
    }

    console.log('Mock WebSocket server stopped');
  }

  /**
   * Generate unique client ID
   */
  private generateClientId(): string {
    return `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export for use in Next.js API routes or standalone
export function createMockWebSocketServer(port?: number) {
  return new MockWebSocketServer(port);
}