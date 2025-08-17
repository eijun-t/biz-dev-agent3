#!/usr/bin/env node

/**
 * WebSocket Metrics Stream Server
 * Real-time performance metrics delivery
 */

const WebSocket = require('ws');
const http = require('http');
const os = require('os');

// Configuration
const PORT = process.env.WS_PORT || 3001;
const UPDATE_INTERVAL = 1000; // 1 second
const METRICS_BUFFER_SIZE = 300; // 5 minutes at 1 second intervals

// Metrics storage
const metricsBuffer = [];
let connectionCount = 0;

// Performance metrics collector
class PerformanceMonitor {
  constructor() {
    this.startTime = Date.now();
    this.lastCPUInfo = this.getCPUInfo();
  }

  getCPUInfo() {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;
    
    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });
    
    return { idle: totalIdle, total: totalTick };
  }

  getCPUUsage() {
    const currentCPUInfo = this.getCPUInfo();
    const idleDiff = currentCPUInfo.idle - this.lastCPUInfo.idle;
    const totalDiff = currentCPUInfo.total - this.lastCPUInfo.total;
    
    const usage = 100 - (100 * idleDiff / totalDiff);
    this.lastCPUInfo = currentCPUInfo;
    
    return Math.min(100, Math.max(0, usage));
  }

  getMemoryUsage() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    
    return {
      total: totalMem,
      used: usedMem,
      free: freeMem,
      percent: (usedMem / totalMem) * 100
    };
  }

  generateMetrics() {
    const timestamp = new Date().toISOString();
    const cpuUsage = this.getCPUUsage();
    const memoryUsage = this.getMemoryUsage();
    const loadAverage = os.loadavg();
    
    // Simulated agent metrics (replace with actual data)
    const agentMetrics = {
      researcher: {
        responseTime: {
          p50: Math.random() * 80 + 20,
          p95: Math.random() * 150 + 50,
          p99: Math.random() * 200 + 100
        },
        throughput: Math.random() * 100 + 50,
        errorRate: Math.random() * 0.02
      },
      ideator: {
        responseTime: {
          p50: Math.random() * 100 + 30,
          p95: Math.random() * 180 + 80,
          p99: Math.random() * 250 + 150
        },
        throughput: Math.random() * 80 + 40,
        errorRate: Math.random() * 0.01
      },
      critic: {
        responseTime: {
          p50: Math.random() * 60 + 15,
          p95: Math.random() * 120 + 40,
          p99: Math.random() * 180 + 80
        },
        throughput: Math.random() * 120 + 60,
        errorRate: Math.random() * 0.005
      },
      analyst: {
        responseTime: {
          p50: Math.random() * 120 + 40,
          p95: Math.random() * 200 + 100,
          p99: Math.random() * 300 + 180
        },
        throughput: Math.random() * 60 + 30,
        errorRate: Math.random() * 0.015
      },
      writer: {
        responseTime: {
          p50: Math.random() * 90 + 25,
          p95: Math.random() * 160 + 70,
          p99: Math.random() * 220 + 120
        },
        throughput: Math.random() * 90 + 45,
        errorRate: Math.random() * 0.008
      }
    };
    
    // API metrics
    const apiMetrics = {
      requestsPerSecond: Math.random() * 1000 + 500,
      activeConnections: connectionCount,
      avgLatency: Math.random() * 50 + 10,
      p95Latency: Math.random() * 150 + 50,
      p99Latency: Math.random() * 200 + 100,
      errorRate: Math.random() * 0.01,
      availability: 99.9 + Math.random() * 0.09
    };
    
    // Performance targets check
    const performanceStatus = {
      p95Target: 180,
      p95Actual: apiMetrics.p95Latency,
      p95Met: apiMetrics.p95Latency < 180,
      throughputTarget: 1250,
      throughputActual: apiMetrics.requestsPerSecond,
      throughputMet: apiMetrics.requestsPerSecond > 1250,
      availabilityTarget: 99.9,
      availabilityActual: apiMetrics.availability,
      availabilityMet: apiMetrics.availability >= 99.9,
      overallHealth: 
        apiMetrics.p95Latency < 180 && 
        apiMetrics.requestsPerSecond > 1250 && 
        apiMetrics.availability >= 99.9 ? 'healthy' : 'degraded'
    };
    
    return {
      timestamp,
      system: {
        cpu: {
          usage: cpuUsage.toFixed(2),
          cores: os.cpus().length,
          loadAverage: {
            '1m': loadAverage[0].toFixed(2),
            '5m': loadAverage[1].toFixed(2),
            '15m': loadAverage[2].toFixed(2)
          }
        },
        memory: {
          used: memoryUsage.used,
          total: memoryUsage.total,
          percent: memoryUsage.percent.toFixed(2)
        },
        uptime: Date.now() - this.startTime
      },
      agents: agentMetrics,
      api: apiMetrics,
      performance: performanceStatus,
      _meta: {
        updateInterval: UPDATE_INTERVAL,
        connectionCount,
        bufferSize: metricsBuffer.length
      }
    };
  }
}

// Create HTTP server
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'healthy', connections: connectionCount }));
  } else if (req.url === '/metrics') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ buffer: metricsBuffer }));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });
const monitor = new PerformanceMonitor();

// Handle WebSocket connections
wss.on('connection', (ws, req) => {
  connectionCount++;
  console.log(`✅ New connection established. Total: ${connectionCount}`);
  
  // Send initial data
  const initialData = {
    type: 'connection',
    message: 'Connected to metrics stream',
    timestamp: new Date().toISOString(),
    historicalData: metricsBuffer.slice(-60) // Last 60 seconds
  };
  ws.send(JSON.stringify(initialData));
  
  // Handle client messages
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      
      if (data.type === 'subscribe') {
        ws.subscribed = true;
        ws.filters = data.filters || [];
        ws.send(JSON.stringify({
          type: 'subscribed',
          message: 'Subscription confirmed',
          filters: ws.filters
        }));
      } else if (data.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      }
    } catch (error) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format'
      }));
    }
  });
  
  // Handle disconnection
  ws.on('close', () => {
    connectionCount--;
    console.log(`👋 Connection closed. Remaining: ${connectionCount}`);
  });
  
  // Handle errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Broadcast metrics to all connected clients
function broadcastMetrics() {
  const metrics = monitor.generateMetrics();
  
  // Store in buffer
  metricsBuffer.push(metrics);
  if (metricsBuffer.length > METRICS_BUFFER_SIZE) {
    metricsBuffer.shift();
  }
  
  // Broadcast to all connected clients
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'metrics',
        data: metrics
      }));
    }
  });
}

// Start broadcasting metrics
setInterval(broadcastMetrics, UPDATE_INTERVAL);

// Start server
server.listen(PORT, () => {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║     WebSocket Metrics Stream Server        ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log('');
  console.log(`🚀 Server running on ws://localhost:${PORT}`);
  console.log(`📊 Metrics update interval: ${UPDATE_INTERVAL}ms`);
  console.log(`💾 Buffer size: ${METRICS_BUFFER_SIZE} samples`);
  console.log('');
  console.log('Endpoints:');
  console.log(`  WebSocket: ws://localhost:${PORT}`);
  console.log(`  Health: http://localhost:${PORT}/health`);
  console.log(`  Metrics: http://localhost:${PORT}/metrics`);
  console.log('');
  console.log('Waiting for connections...');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n⚠️  Shutting down gracefully...');
  
  wss.clients.forEach((client) => {
    client.send(JSON.stringify({
      type: 'shutdown',
      message: 'Server is shutting down'
    }));
    client.close();
  });
  
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

module.exports = { PerformanceMonitor };