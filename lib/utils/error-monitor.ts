/**
 * Error Monitoring System
 * 
 * エラーの収集、分析、レポーティングを行う統合監視システム
 */

import { createServiceLogger, LogLevel, LogEntry } from './logger';
import { createClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface ErrorMetrics {
  totalErrors: number;
  errorsByLevel: Record<LogLevel, number>;
  errorsByAgent: Record<string, number>;
  errorsByType: Record<string, number>;
  errorRate: number; // errors per minute
  criticalErrors: ErrorDetail[];
  recentErrors: ErrorDetail[];
}

export interface ErrorDetail {
  id: string;
  timestamp: Date;
  level: LogLevel;
  message: string;
  agent?: string;
  service?: string;
  context?: Record<string, any>;
  stack?: string;
  sessionId?: string;
  userId?: string;
  resolved: boolean;
}

export interface ErrorPattern {
  pattern: string;
  count: number;
  lastOccurrence: Date;
  agents: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendation?: string;
}

/**
 * エラーモニタリングサービス
 */
export class ErrorMonitor {
  private static instance: ErrorMonitor;
  private logger = createServiceLogger('ErrorMonitor');
  private supabase: SupabaseClient | null = null;
  private errors: ErrorDetail[] = [];
  private patterns: Map<string, ErrorPattern> = new Map();
  private metricsCache: ErrorMetrics | null = null;
  private lastMetricsUpdate: Date = new Date(0);
  private readonly METRICS_CACHE_TTL = 60000; // 1 minute

  private constructor() {
    this.initializeSupabase();
    this.startPeriodicAnalysis();
  }

  public static getInstance(): ErrorMonitor {
    if (!ErrorMonitor.instance) {
      ErrorMonitor.instance = new ErrorMonitor();
    }
    return ErrorMonitor.instance;
  }

  /**
   * Supabase初期化
   */
  private async initializeSupabase() {
    try {
      this.supabase = await createClient();
    } catch (error) {
      this.logger.warn('Failed to initialize Supabase for error monitoring', {
        error: (error as Error).message
      });
    }
  }

  /**
   * エラーを記録
   */
  public async logError(detail: Omit<ErrorDetail, 'id' | 'timestamp' | 'resolved'>): Promise<void> {
    const errorDetail: ErrorDetail = {
      ...detail,
      id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      resolved: false
    };

    // メモリに保存
    this.errors.push(errorDetail);
    this.updatePatterns(errorDetail);

    // Critical/Errorレベルはデータベースに保存
    if (this.supabase && (detail.level === LogLevel.ERROR)) {
      try {
        await this.supabase
          .from('error_logs')
          .insert({
            error_id: errorDetail.id,
            timestamp: errorDetail.timestamp.toISOString(),
            level: errorDetail.level,
            message: errorDetail.message,
            agent: errorDetail.agent,
            service: errorDetail.service,
            context: errorDetail.context,
            stack: errorDetail.stack,
            session_id: errorDetail.sessionId,
            user_id: errorDetail.userId
          });
      } catch (dbError) {
        this.logger.debug('Failed to save error to database', {
          error: (dbError as Error).message
        });
      }
    }

    // メトリクスキャッシュを無効化
    this.metricsCache = null;
  }

  /**
   * エラーパターンを更新
   */
  private updatePatterns(error: ErrorDetail): void {
    // エラーメッセージからパターンを抽出
    const patternKey = this.extractPattern(error.message);
    
    if (this.patterns.has(patternKey)) {
      const pattern = this.patterns.get(patternKey)!;
      pattern.count++;
      pattern.lastOccurrence = error.timestamp;
      if (error.agent && !pattern.agents.includes(error.agent)) {
        pattern.agents.push(error.agent);
      }
      // 頻度に基づいて重要度を更新
      if (pattern.count > 10) pattern.severity = 'critical';
      else if (pattern.count > 5) pattern.severity = 'high';
      else if (pattern.count > 2) pattern.severity = 'medium';
    } else {
      this.patterns.set(patternKey, {
        pattern: patternKey,
        count: 1,
        lastOccurrence: error.timestamp,
        agents: error.agent ? [error.agent] : [],
        severity: 'low',
        recommendation: this.generateRecommendation(patternKey)
      });
    }
  }

  /**
   * エラーメッセージからパターンを抽出
   */
  private extractPattern(message: string): string {
    // 数値、ID、URLなどを正規化
    return message
      .replace(/\b\d+\b/g, '[NUM]')
      .replace(/\b[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\b/gi, '[UUID]')
      .replace(/https?:\/\/[^\s]+/g, '[URL]')
      .replace(/\/[^\s]+/g, '[PATH]')
      .substring(0, 100); // 最初の100文字で比較
  }

  /**
   * パターンに基づく推奨事項を生成
   */
  private generateRecommendation(pattern: string): string {
    if (pattern.includes('timeout')) {
      return 'タイムアウト値の増加またはパフォーマンス最適化を検討';
    }
    if (pattern.includes('connection') || pattern.includes('network')) {
      return 'ネットワーク接続の安定性確認とリトライ機構の実装';
    }
    if (pattern.includes('authentication') || pattern.includes('unauthorized')) {
      return '認証フローの確認とトークン管理の改善';
    }
    if (pattern.includes('validation')) {
      return '入力検証ロジックの強化';
    }
    if (pattern.includes('rate limit')) {
      return 'レート制限の調整またはキャッシュ戦略の実装';
    }
    return '詳細な調査が必要';
  }

  /**
   * エラーメトリクスを取得
   */
  public async getMetrics(): Promise<ErrorMetrics> {
    const now = new Date();
    
    // キャッシュが有効な場合は返す
    if (this.metricsCache && 
        (now.getTime() - this.lastMetricsUpdate.getTime()) < this.METRICS_CACHE_TTL) {
      return this.metricsCache;
    }

    // 直近24時間のエラーのみを対象
    const cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const recentErrors = this.errors.filter(e => e.timestamp > cutoffTime);

    // メトリクスを計算
    const metrics: ErrorMetrics = {
      totalErrors: recentErrors.length,
      errorsByLevel: {
        [LogLevel.ERROR]: 0,
        [LogLevel.WARN]: 0,
        [LogLevel.INFO]: 0,
        [LogLevel.DEBUG]: 0
      },
      errorsByAgent: {},
      errorsByType: {},
      errorRate: 0,
      criticalErrors: [],
      recentErrors: []
    };

    // エラーを分類
    recentErrors.forEach(error => {
      // レベル別
      metrics.errorsByLevel[error.level]++;
      
      // エージェント別
      if (error.agent) {
        metrics.errorsByAgent[error.agent] = (metrics.errorsByAgent[error.agent] || 0) + 1;
      }
      
      // タイプ別（パターンから）
      const pattern = this.extractPattern(error.message);
      metrics.errorsByType[pattern] = (metrics.errorsByType[pattern] || 0) + 1;
    });

    // エラーレート（分あたり）
    const timeSpan = Math.max(1, (now.getTime() - cutoffTime.getTime()) / 60000);
    metrics.errorRate = recentErrors.length / timeSpan;

    // Critical/最近のエラー
    metrics.criticalErrors = recentErrors
      .filter(e => e.level === LogLevel.ERROR)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);
    
    metrics.recentErrors = recentErrors
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 20);

    // キャッシュを更新
    this.metricsCache = metrics;
    this.lastMetricsUpdate = now;

    return metrics;
  }

  /**
   * エラーパターンを取得
   */
  public getPatterns(): ErrorPattern[] {
    return Array.from(this.patterns.values())
      .sort((a, b) => b.count - a.count);
  }

  /**
   * エラーを解決済みにマーク
   */
  public async markResolved(errorId: string): Promise<void> {
    const error = this.errors.find(e => e.id === errorId);
    if (error) {
      error.resolved = true;
      
      if (this.supabase) {
        try {
          await this.supabase
            .from('error_logs')
            .update({ resolved: true, resolved_at: new Date().toISOString() })
            .eq('error_id', errorId);
        } catch (dbError) {
          this.logger.debug('Failed to mark error as resolved in database', {
            error: (dbError as Error).message
          });
        }
      }
    }
  }

  /**
   * 定期的な分析を開始
   */
  private startPeriodicAnalysis(): void {
    // 1時間ごとにパターン分析を実行
    setInterval(async () => {
      const metrics = await this.getMetrics();
      
      // 高頻度エラーパターンをログ
      const criticalPatterns = this.getPatterns()
        .filter(p => p.severity === 'critical' || p.severity === 'high');
      
      if (criticalPatterns.length > 0) {
        this.logger.warn('Critical error patterns detected', {
          patterns: criticalPatterns.map(p => ({
            pattern: p.pattern,
            count: p.count,
            severity: p.severity,
            recommendation: p.recommendation
          }))
        });
      }
      
      // メモリクリーンアップ（24時間以上前のエラーを削除）
      const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
      this.errors = this.errors.filter(e => e.timestamp > cutoffTime);
    }, 60 * 60 * 1000); // 1時間
  }

  /**
   * ヘルスチェック
   */
  public getHealth(): {
    status: 'healthy' | 'degraded' | 'critical';
    errorRate: number;
    criticalCount: number;
    message: string;
  } {
    const metrics = this.metricsCache || {
      errorRate: 0,
      errorsByLevel: { [LogLevel.ERROR]: 0 } as any,
      totalErrors: 0
    } as ErrorMetrics;
    
    const criticalCount = metrics.errorsByLevel[LogLevel.ERROR] || 0;
    
    let status: 'healthy' | 'degraded' | 'critical';
    let message: string;
    
    if (metrics.errorRate > 10 || criticalCount > 50) {
      status = 'critical';
      message = 'システムに重大な問題が発生しています';
    } else if (metrics.errorRate > 5 || criticalCount > 20) {
      status = 'degraded';
      message = 'システムパフォーマンスが低下しています';
    } else {
      status = 'healthy';
      message = 'システムは正常に動作しています';
    }
    
    return {
      status,
      errorRate: metrics.errorRate,
      criticalCount,
      message
    };
  }
}

// シングルトンインスタンスをエクスポート
export const errorMonitor = ErrorMonitor.getInstance();

// 便利な関数をエクスポート
export const monitorError = (
  message: string,
  level: LogLevel = LogLevel.ERROR,
  context?: Record<string, any>
) => {
  return errorMonitor.logError({
    level,
    message,
    context
  });
};

export const getErrorHealth = () => errorMonitor.getHealth();
export const getErrorMetrics = () => errorMonitor.getMetrics();
export const getErrorPatterns = () => errorMonitor.getPatterns();