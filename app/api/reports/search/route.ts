/**
 * Report Search API - Ultra-fast search with caching
 * Response time target: < 50ms for cached, < 100ms for fresh
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Search cache with LRU eviction
class SearchCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private maxSize = 100;
  private ttl = 300000; // 5 minutes
  
  get(key: string) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }
  
  set(key: string, data: any) {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
  
  clear() {
    this.cache.clear();
  }
}

const searchCache = new SearchCache();
let supabase: any = null;

function getSupabaseClient() {
  if (!supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });
  }
  return supabase;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract search parameters
    const query = searchParams.get('q') || '';
    const status = searchParams.get('status');
    const tags = searchParams.get('tags')?.split(',').filter(Boolean);
    const agents = searchParams.get('agents')?.split(',').filter(Boolean);
    const dateFrom = searchParams.get('from');
    const dateTo = searchParams.get('to');
    const isFavorite = searchParams.get('favorite') === 'true';
    const sortBy = searchParams.get('sort') || 'created_at';
    const order = searchParams.get('order') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = (page - 1) * limit;
    
    // Generate cache key
    const cacheKey = JSON.stringify({
      query, status, tags, agents, dateFrom, dateTo, 
      isFavorite, sortBy, order, page, limit
    });
    
    // Check cache
    const cached = searchCache.get(cacheKey);
    if (cached) {
      return NextResponse.json({
        success: true,
        ...cached,
        cached: true,
        responseTime: Date.now() - startTime
      });
    }
    
    const db = getSupabaseClient();
    
    // Build query
    let dbQuery = db.from('reports').select('*', { count: 'exact' });
    
    // Full-text search
    if (query) {
      dbQuery = dbQuery.textSearch('search_vector', query, {
        type: 'websearch',
        config: 'english'
      });
    }
    
    // Status filter
    if (status) {
      dbQuery = dbQuery.eq('status', status);
    }
    
    // Tags filter (ANY match)
    if (tags && tags.length > 0) {
      dbQuery = dbQuery.contains('tags', tags);
    }
    
    // Agents filter (ALL match)
    if (agents && agents.length > 0) {
      dbQuery = dbQuery.contains('agents', agents);
    }
    
    // Date range filter
    if (dateFrom) {
      dbQuery = dbQuery.gte('created_at', dateFrom);
    }
    if (dateTo) {
      dbQuery = dbQuery.lte('created_at', dateTo);
    }
    
    // Favorite filter
    if (isFavorite) {
      dbQuery = dbQuery.eq('is_favorite', true);
    }
    
    // Sorting
    const validSortFields = ['created_at', 'updated_at', 'score', 'title'];
    if (validSortFields.includes(sortBy)) {
      dbQuery = dbQuery.order(sortBy, { ascending: order === 'asc' });
    }
    
    // Pagination
    dbQuery = dbQuery.range(offset, offset + limit - 1);
    
    // Execute query
    const { data: reports, error, count } = await dbQuery;
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    // Calculate pagination metadata
    const totalPages = Math.ceil((count || 0) / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    // Prepare response
    const response = {
      data: reports || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNextPage,
        hasPrevPage
      },
      filters: {
        query,
        status,
        tags,
        agents,
        dateFrom,
        dateTo,
        isFavorite
      }
    };
    
    // Cache the response
    searchCache.set(cacheKey, response);
    
    const responseTime = Date.now() - startTime;
    console.log(`Search completed in ${responseTime}ms`);
    
    return NextResponse.json({
      success: true,
      ...response,
      cached: false,
      responseTime
    });
    
  } catch (error: any) {
    console.error('Search error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}

// Autocomplete endpoint for quick suggestions
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { query, field = 'title' } = await request.json();
    
    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        suggestions: []
      });
    }
    
    const cacheKey = `autocomplete:${field}:${query}`;
    const cached = searchCache.get(cacheKey);
    
    if (cached) {
      return NextResponse.json({
        success: true,
        suggestions: cached,
        cached: true,
        responseTime: Date.now() - startTime
      });
    }
    
    const db = getSupabaseClient();
    
    // Get suggestions based on field
    let suggestions: string[] = [];
    
    switch (field) {
      case 'title':
        const { data: titles } = await db
          .from('reports')
          .select('title')
          .ilike('title', `${query}%`)
          .limit(10);
        suggestions = titles?.map((r: any) => r.title) || [];
        break;
        
      case 'tags':
        const { data: reports } = await db
          .from('reports')
          .select('tags')
          .contains('tags', [query])
          .limit(20);
        
        const tagSet = new Set<string>();
        reports?.forEach((r: any) => {
          r.tags?.forEach((tag: string) => {
            if (tag.toLowerCase().includes(query.toLowerCase())) {
              tagSet.add(tag);
            }
          });
        });
        suggestions = Array.from(tagSet).slice(0, 10);
        break;
    }
    
    // Cache suggestions
    searchCache.set(cacheKey, suggestions);
    
    return NextResponse.json({
      success: true,
      suggestions,
      cached: false,
      responseTime: Date.now() - startTime
    });
    
  } catch (error: any) {
    console.error('Autocomplete error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}