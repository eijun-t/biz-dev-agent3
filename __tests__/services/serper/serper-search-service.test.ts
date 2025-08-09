/**
 * SerperSearchService unit tests
 */

import { SerperSearchService } from '@/lib/services/serper/serper-search-service'
import { WebSearchQuery } from '@/lib/types'

// Mock fetch globally
const mockFetch = jest.fn()
global.fetch = mockFetch as any

describe('SerperSearchService', () => {
  let service: SerperSearchService
  const mockApiKey = 'test-api-key'

  beforeEach(() => {
    jest.clearAllMocks()
    // Set test environment variables
    process.env.SERPER_API_KEY = mockApiKey
    process.env.SERPER_API_TIMEOUT = '5000'
    process.env.SERPER_CACHE_TTL = '300'
    process.env.SERPER_MAX_RETRIES = '3'
    
    service = new SerperSearchService()
  })

  afterEach(() => {
    // Clear cache after each test
    service.clearCache()
  })

  describe('constructor', () => {
    it('should throw error if API key is not provided', () => {
      delete process.env.SERPER_API_KEY
      expect(() => new SerperSearchService()).toThrow('SERPER_API_KEY is required')
    })

    it('should use default config values if not provided', () => {
      delete process.env.SERPER_API_TIMEOUT
      delete process.env.SERPER_CACHE_TTL
      delete process.env.SERPER_MAX_RETRIES
      
      const service = new SerperSearchService()
      expect(service).toBeDefined()
    })
  })

  describe('search', () => {
    const mockQuery: WebSearchQuery = {
      query: 'AI market Japan',
      gl: 'jp',
      hl: 'ja',
      num: 10
    }

    const mockSerperResponse = {
      searchParameters: {
        q: 'AI market Japan',
        gl: 'jp',
        hl: 'ja',
        num: 10,
        type: 'search'
      },
      organic: [
        {
          title: 'AI市場の動向',
          link: 'https://example.com/ai-market',
          snippet: '日本のAI市場は急成長している...',
          position: 1
        },
        {
          title: 'AI技術の最新トレンド',
          link: 'https://example.com/ai-trends',
          snippet: '2024年のAI技術トレンドについて...',
          position: 2
        }
      ],
      searchInformation: {
        timeTakenSeconds: 0.5,
        totalResults: 1000
      }
    }

    it('should successfully search and return results', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSerperResponse
      } as any)

      const result = await service.search(mockQuery)

      expect(result.searchResults).toHaveLength(2)
      expect(result.searchResults[0].title).toBe('AI市場の動向')
      expect(result.totalResults).toBe(2)
      expect(result.cached).toBe(false)
      expect(mockFetch).toHaveBeenCalledWith(
        'https://serpapi.com/search.json',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'X-API-KEY': mockApiKey,
            'Content-Type': 'application/json'
          }
        })
      )
    })

    it('should return cached results on second call', async () => {
      // First call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSerperResponse
      } as any)

      const result1 = await service.search(mockQuery)
      expect(result1.cached).toBe(false)

      // Second call - should use cache
      const result2 = await service.search(mockQuery)
      expect(result2.cached).toBe(true)
      expect(result2.searchResults).toEqual(result1.searchResults)
      expect(mockFetch).toHaveBeenCalledTimes(1) // Only called once
    })

    it('should handle API error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      } as any)

      await expect(service.search(mockQuery)).rejects.toThrow(
        'Serper API error: 401 Unauthorized'
      )
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(service.search(mockQuery)).rejects.toThrow('Network error')
    })

    it('should handle timeout', async () => {
      // Mock a delayed response that exceeds timeout
      mockFetch.mockImplementationOnce(() => 
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => mockSerperResponse
            } as any)
          }, 10000) // 10 seconds
        })
      )

      // Use a shorter timeout for testing
      process.env.SERPER_API_TIMEOUT = '100'
      const shortTimeoutService = new SerperSearchService()

      await expect(shortTimeoutService.search(mockQuery)).rejects.toThrow(
        'Search request timed out'
      )
    })
  })

  describe('searchWithRetry', () => {
    const mockSerperResponse = {
      organic: [
        {
          title: 'Test Result',
          link: 'https://example.com/test',
          snippet: 'Test snippet',
          position: 1
        }
      ]
    }

    it('should retry on failure', async () => {
      // First two calls fail, third succeeds
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSerperResponse
        } as any)

      const result = await service.searchWithRetry('test query')

      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('Test Result')
      expect(mockFetch).toHaveBeenCalledTimes(3)
    })

    it('should fail after max retries', async () => {
      // All calls fail
      mockFetch.mockRejectedValue(new Error('Network error'))

      await expect(service.searchWithRetry('test query')).rejects.toThrow(
        'Network error'
      )
      expect(mockFetch).toHaveBeenCalledTimes(3) // Initial + 2 retries
    })

    it('should not retry on non-retryable errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      } as any)

      await expect(service.searchWithRetry('test query')).rejects.toThrow(
        'Serper API error: 401 Unauthorized'
      )
      expect(mockFetch).toHaveBeenCalledTimes(1) // No retries
    })
  })

  describe('batchSearch', () => {
    const queries: WebSearchQuery[] = [
      { query: 'query1', gl: 'jp', hl: 'ja' },
      { query: 'query2', gl: 'us', hl: 'en' }
    ]

    it('should execute searches in parallel', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ organic: [] })
      } as any)

      const results = await service.batchSearch(queries)

      expect(results).toHaveLength(2)
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('should handle partial failures', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ organic: [{ title: 'Result 1' }] })
        } as any)
        .mockRejectedValueOnce(new Error('Search failed'))

      const results = await service.batchSearch(queries)

      expect(results).toHaveLength(2)
      expect(results[0].searchResults).toHaveLength(1)
      expect(results[1].searchResults).toHaveLength(0) // Failed search returns empty
    })
  })

  describe('rate limiting', () => {
    it('should wait when rate limit is exceeded', async () => {
      const startTime = Date.now()
      
      // Mock successful responses
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ organic: [] })
      } as any)

      // Create a service with very low rate limit for testing
      const rateLimitedService = new SerperSearchService({
        apiKey: mockApiKey,
        rateLimit: { tokensPerInterval: 2, interval: 1000 } // 2 requests per second
      })

      // Make 3 rapid requests
      const promises = [
        rateLimitedService.search({ query: 'test1' }),
        rateLimitedService.search({ query: 'test2' }),
        rateLimitedService.search({ query: 'test3' }) // This should wait
      ]

      await Promise.all(promises)
      
      const elapsed = Date.now() - startTime
      // Third request should have waited ~1 second
      expect(elapsed).toBeGreaterThanOrEqual(900) // Allow some margin
    })
  })

  describe('clearCache', () => {
    it('should clear all cached results', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ organic: [] })
      } as any)

      // Make a search to populate cache
      await service.search({ query: 'test' })
      expect(mockFetch).toHaveBeenCalledTimes(1)

      // Clear cache
      service.clearCache()

      // Same search should hit API again
      await service.search({ query: 'test' })
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('validateApiKey', () => {
    it('should return true for valid API key', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ organic: [] })
      } as any)

      const isValid = await service.validateApiKey()
      expect(isValid).toBe(true)
    })

    it('should return false for invalid API key', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401
      } as any)

      const isValid = await service.validateApiKey()
      expect(isValid).toBe(false)
    })
  })
})