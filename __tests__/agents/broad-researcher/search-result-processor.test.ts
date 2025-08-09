/**
 * SearchResultProcessor unit tests
 */

import { SearchResultProcessor } from '@/lib/agents/broad-researcher/search-result-processor'
import { WebSearchResult } from '@/lib/types'

describe('SearchResultProcessor', () => {
  let processor: SearchResultProcessor

  beforeEach(() => {
    processor = new SearchResultProcessor()
  })

  describe('removeDuplicates', () => {
    it('should remove duplicate URLs', () => {
      const results: WebSearchResult[] = [
        {
          title: 'Result 1',
          link: 'https://example.com/page1',
          snippet: 'Snippet 1',
          position: 1
        },
        {
          title: 'Result 2',
          link: 'https://example.com/page2',
          snippet: 'Snippet 2',
          position: 2
        },
        {
          title: 'Result 1 Duplicate',
          link: 'https://example.com/page1', // Duplicate URL
          snippet: 'Different snippet',
          position: 3
        }
      ]

      const unique = processor.removeDuplicates(results)

      expect(unique).toHaveLength(2)
      expect(unique[0].link).toBe('https://example.com/page1')
      expect(unique[1].link).toBe('https://example.com/page2')
    })

    it('should handle empty array', () => {
      const unique = processor.removeDuplicates([])
      expect(unique).toHaveLength(0)
    })
  })

  describe('extractKeyInsights', () => {
    it('should extract market insights', () => {
      const results: WebSearchResult[] = [
        {
          title: 'AI市場規模が1兆円突破',
          link: 'https://example.com/market',
          snippet: '日本のAI市場規模は2024年に1兆円を突破する見込み...',
          position: 1
        }
      ]

      const insights = processor.extractKeyInsights(results)

      expect(insights).toHaveLength(1)
      expect(insights[0].type).toBe('market')
      expect(insights[0].content).toContain('1兆円')
      expect(insights[0].source).toBe('https://example.com/market')
    })

    it('should extract competitor insights', () => {
      const results: WebSearchResult[] = [
        {
          title: 'AI競合分析レポート',
          link: 'https://example.com/competitors',
          snippet: '主要な競合企業にはGoogle、Microsoft、OpenAIが含まれる...',
          position: 1
        }
      ]

      const insights = processor.extractKeyInsights(results)

      expect(insights.some(i => i.type === 'competitor')).toBe(true)
    })

    it('should extract trend insights', () => {
      const results: WebSearchResult[] = [
        {
          title: '2024年AI最新トレンド',
          link: 'https://example.com/trends',
          snippet: 'ジェネレーティブAIが主要トレンドとして注目されている...',
          position: 1
        }
      ]

      const insights = processor.extractKeyInsights(results)

      expect(insights.some(i => i.type === 'trend')).toBe(true)
    })

    it('should extract regulation insights', () => {
      const results: WebSearchResult[] = [
        {
          title: 'AI規制法案が可決',
          link: 'https://example.com/regulation',
          snippet: '新しいAI規制法案が国会で可決され、2025年から施行予定...',
          position: 1
        }
      ]

      const insights = processor.extractKeyInsights(results)

      expect(insights.some(i => i.type === 'regulation')).toBe(true)
    })

    it('should extract need insights', () => {
      const results: WebSearchResult[] = [
        {
          title: 'AI導入の課題と企業ニーズ',
          link: 'https://example.com/needs',
          snippet: '多くの企業がAI人材不足を課題として挙げている...',
          position: 1
        }
      ]

      const insights = processor.extractKeyInsights(results)

      expect(insights.some(i => i.type === 'need')).toBe(true)
    })

    it('should extract innovation insights', () => {
      const results: WebSearchResult[] = [
        {
          title: 'AI Startup Raises Unicorn Funding',
          link: 'https://example.com/innovation',
          snippet: 'Revolutionary AI startup becomes unicorn with $1B valuation...',
          position: 1
        }
      ]

      const insights = processor.extractKeyInsights(results)

      expect(insights.some(i => i.type === 'innovation')).toBe(true)
    })

    it('should calculate relevance scores', () => {
      const results: WebSearchResult[] = [
        {
          title: 'Fresh Market Data',
          link: 'https://example.com/fresh',
          snippet: 'AI市場規模500億円...',
          position: 1,
          date: new Date().toISOString() // Fresh content
        },
        {
          title: 'Old Market Data',
          link: 'https://example.com/old',
          snippet: 'AI市場規模100億円...',
          position: 5,
          date: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year old
        }
      ]

      const insights = processor.extractKeyInsights(results)
      const freshInsight = insights.find(i => i.source.includes('fresh'))
      const oldInsight = insights.find(i => i.source.includes('old'))

      expect(freshInsight?.relevance).toBeGreaterThan(oldInsight?.relevance || 0)
    })

    it('should limit insights to top 20', () => {
      const results: WebSearchResult[] = Array.from({ length: 30 }, (_, i) => ({
        title: `Market Report ${i}`,
        link: `https://example.com/report${i}`,
        snippet: `市場規模 ${i * 100}億円の成長...`,
        position: i + 1
      }))

      const insights = processor.extractKeyInsights(results)

      expect(insights).toHaveLength(20)
    })
  })

  describe('categorizeByRegion', () => {
    it('should categorize Japanese results', () => {
      const results: WebSearchResult[] = [
        {
          title: '日本のAI市場',
          link: 'https://example.co.jp/ai',
          snippet: '日本市場の動向...',
          position: 1
        },
        {
          title: 'Global AI Market',
          link: 'https://example.com/ai',
          snippet: 'Global market trends...',
          position: 2
        }
      ]

      const categorized = processor.categorizeByRegion(results, {
        japanese: [],
        global: []
      })

      expect(categorized.japanese.count).toBe(1)
      expect(categorized.global.count).toBe(1)
    })

    it('should detect Japanese content by domain', () => {
      const results: WebSearchResult[] = [
        { title: 'Test', link: 'https://example.jp/page', snippet: 'Test', position: 1 },
        { title: 'Test', link: 'https://example.co.jp/page', snippet: 'Test', position: 2 },
        { title: 'Test', link: 'https://example.ne.jp/page', snippet: 'Test', position: 3 },
        { title: 'Test', link: 'https://example.or.jp/page', snippet: 'Test', position: 4 }
      ]

      const categorized = processor.categorizeByRegion(results, {
        japanese: [],
        global: []
      })

      expect(categorized.japanese.count).toBe(4)
    })

    it('should detect Japanese content by characters', () => {
      const results: WebSearchResult[] = [
        {
          title: 'AI Technology', // English title
          link: 'https://example.com/ai',
          snippet: 'AIテクノロジーの最新動向について...', // Japanese snippet
          position: 1
        }
      ]

      const categorized = processor.categorizeByRegion(results, {
        japanese: [],
        global: []
      })

      expect(categorized.japanese.count).toBe(1)
    })
  })

  describe('analyzeApplicability', () => {
    it('should analyze empty results', () => {
      const analysis = processor.analyzeApplicability([])

      expect(analysis.applicable).toBe(false)
      expect(analysis.reasoning).toContain('海外先端事例が見つかりませんでした')
    })

    it('should analyze results with adaptations', () => {
      const results: WebSearchResult[] = [
        {
          title: 'AI Localization Strategy',
          link: 'https://example.com/localization',
          snippet: 'Successful localization requires cultural adaptation...',
          position: 1
        }
      ]

      const analysis = processor.analyzeApplicability(results)

      expect(analysis.applicable).toBe(true)
      expect(analysis.adaptations).toContain('ローカライゼーションが必要')
      expect(analysis.reasoning).toContain('適応要素')
    })

    it('should identify partnership opportunities', () => {
      const results: WebSearchResult[] = [
        {
          title: 'Strategic Partnership Success',
          link: 'https://example.com/partnership',
          snippet: 'Collaboration with local partners is key...',
          position: 1
        }
      ]

      const analysis = processor.analyzeApplicability(results)

      expect(analysis.opportunities).toContain('パートナーシップの機会')
    })

    it('should identify regulatory challenges', () => {
      const results: WebSearchResult[] = [
        {
          title: 'Regulatory Compliance Guide',
          link: 'https://example.com/regulation',
          snippet: 'Strict regulation requires careful compliance...',
          position: 1
        }
      ]

      const analysis = processor.analyzeApplicability(results)

      expect(analysis.challenges).toContain('規制対応が必要')
    })

    it('should identify cultural adaptation needs', () => {
      const results: WebSearchResult[] = [
        {
          title: 'Cultural Differences in AI Adoption',
          link: 'https://example.com/culture',
          snippet: 'Cultural factors significantly impact adoption...',
          position: 1
        }
      ]

      const analysis = processor.analyzeApplicability(results)

      expect(analysis.challenges).toContain('文化的適応が必要')
      expect(analysis.adaptations).toContain('日本市場向けカスタマイズ')
    })

    it('should limit recommendations to 5 each', () => {
      const results: WebSearchResult[] = Array.from({ length: 10 }, (_, i) => ({
        title: `Adaptation Strategy ${i}`,
        link: `https://example.com/adapt${i}`,
        snippet: 'Localization and adaptation required...',
        position: i + 1
      }))

      const analysis = processor.analyzeApplicability(results)

      expect(analysis.adaptations?.length).toBeLessThanOrEqual(5)
      expect(analysis.challenges?.length).toBeLessThanOrEqual(5)
      expect(analysis.opportunities?.length).toBeLessThanOrEqual(5)
    })

    it('should generate appropriate reasoning', () => {
      const results: WebSearchResult[] = [
        {
          title: 'Success Story',
          link: 'https://example.com/success',
          snippet: 'Direct application possible with minor adjustments...',
          position: 1
        }
      ]

      const analysis = processor.analyzeApplicability(results)

      expect(analysis.reasoning).toContain('1件の海外事例を分析')
      expect(analysis.reasoning).toContain('日本市場')
    })
  })
})