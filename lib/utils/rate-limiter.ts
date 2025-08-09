/**
 * Rate limiter implementation using token bucket algorithm
 */
export class RateLimiter {
  private requests: number[] = []
  private readonly windowMs: number
  private readonly maxRequests: number

  constructor(maxRequests: number = 100, windowMs: number = 60 * 1000) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
  }

  /**
   * Check if the rate limit allows for a new request
   */
  async checkLimit(): Promise<boolean> {
    const now = Date.now()
    // Remove requests outside the time window
    this.requests = this.requests.filter(time => now - time < this.windowMs)
    
    return this.requests.length < this.maxRequests
  }

  /**
   * Wait if rate limit is exceeded
   */
  async waitIfNeeded(): Promise<void> {
    const now = Date.now()
    this.requests = this.requests.filter(time => now - time < this.windowMs)
    
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0]
      const waitTime = this.windowMs - (now - oldestRequest) + 100 // Add 100ms buffer
      
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }
    
    // Record this request
    this.requests.push(Date.now())
  }

  /**
   * Reset the rate limiter
   */
  reset(): void {
    this.requests = []
  }

  /**
   * Get current request count within the window
   */
  getCurrentCount(): number {
    const now = Date.now()
    this.requests = this.requests.filter(time => now - time < this.windowMs)
    return this.requests.length
  }
}