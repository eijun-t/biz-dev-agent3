/**
 * Report History API
 * 
 * レポート履歴の管理・検索・フィルタリング
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAPILogger } from '@/lib/utils/logger';

const logger = createAPILogger('/api/reports/history');

export const runtime = 'edge';

// レポートの型定義
interface Report {
  id: string;
  title: string;
  description?: string;
  sessionId: string;
  userId: string;
  status: 'draft' | 'processing' | 'completed' | 'failed';
  tags: string[];
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  metadata: {
    wordCount?: number;
    sections?: number;
    agentDurations?: Record<string, number>;
    totalDuration?: number;
  };
  preview?: string;
  url?: string;
}

/**
 * レポート履歴を取得
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // クエリパラメータを解析
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const status = searchParams.get('status');
    const tags = searchParams.get('tags')?.split(',').filter(Boolean);
    const search = searchParams.get('search');
    const isFavorite = searchParams.get('favorite') === 'true';
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // クエリを構築
    let query = supabase
      .from('reports')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id);

    // フィルタリング
    if (status) {
      query = query.eq('status', status);
    }
    
    if (isFavorite) {
      query = query.eq('is_favorite', true);
    }
    
    if (tags && tags.length > 0) {
      query = query.contains('tags', tags);
    }
    
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }
    
    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }
    
    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    // ソート
    const isAscending = sortOrder === 'asc';
    query = query.order(sortBy, { ascending: isAscending });

    // ページネーション
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    // 実行
    const { data: reports, error, count } = await query;

    if (error) {
      logger.error('Failed to fetch reports', error, { userId: user.id });
      return NextResponse.json(
        { error: 'Failed to fetch reports' },
        { status: 500 }
      );
    }

    // 統計情報を計算
    const stats = await calculateStats(user.id);

    // レスポンスを構築
    const response = {
      reports: reports || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      stats,
      filters: {
        status,
        tags,
        search,
        isFavorite,
        dateFrom,
        dateTo
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    logger.error('History API error', error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * レポートを作成
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, description, tags = [], metadata = {} } = body;

    // バリデーション
    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // レポートを作成
    const newReport = {
      id: crypto.randomUUID(),
      title,
      description,
      session_id: crypto.randomUUID(),
      user_id: user.id,
      status: 'draft',
      tags,
      is_favorite: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata
    };

    const { data: report, error } = await supabase
      .from('reports')
      .insert(newReport)
      .select()
      .single();

    if (error) {
      logger.error('Failed to create report', error, { userId: user.id });
      return NextResponse.json(
        { error: 'Failed to create report' },
        { status: 500 }
      );
    }

    logger.info('Report created', { 
      reportId: report.id, 
      userId: user.id 
    });

    return NextResponse.json(report, { status: 201 });

  } catch (error) {
    logger.error('Create report error', error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * レポートを一括更新（タグ、お気に入りなど）
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { reportIds, updates } = body;

    // バリデーション
    if (!reportIds || !Array.isArray(reportIds) || reportIds.length === 0) {
      return NextResponse.json(
        { error: 'Report IDs required' },
        { status: 400 }
      );
    }

    // 許可された更新フィールドのみ
    const allowedUpdates: Record<string, any> = {};
    if ('tags' in updates) allowedUpdates.tags = updates.tags;
    if ('isFavorite' in updates) allowedUpdates.is_favorite = updates.isFavorite;
    if ('status' in updates) allowedUpdates.status = updates.status;

    allowedUpdates.updated_at = new Date().toISOString();

    // 一括更新
    const { data: updatedReports, error } = await supabase
      .from('reports')
      .update(allowedUpdates)
      .in('id', reportIds)
      .eq('user_id', user.id)
      .select();

    if (error) {
      logger.error('Failed to update reports', error, { userId: user.id });
      return NextResponse.json(
        { error: 'Failed to update reports' },
        { status: 500 }
      );
    }

    logger.info('Reports updated', { 
      count: updatedReports?.length || 0,
      userId: user.id 
    });

    return NextResponse.json({
      updated: updatedReports?.length || 0,
      reports: updatedReports
    });

  } catch (error) {
    logger.error('Update reports error', error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * レポートを一括削除
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids')?.split(',').filter(Boolean);

    if (!ids || ids.length === 0) {
      return NextResponse.json(
        { error: 'Report IDs required' },
        { status: 400 }
      );
    }

    // 削除実行
    const { error } = await supabase
      .from('reports')
      .delete()
      .in('id', ids)
      .eq('user_id', user.id);

    if (error) {
      logger.error('Failed to delete reports', error, { userId: user.id });
      return NextResponse.json(
        { error: 'Failed to delete reports' },
        { status: 500 }
      );
    }

    logger.info('Reports deleted', { 
      count: ids.length,
      userId: user.id 
    });

    return NextResponse.json({
      deleted: ids.length,
      ids
    });

  } catch (error) {
    logger.error('Delete reports error', error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * ユーザーの統計情報を計算
 */
async function calculateStats(userId: string): Promise<any> {
  const supabase = await createClient();
  
  // 全レポート数
  const { count: totalReports } = await supabase
    .from('reports')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  // ステータス別
  const { data: statusCounts } = await supabase
    .from('reports')
    .select('status')
    .eq('user_id', userId);

  const statusStats = statusCounts?.reduce((acc, report) => {
    acc[report.status] = (acc[report.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  // お気に入り数
  const { count: favoriteCount } = await supabase
    .from('reports')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_favorite', true);

  // タグ統計
  const { data: tagsData } = await supabase
    .from('reports')
    .select('tags')
    .eq('user_id', userId);

  const tagStats: Record<string, number> = {};
  tagsData?.forEach(report => {
    report.tags?.forEach((tag: string) => {
      tagStats[tag] = (tagStats[tag] || 0) + 1;
    });
  });

  // 今週の作成数
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  const { count: weeklyCount } = await supabase
    .from('reports')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', weekAgo.toISOString());

  return {
    total: totalReports || 0,
    byStatus: statusStats,
    favorites: favoriteCount || 0,
    thisWeek: weeklyCount || 0,
    topTags: Object.entries(tagStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag, count]) => ({ tag, count }))
  };
}