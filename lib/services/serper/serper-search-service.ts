/**
 * Serper API search service implementation
 */

import { z } from 'zod'
import { 
  SearchOptions, 
  WebSearchResult, 
  CacheEntry,
  SerperResponse 
} from '@/lib/types/search'
import { 
  SearchServiceConfig 
} from '@/lib/types/agents'
import { 
  WebSearchQuery, 
  WebSearchResponse, 
  WebSearchService 
} from '@/lib/interfaces/web-search'
import { RateLimiter } from '@/lib/utils/rate-limiter'
import { serperResponseSchema } from '@/lib/validations/search'

/**
 * Custom error class for Serper API errors
 */
export class SerperAPIError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public retryable: boolean
  ) {
    super(message)
    this.name = 'SerperAPIError'
  }
}

/**
 * Serper search service implementation
 */
export class SerperSearchService implements WebSearchService {
  private readonly apiKey: string
  private readonly baseUrl = 'https://google.serper.dev/search'
  private readonly timeout: number
  private readonly cacheTTL: number
  private readonly maxRetries: number
  private readonly rateLimiter: RateLimiter
  private cache = new Map<string, CacheEntry>()

  constructor(config?: SearchServiceConfig) {
    // If no config provided, load from environment variables
    if (!config) {
      const apiKey = process.env.SERPER_API_KEY
      if (!apiKey) {
        throw new Error('SERPER_API_KEY is required')
      }
      
      config = {
        apiKey,
        config: {
          timeout: process.env.SERPER_API_TIMEOUT ? parseInt(process.env.SERPER_API_TIMEOUT) : 10000,
          cacheTTL: process.env.SERPER_CACHE_TTL ? parseInt(process.env.SERPER_CACHE_TTL) : 300,
          maxRetries: process.env.SERPER_MAX_RETRIES ? parseInt(process.env.SERPER_MAX_RETRIES) : 3
        },
        rateLimit: {
          tokensPerInterval: 100,
          interval: 60000
        }
      }
    }
    
    this.apiKey = config.apiKey
    this.timeout = config.config?.timeout ?? 10000
    this.cacheTTL = (config.config?.cacheTTL ?? 300) * 1000 // Convert seconds to milliseconds
    this.maxRetries = config.config?.maxRetries ?? 3
    
    // Initialize rate limiter
    if (config.rateLimit) {
      this.rateLimiter = new RateLimiter(
        config.rateLimit.tokensPerInterval,
        config.rateLimit.interval
      )
    } else {
      this.rateLimiter = new RateLimiter(100, 60000) // Default: 100 requests per minute
    }

    // Validate API key on initialization
    if (!this.apiKey || this.apiKey === 'your_serper_api_key') {
      throw new Error('有効なSerper APIキーが設定されていません。環境変数SERPER_API_KEYを確認してください。')
    }
  }

  /**
   * Execute a search query
   */
  async search(query: WebSearchQuery): Promise<WebSearchResponse> {
    // Check cache first
    const cacheKey = this.getCacheKey(query.query, query)
    const cached = this.getFromCache(cacheKey)
    if (cached) {
      return {
        searchResults: cached,
        totalResults: cached.length,
        searchTime: 0,
        cached: true
      }
    }

    // Wait for rate limit
    await this.rateLimiter.waitIfNeeded()

    // Build request body
    const requestBody = {
      q: query.query,
      gl: query.gl ?? 'jp',
      hl: query.hl ?? 'ja',
      num: query.num ?? 10,
      type: query.type ?? 'search'
    }

    try {
      // Execute search with timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'X-API-KEY': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const retryable = response.status >= 500 || response.status === 429
        throw new SerperAPIError(
          response.status,
          `Serper API error: ${response.status} ${response.statusText}`,
          retryable
        )
      }

      const data = await response.json()
      const validatedData = serperResponseSchema.parse(data)

      // Convert to our format
      const results = this.convertResults(validatedData)

      // Cache the results
      this.storeInCache(cacheKey, results, query)

      return {
        searchResults: results,
        totalResults: validatedData.searchInformation?.totalResults ?? results.length,
        searchTime: validatedData.searchInformation?.timeTaken ?? 0,
        cached: false
      }

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Timeout error
        console.error(`Search timeout for query: ${query.query}`)
        return {
          searchResults: [],
          totalResults: 0,
          searchTime: this.timeout,
          cached: false
        }
      }
      throw error
    }
  }

  /**
   * Search with retry logic
   */
  async searchWithRetry(
    query: string, 
    options?: SearchOptions
  ): Promise<WebSearchResult[]> {
    const searchQuery: WebSearchQuery = {
      query,
      gl: options?.gl,
      hl: options?.hl,
      num: options?.num,
      type: options?.type
    }

    let lastError: Error | null = null
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.search(searchQuery)
        return response.searchResults
      } catch (error) {
        lastError = error as Error
        
        if (error instanceof SerperAPIError && !error.retryable) {
          throw error
        }

        if (attempt < this.maxRetries) {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    throw lastError || new Error('検索に失敗しました')
  }

  /**
   * Execute multiple searches in batch
   */
  async batchSearch(queries: WebSearchQuery[]): Promise<WebSearchResponse[]> {
    return Promise.all(queries.map(query => this.search(query)))
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Validate API key by making a test request
   */
  async validateApiKey(): Promise<boolean> {
    try {
      await this.search({
        query: 'test',
        num: 1
      })
      return true
    } catch (error) {
      if (error instanceof SerperAPIError && error.statusCode === 401) {
        return false
      }
      // Other errors don't necessarily mean invalid API key
      return true
    }
  }

  /**
   * Convert Serper response to our format
   */
  private convertResults(data: SerperResponse): WebSearchResult[] {
    const results: WebSearchResult[] = []

    // Add organic results
    if (data.organic) {
      data.organic.forEach(item => {
        results.push({
          title: item.title,
          link: item.link,
          snippet: item.snippet,
          position: item.position
        })
      })
    }

    // Add news results if available
    if (data.news) {
      data.news.forEach(item => {
        results.push({
          title: item.title,
          link: item.link,
          snippet: item.snippet,
          date: item.date
        })
      })
    }

    return results
  }

  /**
   * Generate cache key
   */
  private getCacheKey(query: string, options: Partial<WebSearchQuery>): string {
    const key = `${query}-${options.gl ?? 'jp'}-${options.hl ?? 'ja'}-${options.num ?? 10}-${options.type ?? 'search'}`
    return key
  }

  /**
   * Get from cache if valid
   */
  private getFromCache(key: string): WebSearchResult[] | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const now = Date.now()
    if (now - entry.timestamp > this.cacheTTL) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  /**
   * Store in cache
   */
  private storeInCache(
    key: string, 
    data: WebSearchResult[], 
    query: WebSearchQuery
  ): void {
    // Implement simple LRU by limiting cache size
    if (this.cache.size >= 1000) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) {
        this.cache.delete(firstKey)
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      query: query.query,
      options: {
        gl: query.gl,
        hl: query.hl,
        num: query.num,
        type: query.type
      }
    })
  }
}