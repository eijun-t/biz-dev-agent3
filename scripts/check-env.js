#!/usr/bin/env node

/**
 * Environment Check Tool for Biz-Dev-Agent3
 * Validates all required environment variables and dependencies
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

// Status symbols
const symbols = {
  success: '✅',
  warning: '⚠️',
  error: '❌',
  info: 'ℹ️'
};

// Required environment variables
const requiredEnvVars = [
  { name: 'OPENAI_API_KEY', critical: true, pattern: /^sk-/ },
  { name: 'SERPER_API_KEY', critical: true },
  { name: 'NEXT_PUBLIC_SUPABASE_URL', critical: true, pattern: /^https:\/\// },
  { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', critical: true },
  { name: 'SUPABASE_SERVICE_ROLE_KEY', critical: false }
];

// Required directories
const requiredDirs = [
  'workspace',
  'workspace/agents',
  'workspace/shared',
  'workspace/docs',
  'workspace/tests',
  'workspace/configs',
  'lib',
  'lib/agents',
  'scripts',
  'components'
];

// Required files
const requiredFiles = [
  { path: 'package.json', critical: true },
  { path: '.env', critical: true },
  { path: '.env.example', critical: false },
  { path: 'next.config.js', critical: true },
  { path: 'tsconfig.json', critical: true }
];

function log(symbol, message, color = colors.reset) {
  console.log(`${symbol} ${color}${message}${colors.reset}`);
}

function checkEnvFile() {
  console.log('\n📋 Checking Environment File...');
  const envPath = path.join(process.cwd(), '.env');
  
  if (!fs.existsSync(envPath)) {
    log(symbols.error, '.env file not found!', colors.red);
    log(symbols.info, 'Run: cp .env.example .env', colors.yellow);
    return false;
  }
  
  log(symbols.success, '.env file found', colors.green);
  
  // Load .env file
  require('dotenv').config();
  return true;
}

function checkEnvVariables() {
  console.log('\n🔐 Checking Environment Variables...');
  let hasErrors = false;
  let hasWarnings = false;
  
  requiredEnvVars.forEach(({ name, critical, pattern }) => {
    const value = process.env[name];
    
    if (!value || value === '') {
      if (critical) {
        log(symbols.error, `${name} is not set (CRITICAL)`, colors.red);
        hasErrors = true;
      } else {
        log(symbols.warning, `${name} is not set (optional)`, colors.yellow);
        hasWarnings = true;
      }
    } else {
      if (pattern && !pattern.test(value)) {
        log(symbols.warning, `${name} format may be incorrect`, colors.yellow);
        hasWarnings = true;
      } else {
        log(symbols.success, `${name} is set`, colors.green);
      }
    }
  });
  
  return { hasErrors, hasWarnings };
}

function checkDirectories() {
  console.log('\n📁 Checking Required Directories...');
  let missingDirs = [];
  
  requiredDirs.forEach(dir => {
    const dirPath = path.join(process.cwd(), dir);
    if (fs.existsSync(dirPath)) {
      log(symbols.success, `${dir}/`, colors.green);
    } else {
      log(symbols.warning, `${dir}/ missing`, colors.yellow);
      missingDirs.push(dir);
    }
  });
  
  if (missingDirs.length > 0) {
    log(symbols.info, `Run: mkdir -p ${missingDirs.join(' ')}`, colors.blue);
  }
  
  return missingDirs.length === 0;
}

function checkFiles() {
  console.log('\n📄 Checking Required Files...');
  let hasErrors = false;
  
  requiredFiles.forEach(({ path: filePath, critical }) => {
    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      log(symbols.success, filePath, colors.green);
    } else {
      if (critical) {
        log(symbols.error, `${filePath} missing (CRITICAL)`, colors.red);
        hasErrors = true;
      } else {
        log(symbols.warning, `${filePath} missing (optional)`, colors.yellow);
      }
    }
  });
  
  return !hasErrors;
}

function checkNodeVersion() {
  console.log('\n🟢 Checking Node.js Version...');
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
  
  if (majorVersion >= 18) {
    log(symbols.success, `Node.js ${nodeVersion} (OK)`, colors.green);
    return true;
  } else {
    log(symbols.error, `Node.js ${nodeVersion} (requires 18+)`, colors.red);
    return false;
  }
}

function checkPackageDependencies() {
  console.log('\n📦 Checking Package Dependencies...');
  
  try {
    const packageJson = require(path.join(process.cwd(), 'package.json'));
    const nodeModulesExists = fs.existsSync(path.join(process.cwd(), 'node_modules'));
    
    if (!nodeModulesExists) {
      log(symbols.error, 'node_modules not found', colors.red);
      log(symbols.info, 'Run: npm install', colors.yellow);
      return false;
    }
    
    // Check key dependencies
    const keyDeps = ['next', '@langchain/core', '@supabase/supabase-js', 'openai'];
    let allFound = true;
    
    keyDeps.forEach(dep => {
      const depPath = path.join(process.cwd(), 'node_modules', dep);
      if (fs.existsSync(depPath)) {
        log(symbols.success, `${dep} installed`, colors.green);
      } else {
        log(symbols.error, `${dep} not installed`, colors.red);
        allFound = false;
      }
    });
    
    return allFound;
  } catch (error) {
    log(symbols.error, 'Could not check dependencies', colors.red);
    return false;
  }
}

// Main execution
console.log('🔍 Biz-Dev-Agent3 Environment Check');
console.log('=====================================');

const results = {
  nodeVersion: checkNodeVersion(),
  envFile: checkEnvFile(),
  envVars: { hasErrors: false, hasWarnings: false },
  directories: true,
  files: true,
  dependencies: true
};

if (results.envFile) {
  results.envVars = checkEnvVariables();
}

results.directories = checkDirectories();
results.files = checkFiles();
results.dependencies = checkPackageDependencies();

// Final summary
console.log('\n📊 Summary');
console.log('==========');

const criticalErrors = 
  !results.nodeVersion ||
  !results.envFile ||
  results.envVars.hasErrors ||
  !results.files ||
  !results.dependencies;

if (criticalErrors) {
  log(symbols.error, 'Environment has critical issues!', colors.red);
  log(symbols.info, 'Please fix the errors above before proceeding', colors.yellow);
  process.exit(1);
} else if (results.envVars.hasWarnings || !results.directories) {
  log(symbols.warning, 'Environment has warnings but can proceed', colors.yellow);
  process.exit(0);
} else {
  log(symbols.success, 'Environment is ready! You can start development', colors.green);
  log(symbols.info, 'Run: npm run dev', colors.blue);
  process.exit(0);
}