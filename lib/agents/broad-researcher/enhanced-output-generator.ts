/**
 * Enhanced Output Generator
 * リサーチ結果を拡張した出力を生成するユーティリティ
 */

import { SearchResults, ProcessedResearch } from '@/lib/types/search'

export interface EnhancedOutput {
  targetMarkets: string[]
  marketOpportunities: string[]
  keyTechnologies: string[]
  competitorStrategies: string[]
  regulatoryConsiderations: string[]
  customerSegments: string[]
  businessModels: string[]
  entryBarriers: string[]
  successFactors: string[]
  risks: string[]
}

export class EnhancedOutputGenerator {
  /**
   * リサーチ結果から拡張された出力を生成
   */
  static generateEnrichedOutput(
    processedResearch: ProcessedResearch,
    results: SearchResults
  ): { enrichedData: EnhancedOutput } {
    // 市場機会を抽出
    const marketOpportunities = this.extractMarketOpportunities(processedResearch)
    
    // ターゲット市場を特定
    const targetMarkets = this.identifyTargetMarkets(processedResearch)
    
    // 主要技術を抽出
    const keyTechnologies = this.extractKeyTechnologies(processedResearch)
    
    // 競合戦略を分析
    const competitorStrategies = this.analyzeCompetitorStrategies(processedResearch)
    
    // 規制要因を特定
    const regulatoryConsiderations = this.identifyRegulatoryFactors(processedResearch)
    
    // 顧客セグメントを特定
    const customerSegments = this.identifyCustomerSegments(processedResearch)
    
    // ビジネスモデルを提案
    const businessModels = this.suggestBusinessModels(processedResearch)
    
    // 参入障壁を分析
    const entryBarriers = this.analyzeEntryBarriers(processedResearch)
    
    // 成功要因を特定
    const successFactors = this.identifySuccessFactors(processedResearch)
    
    // リスクを評価
    const risks = this.assessRisks(processedResearch)

    return {
      enrichedData: {
        targetMarkets,
        marketOpportunities,
        keyTechnologies,
        competitorStrategies,
        regulatoryConsiderations,
        customerSegments,
        businessModels,
        entryBarriers,
        successFactors,
        risks
      }
    }
  }

  private static extractMarketOpportunities(research: ProcessedResearch): string[] {
    const opportunities: string[] = []
    
    if (research.detailedAnalysis?.opportunityAnalysis) {
      const analysis = research.detailedAnalysis.opportunityAnalysis
      if (analysis.untappedSegments) opportunities.push(...analysis.untappedSegments)
      if (analysis.emergingNeeds) opportunities.push(...analysis.emergingNeeds)
      if (analysis.technologicalOpportunities) opportunities.push(...analysis.technologicalOpportunities)
    }
    
    if (research.insights?.trends) {
      opportunities.push(...research.insights.trends.map(t => `トレンド: ${t}`))
    }
    
    return opportunities.slice(0, 10)
  }

  private static identifyTargetMarkets(research: ProcessedResearch): string[] {
    const markets: string[] = []
    
    if (research.detailedAnalysis?.marketAnalysis) {
      markets.push('日本国内市場')
      if (research.globalInsights) {
        markets.push('グローバル市場')
      }
    }
    
    if (research.detailedAnalysis?.opportunityAnalysis?.untappedSegments) {
      markets.push(...research.detailedAnalysis.opportunityAnalysis.untappedSegments)
    }
    
    return markets.slice(0, 5)
  }

  private static extractKeyTechnologies(research: ProcessedResearch): string[] {
    const technologies: string[] = []
    
    if (research.globalInsights?.technologies) {
      technologies.push(...research.globalInsights.technologies)
    }
    
    if (research.globalInsights?.innovations) {
      technologies.push(...research.globalInsights.innovations)
    }
    
    if (research.detailedAnalysis?.opportunityAnalysis?.technologicalOpportunities) {
      technologies.push(...research.detailedAnalysis.opportunityAnalysis.technologicalOpportunities)
    }
    
    return technologies.slice(0, 10)
  }

  private static analyzeCompetitorStrategies(research: ProcessedResearch): string[] {
    const strategies: string[] = []
    
    if (research.detailedAnalysis?.competitiveAnalysis?.topPlayers) {
      research.detailedAnalysis.competitiveAnalysis.topPlayers.forEach(player => {
        if (player.strengths) {
          strategies.push(`${player.name}: ${player.strengths.join(', ')}`)
        }
      })
    }
    
    if (research.insights?.competitors) {
      strategies.push(...research.insights.competitors.map(c => `競合: ${c}`))
    }
    
    return strategies.slice(0, 8)
  }

  private static identifyRegulatoryFactors(research: ProcessedResearch): string[] {
    const regulations: string[] = []
    
    if (research.insights?.regulations) {
      regulations.push(...research.insights.regulations)
    }
    
    if (research.detailedAnalysis?.riskAnalysis?.regulatoryRisks) {
      regulations.push(...research.detailedAnalysis.riskAnalysis.regulatoryRisks)
    }
    
    return regulations.slice(0, 5)
  }

  private static identifyCustomerSegments(research: ProcessedResearch): string[] {
    const segments: string[] = []
    
    if (research.insights?.customerNeeds) {
      segments.push(...research.insights.customerNeeds.map(need => `ニーズ: ${need}`))
    }
    
    if (research.detailedAnalysis?.opportunityAnalysis?.untappedSegments) {
      segments.push(...research.detailedAnalysis.opportunityAnalysis.untappedSegments)
    }
    
    return segments.slice(0, 8)
  }

  private static suggestBusinessModels(research: ProcessedResearch): string[] {
    const models: string[] = [
      'サブスクリプションモデル',
      'プラットフォームモデル',
      'フリーミアムモデル',
      'B2Bソリューション',
      'マーケットプレイス'
    ]
    
    if (research.globalInsights?.bestPractices) {
      models.push(...research.globalInsights.bestPractices)
    }
    
    return models.slice(0, 5)
  }

  private static analyzeEntryBarriers(research: ProcessedResearch): string[] {
    const barriers: string[] = []
    
    if (research.detailedAnalysis?.competitiveAnalysis?.entryBarriers) {
      barriers.push(...research.detailedAnalysis.competitiveAnalysis.entryBarriers)
    }
    
    if (research.detailedAnalysis?.riskAnalysis?.competitiveRisks) {
      barriers.push(...research.detailedAnalysis.riskAnalysis.competitiveRisks)
    }
    
    return barriers.slice(0, 5)
  }

  private static identifySuccessFactors(research: ProcessedResearch): string[] {
    const factors: string[] = []
    
    if (research.detailedAnalysis?.marketAnalysis?.keyDrivers) {
      factors.push(...research.detailedAnalysis.marketAnalysis.keyDrivers)
    }
    
    if (research.globalInsights?.bestPractices) {
      factors.push(...research.globalInsights.bestPractices)
    }
    
    if (research.recommendations) {
      factors.push(...research.recommendations)
    }
    
    return factors.slice(0, 8)
  }

  private static assessRisks(research: ProcessedResearch): string[] {
    const risks: string[] = []
    
    if (research.detailedAnalysis?.riskAnalysis) {
      const riskAnalysis = research.detailedAnalysis.riskAnalysis
      if (riskAnalysis.marketRisks) risks.push(...riskAnalysis.marketRisks)
      if (riskAnalysis.regulatoryRisks) risks.push(...riskAnalysis.regulatoryRisks)
      if (riskAnalysis.technologicalRisks) risks.push(...riskAnalysis.technologicalRisks)
      if (riskAnalysis.competitiveRisks) risks.push(...riskAnalysis.competitiveRisks)
    }
    
    if (research.detailedAnalysis?.marketAnalysis?.challenges) {
      risks.push(...research.detailedAnalysis.marketAnalysis.challenges)
    }
    
    return risks.slice(0, 10)
  }
}

export type { ProcessedResearch }