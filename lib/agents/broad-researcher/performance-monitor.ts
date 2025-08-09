/**
 * Performance monitoring for Broad Researcher Agent
 */

import { AgentMetrics } from '@/lib/types/agents'

/**
 * Performance thresholds
 */
export interface PerformanceThresholds {
  maxExecutionTime: number      // Maximum execution time in ms
  maxTokensPerRequest: number   // Maximum tokens per LLM request
  maxTotalTokens: number        // Maximum total tokens
  maxApiCalls: number           // Maximum API calls
  minCacheHitRate: number       // Minimum cache hit rate percentage
}

/**
 * Performance metrics collector
 */
export class PerformanceMonitor {
  private metrics: AgentMetrics
  private thresholds: PerformanceThresholds
  private checkpoints: Map<string, number> = new Map()

  constructor(thresholds?: Partial<PerformanceThresholds>) {
    this.thresholds = {
      maxExecutionTime: 30000,        // 30 seconds
      maxTokensPerRequest: 4000,      // GPT-4 limit
      maxTotalTokens: 20000,          // Total token budget
      maxApiCalls: 50,                // API call limit
      minCacheHitRate: 30,            // 30% minimum cache hit rate
      ...thresholds
    }

    this.metrics = {
      executionTime: 0,
      tokensUsed: 0,
      apiCallsCount: 0,
      cacheHitRate: 0,
      errors: []
    }
  }

  /**
   * Start a performance checkpoint
   */
  startCheckpoint(name: string): void {
    this.checkpoints.set(name, Date.now())
  }

  /**
   * End a checkpoint and return duration
   */
  endCheckpoint(name: string): number {
    const startTime = this.checkpoints.get(name)
    if (!startTime) {
      console.warn(`No checkpoint found for: ${name}`)
      return 0
    }

    const duration = Date.now() - startTime
    this.checkpoints.delete(name)
    
    console.log(`[Performance] ${name}: ${duration}ms`)
    return duration
  }

  /**
   * Record token usage
   */
  recordTokenUsage(tokens: number, operation: string): void {
    this.metrics.tokensUsed += tokens
    
    if (tokens > this.thresholds.maxTokensPerRequest) {
      console.warn(
        `[Performance] High token usage in ${operation}: ${tokens} tokens`
      )
    }

    if (this.metrics.tokensUsed > this.thresholds.maxTotalTokens) {
      console.error(
        `[Performance] Total token limit exceeded: ${this.metrics.tokensUsed}`
      )
    }
  }

  /**
   * Record API call
   */
  recordApiCall(service: string): void {
    this.metrics.apiCallsCount++
    
    if (this.metrics.apiCallsCount > this.thresholds.maxApiCalls) {
      console.warn(
        `[Performance] API call limit exceeded: ${this.metrics.apiCallsCount} calls`
      )
    }
  }

  /**
   * Record cache hit/miss
   */
  recordCacheAccess(hit: boolean): void {
    // Simple moving average for cache hit rate
    const alpha = 0.1 // Smoothing factor
    const hitValue = hit ? 100 : 0
    
    if (this.metrics.cacheHitRate === 0) {
      this.metrics.cacheHitRate = hitValue
    } else {
      this.metrics.cacheHitRate = 
        alpha * hitValue + (1 - alpha) * this.metrics.cacheHitRate
    }
  }

  /**
   * Record error
   */
  recordError(error: Error, retryable: boolean = false): void {
    this.metrics.errors.push({
      timestamp: new Date(),
      type: error.constructor.name,
      message: error.message,
      retryable
    })

    console.error(`[Performance] Error recorded: ${error.message}`)
  }

  /**
   * Check if execution time is within limits
   */
  checkExecutionTime(): boolean {
    const elapsed = this.getElapsedTime()
    return elapsed < this.thresholds.maxExecutionTime
  }

  /**
   * Get elapsed time since monitoring started
   */
  private getElapsedTime(): number {
    const mainCheckpoint = this.checkpoints.get('main')
    return mainCheckpoint ? Date.now() - mainCheckpoint : 0
  }

  /**
   * Get current metrics
   */
  getMetrics(): AgentMetrics {
    return {
      ...this.metrics,
      executionTime: this.getElapsedTime()
    }
  }

  /**
   * Get performance summary
   */
  getSummary(): {
    metrics: AgentMetrics
    warnings: string[]
    recommendations: string[]
  } {
    const warnings: string[] = []
    const recommendations: string[] = []

    // Check execution time
    if (this.metrics.executionTime > this.thresholds.maxExecutionTime) {
      warnings.push(
        `実行時間が上限を超過: ${this.metrics.executionTime}ms > ${this.thresholds.maxExecutionTime}ms`
      )
      recommendations.push('検索クエリ数を減らすか、検索結果数を制限してください')
    }

    // Check token usage
    if (this.metrics.tokensUsed > this.thresholds.maxTotalTokens * 0.8) {
      warnings.push(
        `トークン使用量が上限に近づいています: ${this.metrics.tokensUsed}`
      )
      recommendations.push('より簡潔なプロンプトを使用してください')
    }

    // Check API calls
    if (this.metrics.apiCallsCount > this.thresholds.maxApiCalls * 0.8) {
      warnings.push(
        `API呼び出し数が上限に近づいています: ${this.metrics.apiCallsCount}`
      )
      recommendations.push('キャッシュの活用を検討してください')
    }

    // Check cache hit rate
    if (this.metrics.cacheHitRate < this.thresholds.minCacheHitRate) {
      warnings.push(
        `キャッシュヒット率が低い: ${this.metrics.cacheHitRate.toFixed(1)}%`
      )
      recommendations.push('類似の検索を繰り返す場合はキャッシュが効果的です')
    }

    // Check errors
    if (this.metrics.errors.length > 0) {
      warnings.push(`${this.metrics.errors.length}件のエラーが発生しました`)
      
      const retryableErrors = this.metrics.errors.filter(e => e.retryable).length
      if (retryableErrors > 0) {
        recommendations.push(
          `${retryableErrors}件のエラーはリトライ可能です`
        )
      }
    }

    return {
      metrics: this.getMetrics(),
      warnings,
      recommendations
    }
  }

  /**
   * Log performance summary
   */
  logSummary(): void {
    const summary = this.getSummary()
    
    console.log('[Performance Summary]')
    console.log(`- Execution Time: ${summary.metrics.executionTime}ms`)
    console.log(`- Tokens Used: ${summary.metrics.tokensUsed}`)
    console.log(`- API Calls: ${summary.metrics.apiCallsCount}`)
    console.log(`- Cache Hit Rate: ${summary.metrics.cacheHitRate.toFixed(1)}%`)
    console.log(`- Errors: ${summary.metrics.errors.length}`)

    if (summary.warnings.length > 0) {
      console.warn('[Warnings]')
      summary.warnings.forEach(w => console.warn(`- ${w}`))
    }

    if (summary.recommendations.length > 0) {
      console.log('[Recommendations]')
      summary.recommendations.forEach(r => console.log(`- ${r}`))
    }
  }
}