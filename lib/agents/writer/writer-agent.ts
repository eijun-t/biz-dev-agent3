/**
 * Writer Agent Implementation
 * Writerエージェントの実装
 */

import { BaseAgent, BaseAgentContext, AgentExecutionResult } from '@/lib/interfaces/base-agent';
import { 
  WriterInput, 
  HTMLReport, 
  WriterError, 
  WriterErrorType,
  ErrorResponse 
} from '@/lib/types/writer';
import { writerInputSchema } from '@/lib/validations/writer';
import { createClient } from '@/lib/supabase/server';
import { ReportGeneratorService, getReportGeneratorService } from './services/report-generator';
import { z } from 'zod';
import { createAgentLogger } from '@/lib/utils/logger';

/**
 * WriterAgentクラス
 * Analystエージェントの出力を受け取り、HTMLレポートを生成する
 */
export class WriterAgent extends BaseAgent {
  private maxRetries = 3;
  private retryDelay = 1000; // milliseconds
  private generationTimeout: number; // configurable timeout
  private reportGeneratorService: ReportGeneratorService;
  private logger = createAgentLogger('WriterAgent');
  
  constructor(context: BaseAgentContext & { timeout?: number }) {
    super(context);
    this.generationTimeout = context.timeout || 30000; // default 30 seconds
    this.reportGeneratorService = getReportGeneratorService();
  }

  /**
   * エージェント名を返す
   */
  getAgentName(): 'writer' {
    return 'writer';
  }

  /**
   * メインの実行メソッド
   */
  async execute(input: unknown): Promise<AgentExecutionResult> {
    const startTime = Date.now();
    const messages = [];

    try {
      // 開始ログ
      messages.push(this.createMessage('Writer agent started', { startTime }));
      await this.logProgress('started', 0);

      // 入力検証
      let validatedInput: WriterInput;
      try {
        validatedInput = await this.validateInput(input);
        messages.push(this.createMessage('Input validated successfully'));
        await this.logProgress('validation_complete', 10);
      } catch (error) {
        throw this.createWriterError(
          WriterErrorType.INVALID_INPUT,
          'Invalid input data format',
          error as Error
        );
      }

      // レポート生成（リトライ機構付き）
      const report = await this.generateReportWithRetry(validatedInput);
      messages.push(this.createMessage('Report generated successfully', {
        generationTime: Date.now() - startTime,
        reportId: report.id,
      }));

      // データベースに保存
      await this.saveReport(report);
      await this.logProgress('completed', 100);

      return {
        success: true,
        data: report,
        messages,
      };
    } catch (error) {
      // エラーハンドリング
      this.logger.error('WriterAgent execute error', error as Error, {
        sessionId: input.sessionId,
        businessIdea: input.businessIdea?.title
      });
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      messages.push(this.createMessage('Error occurred', { error: errorMessage }));
      
      await this.handleError(error as Error);
      await this.logProgress('error', -1);

      return {
        success: false,
        error: errorMessage,
        messages,
      };
    }
  }

  /**
   * Analystエージェントからのデータを処理
   */
  async processAnalysisData(data: WriterInput): Promise<HTMLReport> {
    // タイムアウトなしで直接処理
    return await this.generateReport(data);
  }

  /**
   * 入力データの検証
   */
  public async validateInput(data: unknown): Promise<WriterInput> {
    const validated = writerInputSchema.parse(data);
    
    // ビジネスアイデアのタイトル確認
    if (!validated.analystData.businessIdea.title) {
      throw new Error('Business idea title is required');
    }

    return validated;
  }

  /**
   * レポート生成（リトライ機構付き）
   */
  private async generateReportWithRetry(input: WriterInput): Promise<HTMLReport> {
    let lastError: Error | undefined;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        await this.logProgress(`generation_attempt_${attempt}`, 20 + (attempt * 20));
        return await this.processAnalysisData(input);
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < this.maxRetries) {
          // 指数バックオフでリトライ
          const delay = this.retryDelay * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Failed to generate report after retries');
  }

  /**
   * レポート生成の実装
   */
  private async generateReport(input: WriterInput): Promise<HTMLReport> {
    // デバッグ: 入力データを確認
    console.log('[Writer] Input data keys:', Object.keys(input));
    console.log('[Writer] AnalystData keys:', input.analystData ? Object.keys(input.analystData) : 'No analystData');
    console.log('[Writer] BusinessIdea title:', input.analystData?.businessIdea?.title);
    console.log('[Writer] Market TAM:', input.analystData?.marketAnalysis?.tam);
    
    // ReportGeneratorServiceを使用してレポートを生成
    return await this.reportGeneratorService.generateReport(input);
  }

  /**
   * レポートをデータベースに保存
   */
  private async saveReport(report: HTMLReport): Promise<void> {
    try {
      const supabase = await createClient();
      
      // セッションIDの存在確認
      console.log('Checking session:', report.sessionId);
      const { data: session, error: sessionError } = await supabase
        .from('ideation_sessions')
        .select('id')
        .eq('id', report.sessionId)
        .single();
      
      if (sessionError || !session) {
        this.logger.error('Session not found', sessionError as Error, {
          sessionId: report.sessionId
        });
        // セッションが存在しない場合は保存をスキップ
        return;
      }
      
      const { error } = await supabase
        .from('html_reports')
        .insert({
          id: report.id,
          session_id: report.sessionId,
          idea_id: report.ideaId,
          title: report.title,
          html_content: report.htmlContent,
          sections: report.sections,
          metrics: report.metrics,
          generation_time_ms: report.generationTime,
        });

      if (error) {
        this.logger.error('Database insert error', error as Error, {
          sessionId: report.sessionId,
          title: report.title
        });
        // データベースエラーは無視して続行（レポート生成自体は成功）
      } else {
        console.log('Report saved successfully:', report.id);
      }
    } catch (error) {
      this.logger.error('Failed to save report', error as Error, {
        sessionId: report.sessionId
      });
      // データベース保存エラーは無視して続行
    }
  }

  /**
   * 進捗状況をログに記録
   */
  public async logProgress(phase: string, percentage: number): Promise<void> {
    try {
      const supabase = await createClient();
      
      await supabase
        .from('agent_logs')
        .insert({
          session_id: this.context.sessionId,
          agent_name: this.getAgentName(),
          message: `Progress: ${phase}`,
          data: {
            phase,
            percentage,
          },
          generation_phase: phase,
          completion_percentage: Math.max(0, Math.min(100, percentage)),
        });
    } catch (error) {
      this.logger.debug('Failed to log progress', {
        error: (error as Error).message
      });
    }
  }

  /**
   * エラーハンドリング
   */
  public async handleError(error: Error, partialContent?: Partial<HTMLReport>): Promise<void> {
    try {
      const supabase = await createClient();
      
      // エラーログの記録（エラーが発生してもクラッシュしない）
      await supabase
        .from('agent_logs')
        .insert({
          session_id: this.context.sessionId,
          agent_name: this.getAgentName(),
          message: `Error: ${error.message}`,
          data: {
            error: error.message,
            stack: error.stack,
            partialContent,
          },
        });

      // 部分的なコンテンツがある場合は保存
      if (partialContent && partialContent.id) {
        await supabase
          .from('html_reports')
          .upsert({
            id: partialContent.id,
            session_id: this.context.sessionId,
            title: partialContent.title || 'Partial Report',
            html_content: partialContent.htmlContent || '<p>Generation failed</p>',
            sections: partialContent.sections || [],
            metrics: partialContent.metrics || {},
            generation_time_ms: -1, // エラーを示す
          })
          .catch(err => this.logger.error('Failed to save partial report', err as Error));
      }
    } catch (dbError) {
      // データベースエラーは無視してプロセスを継続
      this.logger.error('Database error in handleError', dbError as Error);
    }
  }

  /**
   * WriterError作成ヘルパー
   */
  private createWriterError(
    type: WriterErrorType,
    message: string,
    originalError?: Error
  ): WriterError {
    return {
      type,
      message,
      detail: originalError?.message,
      context: {
        sessionId: this.context.sessionId,
        agentName: this.getAgentName(),
      },
    };
  }
}

/**
 * WriterAgentインスタンスを作成するファクトリ関数
 */
export function createWriterAgent(context: BaseAgentContext): WriterAgent {
  return new WriterAgent(context);
}