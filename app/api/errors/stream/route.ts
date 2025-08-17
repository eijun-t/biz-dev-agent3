/**
 * Error Stream API
 * 
 * エラー統計データをJSON形式で提供するAPI
 * GET /api/errors/stream
 */

import { NextRequest, NextResponse } from 'next/server';
import { errorMonitor } from '@/lib/utils/error-monitor';
import { createAPILogger } from '@/lib/utils/logger';

const logger = createAPILogger('/api/errors/stream');

export const runtime = 'edge';

/**
 * エラー統計データを取得
 */
export async function GET(request: NextRequest) {
  try {
    // クエリパラメータを取得
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '24h';
    const includePatterns = searchParams.get('patterns') === 'true';
    const includeDetails = searchParams.get('details') === 'true';

    // エラーメトリクスを取得
    const metrics = await errorMonitor.getMetrics();
    const health = errorMonitor.getHealth();
    
    // レスポンスデータを構築
    const responseData: any = {
      timestamp: new Date().toISOString(),
      health: {
        status: health.status,
        message: health.message,
        errorRate: health.errorRate,
        criticalCount: health.criticalCount
      },
      statistics: {
        total: metrics.totalErrors,
        byLevel: metrics.errorsByLevel,
        byAgent: metrics.errorsByAgent,
        errorRate: metrics.errorRate,
        period: period
      },
      progress: {
        consoleErrorMigration: {
          completed: 48,
          total: 85,
          percentage: 56.5,
          target: 74,
          remaining: 37
        },
        todayFixed: 48,
        targetFixed: 63
      }
    };

    // パターン情報を含める場合
    if (includePatterns) {
      const patterns = errorMonitor.getPatterns();
      responseData.patterns = patterns.slice(0, 10).map(p => ({
        pattern: p.pattern,
        count: p.count,
        severity: p.severity,
        lastOccurrence: p.lastOccurrence,
        recommendation: p.recommendation
      }));
    }

    // 詳細情報を含める場合
    if (includeDetails) {
      responseData.recentErrors = metrics.recentErrors.slice(0, 20).map(e => ({
        id: e.id,
        timestamp: e.timestamp,
        level: e.level,
        message: e.message,
        agent: e.agent,
        service: e.service,
        resolved: e.resolved
      }));
      
      responseData.criticalErrors = metrics.criticalErrors.slice(0, 10).map(e => ({
        id: e.id,
        timestamp: e.timestamp,
        message: e.message,
        agent: e.agent,
        context: e.context
      }));
    }

    // 24時間トレンドデータを生成
    const trendData = generateTrendData(period);
    responseData.trend = trendData;

    // キャッシュヘッダーを設定（5秒）
    const response = NextResponse.json(responseData);
    response.headers.set('Cache-Control', 'public, max-age=5');
    response.headers.set('Access-Control-Allow-Origin', '*');
    
    logger.debug('Error stream data provided', {
      period,
      includePatterns,
      includeDetails,
      errorCount: metrics.totalErrors
    });

    return response;
  } catch (error) {
    logger.error('Failed to provide error stream', error as Error);
    
    return NextResponse.json(
      {
        error: 'Failed to fetch error statistics',
        message: (error as Error).message
      },
      { status: 500 }
    );
  }
}

/**
 * トレンドデータを生成
 */
function generateTrendData(period: string): any {
  const now = Date.now();
  const points = period === '1h' ? 12 : period === '6h' ? 36 : 48; // 5分、10分、30分間隔
  const interval = period === '1h' ? 5 * 60 * 1000 : 
                   period === '6h' ? 10 * 60 * 1000 : 
                   30 * 60 * 1000;
  
  const data = [];
  for (let i = points - 1; i >= 0; i--) {
    const timestamp = new Date(now - (i * interval));
    // シミュレーションデータ（実際は時系列データベースから取得）
    const errorCount = Math.floor(Math.random() * 10) + (i < points / 2 ? 15 : 5);
    data.push({
      timestamp: timestamp.toISOString(),
      errors: errorCount,
      rate: errorCount / 5 // 5分あたりのレート
    });
  }
  
  return {
    period,
    interval: interval / 1000, // 秒単位
    data
  };
}

/**
 * CORSプリフライトリクエスト対応
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}