/**
 * Advanced Search Result Processor with LLM Analysis
 * 検索結果から深い洞察を抽出する高度な処理エンジン
 */

import { WebSearchResult } from '@/lib/types'
import { 
  KeyInsight, 
  CategorizedResults, 
  ApplicabilityAnalysis,
  DetailedInsight,
  ConsolidatedInsights
} from '@/lib/types/agents'
import { BaseChatModel } from '@langchain/core/language_models/chat'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'

// 拡張された洞察タイプ
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
 * Advanced processor for search results using LLM analysis
 */
export class AdvancedSearchProcessor {
  constructor(private llm: BaseChatModel) {}

  /**
   * Extract detailed insights from search results using LLM
   */
  async extractDetailedInsights(
    results: WebSearchResult[],
    theme: string
  ): Promise<DetailedInsight[]> {
    const insights: DetailedInsight[] = []
    
    // バッチ処理で効率化（5件ずつ）
    const batchSize = 5
    for (let i = 0; i < results.length; i += batchSize) {
      const batch = results.slice(i, i + batchSize)
      const batchInsights = await Promise.all(
        batch.map(result => this.analyzeSearchResult(result, theme))
      )
      insights.push(...batchInsights.flat())
    }

    // 重複除去と関連性でソート
    return this.deduplicateAndSort(insights)
  }

  /**
   * Analyze a single search result with LLM
   */
  private async analyzeSearchResult(
    result: WebSearchResult,
    theme: string
  ): Promise<DetailedInsight[]> {
    const systemPrompt = `あなたは市場調査の専門家です。検索結果から具体的で価値のある洞察を抽出してください。

分析の観点:
1. 数値データ（市場規模、成長率、シェア等）
2. 企業名・サービス名・技術名
3. トレンドや変化の兆候
4. 課題やニーズ
5. 規制や政策情報

重要: 
- 具体的な数値や固有名詞を必ず含める
- 曖昧な表現は避ける
- 元の情報以上の推測はしない`

    const userPrompt = `テーマ: ${theme}

検索結果:
タイトル: ${result.title}
内容: ${result.snippet}
URL: ${result.link}

この検索結果から抽出できる具体的な洞察を、以下のJSON形式で提供してください:
{
  "insights": [
    {
      "type": "market|competitor|trend|regulation|need|innovation|technology",
      "content": "具体的な洞察内容",
      "confidence": 0.0-1.0,
      "entities": ["企業名", "技術名", "サービス名など"],
      "metrics": [
        {
          "value": 数値,
          "unit": "単位",
          "context": "文脈"
        }
      ]
    }
  ]
}`

    try {
      const response = await this.llm.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(userPrompt)
      ])

      const content = response.content.toString()
      // Remove markdown code blocks if present
      const jsonContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const parsed = JSON.parse(jsonContent)
      
      return parsed.insights.map((insight: any) => ({
        ...insight,
        source: result.link,
        relevance: this.calculateRelevance(insight, result, theme),
        rawData: result.snippet
      }))

    } catch (error) {
      console.error('Failed to analyze search result:', error)
      // フォールバック: 基本的な抽出
      return this.basicExtraction(result)
    }
  }

  /**
   * Calculate relevance score
   */
  private calculateRelevance(
    insight: any,
    result: WebSearchResult,
    theme: string
  ): number {
    let score = 0.5

    // 信頼度スコアを考慮
    score += insight.confidence * 0.2

    // エンティティの数
    if (insight.entities?.length > 0) {
      score += Math.min(insight.entities.length * 0.1, 0.2)
    }

    // 数値データの存在
    if (insight.metrics?.length > 0) {
      score += 0.2
    }

    // 検索結果の順位
    if (result.position !== undefined) {
      score += (10 - Math.min(result.position, 10)) * 0.01
    }

    return Math.min(score, 1.0)
  }

  /**
   * Basic extraction fallback
   */
  private basicExtraction(result: WebSearchResult): DetailedInsight[] {
    const insights: DetailedInsight[] = []
    const snippet = result.snippet.toLowerCase()

    // 市場規模の抽出
    const marketSizeMatch = snippet.match(/(\d+[\d,\.]*)\s*(億|兆|million|billion)/i)
    if (marketSizeMatch) {
      insights.push({
        type: 'market',
        content: `市場規模: ${marketSizeMatch[0]}`,
        source: result.link,
        relevance: 0.7,
        confidence: 0.8,
        entities: [],
        metrics: [{
          value: parseFloat(marketSizeMatch[1].replace(/,/g, '')),
          unit: marketSizeMatch[2],
          context: '市場規模'
        }]
      })
    }

    // 企業名の抽出（簡易版）
    const companyPatterns = [
      /(\w+(?:株式会社|Inc\.|Corp\.|Ltd\.|Co\.))/g,
      /(Google|Amazon|Microsoft|Apple|Meta|Tesla|OpenAI)/gi
    ]
    
    const companies = new Set<string>()
    companyPatterns.forEach(pattern => {
      const matches = snippet.match(pattern)
      if (matches) {
        matches.forEach(match => companies.add(match))
      }
    })

    if (companies.size > 0) {
      insights.push({
        type: 'competitor',
        content: `関連企業: ${Array.from(companies).join(', ')}`,
        source: result.link,
        relevance: 0.6,
        confidence: 0.7,
        entities: Array.from(companies)
      })
    }

    return insights
  }

  /**
   * Consolidate insights into structured format
   */
  async consolidateInsights(
    insights: DetailedInsight[],
    theme: string
  ): Promise<ConsolidatedInsights> {
    const systemPrompt = `あなたは市場調査レポートの専門家です。個別の洞察を統合して、包括的な市場理解を構築してください。

重要なポイント:
1. 具体的な数値やデータを保持する
2. 矛盾する情報は両方提示する
3. 情報源の信頼性を考慮する
4. 論理的な構造で整理する`

    const insightsByType = {
      market: insights.filter(i => i.type === 'market'),
      competitor: insights.filter(i => i.type === 'competitor'),
      trend: insights.filter(i => i.type === 'trend'),
      need: insights.filter(i => i.type === 'need'),
      technology: insights.filter(i => i.type === 'innovation' || i.type === 'technology')
    }

    const userPrompt = `テーマ: ${theme}

収集された洞察:
${JSON.stringify(insightsByType, null, 2)}

これらの洞察を統合して、以下の形式で構造化された分析を提供してください:
{
  "marketInsights": {
    "size": "具体的な市場規模",
    "growth": "成長率や成長性",
    "segments": ["セグメント1", "セグメント2"],
    "keyMetrics": [
      {"label": "指標名", "value": "値"}
    ]
  },
  "competitorInsights": {
    "topPlayers": ["企業1", "企業2"],
    "marketShares": [
      {"company": "企業名", "share": "シェア"}
    ],
    "strategies": ["戦略1", "戦略2"]
  },
  "trendInsights": {
    "current": ["現在のトレンド"],
    "emerging": ["新興トレンド"],
    "declining": ["衰退トレンド"]
  },
  "customerInsights": {
    "needs": ["ニーズ1"],
    "painPoints": ["課題1"],
    "behaviors": ["行動パターン1"]
  },
  "technologyInsights": {
    "current": ["現在の技術"],
    "emerging": ["新興技術"],
    "disruptive": ["破壊的技術"]
  }
}`

    try {
      const response = await this.llm.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(userPrompt)
      ])

      const content = response.content.toString()
      // Remove markdown code blocks if present
      const jsonContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      return JSON.parse(jsonContent)

    } catch (error) {
      console.error('Failed to consolidate insights:', error)
      // フォールバック: 基本的な統合
      return this.basicConsolidation(insightsByType)
    }
  }

  /**
   * Basic consolidation fallback
   */
  private basicConsolidation(insightsByType: any): ConsolidatedInsights {
    const extractContents = (insights: DetailedInsight[]) => 
      insights.map(i => i.content).slice(0, 5)

    const extractEntities = (insights: DetailedInsight[]) => {
      const entities = new Set<string>()
      insights.forEach(i => i.entities?.forEach(e => entities.add(e)))
      return Array.from(entities).slice(0, 10)
    }

    return {
      marketInsights: {
        size: insightsByType.market[0]?.content || '情報なし',
        growth: '情報なし',
        segments: [],
        keyMetrics: insightsByType.market
          .filter(i => i.metrics && i.metrics.length > 0)
          .flatMap(i => i.metrics!.map(m => ({
            label: m.context,
            value: `${m.value} ${m.unit}`
          })))
          .slice(0, 5)
      },
      competitorInsights: {
        topPlayers: extractEntities(insightsByType.competitor),
        marketShares: [],
        strategies: []
      },
      trendInsights: {
        current: extractContents(insightsByType.trend),
        emerging: [],
        declining: []
      },
      customerInsights: {
        needs: extractContents(insightsByType.need),
        painPoints: [],
        behaviors: []
      },
      technologyInsights: {
        current: extractContents(insightsByType.technology),
        emerging: [],
        disruptive: []
      }
    }
  }

  /**
   * Analyze applicability of global insights to Japanese market
   */
  async analyzeGlobalApplicability(
    globalInsights: DetailedInsight[],
    theme: string
  ): Promise<ApplicabilityAnalysis> {
    const systemPrompt = `あなたは日本市場の専門家です。海外の先進事例が日本市場にどのように適用可能か分析してください。

分析の観点:
1. 文化的適合性
2. 規制・法律の違い
3. 市場構造の違い
4. 技術的実現可能性
5. 競争環境の違い`

    const userPrompt = `テーマ: ${theme}

海外の先進事例:
${globalInsights.map(i => `- ${i.content}`).join('\n')}

これらの事例の日本市場への適用可能性を分析してください。`

    try {
      const response = await this.llm.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(userPrompt)
      ])

      const content = response.content.toString()
      
      // 構造化された分析を抽出
      return this.parseApplicabilityAnalysis(content)

    } catch (error) {
      console.error('Failed to analyze applicability:', error)
      return {
        applicable: true,
        reasoning: '海外事例の日本市場への適用可能性があります',
        adaptations: [],
        challenges: [],
        opportunities: []
      }
    }
  }

  /**
   * Parse applicability analysis from LLM response
   */
  private parseApplicabilityAnalysis(content: string): ApplicabilityAnalysis {
    // シンプルなパーサー実装
    const lines = content.split('\n')
    const analysis: ApplicabilityAnalysis = {
      applicable: true,
      reasoning: '',
      adaptations: [],
      challenges: [],
      opportunities: []
    }

    let currentSection = ''
    for (const line of lines) {
      if (line.includes('適用可能性') || line.includes('結論')) {
        analysis.reasoning = line
        analysis.applicable = !line.includes('困難') && !line.includes('不可能')
      } else if (line.includes('必要な適応') || line.includes('調整')) {
        currentSection = 'adaptations'
      } else if (line.includes('課題') || line.includes('障壁')) {
        currentSection = 'challenges'
      } else if (line.includes('機会') || line.includes('チャンス')) {
        currentSection = 'opportunities'
      } else if (line.trim().startsWith('-') || line.trim().startsWith('・')) {
        const item = line.trim().substring(1).trim()
        if (currentSection && item) {
          analysis[currentSection as keyof typeof analysis].push(item)
        }
      }
    }

    return analysis
  }

  /**
   * Deduplicate and sort insights by relevance
   */
  private deduplicateAndSort(insights: DetailedInsight[]): DetailedInsight[] {
    // 類似度によるグループ化
    const groups: DetailedInsight[][] = []
    
    for (const insight of insights) {
      let added = false
      for (const group of groups) {
        if (this.isSimilar(insight, group[0])) {
          group.push(insight)
          added = true
          break
        }
      }
      if (!added) {
        groups.push([insight])
      }
    }

    // 各グループから最も関連性の高いものを選択
    const deduplicated = groups.map(group => 
      group.reduce((best, current) => 
        current.relevance > best.relevance ? current : best
      )
    )

    // 関連性でソート
    return deduplicated.sort((a, b) => b.relevance - a.relevance)
  }

  /**
   * Check if two insights are similar
   */
  private isSimilar(a: DetailedInsight, b: DetailedInsight): boolean {
    if (a.type !== b.type) return false
    
    // エンティティの重複をチェック
    const aEntities = new Set(a.entities || [])
    const bEntities = new Set(b.entities || [])
    const intersection = Array.from(aEntities).filter(e => bEntities.has(e))
    
    if (intersection.length > 0) return true
    
    // コンテンツの類似度（簡易版）
    const aWords = a.content.split(/\s+/)
    const bWords = b.content.split(/\s+/)
    const commonWords = aWords.filter(w => bWords.includes(w))
    
    return commonWords.length / Math.min(aWords.length, bWords.length) > 0.6
  }
}