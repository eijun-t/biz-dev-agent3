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

/**
 * WriterAgentクラス
 * Analystエージェントの出力を受け取り、HTMLレポートを生成する
 */
export class WriterAgent extends BaseAgent {
  private maxRetries = 3;
  private retryDelay = 1000; // milliseconds
  private generationTimeout = 5000; // 5 seconds
  private reportGeneratorService: ReportGeneratorService;
  
  constructor(context: BaseAgentContext) {
    super(context);
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
    const startTime = Date.now();

    try {
      // タイムアウト設定
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Generation timeout')), this.generationTimeout);
      });

      // レポート生成処理
      const reportPromise = this.generateReport(data);

      // タイムアウトと生成処理のレース
      const report = await Promise.race([reportPromise, timeoutPromise]);
      
      return report;
    } catch (error) {
      throw this.createWriterError(
        WriterErrorType.GENERATION_TIMEOUT,
        'Report generation exceeded 5 seconds',
        error as Error
      );
    }
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
    // ReportGeneratorServiceを使用してレポートを生成
    return await this.reportGeneratorService.generateReport(input);
  }

  /**
   * レポートをデータベースに保存
   */
  private async saveReport(report: HTMLReport): Promise<void> {
    const supabase = createClient();
    
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
        generated_at: report.generatedAt,
        generation_time_ms: report.generationTime,
      });

    if (error) {
      throw this.createWriterError(
        WriterErrorType.DATABASE_ERROR,
        'Failed to save report to database',
        error
      );
    }
  }

  /**
   * 進捗状況をログに記録
   */
  public async logProgress(phase: string, percentage: number): Promise<void> {
    const supabase = createClient();
    
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
  }

  /**
   * エラーハンドリング
   */
  public async handleError(error: Error, partialContent?: Partial<HTMLReport>): Promise<void> {
    const supabase = createClient();
    
    // エラーログの記録
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
        });
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