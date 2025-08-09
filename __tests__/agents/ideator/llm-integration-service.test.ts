/**
 * LLM Integration Service Test
 * LLM統合サービスのテスト
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { LLMIntegrationService } from '../../../lib/agents/ideator/llm-integration-service';
import { z } from 'zod';
import type { LLMConfig, UsageMetadata } from '../../../lib/types/ideator';
import { IdeatorError, IdeatorErrorCode } from '../../../lib/agents/ideator/errors';

describe('LLMIntegrationService', () => {
  let service: LLMIntegrationService;
  let mockInvoke: jest.Mock;
  let mockLLM: any;

  beforeEach(() => {
    // モックのリセット
    jest.clearAllMocks();
    
    // 環境変数の設定
    process.env.OPENAI_API_KEY = 'test-api-key';
    
    // LLMのモックを作成
    mockInvoke = jest.fn();
    mockLLM = {
      invoke: mockInvoke,
      _modelType: jest.fn().mockReturnValue('chat'),
      _llmType: jest.fn().mockReturnValue('openai')
    };

    // モックLLMを注入してサービスを作成
    service = new LLMIntegrationService(mockLLM);
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('invokeWithRetry', () => {
    const testPrompt = 'Generate 5 business ideas';
    const testConfig: LLMConfig = {
      model: 'gpt-4o',
      temperature: 0.7,
      maxTokens: 8000,
      topP: 0.9,
      presencePenalty: 0.1,
      frequencyPenalty: 0.1
    };

    it('should successfully invoke LLM on first attempt', async () => {
      const mockResponse = {
        content: JSON.stringify([
          { title: 'Idea 1', description: 'Description 1' },
          { title: 'Idea 2', description: 'Description 2' }
        ]),
        response_metadata: {
          usage: {
            prompt_tokens: 100,
            completion_tokens: 500,
            total_tokens: 600
          }
        }
      };

      mockInvoke.mockResolvedValue(mockResponse);

      const result = await service.invokeWithRetry(testPrompt, testConfig);

      expect(result).toBe(mockResponse.content);
      expect(mockInvoke).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and succeed', async () => {
      const mockResponse = {
        content: 'Success after retry',
        response_metadata: {
          usage: {
            prompt_tokens: 100,
            completion_tokens: 200,
            total_tokens: 300
          }
        }
      };

      mockInvoke
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockResponse);

      const result = await service.invokeWithRetry(testPrompt, testConfig);

      expect(result).toBe('Success after retry');
      expect(mockInvoke).toHaveBeenCalledTimes(2);
    });

    it('should throw error after max retries', async () => {
      mockInvoke
        .mockRejectedValue(new Error('Persistent error'));

      await expect(service.invokeWithRetry(testPrompt, testConfig))
        .rejects.toThrow(IdeatorError);
    });

    it('should handle rate limit errors with backoff', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      (rateLimitError as any).status = 429;

      const mockResponse = {
        content: 'Success after rate limit',
        response_metadata: {}
      };

      mockInvoke
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce(mockResponse);

      const result = await service.invokeWithRetry(testPrompt, testConfig);

      expect(result).toBe('Success after rate limit');
      expect(mockInvoke).toHaveBeenCalledTimes(2);
    });
  });

  describe('invokeStructured', () => {
    const testSchema = z.object({
      ideas: z.array(z.object({
        title: z.string(),
        description: z.string()
      }))
    });

    it('should parse structured output correctly', async () => {
      const structuredData = {
        ideas: [
          { title: 'Idea 1', description: 'Desc 1' },
          { title: 'Idea 2', description: 'Desc 2' }
        ]
      };

      const mockResponse = {
        content: JSON.stringify(structuredData),
        response_metadata: {
          usage: {
            prompt_tokens: 150,
            completion_tokens: 300,
            total_tokens: 450
          }
        }
      };

      mockInvoke.mockResolvedValue(mockResponse);

      const result = await service.invokeStructured(
        'Generate ideas',
        testSchema
      );

      expect(result).toEqual(structuredData);
      expect(result.ideas).toHaveLength(2);
    });

    it('should handle JSON parsing errors', async () => {
      const mockResponse = {
        content: 'Invalid JSON {broken',
        response_metadata: {}
      };

      mockInvoke.mockResolvedValue(mockResponse);

      await expect(service.invokeStructured('Generate', testSchema))
        .rejects.toThrow(IdeatorError);
    });

    it('should handle schema validation errors', async () => {
      const invalidData = {
        ideas: [
          { title: 'Idea 1' } // descriptionが欠けている
        ]
      };

      const mockResponse = {
        content: JSON.stringify(invalidData),
        response_metadata: {}
      };

      mockInvoke.mockResolvedValue(mockResponse);

      await expect(service.invokeStructured('Generate', testSchema))
        .rejects.toThrow(IdeatorError);
    });

    it('should retry on structured output failure', async () => {
      const validData = {
        ideas: [
          { title: 'Idea 1', description: 'Desc 1' }
        ]
      };

      mockInvoke
        .mockResolvedValueOnce({ content: 'Invalid JSON', response_metadata: {} })
        .mockResolvedValueOnce({ 
          content: JSON.stringify(validData), 
          response_metadata: {} 
        });

      const result = await service.invokeStructured('Generate', testSchema);

      expect(result).toEqual(validData);
      expect(mockInvoke).toHaveBeenCalledTimes(2);
    });
  });

  describe('trackTokenUsage', () => {
    it('should track token usage correctly', () => {
      const metadata: UsageMetadata = {
        promptTokens: 100,
        completionTokens: 500,
        totalTokens: 600,
        modelName: 'gpt-4o'
      };

      service.trackTokenUsage(metadata);

      const usage = service.getTokenUsage();
      expect(usage.totalTokens).toBe(600);
      expect(usage.promptTokens).toBe(100);
      expect(usage.completionTokens).toBe(500);
    });

    it('should accumulate token usage across multiple calls', () => {
      service.trackTokenUsage({
        promptTokens: 100,
        completionTokens: 200,
        totalTokens: 300,
        modelName: 'gpt-4o'
      });

      service.trackTokenUsage({
        promptTokens: 150,
        completionTokens: 250,
        totalTokens: 400,
        modelName: 'gpt-4o'
      });

      const usage = service.getTokenUsage();
      expect(usage.totalTokens).toBe(700);
      expect(usage.promptTokens).toBe(250);
      expect(usage.completionTokens).toBe(450);
    });

    it('should reset token usage', () => {
      service.trackTokenUsage({
        promptTokens: 100,
        completionTokens: 200,
        totalTokens: 300,
        modelName: 'gpt-4o'
      });

      service.resetTokenUsage();

      const usage = service.getTokenUsage();
      expect(usage.totalTokens).toBe(0);
      expect(usage.promptTokens).toBe(0);
      expect(usage.completionTokens).toBe(0);
    });
  });

  describe('configureLLM', () => {
    it('should update LLM configuration', () => {
      const newConfig: LLMConfig = {
        model: 'gpt-4o',
        temperature: 0.5,
        maxTokens: 10000,
        topP: 0.95,
        presencePenalty: 0.2,
        frequencyPenalty: 0.2
      };

      service.configureLLM(newConfig);

      // 設定が適用されたことを確認（内部実装による）
      expect(service.getCurrentConfig()).toEqual(newConfig);
    });
  });

  describe('error handling', () => {
    it('should handle timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      (timeoutError as any).code = 'ETIMEDOUT';

      mockInvoke.mockRejectedValue(timeoutError);

      await expect(service.invokeWithRetry('test', {} as LLMConfig))
        .rejects.toThrow(IdeatorError);
    });

    it('should handle token limit errors', async () => {
      const tokenError = new Error('Token limit exceeded');
      (tokenError as any).code = 'context_length_exceeded';

      mockInvoke.mockRejectedValue(tokenError);

      await expect(service.invokeWithRetry('test', {} as LLMConfig))
        .rejects.toThrow(IdeatorError);
    });

    it('should not retry on non-retryable errors', async () => {
      const authError = new Error('Invalid API key');
      (authError as any).status = 401;

      mockInvoke.mockRejectedValue(authError);

      await expect(service.invokeWithRetry('test', {} as LLMConfig))
        .rejects.toThrow(IdeatorError);
      
      expect(mockInvoke).toHaveBeenCalledTimes(1); // リトライしない
    });
  });

  describe('performance monitoring', () => {
    it('should track invocation time', async () => {
      const mockResponse = {
        content: 'Test response',
        response_metadata: {}
      };

      mockInvoke.mockResolvedValue(mockResponse);

      const startTime = Date.now();
      await service.invokeWithRetry('test', {} as LLMConfig);
      const endTime = Date.now();

      const metrics = service.getPerformanceMetrics();
      expect(metrics.lastInvocationTime).toBeGreaterThanOrEqual(0);
      expect(metrics.lastInvocationTime).toBeLessThanOrEqual(endTime - startTime);
    });

    it('should track retry count', async () => {
      const mockResponse = {
        content: 'Success',
        response_metadata: {}
      };

      mockInvoke
        .mockRejectedValueOnce(new Error('Retry 1'))
        .mockRejectedValueOnce(new Error('Retry 2'))
        .mockResolvedValueOnce(mockResponse);

      await service.invokeWithRetry('test', {} as LLMConfig);

      const metrics = service.getPerformanceMetrics();
      expect(metrics.retryCount).toBe(2);
    });
  });
});