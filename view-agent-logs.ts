/**
 * View Agent Logs
 */

import { LocalLogger } from './lib/agents/broad-researcher/local-logger'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

function print(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

async function viewLogs() {
  const logger = new LocalLogger('./logs')
  
  print('\n=== Agent Logs Viewer ===\n', 'blue')
  
  // Read recent logs
  const recentLogs = logger.readRecentLogs(20)
  
  if (recentLogs.length === 0) {
    print('No logs found', 'yellow')
    return
  }
  
  print(`Found ${recentLogs.length} recent log entries:\n`, 'green')
  
  recentLogs.forEach((log, i) => {
    const color = log.level === 'error' ? 'red' : 
                  log.level === 'warn' ? 'yellow' : 
                  'cyan'
    
    print(`[${i + 1}] ${log.timestamp} - ${log.level.toUpperCase()}`, color)
    print(`    Agent: ${log.agentName}`)
    print(`    Message: ${log.message}`)
    
    if (log.sessionId) {
      print(`    Session: ${log.sessionId}`)
    }
    
    if (log.data) {
      print('    Data:', 'yellow')
      console.log(JSON.stringify(log.data, null, 2).split('\n').map(line => '    ' + line).join('\n'))
    }
    
    if (log.error) {
      print('    Error:', 'red')
      console.log(`    Name: ${log.error.name}`)
      console.log(`    Message: ${log.error.message}`)
    }
    
    console.log('') // Empty line
  })
  
  // Search by session ID example
  const sessionLogs = logger.searchLogs({
    level: 'info',
    limit: 5
  })
  
  if (sessionLogs.length > 0) {
    print(`\n=== Info Logs (${sessionLogs.length} entries) ===\n`, 'blue')
    sessionLogs.forEach(log => {
      print(`${log.timestamp}: ${log.message}`, 'cyan')
    })
  }
}

// Run viewer
viewLogs().catch(error => {
  print(`Error: ${error}`, 'red')
  process.exit(1)
})