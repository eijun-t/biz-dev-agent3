import { z } from 'zod'

export const sessionStatusEnum = z.enum([
  'initializing',
  'researching',
  'generating',
  'analyzing',
  'completed',
  'error'
])

export const ideationSessionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  status: sessionStatusEnum,
  current_phase: z.string(),
  progress: z.number().min(0).max(100),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  completed_at: z.string().datetime().nullable(),
  error_message: z.string().nullable()
})

export const createSessionSchema = z.object({
  user_id: z.string().uuid()
})

export const updateSessionSchema = z.object({
  status: sessionStatusEnum.optional(),
  current_phase: z.string().optional(),
  progress: z.number().min(0).max(100).optional(),
  completed_at: z.string().datetime().optional(),
  error_message: z.string().optional()
})

export type IdeationSession = z.infer<typeof ideationSessionSchema>
export type CreateSessionInput = z.infer<typeof createSessionSchema>
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>