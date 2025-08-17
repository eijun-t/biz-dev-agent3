#!/usr/bin/env node

/**
 * Agent Performance Benchmark Tool
 * Measures execution time, memory usage, and throughput for all agents
 */

const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const v8 = require('v8');

// Async helpers
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

// Configuration
const ITERATIONS = process.env.BENCHMARK_ITERATIONS || 10;
const WARMUP_RUNS = 3;
const RESULTS_DIR = './benchmark-results';

// Colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// Benchmark results storage
const benchmarkResults = {
  metadata: {
    timestamp: new Date().toISOString(),
    platform: process.platform,
    nodeVersion: process.version,
    cpus: require('os').cpus().length,
    memory: require('os').totalmem(),
  },
  agents: {},
  summary: {}
};

// Utility functions
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function formatTime(ms) {
  if (ms < 1) return `${(ms * 1000).toFixed(2)}µs`;
  if (ms < 1000) return `${ms.toFixed(2)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)}KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)}MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)}GB`;
}

// Memory profiling
function getMemoryUsage() {
  const mem = process.memoryUsage();
  return {
    rss: mem.rss,
    heapTotal: mem.heapTotal,
    heapUsed: mem.heapUsed,
    external: mem.external,
    arrayBuffers: mem.arrayBuffers
  };
}

function getHeapStatistics() {
  const heap = v8.getHeapStatistics();
  return {
    totalHeapSize: heap.total_heap_size,
    usedHeapSize: heap.used_heap_size,
    heapSizeLimit: heap.heap_size_limit,
    mallocedMemory: heap.malloced_memory,
    peakMallocedMemory: heap.peak_malloced_memory
  };
}

// CPU profiling
class CPUProfiler {
  constructor() {
    this.samples = [];
  }
  
  start() {
    this.startCPU = process.cpuUsage();
    this.startTime = performance.now();
  }
  
  stop() {
    const endCPU = process.cpuUsage(this.startCPU);
    const endTime = performance.now();
    const duration = endTime - this.startTime;
    
    this.samples.push({
      user: endCPU.user / 1000, // Convert to ms
      system: endCPU.system / 1000,
      total: (endCPU.user + endCPU.system) / 1000,
      duration,
      cpuPercentage: ((endCPU.user + endCPU.system) / 1000 / duration) * 100
    });
    
    return this.samples[this.samples.length - 1];
  }
  
  getAverage() {
    if (this.samples.length === 0) return null;
    
    const sum = this.samples.reduce((acc, sample) => ({
      user: acc.user + sample.user,
      system: acc.system + sample.system,
      total: acc.total + sample.total,
      cpuPercentage: acc.cpuPercentage + sample.cpuPercentage
    }), { user: 0, system: 0, total: 0, cpuPercentage: 0 });
    
    return {
      user: sum.user / this.samples.length,
      system: sum.system / this.samples.length,
      total: sum.total / this.samples.length,
      cpuPercentage: sum.cpuPercentage / this.samples.length
    };
  }
}

// Agent benchmark functions
async function benchmarkAgent(agentName, agentFunction, testData) {
  log(`\n🤖 Benchmarking ${agentName}...`, colors.cyan);
  
  const results = {
    name: agentName,
    iterations: ITERATIONS,
    timings: [],
    memory: [],
    cpu: new CPUProfiler(),
    errors: 0
  };
  
  // Warmup runs
  log(`  Warming up (${WARMUP_RUNS} runs)...`, colors.yellow);
  for (let i = 0; i < WARMUP_RUNS; i++) {
    try {
      await agentFunction(testData);
    } catch (error) {
      log(`  Warmup error: ${error.message}`, colors.red);
    }
  }
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
  
  // Actual benchmark runs
  log(`  Running benchmark (${ITERATIONS} iterations)...`, colors.blue);
  
  for (let i = 0; i < ITERATIONS; i++) {
    const memBefore = getMemoryUsage();
    const heapBefore = getHeapStatistics();
    
    results.cpu.start();
    const startTime = performance.now();
    
    try {
      await agentFunction(testData);
      const endTime = performance.now();
      const cpuStats = results.cpu.stop();
      
      const memAfter = getMemoryUsage();
      const heapAfter = getHeapStatistics();
      
      const timing = endTime - startTime;
      results.timings.push(timing);
      
      results.memory.push({
        delta: {
          heapUsed: memAfter.heapUsed - memBefore.heapUsed,
          external: memAfter.external - memBefore.external,
          total: (memAfter.heapUsed - memBefore.heapUsed) + (memAfter.external - memBefore.external)
        },
        peak: {
          heapUsed: memAfter.heapUsed,
          total: memAfter.rss
        }
      });
      
      // Progress indicator
      process.stdout.write(`  Progress: ${i + 1}/${ITERATIONS} (${formatTime(timing)})\r`);
      
    } catch (error) {
      results.errors++;
      log(`  Error in iteration ${i + 1}: ${error.message}`, colors.red);
    }
  }
  
  console.log(''); // New line after progress
  
  // Calculate statistics
  const validTimings = results.timings.filter(t => t > 0);
  if (validTimings.length > 0) {
    const sorted = validTimings.sort((a, b) => a - b);
    const stats = {
      min: Math.min(...validTimings),
      max: Math.max(...validTimings),
      mean: validTimings.reduce((a, b) => a + b, 0) / validTimings.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
      stdDev: 0,
      throughput: 1000 / (validTimings.reduce((a, b) => a + b, 0) / validTimings.length)
    };
    
    // Calculate standard deviation
    const variance = validTimings.reduce((acc, time) => 
      acc + Math.pow(time - stats.mean, 2), 0) / validTimings.length;
    stats.stdDev = Math.sqrt(variance);
    
    // Memory statistics
    const memoryDeltas = results.memory.map(m => m.delta.total);
    const memStats = {
      avgDelta: memoryDeltas.reduce((a, b) => a + b, 0) / memoryDeltas.length,
      maxDelta: Math.max(...memoryDeltas),
      avgPeak: results.memory.reduce((a, m) => a + m.peak.heapUsed, 0) / results.memory.length
    };
    
    // CPU statistics
    const cpuStats = results.cpu.getAverage();
    
    // Store results
    benchmarkResults.agents[agentName] = {
      timing: stats,
      memory: memStats,
      cpu: cpuStats,
      errors: results.errors,
      successRate: ((ITERATIONS - results.errors) / ITERATIONS) * 100
    };
    
    // Print results
    log(`  ✅ Completed ${agentName}`, colors.green);
    log(`     Min: ${formatTime(stats.min)} | Max: ${formatTime(stats.max)}`, colors.green);
    log(`     Mean: ${formatTime(stats.mean)} | Median: ${formatTime(stats.median)}`, colors.green);
    log(`     P95: ${formatTime(stats.p95)} | P99: ${formatTime(stats.p99)}`, colors.green);
    log(`     Throughput: ${stats.throughput.toFixed(2)} ops/sec`, colors.green);
    log(`     Memory Delta: ${formatBytes(memStats.avgDelta)} avg`, colors.green);
    log(`     CPU Usage: ${cpuStats.cpuPercentage.toFixed(2)}%`, colors.green);
    
    return stats;
  } else {
    log(`  ❌ All iterations failed for ${agentName}`, colors.red);
    return null;
  }
}

// Mock agent functions for testing
async function mockResearcherAgent(data) {
  await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
  return { result: 'research_complete', data: data.prompt };
}

async function mockIdeatorAgent(data) {
  await new Promise(resolve => setTimeout(resolve, Math.random() * 150 + 100));
  return { result: 'ideas_generated', count: 5 };
}

async function mockCriticAgent(data) {
  await new Promise(resolve => setTimeout(resolve, Math.random() * 80 + 40));
  return { result: 'evaluation_complete', score: Math.random() };
}

async function mockAnalystAgent(data) {
  await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 150));
  return { result: 'analysis_complete', insights: 10 };
}

async function mockWriterAgent(data) {
  await new Promise(resolve => setTimeout(resolve, Math.random() * 120 + 80));
  return { result: 'report_generated', pages: 5 };
}

// Main benchmark runner
async function runBenchmarks() {
  log('\n╔════════════════════════════════════════════╗', colors.cyan);
  log('║     Agent Performance Benchmark Suite     ║', colors.cyan);
  log('╚════════════════════════════════════════════╝', colors.cyan);
  
  log(`\nConfiguration:`, colors.yellow);
  log(`  Iterations: ${ITERATIONS}`);
  log(`  Warmup Runs: ${WARMUP_RUNS}`);
  log(`  Platform: ${process.platform}`);
  log(`  Node Version: ${process.version}`);
  log(`  CPUs: ${require('os').cpus().length}`);
  log(`  Memory: ${formatBytes(require('os').totalmem())}`);
  
  // Create results directory
  await mkdir(RESULTS_DIR, { recursive: true });
  
  const startTime = performance.now();
  
  // Test data
  const testData = {
    prompt: 'Analyze market opportunities for AI-powered business solutions',
    config: { temperature: 0.7, maxTokens: 1000 }
  };
  
  // Run benchmarks for each agent
  const agents = [
    { name: 'Researcher Agent', fn: mockResearcherAgent },
    { name: 'Ideator Agent', fn: mockIdeatorAgent },
    { name: 'Critic Agent', fn: mockCriticAgent },
    { name: 'Analyst Agent', fn: mockAnalystAgent },
    { name: 'Writer Agent', fn: mockWriterAgent }
  ];
  
  for (const agent of agents) {
    await benchmarkAgent(agent.name, agent.fn, testData);
  }
  
  const totalTime = performance.now() - startTime;
  
  // Calculate summary
  benchmarkResults.summary = {
    totalExecutionTime: totalTime,
    totalAgentsTested: Object.keys(benchmarkResults.agents).length,
    avgThroughput: Object.values(benchmarkResults.agents)
      .reduce((sum, agent) => sum + (agent.timing?.throughput || 0), 0) / 
      Object.keys(benchmarkResults.agents).length,
    timestamp: new Date().toISOString()
  };
  
  // Print summary
  log('\n════════════════════════════════════════', colors.cyan);
  log('Benchmark Summary', colors.cyan);
  log('════════════════════════════════════════', colors.cyan);
  log(`Total Execution Time: ${formatTime(totalTime)}`);
  log(`Agents Tested: ${benchmarkResults.summary.totalAgentsTested}`);
  log(`Average Throughput: ${benchmarkResults.summary.avgThroughput.toFixed(2)} ops/sec`);
  
  // Performance grading
  const avgResponseTime = Object.values(benchmarkResults.agents)
    .reduce((sum, agent) => sum + (agent.timing?.p95 || 0), 0) / 
    Object.keys(benchmarkResults.agents).length;
  
  let grade = 'A+';
  if (avgResponseTime > 50) grade = 'A';
  if (avgResponseTime > 100) grade = 'B';
  if (avgResponseTime > 200) grade = 'C';
  if (avgResponseTime > 500) grade = 'D';
  if (avgResponseTime > 1000) grade = 'F';
  
  log(`\n🏆 Performance Grade: ${grade}`, 
    grade.startsWith('A') ? colors.green :
    grade === 'B' ? colors.cyan :
    grade === 'C' ? colors.yellow :
    colors.red
  );
  
  if (avgResponseTime < 200) {
    log('✅ Meeting P95 < 200ms target!', colors.green);
  } else {
    log(`⚠️  P95 average: ${formatTime(avgResponseTime)} (target: < 200ms)`, colors.yellow);
  }
  
  // Save detailed results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(RESULTS_DIR, `benchmark-${timestamp}.json`);
  await writeFile(reportPath, JSON.stringify(benchmarkResults, null, 2));
  
  log(`\n📄 Detailed results saved to: ${reportPath}`, colors.blue);
  
  // Generate HTML report
  await generateHTMLReport(benchmarkResults, path.join(RESULTS_DIR, `benchmark-${timestamp}.html`));
  
  process.exit(grade === 'F' ? 1 : 0);
}

// HTML report generator
async function generateHTMLReport(results, filepath) {
  const html = `<!DOCTYPE html>
<html>
<head>
    <title>Agent Benchmark Report</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 40px; background: #f8f9fa; }
        h1 { color: #212529; }
        .container { max-width: 1200px; margin: 0 auto; }
        .card { background: white; padding: 24px; margin: 24px 0; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .metric { display: inline-block; margin: 0 20px; }
        .metric-value { font-size: 24px; font-weight: bold; color: #0066cc; }
        .metric-label { font-size: 12px; color: #6c757d; text-transform: uppercase; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background: #f1f3f5; padding: 12px; text-align: left; font-weight: 600; }
        td { padding: 12px; border-bottom: 1px solid #e9ecef; }
        .chart-container { width: 100%; height: 300px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Agent Performance Benchmark Report</h1>
        
        <div class="card">
            <h2>System Information</h2>
            <div class="metric">
                <div class="metric-value">${results.metadata.cpus}</div>
                <div class="metric-label">CPU Cores</div>
            </div>
            <div class="metric">
                <div class="metric-value">${(results.metadata.memory / 1024 / 1024 / 1024).toFixed(1)}GB</div>
                <div class="metric-label">Total Memory</div>
            </div>
            <div class="metric">
                <div class="metric-value">${results.metadata.nodeVersion}</div>
                <div class="metric-label">Node Version</div>
            </div>
        </div>
        
        <div class="card">
            <h2>Agent Performance Metrics</h2>
            <table>
                <thead>
                    <tr>
                        <th>Agent</th>
                        <th>Mean Time</th>
                        <th>P95</th>
                        <th>P99</th>
                        <th>Throughput</th>
                        <th>CPU %</th>
                        <th>Success Rate</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(results.agents).map(([name, data]) => `
                        <tr>
                            <td>${name}</td>
                            <td>${data.timing ? formatTime(data.timing.mean) : 'N/A'}</td>
                            <td>${data.timing ? formatTime(data.timing.p95) : 'N/A'}</td>
                            <td>${data.timing ? formatTime(data.timing.p99) : 'N/A'}</td>
                            <td>${data.timing ? data.timing.throughput.toFixed(2) : '0'} ops/s</td>
                            <td>${data.cpu ? data.cpu.cpuPercentage.toFixed(1) : '0'}%</td>
                            <td>${data.successRate.toFixed(1)}%</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        
        <div class="card">
            <h2>Performance Distribution</h2>
            <canvas id="perfChart"></canvas>
        </div>
    </div>
    
    <script>
        const ctx = document.getElementById('perfChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ${JSON.stringify(Object.keys(results.agents))},
                datasets: [{
                    label: 'P95 Response Time (ms)',
                    data: ${JSON.stringify(Object.values(results.agents).map(a => a.timing?.p95 || 0))},
                    backgroundColor: 'rgba(0, 102, 204, 0.6)',
                    borderColor: 'rgba(0, 102, 204, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Response Time (ms)'
                        }
                    }
                }
            }
        });
    </script>
</body>
</html>`;
  
  await writeFile(filepath, html);
  log(`📊 HTML report generated: ${filepath}`, colors.blue);
}

// Error handling
process.on('unhandledRejection', (error) => {
  log(`\nUnhandled error: ${error.message}`, colors.red);
  process.exit(1);
});

// Enable garbage collection for memory profiling
if (process.argv.includes('--expose-gc')) {
  global.gc = global.gc || (() => {});
}

// Run benchmarks
if (require.main === module) {
  runBenchmarks().catch(error => {
    log(`\nBenchmark failed: ${error.message}`, colors.red);
    process.exit(1);
  });
}

module.exports = { benchmarkAgent, CPUProfiler };