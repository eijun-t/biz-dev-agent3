/**
 * Search result processor for the Broad Researcher Agent
 */

import { WebSearchResult } from '@/lib/types'
import { 
  KeyInsight, 
  CategorizedResults, 
  ApplicabilityAnalysis 
} from '@/lib/types/agents'

/**
 * Processes and analyzes search results
 */
export class SearchResultProcessor {
  /**
   * Remove duplicate URLs from search results
   */
  removeDuplicates(results: WebSearchResult[]): WebSearchResult[] {
    const seenUrls = new Set<string>()
    const uniqueResults: WebSearchResult[] = []

    for (const result of results) {
      if (!seenUrls.has(result.link)) {
        seenUrls.add(result.link)
        uniqueResults.push(result)
      }
    }

    return uniqueResults
  }

  /**
   * Extract key insights from search results
   */
  extractKeyInsights(results: WebSearchResult[]): KeyInsight[] {
    const insights: KeyInsight[] = []

    for (const result of results) {
      // Extract market-related insights
      if (this.containsMarketInfo(result)) {
        insights.push({
          type: 'market',
          content: this.extractMarketInsight(result),
          source: result.link,
          relevance: this.calculateRelevance(result, 'market')
        })
      }

      // Extract competitor information
      if (this.containsCompetitorInfo(result)) {
        insights.push({
          type: 'competitor',
          content: this.extractCompetitorInsight(result),
          source: result.link,
          relevance: this.calculateRelevance(result, 'competitor')
        })
      }

      // Extract trend information
      if (this.containsTrendInfo(result)) {
        insights.push({
          type: 'trend',
          content: this.extractTrendInsight(result),
          source: result.link,
          relevance: this.calculateRelevance(result, 'trend')
        })
      }

      // Extract regulation information
      if (this.containsRegulationInfo(result)) {
        insights.push({
          type: 'regulation',
          content: this.extractRegulationInsight(result),
          source: result.link,
          relevance: this.calculateRelevance(result, 'regulation')
        })
      }

      // Extract customer needs
      if (this.containsNeedInfo(result)) {
        insights.push({
          type: 'need',
          content: this.extractNeedInsight(result),
          source: result.link,
          relevance: this.calculateRelevance(result, 'need')
        })
      }

      // Extract innovation information
      if (this.containsInnovationInfo(result)) {
        insights.push({
          type: 'innovation',
          content: this.extractInnovationInsight(result),
          source: result.link,
          relevance: this.calculateRelevance(result, 'innovation')
        })
      }
    }

    // Sort by relevance and return top insights
    return insights
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 20) // Top 20 insights
  }

  /**
   * Categorize search results by region
   */
  categorizeByRegion(
    results: WebSearchResult[], 
    queries: { japanese: any[], global: any[] }
  ): CategorizedResults {
    // Simple categorization based on domain and language patterns
    const japaneseResults: WebSearchResult[] = []
    const globalResults: WebSearchResult[] = []

    for (const result of results) {
      if (this.isJapaneseResult(result)) {
        japaneseResults.push(result)
      } else {
        globalResults.push(result)
      }
    }

    return {
      japanese: {
        results: japaneseResults,
        count: japaneseResults.length
      },
      global: {
        results: globalResults,
        count: globalResults.length
      }
    }
  }

  /**
   * Analyze applicability of global cases to Japanese market
   */
  analyzeApplicability(globalResults: WebSearchResult[]): ApplicabilityAnalysis {
    const applicable = globalResults.length > 0
    const adaptations: string[] = []
    const challenges: string[] = []
    const opportunities: string[] = []

    // Analyze each global result for applicability
    for (const result of globalResults) {
      const analysis = this.analyzeIndividualApplicability(result)
      
      if (analysis.adaptations) {
        adaptations.push(...analysis.adaptations)
      }
      if (analysis.challenges) {
        challenges.push(...analysis.challenges)
      }
      if (analysis.opportunities) {
        opportunities.push(...analysis.opportunities)
      }
    }

    // Remove duplicates
    const uniqueAdaptations = [...new Set(adaptations)]
    const uniqueChallenges = [...new Set(challenges)]
    const uniqueOpportunities = [...new Set(opportunities)]

    return {
      applicable,
      reasoning: this.generateApplicabilityReasoning(
        globalResults, 
        uniqueAdaptations, 
        uniqueChallenges
      ),
      adaptations: uniqueAdaptations.slice(0, 5),
      challenges: uniqueChallenges.slice(0, 5),
      opportunities: uniqueOpportunities.slice(0, 5)
    }
  }

  /**
   * Check if result contains market information
   */
  private containsMarketInfo(result: WebSearchResult): boolean {
    const keywords = ['市場規模', '市場', 'market size', 'market', 'TAM', '成長率', 'growth']
    const text = `${result.title} ${result.snippet}`.toLowerCase()
    return keywords.some(keyword => text.includes(keyword.toLowerCase()))
  }

  /**
   * Extract market insight from result
   */
  private extractMarketInsight(result: WebSearchResult): string {
    const snippet = result.snippet
    // Extract numbers and market-related sentences
    const marketPattern = /(?:市場規模|market size|TAM).*?(?:\d+[\d,]*(?:億|兆|million|billion))/gi
    const matches = snippet.match(marketPattern)
    return matches ? matches[0] : snippet.slice(0, 100)
  }

  /**
   * Check if result contains competitor information
   */
  private containsCompetitorInfo(result: WebSearchResult): boolean {
    const keywords = ['競合', 'competitor', 'rival', '大手', 'player', 'vendor']
    const text = `${result.title} ${result.snippet}`.toLowerCase()
    return keywords.some(keyword => text.includes(keyword.toLowerCase()))
  }

  /**
   * Extract competitor insight from result
   */
  private extractCompetitorInsight(result: WebSearchResult): string {
    return result.snippet.slice(0, 150)
  }

  /**
   * Check if result contains trend information
   */
  private containsTrendInfo(result: WebSearchResult): boolean {
    const keywords = ['トレンド', 'trend', '動向', '最新', 'latest', '2024', '2025']
    const text = `${result.title} ${result.snippet}`.toLowerCase()
    return keywords.some(keyword => text.includes(keyword.toLowerCase()))
  }

  /**
   * Extract trend insight from result
   */
  private extractTrendInsight(result: WebSearchResult): string {
    return result.snippet.slice(0, 150)
  }

  /**
   * Check if result contains regulation information
   */
  private containsRegulationInfo(result: WebSearchResult): boolean {
    const keywords = ['規制', 'regulation', '法律', 'law', 'policy', '政策', 'compliance']
    const text = `${result.title} ${result.snippet}`.toLowerCase()
    return keywords.some(keyword => text.includes(keyword.toLowerCase()))
  }

  /**
   * Extract regulation insight from result
   */
  private extractRegulationInsight(result: WebSearchResult): string {
    return result.snippet.slice(0, 150)
  }

  /**
   * Check if result contains customer need information
   */
  private containsNeedInfo(result: WebSearchResult): boolean {
    const keywords = ['ニーズ', 'need', '課題', 'challenge', 'problem', '要望', 'demand']
    const text = `${result.title} ${result.snippet}`.toLowerCase()
    return keywords.some(keyword => text.includes(keyword.toLowerCase()))
  }

  /**
   * Extract need insight from result
   */
  private extractNeedInsight(result: WebSearchResult): string {
    return result.snippet.slice(0, 150)
  }

  /**
   * Check if result contains innovation information
   */
  private containsInnovationInfo(result: WebSearchResult): boolean {
    const keywords = ['innovation', 'startup', 'unicorn', '革新', 'disrupt', 'technology']
    const text = `${result.title} ${result.snippet}`.toLowerCase()
    return keywords.some(keyword => text.includes(keyword.toLowerCase()))
  }

  /**
   * Extract innovation insight from result
   */
  private extractInnovationInsight(result: WebSearchResult): string {
    return result.snippet.slice(0, 150)
  }

  /**
   * Calculate relevance score for an insight
   */
  private calculateRelevance(
    result: WebSearchResult, 
    type: KeyInsight['type']
  ): number {
    let score = 0.5 // Base score

    // Position bonus (earlier results are more relevant)
    if (result.position !== undefined) {
      score += (10 - Math.min(result.position, 10)) * 0.05
    }

    // Freshness bonus for dated content
    if (result.date) {
      const date = new Date(result.date)
      const ageInDays = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)
      if (ageInDays < 30) score += 0.2
      else if (ageInDays < 90) score += 0.1
    }

    // Type-specific bonuses
    switch (type) {
      case 'market':
        if (result.snippet.match(/\d+[\d,]*(?:億|兆|million|billion)/)) {
          score += 0.2 // Bonus for containing numbers
        }
        break
      case 'innovation':
        if (result.snippet.toLowerCase().includes('startup') || 
            result.snippet.toLowerCase().includes('unicorn')) {
          score += 0.15
        }
        break
    }

    return Math.min(score, 1.0)
  }

  /**
   * Check if result is from Japanese source
   */
  private isJapaneseResult(result: WebSearchResult): boolean {
    const jpDomains = ['.jp', '.co.jp', '.ne.jp', '.or.jp']
    const hasJpDomain = jpDomains.some(domain => result.link.includes(domain))
    
    // Check for Japanese characters in title or snippet
    const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(
      result.title + result.snippet
    )

    return hasJpDomain || hasJapanese
  }

  /**
   * Analyze individual result for applicability
   */
  private analyzeIndividualApplicability(result: WebSearchResult): {
    adaptations?: string[]
    challenges?: string[]
    opportunities?: string[]
  } {
    const adaptations: string[] = []
    const challenges: string[] = []
    const opportunities: string[] = []

    const text = `${result.title} ${result.snippet}`.toLowerCase()

    // Look for adaptation opportunities
    if (text.includes('localization') || text.includes('adaptation')) {
      adaptations.push('ローカライゼーションが必要')
    }

    if (text.includes('partnership') || text.includes('collaboration')) {
      opportunities.push('パートナーシップの機会')
    }

    if (text.includes('regulation') || text.includes('compliance')) {
      challenges.push('規制対応が必要')
    }

    if (text.includes('culture') || text.includes('cultural')) {
      challenges.push('文化的適応が必要')
      adaptations.push('日本市場向けカスタマイズ')
    }

    return { adaptations, challenges, opportunities }
  }

  /**
   * Generate applicability reasoning
   */
  private generateApplicabilityReasoning(
    globalResults: WebSearchResult[],
    adaptations: string[],
    challenges: string[]
  ): string {
    if (globalResults.length === 0) {
      return '海外先端事例が見つかりませんでした。'
    }

    const hasAdaptations = adaptations.length > 0
    const hasChallenges = challenges.length > 0

    if (hasAdaptations && hasChallenges) {
      return `${globalResults.length}件の海外事例を分析した結果、日本市場への適用には${adaptations.length}つの適応要素と${challenges.length}つの課題が特定されました。適切な対応により実現可能と判断されます。`
    } else if (hasAdaptations) {
      return `${globalResults.length}件の海外事例を分析した結果、${adaptations.length}つの適応要素を考慮することで日本市場に適用可能と判断されます。`
    } else if (hasChallenges) {
      return `${globalResults.length}件の海外事例を分析した結果、${challenges.length}つの課題が特定されました。これらの課題解決が実現の鍵となります。`
    } else {
      return `${globalResults.length}件の海外事例を分析した結果、日本市場への適用可能性が確認されました。`
    }
  }
}