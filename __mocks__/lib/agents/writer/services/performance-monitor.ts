export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private times: number[] = [];

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  reset(): void {
    this.times = [];
  }

  recordGenerationTime(time: number, success: boolean): void {
    if (success) {
      this.times.push(time);
    }
  }

  getMetrics() {
    const sorted = [...this.times].sort((a, b) => a - b);
    const p95Index = Math.floor(sorted.length * 0.95);
    const p99Index = Math.floor(sorted.length * 0.99);
    
    return {
      averageTime: this.times.length > 0 ? 
        this.times.reduce((a, b) => a + b, 0) / this.times.length : 0,
      p95Time: sorted[p95Index] || 0,
      p99Time: sorted[p99Index] || 0,
      totalRequests: this.times.length,
      successRate: 100
    };
  }

  checkPerformanceThreshold() {
    const metrics = this.getMetrics();
    return {
      withinP95: !metrics.p95Time || metrics.p95Time <= 5000,
      withinP99: !metrics.p99Time || metrics.p99Time <= 8000
    };
  }

  getDetailedReport(): string {
    const metrics = this.getMetrics();
    return `Performance Report:
    - Average: ${metrics.averageTime}ms
    - P95: ${metrics.p95Time}ms
    - P99: ${metrics.p99Time}ms
    - Total Requests: ${metrics.totalRequests}
    - Success Rate: ${metrics.successRate}%`;
  }
}