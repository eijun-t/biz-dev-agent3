/**
 * Debug Test for Broad Researcher Agent
 * Shows detailed input/output data
 */

import { BroadResearcherAgent } from './lib/agents/broad-researcher/broad-researcher-agent'
import { SerperSearchService } from './lib/services/serper/serper-search-service'
import { ChatOpenAI } from '@langchain/openai'
import { ResearcherInput, ResearcherOutput } from './lib/types/agents'
import { config } from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables
config({ path: '.env.local' })

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
}

function print(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

// Mock database with logging
class LoggingDatabaseService {
  private logs: any[] = []
  
  async query(): Promise<any> { return { rows: [] } }
  async insert(table: string, data: any): Promise<any> {
    this.logs.push({ operation: 'insert', table, data, timestamp: new Date() })
    return { id: 'mock-id' }
  }
  async update(): Promise<any> { return {} }
  async delete(): Promise<any> { return {} }
  
  getLogs() { return this.logs }
}

async function debugAgent() {
  print('\n=== Broad Researcher Agent Debug Mode ===\n', 'magenta')
  
  try {
    // Initialize services
    const searchService = new SerperSearchService()
    const llm = new ChatOpenAI({
      modelName: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.7,
      openAIApiKey: process.env.OPENAI_API_KEY
    })
    const db = new LoggingDatabaseService()
    
    // Create context
    const context = {
      sessionId: crypto.randomUUID(),
      userId: crypto.randomUUID(),
      metadata: {
        test: true,
        debugMode: true,
        timestamp: new Date().toISOString()
      }
    }
    
    print('=== CONTEXT ===', 'blue')
    console.log(JSON.stringify(context, null, 2))
    
    // Initialize agent
    const agent = new BroadResearcherAgent(
      context,
      searchService,
      llm,
      db as any
    )
    
    // Prepare input
    const input: ResearcherInput = {
      theme: 'AIを活用した不動産価格査定の最新技術',
      sessionId: context.sessionId
    }
    
    print('\n=== INPUT DATA ===', 'blue')
    console.log(JSON.stringify(input, null, 2))
    
    // Execute with timing
    print('\n=== EXECUTION ===', 'yellow')
    const startTime = Date.now()
    const result = await agent.execute(input)
    const executionTime = Date.now() - startTime
    
    // Display messages (execution trace)
    print('\n=== EXECUTION TRACE ===', 'cyan')
    result.messages.forEach((msg, i) => {
      const phase = msg.data?.phase || 'unknown'
      print(`[${i + 1}] Phase: ${phase}`, 'cyan')
      print(`    Message: ${msg.message}`)
      if (msg.data) {
        console.log('    Data:', JSON.stringify(msg.data, null, 2).split('\n').map(line => '    ' + line).join('\n'))
      }
    })
    
    if (result.success && result.data) {
      const output = result.data as ResearcherOutput
      
      // Display full output
      print('\n=== OUTPUT DATA ===', 'green')
      
      // Research summary
      print('\n1. RESEARCH SUMMARY:', 'green')
      console.log(JSON.stringify({
        theme: output.research.theme,
        summary: output.research.summary.substring(0, 200) + '...',
        keyFindings: output.research.keyFindings,
        recommendations: output.research.recommendations,
        generatedAt: output.research.generatedAt
      }, null, 2))
      
      // Insights
      print('\n2. INSIGHTS:', 'green')
      console.log(JSON.stringify(output.research.insights, null, 2))
      
      // Global insights
      print('\n3. GLOBAL INSIGHTS:', 'green')
      console.log(JSON.stringify(output.research.globalInsights, null, 2))
      
      // Sources
      print('\n4. SOURCES:', 'green')
      console.log(JSON.stringify({
        japanese: {
          count: output.research.sources.japanese.length,
          first3: output.research.sources.japanese.slice(0, 3)
        },
        global: {
          count: output.research.sources.global.length,
          first3: output.research.sources.global.slice(0, 3)
        }
      }, null, 2))
      
      // Metrics
      print('\n5. METRICS:', 'green')
      console.log(JSON.stringify(output.metrics, null, 2))
      
      // Database logs
      print('\n6. DATABASE OPERATIONS:', 'yellow')
      const dbLogs = db.getLogs()
      dbLogs.forEach((log, i) => {
        print(`[${i + 1}] ${log.operation.toUpperCase()} to ${log.table}`, 'yellow')
        console.log(JSON.stringify(log.data, null, 2).split('\n').map(line => '    ' + line).join('\n'))
      })
      
      // Save to file
      const outputDir = './debug-output'
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
      }
      
      const filename = `agent-debug-${Date.now()}.json`
      const filepath = path.join(outputDir, filename)
      
      const debugData = {
        timestamp: new Date().toISOString(),
        executionTime,
        context,
        input,
        output: {
          success: result.success,
          data: output,
          messages: result.messages
        },
        databaseOperations: dbLogs
      }
      
      fs.writeFileSync(filepath, JSON.stringify(debugData, null, 2))
      print(`\n✓ Debug data saved to: ${filepath}`, 'green')
      
      // Query structure used
      print('\n=== SEARCH QUERIES USED ===', 'magenta')
      const queryGenMessage = result.messages.find(m => m.data?.phase === 'queries_generated')
      if (queryGenMessage?.data?.queries) {
        print('\nJapanese Queries:', 'magenta')
        queryGenMessage.data.queries.japanese.forEach((q: any, i: number) => {
          print(`  ${i + 1}. ${q.query} (${q.purpose})`, 'cyan')
        })
        print('\nGlobal Queries:', 'magenta')
        queryGenMessage.data.queries.global.forEach((q: any, i: number) => {
          print(`  ${i + 1}. ${q.query} (${q.purpose})`, 'cyan')
        })
      }
      
    } else {
      print('\n=== ERROR OUTPUT ===', 'red')
      console.log(JSON.stringify({
        success: false,
        error: result.error,
        messages: result.messages
      }, null, 2))
    }
    
  } catch (error) {
    print('\n=== EXCEPTION ===', 'red')
    console.error(error)
  }
}

// Run debug
debugAgent().then(() => {
  print('\n✓ Debug session completed', 'green')
  process.exit(0)
}).catch(error => {
  print(`\n✗ Fatal error: ${error}`, 'red')
  process.exit(1)
})