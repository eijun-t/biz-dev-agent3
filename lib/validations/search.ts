/**
 * Zod validation schemas for search-related data
 */

import { z } from 'zod'

/**
 * Search query validation schema
 */
export const searchQuerySchema = z.object({
  query: z.string().min(1, '検索クエリは必須です').max(200, '検索クエリは200文字以内で入力してください'),
  purpose: z.enum([
    'market_size',
    'competitors',
    'trends',
    'regulations',
    'needs',
    'startups',
    'technology',
    'best_practices'
  ]),
  region: z.enum(['jp', 'global']),
  options: z.object({
    gl: z.string().length(2, '地域コードは2文字で指定してください'),
    hl: z.string().length(2, '言語コードは2文字で指定してください'),
    num: z.number().min(1).max(100, '検索結果数は1〜100の範囲で指定してください')
  })
})

/**
 * Search query set validation schema
 */
export const searchQuerySetSchema = z.object({
  japanese: z.array(searchQuerySchema).length(5, '日本市場向けクエリは5つ必要です'),
  global: z.array(searchQuerySchema).length(3, '海外先端事例向けクエリは3つ必要です'),
  generatedAt: z.date()
})

/**
 * Search options validation schema
 */
export const searchOptionsSchema = z.object({
  gl: z.string().length(2).optional(),
  hl: z.string().length(2).optional(),
  num: z.number().min(1).max(100).optional(),
  type: z.enum(['search', 'news', 'images']).optional()
})

/**
 * Web search result validation schema
 */
export const webSearchResultSchema = z.object({
  title: z.string(),
  link: z.string().url('有効なURLである必要があります'),
  snippet: z.string(),
  position: z.number().optional(),
  date: z.string().optional()
})

/**
 * Search results validation schema
 */
export const searchResultsSchema = z.object({
  japanese: z.array(webSearchResultSchema),
  global: z.array(webSearchResultSchema),
  searchTime: z.number().positive(),
  totalResults: z.number().nonnegative()
})

/**
 * Research insights validation schema
 */
export const researchInsightsSchema = z.object({
  marketSize: z.string().optional(),
  competitors: z.array(z.string()).optional(),
  trends: z.array(z.string()).optional(),
  regulations: z.array(z.string()).optional(),
  customerNeeds: z.array(z.string()).optional()
})

/**
 * Global insights validation schema
 */
export const globalInsightsSchema = z.object({
  innovations: z.array(z.string()).optional(),
  technologies: z.array(z.string()).optional(),
  bestPractices: z.array(z.string()).optional(),
  applicability: z.string().optional()
})

/**
 * Processed research validation schema
 */
export const processedResearchSchema = z.object({
  theme: z.string().min(1, 'テーマは必須です'),
  queries: searchQuerySetSchema,
  rawResults: searchResultsSchema,
  insights: researchInsightsSchema,
  globalInsights: globalInsightsSchema,
  sources: z.object({
    japanese: z.array(z.string().url()),
    global: z.array(z.string().url())
  })
})

/**
 * Research summary validation schema
 */
export const researchSummarySchema = processedResearchSchema.extend({
  summary: z.string().min(1, '要約は必須です'),
  keyFindings: z.array(z.string()).min(1, '主要な発見事項は最低1つ必要です'),
  recommendations: z.array(z.string()).optional(),
  generatedAt: z.date()
})

/**
 * Agent metrics validation schema
 */
export const agentMetricsSchema = z.object({
  executionTime: z.number().positive(),
  tokensUsed: z.number().nonnegative(),
  apiCallsCount: z.number().nonnegative(),
  cacheHitRate: z.number().min(0).max(100),
  errors: z.array(z.object({
    timestamp: z.date(),
    type: z.string(),
    message: z.string(),
    retryable: z.boolean()
  }))
})

/**
 * Researcher input validation schema
 */
export const researcherInputSchema = z.object({
  theme: z.string().min(1, 'テーマは必須です').max(500, 'テーマは500文字以内で入力してください'),
  sessionId: z.string().uuid('有効なセッションIDを指定してください'),
  constraints: z.object({
    maxResults: z.number().min(1).max(100).optional(),
    regions: z.array(z.string()).optional()
  }).optional()
})

/**
 * Serper API response validation schema
 */
export const serperResponseSchema = z.object({
  searchParameters: z.object({
    q: z.string(),
    gl: z.string(),
    hl: z.string(),
    num: z.number(),
    type: z.string()
  }),
  organic: z.array(z.object({
    title: z.string(),
    link: z.string(),
    snippet: z.string(),
    position: z.number()
  })),
  news: z.array(z.object({
    title: z.string(),
    link: z.string(),
    snippet: z.string(),
    date: z.string()
  })).optional(),
  answerBox: z.object({
    title: z.string(),
    answer: z.string()
  }).optional(),
  searchInformation: z.object({
    totalResults: z.number(),
    timeTaken: z.number()
  }).optional()
})

// Export types inferred from schemas
export type SearchQuery = z.infer<typeof searchQuerySchema>
export type SearchQuerySet = z.infer<typeof searchQuerySetSchema>
export type SearchOptions = z.infer<typeof searchOptionsSchema>
export type WebSearchResult = z.infer<typeof webSearchResultSchema>
export type SearchResults = z.infer<typeof searchResultsSchema>
export type ProcessedResearch = z.infer<typeof processedResearchSchema>
export type ResearchSummary = z.infer<typeof researchSummarySchema>
export type AgentMetrics = z.infer<typeof agentMetricsSchema>
export type ResearcherInput = z.infer<typeof researcherInputSchema>
export type SerperResponse = z.infer<typeof serperResponseSchema>