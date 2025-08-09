/**
 * Search-related type definitions for the Broad Researcher Agent
 */

/**
 * Individual search query with its purpose and configuration
 */
export interface SearchQuery {
  query: string
  purpose: 
    | 'market_size' 
    | 'competitors' 
    | 'trends' 
    | 'regulations' 
    | 'needs' 
    | 'startups' 
    | 'technology' 
    | 'best_practices'
  region: 'jp' | 'global'
  options: {
    gl: string  // Geographic location (e.g., 'jp', 'us')
    hl: string  // Language (e.g., 'ja', 'en')
    num: number // Number of results
  }
}

/**
 * Set of search queries divided by region
 */
export interface SearchQuerySet {
  japanese: SearchQuery[]    // Japanese market queries (5)
  global: SearchQuery[]      // Global advanced case queries (3)
  generatedAt: Date
}

/**
 * Extended search options for the Serper API
 */
export interface SearchOptions {
  gl?: string               // Geographic location
  hl?: string               // Language
  num?: number              // Number of results (default: 10)
  type?: 'search' | 'news' | 'images'  // Search type
}

// WebSearchResult is imported from index.ts

/**
 * Search results categorized by region
 */
export interface SearchResults {
  japanese: WebSearchResult[]
  global: WebSearchResult[]
  searchTime: number
  totalResults: number
}

/**
 * Processed research data with insights
 */
export interface ProcessedResearch {
  theme: string
  queries: SearchQuerySet
  rawResults: SearchResults
  insights: {
    marketSize?: string
    competitors?: string[]
    trends?: string[]
    regulations?: string[]
    customerNeeds?: string[]
  }
  globalInsights: {
    innovations?: string[]
    technologies?: string[]
    bestPractices?: string[]
    applicability?: string  // Applicability to Japanese market
  }
  sources: {
    japanese: string[]
    global: string[]
  }
  // 追加: より詳細な分析データ
  detailedAnalysis?: {
    marketAnalysis: {
      currentSize: string
      growthRate: string
      futureProjection: string
      keyDrivers: string[]
      challenges: string[]
    }
    competitiveAnalysis: {
      topPlayers: Array<{
        name: string
        marketShare?: string
        strengths: string[]
        weaknesses: string[]
      }>
      competitiveDynamics: string
      entryBarriers: string[]
    }
    opportunityAnalysis: {
      untappedSegments: string[]
      emergingNeeds: string[]
      technologicalOpportunities: string[]
      strategicPartnerships: string[]
    }
    riskAnalysis: {
      marketRisks: string[]
      regulatoryRisks: string[]
      technologicalRisks: string[]
      competitiveRisks: string[]
    }
  }
}

/**
 * Final research summary output
 */
export interface ResearchSummary extends ProcessedResearch {
  summary: string              // LLM-generated integrated summary
  keyFindings: string[]        // Key findings
  recommendations?: string[]   // Optional recommendations
  generatedAt: Date
}

/**
 * Agent execution metrics
 */
export interface AgentMetrics {
  executionTime: number        // Execution time in milliseconds
  tokensUsed: number          // Total tokens used
  apiCallsCount: number       // Number of API calls
  cacheHitRate: number        // Cache hit rate percentage
  errors: ErrorMetric[]       // Error information
}

/**
 * Error metric information
 */
export interface ErrorMetric {
  timestamp: Date
  type: string
  message: string
  retryable: boolean
}

/**
 * Serper API response schema
 */
export interface SerperResponse {
  searchParameters: {
    q: string
    gl: string
    hl: string
    num: number
    type: string
  }
  organic: Array<{
    title: string
    link: string
    snippet: string
    position: number
  }>
  news?: Array<{
    title: string
    link: string
    snippet: string
    date: string
  }>
  answerBox?: {
    title: string
    answer: string
  }
  searchInformation: {
    totalResults: number
    timeTaken: number
  }
}

/**
 * Cache entry for search results
 */
export interface CacheEntry {
  data: WebSearchResult[]
  timestamp: number
  query: string
  options: SearchOptions
}