/**
 * Basic functionality test without external dependencies
 */

import { SearchResultProcessor } from '@/lib/agents/broad-researcher/search-result-processor'
import { PerformanceMonitor } from '@/lib/agents/broad-researcher/performance-monitor'
import { LocalLogger } from '@/lib/agents/broad-researcher/local-logger'
import { 
  AgentError, 
  QueryGenerationError,
  ErrorHandler 
} from '@/lib/agents/broad-researcher/errors'
import * as fs from 'fs'

// Mock fs module
jest.mock('fs')
const mockedFs = fs as jest.Mocked<typeof fs>

describe('Basic Functionality Tests', () => {
  describe('SearchResultProcessor', () => {
    let processor: SearchResultProcessor
    
    beforeEach(() => {
      processor = new SearchResultProcessor()
    })
    
    test('should remove duplicate URLs correctly', () => {
      const results = [
        { title: 'A', link: 'https://a.com', snippet: 'A', position: 1 },
        { title: 'B', link: 'https://b.com', snippet: 'B', position: 2 },
        { title: 'A2', link: 'https://a.com', snippet: 'A2', position: 3 }
      ]
      
      const unique = processor.removeDuplicates(results)
      expect(unique).toHaveLength(2)
      expect(unique.map(r => r.link)).toEqual(['https://a.com', 'https://b.com'])
    })
    
    test('should identify Japanese results', () => {
      const results = [
        { title: '日本語', link: 'https://example.com', snippet: 'テスト', position: 1 },
        { title: 'English', link: 'https://example.jp', snippet: 'Test', position: 2 },
        { title: 'English', link: 'https://example.co.jp', snippet: 'Test', position: 3 }
      ]
      
      const categorized = processor.categorizeByRegion(results, { japanese: [], global: [] })
      expect(categorized.japanese.count).toBe(3) // All are Japanese
      expect(categorized.global.count).toBe(0)
    })
    
    test('should extract insights with correct types', () => {
      const results = [
        { 
          title: 'AI市場規模が1兆円突破', 
          link: 'https://example.com/1',
          snippet: '日本のAI市場規模は2024年に1兆円を突破',
          position: 1 
        },
        {
          title: '主要競合企業の分析',
          link: 'https://example.com/2', 
          snippet: 'Google、Microsoft、OpenAIが主要プレイヤー',
          position: 2
        },
        {
          title: '2024年AI最新トレンド',
          link: 'https://example.com/3',
          snippet: 'ジェネレーティブAIが主流に',
          position: 3
        }
      ]
      
      const insights = processor.extractKeyInsights(results)
      
      const types = insights.map(i => i.type)
      expect(types).toContain('market')
      expect(types).toContain('competitor')
      expect(types).toContain('trend')
    })
  })
  
  describe('PerformanceMonitor', () => {
    let monitor: PerformanceMonitor
    
    beforeEach(() => {
      monitor = new PerformanceMonitor()
      jest.spyOn(console, 'log').mockImplementation()
      jest.spyOn(console, 'warn').mockImplementation()
      jest.spyOn(console, 'error').mockImplementation()
    })
    
    afterEach(() => {
      jest.restoreAllMocks()
    })
    
    test('should track metrics', () => {
      monitor.recordTokenUsage(1000, 'test')
      monitor.recordApiCall('serper')
      monitor.recordCacheAccess(true)
      monitor.recordError(new Error('Test error'))
      
      const metrics = monitor.getMetrics()
      expect(metrics.tokensUsed).toBe(1000)
      expect(metrics.apiCallsCount).toBe(1)
      expect(metrics.cacheHitRate).toBeGreaterThan(0)
      expect(metrics.errors).toHaveLength(1)
    })
    
    test('should warn on high token usage', () => {
      monitor.recordTokenUsage(5000, 'large-request')
      expect(console.warn).toHaveBeenCalled()
    })
    
    test('should generate summary with warnings', () => {
      monitor.recordTokenUsage(18000, 'test')
      monitor.recordApiCall('api')
      monitor.recordCacheAccess(false)
      
      const summary = monitor.getSummary()
      expect(summary.warnings.length).toBeGreaterThan(0)
      expect(summary.recommendations.length).toBeGreaterThan(0)
    })
  })
  
  describe('Error Handling', () => {
    test('should create custom errors correctly', () => {
      const error = new QueryGenerationError('Test error', { theme: 'test' })
      expect(error.name).toBe('QueryGenerationError')
      expect(error.code).toBe('QUERY_GENERATION_ERROR')
      expect(error.retryable).toBe(true)
    })
    
    test('should identify retryable errors', () => {
      const retryable = new Error('Network timeout')
      const nonRetryable = new Error('Syntax error')
      
      expect(ErrorHandler.isRetryable(retryable)).toBe(true)
      expect(ErrorHandler.isRetryable(nonRetryable)).toBe(false)
    })
    
    test('should provide user-friendly messages', () => {
      const error = new QueryGenerationError('API failed')
      const message = ErrorHandler.getUserMessage(error)
      expect(message).toContain('検索クエリ')
      expect(message).not.toContain('API failed')
    })
    
    test('should wrap errors properly', () => {
      const originalError = new Error('Original')
      const wrapped = ErrorHandler.wrapError(originalError, 'Context')
      
      expect(wrapped).toBeInstanceOf(AgentError)
      expect(wrapped.message).toBe('Context: Original')
      expect(wrapped.code).toBe('WRAPPED_ERROR')
    })
  })
  
  describe('LocalLogger', () => {
    let logger: LocalLogger
    
    beforeEach(() => {
      jest.clearAllMocks()
      mockedFs.existsSync.mockReturnValue(false)
      mockedFs.mkdirSync.mockImplementation()
      mockedFs.appendFileSync.mockImplementation()
      mockedFs.readFileSync.mockReturnValue('')
      mockedFs.readdirSync.mockReturnValue([])
      mockedFs.statSync.mockReturnValue({ size: 0, mtime: new Date() } as any)
      
      logger = new LocalLogger('./test-logs')
    })
    
    test('should create log directory', () => {
      expect(mockedFs.mkdirSync).toHaveBeenCalledWith(
        './test-logs',
        { recursive: true }
      )
    })
    
    test('should write log entries', () => {
      logger.info('Test message', { data: 'test' })
      
      expect(mockedFs.appendFileSync).toHaveBeenCalled()
      const call = mockedFs.appendFileSync.mock.calls[0]
      const logContent = call[1] as string
      const parsed = JSON.parse(logContent.trim())
      
      expect(parsed.level).toBe('info')
      expect(parsed.message).toBe('Test message')
      expect(parsed.data).toEqual({ data: 'test' })
    })
    
    test('should handle write errors gracefully', () => {
      mockedFs.appendFileSync.mockImplementation(() => {
        throw new Error('Disk full')
      })
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      expect(() => logger.info('Test')).not.toThrow()
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to write to log file:',
        expect.any(Error)
      )
      
      consoleSpy.mockRestore()
    })
  })
})