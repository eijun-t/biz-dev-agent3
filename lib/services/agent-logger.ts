import { createClient } from '@/lib/supabase/server'
import type { AgentMessage } from '@/lib/types'

export class AgentLoggerService {
  async logAgentMessage(sessionId: string, message: AgentMessage): Promise<void> {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('agent_logs')
      .insert({
        session_id: sessionId,
        agent_name: message.agent,
        message: message.message,
        data: message.data || null
      })

    if (error) {
      console.error('Failed to log agent message:', error)
    }
  }

  async getAgentLogs(sessionId: string): Promise<AgentMessage[]> {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('agent_logs')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Failed to get agent logs:', error)
      return []
    }

    return data.map(log => ({
      agent: log.agent_name,
      message: log.message,
      timestamp: log.created_at,
      data: log.data
    }))
  }

  async logSystemAction(action: string, details: any, sessionId?: string, userId?: string): Promise<void> {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('system_logs')
      .insert({
        session_id: sessionId || null,
        user_id: userId || null,
        action,
        details: details || null
      })

    if (error) {
      console.error('Failed to log system action:', error)
    }
  }
}

// Singleton instance
let agentLoggerService: AgentLoggerService | null = null

export function getAgentLoggerService(): AgentLoggerService {
  if (!agentLoggerService) {
    agentLoggerService = new AgentLoggerService()
  }
  return agentLoggerService
}