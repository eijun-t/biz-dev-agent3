/**
 * High-Performance Data Fetching System
 * Emergency API Integration by Worker3
 * Optimized for real-time data delivery
 */

import { QueryClient } from '@tanstack/react-query';
import { z } from 'zod';

// API Configuration
const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || '/api',
  timeout: 10000,
  retryAttempts: 3,
  cacheTime: 300000, // 5 minutes
  staleTime: 60000,  // 1 minute
};

// Response schemas for type safety
const AgentStateSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(['idle', 'processing', 'completed', 'error']),
  progress: z.number().min(0).max(100),
  metrics: z.object({
    inputTokens: z.number(),
    outputTokens: z.number(),
    processingTime: z.number(),
    accuracy: z.number().optional()
  }).optional(),
  lastUpdate: z.string()
});

const PipelineDataSchema = z.object({
  pipelineId: z.string(),
  status: z.enum(['idle', 'running', 'completed', 'failed']),
  agents: z.array(AgentStateSchema),
  totalProgress: z.number(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  metrics: z.object({
    totalTime: z.number(),
    throughput: z.number(),
    errorRate: z.number()
  }).optional()
});

type AgentState = z.infer<typeof AgentStateSchema>;
type PipelineData = z.infer<typeof PipelineDataSchema>;

/**
 * Optimized Data Fetcher with intelligent caching
 */
export class DataFetcher {
  private static instance: DataFetcher;
  private queryClient: QueryClient;
  private cache: Map<string, { data: any; timestamp: number }>;
  private pendingRequests: Map<string, Promise<any>>;
  
  private constructor() {
    this.queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: API_CONFIG.staleTime,
          cacheTime: API_CONFIG.cacheTime,
          retry: API_CONFIG.retryAttempts,
          refetchOnWindowFocus: false,
          refetchOnReconnect: 'always'
        }
      }
    });
    
    this.cache = new Map();
    this.pendingRequests = new Map();
    
    // Preload critical data
    this.preloadCriticalData();
  }
  
  static getInstance(): DataFetcher {
    if (!DataFetcher.instance) {
      DataFetcher.instance = new DataFetcher();
    }
    return DataFetcher.instance;
  }
  
  /**
   * Fetch agent states with optimistic updates
   */
  async fetchAgentStates(): Promise<AgentState[]> {
    const cacheKey = 'agent-states';
    
    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;
    
    // Check for pending request
    const pending = this.pendingRequests.get(cacheKey);
    if (pending) return pending;
    
    // Create new request
    const request = this.performFetch<AgentState[]>(
      `${API_CONFIG.baseUrl}/agents/states`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }
    ).then(data => {
      this.setCache(cacheKey, data);
      this.pendingRequests.delete(cacheKey);
      return data;
    });
    
    this.pendingRequests.set(cacheKey, request);
    return request;
  }
  
  /**
   * Fetch pipeline data with real-time updates
   */
  async fetchPipelineData(pipelineId?: string): Promise<PipelineData> {
    const endpoint = pipelineId 
      ? `${API_CONFIG.baseUrl}/pipeline/${pipelineId}`
      : `${API_CONFIG.baseUrl}/pipeline/current`;
    
    const response = await this.performFetch<PipelineData>(endpoint);
    return PipelineDataSchema.parse(response);
  }
  
  /**
   * Batch fetch for multiple resources
   */
  async batchFetch(requests: Array<{ key: string; url: string }>): Promise<Map<string, any>> {
    const results = new Map<string, any>();
    
    // Group cacheable vs non-cacheable
    const cached: Array<{ key: string; data: any }> = [];
    const toFetch: Array<{ key: string; url: string }> = [];
    
    requests.forEach(req => {
      const cachedData = this.getFromCache(req.key);
      if (cachedData) {
        cached.push({ key: req.key, data: cachedData });
      } else {
        toFetch.push(req);
      }
    });
    
    // Add cached results
    cached.forEach(item => results.set(item.key, item.data));
    
    // Fetch remaining in parallel
    if (toFetch.length > 0) {
      const promises = toFetch.map(req => 
        this.performFetch(req.url)
          .then(data => {
            this.setCache(req.key, data);
            return { key: req.key, data };
          })
      );
      
      const fetched = await Promise.all(promises);
      fetched.forEach(item => results.set(item.key, item.data));
    }
    
    return results;
  }
  
  /**
   * Stream data for real-time updates
   */
  streamData(endpoint: string, onData: (data: any) => void): () => void {
    const eventSource = new EventSource(`${API_CONFIG.baseUrl}${endpoint}`);
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onData(data);
        
        // Update cache with streamed data
        const cacheKey = `stream-${endpoint}`;
        this.setCache(cacheKey, data);
      } catch (error) {
        console.error('Stream parse error:', error);
      }
    };
    
    eventSource.onerror = (error) => {
      console.error('Stream error:', error);
      eventSource.close();
    };
    
    // Return cleanup function
    return () => eventSource.close();
  }
  
  /**
   * Optimized fetch with retry and timeout
   */
  private async performFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data as T;
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      
      throw error;
    }
  }
  
  /**
   * Cache management
   */
  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    const age = Date.now() - cached.timestamp;
    if (age > API_CONFIG.staleTime) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }
  
  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    
    // Limit cache size
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }
  
  /**
   * Preload critical data for instant UI
   */
  private async preloadCriticalData(): Promise<void> {
    const criticalEndpoints = [
      '/agents/states',
      '/pipeline/current',
      '/reports/recent'
    ];
    
    // Preload in parallel
    await Promise.all(
      criticalEndpoints.map(endpoint => 
        this.performFetch(`${API_CONFIG.baseUrl}${endpoint}`)
          .then(data => this.setCache(endpoint, data))
          .catch(err => console.warn(`Preload failed for ${endpoint}:`, err))
      )
    );
  }
  
  /**
   * Clear all caches
   */
  clearCache(): void {
    this.cache.clear();
    this.queryClient.clear();
  }
  
  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    hits: number;
    misses: number;
    hitRate: number;
  } {
    // In production, track hits/misses
    const size = this.cache.size;
    return {
      size,
      hits: 0,  // Would track in production
      misses: 0, // Would track in production
      hitRate: 0
    };
  }
}

// Export singleton instance
export const dataFetcher = DataFetcher.getInstance();

// Export types
export type { AgentState, PipelineData };