import { z } from 'zod'

export const ideaFeedbackSchema = z.object({
  id: z.string().uuid(),
  idea_id: z.string().uuid(),
  user_id: z.string().uuid(),
  score: z.number().min(1, 'スコアは1以上である必要があります').max(5, 'スコアは5以下である必要があります'),
  comment: z.string().nullable(),
  created_at: z.string().datetime()
})

export const createFeedbackSchema = z.object({
  idea_id: z.string().uuid(),
  user_id: z.string().uuid(),
  score: z.number().min(1, 'スコアは1以上である必要があります').max(5, 'スコアは5以下である必要があります'),
  comment: z.string().optional()
})

export const updateFeedbackSchema = z.object({
  score: z.number().min(1, 'スコアは1以上である必要があります').max(5, 'スコアは5以下である必要があります').optional(),
  comment: z.string().optional()
})

export type IdeaFeedback = z.infer<typeof ideaFeedbackSchema>
export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>
export type UpdateFeedbackInput = z.infer<typeof updateFeedbackSchema>