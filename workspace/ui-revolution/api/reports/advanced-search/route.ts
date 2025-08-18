/**
 * Advanced Search API with Complex Filtering
 * MVP Worker3 Ultimate Support
 * High-performance with multiple indices
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { FilterBuilder, FilterSchema } from '@/workspace/ui-revolution/lib/search/advanced-filter';

// Advanced search schema with all options
const AdvancedSearchSchema = FilterSchema.extend({
  // Full-text search options
  searchMode: z.enum(['simple', 'phrase', 'fuzzy', 'semantic']).optional(),
  searchLanguage: z.enum(['english', 'japanese', 'auto']).optional(),
  
  // Aggregation options
  includeAggregations: z.boolean().optional(),
  aggregateBy: z.array(z.enum(['status', 'agents', 'tags', 'date'])).optional(),
  
  // Performance options
  useCache: z.boolean().optional(),
  cacheKey: z.string().optional(),
  timeout: z.number().min(100).max(10000).optional()
});

type AdvancedSearchParams = z.infer<typeof AdvancedSearchSchema>;

// Cache manager for ultra-fast responses
class SearchCache {
  private static cache = new Map<string, { data: any; timestamp: number }>();
  private static TTL = 60000; // 1 minute

  static get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  static set(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
    
    // Limit cache size
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  static generateKey(params: AdvancedSearchParams): string {
    return JSON.stringify(params);
  }
}

// Database query executor
class QueryExecutor {
  private db: any; // Supabase client
  
  constructor() {
    // Initialize database connection
    this.initDB();
  }

  private async initDB() {
    // Initialize Supabase or PostgreSQL client
    // For demo, using mock
    this.db = {
      from: (table: string) => ({
        select: () => ({
          textSearch: () => ({
            filter: () => ({
              order: () => ({
                limit: () => ({
                  execute: async () => this.getMockData()
                })
              })
            })
          })
        })
      })
    };
  }

  async executeSearch(params: AdvancedSearchParams): Promise<any> {
    const builder = new FilterBuilder(params);
    const { sql, params: sqlParams } = builder.getQuery();
    
    // For production, execute real SQL
    // const result = await this.db.raw(sql, sqlParams);
    
    // For demo, return optimized mock data
    return this.getOptimizedMockData(params);
  }

  private getMockData() {
    return {
      data: [
        {
          id: '1',
          title: 'Healthcare AI Innovation',
          summary: 'Revolutionary AI-powered diagnostic system',
          content: 'Full report content...',
          status: 'completed',
          score: 95,
          tags: ['healthcare', 'ai', 'innovation'],
          agents: ['researcher', 'analyst', 'writer'],
          created_at: new Date('2024-01-15T10:00:00Z'),
          updated_at: new Date('2024-01-15T14:00:00Z'),
          is_favorite: true
        },
        {
          id: '2',
          title: 'Renewable Energy Solutions',
          summary: 'Sustainable energy business models',
          content: 'Detailed analysis...',
          status: 'in_progress',
          score: 87,
          tags: ['energy', 'sustainable', 'renewable'],
          agents: ['researcher', 'ideator'],
          created_at: new Date('2024-01-14T09:00:00Z'),
          updated_at: new Date('2024-01-15T11:00:00Z'),
          is_favorite: false
        }
      ],
      error: null
    };
  }

  private getOptimizedMockData(params: AdvancedSearchParams) {
    let data = this.getMockData().data;
    
    // Apply filters
    if (params.query) {
      const query = params.query.toLowerCase();
      data = data.filter(item => 
        item.title.toLowerCase().includes(query) ||
        item.summary.toLowerCase().includes(query) ||
        item.tags.some(tag => tag.includes(query))
      );
    }
    
    if (params.status?.length) {
      data = data.filter(item => params.status!.includes(item.status as any));
    }
    
    if (params.scoreMin !== undefined) {
      data = data.filter(item => item.score >= params.scoreMin!);
    }
    
    // Apply sorting
    const sortBy = params.sortBy || 'created_at';
    const sortOrder = params.sortOrder || 'desc';
    
    data.sort((a, b) => {
      const aVal = a[sortBy as keyof typeof a];
      const bVal = b[sortBy as keyof typeof b];
      const comparison = aVal > bVal ? 1 : -1;
      return sortOrder === 'desc' ? -comparison : comparison;
    });
    
    // Apply pagination
    const page = params.page || 1;
    const limit = params.limit || 20;
    const start = (page - 1) * limit;
    const paginatedData = data.slice(start, start + limit);
    
    return {
      data: paginatedData,
      total: data.length,
      page,
      limit,
      totalPages: Math.ceil(data.length / limit)
    };
  }
}

// Aggregation calculator
class AggregationEngine {
  static calculate(data: any[], fields: string[]): Record<string, any> {
    const aggregations: Record<string, any> = {};
    
    if (fields.includes('status')) {
      aggregations.status = this.groupBy(data, 'status');
    }
    
    if (fields.includes('agents')) {
      aggregations.agents = this.flatGroupBy(data, 'agents');
    }
    
    if (fields.includes('tags')) {
      aggregations.tags = this.flatGroupBy(data, 'tags');
    }
    
    if (fields.includes('date')) {
      aggregations.dateRange = {
        min: Math.min(...data.map(d => new Date(d.created_at).getTime())),
        max: Math.max(...data.map(d => new Date(d.created_at).getTime()))
      };
    }
    
    return aggregations;
  }
  
  private static groupBy(data: any[], field: string): Record<string, number> {
    return data.reduce((acc, item) => {
      const key = item[field];
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }
  
  private static flatGroupBy(data: any[], field: string): Record<string, number> {
    return data.reduce((acc, item) => {
      const values = item[field] || [];
      values.forEach((value: string) => {
        acc[value] = (acc[value] || 0) + 1;
      });
      return acc;
    }, {});
  }
}

// Main API handler
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Parse and validate request
    const body = await request.json();
    const params = AdvancedSearchSchema.parse(body);
    
    // Check cache first
    const cacheKey = params.cacheKey || SearchCache.generateKey(params);
    if (params.useCache !== false) {
      const cached = SearchCache.get(cacheKey);
      if (cached) {
        return NextResponse.json({
          ...cached,
          cached: true,
          responseTime: Date.now() - startTime
        });
      }
    }
    
    // Execute search
    const executor = new QueryExecutor();
    const searchResult = await executor.executeSearch(params);
    
    // Calculate aggregations if requested
    let aggregations = null;
    if (params.includeAggregations && params.aggregateBy?.length) {
      aggregations = AggregationEngine.calculate(
        searchResult.data,
        params.aggregateBy
      );
    }
    
    // Prepare response
    const response = {
      success: true,
      data: searchResult.data,
      total: searchResult.total,
      page: searchResult.page,
      limit: searchResult.limit,
      totalPages: searchResult.totalPages,
      aggregations,
      responseTime: Date.now() - startTime,
      cached: false
    };
    
    // Cache the result
    SearchCache.set(cacheKey, response);
    
    // Return with performance headers
    return NextResponse.json(response, {
      headers: {
        'X-Response-Time': `${Date.now() - startTime}ms`,
        'X-Cache-Status': 'MISS',
        'Cache-Control': 'private, max-age=60'
      }
    });
    
  } catch (error) {
    console.error('Advanced search error:', error);
    
    // Return error with details
    return NextResponse.json(
      {
        success: false,
        error: error instanceof z.ZodError
          ? 'Invalid search parameters'
          : 'Search failed',
        details: error instanceof z.ZodError ? error.errors : undefined,
        responseTime: Date.now() - startTime
      },
      { status: 400 }
    );
  }
}

// GET endpoint for simple searches
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const params: AdvancedSearchParams = {
    query: searchParams.get('q') || undefined,
    status: searchParams.get('status')?.split(',') as any,
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '20')
  };
  
  // Delegate to POST handler
  return POST(new NextRequest(request.url, {
    method: 'POST',
    body: JSON.stringify(params)
  }));
}