/**
 * Broad Researcher Agent Integration Test Script
 * 
 * This script performs end-to-end testing of the agent
 */

import { BroadResearcherAgent } from '../lib/agents/broad-researcher/broad-researcher-agent'
import { SerperSearchService } from '../lib/services/serper/serper-search-service'
import { ChatOpenAI } from '@langchain/openai'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { PerformanceMonitor } from '../lib/agents/broad-researcher/performance-monitor'
import { LocalLogger } from '../lib/agents/broad-researcher/local-logger'

// Load environment variables
config({ path: '.env.local' })

// Test themes
const TEST_THEMES = [
  'AIが不動産業界に与える影響',
  'メタバースと建設業界の未来',
  'スマートシティの最新動向'
]

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
}

// Print colored message
function print(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

// Mock database service for testing
class MockDatabaseService {
  private logs: any[] = []

  async query(text: string, params?: any[]): Promise<any> {
    return { rows: [] }
  }

  async insert(table: string, data: any): Promise<any> {
    this.logs.push({ table, data, timestamp: new Date() })
    return { id: crypto.randomUUID(), ...data }
  }

  async update(table: string, data: any, where: any): Promise<any> {
    return { id: where.id, ...data }
  }

  async delete(table: string, where: any): Promise<any> {
    return { deleted: true }
  }

  getLogs() {
    return this.logs
  }
}

// Test result interface
interface TestResult {
  theme: string
  success: boolean
  executionTime: number
  tokensUsed: number
  apiCalls: number
  cacheHitRate: number
  errors: any[]
  summary?: string
}

// Main test function
async function runIntegrationTests() {
  print('\n=== Broad Researcher Agent Integration Test ===\n', 'blue')
  
  // Validate environment
  const requiredEnvVars = ['SERPER_API_KEY', 'OPENAI_API_KEY']
  const missingVars = requiredEnvVars.filter(v => !process.env[v])
  
  if (missingVars.length > 0) {
    print(`Missing environment variables: ${missingVars.join(', ')}`, 'red')
    process.exit(1)
  }
  
  print('✓ Environment variables validated', 'green')
  
  // Initialize services
  print('\nInitializing services...', 'yellow')
  
  const searchService = new SerperSearchService()
  const llm = new ChatOpenAI({
    modelName: 'gpt-3.5-turbo', // Use cheaper model for testing
    temperature: 0.7,
    maxTokens: 2000
  })
  const db = new MockDatabaseService()
  const performanceMonitor = new PerformanceMonitor()
  const logger = new LocalLogger('./test-logs')
  
  print('✓ Services initialized', 'green')
  
  // Validate API keys
  print('\nValidating API keys...', 'yellow')
  
  try {
    const isValid = await searchService.validateApiKey()
    if (!isValid) {
      throw new Error('Invalid Serper API key')
    }
    print('✓ Serper API key validated', 'green')
  } catch (error) {
    print(`✗ Serper API validation failed: ${error}`, 'red')
    process.exit(1)
  }
  
  // Run tests for each theme
  const results: TestResult[] = []
  
  for (const theme of TEST_THEMES) {
    print(`\n\nTesting theme: "${theme}"`, 'blue')
    print('-'.repeat(50))
    
    const context = {
      sessionId: crypto.randomUUID(),
      userId: 'test-user-' + Date.now(),
      metadata: {
        test: true,
        timestamp: new Date().toISOString()
      }
    }
    
    const agent = new BroadResearcherAgent(
      context,
      searchService,
      llm,
      db
    )
    
    performanceMonitor.startCheckpoint('test')
    
    try {
      const result = await agent.execute({
        theme,
        sessionId: context.sessionId
      })
      
      const executionTime = performanceMonitor.endCheckpoint('test')
      
      if (result.success && result.data) {
        print('✓ Research completed successfully', 'green')
        print(`  - Execution time: ${executionTime}ms`)
        print(`  - Tokens used: ${result.data.metrics.tokensUsed}`)
        print(`  - API calls: ${result.data.metrics.apiCallsCount}`)
        print(`  - Cache hit rate: ${result.data.metrics.cacheHitRate.toFixed(1)}%`)
        print(`  - Key findings: ${result.data.research.keyFindings?.length || 0}`)
        print(`  - Japanese sources: ${result.data.research.sources.japanese.length}`)
        print(`  - Global sources: ${result.data.research.sources.global.length}`)
        
        // Log to file
        logger.info('Test completed', {
          theme,
          executionTime,
          metrics: result.data.metrics
        })
        
        results.push({
          theme,
          success: true,
          executionTime,
          tokensUsed: result.data.metrics.tokensUsed,
          apiCalls: result.data.metrics.apiCallsCount,
          cacheHitRate: result.data.metrics.cacheHitRate,
          errors: result.data.metrics.errors,
          summary: result.data.research.summary.slice(0, 100) + '...'
        })
      } else {
        print(`✗ Research failed: ${result.error}`, 'red')
        
        logger.error('Test failed', new Error(result.error || 'Unknown error'), {
          theme,
          messages: result.messages
        })
        
        results.push({
          theme,
          success: false,
          executionTime: performanceMonitor.endCheckpoint('test'),
          tokensUsed: 0,
          apiCalls: 0,
          cacheHitRate: 0,
          errors: [result.error]
        })
      }
      
    } catch (error) {
      const executionTime = performanceMonitor.endCheckpoint('test')
      print(`✗ Unexpected error: ${error}`, 'red')
      
      logger.error('Unexpected error', error as Error, { theme })
      
      results.push({
        theme,
        success: false,
        executionTime,
        tokensUsed: 0,
        apiCalls: 0,
        cacheHitRate: 0,
        errors: [error]
      })
    }
    
    // Wait between tests to avoid rate limiting
    if (TEST_THEMES.indexOf(theme) < TEST_THEMES.length - 1) {
      print('\nWaiting 5 seconds before next test...', 'yellow')
      await new Promise(resolve => setTimeout(resolve, 5000))
    }
  }
  
  // Clear search cache
  searchService.clearCache()
  
  // Generate summary report
  print('\n\n=== Test Summary ===\n', 'blue')
  
  const successCount = results.filter(r => r.success).length
  const totalExecutionTime = results.reduce((sum, r) => sum + r.executionTime, 0)
  const totalTokens = results.reduce((sum, r) => sum + r.tokensUsed, 0)
  const totalApiCalls = results.reduce((sum, r) => sum + r.apiCalls, 0)
  const avgCacheHitRate = results.reduce((sum, r) => sum + r.cacheHitRate, 0) / results.length
  
  print(`Total tests: ${results.length}`)
  print(`Successful: ${successCount} (${(successCount / results.length * 100).toFixed(0)}%)`, 
    successCount === results.length ? 'green' : 'yellow'
  )
  print(`Total execution time: ${(totalExecutionTime / 1000).toFixed(1)}s`)
  print(`Total tokens used: ${totalTokens.toLocaleString()}`)
  print(`Total API calls: ${totalApiCalls}`)
  print(`Average cache hit rate: ${avgCacheHitRate.toFixed(1)}%`)
  
  // Estimate costs
  const estimatedCost = (totalTokens * 0.002 / 1000) + (totalApiCalls * 0.001)
  print(`\nEstimated cost: $${estimatedCost.toFixed(3)}`)
  
  // Show database logs
  const dbLogs = db.getLogs()
  print(`\nDatabase operations: ${dbLogs.length}`)
  
  // Performance analysis
  print('\n=== Performance Analysis ===\n', 'blue')
  
  results.forEach(result => {
    const status = result.success ? '✓' : '✗'
    const color = result.success ? 'green' : 'red'
    print(`${status} ${result.theme}`, color)
    if (result.success) {
      print(`  Execution: ${result.executionTime}ms | Tokens: ${result.tokensUsed} | Cache: ${result.cacheHitRate.toFixed(0)}%`)
    } else {
      print(`  Error: ${result.errors[0]}`)
    }
  })
  
  // Recommendations
  print('\n=== Recommendations ===\n', 'blue')
  
  if (avgCacheHitRate < 30) {
    print('⚠ Low cache hit rate detected. Consider:', 'yellow')
    print('  - Increasing cache TTL')
    print('  - Using more consistent search queries')
  }
  
  if (totalExecutionTime > 60000) {
    print('⚠ High total execution time. Consider:', 'yellow')
    print('  - Reducing number of search queries')
    print('  - Using smaller LLM model')
    print('  - Implementing parallel processing')
  }
  
  if (totalTokens > 10000) {
    print('⚠ High token usage. Consider:', 'yellow')
    print('  - Using more concise prompts')
    print('  - Limiting search result processing')
    print('  - Switching to gpt-3.5-turbo for some operations')
  }
  
  // Save test report
  const reportPath = `./test-reports/integration-test-${Date.now()}.json`
  const fs = await import('fs')
  const path = await import('path')
  
  const reportDir = path.dirname(reportPath)
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true })
  }
  
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    results,
    summary: {
      total: results.length,
      successful: successCount,
      totalExecutionTime,
      totalTokens,
      totalApiCalls,
      avgCacheHitRate,
      estimatedCost
    },
    environment: {
      node: process.version,
      platform: process.platform,
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo'
    }
  }, null, 2))
  
  print(`\n✓ Test report saved to: ${reportPath}`, 'green')
  
  // Exit with appropriate code
  process.exit(successCount === results.length ? 0 : 1)
}

// Run tests
runIntegrationTests().catch(error => {
  print(`\n✗ Fatal error: ${error}`, 'red')
  process.exit(1)
})