/**
 * Checkpointer Adapter for Supabase
 * 
 * LangGraphのチェックポイント機能をSupabaseに統合するアダプター
 */

import { BaseCheckpointSaver } from '@langchain/langgraph';
import { RunnableConfig } from '@langchain/core/runnables';
import { CheckpointTuple, Checkpoint, CheckpointMetadata } from '@langchain/langgraph';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { GraphState } from '@/lib/types/orchestration';
import { createServiceLogger } from '@/lib/utils/logger';

/**
 * Supabaseベースのチェックポイントセーバー
 * Edge Runtime互換で、fsに依存しない実装
 */
export class CheckpointerAdapter extends BaseCheckpointSaver {
  private supabase: SupabaseClient;
  private logger = createServiceLogger('CheckpointerAdapter');

  constructor(supabase: SupabaseClient) {
    super();
    this.supabase = supabase;
  }

  /**
   * チェックポイントを取得
   */
  async getTuple(config: RunnableConfig): Promise<CheckpointTuple | undefined> {
    try {
      const { data, error } = await this.supabase
        .from('orchestration_checkpoints')
        .select('*')
        .eq('session_id', config.configurable?.sessionId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return undefined;
      }

      return {
        config,
        checkpoint: data.checkpoint as Checkpoint,
        metadata: data.metadata as CheckpointMetadata,
        parentConfig: data.parent_config ? JSON.parse(data.parent_config) : undefined,
      };
    } catch (error) {
      this.logger.error('Failed to get checkpoint', error as Error, { sessionId: config.configurable?.sessionId });
      return undefined;
    }
  }

  /**
   * チェックポイントのリストを取得
   */
  async *list(
    config: RunnableConfig,
    limit?: number,
    before?: RunnableConfig
  ): AsyncGenerator<CheckpointTuple> {
    try {
      let query = this.supabase
        .from('orchestration_checkpoints')
        .select('*')
        .eq('session_id', config.configurable?.sessionId)
        .order('created_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      if (before?.configurable?.checkpointId) {
        // Before指定がある場合は、その時点より前のチェックポイントを取得
        query = query.lt('created_at', before.configurable.checkpointId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to list checkpoints: ${error.message}`);
      }

      for (const checkpoint of data || []) {
        yield {
          config: {
            ...config,
            configurable: {
              ...config.configurable,
              checkpointId: checkpoint.id,
            },
          },
          checkpoint: checkpoint.checkpoint as Checkpoint,
          metadata: checkpoint.metadata as CheckpointMetadata,
          parentConfig: checkpoint.parent_config ? 
            JSON.parse(checkpoint.parent_config) : undefined,
        };
      }
    } catch (error) {
      this.logger.error('Failed to list checkpoints', error as Error);
      return;
    }
  }

  /**
   * チェックポイントを保存
   */
  async put(
    config: RunnableConfig,
    checkpoint: Checkpoint,
    metadata: CheckpointMetadata,
    newVersions?: Record<string, unknown>
  ): Promise<RunnableConfig> {
    try {
      const checkpointId = crypto.randomUUID();
      const sessionId = config.configurable?.sessionId;

      if (!sessionId) {
        throw new Error('Session ID is required for checkpoint');
      }

      const { error } = await this.supabase
        .from('orchestration_checkpoints')
        .insert({
          id: checkpointId,
          session_id: sessionId,
          checkpoint,
          metadata,
          parent_config: config.configurable?.parentConfig ? 
            JSON.stringify(config.configurable.parentConfig) : null,
          new_versions: newVersions,
          created_at: new Date().toISOString(),
        });

      if (error) {
        throw new Error(`Failed to save checkpoint: ${error.message}`);
      }

      return {
        ...config,
        configurable: {
          ...config.configurable,
          checkpointId,
        },
      };
    } catch (error) {
      this.logger.error('Failed to put checkpoint', error as Error, { sessionId: config.configurable?.sessionId });
      throw error;
    }
  }

  /**
   * チェックポイントを削除
   */
  async delete(sessionId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('orchestration_checkpoints')
        .delete()
        .eq('session_id', sessionId);

      if (error) {
        throw new Error(`Failed to delete checkpoints: ${error.message}`);
      }
    } catch (error) {
      this.logger.error('Failed to delete checkpoints', error as Error, { sessionId: config.configurable?.sessionId });
      throw error;
    }
  }

  /**
   * セッションの最新チェックポイントを取得
   */
  async getLatestCheckpoint(sessionId: string): Promise<GraphState | null> {
    try {
      const { data, error } = await this.supabase
        .from('orchestration_checkpoints')
        .select('checkpoint')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return null;
      }

      // チェックポイントからGraphStateを抽出
      const checkpoint = data.checkpoint as Checkpoint;
      return checkpoint.channel_values as GraphState;
    } catch (error) {
      this.logger.error('Failed to get latest checkpoint', error as Error, { sessionId });
      return null;
    }
  }

  /**
   * 古いチェックポイントをクリーンアップ
   */
  async cleanup(retentionDays: number = 7): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const { error } = await this.supabase
        .from('orchestration_checkpoints')
        .delete()
        .lt('created_at', cutoffDate.toISOString());

      if (error) {
        throw new Error(`Failed to cleanup checkpoints: ${error.message}`);
      }
    } catch (error) {
      this.logger.error('Failed to cleanup checkpoints', error as Error, { sessionId });
      throw error;
    }
  }
}