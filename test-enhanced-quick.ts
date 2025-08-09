/**
 * Quick test for enhanced agent
 */

import { BroadResearcherAgentV2 } from './lib/agents/broad-researcher/broad-researcher-agent-v2'
import { SerperSearchService } from './lib/services/serper/serper-search-service'
import { ChatOpenAI } from '@langchain/openai'
import { config } from 'dotenv'

config({ path: '.env.local' })

class MockDB {
  async query(): Promise<any> { return { rows: [] } }
  async insert(): Promise<any> { return { id: 'mock-id' } }
  async update(): Promise<any> { return {} }
  async delete(): Promise<any> { return {} }
}

async function quickTest() {
  console.log('Starting quick test...')
  
  const agent = new BroadResearcherAgentV2(
    { sessionId: crypto.randomUUID(), userId: 'test' },
    new SerperSearchService(),
    new ChatOpenAI({ 
      modelName: 'gpt-4o-mini',
      openAIApiKey: process.env.OPENAI_API_KEY 
    }),
    new MockDB() as any
  )
  
  const result = await agent.execute({
    theme: 'AI不動産査定',
    sessionId: crypto.randomUUID()
  })
  
  if (result.success) {
    console.log('\n=== SUCCESS ===')
    console.log('Summary:', result.data?.research.summary?.substring(0, 200) + '...')
    console.log('Key Findings:', result.data?.research.keyFindings)
    console.log('Recommendations:', result.data?.research.recommendations)
    console.log('Metrics:', result.data?.metrics)
  } else {
    console.log('\n=== ERROR ===')
    console.log(result.error)
  }
}

quickTest().catch(console.error)