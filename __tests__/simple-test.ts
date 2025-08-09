/**
 * Simple test to verify basic functionality
 */

import { SearchResultProcessor } from '@/lib/agents/broad-researcher/search-result-processor'
import { WebSearchResult } from '@/lib/types'

describe('SearchResultProcessor Basic Tests', () => {
  let processor: SearchResultProcessor

  beforeEach(() => {
    processor = new SearchResultProcessor()
  })

  test('should create instance', () => {
    expect(processor).toBeDefined()
  })

  test('should remove duplicates', () => {
    const results: WebSearchResult[] = [
      {
        title: 'Test 1',
        link: 'https://example.com/1',
        snippet: 'Test snippet 1',
        position: 1
      },
      {
        title: 'Test 2',
        link: 'https://example.com/1', // Duplicate
        snippet: 'Test snippet 2',
        position: 2
      },
      {
        title: 'Test 3',
        link: 'https://example.com/3',
        snippet: 'Test snippet 3',
        position: 3
      }
    ]

    const unique = processor.removeDuplicates(results)
    expect(unique).toHaveLength(2)
    expect(unique[0].link).toBe('https://example.com/1')
    expect(unique[1].link).toBe('https://example.com/3')
  })

  test('should extract insights', () => {
    const results: WebSearchResult[] = [
      {
        title: 'AI市場規模が1兆円突破',
        link: 'https://example.com/market',
        snippet: '日本のAI市場規模は2024年に1兆円を突破する見込み',
        position: 1
      }
    ]

    const insights = processor.extractKeyInsights(results)
    expect(insights.length).toBeGreaterThan(0)
    
    // Check if market insight exists
    const marketInsight = insights.find(i => i.type === 'market')
    expect(marketInsight).toBeDefined()
    expect(marketInsight?.content).toContain('1兆')
  })
})