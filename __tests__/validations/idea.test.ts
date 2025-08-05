import { createIdeaSchema, businessIdeaSchema, implementationDifficultyEnum } from '@/lib/validations/idea'

describe('Idea Validation Schemas', () => {
  describe('businessIdeaSchema', () => {
    it('should validate a valid business idea', () => {
      const validIdea = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        session_id: '123e4567-e89b-12d3-a456-426614174001',
        title: 'AI駐車場管理システム',
        description: '画像認識技術を活用した効率的な駐車場管理システム',
        market_analysis: '日本の駐車場市場は年間5兆円規模',
        revenue_projection: 2000000000,
        implementation_difficulty: 'medium',
        time_to_market: '12ヶ月',
        required_resources: ['AI開発チーム', 'IoTエンジニア'],
        risks: ['技術的複雑性', '規制対応'],
        opportunities: ['市場拡大', '海外展開'],
        created_at: '2024-01-01T00:00:00Z'
      }

      const result = businessIdeaSchema.safeParse(validIdea)
      expect(result.success).toBe(true)
    })

    it('should accept empty arrays for resources, risks, opportunities', () => {
      const validIdea = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        session_id: '123e4567-e89b-12d3-a456-426614174001',
        title: 'AI駐車場管理システム',
        description: '画像認識技術を活用した効率的な駐車場管理システム',
        market_analysis: '日本の駐車場市場は年間5兆円規模',
        revenue_projection: 2000000000,
        implementation_difficulty: 'low',
        time_to_market: '6ヶ月',
        required_resources: [],
        risks: [],
        opportunities: [],
        created_at: '2024-01-01T00:00:00Z'
      }

      const result = businessIdeaSchema.safeParse(validIdea)
      expect(result.success).toBe(true)
    })

    it('should reject negative revenue projection', () => {
      const invalidIdea = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        session_id: '123e4567-e89b-12d3-a456-426614174001',
        title: 'AI駐車場管理システム',
        description: '画像認識技術を活用した効率的な駐車場管理システム',
        market_analysis: '日本の駐車場市場は年間5兆円規模',
        revenue_projection: -1000000,
        implementation_difficulty: 'medium',
        time_to_market: '12ヶ月',
        required_resources: [],
        risks: [],
        opportunities: [],
        created_at: '2024-01-01T00:00:00Z'
      }

      const result = businessIdeaSchema.safeParse(invalidIdea)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('収益予測は0以上である必要があります')
      }
    })

    it('should reject invalid implementation difficulty', () => {
      const invalidIdea = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        session_id: '123e4567-e89b-12d3-a456-426614174001',
        title: 'AI駐車場管理システム',
        description: '画像認識技術を活用した効率的な駐車場管理システム',
        market_analysis: '日本の駐車場市場は年間5兆円規模',
        revenue_projection: 2000000000,
        implementation_difficulty: 'very-hard' as any,
        time_to_market: '12ヶ月',
        required_resources: [],
        risks: [],
        opportunities: [],
        created_at: '2024-01-01T00:00:00Z'
      }

      const result = businessIdeaSchema.safeParse(invalidIdea)
      expect(result.success).toBe(false)
    })
  })

  describe('createIdeaSchema', () => {
    it('should validate a valid create idea input', () => {
      const validInput = {
        session_id: '123e4567-e89b-12d3-a456-426614174001',
        title: 'AI駐車場管理システム',
        description: '画像認識技術を活用した効率的な駐車場管理システム',
        market_analysis: '日本の駐車場市場は年間5兆円規模',
        revenue_projection: 2000000000,
        implementation_difficulty: 'medium' as const,
        time_to_market: '12ヶ月'
      }

      const result = createIdeaSchema.safeParse(validInput)
      expect(result.success).toBe(true)
    })

    it('should reject revenue projection below 1 billion yen', () => {
      const invalidInput = {
        session_id: '123e4567-e89b-12d3-a456-426614174001',
        title: 'AI駐車場管理システム',
        description: '画像認識技術を活用した効率的な駐車場管理システム',
        market_analysis: '日本の駐車場市場は年間5兆円規模',
        revenue_projection: 500000000, // 5億円
        implementation_difficulty: 'medium' as const,
        time_to_market: '12ヶ月'
      }

      const result = createIdeaSchema.safeParse(invalidInput)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('収益予測は10億円以上である必要があります')
      }
    })

    it('should reject empty required fields', () => {
      const invalidInput = {
        session_id: '123e4567-e89b-12d3-a456-426614174001',
        title: '',
        description: '画像認識技術を活用した効率的な駐車場管理システム',
        market_analysis: '日本の駐車場市場は年間5兆円規模',
        revenue_projection: 2000000000,
        implementation_difficulty: 'medium' as const,
        time_to_market: '12ヶ月'
      }

      const result = createIdeaSchema.safeParse(invalidInput)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('タイトルは必須です')
      }
    })

    it('should allow optional arrays to be omitted', () => {
      const validInput = {
        session_id: '123e4567-e89b-12d3-a456-426614174001',
        title: 'AI駐車場管理システム',
        description: '画像認識技術を活用した効率的な駐車場管理システム',
        market_analysis: '日本の駐車場市場は年間5兆円規模',
        revenue_projection: 2000000000,
        implementation_difficulty: 'medium' as const,
        time_to_market: '12ヶ月'
        // required_resources, risks, opportunities are omitted
      }

      const result = createIdeaSchema.safeParse(validInput)
      expect(result.success).toBe(true)
    })
  })

  describe('implementationDifficultyEnum', () => {
    it('should accept valid difficulty levels', () => {
      expect(implementationDifficultyEnum.safeParse('low').success).toBe(true)
      expect(implementationDifficultyEnum.safeParse('medium').success).toBe(true)
      expect(implementationDifficultyEnum.safeParse('high').success).toBe(true)
    })

    it('should reject invalid difficulty levels', () => {
      expect(implementationDifficultyEnum.safeParse('very-high').success).toBe(false)
      expect(implementationDifficultyEnum.safeParse('easy').success).toBe(false)
      expect(implementationDifficultyEnum.safeParse('').success).toBe(false)
    })
  })
})