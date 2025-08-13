import { WriterErrorHandler, WriterError, WriterErrorCode } from '@/lib/agents/writer/errors'

describe('WriterErrorHandler', () => {
  let errorHandler: WriterErrorHandler

  beforeEach(() => {
    errorHandler = new WriterErrorHandler()
    jest.clearAllMocks()
  })

  describe('executeWithRetry', () => {
    it('成功した場合は結果を返す', async () => {
      const operation = jest.fn().mockResolvedValue('success')
      const context = {
        phase: 'test_phase',
        sessionId: 'session-123'
      }

      const result = await errorHandler.executeWithRetry(operation, context)

      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(1)
    })

    it('リトライ可能なエラーの場合は最大3回リトライする', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('timeout'))
        .mockRejectedValueOnce(new Error('network error'))
        .mockResolvedValue('success')

      const context = {
        phase: 'test_phase',
        sessionId: 'session-123'
      }

      const result = await errorHandler.executeWithRetry(operation, context)

      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(3)
    })

    it('最大リトライ回数を超えた場合はエラーをスローする', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('timeout'))
      const context = {
        phase: 'test_phase',
        sessionId: 'session-123'
      }

      await expect(
        errorHandler.executeWithRetry(operation, context)
      ).rejects.toThrow(WriterError)

      expect(operation).toHaveBeenCalledTimes(3)
    })

    it('リトライ不可能なエラーの場合は即座にエラーをスローする', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('fatal error'))
      const context = {
        phase: 'test_phase',
        sessionId: 'session-123'
      }

      await expect(
        errorHandler.executeWithRetry(operation, context)
      ).rejects.toThrow(WriterError)

      expect(operation).toHaveBeenCalledTimes(1)
    })

    it('部分コンテンツがある場合はコールバックを呼ぶ', async () => {
      const partialContent = { data: 'partial' }
      const onPartialContent = jest.fn()
      
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('timeout'))
        .mockResolvedValue('success')

      const context = {
        phase: 'test_phase',
        sessionId: 'session-123',
        onPartialContent
      }

      await errorHandler.executeWithRetry(operation, context)

      expect(operation).toHaveBeenCalledTimes(2)
    })
  })

  describe('savePartialContent', () => {
    beforeEach(() => {
      const localStorageMock = {
        setItem: jest.fn(),
        getItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
        length: 0,
        key: jest.fn()
      }
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
        writable: true
      })
    })

    it('部分コンテンツをローカルストレージに保存する', async () => {
      const sessionId = 'session-123'
      const partialContent = { summary: 'test' }
      const phase = 'summary_generation'

      await errorHandler.savePartialContent(sessionId, partialContent, phase)

      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        `writer_partial_${sessionId}`,
        expect.stringContaining('"summary":"test"')
      )
    })
  })

  describe('loadPartialContent', () => {
    it('有効な部分コンテンツを読み込む', async () => {
      const sessionId = 'session-123'
      const savedData = {
        sessionId,
        phase: 'test',
        content: { data: 'test' },
        timestamp: Date.now()
      }

      ;(window.localStorage.getItem as jest.Mock).mockReturnValue(
        JSON.stringify(savedData)
      )

      const result = await errorHandler.loadPartialContent(sessionId)

      expect(result).toEqual({ data: 'test' })
    })

    it('古い部分コンテンツは削除してnullを返す', async () => {
      const sessionId = 'session-123'
      const oldData = {
        sessionId,
        phase: 'test',
        content: { data: 'test' },
        timestamp: Date.now() - (2 * 60 * 60 * 1000)
      }

      ;(window.localStorage.getItem as jest.Mock).mockReturnValue(
        JSON.stringify(oldData)
      )

      const result = await errorHandler.loadPartialContent(sessionId)

      expect(result).toBeNull()
      expect(window.localStorage.removeItem).toHaveBeenCalledWith(
        `writer_partial_${sessionId}`
      )
    })
  })

  describe('formatUserMessage', () => {
    it('各エラーコードに対して適切なメッセージを返す', () => {
      const testCases = [
        {
          error: new WriterError('', WriterErrorCode.TIMEOUT),
          expected: 'レポート生成がタイムアウトしました。もう一度お試しください。'
        },
        {
          error: new WriterError('', WriterErrorCode.DATA_INTEGRATION_FAILED),
          expected: 'データ統合中にエラーが発生しました。入力データを確認してください。'
        },
        {
          error: new WriterError('', WriterErrorCode.VALIDATION_FAILED),
          expected: '入力データの検証に失敗しました。データ形式を確認してください。'
        },
        {
          error: new WriterError('', WriterErrorCode.PARTIAL_GENERATION),
          expected: 'レポートの一部のみ生成されました。完全なレポートを生成するには再試行してください。'
        },
        {
          error: new WriterError('', WriterErrorCode.UNKNOWN),
          expected: 'レポート生成中に予期しないエラーが発生しました。'
        }
      ]

      testCases.forEach(({ error, expected }) => {
        const message = errorHandler.formatUserMessage(error)
        expect(message).toBe(expected)
      })
    })
  })
})