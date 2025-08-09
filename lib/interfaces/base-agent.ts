import { AgentMessage } from '@/lib/types'

export interface BaseAgentContext {
  sessionId: string
  userId: string
  model?: string
  temperature?: number
  maxTokens?: number
  metadata?: Record<string, any>
}

export interface AgentExecutionResult {
  success: boolean
  data?: any
  error?: string
  messages: AgentMessage[]
}

export abstract class BaseAgent {
  protected context: BaseAgentContext
  
  constructor(context: BaseAgentContext) {
    this.context = context
  }
  
  abstract execute(input: any): Promise<AgentExecutionResult>
  
  protected createMessage(message: string, data?: any): AgentMessage {
    return {
      agent: this.getAgentName(),
      message,
      timestamp: new Date().toISOString(),
      data
    }
  }
  
  abstract getAgentName(): 'researcher' | 'ideator' | 'critic' | 'analyst' | 'writer'
}