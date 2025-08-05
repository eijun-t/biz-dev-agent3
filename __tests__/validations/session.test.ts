import { ideationSessionSchema, createSessionSchema, updateSessionSchema, sessionStatusEnum } from '@/lib/validations/session'

describe('Session Validation Schemas', () => {
  describe('ideationSessionSchema', () => {
    it('should validate a valid session', () => {
      const validSession = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: '123e4567-e89b-12d3-a456-426614174001',
        status: 'researching',
        current_phase: '情報収集フェーズ',
        progress: 25,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T01:00:00Z',
        completed_at: null,
        error_message: null
      }

      const result = ideationSessionSchema.safeParse(validSession)
      expect(result.success).toBe(true)
    })

    it('should validate completed session', () => {
      const completedSession = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: '123e4567-e89b-12d3-a456-426614174001',
        status: 'completed',
        current_phase: '完了',
        progress: 100,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T02:00:00Z',
        completed_at: '2024-01-01T02:00:00Z',
        error_message: null
      }

      const result = ideationSessionSchema.safeParse(completedSession)
      expect(result.success).toBe(true)
    })

    it('should validate error session', () => {
      const errorSession = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: '123e4567-e89b-12d3-a456-426614174001',
        status: 'error',
        current_phase: 'エラー発生',
        progress: 45,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T01:30:00Z',
        completed_at: null,
        error_message: 'API呼び出し制限に達しました'
      }

      const result = ideationSessionSchema.safeParse(errorSession)
      expect(result.success).toBe(true)
    })

    it('should reject invalid progress value', () => {
      const invalidSession = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: '123e4567-e89b-12d3-a456-426614174001',
        status: 'researching',
        current_phase: '情報収集フェーズ',
        progress: 150, // Invalid: > 100
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T01:00:00Z',
        completed_at: null,
        error_message: null
      }

      const result = ideationSessionSchema.safeParse(invalidSession)
      expect(result.success).toBe(false)
    })

    it('should reject negative progress value', () => {
      const invalidSession = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: '123e4567-e89b-12d3-a456-426614174001',
        status: 'researching',
        current_phase: '情報収集フェーズ',
        progress: -10,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T01:00:00Z',
        completed_at: null,
        error_message: null
      }

      const result = ideationSessionSchema.safeParse(invalidSession)
      expect(result.success).toBe(false)
    })

    it('should reject invalid status', () => {
      const invalidSession = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: '123e4567-e89b-12d3-a456-426614174001',
        status: 'pending' as any, // Invalid status
        current_phase: '情報収集フェーズ',
        progress: 25,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T01:00:00Z',
        completed_at: null,
        error_message: null
      }

      const result = ideationSessionSchema.safeParse(invalidSession)
      expect(result.success).toBe(false)
    })
  })

  describe('createSessionSchema', () => {
    it('should validate valid create session input', () => {
      const validInput = {
        user_id: '123e4567-e89b-12d3-a456-426614174001'
      }

      const result = createSessionSchema.safeParse(validInput)
      expect(result.success).toBe(true)
    })

    it('should reject invalid UUID', () => {
      const invalidInput = {
        user_id: 'invalid-uuid'
      }

      const result = createSessionSchema.safeParse(invalidInput)
      expect(result.success).toBe(false)
    })

    it('should reject missing user_id', () => {
      const invalidInput = {}

      const result = createSessionSchema.safeParse(invalidInput)
      expect(result.success).toBe(false)
    })
  })

  describe('updateSessionSchema', () => {
    it('should allow partial updates', () => {
      const validInput = {
        status: 'generating' as const,
        progress: 50
      }

      const result = updateSessionSchema.safeParse(validInput)
      expect(result.success).toBe(true)
    })

    it('should allow empty updates', () => {
      const validInput = {}

      const result = updateSessionSchema.safeParse(validInput)
      expect(result.success).toBe(true)
    })

    it('should allow updating completed_at', () => {
      const validInput = {
        status: 'completed' as const,
        progress: 100,
        completed_at: '2024-01-01T02:00:00Z'
      }

      const result = updateSessionSchema.safeParse(validInput)
      expect(result.success).toBe(true)
    })

    it('should reject invalid progress in update', () => {
      const invalidInput = {
        progress: 200
      }

      const result = updateSessionSchema.safeParse(invalidInput)
      expect(result.success).toBe(false)
    })
  })

  describe('sessionStatusEnum', () => {
    it('should accept all valid statuses', () => {
      const validStatuses = ['initializing', 'researching', 'generating', 'analyzing', 'completed', 'error']
      
      validStatuses.forEach(status => {
        const result = sessionStatusEnum.safeParse(status)
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid statuses', () => {
      const invalidStatuses = ['pending', 'in-progress', 'cancelled', 'failed', '']
      
      invalidStatuses.forEach(status => {
        const result = sessionStatusEnum.safeParse(status)
        expect(result.success).toBe(false)
      })
    })
  })
})