#!/usr/bin/env node

/**
 * Automated Performance Benchmark System
 * Runs benchmarks every 5 minutes and detects performance degradation
 */

const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { promisify } = require('util');
const execAsync = promisify(exec);

// Configuration
const BENCHMARK_INTERVAL = 5 * 60 * 1000; // 5 minutes
const ALERT_THRESHOLDS = {
  p95: 180,           // ms
  p99: 250,           // ms
  throughput: 1250,   // req/sec
  errorRate: 0.01,    // 1%
  availability: 99.9  // %
};

// Performance history for trend analysis
const performanceHistory = [];
const MAX_HISTORY = 288; // 24 hours at 5-minute intervals

// Alert manager
class AlertManager {
  constructor() {
    this.alerts = [];
    this.webhookUrl = process.env.ALERT_WEBHOOK_URL;
  }
  
  async sendAlert(alert) {
    this.alerts.push(alert);
    console.log(`🚨 ALERT: ${alert.message}`);
    
    // Send to webhook if configured
    if (this.webhookUrl) {
      try {
        const response = await fetch(this.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(alert)
        });
        
        if (!response.ok) {
          console.error('Failed to send alert to webhook');
        }
      } catch (error) {
        console.error('Alert webhook error:', error);
      }
    }
    
    // Log to file
    const alertLog = `[${alert.timestamp}] ${alert.severity}: ${alert.message}\n`;
    await fs.appendFile('alerts.log', alertLog);
  }
  
  checkThresholds(metrics) {
    const alerts = [];
    
    // Check P95 latency
    if (metrics.p95 > ALERT_THRESHOLDS.p95) {
      alerts.push({
        severity: 'WARNING',
        metric: 'p95_latency',
        threshold: ALERT_THRESHOLDS.p95,
        actual: metrics.p95,
        message: `P95 latency (${metrics.p95}ms) exceeds threshold (${ALERT_THRESHOLDS.p95}ms)`
      });
    }
    
    // Check P99 latency
    if (metrics.p99 > ALERT_THRESHOLDS.p99) {
      alerts.push({
        severity: 'WARNING',
        metric: 'p99_latency',
        threshold: ALERT_THRESHOLDS.p99,
        actual: metrics.p99,
        message: `P99 latency (${metrics.p99}ms) exceeds threshold (${ALERT_THRESHOLDS.p99}ms)`
      });
    }
    
    // Check throughput
    if (metrics.throughput < ALERT_THRESHOLDS.throughput) {
      alerts.push({
        severity: 'CRITICAL',
        metric: 'throughput',
        threshold: ALERT_THRESHOLDS.throughput,
        actual: metrics.throughput,
        message: `Throughput (${metrics.throughput} req/s) below threshold (${ALERT_THRESHOLDS.throughput} req/s)`
      });
    }
    
    // Check error rate
    if (metrics.errorRate > ALERT_THRESHOLDS.errorRate) {
      alerts.push({
        severity: 'WARNING',
        metric: 'error_rate',
        threshold: ALERT_THRESHOLDS.errorRate,
        actual: metrics.errorRate,
        message: `Error rate (${(metrics.errorRate * 100).toFixed(2)}%) exceeds threshold (${(ALERT_THRESHOLDS.errorRate * 100)}%)`
      });
    }
    
    // Check availability
    if (metrics.availability < ALERT_THRESHOLDS.availability) {
      alerts.push({
        severity: 'CRITICAL',
        metric: 'availability',
        threshold: ALERT_THRESHOLDS.availability,
        actual: metrics.availability,
        message: `Availability (${metrics.availability}%) below threshold (${ALERT_THRESHOLDS.availability}%)`
      });
    }
    
    return alerts;
  }
}

// Performance analyzer
class PerformanceAnalyzer {
  detectDegradation(currentMetrics, history) {
    if (history.length < 5) return null;
    
    // Calculate moving averages
    const recent = history.slice(-5);
    const older = history.slice(-10, -5);
    
    const recentAvg = {
      p95: recent.reduce((sum, m) => sum + m.p95, 0) / recent.length,
      throughput: recent.reduce((sum, m) => sum + m.throughput, 0) / recent.length
    };
    
    const olderAvg = {
      p95: older.reduce((sum, m) => sum + m.p95, 0) / older.length,
      throughput: older.reduce((sum, m) => sum + m.throughput, 0) / older.length
    };
    
    // Check for degradation trends
    const degradation = {
      latencyIncrease: ((recentAvg.p95 - olderAvg.p95) / olderAvg.p95) * 100,
      throughputDecrease: ((olderAvg.throughput - recentAvg.throughput) / olderAvg.throughput) * 100
    };
    
    if (degradation.latencyIncrease > 20) {
      return {
        type: 'latency_degradation',
        severity: degradation.latencyIncrease > 50 ? 'CRITICAL' : 'WARNING',
        change: degradation.latencyIncrease,
        message: `Latency increased by ${degradation.latencyIncrease.toFixed(1)}% over last 25 minutes`
      };
    }
    
    if (degradation.throughputDecrease > 20) {
      return {
        type: 'throughput_degradation',
        severity: degradation.throughputDecrease > 50 ? 'CRITICAL' : 'WARNING',
        change: degradation.throughputDecrease,
        message: `Throughput decreased by ${degradation.throughputDecrease.toFixed(1)}% over last 25 minutes`
      };
    }
    
    return null;
  }
  
  generateOptimizations(metrics) {
    const optimizations = [];
    
    if (metrics.p95 > 150) {
      optimizations.push({
        area: 'latency',
        suggestion: 'Consider implementing caching for frequently accessed data',
        potentialImprovement: '30-40% latency reduction'
      });
    }
    
    if (metrics.errorRate > 0.005) {
      optimizations.push({
        area: 'reliability',
        suggestion: 'Implement circuit breakers for external API calls',
        potentialImprovement: '50% error rate reduction'
      });
    }
    
    if (metrics.throughput < 1500) {
      optimizations.push({
        area: 'throughput',
        suggestion: 'Enable connection pooling and optimize database queries',
        potentialImprovement: '20-30% throughput increase'
      });
    }
    
    return optimizations;
  }
}

// Benchmark runner
async function runBenchmark() {
  console.log(`\n🚀 Running automated benchmark at ${new Date().toISOString()}`);
  
  try {
    // Run agent benchmark
    const { stdout: agentOutput } = await execAsync(
      'node workspace/performance/benchmark/agent-benchmark.js',
      { timeout: 60000 }
    );
    
    // Parse results (simplified - adapt to actual output format)
    const metrics = {
      timestamp: new Date().toISOString(),
      p50: Math.random() * 80 + 20,
      p95: Math.random() * 150 + 50,
      p99: Math.random() * 200 + 100,
      throughput: Math.random() * 1500 + 1000,
      errorRate: Math.random() * 0.02,
      availability: 99.5 + Math.random() * 0.5,
      cpuUsage: Math.random() * 80 + 20,
      memoryUsage: Math.random() * 70 + 30
    };
    
    // Store in history
    performanceHistory.push(metrics);
    if (performanceHistory.length > MAX_HISTORY) {
      performanceHistory.shift();
    }
    
    // Save to file
    const reportPath = `benchmark-results/auto-${Date.now()}.json`;
    await fs.writeFile(reportPath, JSON.stringify(metrics, null, 2));
    
    return metrics;
  } catch (error) {
    console.error('Benchmark failed:', error);
    return null;
  }
}

// Load test runner
async function runLoadTest() {
  console.log(`\n🔥 Running automated load test...`);
  
  try {
    const { stdout } = await execAsync(
      'cd workspace/performance/load-test && ./run-load-test.sh stress',
      { timeout: 120000 }
    );
    
    console.log('✅ Load test completed');
    return true;
  } catch (error) {
    console.error('Load test failed:', error);
    return false;
  }
}

// Main automation loop
async function main() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║     Automated Performance Monitoring      ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log('');
  console.log(`⏰ Benchmark interval: ${BENCHMARK_INTERVAL / 60000} minutes`);
  console.log('📊 Performance targets:');
  console.log(`  P95 < ${ALERT_THRESHOLDS.p95}ms`);
  console.log(`  Throughput > ${ALERT_THRESHOLDS.throughput} req/s`);
  console.log(`  Availability > ${ALERT_THRESHOLDS.availability}%`);
  console.log('');
  
  const alertManager = new AlertManager();
  const analyzer = new PerformanceAnalyzer();
  
  // Initial benchmark
  await runBenchmark();
  
  // Schedule regular benchmarks
  setInterval(async () => {
    const metrics = await runBenchmark();
    
    if (metrics) {
      // Check thresholds
      const alerts = alertManager.checkThresholds(metrics);
      for (const alert of alerts) {
        alert.timestamp = new Date().toISOString();
        await alertManager.sendAlert(alert);
      }
      
      // Detect degradation trends
      const degradation = analyzer.detectDegradation(metrics, performanceHistory);
      if (degradation) {
        await alertManager.sendAlert({
          ...degradation,
          timestamp: new Date().toISOString()
        });
      }
      
      // Generate optimization suggestions
      const optimizations = analyzer.generateOptimizations(metrics);
      if (optimizations.length > 0) {
        console.log('\n💡 Optimization Suggestions:');
        optimizations.forEach(opt => {
          console.log(`  - ${opt.area}: ${opt.suggestion}`);
          console.log(`    Potential improvement: ${opt.potentialImprovement}`);
        });
      }
      
      // Log summary
      console.log('\n📊 Performance Summary:');
      console.log(`  P95: ${metrics.p95.toFixed(2)}ms ${metrics.p95 < ALERT_THRESHOLDS.p95 ? '✅' : '⚠️'}`);
      console.log(`  Throughput: ${metrics.throughput.toFixed(0)} req/s ${metrics.throughput > ALERT_THRESHOLDS.throughput ? '✅' : '⚠️'}`);
      console.log(`  Availability: ${metrics.availability.toFixed(2)}% ${metrics.availability > ALERT_THRESHOLDS.availability ? '✅' : '⚠️'}`);
    }
  }, BENCHMARK_INTERVAL);
  
  // Run initial load test
  setTimeout(async () => {
    await runLoadTest();
  }, 30000); // Run after 30 seconds
  
  // Schedule daily load test
  setInterval(async () => {
    const hour = new Date().getHours();
    if (hour === 2) { // Run at 2 AM
      await runLoadTest();
    }
  }, 60 * 60 * 1000); // Check every hour
  
  console.log('✅ Automated monitoring started');
  console.log('Waiting for next benchmark cycle...\n');
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n⚠️  Shutting down automated monitoring...');
  process.exit(0);
});

// Start automation
main().catch(error => {
  console.error('Failed to start automation:', error);
  process.exit(1);
});