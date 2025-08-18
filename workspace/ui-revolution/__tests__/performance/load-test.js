/**
 * Performance Load Test for Report History System
 * Target: < 100ms response time under load
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const apiResponseTime = new Trend('api_response_time');
const dbQueryTime = new Trend('db_query_time');
const cacheHitRate = new Rate('cache_hits');

// Test configuration
export const options = {
  stages: [
    { duration: '1m', target: 100 },  // Ramp up to 100 users
    { duration: '3m', target: 100 },  // Stay at 100 users
    { duration: '1m', target: 500 },  // Spike to 500 users
    { duration: '2m', target: 500 },  // Stay at 500 users
    { duration: '1m', target: 1000 }, // Peak load 1000 users
    { duration: '2m', target: 1000 }, // Maintain peak
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<100', 'p(99)<200'], // 95% under 100ms, 99% under 200ms
    errors: ['rate<0.01'],                          // Error rate under 1%
    api_response_time: ['p(95)<80'],                // API response under 80ms
    cache_hits: ['rate>0.7'],                        // Cache hit rate above 70%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Test data
const searchQueries = [
  'healthcare', 'AI', 'energy', 'sustainable', 'technology',
  'innovation', 'market', 'analysis', 'report', 'business'
];

const statusFilters = ['all', 'completed', 'in_progress', 'draft'];

// Helper functions
function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateReportData() {
  return {
    title: `Performance Test Report ${Date.now()}`,
    summary: 'This is a test report generated during load testing',
    content: 'Full content of the test report...',
    status: getRandomElement(['draft', 'in_progress', 'completed']),
    score: Math.floor(Math.random() * 100),
    tags: ['test', 'performance', 'k6'],
    agents: ['researcher', 'analyst'],
  };
}

// Setup function
export function setup() {
  // Create test data
  const setupData = [];
  for (let i = 0; i < 10; i++) {
    const res = http.post(
      `${BASE_URL}/api/reports/save`,
      JSON.stringify(generateReportData()),
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    if (res.status === 201) {
      const data = JSON.parse(res.body);
      setupData.push(data.data.id);
    }
  }
  
  return { reportIds: setupData };
}

// Main test scenario
export default function(data) {
  const scenario = Math.random();
  
  // Scenario 1: Search reports (40% of traffic)
  if (scenario < 0.4) {
    const query = getRandomElement(searchQueries);
    const startTime = Date.now();
    
    const res = http.get(`${BASE_URL}/api/reports/search?q=${query}&limit=20`);
    
    const responseTime = Date.now() - startTime;
    apiResponseTime.add(responseTime);
    
    const success = check(res, {
      'search status is 200': (r) => r.status === 200,
      'search response time < 100ms': (r) => responseTime < 100,
      'search returns data': (r) => {
        const body = JSON.parse(r.body);
        return body.success === true;
      },
      'search has pagination': (r) => {
        const body = JSON.parse(r.body);
        return body.pagination !== undefined;
      },
    });
    
    if (!success) {
      errorRate.add(1);
    } else {
      errorRate.add(0);
      
      // Check if response was cached
      const body = JSON.parse(res.body);
      if (body.cached) {
        cacheHitRate.add(1);
      } else {
        cacheHitRate.add(0);
      }
    }
  }
  
  // Scenario 2: Filter by status (20% of traffic)
  else if (scenario < 0.6) {
    const status = getRandomElement(statusFilters);
    const startTime = Date.now();
    
    const res = http.get(`${BASE_URL}/api/reports/search?status=${status}&sort=created_at`);
    
    const responseTime = Date.now() - startTime;
    apiResponseTime.add(responseTime);
    
    const success = check(res, {
      'filter status is 200': (r) => r.status === 200,
      'filter response time < 100ms': (r) => responseTime < 100,
    });
    
    errorRate.add(!success ? 1 : 0);
  }
  
  // Scenario 3: Create new report (15% of traffic)
  else if (scenario < 0.75) {
    const reportData = generateReportData();
    const startTime = Date.now();
    
    const res = http.post(
      `${BASE_URL}/api/reports/save`,
      JSON.stringify(reportData),
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    const responseTime = Date.now() - startTime;
    apiResponseTime.add(responseTime);
    
    const success = check(res, {
      'create status is 201': (r) => r.status === 201,
      'create response time < 150ms': (r) => responseTime < 150,
      'create returns id': (r) => {
        const body = JSON.parse(r.body);
        return body.data && body.data.id;
      },
    });
    
    errorRate.add(!success ? 1 : 0);
  }
  
  // Scenario 4: Update report (10% of traffic)
  else if (scenario < 0.85 && data.reportIds.length > 0) {
    const reportId = getRandomElement(data.reportIds);
    const updateData = {
      title: `Updated Report ${Date.now()}`,
      score: Math.floor(Math.random() * 100),
    };
    
    const startTime = Date.now();
    
    const res = http.put(
      `${BASE_URL}/api/reports/save?id=${reportId}`,
      JSON.stringify(updateData),
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    const responseTime = Date.now() - startTime;
    apiResponseTime.add(responseTime);
    
    const success = check(res, {
      'update status is 200': (r) => r.status === 200,
      'update response time < 150ms': (r) => responseTime < 150,
    });
    
    errorRate.add(!success ? 1 : 0);
  }
  
  // Scenario 5: Autocomplete (10% of traffic)
  else if (scenario < 0.95) {
    const query = getRandomElement(searchQueries).substring(0, 3);
    const startTime = Date.now();
    
    const res = http.post(
      `${BASE_URL}/api/reports/search`,
      JSON.stringify({ query, field: 'title' }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    const responseTime = Date.now() - startTime;
    apiResponseTime.add(responseTime);
    
    const success = check(res, {
      'autocomplete status is 200': (r) => r.status === 200,
      'autocomplete response time < 50ms': (r) => responseTime < 50,
      'autocomplete returns suggestions': (r) => {
        const body = JSON.parse(r.body);
        return Array.isArray(body.suggestions);
      },
    });
    
    errorRate.add(!success ? 1 : 0);
  }
  
  // Scenario 6: Delete report (5% of traffic)
  else if (data.reportIds.length > 0) {
    const reportId = getRandomElement(data.reportIds);
    const startTime = Date.now();
    
    const res = http.del(`${BASE_URL}/api/reports/save?id=${reportId}`);
    
    const responseTime = Date.now() - startTime;
    apiResponseTime.add(responseTime);
    
    const success = check(res, {
      'delete status is 200': (r) => r.status === 200,
      'delete response time < 100ms': (r) => responseTime < 100,
    });
    
    errorRate.add(!success ? 1 : 0);
  }
  
  // Think time between requests
  sleep(Math.random() * 2 + 1);
}

// Teardown function
export function teardown(data) {
  // Clean up test data
  for (const reportId of data.reportIds) {
    http.del(`${BASE_URL}/api/reports/save?id=${reportId}`);
  }
}

// Handle summary
export function handleSummary(data) {
  const summary = {
    timestamp: new Date().toISOString(),
    total_requests: data.metrics.http_reqs.values.count,
    success_rate: (1 - data.metrics.errors.values.rate) * 100,
    avg_response_time: data.metrics.http_req_duration.values.avg,
    p95_response_time: data.metrics.http_req_duration.values['p(95)'],
    p99_response_time: data.metrics.http_req_duration.values['p(99)'],
    cache_hit_rate: data.metrics.cache_hits ? data.metrics.cache_hits.values.rate * 100 : 0,
    max_vus: data.metrics.vus_max.values.value,
  };
  
  console.log('\n=== Performance Test Summary ===');
  console.log(`Total Requests: ${summary.total_requests}`);
  console.log(`Success Rate: ${summary.success_rate.toFixed(2)}%`);
  console.log(`Avg Response Time: ${summary.avg_response_time.toFixed(2)}ms`);
  console.log(`P95 Response Time: ${summary.p95_response_time.toFixed(2)}ms`);
  console.log(`P99 Response Time: ${summary.p99_response_time.toFixed(2)}ms`);
  console.log(`Cache Hit Rate: ${summary.cache_hit_rate.toFixed(2)}%`);
  console.log(`Max Concurrent Users: ${summary.max_vus}`);
  
  // Performance verdict
  const passed = 
    summary.p95_response_time < 100 &&
    summary.p99_response_time < 200 &&
    summary.success_rate > 99 &&
    summary.cache_hit_rate > 70;
  
  console.log(`\nPerformance Test: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
  
  return {
    'summary.json': JSON.stringify(summary, null, 2),
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
  };
}