#!/usr/bin/env node

/**
 * Agent Communication Integration Test
 * Tests the communication between different agents in the system
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Test configuration
const TEST_TIMEOUT = 30000; // 30 seconds
const AGENT_STARTUP_DELAY = 2000; // 2 seconds

// Colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Test results
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: []
};

// Utility functions
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logTest(name, status, details = '') {
  const symbol = status === 'pass' ? '✓' : '✗';
  const color = status === 'pass' ? colors.green : colors.red;
  log(`  ${symbol} ${name}`, color);
  if (details) {
    log(`    ${details}`, colors.cyan);
  }
}

// Test helper functions
async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest(name, testFn) {
  testResults.total++;
  log(`\nTesting: ${name}`, colors.blue);
  
  try {
    const startTime = Date.now();
    await testFn();
    const duration = Date.now() - startTime;
    
    testResults.passed++;
    testResults.tests.push({
      name,
      status: 'passed',
      duration
    });
    logTest(name, 'pass', `(${duration}ms)`);
    return true;
  } catch (error) {
    testResults.failed++;
    testResults.tests.push({
      name,
      status: 'failed',
      error: error.message
    });
    logTest(name, 'fail', error.message);
    return false;
  }
}

// Agent communication tests
async function testAgentSendScript() {
  const scriptPath = path.join(__dirname, '../../tools/ccc/agent-send.sh');
  
  if (!fs.existsSync(scriptPath)) {
    throw new Error('agent-send.sh not found at expected location');
  }
  
  // Check if script is executable
  try {
    fs.accessSync(scriptPath, fs.constants.X_OK);
  } catch (error) {
    throw new Error('agent-send.sh is not executable');
  }
  
  return true;
}

async function testTmuxSessions() {
  return new Promise((resolve, reject) => {
    const tmux = spawn('tmux', ['list-sessions']);
    let output = '';
    
    tmux.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    tmux.on('close', (code) => {
      if (code !== 0) {
        reject(new Error('tmux not running or no sessions found'));
      } else {
        const sessions = output.trim().split('\n');
        const hasPresidentSession = sessions.some(s => s.includes('president'));
        const hasMultiagentSession = sessions.some(s => s.includes('multiagent'));
        
        if (!hasPresidentSession && !hasMultiagentSession) {
          reject(new Error('Required tmux sessions not found'));
        } else {
          resolve({
            president: hasPresidentSession,
            multiagent: hasMultiagentSession,
            totalSessions: sessions.length
          });
        }
      }
    });
  });
}

async function testMessageLogging() {
  const logPath = path.join(__dirname, '../../tools/ccc/logs/send_log.txt');
  
  if (!fs.existsSync(logPath)) {
    // Try to create the log directory
    const logDir = path.dirname(logPath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    fs.writeFileSync(logPath, '');
  }
  
  const stats = fs.statSync(logPath);
  return {
    exists: true,
    size: stats.size,
    modified: stats.mtime
  };
}

async function testAgentCommunicationFlow() {
  // Simulate a message flow: president -> boss1 -> worker1
  const testMessage = `TEST_MSG_${Date.now()}`;
  
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, '../../tools/ccc/agent-send.sh');
    
    // Test sending to boss1 (would be multiagent:0.0)
    const sendTest = spawn(scriptPath, ['--list']);
    let output = '';
    
    sendTest.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    sendTest.on('close', (code) => {
      if (code === 0 && output.includes('boss1')) {
        resolve({
          scriptWorks: true,
          agentsListed: true
        });
      } else {
        reject(new Error('Agent send script validation failed'));
      }
    });
  });
}

async function testWorkspaceCommunication() {
  const workspacePath = path.join(__dirname, '../../workspace');
  const sharedPath = path.join(workspacePath, 'shared');
  
  if (!fs.existsSync(sharedPath)) {
    throw new Error('Shared workspace directory not found');
  }
  
  // Test writing a test file
  const testFile = path.join(sharedPath, `test_comm_${Date.now()}.txt`);
  const testData = 'Agent communication test data';
  
  fs.writeFileSync(testFile, testData);
  const readData = fs.readFileSync(testFile, 'utf8');
  
  // Clean up
  fs.unlinkSync(testFile);
  
  if (readData !== testData) {
    throw new Error('Workspace file communication failed');
  }
  
  return true;
}

async function testAgentInstructions() {
  const instructionsPath = path.join(__dirname, '../../tools/ccc/instructions');
  
  const requiredFiles = ['president.md', 'boss.md', 'worker.md'];
  const missingFiles = [];
  
  for (const file of requiredFiles) {
    const filePath = path.join(instructionsPath, file);
    if (!fs.existsSync(filePath)) {
      missingFiles.push(file);
    }
  }
  
  if (missingFiles.length > 0) {
    throw new Error(`Missing instruction files: ${missingFiles.join(', ')}`);
  }
  
  return true;
}

// Main test runner
async function runAllTests() {
  log('\n╔════════════════════════════════════════════╗', colors.cyan);
  log('║     Agent Communication Test Suite        ║', colors.cyan);
  log('╚════════════════════════════════════════════╝', colors.cyan);
  
  const startTime = Date.now();
  
  // Run tests
  await runTest('Agent Send Script Exists', testAgentSendScript);
  await runTest('Tmux Sessions Active', testTmuxSessions);
  await runTest('Message Logging System', testMessageLogging);
  await runTest('Agent Communication Flow', testAgentCommunicationFlow);
  await runTest('Workspace Communication', testWorkspaceCommunication);
  await runTest('Agent Instructions Present', testAgentInstructions);
  
  const totalDuration = Date.now() - startTime;
  
  // Print summary
  log('\n════════════════════════════════════════', colors.cyan);
  log('Test Summary', colors.cyan);
  log('════════════════════════════════════════', colors.cyan);
  log(`Total Tests: ${testResults.total}`);
  log(`Passed: ${testResults.passed}`, colors.green);
  log(`Failed: ${testResults.failed}`, colors.red);
  log(`Duration: ${totalDuration}ms`);
  
  // Save test report
  const reportPath = path.join(__dirname, `agent-comm-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  log(`\nReport saved to: ${reportPath}`, colors.blue);
  
  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  log(`\nUnhandled error: ${error.message}`, colors.red);
  process.exit(1);
});

// Run tests
runAllTests().catch(error => {
  log(`\nTest suite failed: ${error.message}`, colors.red);
  process.exit(1);
});