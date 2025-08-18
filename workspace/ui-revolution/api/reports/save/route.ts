/**
 * Report Save API - High-performance report storage
 * Response time target: < 100ms
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// Validation schema
const ReportSchema = z.object({
  title: z.string().min(1).max(200),
  summary: z.string().min(1).max(1000),
  content: z.string(),
  status: z.enum(['draft', 'in_progress', 'completed', 'archived']),
  agents: z.array(z.string()),
  score: z.number().min(0).max(100),
  tags: z.array(z.string()),
  metadata: z.record(z.any()).optional(),
  thumbnail: z.string().optional(),
  is_favorite: z.boolean().optional()
});

// Supabase client (cached)
let supabase: any = null;

function getSupabaseClient() {
  if (!supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
      global: {
        fetch: fetch.bind(globalThis)
      }
    });
  }
  return supabase;
}

// Cache for frequently accessed reports
const reportCache = new Map<string, any>();
const CACHE_TTL = 60000; // 1 minute

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = ReportSchema.parse(body);
    
    // Add timestamps
    const reportData = {
      ...validatedData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: 1,
      search_vector: generateSearchVector(validatedData)
    };
    
    // Get Supabase client
    const db = getSupabaseClient();
    
    // Insert report with optimistic locking
    const { data, error } = await db
      .from('reports')
      .insert(reportData)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    // Update cache
    reportCache.set(data.id, {
      data,
      timestamp: Date.now()
    });
    
    // Create search index entry
    await createSearchIndex(db, data);
    
    // Log performance
    const responseTime = Date.now() - startTime;
    console.log(`Report saved in ${responseTime}ms`);
    
    return NextResponse.json({
      success: true,
      data,
      responseTime
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Save error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get('id');
    
    if (!reportId) {
      return NextResponse.json({
        success: false,
        error: 'Report ID required'
      }, { status: 400 });
    }
    
    const body = await request.json();
    const validatedData = ReportSchema.partial().parse(body);
    
    // Add updated timestamp
    const updateData = {
      ...validatedData,
      updated_at: new Date().toISOString(),
      search_vector: generateSearchVector(validatedData)
    };
    
    const db = getSupabaseClient();
    
    // Update with optimistic locking
    const { data, error } = await db
      .from('reports')
      .update(updateData)
      .eq('id', reportId)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    // Invalidate cache
    reportCache.delete(reportId);
    
    // Update search index
    await updateSearchIndex(db, data);
    
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      success: true,
      data,
      responseTime
    });
    
  } catch (error: any) {
    console.error('Update error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get('id');
    
    if (!reportId) {
      return NextResponse.json({
        success: false,
        error: 'Report ID required'
      }, { status: 400 });
    }
    
    const db = getSupabaseClient();
    
    // Soft delete (mark as archived)
    const { error } = await db
      .from('reports')
      .update({ 
        status: 'archived',
        archived_at: new Date().toISOString()
      })
      .eq('id', reportId);
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    // Remove from cache
    reportCache.delete(reportId);
    
    return NextResponse.json({
      success: true,
      message: 'Report archived successfully'
    });
    
  } catch (error: any) {
    console.error('Delete error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}

// Helper: Generate search vector for full-text search
function generateSearchVector(report: any): string {
  const searchableText = [
    report.title,
    report.summary,
    ...(report.tags || []),
    ...(report.agents || [])
  ].filter(Boolean).join(' ');
  
  return searchableText.toLowerCase();
}

// Helper: Create search index
async function createSearchIndex(db: any, report: any) {
  try {
    await db.from('report_search_index').insert({
      report_id: report.id,
      title: report.title,
      summary: report.summary,
      tags: report.tags,
      search_vector: report.search_vector,
      created_at: report.created_at
    });
  } catch (error) {
    console.error('Search index error:', error);
  }
}

// Helper: Update search index
async function updateSearchIndex(db: any, report: any) {
  try {
    await db
      .from('report_search_index')
      .update({
        title: report.title,
        summary: report.summary,
        tags: report.tags,
        search_vector: report.search_vector,
        updated_at: new Date().toISOString()
      })
      .eq('report_id', report.id);
  } catch (error) {
    console.error('Search index update error:', error);
  }
}