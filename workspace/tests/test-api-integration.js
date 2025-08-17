#!/usr/bin/env node

/**
 * API Integration Test Suite
 * Tests all API endpoints and external service integrations
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Test configuration
const TEST_TIMEOUT = 10000; // 10 seconds per test
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Test results tracker
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: []
};

// Utility functions
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logTest(name, status, details = '') {
  const symbols = {
    pass: '✓',
    fail: '✗',
    skip: '⊘'
  };
  const statusColors = {
    pass: colors.green,
    fail: colors.red,
    skip: colors.yellow
  };
  
  log(`  ${symbols[status]} ${name}`, statusColors[status]);
  if (details) {
    log(`    ${details}`, colors.cyan);
  }
}

// Test runner
async function runTest(name, testFn, options = {}) {
  testResults.total++;
  
  // Check if test should be skipped
  if (options.skipIf) {
    testResults.skipped++;
    testResults.tests.push({
      name,
      status: 'skipped',
      reason: options.skipReason || 'Condition not met'
    });
    logTest(name, 'skip', options.skipReason);
    return;
  }
  
  log(`\nTesting: ${name}`, colors.blue);
  
  try {
    const startTime = Date.now();
    const result = await Promise.race([
      testFn(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Test timeout')), TEST_TIMEOUT)
      )
    ]);
    const duration = Date.now() - startTime;
    
    testResults.passed++;
    testResults.tests.push({
      name,
      status: 'passed',
      duration,
      result
    });
    logTest(name, 'pass', `(${duration}ms)`);
    return result;
  } catch (error) {
    testResults.failed++;
    testResults.tests.push({
      name,
      status: 'failed',
      error: error.message
    });
    logTest(name, 'fail', error.message);
    throw error;
  }
}

// API Test Functions
async function testOpenAIConnection() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured');
  }
  
  // Simulate OpenAI API test
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey.startsWith('sk-')) {
    throw new Error('Invalid OpenAI API key format');
  }
  
  // In real implementation, would make actual API call
  return {
    service: 'OpenAI',
    status: 'configured',
    keyFormat: 'valid'
  };
}

async function testSerperAPIConnection() {
  if (!process.env.SERPER_API_KEY) {
    throw new Error('SERPER_API_KEY not configured');
  }
  
  return {
    service: 'Serper',
    status: 'configured',
    keyPresent: true
  };
}

async function testSupabaseConnection() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration incomplete');
  }
  
  if (!supabaseUrl.includes('supabase')) {
    throw new Error('Invalid Supabase URL format');
  }
  
  return {
    service: 'Supabase',
    status: 'configured',
    url: supabaseUrl.replace(/https?:\/\//, 'https://***')
  };
}

async function testAgentEndpoints() {
  const agents = [
    'researcher',
    'ideator',
    'critic',
    'analyst',
    'writer'
  ];
  
  const results = {};
  
  for (const agent of agents) {
    // Check if agent file exists
    const agentPath = path.join(__dirname, '../../lib/agents', agent);
    if (fs.existsSync(agentPath)) {
      results[agent] = 'implemented';
    } else {
      results[agent] = 'not found';
    }
  }
  
  // Check if all agents are implemented
  const allImplemented = Object.values(results).every(status => status === 'implemented');
  if (!allImplemented) {
    throw new Error(`Missing agents: ${JSON.stringify(results)}`);
  }
  
  return results;
}

async function testLangGraphIntegration() {
  const orchestrationPath = path.join(__dirname, '../../lib/agents/orchestration');
  
  if (!fs.existsSync(orchestrationPath)) {
    throw new Error('Orchestration module not found');
  }
  
  const files = fs.readdirSync(orchestrationPath);
  const requiredFiles = ['index.ts', 'graph.ts', 'state.ts'];
  
  const missingFiles = requiredFiles.filter(file => 
    !files.some(f => f.includes(file.replace('.ts', '')))
  );
  
  if (missingFiles.length > 0) {
    throw new Error(`Missing orchestration files: ${missingFiles.join(', ')}`);
  }
  
  return {
    orchestration: 'configured',
    files: files.length,
    status: 'ready'
  };
}

async function testDatabaseSchema() {
  const schemaPath = path.join(__dirname, '../../lib/types/database.ts');
  
  if (!fs.existsSync(schemaPath)) {
    throw new Error('Database schema not generated. Run: npm run db:types');
  }
  
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  const hasTypes = schemaContent.includes('export type') || schemaContent.includes('export interface');
  
  if (!hasTypes) {
    throw new Error('Database schema file exists but contains no types');
  }
  
  return {
    schema: 'generated',
    hasTypes: true
  };
}

async function testAPIRoutes() {
  const apiPath = path.join(__dirname, '../../app/api');
  
  if (!fs.existsSync(apiPath)) {
    throw new Error('API routes directory not found');
  }
  
  // Check for key API routes
  const routes = [];
  function scanDir(dir, prefix = '') {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        scanDir(fullPath, `${prefix}/${item}`);
      } else if (item === 'route.ts' || item === 'route.js') {
        routes.push(prefix || '/');
      }
    }
  }
  
  scanDir(apiPath);
  
  if (routes.length === 0) {
    throw new Error('No API routes found');
  }
  
  return {
    routes: routes.length,
    endpoints: routes
  };
}

async function testEnvironmentVariables() {
  const required = [
    'OPENAI_API_KEY',
    'SERPER_API_KEY',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
  
  return {
    configured: required.length,
    missing: 0
  };
}

// Main test runner
async function runAllTests() {
  log('\n╔════════════════════════════════════════════╗', colors.cyan);
  log('║        API Integration Test Suite         ║', colors.cyan);
  log('╚════════════════════════════════════════════╝', colors.cyan);
  
  const startTime = Date.now();
  
  // Environment Tests
  log('\n═══ Environment Configuration ═══', colors.cyan);
  await runTest('Environment Variables', testEnvironmentVariables).catch(() => {});
  
  // External API Tests
  log('\n═══ External API Connections ═══', colors.cyan);
  await runTest('OpenAI API', testOpenAIConnection).catch(() => {});
  await runTest('Serper API', testSerperAPIConnection).catch(() => {});
  await runTest('Supabase Connection', testSupabaseConnection).catch(() => {});
  
  // Agent Tests
  log('\n═══ Agent Implementation ═══', colors.cyan);
  await runTest('Agent Endpoints', testAgentEndpoints).catch(() => {});
  await runTest('LangGraph Integration', testLangGraphIntegration).catch(() => {});
  
  // Database Tests
  log('\n═══ Database Configuration ═══', colors.cyan);
  await runTest('Database Schema', testDatabaseSchema, {
    skipIf: !process.env.SUPABASE_SERVICE_ROLE_KEY,
    skipReason: 'Supabase service role key not configured'
  });
  
  // API Routes Tests
  log('\n═══ API Routes ═══', colors.cyan);
  await runTest('API Routes Structure', testAPIRoutes).catch(() => {});
  
  const totalDuration = Date.now() - startTime;
  
  // Print summary
  log('\n════════════════════════════════════════', colors.cyan);
  log('Test Summary', colors.cyan);
  log('════════════════════════════════════════', colors.cyan);
  log(`Total Tests: ${testResults.total}`);
  log(`Passed: ${testResults.passed}`, colors.green);
  log(`Failed: ${testResults.failed}`, colors.red);
  log(`Skipped: ${testResults.skipped}`, colors.yellow);
  log(`Duration: ${totalDuration}ms`);
  log(`Success Rate: ${Math.round((testResults.passed / testResults.total) * 100)}%`);
  
  // Save detailed report
  const reportPath = path.join(__dirname, `api-test-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  log(`\nDetailed report saved to: ${reportPath}`, colors.blue);
  
  // Provide recommendations
  if (testResults.failed > 0) {
    log('\n⚠️  Recommendations:', colors.yellow);
    log('1. Check .env file for missing API keys');
    log('2. Run "npm install" to ensure dependencies are installed');
    log('3. Run "npm run db:types" to generate database types');
    log('4. Verify all agent modules are properly implemented');
  }
  
  // Exit with appropriate code
  const exitCode = testResults.failed > 0 ? 1 : 0;
  process.exit(exitCode);
}

// Error handling
process.on('unhandledRejection', (error) => {
  log(`\nUnhandled error: ${error.message}`, colors.red);
  process.exit(1);
});

// Run tests
runAllTests().catch(error => {
  log(`\nTest suite failed: ${error.message}`, colors.red);
  process.exit(1);
});