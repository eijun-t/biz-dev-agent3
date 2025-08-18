/**
 * React Query Configuration for Ultra-Fast Caching
 * Target: < 100ms response time with intelligent caching
 */

import { QueryClient, UseQueryOptions } from '@tanstack/react-query';
import { toast } from 'sonner';

// Create optimized Query Client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Aggressive caching strategy
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
      retry: (failureCount, error: any) => {
        // Smart retry logic
        if (error?.status === 404) return false;
        if (error?.status >= 500) return failureCount < 3;
        return failureCount < 2;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
    },
    mutations: {
      retry: 1,
      onError: (error: any) => {
        toast.error(error?.message || 'An error occurred');
      }
    }
  }
});

// Query Keys Factory
export const reportKeys = {
  all: ['reports'] as const,
  lists: () => [...reportKeys.all, 'list'] as const,
  list: (filters: any) => [...reportKeys.lists(), filters] as const,
  details: () => [...reportKeys.all, 'detail'] as const,
  detail: (id: string) => [...reportKeys.details(), id] as const,
  search: (query: string) => [...reportKeys.all, 'search', query] as const,
  favorites: () => [...reportKeys.all, 'favorites'] as const,
  recent: () => [...reportKeys.all, 'recent'] as const,
  popular: () => [...reportKeys.all, 'popular'] as const
};

// API Client with automatic retry and caching
class APIClient {
  private baseURL: string;
  private cache: Map<string, { data: any; timestamp: number }>;
  private cacheTimeout: number = 60000; // 1 minute

  constructor(baseURL: string = '/api') {
    this.baseURL = baseURL;
    this.cache = new Map();
  }

  private getCacheKey(url: string, params?: any): string {
    return `${url}:${JSON.stringify(params || {})}`;
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.cacheTimeout) {
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

  async get<T>(endpoint: string, params?: any): Promise<T> {
    const cacheKey = this.getCacheKey(endpoint, params);
    
    // Check memory cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log('Cache hit:', endpoint);
      return cached;
    }
    
    const url = new URL(`${this.baseURL}${endpoint}`, window.location.origin);
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.append(key, params[key]);
        }
      });
    }
    
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Cache successful response
    this.setCache(cacheKey, data);
    
    return data;
  }

  async post<T>(endpoint: string, body: any): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    
    // Invalidate related caches
    this.invalidateCache(endpoint);
    
    return response.json();
  }

  async put<T>(endpoint: string, body: any): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    
    // Invalidate related caches
    this.invalidateCache(endpoint);
    
    return response.json();
  }

  async delete(endpoint: string): Promise<void> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    
    // Invalidate related caches
    this.invalidateCache(endpoint);
  }

  invalidateCache(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }
    
    Array.from(this.cache.keys()).forEach(key => {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    });
  }
}

export const apiClient = new APIClient();

// Optimized Query Hooks
import { useQuery, useMutation, useInfiniteQuery } from '@tanstack/react-query';

// Get all reports with pagination
export function useReports(filters?: any) {
  return useQuery({
    queryKey: reportKeys.list(filters),
    queryFn: () => apiClient.get('/reports/search', filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    keepPreviousData: true
  });
}

// Get single report
export function useReport(id: string) {
  return useQuery({
    queryKey: reportKeys.detail(id),
    queryFn: () => apiClient.get(`/reports/${id}`),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!id
  });
}

// Search reports
export function useSearchReports(query: string, filters?: any) {
  return useQuery({
    queryKey: reportKeys.search(query),
    queryFn: () => apiClient.get('/reports/search', { q: query, ...filters }),
    staleTime: 1 * 60 * 1000, // 1 minute
    enabled: query.length >= 2,
    keepPreviousData: true
  });
}

// Get favorite reports
export function useFavoriteReports() {
  return useQuery({
    queryKey: reportKeys.favorites(),
    queryFn: () => apiClient.get('/reports/search', { favorite: true }),
    staleTime: 3 * 60 * 1000 // 3 minutes
  });
}

// Get recent reports
export function useRecentReports() {
  return useQuery({
    queryKey: reportKeys.recent(),
    queryFn: () => apiClient.get('/reports/search', { 
      sort: 'created_at',
      order: 'desc',
      limit: 10
    }),
    staleTime: 1 * 60 * 1000 // 1 minute
  });
}

// Infinite scroll for reports
export function useInfiniteReports(filters?: any) {
  return useInfiniteQuery({
    queryKey: reportKeys.list(filters),
    queryFn: ({ pageParam = 1 }) => 
      apiClient.get('/reports/search', { ...filters, page: pageParam }),
    getNextPageParam: (lastPage: any) => 
      lastPage.pagination.hasNextPage ? lastPage.pagination.page + 1 : undefined,
    staleTime: 2 * 60 * 1000,
    keepPreviousData: true
  });
}

// Mutations
export function useSaveReport() {
  return useMutation({
    mutationFn: (report: any) => apiClient.post('/reports/save', report),
    onSuccess: () => {
      queryClient.invalidateQueries(reportKeys.all);
      toast.success('Report saved successfully');
    }
  });
}

export function useUpdateReport() {
  return useMutation({
    mutationFn: ({ id, ...report }: any) => 
      apiClient.put(`/reports/save?id=${id}`, report),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(reportKeys.detail(variables.id));
      queryClient.invalidateQueries(reportKeys.lists());
      toast.success('Report updated successfully');
    }
  });
}

export function useDeleteReport() {
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/reports/save?id=${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(reportKeys.all);
      toast.success('Report deleted successfully');
    }
  });
}

// Prefetching utilities
export async function prefetchReport(id: string) {
  await queryClient.prefetchQuery({
    queryKey: reportKeys.detail(id),
    queryFn: () => apiClient.get(`/reports/${id}`),
    staleTime: 5 * 60 * 1000
  });
}

export async function prefetchReports(filters?: any) {
  await queryClient.prefetchQuery({
    queryKey: reportKeys.list(filters),
    queryFn: () => apiClient.get('/reports/search', filters),
    staleTime: 2 * 60 * 1000
  });
}

// Optimistic updates
export function optimisticUpdate<T>(
  queryKey: any[],
  updater: (old: T) => T
): void {
  queryClient.setQueryData(queryKey, updater);
}

// Background refetch
export function setupBackgroundRefetch() {
  // Refetch important queries in background
  setInterval(() => {
    queryClient.invalidateQueries(reportKeys.recent());
    queryClient.invalidateQueries(reportKeys.popular());
  }, 5 * 60 * 1000); // Every 5 minutes
}

// Export for use in components
export default {
  queryClient,
  reportKeys,
  apiClient,
  useReports,
  useReport,
  useSearchReports,
  useFavoriteReports,
  useRecentReports,
  useInfiniteReports,
  useSaveReport,
  useUpdateReport,
  useDeleteReport,
  prefetchReport,
  prefetchReports,
  optimisticUpdate,
  setupBackgroundRefetch
};