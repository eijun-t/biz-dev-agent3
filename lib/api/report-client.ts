/**
 * Report API Client for Worker1 Integration
 * MVP Worker3 Support - Complete Frontend Integration
 * With error handling, caching, and retry logic
 */

import { z } from 'zod';
import { FilterCriteria } from '../search/advanced-filter';

// Response schemas
const SearchResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(z.any()),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
  aggregations: z.any().optional(),
  responseTime: z.number(),
  cached: z.boolean()
});

const CompareResponseSchema = z.object({
  success: z.boolean(),
  reportIds: z.array(z.string()),
  comparison: z.any(),
  similarity: z.number(),
  summary: z.string(),
  responseTime: z.number()
});

type SearchResponse = z.infer<typeof SearchResponseSchema>;
type CompareResponse = z.infer<typeof CompareResponseSchema>;

/**
 * API Client Configuration
 */
interface ApiConfig {
  baseUrl?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  cacheEnabled?: boolean;
  cacheTTL?: number;
}

/**
 * Frontend Cache Manager
 */
class FrontendCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private ttl: number;

  constructor(ttl: number = 60000) {
    this.ttl = ttl;
  }

  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    console.log(`✅ Cache hit: ${key}`);
    return cached.data;
  }

  set(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
    
    // Limit cache size
    if (this.cache.size > 50) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  clear(): void {
    this.cache.clear();
  }

  generateKey(endpoint: string, params: any): string {
    return `${endpoint}:${JSON.stringify(params)}`;
  }
}

/**
 * Report API Client
 * Complete integration support for Worker1
 */
export class ReportApiClient {
  private config: Required<ApiConfig>;
  private cache: FrontendCache;
  private abortControllers = new Map<string, AbortController>();

  constructor(config: ApiConfig = {}) {
    this.config = {
      baseUrl: config.baseUrl || '/api/reports',
      timeout: config.timeout || 10000,
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000,
      cacheEnabled: config.cacheEnabled !== false,
      cacheTTL: config.cacheTTL || 60000
    };

    this.cache = new FrontendCache(this.config.cacheTTL);
  }

  /**
   * Advanced search with all features
   */
  async search(criteria: FilterCriteria): Promise<SearchResponse> {
    const endpoint = `${this.config.baseUrl}/advanced-search`;
    const cacheKey = this.cache.generateKey(endpoint, criteria);

    // Check cache first
    if (this.config.cacheEnabled) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return { ...cached, cached: true };
      }
    }

    try {
      const response = await this.fetchWithRetry(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...criteria,
          useCache: this.config.cacheEnabled
        })
      });

      const data = SearchResponseSchema.parse(response);

      // Cache successful response
      if (this.config.cacheEnabled && data.success) {
        this.cache.set(cacheKey, data);
      }

      return data;
    } catch (error) {
      console.error('Search failed:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Compare multiple reports
   */
  async compareReports(
    reportIds: string[],
    options: {
      compareFields?: string[];
      diffMode?: 'unified' | 'split' | 'inline';
    } = {}
  ): Promise<CompareResponse> {
    const endpoint = `${this.config.baseUrl}/compare`;
    
    try {
      const response = await this.fetchWithRetry(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportIds,
          ...options
        })
      });

      return CompareResponseSchema.parse(response);
    } catch (error) {
      console.error('Comparison failed:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Export reports to various formats
   */
  async exportReports(
    reportIds: string[],
    format: 'pdf' | 'excel' | 'csv' | 'json',
    options: any = {}
  ): Promise<Blob> {
    const endpoint = `${this.config.baseUrl}/export`;
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportIds,
          format,
          options
        })
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Export failed:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Save or update a report
   */
  async saveReport(report: any): Promise<{ id: string; success: boolean }> {
    const endpoint = `${this.config.baseUrl}/save`;
    
    try {
      const response = await this.fetchWithRetry(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report)
      });

      // Clear cache on successful save
      if (response.success) {
        this.cache.clear();
      }

      return response;
    } catch (error) {
      console.error('Save failed:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get report by ID
   */
  async getReport(id: string): Promise<any> {
    const endpoint = `${this.config.baseUrl}/${id}`;
    const cacheKey = this.cache.generateKey(endpoint, { id });

    // Check cache
    if (this.config.cacheEnabled) {
      const cached = this.cache.get(cacheKey);
      if (cached) return cached;
    }

    try {
      const response = await this.fetchWithRetry(endpoint, {
        method: 'GET'
      });

      // Cache response
      if (this.config.cacheEnabled) {
        this.cache.set(cacheKey, response);
      }

      return response;
    } catch (error) {
      console.error('Get report failed:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Delete report
   */
  async deleteReport(id: string): Promise<{ success: boolean }> {
    const endpoint = `${this.config.baseUrl}/${id}`;
    
    try {
      const response = await this.fetchWithRetry(endpoint, {
        method: 'DELETE'
      });

      // Clear cache on successful delete
      if (response.success) {
        this.cache.clear();
      }

      return response;
    } catch (error) {
      console.error('Delete failed:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Batch operations
   */
  async batchOperation(
    operation: 'delete' | 'archive' | 'restore',
    reportIds: string[]
  ): Promise<{ success: boolean; affected: number }> {
    const endpoint = `${this.config.baseUrl}/batch`;
    
    try {
      const response = await this.fetchWithRetry(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation,
          reportIds
        })
      });

      // Clear cache on successful batch operation
      if (response.success) {
        this.cache.clear();
      }

      return response;
    } catch (error) {
      console.error('Batch operation failed:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Fetch with retry logic
   */
  private async fetchWithRetry(
    url: string,
    options: RequestInit = {}
  ): Promise<any> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.config.retryAttempts; attempt++) {
      try {
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          this.config.timeout
        );

        // Store controller for potential cancellation
        const requestId = `${url}-${Date.now()}`;
        this.abortControllers.set(requestId, controller);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        this.abortControllers.delete(requestId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      } catch (error: any) {
        lastError = error;
        console.warn(`Attempt ${attempt + 1} failed:`, error.message);

        // Don't retry on client errors
        if (error.message.includes('400') || error.message.includes('404')) {
          throw error;
        }

        // Wait before retry
        if (attempt < this.config.retryAttempts - 1) {
          await this.delay(this.config.retryDelay * Math.pow(2, attempt));
        }
      }
    }

    throw lastError || new Error('Request failed after retries');
  }

  /**
   * Handle and transform errors
   */
  private handleError(error: any): Error {
    if (error.name === 'AbortError') {
      return new Error('Request timeout');
    }
    
    if (error instanceof z.ZodError) {
      return new Error('Invalid response format');
    }
    
    if (error.message.includes('fetch')) {
      return new Error('Network error - please check your connection');
    }
    
    return error;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cancel all pending requests
   */
  cancelAll(): void {
    this.abortControllers.forEach(controller => controller.abort());
    this.abortControllers.clear();
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hits: number; misses: number } {
    return {
      size: this.cache['cache'].size,
      hits: 0, // Would need to track this
      misses: 0 // Would need to track this
    };
  }
}

// Export singleton instance
export const reportApi = new ReportApiClient();

// Export types
export type { SearchResponse, CompareResponse, ApiConfig };