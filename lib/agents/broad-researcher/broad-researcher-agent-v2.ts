/**
 * Broad Researcher Agent V2 - Enhanced with Deep Analysis
 * 深い市場分析を行う改良版ブロードリサーチャーエージェント
 */

import { BaseAgent } from '@/lib/interfaces/base-agent'
import { 
  AgentExecutionResult, 
  ResearcherInput, 
  ResearcherOutput,
  AgentMetrics,
  AgentMessage
} from '@/lib/types/agents'
import { 
  SearchQuery, 
  SearchQuerySet, 
  SearchResults, 
  ProcessedResearch, 
  ResearchSummary 
} from '@/lib/types/search'
import { WebSearchResult } from '@/lib/types'
import { SerperSearchService } from '@/lib/services/serper/serper-search-service'
import { AdvancedSearchProcessor } from './advanced-search-processor'
import { BaseChatModel } from '@langchain/core/language_models/chat'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { LocalLogger } from './local-logger'

/**
 * Enhanced Broad Researcher Agent with deep analysis capabilities
 */
export class BroadResearcherAgentV2 extends BaseAgent {
  private logger: LocalLogger
  private metrics: AgentMetrics = {
    executionTime: 0,
    tokensUsed: 0,
    apiCallsCount: 0,
    cacheHitRate: 0,
    errors: []
  }
  private advancedProcessor: AdvancedSearchProcessor

  constructor(
    context: any,
    private searchService: SerperSearchService,
    private llm: BaseChatModel,
    private db: any
  ) {
    super(context)
    this.logger = new LocalLogger()
    this.advancedProcessor = new AdvancedSearchProcessor(llm)
  }

  getAgentName(): 'researcher' {
    return 'researcher'
  }

  /**
   * Execute research with enhanced analysis
   */
  async execute(input: ResearcherInput): Promise<AgentExecutionResult> {
    const startTime = Date.now()
    const messages: AgentMessage[] = []

    try {
      // 開始メッセージ
      messages.push(this.createMessage(`リサーチを開始します: ${input.theme}`, {
        phase: 'start',
        theme: input.theme
      }))

      // 1. 検索クエリ生成（改良版）
      messages.push(this.createMessage('検索クエリを生成中...', { phase: 'query_generation' }))
      const queries = await this.generateEnhancedSearchQueries(input.theme)
      messages.push(this.createMessage(
        `検索クエリを生成しました（日本: ${queries.japanese.length}件、海外: ${queries.global.length}件）`,
        { phase: 'queries_generated', queries }
      ))

      // 2. Web検索実行
      messages.push(this.createMessage('Web検索を実行中...', { phase: 'searching' }))
      const searchResults = await this.executeSearches(queries)
      messages.push(this.createMessage(
        `検索完了（日本: ${searchResults.japanese.length}件、海外: ${searchResults.global.length}件）`,
        { phase: 'search_complete', resultCount: searchResults.totalResults }
      ))

      // 3. 深い分析の実行
      messages.push(this.createMessage('検索結果を詳細分析中...', { phase: 'deep_analysis' }))
      const detailedInsights = await this.performDeepAnalysis(searchResults, input.theme)
      messages.push(this.createMessage(
        `詳細分析完了（${detailedInsights.totalInsights}件の洞察を抽出）`,
        { phase: 'analysis_complete', insightCount: detailedInsights.totalInsights }
      ))

      // 4. 重要な記事の詳細取得（オプション）
      if (detailedInsights.topSources.length > 0) {
        messages.push(this.createMessage('重要記事の詳細情報を取得中...', { phase: 'fetching_details' }))
        await this.fetchDetailedContent(detailedInsights.topSources, input.theme)
      }

      // 5. 統合された研究サマリーの生成
      messages.push(this.createMessage('統合レポートを生成中...', { phase: 'summarizing' }))
      const summary = await this.generateEnhancedSummary(detailedInsights, input.theme)
      messages.push(this.createMessage(
        'リサーチが完了しました',
        { 
          phase: 'complete',
          executionTime: Date.now() - startTime,
          tokensUsed: this.metrics.tokensUsed
        }
      ))

      // メトリクスの更新
      this.metrics.executionTime = Date.now() - startTime

      // 実行ログの記録
      await this.logExecution(input, summary)

      return {
        success: true,
        data: {
          research: summary,
          metrics: this.metrics
        } as ResearcherOutput,
        messages
      }

    } catch (error) {
      console.error('Research execution error:', error)
      
      this.metrics.errors.push({
        timestamp: new Date(),
        type: error instanceof Error ? error.constructor.name : 'UnknownError',
        message: error instanceof Error ? error.message : 'Unknown error',
        retryable: false
      })

      messages.push(this.createMessage(
        `エラーが発生しました: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { phase: 'error', error }
      ))

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        messages
      }
    }
  }

  /**
   * Generate enhanced search queries with better coverage
   */
  private async generateEnhancedSearchQueries(theme: string): Promise<SearchQuerySet> {
    const systemPrompt = `あなたは市場調査のエキスパートです。与えられたテーマについて、包括的な情報収集のための検索クエリを生成してください。

重要なポイント：
1. 具体的で検索しやすいクエリにする
2. 異なる観点から情報を収集できるようにする
3. 最新の情報と信頼できる情報源を優先する
4. 数値データや統計情報を含むクエリを含める
5. 実践的な事例や成功事例を探すクエリを含める

日本市場向けクエリ（5つ）:
- 市場規模、成長率、予測
- 主要企業、シェア、競合分析
- 技術動向、イノベーション
- 規制、政策、業界団体
- 顧客ニーズ、課題、利用事例

海外市場向けクエリ（3つ）:
- ユニコーン企業、革新的スタートアップ
- 最先端技術、破壊的イノベーション
- ベストプラクティス、成功事例`

    const userPrompt = `テーマ: ${theme}

このテーマについて、日本市場向け5つ、海外市場向け3つの効果的な検索クエリを生成してください。

出力形式:
{
  "japanese": [
    {"query": "検索クエリ", "purpose": "market_size|competitors|trends|regulations|needs", "focus": "具体的な焦点"},
    ...
  ],
  "global": [
    {"query": "英語の検索クエリ", "purpose": "startups|technology|best_practices", "focus": "具体的な焦点"},
    ...
  ]
}`

    try {
      const response = await this.llm.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(userPrompt)
      ])

      this.metrics.apiCallsCount++
      this.metrics.tokensUsed += response.usage_metadata?.total_tokens || 0

      const parsed = JSON.parse(response.content.toString())
      
      // SearchQuery形式に変換
      const queries: SearchQuerySet = {
        japanese: parsed.japanese.map((q: any, i: number) => ({
          query: q.query,
          purpose: q.purpose,
          region: 'jp',
          options: {
            gl: 'jp',
            hl: 'ja',
            num: 15 // より多くの結果を取得
          }
        })),
        global: parsed.global.map((q: any, i: number) => ({
          query: q.query,
          purpose: q.purpose,
          region: 'global',
          options: {
            gl: 'us',
            hl: 'en',
            num: 15
          }
        })),
        generatedAt: new Date()
      }

      return queries

    } catch (error) {
      console.error('Query generation error:', error)
      // フォールバック
      return this.generateFallbackQueries(theme)
    }
  }

  /**
   * Perform deep analysis on search results
   */
  private async performDeepAnalysis(
    results: SearchResults,
    theme: string
  ): Promise<any> {
    // 日本市場の詳細分析
    const japaneseInsights = await this.advancedProcessor.extractDetailedInsights(
      results.japanese,
      theme
    )

    // 海外市場の詳細分析
    const globalInsights = await this.advancedProcessor.extractDetailedInsights(
      results.global,
      theme
    )

    // 洞察の統合
    const consolidatedInsights = await this.advancedProcessor.consolidateInsights(
      [...japaneseInsights, ...globalInsights],
      theme
    )

    // 海外事例の適用可能性分析
    const applicability = await this.advancedProcessor.analyzeGlobalApplicability(
      globalInsights,
      theme
    )

    // 重要度の高いソースを特定
    const topSources = this.identifyTopSources(japaneseInsights, globalInsights)

    return {
      japaneseInsights,
      globalInsights,
      consolidatedInsights,
      applicability,
      topSources,
      totalInsights: japaneseInsights.length + globalInsights.length
    }
  }

  /**
   * Fetch detailed content from important sources
   */
  private async fetchDetailedContent(sources: string[], theme: string): Promise<void> {
    // WebFetchツールは使用できないため、スキップ
    // 将来的にWebFetchが利用可能になった場合は実装
    console.log('Detailed content fetching would be performed here for:', sources)
  }

  /**
   * Generate enhanced summary with deep insights
   */
  private async generateEnhancedSummary(
    analysis: any,
    theme: string
  ): Promise<ResearchSummary> {
    const systemPrompt = `あなたは市場調査レポートの専門家です。詳細な分析結果を基に、実用的で洞察に富んだエグゼクティブサマリーを作成してください。

レポートには以下を含めてください：
1. エグゼクティブサマリー（3-5文）
2. 市場の現状と将来性
3. 主要なプレーヤーと競争環境
4. 技術トレンドとイノベーション
5. ビジネスチャンスとリスク
6. 具体的な推奨アクション（3-5項目）

重要：
- 具体的な数値や企業名を必ず含める
- 日本市場の特性を考慮する
- 実行可能な推奨事項を提供する`

    const userPrompt = `テーマ: ${theme}

分析結果:
${JSON.stringify(analysis.consolidatedInsights, null, 2)}

海外事例の適用可能性:
${JSON.stringify(analysis.applicability, null, 2)}

このデータを基に、包括的な市場調査サマリーを作成してください。`

    try {
      const response = await this.llm.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(userPrompt)
      ])

      this.metrics.apiCallsCount++
      this.metrics.tokensUsed += response.usage_metadata?.total_tokens || 0

      const summary = response.content.toString()
      
      // キーファインディングスと推奨事項の抽出
      const keyFindings = this.extractKeyFindings(summary, analysis)
      const recommendations = this.extractRecommendations(summary, analysis)

      // 構造化されたソースリスト
      const sources = {
        japanese: [...new Set(analysis.japaneseInsights.map((i: any) => i.source))].slice(0, 15),
        global: [...new Set(analysis.globalInsights.map((i: any) => i.source))].slice(0, 15)
      }

      return {
        theme,
        queries: { japanese: [], global: [], generatedAt: new Date() }, // 簡略化
        rawResults: { japanese: [], global: [], searchTime: 0, totalResults: 0 }, // 簡略化
        insights: analysis.consolidatedInsights.marketInsights,
        globalInsights: analysis.consolidatedInsights.technologyInsights,
        sources,
        summary,
        keyFindings,
        recommendations,
        generatedAt: new Date()
      }

    } catch (error) {
      console.error('Summary generation error:', error)
      throw error
    }
  }

  /**
   * Extract key findings from summary
   */
  private extractKeyFindings(summary: string, analysis: any): string[] {
    const findings: string[] = []

    // 市場規模に関する発見
    if (analysis.consolidatedInsights.marketInsights.size !== '情報なし') {
      findings.push(`市場規模: ${analysis.consolidatedInsights.marketInsights.size}`)
    }

    // 主要プレーヤー
    if (analysis.consolidatedInsights.competitorInsights.topPlayers.length > 0) {
      findings.push(`主要プレーヤー: ${analysis.consolidatedInsights.competitorInsights.topPlayers.slice(0, 3).join(', ')}`)
    }

    // 重要トレンド
    if (analysis.consolidatedInsights.trendInsights.current.length > 0) {
      findings.push(`主要トレンド: ${analysis.consolidatedInsights.trendInsights.current[0]}`)
    }

    // 新興技術
    if (analysis.consolidatedInsights.technologyInsights.emerging.length > 0) {
      findings.push(`注目技術: ${analysis.consolidatedInsights.technologyInsights.emerging.slice(0, 2).join(', ')}`)
    }

    // 顧客ニーズ
    if (analysis.consolidatedInsights.customerInsights.needs.length > 0) {
      findings.push(`主要ニーズ: ${analysis.consolidatedInsights.customerInsights.needs[0]}`)
    }

    return findings
  }

  /**
   * Extract recommendations from summary
   */
  private extractRecommendations(summary: string, analysis: any): string[] {
    const recommendations: string[] = []

    // 市場参入の推奨
    if (analysis.consolidatedInsights.marketInsights.growth !== '情報なし') {
      recommendations.push(`成長市場への早期参入を検討（${analysis.consolidatedInsights.marketInsights.growth}）`)
    }

    // 技術導入の推奨
    if (analysis.consolidatedInsights.technologyInsights.emerging.length > 0) {
      recommendations.push(`${analysis.consolidatedInsights.technologyInsights.emerging[0]}の導入を検討`)
    }

    // 顧客ニーズへの対応
    if (analysis.consolidatedInsights.customerInsights.painPoints.length > 0) {
      recommendations.push(`顧客の課題「${analysis.consolidatedInsights.customerInsights.painPoints[0]}」に対するソリューション開発`)
    }

    // 海外事例の適用
    if (analysis.applicability.opportunities.length > 0) {
      recommendations.push(analysis.applicability.opportunities[0])
    }

    // パートナーシップ
    if (analysis.consolidatedInsights.competitorInsights.topPlayers.length > 0) {
      recommendations.push(`業界リーダーとの戦略的パートナーシップを検討`)
    }

    return recommendations.slice(0, 5)
  }

  /**
   * Identify top sources for detailed analysis
   */
  private identifyTopSources(japaneseInsights: any[], globalInsights: any[]): string[] {
    const allInsights = [...japaneseInsights, ...globalInsights]
    
    // 信頼度と関連性でソート
    const sorted = allInsights.sort((a, b) => 
      (b.confidence * b.relevance) - (a.confidence * a.relevance)
    )

    // 上位5つのユニークなソースを選択
    const sources = new Set<string>()
    for (const insight of sorted) {
      sources.add(insight.source)
      if (sources.size >= 5) break
    }

    return Array.from(sources)
  }

  /**
   * Fallback query generation
   */
  private generateFallbackQueries(theme: string): SearchQuerySet {
    return {
      japanese: [
        {
          query: `${theme} 市場規模 成長率 予測`,
          purpose: 'market_size',
          region: 'jp',
          options: { gl: 'jp', hl: 'ja', num: 15 }
        },
        {
          query: `${theme} 企業 シェア ランキング`,
          purpose: 'competitors',
          region: 'jp',
          options: { gl: 'jp', hl: 'ja', num: 15 }
        },
        {
          query: `${theme} 最新技術 トレンド 2024 2025`,
          purpose: 'trends',
          region: 'jp',
          options: { gl: 'jp', hl: 'ja', num: 15 }
        },
        {
          query: `${theme} 規制 法律 ガイドライン`,
          purpose: 'regulations',
          region: 'jp',
          options: { gl: 'jp', hl: 'ja', num: 15 }
        },
        {
          query: `${theme} 課題 ニーズ 顧客`,
          purpose: 'needs',
          region: 'jp',
          options: { gl: 'jp', hl: 'ja', num: 15 }
        }
      ],
      global: [
        {
          query: `${theme} unicorn startups innovation`,
          purpose: 'startups',
          region: 'global',
          options: { gl: 'us', hl: 'en', num: 15 }
        },
        {
          query: `${theme} cutting edge technology implementation`,
          purpose: 'technology',
          region: 'global',
          options: { gl: 'us', hl: 'en', num: 15 }
        },
        {
          query: `${theme} best practices case studies success`,
          purpose: 'best_practices',
          region: 'global',
          options: { gl: 'us', hl: 'en', num: 15 }
        }
      ],
      generatedAt: new Date()
    }
  }

  /**
   * Execute searches (reuse existing method)
   */
  private async executeSearches(queries: SearchQuerySet): Promise<SearchResults> {
    // 既存の実装を再利用
    const searchPromises = [...queries.japanese, ...queries.global].map(
      query => this.searchService.search({
        query: query.query,
        ...query.options
      }).catch(error => {
        console.error(`Search error for query "${query.query}":`, error)
        return { searchResults: [], totalResults: 0, searchTime: 0, cached: false }
      })
    )

    const results = await Promise.all(searchPromises)
    
    const japaneseResults = results
      .slice(0, queries.japanese.length)
      .flatMap(r => r.searchResults)
    
    const globalResults = results
      .slice(queries.japanese.length)
      .flatMap(r => r.searchResults)

    return {
      japanese: japaneseResults,
      global: globalResults,
      searchTime: results.reduce((sum, r) => sum + r.searchTime, 0),
      totalResults: japaneseResults.length + globalResults.length
    }
  }

  /**
   * Create agent message
   */
  private createMessage(message: string, data?: any): AgentMessage {
    return {
      agent: 'researcher',
      message,
      timestamp: new Date().toISOString(),
      data
    }
  }

  /**
   * Log execution
   */
  private async logExecution(input: ResearcherInput, summary: ResearchSummary): Promise<void> {
    try {
      await this.logger.log({
        sessionId: input.sessionId,
        agentName: this.getAgentName(),
        message: 'Enhanced research completed',
        data: {
          executionId: crypto.randomUUID(),
          theme: input.theme,
          summary: summary.summary,
          keyFindings: summary.keyFindings,
          recommendations: summary.recommendations,
          metrics: this.metrics
        }
      })
    } catch (error) {
      console.error('Failed to log execution:', error)
    }
  }
}