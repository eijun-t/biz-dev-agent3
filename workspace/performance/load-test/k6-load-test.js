/**
 * k6 Load Testing Script for Biz-Dev-Agent3
 * Tests API endpoints with 1000 concurrent users
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const apiDuration = new Trend('api_duration');
const agentDuration = new Trend('agent_duration');

// Test configuration
export const options = {
  stages: [
    // Ramp-up phase
    { duration: '2m', target: 100 },   // Warm up to 100 users
    { duration: '3m', target: 500 },   // Ramp to 500 users
    { duration: '5m', target: 1000 },  // Ramp to 1000 users
    { duration: '10m', target: 1000 }, // Stay at 1000 users
    { duration: '5m', target: 500 },   // Scale down to 500
    { duration: '2m', target: 0 },     // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<200', 'p(99)<500'], // 95% < 200ms, 99% < 500ms
    http_req_failed: ['rate<0.1'],                  // Error rate < 10%
    errors: ['rate<0.05'],                           // Custom error rate < 5%
  },
  ext: {
    loadimpact: {
      projectID: 3478723,
      name: 'Biz-Dev-Agent3 Load Test',
    },
  },
};

// Test data
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_KEY = __ENV.API_KEY || 'test-key';

const testAgents = [
  'researcher',
  'ideator',
  'critic',
  'analyst',
  'writer'
];

const testPrompts = [
  'Analyze the market for AI-powered SaaS tools',
  'Generate business ideas for sustainable technology',
  'Evaluate the viability of a subscription box service',
  'Research competitors in the fintech space',
  'Create a business plan executive summary'
];

// Helper functions
function getRandomAgent() {
  return testAgents[Math.floor(Math.random() * testAgents.length)];
}

function getRandomPrompt() {
  return testPrompts[Math.floor(Math.random() * testPrompts.length)];
}

// Test scenarios
export function setup() {
  // Setup code - runs once before the test
  console.log('🚀 Starting load test for Biz-Dev-Agent3');
  console.log(`Target URL: ${BASE_URL}`);
  console.log('Testing with up to 1000 concurrent users');
  
  // Verify API is accessible
  const healthCheck = http.get(`${BASE_URL}/api/health`);
  check(healthCheck, {
    'API is accessible': (r) => r.status === 200,
  });
  
  return { startTime: new Date().toISOString() };
}

export default function () {
  // Main test scenario - executed by each virtual user
  
  // Scenario 1: Health check endpoint
  let response = http.get(`${BASE_URL}/api/health`);
  check(response, {
    'health check status is 200': (r) => r.status === 200,
    'health check response time < 100ms': (r) => r.timings.duration < 100,
  });
  
  sleep(1);
  
  // Scenario 2: Agent execution
  const agent = getRandomAgent();
  const prompt = getRandomPrompt();
  
  const payload = JSON.stringify({
    agent: agent,
    prompt: prompt,
    config: {
      temperature: 0.7,
      maxTokens: 1000,
      timeout: 30000
    }
  });
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    timeout: '30s',
  };
  
  const startTime = new Date().getTime();
  response = http.post(
    `${BASE_URL}/api/agents/execute`,
    payload,
    params
  );
  const duration = new Date().getTime() - startTime;
  
  // Record custom metrics
  agentDuration.add(duration);
  
  const success = check(response, {
    'agent execution status is 200': (r) => r.status === 200,
    'agent execution has result': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.result !== undefined;
      } catch {
        return false;
      }
    },
    'agent execution time < 5s': (r) => r.timings.duration < 5000,
  });
  
  errorRate.add(!success);
  
  sleep(Math.random() * 3 + 1); // Random sleep 1-4 seconds
  
  // Scenario 3: Concurrent API calls
  const batch = [
    ['GET', `${BASE_URL}/api/agents/list`, null, params],
    ['GET', `${BASE_URL}/api/reports/recent`, null, params],
    ['GET', `${BASE_URL}/api/sessions/active`, null, params],
  ];
  
  const batchResponses = http.batch(batch);
  
  batchResponses.forEach((res, index) => {
    check(res, {
      [`batch request ${index} is successful`]: (r) => r.status === 200,
    });
  });
  
  sleep(2);
  
  // Scenario 4: WebSocket connection (if applicable)
  // Note: k6 WebSocket support requires additional configuration
  
  // Scenario 5: File upload simulation
  const fileData = {
    file: http.file('test-data.csv', 'col1,col2,col3\n1,2,3\n4,5,6', 'text/csv'),
  };
  
  response = http.post(
    `${BASE_URL}/api/upload`,
    fileData,
    {
      headers: { 'Authorization': `Bearer ${API_KEY}` },
      timeout: '10s',
    }
  );
  
  check(response, {
    'file upload successful': (r) => r.status === 200 || r.status === 201,
  });
  
  sleep(1);
}

export function teardown(data) {
  // Teardown code - runs once after the test
  console.log('✅ Load test completed');
  console.log(`Started at: ${data.startTime}`);
  console.log(`Ended at: ${new Date().toISOString()}`);
  
  // Generate summary report
  console.log('\n📊 Test Summary:');
  console.log('- Maximum concurrent users: 1000');
  console.log('- Test duration: 27 minutes');
  console.log('- Total requests: calculated by k6');
  console.log('- Success rate: calculated by k6');
}