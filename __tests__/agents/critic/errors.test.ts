/**
 * Critic Error Handling Tests
 */

import {
  isRetryableError,
  toCriticError,
  calculateRetryDelay,
  retryWithBackoff,
  formatErrorMessage,
  getErrorDetails,
  PartialResultError,
  TimeoutError,
  withTimeout,
} from '@/lib/agents/critic/errors';

import { CriticError, CriticErrorCode } from '@/lib/types/critic';

describe('Critic Error Handling', () => {
  describe('isRetryableError', () => {
    it('should identify retryable CriticError', () => {
      const retryableError = new CriticError(
        CriticErrorCode.LLM_ERROR,
        'LLM error',
        {},
        true
      );
      expect(isRetryableError(retryableError)).toBe(true);

      const nonRetryableError = new CriticError(
        CriticErrorCode.INVALID_INPUT,
        'Invalid input',
        {},
        false
      );
      expect(isRetryableError(nonRetryableError)).toBe(false);
    });

    it('should identify network errors as retryable', () => {
      const networkErrors = [
        new Error('ECONNREFUSED: Connection refused'),
        new Error('ETIMEDOUT: Connection timed out'),
        new Error('ENOTFOUND: DNS not found'),
      ];

      networkErrors.forEach(error => {
        expect(isRetryableError(error)).toBe(true);
      });
    });

    it('should identify rate limit errors as retryable', () => {
      const rateLimitErrors = [
        new Error('429: Too Many Requests'),
        new Error('rate limit exceeded'),
        new Error('Too Many Requests'),
      ];

      rateLimitErrors.forEach(error => {
        expect(isRetryableError(error)).toBe(true);
      });
    });

    it('should identify server errors as retryable', () => {
      const serverErrors = [
        new Error('500: Internal Server Error'),
        new Error('502: Bad Gateway'),
        new Error('503: Service Unavailable'),
        new Error('504: Gateway Timeout'),
      ];

      serverErrors.forEach(error => {
        expect(isRetryableError(error)).toBe(true);
      });
    });

    it('should identify non-retryable errors', () => {
      const nonRetryableErrors = [
        new Error('Invalid input'),
        new Error('Authentication failed'),
        new Error('Permission denied'),
      ];

      nonRetryableErrors.forEach(error => {
        expect(isRetryableError(error)).toBe(false);
      });
    });
  });

  describe('toCriticError', () => {
    it('should return CriticError as-is', () => {
      const criticError = new CriticError(
        CriticErrorCode.LLM_ERROR,
        'Test error',
        {},
        true
      );

      const result = toCriticError(criticError);
      expect(result).toBe(criticError);
    });

    it('should convert timeout errors correctly', () => {
      const timeoutError = new Error('Request timeout');
      const result = toCriticError(timeoutError);

      expect(result.code).toBe(CriticErrorCode.TIMEOUT);
      expect(result.isRetryable).toBe(true);
    });

    it('should convert validation errors correctly', () => {
      const validationError = new Error('Invalid input: missing required field');
      const result = toCriticError(validationError);

      expect(result.code).toBe(CriticErrorCode.INVALID_INPUT);
      expect(result.isRetryable).toBe(false);
    });

    it('should convert LLM errors correctly', () => {
      const llmError = new Error('OpenAI API error');
      const result = toCriticError(llmError);

      expect(result.code).toBe(CriticErrorCode.LLM_ERROR);
    });

    it('should convert unknown errors', () => {
      const unknownError = 'string error';
      const result = toCriticError(unknownError);

      expect(result.code).toBe(CriticErrorCode.EVALUATION_FAILED);
      expect(result.isRetryable).toBe(false);
      expect(result.details).toEqual({ error: 'string error' });
    });
  });

  describe('calculateRetryDelay', () => {
    it('should calculate exponential backoff delays', () => {
      expect(calculateRetryDelay(1)).toBe(1000);  // 1 second
      expect(calculateRetryDelay(2)).toBe(2000);  // 2 seconds
      expect(calculateRetryDelay(3)).toBe(4000);  // 4 seconds
      expect(calculateRetryDelay(4)).toBe(8000);  // 8 seconds
    });

    it('should cap delay at maximum', () => {
      expect(calculateRetryDelay(10)).toBe(10000); // Max 10 seconds
    });
  });

  describe('retryWithBackoff', () => {
    it('should succeed on first attempt', async () => {
      const fn = jest.fn().mockResolvedValue('success');
      const result = await retryWithBackoff(fn, 2);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable error', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('500: Server Error'))
        .mockResolvedValue('success');

      const result = await retryWithBackoff(fn, 2);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should not retry on non-retryable error', async () => {
      const fn = jest.fn()
        .mockRejectedValue(new Error('Invalid input'));

      await expect(retryWithBackoff(fn, 2)).rejects.toThrow('Invalid input');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should call onRetry callback', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('500: Server Error'))
        .mockResolvedValue('success');
      
      const onRetry = jest.fn();
      
      await retryWithBackoff(fn, 2, onRetry);

      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
    });

    it('should throw after max retries', async () => {
      const fn = jest.fn()
        .mockRejectedValue(new Error('500: Server Error'));

      await expect(retryWithBackoff(fn, 2)).rejects.toThrow('500: Server Error');
      expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

  describe('formatErrorMessage', () => {
    it('should format error messages by code', () => {
      const errors = [
        {
          error: new CriticError(CriticErrorCode.INVALID_INPUT, '', {}, false),
          expected: '入力データが不正です。ビジネスアイデアの形式を確認してください。',
        },
        {
          error: new CriticError(CriticErrorCode.LLM_ERROR, '', {}, false),
          expected: 'AI評価モデルへの接続に失敗しました。しばらく待ってから再試行してください。',
        },
        {
          error: new CriticError(CriticErrorCode.TIMEOUT, '', {}, false),
          expected: '評価処理がタイムアウトしました。アイデアの数を減らすか、後で再試行してください。',
        },
      ];

      errors.forEach(({ error, expected }) => {
        expect(formatErrorMessage(error)).toBe(expected);
      });
    });
  });

  describe('getErrorDetails', () => {
    it('should generate complete error details', () => {
      const error = new CriticError(
        CriticErrorCode.LLM_ERROR,
        'Test error',
        { attempt: 1 },
        true
      );

      const details = getErrorDetails(error);

      expect(details.code).toBe(CriticErrorCode.LLM_ERROR);
      expect(details.message).toBe('Test error');
      expect(details.isRetryable).toBe(true);
      expect(details.details).toEqual({ attempt: 1 });
      expect(details.timestamp).toBeDefined();
      expect(details.stack).toBeDefined();
    });
  });

  describe('PartialResultError', () => {
    it('should create partial result error', () => {
      const partialResults = [{ id: '1', result: 'success' }];
      const failedItems = [{ id: '2', error: 'failed' }];

      const error = new PartialResultError(
        'Partial evaluation completed',
        partialResults,
        failedItems
      );

      expect(error.code).toBe(CriticErrorCode.EVALUATION_FAILED);
      expect(error.partialResults).toBe(partialResults);
      expect(error.failedItems).toBe(failedItems);
      expect(error.isRetryable).toBe(false);
      expect(error.name).toBe('PartialResultError');
    });
  });

  describe('TimeoutError', () => {
    it('should create timeout error', () => {
      const error = new TimeoutError('Operation timed out', 5000);

      expect(error.code).toBe(CriticErrorCode.TIMEOUT);
      expect(error.message).toBe('Operation timed out');
      expect(error.details).toEqual({ timeoutMs: 5000 });
      expect(error.isRetryable).toBe(true);
      expect(error.name).toBe('TimeoutError');
    });
  });

  describe('withTimeout', () => {
    it('should resolve if operation completes in time', async () => {
      const promise = new Promise(resolve => 
        setTimeout(() => resolve('success'), 100)
      );

      const result = await withTimeout(promise, 1000);
      expect(result).toBe('success');
    });

    it('should reject with timeout error if operation takes too long', async () => {
      const promise = new Promise(resolve => 
        setTimeout(() => resolve('success'), 1000)
      );

      await expect(withTimeout(promise, 100)).rejects.toThrow(TimeoutError);
    });

    it('should use custom timeout message', async () => {
      const promise = new Promise(resolve => 
        setTimeout(() => resolve('success'), 1000)
      );

      await expect(
        withTimeout(promise, 100, 'Custom timeout message')
      ).rejects.toThrow('Custom timeout message');
    });
  });
});