/**
 * Report Storage Service
 * 
 * レポートの永続化・キャッシュ・バージョン管理
 */

import { createClient } from '@/lib/supabase/server';
import { createServiceLogger } from '@/lib/utils/logger';
import { Redis } from '@upstash/redis';

const logger = createServiceLogger('ReportStorageService');

// レポートのステータス
export enum ReportStatus {
  DRAFT = 'draft',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  ARCHIVED = 'archived'
}

// レポートデータ型
export interface Report {
  id: string;
  title: string;
  description?: string;
  sessionId: string;
  userId: string;
  status: ReportStatus;
  tags: string[];
  isFavorite: boolean;
  version: number;
  content?: ReportContent;
  metadata: ReportMetadata;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  archivedAt?: Date;
}

// レポートコンテンツ
export interface ReportContent {
  summary: string;
  sections: ReportSection[];
  data: Record<string, any>;
  attachments?: Attachment[];
}

// レポートセクション
export interface ReportSection {
  id: string;
  title: string;
  content: string;
  order: number;
  type: 'text' | 'chart' | 'table' | 'code';
  data?: any;
}

// 添付ファイル
export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

// レポートメタデータ
export interface ReportMetadata {
  wordCount?: number;
  sections?: number;
  agentDurations?: Record<string, number>;
  totalDuration?: number;
  version?: number;
  lastEditor?: string;
  viewCount?: number;
  downloadCount?: number;
}

// ストレージオプション
export interface StorageOptions {
  enableCache?: boolean;
  cacheExpiry?: number; // seconds
  enableVersioning?: boolean;
  maxVersions?: number;
  autoArchive?: boolean;
  archiveAfterDays?: number;
}

/**
 * レポートストレージサービス
 */
export class ReportStorageService {
  private redis: Redis | null = null;
  private options: Required<StorageOptions>;

  constructor(options: StorageOptions = {}) {
    this.options = {
      enableCache: true,
      cacheExpiry: 3600, // 1時間
      enableVersioning: true,
      maxVersions: 10,
      autoArchive: true,
      archiveAfterDays: 90,
      ...options
    };

    // Redis初期化（キャッシュ用）
    if (this.options.enableCache && process.env.UPSTASH_REDIS_URL) {
      this.redis = new Redis({
        url: process.env.UPSTASH_REDIS_URL,
        token: process.env.UPSTASH_REDIS_TOKEN!
      });
    }
  }

  /**
   * レポートを保存
   */
  async save(report: Partial<Report>): Promise<Report> {
    try {
      const supabase = await createClient();
      
      // 新規作成の場合
      if (!report.id) {
        report.id = crypto.randomUUID();
        report.version = 1;
        report.createdAt = new Date();
      } else if (this.options.enableVersioning) {
        // バージョン管理
        await this.saveVersion(report.id);
        report.version = (report.version || 0) + 1;
      }

      report.updatedAt = new Date();

      // Supabaseに保存
      const { data, error } = await supabase
        .from('reports')
        .upsert({
          id: report.id,
          title: report.title,
          description: report.description,
          session_id: report.sessionId,
          user_id: report.userId,
          status: report.status,
          tags: report.tags,
          is_favorite: report.isFavorite,
          version: report.version,
          content: report.content,
          metadata: report.metadata,
          created_at: report.createdAt?.toISOString(),
          updated_at: report.updatedAt.toISOString(),
          completed_at: report.completedAt?.toISOString(),
          archived_at: report.archivedAt?.toISOString()
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to save report', error);
        throw error;
      }

      // キャッシュ更新
      if (this.options.enableCache && this.redis) {
        await this.cacheReport(data);
      }

      logger.info('Report saved', { 
        reportId: data.id,
        version: data.version
      });

      return this.transformReport(data);

    } catch (error) {
      logger.error('Save report error', error as Error);
      throw error;
    }
  }

  /**
   * レポートを取得
   */
  async get(reportId: string, version?: number): Promise<Report | null> {
    try {
      // キャッシュから取得
      if (this.options.enableCache && this.redis) {
        const cached = await this.getCachedReport(reportId, version);
        if (cached) {
          logger.debug('Report retrieved from cache', { reportId });
          return cached;
        }
      }

      // DBから取得
      const supabase = await createClient();
      let query = supabase
        .from('reports')
        .select('*')
        .eq('id', reportId);

      if (version) {
        query = query.eq('version', version);
      }

      const { data, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        logger.error('Failed to get report', error);
        throw error;
      }

      // キャッシュに保存
      if (this.options.enableCache && this.redis && data) {
        await this.cacheReport(data);
      }

      return data ? this.transformReport(data) : null;

    } catch (error) {
      logger.error('Get report error', error as Error);
      throw error;
    }
  }

  /**
   * レポートを削除
   */
  async delete(reportId: string, soft: boolean = true): Promise<void> {
    try {
      const supabase = await createClient();

      if (soft) {
        // ソフトデリート（アーカイブ）
        await this.archive(reportId);
      } else {
        // ハードデリート
        const { error } = await supabase
          .from('reports')
          .delete()
          .eq('id', reportId);

        if (error) {
          logger.error('Failed to delete report', error);
          throw error;
        }

        // バージョン履歴も削除
        if (this.options.enableVersioning) {
          await supabase
            .from('report_versions')
            .delete()
            .eq('report_id', reportId);
        }
      }

      // キャッシュクリア
      if (this.options.enableCache && this.redis) {
        await this.clearCache(reportId);
      }

      logger.info('Report deleted', { reportId, soft });

    } catch (error) {
      logger.error('Delete report error', error as Error);
      throw error;
    }
  }

  /**
   * レポートをアーカイブ
   */
  async archive(reportId: string): Promise<void> {
    try {
      const supabase = await createClient();

      const { error } = await supabase
        .from('reports')
        .update({
          status: ReportStatus.ARCHIVED,
          archived_at: new Date().toISOString()
        })
        .eq('id', reportId);

      if (error) {
        logger.error('Failed to archive report', error);
        throw error;
      }

      logger.info('Report archived', { reportId });

    } catch (error) {
      logger.error('Archive report error', error as Error);
      throw error;
    }
  }

  /**
   * レポートのバージョンを保存
   */
  private async saveVersion(reportId: string): Promise<void> {
    if (!this.options.enableVersioning) return;

    try {
      const supabase = await createClient();
      
      // 現在のレポートを取得
      const current = await this.get(reportId);
      if (!current) return;

      // バージョン履歴に保存
      await supabase
        .from('report_versions')
        .insert({
          id: crypto.randomUUID(),
          report_id: reportId,
          version: current.version,
          content: current.content,
          metadata: current.metadata,
          created_at: new Date().toISOString()
        });

      // 古いバージョンを削除
      await this.cleanupVersions(reportId);

    } catch (error) {
      logger.error('Save version error', error as Error);
      // バージョン保存失敗は続行
    }
  }

  /**
   * 古いバージョンをクリーンアップ
   */
  private async cleanupVersions(reportId: string): Promise<void> {
    try {
      const supabase = await createClient();
      
      // バージョン数を取得
      const { count } = await supabase
        .from('report_versions')
        .select('*', { count: 'exact', head: true })
        .eq('report_id', reportId);

      if (count && count > this.options.maxVersions) {
        // 古いバージョンを削除
        const toDelete = count - this.options.maxVersions;
        
        const { data: oldVersions } = await supabase
          .from('report_versions')
          .select('id')
          .eq('report_id', reportId)
          .order('created_at', { ascending: true })
          .limit(toDelete);

        if (oldVersions) {
          const ids = oldVersions.map(v => v.id);
          await supabase
            .from('report_versions')
            .delete()
            .in('id', ids);
        }
      }

    } catch (error) {
      logger.error('Cleanup versions error', error as Error);
    }
  }

  /**
   * レポートをキャッシュ
   */
  private async cacheReport(report: any): Promise<void> {
    if (!this.redis) return;

    try {
      const key = `report:${report.id}:v${report.version || 'latest'}`;
      await this.redis.setex(
        key,
        this.options.cacheExpiry,
        JSON.stringify(report)
      );
    } catch (error) {
      logger.error('Cache report error', error as Error);
    }
  }

  /**
   * キャッシュからレポートを取得
   */
  private async getCachedReport(reportId: string, version?: number): Promise<Report | null> {
    if (!this.redis) return null;

    try {
      const key = `report:${reportId}:v${version || 'latest'}`;
      const cached = await this.redis.get(key);
      
      if (cached) {
        return this.transformReport(JSON.parse(cached as string));
      }
    } catch (error) {
      logger.error('Get cached report error', error as Error);
    }

    return null;
  }

  /**
   * キャッシュをクリア
   */
  private async clearCache(reportId: string): Promise<void> {
    if (!this.redis) return;

    try {
      // パターンマッチで関連キャッシュを削除
      const pattern = `report:${reportId}:*`;
      const keys = await this.redis.keys(pattern);
      
      if (keys.length > 0) {
        await Promise.all(keys.map(key => this.redis!.del(key)));
      }
    } catch (error) {
      logger.error('Clear cache error', error as Error);
    }
  }

  /**
   * DBデータをReport型に変換
   */
  private transformReport(data: any): Report {
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      sessionId: data.session_id,
      userId: data.user_id,
      status: data.status,
      tags: data.tags || [],
      isFavorite: data.is_favorite || false,
      version: data.version || 1,
      content: data.content,
      metadata: data.metadata || {},
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      archivedAt: data.archived_at ? new Date(data.archived_at) : undefined
    };
  }

  /**
   * 自動アーカイブ処理
   */
  async autoArchive(): Promise<number> {
    if (!this.options.autoArchive) return 0;

    try {
      const supabase = await createClient();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.options.archiveAfterDays);

      const { data, error } = await supabase
        .from('reports')
        .update({
          status: ReportStatus.ARCHIVED,
          archived_at: new Date().toISOString()
        })
        .eq('status', ReportStatus.COMPLETED)
        .lt('completed_at', cutoffDate.toISOString())
        .select();

      if (error) {
        logger.error('Auto archive error', error);
        return 0;
      }

      const count = data?.length || 0;
      if (count > 0) {
        logger.info('Reports auto-archived', { count });
      }

      return count;

    } catch (error) {
      logger.error('Auto archive error', error as Error);
      return 0;
    }
  }

  /**
   * ストレージ統計を取得
   */
  async getStats(userId?: string): Promise<{
    totalReports: number;
    byStatus: Record<string, number>;
    totalSize: number;
    cacheHitRate?: number;
  }> {
    const supabase = await createClient();
    
    let query = supabase.from('reports').select('status, metadata');
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data } = await query;

    const stats = {
      totalReports: data?.length || 0,
      byStatus: {} as Record<string, number>,
      totalSize: 0,
      cacheHitRate: undefined as number | undefined
    };

    data?.forEach(report => {
      stats.byStatus[report.status] = (stats.byStatus[report.status] || 0) + 1;
      // メタデータからサイズを推定
      stats.totalSize += JSON.stringify(report).length;
    });

    return stats;
  }
}

// シングルトンインスタンス
export const reportStorage = new ReportStorageService();