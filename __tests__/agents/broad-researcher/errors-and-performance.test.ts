/**
 * Error handling and performance monitoring tests
 */

import { 
  AgentError, 
  QueryGenerationError, 
  SearchExecutionError,
  ResultProcessingError,
  SummaryGenerationError,
  TokenLimitError,
  CostLimitError,
  ExecutionTimeoutError,
  ErrorHandler
} from '@/lib/agents/broad-researcher/errors'
import { PerformanceMonitor } from '@/lib/agents/broad-researcher/performance-monitor'
import { LocalLogger } from '@/lib/agents/broad-researcher/local-logger'
import fs from 'fs'
import path from 'path'

jest.mock('fs')
const mockedFs = fs as jest.Mocked<typeof fs>

describe('Error Classes', () => {
  describe('AgentError', () => {
    it('should create base error with all properties', () => {
      const error = new AgentError(
        'Test error',
        'TEST_ERROR',
        true,
        { detail: 'Additional info' }
      )

      expect(error.message).toBe('Test error')
      expect(error.code).toBe('TEST_ERROR')
      expect(error.retryable).toBe(true)
      expect(error.details).toEqual({ detail: 'Additional info' })
      expect(error.name).toBe('AgentError')
    })
  })

  describe('Specific Error Types', () => {
    it('should create QueryGenerationError', () => {
      const error = new QueryGenerationError('Query failed', { theme: 'test' })
      
      expect(error.name).toBe('QueryGenerationError')
      expect(error.code).toBe('QUERY_GENERATION_ERROR')
      expect(error.retryable).toBe(true)
    })

    it('should create SearchExecutionError', () => {
      const error = new SearchExecutionError('Search failed')
      
      expect(error.name).toBe('SearchExecutionError')
      expect(error.code).toBe('SEARCH_EXECUTION_ERROR')
      expect(error.retryable).toBe(true)
    })

    it('should create ResultProcessingError', () => {
      const error = new ResultProcessingError('Processing failed')
      
      expect(error.name).toBe('ResultProcessingError')
      expect(error.code).toBe('RESULT_PROCESSING_ERROR')
      expect(error.retryable).toBe(false)
    })

    it('should create SummaryGenerationError', () => {
      const error = new SummaryGenerationError('Summary failed')
      
      expect(error.name).toBe('SummaryGenerationError')
      expect(error.code).toBe('SUMMARY_GENERATION_ERROR')
      expect(error.retryable).toBe(true)
    })

    it('should create TokenLimitError', () => {
      const error = new TokenLimitError(5000, 4000)
      
      expect(error.name).toBe('TokenLimitError')
      expect(error.code).toBe('TOKEN_LIMIT_ERROR')
      expect(error.retryable).toBe(false)
      expect(error.message).toContain('5000')
      expect(error.message).toContain('4000')
    })

    it('should create CostLimitError', () => {
      const error = new CostLimitError(1500, 1000)
      
      expect(error.name).toBe('CostLimitError')
      expect(error.code).toBe('COST_LIMIT_ERROR')
      expect(error.retryable).toBe(false)
      expect(error.message).toContain('¥1500')
      expect(error.message).toContain('¥1000')
    })

    it('should create ExecutionTimeoutError', () => {
      const error = new ExecutionTimeoutError(30000)
      
      expect(error.name).toBe('ExecutionTimeoutError')
      expect(error.code).toBe('EXECUTION_TIMEOUT_ERROR')
      expect(error.retryable).toBe(false)
      expect(error.message).toContain('30000ms')
    })
  })

  describe('ErrorHandler', () => {
    describe('wrapError', () => {
      it('should return AgentError as-is', () => {
        const originalError = new QueryGenerationError('Original error')
        const wrapped = ErrorHandler.wrapError(originalError, 'Context')
        
        expect(wrapped).toBe(originalError)
      })

      it('should wrap standard Error', () => {
        const originalError = new Error('Standard error')
        const wrapped = ErrorHandler.wrapError(originalError, 'Test context')
        
        expect(wrapped).toBeInstanceOf(AgentError)
        expect(wrapped.message).toBe('Test context: Standard error')
        expect(wrapped.code).toBe('WRAPPED_ERROR')
        expect(wrapped.details?.originalError).toBe('Error')
      })

      it('should wrap unknown error', () => {
        const wrapped = ErrorHandler.wrapError('String error', 'Test context')
        
        expect(wrapped).toBeInstanceOf(AgentError)
        expect(wrapped.message).toBe('Test context: 不明なエラー')
        expect(wrapped.code).toBe('UNKNOWN_ERROR')
        expect(wrapped.details?.error).toBe('String error')
      })
    })

    describe('isRetryable', () => {
      it('should identify retryable AgentError', () => {
        const retryableError = new SearchExecutionError('Retryable')
        const nonRetryableError = new ResultProcessingError('Non-retryable')
        
        expect(ErrorHandler.isRetryable(retryableError)).toBe(true)
        expect(ErrorHandler.isRetryable(nonRetryableError)).toBe(false)
      })

      it('should identify network errors as retryable', () => {
        const networkErrors = [
          new Error('Network timeout'),
          new Error('Connection refused'),
          new Error('ECONNREFUSED'),
          new Error('Request timeout')
        ]
        
        networkErrors.forEach(error => {
          expect(ErrorHandler.isRetryable(error)).toBe(true)
        })
      })

      it('should identify non-network errors as non-retryable', () => {
        const error = new Error('Syntax error')
        expect(ErrorHandler.isRetryable(error)).toBe(false)
      })
    })

    describe('getUserMessage', () => {
      it('should provide user-friendly messages for specific errors', () => {
        const tokenError = new TokenLimitError(5000, 4000)
        expect(ErrorHandler.getUserMessage(tokenError)).toContain('トークン使用量が上限')
        
        const costError = new CostLimitError(1500, 1000)
        expect(ErrorHandler.getUserMessage(costError)).toContain('月間のAPIコスト上限')
        
        const timeoutError = new ExecutionTimeoutError(30000)
        expect(ErrorHandler.getUserMessage(timeoutError)).toContain('処理時間が上限')
        
        const queryError = new QueryGenerationError('Failed')
        expect(ErrorHandler.getUserMessage(queryError)).toContain('検索クエリの生成')
        
        const searchError = new SearchExecutionError('Failed')
        expect(ErrorHandler.getUserMessage(searchError)).toContain('Web検索の実行中')
        
        const processingError = new ResultProcessingError('Failed')
        expect(ErrorHandler.getUserMessage(processingError)).toContain('検索結果の処理中')
        
        const summaryError = new SummaryGenerationError('Failed')
        expect(ErrorHandler.getUserMessage(summaryError)).toContain('要約の生成')
      })

      it('should provide generic message for unknown errors', () => {
        const error = new Error('Unknown error')
        expect(ErrorHandler.getUserMessage(error)).toContain('予期しないエラー')
      })
    })
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

  describe('checkpoints', () => {
    it('should track checkpoint duration', () => {
      monitor.startCheckpoint('test-operation')
      
      // Simulate some work
      const startTime = Date.now()
      while (Date.now() - startTime < 100) {}
      
      const duration = monitor.endCheckpoint('test-operation')
      
      expect(duration).toBeGreaterThanOrEqual(100)
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('[Performance] test-operation:')
      )
    })

    it('should handle missing checkpoint', () => {
      const duration = monitor.endCheckpoint('non-existent')
      
      expect(duration).toBe(0)
      expect(console.warn).toHaveBeenCalledWith(
        'No checkpoint found for: non-existent'
      )
    })
  })

  describe('token tracking', () => {
    it('should track token usage', () => {
      monitor.recordTokenUsage(1000, 'query-generation')
      monitor.recordTokenUsage(2000, 'summary')
      
      const metrics = monitor.getMetrics()
      expect(metrics.tokensUsed).toBe(3000)
    })

    it('should warn on high single request tokens', () => {
      monitor.recordTokenUsage(5000, 'large-request')
      
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('High token usage in large-request: 5000 tokens')
      )
    })

    it('should error on total token limit exceeded', () => {
      monitor.recordTokenUsage(21000, 'huge-request')
      
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Total token limit exceeded: 21000')
      )
    })
  })

  describe('API call tracking', () => {
    it('should track API calls', () => {
      monitor.recordApiCall('serper')
      monitor.recordApiCall('openai')
      monitor.recordApiCall('serper')
      
      const metrics = monitor.getMetrics()
      expect(metrics.apiCallsCount).toBe(3)
    })

    it('should warn when API limit exceeded', () => {
      // Record 51 API calls
      for (let i = 0; i < 51; i++) {
        monitor.recordApiCall('test-service')
      }
      
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('API call limit exceeded: 51 calls')
      )
    })
  })

  describe('cache tracking', () => {
    it('should track cache hit rate', () => {
      monitor.recordCacheAccess(true)  // hit
      monitor.recordCacheAccess(true)  // hit
      monitor.recordCacheAccess(false) // miss
      monitor.recordCacheAccess(true)  // hit
      
      const metrics = monitor.getMetrics()
      // Moving average calculation
      expect(metrics.cacheHitRate).toBeGreaterThan(60)
      expect(metrics.cacheHitRate).toBeLessThan(80)
    })
  })

  describe('error tracking', () => {
    it('should track errors', () => {
      const error1 = new Error('Test error 1')
      const error2 = new SearchExecutionError('Search failed')
      
      monitor.recordError(error1, false)
      monitor.recordError(error2, true)
      
      const metrics = monitor.getMetrics()
      expect(metrics.errors).toHaveLength(2)
      expect(metrics.errors[0].type).toBe('Error')
      expect(metrics.errors[0].retryable).toBe(false)
      expect(metrics.errors[1].type).toBe('SearchExecutionError')
      expect(metrics.errors[1].retryable).toBe(true)
    })
  })

  describe('execution time', () => {
    it('should check execution time within limits', () => {
      monitor.startCheckpoint('main')
      expect(monitor.checkExecutionTime()).toBe(true)
    })

    it('should detect execution time exceeded', () => {
      const fastMonitor = new PerformanceMonitor({ maxExecutionTime: 100 })
      fastMonitor.startCheckpoint('main')
      
      // Wait for timeout
      const startTime = Date.now()
      while (Date.now() - startTime < 150) {}
      
      expect(fastMonitor.checkExecutionTime()).toBe(false)
    })
  })

  describe('performance summary', () => {
    it('should generate comprehensive summary', () => {
      // Setup a scenario with various metrics
      monitor.startCheckpoint('main')
      monitor.recordTokenUsage(18000, 'test')
      monitor.recordApiCall('service1')
      monitor.recordApiCall('service2')
      monitor.recordCacheAccess(false)
      monitor.recordCacheAccess(false)
      monitor.recordError(new Error('Test error'))
      
      const summary = monitor.getSummary()
      
      expect(summary.warnings).toContain(
        expect.stringContaining('トークン使用量が上限に近づいています')
      )
      expect(summary.warnings).toContain(
        expect.stringContaining('キャッシュヒット率が低い')
      )
      expect(summary.warnings).toContain(
        expect.stringContaining('1件のエラーが発生')
      )
      
      expect(summary.recommendations).toContain(
        expect.stringContaining('より簡潔なプロンプト')
      )
      expect(summary.recommendations).toContain(
        expect.stringContaining('キャッシュの活用')
      )
    })

    it('should log summary', () => {
      monitor.logSummary()
      
      expect(console.log).toHaveBeenCalledWith('[Performance Summary]')
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Execution Time:'))
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Tokens Used:'))
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('API Calls:'))
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Cache Hit Rate:'))
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Errors:'))
    })
  })
})

describe('LocalLogger', () => {
  let logger: LocalLogger
  const testLogDir = './test-logs'

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock file system
    mockedFs.existsSync.mockReturnValue(false)
    mockedFs.mkdirSync.mockImplementation()
    mockedFs.appendFileSync.mockImplementation()
    mockedFs.readFileSync.mockReturnValue('')
    mockedFs.readdirSync.mockReturnValue([])
    mockedFs.statSync.mockReturnValue({ size: 0, mtime: new Date() } as any)
    
    logger = new LocalLogger(testLogDir)
  })

  describe('initialization', () => {
    it('should create log directory if not exists', () => {
      expect(mockedFs.mkdirSync).toHaveBeenCalledWith(
        testLogDir,
        { recursive: true }
      )
    })

    it('should handle directory creation failure', () => {
      mockedFs.mkdirSync.mockImplementation(() => {
        throw new Error('Permission denied')
      })
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      new LocalLogger(testLogDir)
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to create log directory:',
        expect.any(Error)
      )
      
      consoleSpy.mockRestore()
    })
  })

  describe('logging methods', () => {
    it('should log info message', () => {
      logger.info('Test info message', { data: 'test' })
      
      expect(mockedFs.appendFileSync).toHaveBeenCalledWith(
        expect.stringContaining('.log'),
        expect.stringContaining('"level":"info"'),
        'utf8'
      )
    })

    it('should log warning message', () => {
      logger.warn('Test warning', { severity: 'medium' })
      
      expect(mockedFs.appendFileSync).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('"level":"warn"'),
        'utf8'
      )
    })

    it('should log error message', () => {
      const error = new Error('Test error')
      logger.error('Error occurred', error, { context: 'test' })
      
      const callArgs = mockedFs.appendFileSync.mock.calls[0]
      const logContent = callArgs[1] as string
      const parsed = JSON.parse(logContent.trim())
      
      expect(parsed.level).toBe('error')
      expect(parsed.error.name).toBe('Error')
      expect(parsed.error.message).toBe('Test error')
    })

    it('should log agent execution', () => {
      logger.logAgentExecution(
        'session-123',
        'test-agent',
        'Execution completed',
        { result: 'success' }
      )
      
      const callArgs = mockedFs.appendFileSync.mock.calls[0]
      const logContent = callArgs[1] as string
      const parsed = JSON.parse(logContent.trim())
      
      expect(parsed.sessionId).toBe('session-123')
      expect(parsed.agentName).toBe('test-agent')
      expect(parsed.message).toBe('Execution completed')
    })
  })

  describe('log rotation', () => {
    it('should rotate log when size exceeds limit', () => {
      // Mock large file
      mockedFs.existsSync.mockReturnValue(true)
      mockedFs.statSync.mockReturnValue({ size: 11 * 1024 * 1024 } as any) // 11MB
      mockedFs.renameSync.mockImplementation()
      mockedFs.readdirSync.mockReturnValue([])
      
      logger.info('Test message')
      
      expect(mockedFs.renameSync).toHaveBeenCalled()
    })

    it('should cleanup old rotated logs', () => {
      // Mock many rotated files
      const oldFiles = Array.from({ length: 10 }, (_, i) => 
        `broad-researcher-20240101.log.${1000000000000 + i}`
      )
      
      mockedFs.readdirSync.mockReturnValue(oldFiles)
      mockedFs.statSync.mockReturnValue({ 
        size: 11 * 1024 * 1024,
        mtime: new Date()
      } as any)
      mockedFs.unlinkSync.mockImplementation()
      mockedFs.existsSync.mockReturnValue(true)
      mockedFs.renameSync.mockImplementation()
      
      logger.info('Trigger rotation')
      
      // Should delete all but the 5 most recent
      expect(mockedFs.unlinkSync).toHaveBeenCalledTimes(5)
    })
  })

  describe('log reading', () => {
    it('should read recent logs', () => {
      const mockLogs = [
        JSON.stringify({ level: 'info', message: 'Log 1' }),
        JSON.stringify({ level: 'warn', message: 'Log 2' }),
        JSON.stringify({ level: 'error', message: 'Log 3' })
      ].join('\n')
      
      mockedFs.readFileSync.mockReturnValue(mockLogs)
      mockedFs.existsSync.mockReturnValue(true)
      
      const entries = logger.readRecentLogs(2)
      
      expect(entries).toHaveLength(2)
      expect(entries[0].message).toBe('Log 2')
      expect(entries[1].message).toBe('Log 3')
    })

    it('should handle invalid log lines', () => {
      const mockLogs = [
        JSON.stringify({ level: 'info', message: 'Valid log' }),
        'Invalid JSON',
        JSON.stringify({ level: 'warn', message: 'Another valid log' })
      ].join('\n')
      
      mockedFs.readFileSync.mockReturnValue(mockLogs)
      mockedFs.existsSync.mockReturnValue(true)
      
      const entries = logger.readRecentLogs()
      
      expect(entries).toHaveLength(2) // Only valid entries
    })
  })

  describe('log searching', () => {
    it('should search logs by criteria', () => {
      const mockLogs = [
        JSON.stringify({ 
          level: 'info', 
          sessionId: 'session-1',
          timestamp: new Date().toISOString(),
          message: 'Log 1'
        }),
        JSON.stringify({ 
          level: 'error', 
          sessionId: 'session-2',
          timestamp: new Date().toISOString(),
          message: 'Log 2'
        }),
        JSON.stringify({ 
          level: 'info', 
          sessionId: 'session-1',
          timestamp: new Date().toISOString(),
          message: 'Log 3'
        })
      ].join('\n')
      
      mockedFs.readdirSync.mockReturnValue(['broad-researcher-20240101.log'])
      mockedFs.readFileSync.mockReturnValue(mockLogs)
      
      const results = logger.searchLogs({ sessionId: 'session-1' })
      
      expect(results).toHaveLength(2)
      expect(results.every(r => r.sessionId === 'session-1')).toBe(true)
    })

    it('should filter by level', () => {
      const mockLogs = [
        JSON.stringify({ level: 'info', message: 'Info log', timestamp: new Date().toISOString() }),
        JSON.stringify({ level: 'error', message: 'Error log', timestamp: new Date().toISOString() }),
        JSON.stringify({ level: 'warn', message: 'Warn log', timestamp: new Date().toISOString() })
      ].join('\n')
      
      mockedFs.readdirSync.mockReturnValue(['test.log'])
      mockedFs.readFileSync.mockReturnValue(mockLogs)
      
      const results = logger.searchLogs({ level: 'error' })
      
      expect(results).toHaveLength(1)
      expect(results[0].level).toBe('error')
    })

    it('should filter by date range', () => {
      const now = new Date()
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      
      const mockLogs = [
        JSON.stringify({ 
          level: 'info', 
          message: 'Old log',
          timestamp: yesterday.toISOString()
        }),
        JSON.stringify({ 
          level: 'info', 
          message: 'Current log',
          timestamp: now.toISOString()
        }),
        JSON.stringify({ 
          level: 'info', 
          message: 'Future log',
          timestamp: tomorrow.toISOString()
        })
      ].join('\n')
      
      mockedFs.readdirSync.mockReturnValue(['test.log'])
      mockedFs.readFileSync.mockReturnValue(mockLogs)
      
      const results = logger.searchLogs({ 
        startDate: new Date(now.getTime() - 1000),
        endDate: new Date(now.getTime() + 1000)
      })
      
      expect(results).toHaveLength(1)
      expect(results[0].message).toBe('Current log')
    })

    it('should respect limit', () => {
      const mockLogs = Array.from({ length: 10 }, (_, i) => 
        JSON.stringify({ 
          level: 'info', 
          message: `Log ${i}`,
          timestamp: new Date().toISOString()
        })
      ).join('\n')
      
      mockedFs.readdirSync.mockReturnValue(['test.log'])
      mockedFs.readFileSync.mockReturnValue(mockLogs)
      
      const results = logger.searchLogs({ limit: 5 })
      
      expect(results).toHaveLength(5)
    })
  })

  describe('error handling', () => {
    it('should fallback to console on write error', () => {
      mockedFs.appendFileSync.mockImplementation(() => {
        throw new Error('Disk full')
      })
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      logger.info('Test message')
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to write to log file:',
        expect.any(Error)
      )
      expect(consoleSpy).toHaveBeenCalledWith(
        'Original log entry:',
        expect.objectContaining({ message: 'Test message' })
      )
      
      consoleSpy.mockRestore()
    })

    it('should log to console in development', () => {
      process.env.NODE_ENV = 'development'
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      
      logger.info('Dev log', { debug: true })
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]')
      )
      expect(consoleSpy).toHaveBeenCalledWith(
        'Data:',
        { debug: true }
      )
      
      consoleSpy.mockRestore()
      delete process.env.NODE_ENV
    })
  })
})