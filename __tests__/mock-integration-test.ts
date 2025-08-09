/**
 * Mock Integration Test for Broad Researcher Agent
 * Tests the agent without requiring actual API keys
 */

import { BroadResearcherAgent } from '@/lib/agents/broad-researcher/broad-researcher-agent'
import { BaseAgentContext } from '@/lib/interfaces/base-agent'
import { WebSearchService, WebSearchQuery, WebSearchResponse } from '@/lib/interfaces/web-search'
import { ChatOpenAI } from '@langchain/openai'
import { ResearcherInput } from '@/lib/types/agents'

// Mock Search Service
class MockSearchService implements WebSearchService {
  private callCount = 0
  
  async search(query: WebSearchQuery): Promise<WebSearchResponse> {
    this.callCount++
    
    // Simulate Japanese search results
    if (query.gl === 'jp') {
      return {
        searchResults: [
          {
            title: 'AIが不動産業界に革命を起こす',
            link: `https://example.jp/ai-real-estate-${this.callCount}`,
            snippet: 'AI技術の導入により、不動産の価格査定や物件推薦が大幅に改善され、市場規模は2025年には5000億円に達する見込みです。',
            position: 1,
            date: new Date().toISOString()
          },
          {
            title: '不動産テック企業の最新動向',
            link: `https://example.jp/proptech-trends-${this.callCount}`,
            snippet: '大手不動産会社がAI・ビッグデータを活用した新サービスを続々とリリース。競争が激化しています。',
            position: 2
          }
        ],
        totalResults: 2,
        searchTime: 0.5,
        cached: this.callCount % 3 === 0 // Simulate some cache hits
      }
    }
    
    // Simulate global search results
    return {
      searchResults: [
        {
          title: 'AI Revolutionizes Real Estate: The PropTech Boom',
          link: `https://example.com/ai-proptech-${this.callCount}`,
          snippet: 'Startups using AI for property valuation and virtual tours raise $1B in funding. The global PropTech market is expected to reach $50B by 2025.',
          position: 1
        },
        {
          title: 'How Machine Learning is Transforming Real Estate',
          link: `https://example.com/ml-real-estate-${this.callCount}`,
          snippet: 'From predictive analytics to automated property management, AI is reshaping every aspect of the real estate industry.',
          position: 2
        }
      ],
      totalResults: 2,
      searchTime: 0.3,
      cached: false
    }
  }
  
  async searchWithRetry(query: string): Promise<any[]> {
    const result = await this.search({ query })
    return result.searchResults
  }
  
  async batchSearch(queries: WebSearchQuery[]): Promise<WebSearchResponse[]> {
    return Promise.all(queries.map(q => this.search(q)))
  }
  
  clearCache(): void {
    // Mock implementation
  }
  
  async validateApiKey(): Promise<boolean> {
    return true
  }
}

// Mock LLM
class MockChatOpenAI {
  private callCount = 0
  
  async invoke(messages: any[]): Promise<any> {
    this.callCount++
    
    // Simulate query generation
    if (this.callCount === 1) {
      return {
        content: JSON.stringify({
          japanese: [
            { query: 'AI 不動産 市場規模 日本', purpose: 'market_size' },
            { query: '不動産テック 企業 ランキング', purpose: 'competitors' },
            { query: 'AI 不動産 トレンド 2024', purpose: 'trends' },
            { query: '不動産 AI 規制 法律', purpose: 'regulations' },
            { query: '不動産 DX 課題 ニーズ', purpose: 'needs' }
          ],
          global: [
            { query: 'proptech startup unicorn 2024', purpose: 'startups' },
            { query: 'AI real estate innovation technology', purpose: 'technology' },
            { query: 'real estate AI best practices', purpose: 'best_practices' }
          ]
        }),
        usage_metadata: { total_tokens: 150 }
      }
    }
    
    // Simulate summary generation
    return {
      content: 'AI技術は不動産業界に大きな変革をもたらしています。日本市場では5000億円規模に成長し、海外ではユニコーン企業が誕生。価格査定の自動化、バーチャル内覧、顧客マッチングなどが主要な応用分野です。',
      usage_metadata: { total_tokens: 200 }
    }
  }
}

// Mock Database
class MockDatabaseService {
  async query(): Promise<any> { return { rows: [] } }
  async insert(): Promise<any> { return { id: 'mock-id' } }
  async update(): Promise<any> { return {} }
  async delete(): Promise<any> { return {} }
}

describe('BroadResearcherAgent Mock Integration Test', () => {
  let agent: BroadResearcherAgent
  let mockSearchService: MockSearchService
  let mockLLM: any
  let mockDb: MockDatabaseService
  let context: BaseAgentContext
  
  beforeEach(() => {
    // Setup mocks
    mockSearchService = new MockSearchService()
    mockLLM = new MockChatOpenAI()
    mockDb = new MockDatabaseService()
    
    context = {
      sessionId: 'test-session-' + Date.now(),
      userId: 'test-user-123',
      metadata: { test: true }
    }
    
    agent = new BroadResearcherAgent(
      context,
      mockSearchService as any,
      mockLLM as any,
      mockDb as any
    )
  })
  
  test('should successfully execute research', async () => {
    const input: ResearcherInput = {
      theme: 'AIが不動産業界に与える影響',
      sessionId: context.sessionId
    }
    
    const result = await agent.execute(input)
    
    expect(result.success).toBe(true)
    expect(result.data).toBeDefined()
    expect(result.data?.research).toBeDefined()
    expect(result.data?.research.theme).toBe(input.theme)
    expect(result.data?.research.summary).toContain('AI技術')
    expect(result.data?.research.sources.japanese.length).toBeGreaterThan(0)
    expect(result.data?.research.sources.global.length).toBeGreaterThan(0)
    expect(result.data?.metrics.tokensUsed).toBeGreaterThan(0)
    expect(result.messages.length).toBeGreaterThan(0)
  })
  
  test('should handle invalid input gracefully', async () => {
    const invalidInput = {
      // Missing theme
      sessionId: context.sessionId
    }
    
    const result = await agent.execute(invalidInput)
    
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })
  
  test('should track execution phases', async () => {
    const input: ResearcherInput = {
      theme: 'スマートシティと不動産',
      sessionId: context.sessionId
    }
    
    const result = await agent.execute(input)
    
    const phases = result.messages
      .map(m => m.data?.phase)
      .filter(Boolean)
    
    expect(phases).toContain('start')
    expect(phases).toContain('query_generation')
    expect(phases).toContain('searching')
    expect(phases).toContain('processing')
    expect(phases).toContain('summarizing')
    expect(phases).toContain('complete')
  })
  
  test('should calculate metrics correctly', async () => {
    const input: ResearcherInput = {
      theme: 'メタバースと不動産',
      sessionId: context.sessionId
    }
    
    const result = await agent.execute(input)
    
    expect(result.success).toBe(true)
    expect(result.data?.metrics).toBeDefined()
    expect(result.data?.metrics.executionTime).toBeGreaterThan(0)
    expect(result.data?.metrics.tokensUsed).toBe(350) // 150 + 200
    expect(result.data?.metrics.apiCallsCount).toBeGreaterThan(0)
    expect(result.data?.metrics.errors).toEqual([])
  })
  
  test('should generate valid search queries', async () => {
    const input: ResearcherInput = {
      theme: 'IoTとスマートホーム',
      sessionId: context.sessionId
    }
    
    const result = await agent.execute(input)
    
    expect(result.success).toBe(true)
    
    // Check that queries were generated
    const queryGenMessage = result.messages.find(m => 
      m.data?.phase === 'queries_generated'
    )
    expect(queryGenMessage).toBeDefined()
    expect(queryGenMessage?.data?.queries.japanese).toHaveLength(5)
    expect(queryGenMessage?.data?.queries.global).toHaveLength(3)
  })
})