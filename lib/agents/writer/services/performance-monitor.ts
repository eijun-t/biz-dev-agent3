export interface PerformanceMetrics {
  totalGenerationTime: number
  phaseTimings: Record<string, number>
  p95Time?: number
  p99Time?: number
  successRate: number
  averageTime: number
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private generationTimes: number[] = []
  private phaseTimings: Map<string, number[]> = new Map()
  private successCount: number = 0
  private failureCount: number = 0
  private maxSamples: number = 1000

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  recordGenerationTime(time: number, success: boolean = true) {
    this.generationTimes.push(time)
    
    if (this.generationTimes.length > this.maxSamples) {
      this.generationTimes.shift()
    }

    if (success) {
      this.successCount++
    } else {
      this.failureCount++
    }
  }

  recordPhaseTime(phase: string, time: number) {
    if (!this.phaseTimings.has(phase)) {
      this.phaseTimings.set(phase, [])
    }
    
    const phaseTimes = this.phaseTimings.get(phase)!
    phaseTimes.push(time)
    
    if (phaseTimes.length > this.maxSamples) {
      phaseTimes.shift()
    }
  }

  private calculatePercentile(data: number[], percentile: number): number {
    if (data.length === 0) return 0
    
    const sorted = [...data].sort((a, b) => a - b)
    const index = Math.ceil((percentile / 100) * sorted.length) - 1
    return sorted[Math.max(0, index)]
  }

  getMetrics(): PerformanceMetrics {
    const totalRequests = this.successCount + this.failureCount
    const successRate = totalRequests > 0 ? (this.successCount / totalRequests) * 100 : 0
    
    const averageTime = this.generationTimes.length > 0
      ? this.generationTimes.reduce((sum, time) => sum + time, 0) / this.generationTimes.length
      : 0

    const phaseAverages: Record<string, number> = {}
    this.phaseTimings.forEach((times, phase) => {
      if (times.length > 0) {
        phaseAverages[phase] = times.reduce((sum, time) => sum + time, 0) / times.length
      }
    })

    return {
      totalGenerationTime: averageTime,
      phaseTimings: phaseAverages,
      p95Time: this.calculatePercentile(this.generationTimes, 95),
      p99Time: this.calculatePercentile(this.generationTimes, 99),
      successRate,
      averageTime
    }
  }

  checkPerformanceThreshold(): { withinP95: boolean; withinP99: boolean } {
    const metrics = this.getMetrics()
    return {
      withinP95: metrics.p95Time ? metrics.p95Time <= 5000 : true,
      withinP99: metrics.p99Time ? metrics.p99Time <= 8000 : true
    }
  }

  reset() {
    this.generationTimes = []
    this.phaseTimings.clear()
    this.successCount = 0
    this.failureCount = 0
  }

  getDetailedReport(): string {
    const metrics = this.getMetrics()
    const thresholds = this.checkPerformanceThreshold()
    
    let report = '=== Performance Report ===\n'
    report += `Total Requests: ${this.successCount + this.failureCount}\n`
    report += `Success Rate: ${metrics.successRate.toFixed(2)}%\n`
    report += `Average Time: ${metrics.averageTime.toFixed(0)}ms\n`
    report += `P95 Time: ${metrics.p95Time?.toFixed(0)}ms (Target: ≤5000ms) ${thresholds.withinP95 ? '✓' : '✗'}\n`
    report += `P99 Time: ${metrics.p99Time?.toFixed(0)}ms (Target: ≤8000ms) ${thresholds.withinP99 ? '✓' : '✗'}\n`
    
    if (Object.keys(metrics.phaseTimings).length > 0) {
      report += '\n=== Phase Timings ===\n'
      Object.entries(metrics.phaseTimings).forEach(([phase, time]) => {
        report += `${phase}: ${time.toFixed(0)}ms\n`
      })
    }
    
    return report
  }
}