#!/usr/bin/env node

/**
 * Performance Test Suite for Biz-Dev-Agent3
 * Benchmarks and load testing for all agents
 */

const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Test configuration
const BENCHMARK_ITERATIONS = 10;
const LOAD_TEST_CONCURRENT = 5;
const TIMEOUT_THRESHOLD = 5000; // 5 seconds

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

// Performance metrics storage
const metrics = {
  benchmarks: [],
  loadTests: [],
  memoryUsage: [],
  summary: {}
};

// Utility functions
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function formatTime(ms) {
  if (ms < 1000) return `${ms.toFixed(2)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)}MB`;
}

// Benchmark functions
async function measurePerformance(name, fn, iterations = BENCHMARK_ITERATIONS) {
  const results = [];
  let memBefore, memAfter;
  
  log(`\n📊 Benchmarking: ${name}`, colors.cyan);
  
  for (let i = 0; i < iterations; i++) {
    // Memory before
    if (global.gc) global.gc();
    memBefore = process.memoryUsage();
    
    // Performance measurement
    const start = performance.now();
    try {
      await fn();
      const duration = performance.now() - start;
      
      // Memory after
      memAfter = process.memoryUsage();
      
      results.push({
        iteration: i + 1,
        duration,
        memory: {
          heapUsed: memAfter.heapUsed - memBefore.heapUsed,
          external: memAfter.external - memBefore.external
        }
      });
      
      process.stdout.write(`  Iteration ${i + 1}/${iterations}: ${formatTime(duration)}\r`);
    } catch (error) {
      results.push({
        iteration: i + 1,
        error: error.message
      });
    }
  }
  
  // Calculate statistics
  const validResults = results.filter(r => !r.error);
  if (validResults.length > 0) {
    const times = validResults.map(r => r.duration);
    const min = Math.min(...times);
    const max = Math.max(...times);
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const median = times.sort((a, b) => a - b)[Math.floor(times.length / 2)];
    
    const stats = {
      name,
      iterations,
      successful: validResults.length,
      failed: results.length - validResults.length,
      min: formatTime(min),
      max: formatTime(max),
      avg: formatTime(avg),
      median: formatTime(median),
      throughput: `${(1000 / avg).toFixed(2)} ops/sec`
    };
    
    metrics.benchmarks.push(stats);
    
    console.log(''); // Clear line
    log(`  ✓ Min: ${stats.min} | Max: ${stats.max} | Avg: ${stats.avg} | Median: ${stats.median}`, colors.green);
    log(`  ✓ Throughput: ${stats.throughput}`, colors.green);
    
    return stats;
  } else {
    log(`  ✗ All iterations failed`, colors.red);
    return null;
  }
}

// Load test functions
async function runLoadTest(name, fn, concurrent = LOAD_TEST_CONCURRENT) {
  log(`\n🔥 Load Testing: ${name} (${concurrent} concurrent)`, colors.magenta);
  
  const promises = [];
  const startTime = performance.now();
  
  for (let i = 0; i < concurrent; i++) {
    promises.push(
      fn().then(result => ({
        success: true,
        duration: performance.now() - startTime,
        result
      })).catch(error => ({
        success: false,
        duration: performance.now() - startTime,
        error: error.message
      }))
    );
  }
  
  const results = await Promise.all(promises);
  const totalDuration = performance.now() - startTime;
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  const loadStats = {
    name,
    concurrent,
    successful,
    failed,
    totalDuration: formatTime(totalDuration),
    avgResponseTime: formatTime(totalDuration / concurrent),
    successRate: `${((successful / concurrent) * 100).toFixed(2)}%`
  };
  
  metrics.loadTests.push(loadStats);
  
  log(`  ✓ Success Rate: ${loadStats.successRate}`, successful === concurrent ? colors.green : colors.yellow);
  log(`  ✓ Total Time: ${loadStats.totalDuration} | Avg Response: ${loadStats.avgResponseTime}`, colors.green);
  
  return loadStats;
}

// Memory profiling
function profileMemory(label) {
  const mem = process.memoryUsage();
  const stats = {
    label,
    timestamp: new Date().toISOString(),
    rss: formatBytes(mem.rss),
    heapTotal: formatBytes(mem.heapTotal),
    heapUsed: formatBytes(mem.heapUsed),
    external: formatBytes(mem.external),
    arrayBuffers: formatBytes(mem.arrayBuffers)
  };
  
  metrics.memoryUsage.push(stats);
  
  log(`\n💾 Memory Profile: ${label}`, colors.blue);
  log(`  RSS: ${stats.rss} | Heap: ${stats.heapUsed}/${stats.heapTotal}`, colors.cyan);
  
  return stats;
}

// Test scenarios
async function testFileSystemPerformance() {
  const testFile = path.join(__dirname, 'perf-test-temp.txt');
  const testData = 'x'.repeat(1024 * 100); // 100KB
  
  return measurePerformance('File System Operations', async () => {
    // Write
    fs.writeFileSync(testFile, testData);
    // Read
    const data = fs.readFileSync(testFile, 'utf8');
    // Delete
    fs.unlinkSync(testFile);
  });
}

async function testJSONParsing() {
  const complexObject = {
    agents: Array(100).fill(null).map((_, i) => ({
      id: `agent-${i}`,
      config: { model: 'gpt-4', temperature: 0.7 },
      history: Array(50).fill(null).map((_, j) => ({
        role: j % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${j}`
      }))
    }))
  };
  
  const jsonString = JSON.stringify(complexObject);
  
  return measurePerformance('JSON Parse/Stringify', async () => {
    const str = JSON.stringify(complexObject);
    const obj = JSON.parse(str);
  });
}

async function testAgentInitialization() {
  return measurePerformance('Agent Initialization', async () => {
    // Simulate agent initialization
    const agents = ['researcher', 'ideator', 'critic', 'analyst', 'writer'];
    const initialized = agents.map(name => ({
      name,
      ready: true,
      config: { timeout: 30000 }
    }));
  }, 5); // Fewer iterations for expensive operations
}

async function testConcurrentAgentCalls() {
  return runLoadTest('Concurrent Agent Calls', async () => {
    // Simulate agent API call
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
    return { success: true, agentId: Math.random() };
  }, 10);
}

// Main test runner
async function runPerformanceTests() {
  log('\n╔════════════════════════════════════════════╗', colors.cyan);
  log('║       Performance Test Suite              ║', colors.cyan);
  log('╚════════════════════════════════════════════╝', colors.cyan);
  
  const startTime = performance.now();
  
  // Initial memory profile
  profileMemory('Test Start');
  
  // Run benchmarks
  log('\n═══ Benchmark Tests ═══', colors.cyan);
  await testFileSystemPerformance();
  await testJSONParsing();
  await testAgentInitialization();
  
  // Memory check
  profileMemory('After Benchmarks');
  
  // Run load tests
  log('\n═══ Load Tests ═══', colors.cyan);
  await testConcurrentAgentCalls();
  
  // Final memory profile
  profileMemory('Test Complete');
  
  const totalDuration = performance.now() - startTime;
  
  // Generate summary
  metrics.summary = {
    totalDuration: formatTime(totalDuration),
    totalBenchmarks: metrics.benchmarks.length,
    totalLoadTests: metrics.loadTests.length,
    memoryProfiles: metrics.memoryUsage.length,
    timestamp: new Date().toISOString()
  };
  
  // Print summary
  log('\n════════════════════════════════════════', colors.cyan);
  log('Performance Test Summary', colors.cyan);
  log('════════════════════════════════════════', colors.cyan);
  log(`Total Duration: ${metrics.summary.totalDuration}`);
  log(`Benchmarks Run: ${metrics.summary.totalBenchmarks}`);
  log(`Load Tests Run: ${metrics.summary.totalLoadTests}`);
  log(`Memory Profiles: ${metrics.summary.memoryProfiles}`);
  
  // Performance grade
  const avgBenchmarkTime = metrics.benchmarks.reduce((sum, b) => {
    const time = parseFloat(b.avg);
    return sum + (isNaN(time) ? 0 : time);
  }, 0) / metrics.benchmarks.length;
  
  let grade = 'A';
  if (avgBenchmarkTime > 100) grade = 'B';
  if (avgBenchmarkTime > 500) grade = 'C';
  if (avgBenchmarkTime > 1000) grade = 'D';
  if (avgBenchmarkTime > 5000) grade = 'F';
  
  log(`\n🏆 Performance Grade: ${grade}`, 
    grade === 'A' ? colors.green : 
    grade === 'B' ? colors.cyan :
    grade === 'C' ? colors.yellow :
    colors.red
  );
  
  // Save detailed report
  const reportPath = path.join(__dirname, `performance-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(metrics, null, 2));
  log(`\n📄 Detailed report saved to: ${reportPath}`, colors.blue);
  
  // Exit with appropriate code
  process.exit(grade === 'F' ? 1 : 0);
}

// Error handling
process.on('unhandledRejection', (error) => {
  log(`\nUnhandled error: ${error.message}`, colors.red);
  process.exit(1);
});

// Run tests
if (require.main === module) {
  runPerformanceTests().catch(error => {
    log(`\nTest suite failed: ${error.message}`, colors.red);
    process.exit(1);
  });
}

module.exports = { measurePerformance, runLoadTest, profileMemory };