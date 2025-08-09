/**
 * Agent-specific type definitions
 */

import { ProcessedResearch, ResearchSummary, AgentMetrics } from './search'

/**
 * Base agent context for all agents
 */
export interface BaseAgentContext {
  sessionId: string
  userId: string
  model: string
  temperature: number
  maxTokens: number
}

/**
 * Agent execution result
 */
export interface AgentExecutionResult {
  success: boolean
  data?: any
  error?: string
  messages: AgentMessage[]
}

/**
 * Agent message for logging and progress tracking
 */
export interface AgentMessage {
  agent: 'researcher' | 'ideator' | 'critic' | 'analyst' | 'writer'
  message: string
  timestamp: string
  data?: any
}

/**
 * Input for the Broad Researcher Agent
 */
export interface ResearcherInput {
  theme: string           // Research theme
  sessionId: string      // Session ID for tracking
  constraints?: {
    maxResults?: number  // Maximum results per query
    regions?: string[]   // Target regions
  }
}

/**
 * Output from the Broad Researcher Agent
 */
export interface ResearcherOutput {
  research: ResearchSummary
  metrics: AgentMetrics
}

/**
 * Key insight extracted from search results
 */
export interface KeyInsight {
  type: 'market' | 'competitor' | 'trend' | 'regulation' | 'need' | 'innovation' | 'technology'
  content: string
  source: string
  relevance: number  // 0-1 relevance score
}

/**
 * Detailed insight with additional metadata
 */
export interface DetailedInsight extends KeyInsight {
  rawData?: string          // 元データ
  confidence: number        // 信頼度スコア (0-1)
  entities: string[]        // 抽出されたエンティティ（企業名、技術名など）
  metrics?: {               // 数値データ
    value: number
    unit: string
    context: string
  }[]
}

/**
 * Consolidated insights from multiple sources
 */
export interface ConsolidatedInsights {
  marketInsights: {
    size: string
    growth: string
    segments: string[]
    keyMetrics: { label: string; value: string }[]
  }
  competitorInsights: {
    topPlayers: string[]
    marketShares: { company: string; share: string }[]
    strategies: string[]
  }
  trendInsights: {
    current: string[]
    emerging: string[]
    declining: string[]
  }
  customerInsights: {
    needs: string[]
    painPoints: string[]
    behaviors: string[]
  }
  technologyInsights: {
    current: string[]
    emerging: string[]
    disruptive: string[]
  }
}

/**
 * Categorized search results by region
 */
export interface CategorizedResults {
  japanese: {
    results: import('./index').WebSearchResult[]
    count: number
  }
  global: {
    results: import('./index').WebSearchResult[]
    count: number
  }
}

/**
 * Applicability analysis for global cases
 */
export interface ApplicabilityAnalysis {
  applicable: boolean
  reasoning: string
  adaptations: string[]
  challenges: string[]
  opportunities: string[]
}

/**
 * Search service configuration
 */
export interface SearchServiceConfig {
  apiKey: string
  timeout?: number        // Default: 5000ms
  cacheTTL?: number      // Default: 3600000ms (1 hour)
  maxRetries?: number    // Default: 2
}

/**
 * Agent log entry
 */
export interface AgentLogEntry {
  id: string
  sessionId: string
  agentName: string
  message: string
  level?: 'info' | 'warn' | 'error'
  data?: any
  error?: {
    name: string
    message: string
    stack?: string
  }
  createdAt: Date
}