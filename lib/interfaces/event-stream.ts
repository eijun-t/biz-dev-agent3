import { AgentMessage } from '@/lib/types'

export interface EventStreamMessage {
  type: 'agent_message' | 'phase_update' | 'progress_update' | 'idea_generated' | 'error' | 'complete'
  data: any
  timestamp: string
}

export interface PhaseUpdateData {
  phase: string
  description: string
}

export interface ProgressUpdateData {
  progress: number
  message?: string
}

export interface IdeaGeneratedData {
  ideaId: string
  title: string
  preview: string
}

export interface EventStreamService {
  sendMessage(sessionId: string, message: EventStreamMessage): void
  sendAgentMessage(sessionId: string, agentMessage: AgentMessage): void
  sendPhaseUpdate(sessionId: string, phase: string, description: string): void
  sendProgressUpdate(sessionId: string, progress: number, message?: string): void
  sendIdeaGenerated(sessionId: string, ideaId: string, title: string, preview: string): void
  sendError(sessionId: string, error: string): void
  sendComplete(sessionId: string): void
  closeConnection(sessionId: string): void
}