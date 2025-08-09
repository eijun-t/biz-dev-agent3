/**
 * BroadResearcherAgent integration tests
 */

import { BroadResearcherAgent } from '@/lib/agents/broad-researcher/broad-researcher-agent'
import { SerperSearchService } from '@/lib/services/serper/serper-search-service'
import { BaseAgentContext } from '@/lib/interfaces/base-agent'
import { DatabaseService } from '@/lib/interfaces/database'
import { ChatOpenAI } from '@langchain/openai'
import { ResearcherInput } from '@/lib/types/agents'

// Mock dependencies
jest.mock('@/lib/services/serper/serper-search-service')
jest.mock('@langchain/openai')
jest.mock('@/lib/services/agent-logger')

describe('BroadResearcherAgent', () => {
  let agent: BroadResearcherAgent
  let mockSearchService: jest.Mocked<SerperSearchService>
  let mockLLM: jest.Mocked<ChatOpenAI>
  let mockDb: jest.Mocked<DatabaseService>
  let context: BaseAgentContext

  beforeEach(() => {
    // Setup mocks
    mockSearchService = new SerperSearchService() as jest.Mocked<SerperSearchService>
    mockLLM = new ChatOpenAI({}) as jest.Mocked<ChatOpenAI>
    mockDb = {
      query: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    } as unknown as jest.Mocked<DatabaseService>

    context = {
      sessionId: 'test-session-123',
      userId: 'test-user-456',
      metadata: {}
    }

    agent = new BroadResearcherAgent(
      context,
      mockSearchService,
      mockLLM,
      mockDb
    )
  })

  describe('execute', () => {
    const validInput: ResearcherInput = {
      theme: 'AIが不動産業界に与える影響',
      sessionId: 'test-session-123'
    }

    it('should successfully execute research', async () => {
      // Mock LLM responses
      mockLLM.invoke.mockResolvedValueOnce({
        content: JSON.stringify({
          japanese: [
            { query: 'AI 不動産 市場規模', purpose: 'market_size' },
            { query: 'AI 不動産 企業', purpose: 'competitors' },
            { query: 'AI 不動産 トレンド 2024', purpose: 'trends' },
            { query: 'AI 不動産 規制', purpose: 'regulations' },
            { query: 'AI 不動産 課題', purpose: 'needs' }
          ],
          global: [
            { query: 'AI real estate startup unicorn', purpose: 'startups' },
            { query: 'AI proptech innovation', purpose: 'technology' },
            { query: 'AI real estate best practices', purpose: 'best_practices' }
          ]
        }),
        usage_metadata: { total_tokens: 500 }
      } as any)

      // Mock search results
      mockSearchService.search.mockResolvedValue({
        searchResults: [
          {
            title: 'AI不動産市場が急成長',
            link: 'https://example.com/ai-real-estate',
            snippet: '日本のAI不動産市場は2024年に5000億円に達する見込み...',
            position: 1
          }
        ],
        totalResults: 1,
        searchTime: 0.5,
        cached: false
      })

      // Mock summary generation
      mockLLM.invoke.mockResolvedValueOnce({
        content: 'AI不動産市場は急速に成長しており、主要プレーヤーが参入。今後の成長が期待される。',
        usage_metadata: { total_tokens: 300 }
      } as any)

      const result = await agent.execute(validInput)

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.research).toBeDefined()
      expect(result.data?.metrics).toBeDefined()
      expect(result.messages.length).toBeGreaterThan(0)
    })

    it('should handle invalid input', async () => {
      const invalidInput = {
        // Missing required theme field
        sessionId: 'test-session-123'
      }

      const result = await agent.execute(invalidInput)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.messages.some(m => m.data?.phase === 'error')).toBe(true)
    })

    it('should handle query generation failure', async () => {
      mockLLM.invoke.mockRejectedValueOnce(new Error('LLM API error'))

      const result = await agent.execute(validInput)

      // Should fall back to default queries
      expect(result.success).toBe(true)
      expect(mockSearchService.search).toHaveBeenCalled()
    })

    it('should handle search failures gracefully', async () => {
      // Mock successful query generation
      mockLLM.invoke.mockResolvedValueOnce({
        content: JSON.stringify({
          japanese: [{ query: 'test query', purpose: 'market_size' }],
          global: [{ query: 'test global', purpose: 'technology' }]
        }),
        usage_metadata: { total_tokens: 100 }
      } as any)

      // Mock search failure
      mockSearchService.search.mockRejectedValue(new Error('Search API error'))

      // Mock summary generation
      mockLLM.invoke.mockResolvedValueOnce({
        content: '検索に失敗しましたが、収集できた情報をまとめました。',
        usage_metadata: { total_tokens: 100 }
      } as any)

      const result = await agent.execute(validInput)

      expect(result.success).toBe(true)
      expect(result.data?.metrics.errors.length).toBeGreaterThan(0)
    })

    it('should track metrics correctly', async () => {
      // Mock responses
      mockLLM.invoke
        .mockResolvedValueOnce({
          content: JSON.stringify({
            japanese: [{ query: 'test', purpose: 'market_size' }],
            global: [{ query: 'test', purpose: 'technology' }]
          }),
          usage_metadata: { total_tokens: 200 }
        } as any)
        .mockResolvedValueOnce({
          content: 'Summary',
          usage_metadata: { total_tokens: 150 }
        } as any)

      mockSearchService.search.mockResolvedValue({
        searchResults: [],
        totalResults: 0,
        searchTime: 0.1,
        cached: true
      })

      const result = await agent.execute(validInput)

      expect(result.data?.metrics.tokensUsed).toBe(350) // 200 + 150
      expect(result.data?.metrics.apiCallsCount).toBe(4) // 2 LLM + 2 search
      expect(result.data?.metrics.cacheHitRate).toBe(100) // All cached
      expect(result.data?.metrics.executionTime).toBeGreaterThan(0)
    })

    it('should use cache effectively', async () => {
      // Mock responses
      mockLLM.invoke.mockResolvedValue({
        content: JSON.stringify({
          japanese: [{ query: 'test', purpose: 'market_size' }],
          global: [{ query: 'test', purpose: 'technology' }]
        }),
        usage_metadata: { total_tokens: 100 }
      } as any)

      // First search not cached, second cached
      mockSearchService.search
        .mockResolvedValueOnce({
          searchResults: [{ title: 'Result 1', link: 'https://example.com/1', snippet: 'Test', position: 1 }],
          totalResults: 1,
          searchTime: 0.5,
          cached: false
        })
        .mockResolvedValueOnce({
          searchResults: [{ title: 'Result 2', link: 'https://example.com/2', snippet: 'Test', position: 1 }],
          totalResults: 1,
          searchTime: 0.01,
          cached: true
        })

      const result = await agent.execute(validInput)

      expect(result.data?.metrics.cacheHitRate).toBe(50) // 1 cached out of 2
    })
  })

  describe('getAgentName', () => {
    it('should return correct agent name', () => {
      expect(agent.getAgentName()).toBe('researcher')
    })
  })

  describe('message tracking', () => {
    it('should track execution phases', async () => {
      const input: ResearcherInput = {
        theme: 'Test theme',
        sessionId: 'test-session'
      }

      // Mock minimal responses
      mockLLM.invoke.mockResolvedValue({
        content: JSON.stringify({
          japanese: [{ query: 'test', purpose: 'market_size' }],
          global: [{ query: 'test', purpose: 'technology' }]
        }),
        usage_metadata: { total_tokens: 100 }
      } as any)

      mockSearchService.search.mockResolvedValue({
        searchResults: [],
        totalResults: 0,
        searchTime: 0.1,
        cached: false
      })

      const result = await agent.execute(input)

      const phases = result.messages.map(m => m.data?.phase).filter(Boolean)
      
      expect(phases).toContain('start')
      expect(phases).toContain('query_generation')
      expect(phases).toContain('queries_generated')
      expect(phases).toContain('searching')
      expect(phases).toContain('search_complete')
      expect(phases).toContain('processing')
      expect(phases).toContain('summarizing')
      expect(phases).toContain('complete')
    })
  })

  describe('error handling', () => {
    it('should handle summary generation failure', async () => {
      const input: ResearcherInput = {
        theme: 'Test theme',
        sessionId: 'test-session'
      }

      // Mock query generation
      mockLLM.invoke.mockResolvedValueOnce({
        content: JSON.stringify({
          japanese: [{ query: 'test', purpose: 'market_size' }],
          global: [{ query: 'test', purpose: 'technology' }]
        }),
        usage_metadata: { total_tokens: 100 }
      } as any)

      // Mock search
      mockSearchService.search.mockResolvedValue({
        searchResults: [{
          title: 'Test',
          link: 'https://example.com',
          snippet: 'Test snippet',
          position: 1
        }],
        totalResults: 1,
        searchTime: 0.1,
        cached: false
      })

      // Mock summary generation failure
      mockLLM.invoke.mockRejectedValueOnce(new Error('Summary generation failed'))

      const result = await agent.execute(input)

      // Should use fallback summary
      expect(result.success).toBe(true)
      expect(result.data?.research.summary).toBeDefined()
      expect(result.data?.research.keyFindings).toHaveLength(2) // Fallback findings
    })

    it('should handle database logging failure gracefully', async () => {
      const input: ResearcherInput = {
        theme: 'Test theme',
        sessionId: 'test-session'
      }

      // Mock successful execution
      mockLLM.invoke.mockResolvedValue({
        content: JSON.stringify({
          japanese: [{ query: 'test', purpose: 'market_size' }],
          global: [{ query: 'test', purpose: 'technology' }]
        }),
        usage_metadata: { total_tokens: 100 }
      } as any)

      mockSearchService.search.mockResolvedValue({
        searchResults: [],
        totalResults: 0,
        searchTime: 0.1,
        cached: false
      })

      // Mock database failure
      mockDb.insert.mockRejectedValue(new Error('Database error'))

      const result = await agent.execute(input)

      // Should still succeed despite logging failure
      expect(result.success).toBe(true)
    })
  })
})