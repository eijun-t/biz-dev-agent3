/**
 * Production-ready Broad Researcher Agent
 * 本番環境用の最適化されたリサーチャーエージェント
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
import { SearchResultProcessor } from './search-result-processor'
import { BaseChatModel } from '@langchain/core/language_models/chat'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { EdgeLogger } from './edge-logger'
import { EnhancedOutputGenerator } from './enhanced-output-generator'

/**
 * Production Researcher Agent - Balanced between depth and performance
 */
export class ProductionResearcherAgent extends BaseAgent {
  private logger: EdgeLogger
  private resultProcessor: SearchResultProcessor
  private metrics: AgentMetrics = {
    executionTime: 0,
    tokensUsed: 0,
    apiCallsCount: 0,
    cacheHitRate: 0,
    errors: []
  }

  constructor(
    context: any,
    private searchService: SerperSearchService,
    private llm: BaseChatModel,
    private db: any
  ) {
    super(context)
    this.logger = new EdgeLogger()
    this.resultProcessor = new SearchResultProcessor()
  }

  getAgentName(): 'researcher' {
    return 'researcher'
  }

  /**
   * Execute research with optimized flow
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

      // 1. 検索クエリ生成（最適化版）
      messages.push(this.createMessage('検索クエリを生成中...', { phase: 'query_generation' }))
      const queries = await this.generateOptimizedQueries(input.theme)
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

      // 3. 構造化分析（LLMを効率的に使用）
      messages.push(this.createMessage('検索結果を分析中...', { phase: 'analyzing' }))
      const processed = await this.analyzeResults(searchResults, queries, input.theme)
      messages.push(this.createMessage('分析が完了しました', { phase: 'analysis_complete' }))

      // 4. 高度な要約生成
      messages.push(this.createMessage('要約を生成中...', { phase: 'summarizing' }))
      const summary = await this.generateAdvancedSummary(processed)
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
   * Generate optimized search queries
   */
  private async generateOptimizedQueries(theme: string): Promise<SearchQuerySet> {
    const systemPrompt = `あなたは市場調査の専門家です。効果的な検索クエリを生成してください。

日本市場向け（5つ）:
1. 市場規模・統計データ
2. 主要企業・競合分析
3. 最新動向・技術トレンド
4. 規制・政策動向
5. 顧客ニーズ・課題

海外市場向け（3つ）:
1. 革新的企業・ユニコーン
2. 最先端技術・実装事例
3. ベストプラクティス

具体的で検索しやすいクエリを作成してください。`

    const userPrompt = `テーマ: ${theme}

以下の形式でクエリを生成してください：
{
  "japanese": [
    {"query": "具体的な検索クエリ", "purpose": "market_size|competitors|trends|regulations|needs"},
    ...5つ
  ],
  "global": [
    {"query": "English search query", "purpose": "startups|technology|best_practices"},
    ...3つ
  ]
}`

    try {
      const response = await this.llm.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(userPrompt)
      ])

      this.metrics.apiCallsCount++
      this.metrics.tokensUsed += response.usage_metadata?.total_tokens || 0

      const content = response.content.toString()
      const jsonContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const parsed = JSON.parse(jsonContent)
      
      return {
        japanese: parsed.japanese.map((q: any) => ({
          query: q.query,
          purpose: q.purpose,
          region: 'jp',
          options: { gl: 'jp', hl: 'ja', num: 10 }
        })),
        global: parsed.global.map((q: any) => ({
          query: q.query,
          purpose: q.purpose,
          region: 'global',
          options: { gl: 'us', hl: 'en', num: 10 }
        })),
        generatedAt: new Date()
      }

    } catch (error) {
      console.error('Query generation error:', error)
      return this.generateFallbackQueries(theme)
    }
  }

  /**
   * Analyze results with structured approach
   */
  private async analyzeResults(
    results: SearchResults,
    queries: SearchQuerySet,
    theme: string
  ): Promise<ProcessedResearch> {
    // まず基本的な処理
    const insights = this.resultProcessor.extractKeyInsights([...results.japanese, ...results.global])
    
    // カテゴリ別に整理
    const categorized = {
      market: insights.filter(i => i.type === 'market').slice(0, 3),
      competitor: insights.filter(i => i.type === 'competitor').slice(0, 5),
      trend: insights.filter(i => i.type === 'trend').slice(0, 5),
      regulation: insights.filter(i => i.type === 'regulation').slice(0, 3),
      need: insights.filter(i => i.type === 'need').slice(0, 5),
      innovation: insights.filter(i => i.type === 'innovation').slice(0, 3)
    }

    // LLMで深い分析（1回のみ）
    const deepInsights = await this.performDeepAnalysis(categorized, theme)

    // ソースの整理
    const sources = {
      japanese: [...new Set(results.japanese.map(r => r.link))].slice(0, 10),
      global: [...new Set(results.global.map(r => r.link))].slice(0, 10)
    }

    // 基本的な ProcessedResearch を作成
    const processedResearch: ProcessedResearch = {
      theme,
      queries,
      rawResults: results,
      insights: deepInsights.insights,
      globalInsights: deepInsights.globalInsights,
      sources,
      detailedAnalysis: deepInsights.detailedAnalysis
    }

    // EnhancedOutputGeneratorで拡張データを生成
    const enrichedOutput = EnhancedOutputGenerator.generateEnrichedOutput(
      processedResearch,
      results
    )

    // enrichedDataを含むProcessedResearchを返す
    return {
      ...processedResearch,
      ...enrichedOutput
    } as ProcessedResearch
  }

  /**
   * Perform deep analysis with enhanced output
   */
  private async performDeepAnalysis(categorized: any, theme: string): Promise<any> {
    const systemPrompt = `あなたは市場調査の専門家です。収集された情報から詳細かつ実用的な分析を提供してください。

重要なポイント：
1. 具体的な数値、企業名、技術名を必ず含める
2. 実行可能な洞察と戦略を提供
3. 日本市場の特性を考慮
4. 海外事例の適用可能性を評価
5. ビジネス機会とリスクを網羅的に分析`

    const userPrompt = `テーマ: ${theme}

収集された情報:
${JSON.stringify(categorized, null, 2)}

以下の形式で詳細な分析を提供してください：
{
  "insights": {
    "marketSize": "具体的な市場規模と成長性",
    "competitors": ["主要企業1", "主要企業2", ...],
    "trends": ["トレンド1", "トレンド2", ...],
    "regulations": ["規制1", "規制2", ...],
    "customerNeeds": ["ニーズ1", "ニーズ2", ...]
  },
  "globalInsights": {
    "innovations": ["イノベーション1", ...],
    "technologies": ["技術1", ...],
    "bestPractices": ["ベストプラクティス1", ...],
    "applicability": "日本市場への適用可能性の分析"
  },
  "detailedAnalysis": {
    "marketAnalysis": {
      "currentSize": "現在の市場規模（数値入り）",
      "growthRate": "成長率（%）",
      "futureProjection": "将来予測",
      "keyDrivers": ["成長要因1", "成長要因2"],
      "challenges": ["課題1", "課題2"]
    },
    "competitiveAnalysis": {
      "topPlayers": [
        {
          "name": "企業名",
          "marketShare": "市場シェア",
          "strengths": ["強み1"],
          "weaknesses": ["弱み1"]
        }
      ],
      "competitiveDynamics": "競争環境の分析",
      "entryBarriers": ["参入障壁1"]
    },
    "opportunityAnalysis": {
      "untappedSegments": ["未開拓セグメント1"],
      "emergingNeeds": ["新たなニーズ1"],
      "technologicalOpportunities": ["技術的機会1"],
      "strategicPartnerships": ["パートナーシップ機会1"]
    },
    "riskAnalysis": {
      "marketRisks": ["市場リスク1"],
      "regulatoryRisks": ["規制リスク1"],
      "technologicalRisks": ["技術リスク1"],
      "competitiveRisks": ["競争リスク1"]
    }
  }
}`

    try {
      const response = await this.llm.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(userPrompt)
      ])

      this.metrics.apiCallsCount++
      this.metrics.tokensUsed += response.usage_metadata?.total_tokens || 0

      const content = response.content.toString()
      const jsonContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      return JSON.parse(jsonContent)

    } catch (error) {
      console.error('Deep analysis error:', error)
      // フォールバック
      return {
        insights: {
          marketSize: categorized.market[0]?.content || '情報なし',
          competitors: categorized.competitor.map((i: any) => i.content).slice(0, 3),
          trends: categorized.trend.map((i: any) => i.content).slice(0, 3),
          regulations: categorized.regulation.map((i: any) => i.content).slice(0, 2),
          customerNeeds: categorized.need.map((i: any) => i.content).slice(0, 3)
        },
        globalInsights: {
          innovations: categorized.innovation.map((i: any) => i.content).slice(0, 2),
          technologies: [],
          bestPractices: [],
          applicability: '海外事例の日本市場への適用可能性があります'
        }
      }
    }
  }

  /**
   * Generate advanced summary
   */
  private async generateAdvancedSummary(processed: ProcessedResearch): Promise<ResearchSummary> {
    const systemPrompt = `あなたは市場調査レポートの専門家です。実用的なエグゼクティブサマリーを作成してください。

構成:
1. 市場概況（2-3文）
2. 主要な発見事項（3-5点）
3. ビジネス機会
4. 推奨アクション（3-5点）

トーンは専門的かつ簡潔に。具体的な数値や企業名を含めてください。`

    const userPrompt = `テーマ: ${processed.theme}

市場分析:
${JSON.stringify(processed.insights, null, 2)}

海外動向:
${JSON.stringify(processed.globalInsights, null, 2)}

上記のデータを基に、実用的な市場調査サマリーを作成してください。`

    try {
      const response = await this.llm.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(userPrompt)
      ])

      this.metrics.apiCallsCount++
      this.metrics.tokensUsed += response.usage_metadata?.total_tokens || 0

      const summary = response.content.toString()
      
      // 主要な発見事項を抽出
      const keyFindings = this.extractKeyFindings(summary, processed)
      
      // 推奨事項を抽出
      const recommendations = this.extractRecommendations(summary, processed)

      return {
        ...processed,
        summary,
        keyFindings,
        recommendations: recommendations.length > 0 ? recommendations : undefined,
        generatedAt: new Date()
      }

    } catch (error) {
      console.error('Summary generation error:', error)
      // フォールバック
      return {
        ...processed,
        summary: this.generateFallbackSummary(processed),
        keyFindings: ['市場調査を完了しました'],
        generatedAt: new Date()
      }
    }
  }

  /**
   * Extract key findings
   */
  private extractKeyFindings(summary: string, processed: ProcessedResearch): string[] {
    const findings: string[] = []
    
    // summaryから箇条書きを抽出
    const bulletPoints = summary.match(/[・•]\s*(.+)/g) || []
    findings.push(...bulletPoints.map(bp => bp.replace(/[・•]\s*/, '').trim()).slice(0, 3))
    
    // processedデータから追加
    if (processed.insights.marketSize && processed.insights.marketSize !== '情報なし') {
      findings.push(`市場規模: ${processed.insights.marketSize}`)
    }
    
    if (processed.insights.competitors && processed.insights.competitors.length > 0) {
      findings.push(`主要企業: ${processed.insights.competitors.slice(0, 3).join(', ')}`)
    }
    
    return findings.slice(0, 5)
  }

  /**
   * Extract recommendations
   */
  private extractRecommendations(summary: string, processed: ProcessedResearch): string[] {
    const recommendations: string[] = []
    
    // summaryから推奨事項を抽出
    const recPattern = /推奨|提案|べき|することが重要/g
    const sentences = summary.split(/[。\n]/)
    
    sentences.forEach(sentence => {
      if (recPattern.test(sentence) && sentence.length > 20) {
        recommendations.push(sentence.trim())
      }
    })
    
    // processedデータから生成
    if (processed.globalInsights.innovations && processed.globalInsights.innovations.length > 0) {
      recommendations.push(`${processed.globalInsights.innovations[0]}の導入を検討`)
    }
    
    if (processed.insights.customerNeeds && processed.insights.customerNeeds.length > 0) {
      recommendations.push(`顧客ニーズ「${processed.insights.customerNeeds[0]}」への対応を強化`)
    }
    
    return recommendations.slice(0, 5)
  }

  /**
   * Execute searches (existing implementation)
   */
  private async executeSearches(queries: SearchQuerySet): Promise<SearchResults> {
    const searchPromises = [...queries.japanese, ...queries.global].map(
      query => this.searchService.search({
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
   * Fallback query generation
   */
  private generateFallbackQueries(theme: string): SearchQuerySet {
    return {
      japanese: [
        { query: `${theme} 市場規模`, purpose: 'market_size', region: 'jp', options: { gl: 'jp', hl: 'ja', num: 10 } },
        { query: `${theme} 企業 ランキング`, purpose: 'competitors', region: 'jp', options: { gl: 'jp', hl: 'ja', num: 10 } },
        { query: `${theme} 最新動向 2024`, purpose: 'trends', region: 'jp', options: { gl: 'jp', hl: 'ja', num: 10 } },
        { query: `${theme} 規制 法律`, purpose: 'regulations', region: 'jp', options: { gl: 'jp', hl: 'ja', num: 10 } },
        { query: `${theme} 課題 ニーズ`, purpose: 'needs', region: 'jp', options: { gl: 'jp', hl: 'ja', num: 10 } }
      ],
      global: [
        { query: `${theme} unicorn startups`, purpose: 'startups', region: 'global', options: { gl: 'us', hl: 'en', num: 10 } },
        { query: `${theme} innovation technology`, purpose: 'technology', region: 'global', options: { gl: 'us', hl: 'en', num: 10 } },
        { query: `${theme} best practices`, purpose: 'best_practices', region: 'global', options: { gl: 'us', hl: 'en', num: 10 } }
      ],
      generatedAt: new Date()
    }
  }

  /**
   * Generate fallback summary
   */
  private generateFallbackSummary(processed: ProcessedResearch): string {
    return `### ${processed.theme}に関する市場調査

**市場概況**
${processed.insights.marketSize || '市場規模の詳細情報は収集中です。'}

**主要プレーヤー**
${processed.insights.competitors?.join(', ') || '主要企業の情報を収集中です。'}

**トレンド**
${processed.insights.trends?.join(', ') || 'トレンド情報を収集中です。'}

**推奨事項**
- さらなる詳細調査の実施
- 競合分析の深堀り
- 顧客ニーズの検証`
  }

  /**
   * Create message
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
        message: 'Research completed',
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