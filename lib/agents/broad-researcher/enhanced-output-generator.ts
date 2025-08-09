/**
 * Enhanced Output Generator for Researcher Agent
 * より豊富な情報を次のエージェントに渡すための拡張出力生成器
 */

import { ProcessedResearch, ResearchSummary, SearchResults } from '@/lib/types/search'
import { WebSearchResult } from '@/lib/types'

export class EnhancedOutputGenerator {
  /**
   * Generate enriched output for the next agent
   */
  static generateEnrichedOutput(
    processed: ProcessedResearch,
    searchResults: SearchResults
  ): ResearchSummary {
    // 検索結果から重要な情報を抽出
    const extractedData = this.extractKeyInformation(searchResults)
    
    // 詳細分析データの統合
    const enrichedData: ResearchSummary = {
      ...processed,
      summary: processed.insights.marketSize || '',
      keyFindings: [],
      generatedAt: new Date(),
      
      // 追加: 拡張データ
      enrichedData: {
        // 検索結果から抽出した具体的な情報
        extractedFacts: extractedData.facts,
        extractedMetrics: extractedData.metrics,
        extractedEntities: extractedData.entities,
        
        // カテゴリ別の詳細情報
        marketIntelligence: {
          sizeAndGrowth: this.extractMarketData(searchResults),
          segments: this.extractSegmentData(searchResults),
          drivers: this.extractMarketDrivers(searchResults)
        },
        
        competitiveIntelligence: {
          players: this.extractCompetitorData(searchResults),
          dynamics: this.extractCompetitiveDynamics(searchResults),
          strategies: this.extractStrategies(searchResults)
        },
        
        customerIntelligence: {
          needs: this.extractCustomerNeeds(searchResults),
          behaviors: this.extractCustomerBehaviors(searchResults),
          segments: this.extractCustomerSegments(searchResults)
        },
        
        technologicalIntelligence: {
          current: this.extractCurrentTech(searchResults),
          emerging: this.extractEmergingTech(searchResults),
          disruptions: this.extractDisruptions(searchResults)
        },
        
        // 重要な引用と証拠
        keyQuotes: this.extractKeyQuotes(searchResults),
        evidenceBase: this.extractEvidence(searchResults),
        
        // ビジネスインテリジェンス
        opportunities: this.identifyOpportunities(processed, searchResults),
        threats: this.identifyThreats(processed, searchResults),
        recommendations: this.generateActionableRecommendations(processed, searchResults)
      }
    } as any
    
    return enrichedData
  }

  /**
   * Extract key information from search results
   */
  private static extractKeyInformation(results: SearchResults) {
    const facts: string[] = []
    const metrics: Array<{ label: string; value: string; source: string }> = []
    const entities: Array<{ type: string; name: string; context: string }> = []
    
    const allResults = [...results.japanese, ...results.global]
    
    allResults.forEach(result => {
      // 数値データの抽出
      const numbers = result.snippet.match(/\d+[\d,\.]*\s*(?:兆|億|万|million|billion|%|円|ドル)/g)
      if (numbers) {
        numbers.forEach(num => {
          metrics.push({
            label: '抽出された指標',
            value: num,
            source: result.title
          })
        })
      }
      
      // 企業名の抽出
      const companies = result.snippet.match(/(?:株式会社|Inc\.|Corp\.|Ltd\.)\s*[\w\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]+/g)
      if (companies) {
        companies.forEach(company => {
          entities.push({
            type: 'company',
            name: company,
            context: result.snippet.substring(0, 100)
          })
        })
      }
      
      // 重要な事実の抽出
      if (result.snippet.includes('初めて') || result.snippet.includes('最大') || result.snippet.includes('唯一')) {
        facts.push(result.snippet)
      }
    })
    
    return { facts, metrics, entities }
  }

  /**
   * Extract market data
   */
  private static extractMarketData(results: SearchResults): any {
    const marketData = {
      sizes: [] as string[],
      growthRates: [] as string[],
      projections: [] as string[]
    }
    
    const allResults = [...results.japanese, ...results.global]
    
    allResults.forEach(result => {
      // 市場規模
      if (result.snippet.match(/市場.*\d+.*(?:兆|億)/)) {
        marketData.sizes.push(result.snippet)
      }
      
      // 成長率
      if (result.snippet.match(/成長.*\d+.*%/)) {
        marketData.growthRates.push(result.snippet)
      }
      
      // 将来予測
      if (result.snippet.match(/20\d{2}年.*(?:予測|見込|達する)/)) {
        marketData.projections.push(result.snippet)
      }
    })
    
    return marketData
  }

  /**
   * Extract segment data
   */
  private static extractSegmentData(results: SearchResults): string[] {
    const segments = new Set<string>()
    const segmentKeywords = ['セグメント', '分野', '領域', 'segment', 'category', 'vertical']
    
    results.japanese.forEach(result => {
      segmentKeywords.forEach(keyword => {
        if (result.snippet.includes(keyword)) {
          // セグメント名を抽出する簡易ロジック
          const matches = result.snippet.match(/「([^」]+)」/g)
          if (matches) {
            matches.forEach(match => segments.add(match.replace(/[「」]/g, '')))
          }
        }
      })
    })
    
    return Array.from(segments)
  }

  /**
   * Extract market drivers
   */
  private static extractMarketDrivers(results: SearchResults): string[] {
    const drivers: string[] = []
    const driverKeywords = ['要因', '促進', '推進', 'driver', 'driving', 'catalyst']
    
    results.japanese.forEach(result => {
      driverKeywords.forEach(keyword => {
        if (result.snippet.includes(keyword)) {
          drivers.push(result.snippet)
        }
      })
    })
    
    return drivers.slice(0, 5)
  }

  /**
   * Extract competitor data
   */
  private static extractCompetitorData(results: SearchResults): any[] {
    const competitors: any[] = []
    const competitorKeywords = ['シェア', '大手', 'トップ', '主要', 'leader', 'top player']
    
    results.japanese.forEach(result => {
      competitorKeywords.forEach(keyword => {
        if (result.snippet.includes(keyword)) {
          // 企業名とシェアを抽出
          const shareMatch = result.snippet.match(/(\S+).*?(\d+\.?\d*)\s*%/)
          if (shareMatch) {
            competitors.push({
              name: shareMatch[1],
              share: shareMatch[2] + '%',
              source: result.title
            })
          }
        }
      })
    })
    
    return competitors
  }

  /**
   * Extract competitive dynamics
   */
  private static extractCompetitiveDynamics(results: SearchResults): string[] {
    const dynamics: string[] = []
    const dynamicsKeywords = ['競争', '競合', 'M&A', '買収', '提携', 'competition']
    
    results.japanese.forEach(result => {
      dynamicsKeywords.forEach(keyword => {
        if (result.snippet.includes(keyword)) {
          dynamics.push(result.snippet)
        }
      })
    })
    
    return dynamics.slice(0, 3)
  }

  /**
   * Extract strategies
   */
  private static extractStrategies(results: SearchResults): string[] {
    const strategies: string[] = []
    const strategyKeywords = ['戦略', '施策', 'アプローチ', 'strategy', 'approach']
    
    const allResults = [...results.japanese, ...results.global]
    allResults.forEach(result => {
      strategyKeywords.forEach(keyword => {
        if (result.snippet.toLowerCase().includes(keyword)) {
          strategies.push(result.snippet)
        }
      })
    })
    
    return strategies.slice(0, 5)
  }

  /**
   * Extract customer needs
   */
  private static extractCustomerNeeds(results: SearchResults): string[] {
    const needs: string[] = []
    const needKeywords = ['ニーズ', '要望', '課題', '求め', 'need', 'demand', 'requirement']
    
    results.japanese.forEach(result => {
      needKeywords.forEach(keyword => {
        if (result.snippet.includes(keyword)) {
          needs.push(result.snippet)
        }
      })
    })
    
    return needs.slice(0, 5)
  }

  /**
   * Extract customer behaviors
   */
  private static extractCustomerBehaviors(results: SearchResults): string[] {
    const behaviors: string[] = []
    const behaviorKeywords = ['行動', '傾向', '利用', '購買', 'behavior', 'usage', 'purchase']
    
    results.japanese.forEach(result => {
      behaviorKeywords.forEach(keyword => {
        if (result.snippet.includes(keyword)) {
          behaviors.push(result.snippet)
        }
      })
    })
    
    return behaviors.slice(0, 3)
  }

  /**
   * Extract customer segments
   */
  private static extractCustomerSegments(results: SearchResults): string[] {
    const segments: string[] = []
    const segmentKeywords = ['層', '世代', 'ユーザー', '顧客', 'demographic', 'segment']
    
    results.japanese.forEach(result => {
      segmentKeywords.forEach(keyword => {
        if (result.snippet.includes(keyword)) {
          const matches = result.snippet.match(/(\S+(?:層|世代|ユーザー))/g)
          if (matches) {
            matches.forEach(match => segments.push(match))
          }
        }
      })
    })
    
    return Array.from(new Set(segments)).slice(0, 5)
  }

  /**
   * Extract current technologies
   */
  private static extractCurrentTech(results: SearchResults): string[] {
    const tech: string[] = []
    const techKeywords = ['技術', 'テクノロジー', 'システム', 'technology', 'system', 'platform']
    
    const allResults = [...results.japanese, ...results.global]
    allResults.forEach(result => {
      techKeywords.forEach(keyword => {
        if (result.snippet.toLowerCase().includes(keyword)) {
          tech.push(result.snippet)
        }
      })
    })
    
    return tech.slice(0, 5)
  }

  /**
   * Extract emerging technologies
   */
  private static extractEmergingTech(results: SearchResults): string[] {
    const emerging: string[] = []
    const emergingKeywords = ['最新', '革新', '次世代', 'emerging', 'innovative', 'next-gen']
    
    const allResults = [...results.japanese, ...results.global]
    allResults.forEach(result => {
      emergingKeywords.forEach(keyword => {
        if (result.snippet.toLowerCase().includes(keyword)) {
          emerging.push(result.snippet)
        }
      })
    })
    
    return emerging.slice(0, 5)
  }

  /**
   * Extract disruptions
   */
  private static extractDisruptions(results: SearchResults): string[] {
    const disruptions: string[] = []
    const disruptionKeywords = ['破壊', '変革', 'ディスラプ', 'disrupt', 'transform', 'revolutionize']
    
    const allResults = [...results.japanese, ...results.global]
    allResults.forEach(result => {
      disruptionKeywords.forEach(keyword => {
        if (result.snippet.toLowerCase().includes(keyword)) {
          disruptions.push(result.snippet)
        }
      })
    })
    
    return disruptions.slice(0, 3)
  }

  /**
   * Extract key quotes
   */
  private static extractKeyQuotes(results: SearchResults): Array<{ quote: string; source: string }> {
    const quotes: Array<{ quote: string; source: string }> = []
    
    const allResults = [...results.japanese, ...results.global].slice(0, 10)
    allResults.forEach(result => {
      if (result.snippet.includes('「') || result.snippet.includes('"')) {
        quotes.push({
          quote: result.snippet,
          source: result.title
        })
      }
    })
    
    return quotes.slice(0, 5)
  }

  /**
   * Extract evidence
   */
  private static extractEvidence(results: SearchResults): Array<{ fact: string; source: string; url: string }> {
    const evidence: Array<{ fact: string; source: string; url: string }> = []
    
    const importantResults = [...results.japanese, ...results.global]
      .filter(r => r.position && r.position <= 5)
      .slice(0, 10)
    
    importantResults.forEach(result => {
      evidence.push({
        fact: result.snippet,
        source: result.title,
        url: result.link
      })
    })
    
    return evidence
  }

  /**
   * Identify opportunities
   */
  private static identifyOpportunities(processed: ProcessedResearch, results: SearchResults): string[] {
    const opportunities: string[] = []
    
    // ギャップ分析
    if (processed.insights.customerNeeds && processed.insights.customerNeeds.length > 0) {
      opportunities.push(`顧客ニーズ「${processed.insights.customerNeeds[0]}」に対するソリューション開発`)
    }
    
    // 技術機会
    if (processed.globalInsights.technologies && processed.globalInsights.technologies.length > 0) {
      opportunities.push(`${processed.globalInsights.technologies[0]}の日本市場への導入`)
    }
    
    // 未開拓セグメント
    const segments = this.extractSegmentData(results)
    if (segments.length > 0) {
      opportunities.push(`${segments[0]}セグメントへの参入`)
    }
    
    return opportunities
  }

  /**
   * Identify threats
   */
  private static identifyThreats(processed: ProcessedResearch, results: SearchResults): string[] {
    const threats: string[] = []
    
    // 競争脅威
    if (processed.insights.competitors && processed.insights.competitors.length > 0) {
      threats.push(`${processed.insights.competitors[0]}による市場支配の強化`)
    }
    
    // 規制脅威
    if (processed.insights.regulations && processed.insights.regulations.length > 0) {
      threats.push(`新規制による事業への影響`)
    }
    
    // 技術的脅威
    const disruptions = this.extractDisruptions(results)
    if (disruptions.length > 0) {
      threats.push(`破壊的技術による既存ビジネスモデルの陳腐化`)
    }
    
    return threats
  }

  /**
   * Generate actionable recommendations
   */
  private static generateActionableRecommendations(
    processed: ProcessedResearch,
    results: SearchResults
  ): Array<{ action: string; rationale: string; priority: 'high' | 'medium' | 'low' }> {
    const recommendations: Array<{ action: string; rationale: string; priority: 'high' | 'medium' | 'low' }> = []
    
    // 市場参入
    if (processed.insights.marketSize) {
      recommendations.push({
        action: '成長市場への早期参入',
        rationale: processed.insights.marketSize,
        priority: 'high'
      })
    }
    
    // 技術導入
    if (processed.globalInsights.technologies && processed.globalInsights.technologies.length > 0) {
      recommendations.push({
        action: `${processed.globalInsights.technologies[0]}の導入検討`,
        rationale: '競争優位性の確立',
        priority: 'high'
      })
    }
    
    // パートナーシップ
    if (processed.insights.competitors && processed.insights.competitors.length > 1) {
      recommendations.push({
        action: '戦略的パートナーシップの構築',
        rationale: '市場での地位確立',
        priority: 'medium'
      })
    }
    
    return recommendations
  }
}