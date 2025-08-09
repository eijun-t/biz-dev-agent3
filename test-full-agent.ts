/**
 * Full Integration Test for Broad Researcher Agent
 */

import { BroadResearcherAgent } from './lib/agents/broad-researcher/broad-researcher-agent'
import { SerperSearchService } from './lib/services/serper/serper-search-service'
import { ChatOpenAI } from '@langchain/openai'
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

// Mock database service
class MockDatabaseService {
  async query(): Promise<any> { return { rows: [] } }
  async insert(): Promise<any> { return { id: 'mock-id' } }
  async update(): Promise<any> { return {} }
  async delete(): Promise<any> { return {} }
}

async function testBroadResearcherAgent() {
  print('\n=== Broad Researcher Agent Full Test ===\n', 'blue')
  
  try {
    // Initialize services
    print('Initializing services...', 'yellow')
    
    const searchService = new SerperSearchService()
    const llm = new ChatOpenAI({
      modelName: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.7,
      openAIApiKey: process.env.OPENAI_API_KEY
    })
    const db = new MockDatabaseService()
    
    print('✓ Services initialized', 'green')
    
    // Create agent context
    const context = {
      sessionId: crypto.randomUUID(),
      userId: crypto.randomUUID(),
      metadata: {
        test: true,
        timestamp: new Date().toISOString()
      }
    }
    
    // Initialize agent
    const agent = new BroadResearcherAgent(
      context,
      searchService,
      llm,
      db as any
    )
    
    // Test theme
    const theme = 'AIが不動産業界に与える影響と最新トレンド'
    print(`\nResearching theme: "${theme}"`, 'cyan')
    print('-'.repeat(60), 'cyan')
    
    // Execute research
    const startTime = Date.now()
    const result = await agent.execute({
      theme,
      sessionId: context.sessionId
    })
    const executionTime = Date.now() - startTime
    
    if (result.success && result.data) {
      print('\n✓ Research completed successfully!', 'green')
      
      // Display metrics
      print('\n=== Metrics ===', 'blue')
      print(`Execution time: ${(executionTime / 1000).toFixed(2)}s`)
      print(`Tokens used: ${result.data.metrics.tokensUsed.toLocaleString()}`)
      print(`API calls: ${result.data.metrics.apiCallsCount}`)
      print(`Cache hit rate: ${result.data.metrics.cacheHitRate.toFixed(1)}%`)
      
      // Display summary
      print('\n=== Summary ===', 'blue')
      const summary = result.data.research.summary
      // Wrap text at 80 characters
      const lines = summary.match(/.{1,80}(、|。|\s|$)/g) || [summary]
      lines.forEach(line => print(line.trim()))
      
      // Display key findings
      if (result.data.research.keyFindings?.length > 0) {
        print('\n=== Key Findings ===', 'blue')
        result.data.research.keyFindings.forEach((finding: string, i: number) => {
          print(`${i + 1}. ${finding}`, 'cyan')
        })
      }
      
      // Display sources
      print('\n=== Sources ===', 'blue')
      print(`Japanese sources: ${result.data.research.sources.japanese.length}`)
      result.data.research.sources.japanese.slice(0, 3).forEach((url: string) => {
        print(`  - ${url}`, 'yellow')
      })
      print(`\nGlobal sources: ${result.data.research.sources.global.length}`)
      result.data.research.sources.global.slice(0, 3).forEach((url: string) => {
        print(`  - ${url}`, 'yellow')
      })
      
      // Display recommendations if any
      if (result.data.research.recommendations?.length > 0) {
        print('\n=== Recommendations ===', 'blue')
        result.data.research.recommendations.forEach((rec: string, i: number) => {
          print(`${i + 1}. ${rec}`, 'green')
        })
      }
      
      // Cost estimation
      const tokenCost = (result.data.metrics.tokensUsed * 0.002 / 1000) // Rough estimate
      const searchCost = result.data.metrics.apiCallsCount * 0.001 // $0.001 per search
      print('\n=== Cost Estimate ===', 'blue')
      print(`Token cost: $${tokenCost.toFixed(4)}`)
      print(`Search cost: $${searchCost.toFixed(4)}`)
      print(`Total cost: $${(tokenCost + searchCost).toFixed(4)}`)
      
    } else {
      print(`\n✗ Research failed: ${result.error}`, 'red')
      if (result.messages) {
        print('\nExecution trace:', 'yellow')
        result.messages.forEach(msg => {
          const phase = msg.data?.phase || 'unknown'
          print(`  [${phase}] ${msg.message}`)
        })
      }
    }
    
  } catch (error) {
    print(`\n✗ Unexpected error: ${error}`, 'red')
    if (error instanceof Error) {
      print(`Stack: ${error.stack}`, 'red')
    }
  }
}

// Run test
testBroadResearcherAgent().then(() => {
  print('\nTest completed!', 'green')
  process.exit(0)
}).catch(error => {
  print(`\nFatal error: ${error}`, 'red')
  process.exit(1)
})