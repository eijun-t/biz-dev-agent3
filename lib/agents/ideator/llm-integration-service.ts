/**
 * LLM Integration Service
 * LLMとの統合を管理するサービス
 */

import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import type { 
  LLMConfig, 
  UsageMetadata 
} from '../../types/ideator';
import { IdeatorError, IdeatorErrorCode, isRetryableError } from './errors';
import { RETRY_CONFIG, DEFAULT_LLM_CONFIG, TIMEOUT_CONFIG } from './constants';

/**
 * トークン使用量の追跡
 */
interface TokenUsageTracker {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  invocationCount: number;
}

/**
 * パフォーマンスメトリクス
 */
interface PerformanceMetrics {
  lastInvocationTime: number;
  averageInvocationTime: number;
  retryCount: number;
  successCount: number;
  errorCount: number;
}

export class LLMIntegrationService {
  private llm: ChatOpenAI;
  private currentConfig: LLMConfig;
  private tokenUsage: TokenUsageTracker;
  private performanceMetrics: PerformanceMetrics;

  constructor(llm?: ChatOpenAI) {
    this.currentConfig = DEFAULT_LLM_CONFIG;
    this.llm = llm || this.createLLM(this.currentConfig);
    
    this.tokenUsage = {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      invocationCount: 0
    };

    this.performanceMetrics = {
      lastInvocationTime: 0,
      averageInvocationTime: 0,
      retryCount: 0,
      successCount: 0,
      errorCount: 0
    };
  }

  /**
   * リトライ機構付きでLLMを呼び出す
   */
  async invokeWithRetry(
    prompt: string,
    config?: Partial<LLMConfig>,
    maxRetries: number = RETRY_CONFIG.maxAttempts
  ): Promise<string> {
    const finalConfig = { ...this.currentConfig, ...config };
    let lastError: Error | undefined;
    let retryCount = 0;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const startTime = Date.now();
        
        // LLMを呼び出し
        const response = await this.invokeLLM(prompt, finalConfig);
        
        // パフォーマンスメトリクスを更新
        this.updatePerformanceMetrics(Date.now() - startTime, retryCount, true);
        
        return response;
      } catch (error) {
        lastError = error as Error;
        retryCount++;
        
        // リトライ不可能なエラーの場合は即座に失敗
        if (!isRetryableError(error)) {
          this.updatePerformanceMetrics(0, retryCount, false);
          throw IdeatorError.fromError(error);
        }

        // 最後の試行の場合はエラーをスロー
        if (attempt === maxRetries - 1) {
          this.updatePerformanceMetrics(0, retryCount, false);
          throw IdeatorError.fromError(
            error,
            IdeatorErrorCode.LLM_GENERATION_FAILED
          );
        }

        // エクスポネンシャルバックオフで待機
        await this.waitWithBackoff(attempt);
      }
    }

    throw IdeatorError.fromCode(
      IdeatorErrorCode.LLM_GENERATION_FAILED,
      { originalError: lastError, retryCount }
    );
  }

  /**
   * 構造化された出力を取得
   */
  async invokeStructured<T>(
    prompt: string,
    schema: z.ZodSchema<T>,
    config?: Partial<LLMConfig>
  ): Promise<T> {
    const maxRetries = RETRY_CONFIG.maxAttempts;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await this.invokeWithRetry(
          prompt,
          config,
          maxRetries - attempt // 残りリトライ回数
        );

        // JSONパース
        let parsedData: any;
        try {
          parsedData = JSON.parse(response);
        } catch (parseError) {
          // JSON形式でない場合、コードブロックを探す
          const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/);
          if (jsonMatch) {
            parsedData = JSON.parse(jsonMatch[1]);
          } else {
            throw new Error('Invalid JSON format in response');
          }
        }

        // スキーマバリデーション
        const validationResult = schema.safeParse(parsedData);
        if (!validationResult.success) {
          throw IdeatorError.fromCode(
            IdeatorErrorCode.INVALID_OUTPUT_FORMAT,
            {
              errors: validationResult.error.errors,
              rawData: parsedData
            }
          );
        }

        return validationResult.data;
      } catch (error) {
        // 最後の試行でない場合は続行
        if (attempt < maxRetries - 1) {
          await this.waitWithBackoff(attempt);
          continue;
        }
        
        throw IdeatorError.fromError(error);
      }
    }

    throw IdeatorError.fromCode(
      IdeatorErrorCode.LLM_GENERATION_FAILED,
      { message: 'Failed to get structured output after retries' }
    );
  }

  /**
   * トークン使用量を追跡
   */
  trackTokenUsage(metadata: UsageMetadata): void {
    this.tokenUsage.promptTokens += metadata.promptTokens || 0;
    this.tokenUsage.completionTokens += metadata.completionTokens || 0;
    this.tokenUsage.totalTokens += metadata.totalTokens || 0;
    this.tokenUsage.invocationCount++;
  }

  /**
   * LLM設定を更新
   */
  configureLLM(config: LLMConfig): void {
    this.currentConfig = config;
    // モックLLMが注入されている場合は新しいLLMを作成しない
    if (!this.llm || !this.llm.invoke) {
      this.llm = this.createLLM(config);
    }
  }

  /**
   * 現在の設定を取得
   */
  getCurrentConfig(): LLMConfig {
    return { ...this.currentConfig };
  }

  /**
   * トークン使用量を取得
   */
  getTokenUsage(): TokenUsageTracker {
    return { ...this.tokenUsage };
  }

  /**
   * トークン使用量をリセット
   */
  resetTokenUsage(): void {
    this.tokenUsage = {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      invocationCount: 0
    };
  }

  /**
   * パフォーマンスメトリクスを取得
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  // Private methods

  /**
   * LLMインスタンスを作成
   */
  private createLLM(config: LLMConfig): ChatOpenAI {
    return new ChatOpenAI({
      modelName: config.model,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      topP: config.topP,
      presencePenalty: config.presencePenalty,
      frequencyPenalty: config.frequencyPenalty,
      timeout: TIMEOUT_CONFIG.llmCall,
      openAIApiKey: process.env.OPENAI_API_KEY
    });
  }

  /**
   * LLMを直接呼び出す
   */
  private async invokeLLM(
    prompt: string,
    config: LLMConfig
  ): Promise<string> {
    // 設定が変更されている場合はLLMを再作成（モックLLMの場合はスキップ）
    if (!this.llm) {
      this.llm = this.createLLM(config);
      this.currentConfig = config;
    } else if (this.configChanged(config) && !this.llm.invoke) {
      // invokeメソッドがない場合のみ再作成（モックの場合はinvokeメソッドがある）
      this.llm = this.createLLM(config);
      this.currentConfig = config;
    }

    const response = await this.llm.invoke(prompt);
    
    // レスポンスから内容を抽出
    let content: string;
    if (typeof response.content === 'string') {
      content = response.content;
    } else if (response.content && typeof response.content === 'object') {
      content = JSON.stringify(response.content);
    } else {
      throw IdeatorError.fromCode(
        IdeatorErrorCode.INVALID_OUTPUT_FORMAT,
        { response }
      );
    }

    // 使用量メタデータを追跡
    if (response.response_metadata?.usage) {
      const usage = response.response_metadata.usage;
      this.trackTokenUsage({
        promptTokens: usage.prompt_tokens || 0,
        completionTokens: usage.completion_tokens || 0,
        totalTokens: usage.total_tokens || 0,
        modelName: config.model
      });
    }

    return content;
  }

  /**
   * 設定が変更されたかチェック
   */
  private configChanged(config: LLMConfig): boolean {
    return JSON.stringify(config) !== JSON.stringify(this.currentConfig);
  }

  /**
   * エクスポネンシャルバックオフで待機
   */
  private async waitWithBackoff(attempt: number): Promise<void> {
    const delay = Math.min(
      RETRY_CONFIG.baseDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt),
      RETRY_CONFIG.maxDelay
    );
    
    // ランダムジッターを追加
    const jitter = Math.random() * delay * 0.1;
    const finalDelay = delay + jitter;
    
    await new Promise(resolve => setTimeout(resolve, finalDelay));
  }

  /**
   * パフォーマンスメトリクスを更新
   */
  private updatePerformanceMetrics(
    invocationTime: number,
    retryCount: number,
    success: boolean
  ): void {
    if (success) {
      this.performanceMetrics.successCount++;
      this.performanceMetrics.lastInvocationTime = invocationTime;
      
      // 平均時間を更新
      const totalTime = this.performanceMetrics.averageInvocationTime * 
        (this.performanceMetrics.successCount - 1) + invocationTime;
      this.performanceMetrics.averageInvocationTime = 
        totalTime / this.performanceMetrics.successCount;
    } else {
      this.performanceMetrics.errorCount++;
    }
    
    this.performanceMetrics.retryCount += retryCount;
  }
}