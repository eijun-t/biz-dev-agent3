import { createUserSchema, updateUserSchema, userSchema } from '@/lib/validations/user'

describe('User Validation Schemas', () => {
  describe('userSchema', () => {
    it('should validate a valid user object', () => {
      const validUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        name: 'Test User',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      const result = userSchema.safeParse(validUser)
      expect(result.success).toBe(true)
    })

    it('should allow null name', () => {
      const validUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        name: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      const result = userSchema.safeParse(validUser)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const invalidUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'invalid-email',
        name: 'Test User',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      const result = userSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('有効なメールアドレスを入力してください')
      }
    })

    it('should reject invalid UUID', () => {
      const invalidUser = {
        id: 'invalid-uuid',
        email: 'test@example.com',
        name: 'Test User',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      const result = userSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
    })
  })

  describe('createUserSchema', () => {
    it('should validate a valid create user input', () => {
      const validInput = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      }

      const result = createUserSchema.safeParse(validInput)
      expect(result.success).toBe(true)
    })

    it('should allow optional name', () => {
      const validInput = {
        email: 'test@example.com',
        password: 'password123'
      }

      const result = createUserSchema.safeParse(validInput)
      expect(result.success).toBe(true)
    })

    it('should reject short password', () => {
      const invalidInput = {
        email: 'test@example.com',
        password: 'short'
      }

      const result = createUserSchema.safeParse(invalidInput)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('パスワードは8文字以上である必要があります')
      }
    })

    it('should reject invalid email format', () => {
      const invalidInput = {
        email: 'invalid-email',
        password: 'password123'
      }

      const result = createUserSchema.safeParse(invalidInput)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('有効なメールアドレスを入力してください')
      }
    })
  })

  describe('updateUserSchema', () => {
    it('should allow partial updates', () => {
      const validInput = {
        name: 'Updated Name'
      }

      const result = updateUserSchema.safeParse(validInput)
      expect(result.success).toBe(true)
    })

    it('should allow email update', () => {
      const validInput = {
        email: 'newemail@example.com'
      }

      const result = updateUserSchema.safeParse(validInput)
      expect(result.success).toBe(true)
    })

    it('should allow empty object', () => {
      const validInput = {}

      const result = updateUserSchema.safeParse(validInput)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email format in update', () => {
      const invalidInput = {
        email: 'invalid-email'
      }

      const result = updateUserSchema.safeParse(invalidInput)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('有効なメールアドレスを入力してください')
      }
    })
  })
})