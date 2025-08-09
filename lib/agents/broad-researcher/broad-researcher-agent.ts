/**
 * Broad Researcher Agent implementation
 */

import { BaseAgent, BaseAgentContext, AgentExecutionResult } from '@/lib/interfaces/base-agent'
import { WebSearchService } from '@/lib/interfaces/web-search'
import { DatabaseService } from '@/lib/interfaces/database'
import { AgentLoggerService } from '@/lib/services/agent-logger'
import { SearchResultProcessor } from './search-result-processor'
import { ChatOpenAI } from '@langchain/openai'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import {
  ResearcherInput,
  ResearcherOutput,
  AgentMetrics,
  SearchServiceConfig
} from '@/lib/types/agents'
import {
  SearchQuery,
  SearchQuerySet,
  SearchResults,
  ProcessedResearch,
  ResearchSummary
} from '@/lib/types/search'
import { researcherInputSchema } from '@/lib/validations/search'

/**
 * Broad Researcher Agent - Performs comprehensive market research
 */
export class BroadResearcherAgent extends BaseAgent {
  private searchService: WebSearchService
  private llm: ChatOpenAI
  private resultProcessor: SearchResultProcessor
  private logger: AgentLoggerService
  private db: DatabaseService
  private startTime: number = 0
  private metrics: AgentMetrics = {
    executionTime: 0,
    tokensUsed: 0,
    apiCallsCount: 0,
    cacheHitRate: 0,
    errors: []
  }

  constructor(
    context: BaseAgentContext,
    searchService: WebSearchService,
    llm: ChatOpenAI,
    db: DatabaseService
  ) {
    super(context)
    this.searchService = searchService
    this.llm = llm
    this.resultProcessor = new SearchResultProcessor()
    this.logger = new AgentLoggerService(db)
    this.db = db
  }

  /**
   * Execute the research agent
   */
  async execute(input: any): Promise<AgentExecutionResult> {
    this.startTime = Date.now()
    const messages = []

    try {
      // Validate input
      const validatedInput = researcherInputSchema.parse(input) as ResearcherInput
      
      messages.push(this.createMessage(
        `リサーチを開始します: ${validatedInput.theme}`,
        { phase: 'start', theme: validatedInput.theme }
      ))

      // Generate search queries
      messages.push(this.createMessage('検索クエリを生成中...', { phase: 'query_generation' }))
      const queries = await this.generateSearchQueries(validatedInput.theme)
      messages.push(this.createMessage(
        `検索クエリを生成しました（日本: ${queries.japanese.length}件、海外: ${queries.global.length}件）`,
        { phase: 'queries_generated', queries }
      ))

      // Execute searches
      messages.push(this.createMessage('Web検索を実行中...', { phase: 'searching' }))
      const searchResults = await this.executeSearches(queries)
      messages.push(this.createMessage(
        `検索完了（日本: ${searchResults.japanese.length}件、海外: ${searchResults.global.length}件）`,
        { phase: 'search_complete', resultCount: searchResults.totalResults }
      ))

      // Process results
      messages.push(this.createMessage('検索結果を分析中...', { phase: 'processing' }))
      const processedResearch = await this.processResults(searchResults, queries, validatedInput.theme)
      
      // Generate summary
      messages.push(this.createMessage('要約を生成中...', { phase: 'summarizing' }))
      const summary = await this.summarizeResults(processedResearch)
      
      // Calculate final metrics
      this.metrics.executionTime = Date.now() - this.startTime
      
      messages.push(this.createMessage(
        'リサーチが完了しました',
        { 
          phase: 'complete', 
          executionTime: this.metrics.executionTime,
          tokensUsed: this.metrics.tokensUsed
        }
      ))

      // Log to database
      await this.logExecution(validatedInput, summary)

      const output: ResearcherOutput = {
        research: summary,
        metrics: this.metrics
      }

      return {
        success: true,
        data: output,
        messages
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '不明なエラー'
      
      this.metrics.errors.push({
        timestamp: new Date(),
        type: error?.constructor?.name || 'UnknownError',
        message: errorMessage,
        retryable: false
      })

      messages.push(this.createMessage(
        `エラーが発生しました: ${errorMessage}`,
        { phase: 'error', error: errorMessage }
      ))

      return {
        success: false,
        error: errorMessage,
        messages
      }
    }
  }

  /**
   * Get agent name
   */
  getAgentName(): 'researcher' {
    return 'researcher'
  }

  /**
   * Generate search queries using LLM
   */
  private async generateSearchQueries(theme: string): Promise<SearchQuerySet> {
    const systemPrompt = `あなたは市場調査の専門家です。与えられたテーマについて、包括的な市場調査を行うための検索クエリを生成してください。

出力形式:
- 日本市場向けクエリを5つ
- 海外先端事例向けクエリを3つ（英語）

各クエリには以下の観点を含めてください:
【日本市場向け】
1. 市場規模と成長性
2. 主要プレーヤーと競合状況
3. 最新トレンドと技術動向
4. 規制と政策動向
5. 顧客ニーズと課題

【海外先端事例向け】
1. 革新的なスタートアップとユニコーン企業
2. 最先端技術の実装事例
3. グローバルトレンドとベストプラクティス

JSONフォーマットで出力してください:
{
  "japanese": [
    {"query": "...", "purpose": "market_size|competitors|trends|regulations|needs"},
    ...
  ],
  "global": [
    {"query": "...", "purpose": "startups|technology|best_practices"},
    ...
  ]
}`

    const userPrompt = `テーマ: ${theme}`

    try {
      const response = await this.llm.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(userPrompt)
      ])

      this.metrics.apiCallsCount++
      this.metrics.tokensUsed += response.usage_metadata?.total_tokens || 0

      const content = response.content.toString()
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('LLMレスポンスからJSONを抽出できませんでした')
      }

      const parsedQueries = JSON.parse(jsonMatch[0])
      
      // Convert to SearchQuerySet format
      const queries: SearchQuerySet = {
        japanese: parsedQueries.japanese.map((q: any, index: number) => ({
          query: q.query,
          purpose: q.purpose || this.getJapanesePurpose(index),
          region: 'jp',
          options: {
            gl: 'jp',
            hl: 'ja',
            num: 10
          }
        })),
        global: parsedQueries.global.map((q: any, index: number) => ({
          query: q.query,
          purpose: q.purpose || this.getGlobalPurpose(index),
          region: 'global',
          options: {
            gl: 'us',
            hl: 'en',
            num: 10
          }
        })),
        generatedAt: new Date()
      }

      return queries

    } catch (error) {
      console.error('Query generation error:', error)
      // Fallback to default queries
      return this.getDefaultQueries(theme)
    }
  }

  /**
   * Execute searches in parallel
   */
  private async executeSearches(queries: SearchQuerySet): Promise<SearchResults> {
    const allQueries = [...queries.japanese, ...queries.global]
    const searchPromises = allQueries.map(query => 
      this.searchService.search({
        query: query.query,
        ...query.options
      }).catch(error => {
        console.error(`Search error for query "${query.query}":`, error)
        this.metrics.errors.push({
          timestamp: new Date(),
          type: 'SearchError',
          message: `Failed to search: ${query.query}`,
          retryable: true
        })
        return { searchResults: [], totalResults: 0, searchTime: 0, cached: false }
      })
    )

    const results = await Promise.all(searchPromises)
    this.metrics.apiCallsCount += results.length

    // Calculate cache hit rate
    const cachedResults = results.filter(r => r.cached).length
    this.metrics.cacheHitRate = (cachedResults / results.length) * 100

    // Separate Japanese and global results
    const japaneseResults = results
      .slice(0, queries.japanese.length)
      .flatMap(r => r.searchResults)
    
    const globalResults = results
      .slice(queries.japanese.length)
      .flatMap(r => r.searchResults)

    // Remove duplicates
    const uniqueJapanese = this.resultProcessor.removeDuplicates(japaneseResults)
    const uniqueGlobal = this.resultProcessor.removeDuplicates(globalResults)

    return {
      japanese: uniqueJapanese,
      global: uniqueGlobal,
      searchTime: results.reduce((sum, r) => sum + r.searchTime, 0),
      totalResults: uniqueJapanese.length + uniqueGlobal.length
    }
  }

  /**
   * Process search results
   */
  private async processResults(
    results: SearchResults,
    queries: SearchQuerySet,
    theme: string
  ): Promise<ProcessedResearch> {
    // Extract insights
    const allResults = [...results.japanese, ...results.global]
    const insights = this.resultProcessor.extractKeyInsights(allResults)

    // Categorize insights
    const marketInsights = insights.filter(i => i.type === 'market')
    const competitorInsights = insights.filter(i => i.type === 'competitor')
    const trendInsights = insights.filter(i => i.type === 'trend')
    const regulationInsights = insights.filter(i => i.type === 'regulation')
    const needInsights = insights.filter(i => i.type === 'need')
    const innovationInsights = insights.filter(i => i.type === 'innovation')

    // Analyze global applicability
    const applicability = this.resultProcessor.analyzeApplicability(results.global)

    // Extract unique sources
    const japaneseSources = [...new Set(results.japanese.map(r => r.link))]
    const globalSources = [...new Set(results.global.map(r => r.link))]

    return {
      theme,
      queries,
      rawResults: results,
      insights: {
        marketSize: marketInsights[0]?.content,
        competitors: competitorInsights.slice(0, 5).map(i => i.content),
        trends: trendInsights.slice(0, 5).map(i => i.content),
        regulations: regulationInsights.slice(0, 3).map(i => i.content),
        customerNeeds: needInsights.slice(0, 5).map(i => i.content)
      },
      globalInsights: {
        innovations: innovationInsights.slice(0, 3).map(i => i.content),
        technologies: trendInsights
          .filter(i => i.content.toLowerCase().includes('technology'))
          .slice(0, 3)
          .map(i => i.content),
        bestPractices: insights
          .filter(i => i.content.toLowerCase().includes('best practice'))
          .slice(0, 3)
          .map(i => i.content),
        applicability: applicability.reasoning
      },
      sources: {
        japanese: japaneseSources.slice(0, 10),
        global: globalSources.slice(0, 10)
      }
    }
  }

  /**
   * Generate summary using LLM
   */
  private async summarizeResults(processed: ProcessedResearch): Promise<ResearchSummary> {
    const systemPrompt = `あなたは市場調査レポートの専門家です。収集された市場調査データを基に、簡潔で洞察に富んだ要約を作成してください。

要約には以下を含めてください:
1. 市場の全体像
2. 主要な発見事項（3-5点）
3. ビジネス機会
4. 推奨アクション（オプション）

トーンは専門的かつ簡潔に。`

    const userPrompt = `テーマ: ${processed.theme}

収集されたインサイト:
- 市場規模: ${processed.insights.marketSize || '情報なし'}
- 主要競合: ${processed.insights.competitors?.join(', ') || '情報なし'}
- トレンド: ${processed.insights.trends?.join(', ') || '情報なし'}
- 規制: ${processed.insights.regulations?.join(', ') || '情報なし'}
- 顧客ニーズ: ${processed.insights.customerNeeds?.join(', ') || '情報なし'}

海外先端事例:
- イノベーション: ${processed.globalInsights.innovations?.join(', ') || '情報なし'}
- 技術: ${processed.globalInsights.technologies?.join(', ') || '情報なし'}
- 日本市場への適用性: ${processed.globalInsights.applicability || '情報なし'}`

    try {
      const response = await this.llm.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(userPrompt)
      ])

      this.metrics.apiCallsCount++
      this.metrics.tokensUsed += response.usage_metadata?.total_tokens || 0

      const summary = response.content.toString()
      
      // Extract key findings
      const keyFindings = this.extractKeyFindings(summary)
      
      // Extract recommendations if any
      const recommendations = this.extractRecommendations(summary)

      return {
        ...processed,
        summary,
        keyFindings,
        recommendations: recommendations.length > 0 ? recommendations : undefined,
        generatedAt: new Date()
      }

    } catch (error) {
      console.error('Summary generation error:', error)
      // Fallback summary
      return {
        ...processed,
        summary: this.generateFallbackSummary(processed),
        keyFindings: ['市場調査を完了しました', '詳細な分析結果は個別のインサイトをご確認ください'],
        generatedAt: new Date()
      }
    }
  }

  /**
   * Log execution to database
   */
  private async logExecution(input: ResearcherInput, summary: ResearchSummary): Promise<void> {
    try {
      await this.logger.log({
        sessionId: input.sessionId,
        agentName: this.getAgentName(),
        message: 'Research completed',
        data: {
          executionId: crypto.randomUUID(),
          theme: input.theme,
          queries: summary.queries,
          results: {
            summary: summary.summary,
            insights: summary.insights,
            globalInsights: summary.globalInsights,
            sources: summary.sources
          },
          metrics: this.metrics
        }
      })
    } catch (error) {
      console.error('Failed to log execution:', error)
      // Don't throw - logging failure shouldn't fail the operation
    }
  }

  /**
   * Get default Japanese purpose by index
   */
  private getJapanesePurpose(index: number): SearchQuery['purpose'] {
    const purposes: SearchQuery['purpose'][] = [
      'market_size',
      'competitors',
      'trends',
      'regulations',
      'needs'
    ]
    return purposes[index] || 'trends'
  }

  /**
   * Get default global purpose by index
   */
  private getGlobalPurpose(index: number): SearchQuery['purpose'] {
    const purposes: SearchQuery['purpose'][] = [
      'startups',
      'technology',
      'best_practices'
    ]
    return purposes[index] || 'technology'
  }

  /**
   * Get default queries as fallback
   */
  private getDefaultQueries(theme: string): SearchQuerySet {
    return {
      japanese: [
        {
          query: `${theme} 市場規模 日本`,
          purpose: 'market_size',
          region: 'jp',
          options: { gl: 'jp', hl: 'ja', num: 10 }
        },
        {
          query: `${theme} 企業 ランキング 日本`,
          purpose: 'competitors',
          region: 'jp',
          options: { gl: 'jp', hl: 'ja', num: 10 }
        },
        {
          query: `${theme} トレンド 2024`,
          purpose: 'trends',
          region: 'jp',
          options: { gl: 'jp', hl: 'ja', num: 10 }
        },
        {
          query: `${theme} 規制 法律 日本`,
          purpose: 'regulations',
          region: 'jp',
          options: { gl: 'jp', hl: 'ja', num: 10 }
        },
        {
          query: `${theme} 課題 ニーズ`,
          purpose: 'needs',
          region: 'jp',
          options: { gl: 'jp', hl: 'ja', num: 10 }
        }
      ],
      global: [
        {
          query: `${theme} startup unicorn 2024`,
          purpose: 'startups',
          region: 'global',
          options: { gl: 'us', hl: 'en', num: 10 }
        },
        {
          query: `${theme} innovation technology trends`,
          purpose: 'technology',
          region: 'global',
          options: { gl: 'us', hl: 'en', num: 10 }
        },
        {
          query: `${theme} best practices global`,
          purpose: 'best_practices',
          region: 'global',
          options: { gl: 'us', hl: 'en', num: 10 }
        }
      ],
      generatedAt: new Date()
    }
  }

  /**
   * Extract key findings from summary
   */
  private extractKeyFindings(summary: string): string[] {
    const findings: string[] = []
    
    // Look for numbered items
    const numberedPattern = /\d+[\.、]\s*(.+?)(?=\d+[\.、]|$)/g
    const matches = summary.match(numberedPattern)
    
    if (matches) {
      findings.push(...matches.map(m => m.replace(/^\d+[\.、]\s*/, '').trim()))
    }

    // Look for bullet points
    const bulletPattern = /[・•]\s*(.+?)(?=[・•]|$)/g
    const bulletMatches = summary.match(bulletPattern)
    
    if (bulletMatches) {
      findings.push(...bulletMatches.map(m => m.replace(/^[・•]\s*/, '').trim()))
    }

    // Return top 5 findings
    return findings.slice(0, 5)
  }

  /**
   * Extract recommendations from summary
   */
  private extractRecommendations(summary: string): string[] {
    const recommendations: string[] = []
    
    // Look for recommendation section
    const recPattern = /(?:推奨|おすすめ|提案|Recommend).+?[:：]\s*(.+?)(?=\n\n|$)/gs
    const matches = summary.match(recPattern)
    
    if (matches) {
      matches.forEach(match => {
        const items = match.split(/[、。]/).filter(item => item.trim().length > 0)
        recommendations.push(...items)
      })
    }

    return recommendations.slice(0, 3)
  }

  /**
   * Generate fallback summary
   */
  private generateFallbackSummary(processed: ProcessedResearch): string {
    const parts: string[] = []
    
    parts.push(`「${processed.theme}」に関する市場調査を実施しました。`)
    
    if (processed.insights.marketSize) {
      parts.push(`市場規模: ${processed.insights.marketSize}`)
    }
    
    if (processed.insights.competitors && processed.insights.competitors.length > 0) {
      parts.push(`主要プレーヤー: ${processed.insights.competitors.slice(0, 3).join('、')}`)
    }
    
    if (processed.insights.trends && processed.insights.trends.length > 0) {
      parts.push(`注目トレンド: ${processed.insights.trends[0]}`)
    }
    
    if (processed.globalInsights.applicability) {
      parts.push(`海外事例の分析: ${processed.globalInsights.applicability}`)
    }
    
    return parts.join('\n\n')
  }
}