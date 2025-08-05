import { z } from 'zod'

export const implementationDifficultyEnum = z.enum(['low', 'medium', 'high'])

export const businessIdeaSchema = z.object({
  id: z.string().uuid(),
  session_id: z.string().uuid(),
  title: z.string().min(1, 'タイトルは必須です'),
  description: z.string().min(1, '説明は必須です'),
  market_analysis: z.string().min(1, '市場分析は必須です'),
  revenue_projection: z.number().min(0, '収益予測は0以上である必要があります'),
  implementation_difficulty: implementationDifficultyEnum,
  time_to_market: z.string().min(1, '市場投入までの期間は必須です'),
  required_resources: z.array(z.string()).default([]),
  risks: z.array(z.string()).default([]),
  opportunities: z.array(z.string()).default([]),
  created_at: z.string().datetime()
})

export const createIdeaSchema = z.object({
  session_id: z.string().uuid(),
  title: z.string().min(1, 'タイトルは必須です'),
  description: z.string().min(1, '説明は必須です'),
  market_analysis: z.string().min(1, '市場分析は必須です'),
  revenue_projection: z.number().min(1000000000, '収益予測は10億円以上である必要があります'),
  implementation_difficulty: implementationDifficultyEnum,
  time_to_market: z.string().min(1, '市場投入までの期間は必須です'),
  required_resources: z.array(z.string()).optional(),
  risks: z.array(z.string()).optional(),
  opportunities: z.array(z.string()).optional()
})

export const updateIdeaSchema = createIdeaSchema.partial()

export type BusinessIdea = z.infer<typeof businessIdeaSchema>
export type CreateIdeaInput = z.infer<typeof createIdeaSchema>
export type UpdateIdeaInput = z.infer<typeof updateIdeaSchema>