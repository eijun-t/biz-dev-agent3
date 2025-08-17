#!/usr/bin/env node

/**
 * API Connection Test Script
 * Tests connectivity to all external APIs
 */

require('dotenv').config();
const https = require('https');
const { createClient } = require('@supabase/supabase-js');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(50));
  log(title, colors.bright + colors.cyan);
  console.log('='.repeat(50));
}

// Test Results Storage
const testResults = {
  passed: [],
  failed: [],
  warnings: []
};

/**
 * Test OpenAI API Connection
 */
async function testOpenAI() {
  logSection('Testing OpenAI API Connection');
  
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    log('❌ OPENAI_API_KEY not found in environment variables', colors.red);
    testResults.failed.push('OpenAI: API key missing');
    return false;
  }

  if (apiKey.includes('dummy') || apiKey.includes('example')) {
    log('⚠️  Using dummy API key - real connection test skipped', colors.yellow);
    testResults.warnings.push('OpenAI: Using dummy API key');
    return false;
  }

  return new Promise((resolve) => {
    const data = JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Say "API test successful"' }],
      max_tokens: 10
    });

    const options = {
      hostname: 'api.openai.com',
      port: 443,
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          log('✅ OpenAI API connection successful', colors.green);
          testResults.passed.push('OpenAI API');
          resolve(true);
        } else if (res.statusCode === 401) {
          log('❌ OpenAI API authentication failed - invalid API key', colors.red);
          testResults.failed.push('OpenAI: Invalid API key');
          resolve(false);
        } else {
          log(`❌ OpenAI API returned status ${res.statusCode}`, colors.red);
          testResults.failed.push(`OpenAI: Status ${res.statusCode}`);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      log(`❌ OpenAI API connection error: ${error.message}`, colors.red);
      testResults.failed.push(`OpenAI: ${error.message}`);
      resolve(false);
    });

    req.write(data);
    req.end();
  });
}

/**
 * Test Serper API Connection
 */
async function testSerper() {
  logSection('Testing Serper API Connection');
  
  const apiKey = process.env.SERPER_API_KEY;
  
  if (!apiKey) {
    log('❌ SERPER_API_KEY not found in environment variables', colors.red);
    testResults.failed.push('Serper: API key missing');
    return false;
  }

  if (apiKey.includes('dummy') || apiKey.includes('example')) {
    log('⚠️  Using dummy API key - real connection test skipped', colors.yellow);
    testResults.warnings.push('Serper: Using dummy API key');
    return false;
  }

  return new Promise((resolve) => {
    const data = JSON.stringify({
      q: 'test query',
      num: 1
    });

    const options = {
      hostname: 'google.serper.dev',
      port: 443,
      path: '/search',
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          log('✅ Serper API connection successful', colors.green);
          testResults.passed.push('Serper API');
          resolve(true);
        } else if (res.statusCode === 401 || res.statusCode === 403) {
          log('❌ Serper API authentication failed - invalid API key', colors.red);
          testResults.failed.push('Serper: Invalid API key');
          resolve(false);
        } else {
          log(`❌ Serper API returned status ${res.statusCode}`, colors.red);
          testResults.failed.push(`Serper: Status ${res.statusCode}`);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      log(`❌ Serper API connection error: ${error.message}`, colors.red);
      testResults.failed.push(`Serper: ${error.message}`);
      resolve(false);
    });

    req.write(data);
    req.end();
  });
}

/**
 * Test Supabase Connection
 */
async function testSupabase() {
  logSection('Testing Supabase Connection');
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !anonKey) {
    log('❌ Supabase configuration missing', colors.red);
    if (!url) testResults.failed.push('Supabase: URL missing');
    if (!anonKey) testResults.failed.push('Supabase: Anon key missing');
    return false;
  }

  if (url.includes('example') || anonKey.includes('example')) {
    log('⚠️  Using dummy Supabase config - real connection test skipped', colors.yellow);
    testResults.warnings.push('Supabase: Using dummy configuration');
    return false;
  }

  try {
    const supabase = createClient(url, anonKey);
    
    // Try to fetch from a simple table or auth status
    const { data, error } = await supabase.auth.getSession();
    
    if (!error) {
      log('✅ Supabase connection successful', colors.green);
      testResults.passed.push('Supabase');
      return true;
    } else {
      log(`❌ Supabase connection error: ${error.message}`, colors.red);
      testResults.failed.push(`Supabase: ${error.message}`);
      return false;
    }
  } catch (error) {
    log(`❌ Supabase connection error: ${error.message}`, colors.red);
    testResults.failed.push(`Supabase: ${error.message}`);
    return false;
  }
}

/**
 * Test Google API Connection (if configured)
 */
async function testGoogleAPI() {
  logSection('Testing Google API Connection');
  
  const apiKey = process.env.GOOGLE_API_KEY;
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
  
  if (!apiKey || !searchEngineId) {
    log('⚠️  Google API not configured - skipping', colors.yellow);
    testResults.warnings.push('Google API: Not configured');
    return false;
  }

  if (apiKey.includes('dummy') || searchEngineId.includes('dummy')) {
    log('⚠️  Using dummy Google API config - real connection test skipped', colors.yellow);
    testResults.warnings.push('Google API: Using dummy configuration');
    return false;
  }

  return new Promise((resolve) => {
    const options = {
      hostname: 'www.googleapis.com',
      port: 443,
      path: `/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=test`,
      method: 'GET'
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          log('✅ Google API connection successful', colors.green);
          testResults.passed.push('Google API');
          resolve(true);
        } else if (res.statusCode === 400 || res.statusCode === 401) {
          log('❌ Google API authentication failed', colors.red);
          testResults.failed.push('Google API: Invalid credentials');
          resolve(false);
        } else {
          log(`❌ Google API returned status ${res.statusCode}`, colors.red);
          testResults.failed.push(`Google API: Status ${res.statusCode}`);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      log(`❌ Google API connection error: ${error.message}`, colors.red);
      testResults.failed.push(`Google API: ${error.message}`);
      resolve(false);
    });

    req.end();
  });
}

/**
 * Check Environment Variables
 */
function checkEnvironmentVariables() {
  logSection('Checking Environment Variables');
  
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'OPENAI_API_KEY',
    'SERPER_API_KEY'
  ];
  
  const optional = [
    'GOOGLE_API_KEY',
    'GOOGLE_SEARCH_ENGINE_ID',
    'LOG_LEVEL',
    'NODE_ENV'
  ];
  
  log('Required Variables:', colors.bright);
  required.forEach(key => {
    if (process.env[key]) {
      const value = process.env[key];
      const displayValue = value.substring(0, 10) + '...';
      log(`  ✅ ${key}: ${displayValue}`, colors.green);
    } else {
      log(`  ❌ ${key}: NOT SET`, colors.red);
      testResults.failed.push(`Env: ${key} missing`);
    }
  });
  
  log('\nOptional Variables:', colors.bright);
  optional.forEach(key => {
    if (process.env[key]) {
      const value = process.env[key];
      const displayValue = value.length > 20 ? value.substring(0, 10) + '...' : value;
      log(`  ✅ ${key}: ${displayValue}`, colors.green);
    } else {
      log(`  ⚠️  ${key}: NOT SET`, colors.yellow);
    }
  });
}

/**
 * Generate Summary Report
 */
function generateSummary() {
  logSection('Test Summary');
  
  const totalTests = testResults.passed.length + testResults.failed.length;
  const passRate = totalTests > 0 ? 
    Math.round((testResults.passed.length / totalTests) * 100) : 0;
  
  log(`Total Tests: ${totalTests}`, colors.bright);
  log(`Passed: ${testResults.passed.length}`, colors.green);
  log(`Failed: ${testResults.failed.length}`, colors.red);
  log(`Warnings: ${testResults.warnings.length}`, colors.yellow);
  log(`Pass Rate: ${passRate}%`, passRate === 100 ? colors.green : colors.yellow);
  
  if (testResults.passed.length > 0) {
    log('\n✅ Passed Tests:', colors.green);
    testResults.passed.forEach(test => {
      log(`  • ${test}`, colors.green);
    });
  }
  
  if (testResults.failed.length > 0) {
    log('\n❌ Failed Tests:', colors.red);
    testResults.failed.forEach(test => {
      log(`  • ${test}`, colors.red);
    });
  }
  
  if (testResults.warnings.length > 0) {
    log('\n⚠️  Warnings:', colors.yellow);
    testResults.warnings.forEach(warning => {
      log(`  • ${warning}`, colors.yellow);
    });
  }
  
  // Overall status
  console.log('\n' + '='.repeat(50));
  if (testResults.failed.length === 0 && testResults.warnings.length === 0) {
    log('🎉 All API connections are working!', colors.bright + colors.green);
  } else if (testResults.failed.length === 0) {
    log('✅ Core APIs are functional (with warnings)', colors.bright + colors.yellow);
  } else {
    log('❌ Some API connections failed - please check configuration', colors.bright + colors.red);
  }
  console.log('='.repeat(50));
}

/**
 * Main Test Runner
 */
async function runTests() {
  log('🚀 Starting API Connection Tests...', colors.bright + colors.magenta);
  log(`Environment: ${process.env.NODE_ENV || 'development'}`, colors.cyan);
  log(`Timestamp: ${new Date().toISOString()}`, colors.cyan);
  
  // Check environment variables first
  checkEnvironmentVariables();
  
  // Run API tests
  await testOpenAI();
  await testSerper();
  await testSupabase();
  await testGoogleAPI();
  
  // Generate summary
  generateSummary();
  
  // Exit with appropriate code
  process.exit(testResults.failed.length > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  log(`\n❌ Test runner error: ${error.message}`, colors.red);
  process.exit(1);
});