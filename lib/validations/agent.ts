import { z } from 'zod'

export const agentNameEnum = z.enum(['researcher', 'ideator', 'critic', 'analyst', 'writer'])

export const agentMessageSchema = z.object({
  agent: agentNameEnum,
  message: z.string().min(1, 'メッセージは必須です'),
  timestamp: z.string().datetime(),
  data: z.any().optional()
})

export const agentLogSchema = z.object({
  id: z.string().uuid(),
  session_id: z.string().uuid(),
  agent_name: agentNameEnum,
  message: z.string().min(1, 'メッセージは必須です'),
  data: z.any().nullable(),
  created_at: z.string().datetime()
})

export const webSearchResultSchema = z.object({
  title: z.string(),
  link: z.string().url(),
  snippet: z.string(),
  date: z.string().optional()
})

export const webSearchQuerySchema = z.object({
  query: z.string().min(1, '検索クエリは必須です'),
  gl: z.string().optional(),
  hl: z.string().optional(),
  num: z.number().min(1).max(100).optional(),
  type: z.enum(['search', 'news', 'images']).optional()
})

export type AgentMessage = z.infer<typeof agentMessageSchema>
export type AgentLog = z.infer<typeof agentLogSchema>
export type WebSearchResult = z.infer<typeof webSearchResultSchema>
export type WebSearchQuery = z.infer<typeof webSearchQuerySchema>