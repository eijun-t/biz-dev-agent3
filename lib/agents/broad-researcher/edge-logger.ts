/**
 * Edge-compatible logger for agent executions
 * Edge Functions環境で動作する軽量ロガー
 */

import { AgentLogEntry } from '@/lib/types/agents'

/**
 * In-memory logger for Edge Functions
 */
export class EdgeLogger {
  private static logs: AgentLogEntry[] = []
  private static maxLogs = 100

  /**
   * Log agent execution
   */
  async log(entry: Omit<AgentLogEntry, 'id' | 'createdAt'>): Promise<void> {
    const logEntry: AgentLogEntry = {
      ...entry,
      id: crypto.randomUUID(),
      createdAt: new Date()
    }

    // Add to in-memory storage
    EdgeLogger.logs.unshift(logEntry)
    
    // Keep only recent logs
    if (EdgeLogger.logs.length > EdgeLogger.maxLogs) {
      EdgeLogger.logs = EdgeLogger.logs.slice(0, EdgeLogger.maxLogs)
    }

    // In production, you might want to send logs to an external service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to logging service (e.g., Datadog, LogDNA, etc.)
      console.log('[EdgeLogger]', JSON.stringify(logEntry))
    }
  }

  /**
   * Get recent logs
   */
  static getRecentLogs(limit: number = 20): AgentLogEntry[] {
    return EdgeLogger.logs.slice(0, limit)
  }

  /**
   * Search logs by criteria
   */
  static searchLogs(criteria: {
    sessionId?: string
    agentName?: string
    level?: 'info' | 'warn' | 'error'
    limit?: number
  }): AgentLogEntry[] {
    let filtered = EdgeLogger.logs

    if (criteria.sessionId) {
      filtered = filtered.filter(log => log.sessionId === criteria.sessionId)
    }

    if (criteria.agentName) {
      filtered = filtered.filter(log => log.agentName === criteria.agentName)
    }

    if (criteria.level) {
      filtered = filtered.filter(log => log.level === criteria.level)
    }

    return filtered.slice(0, criteria.limit || 20)
  }

  /**
   * Clear all logs
   */
  static clearLogs(): void {
    EdgeLogger.logs = []
  }
}

/**
 * Fallback logger that just console logs
 */
export class FallbackLogger {
  async log(entry: Omit<AgentLogEntry, 'id' | 'createdAt'>): Promise<void> {
    console.log(`[${entry.level || 'info'}] ${entry.agentName}: ${entry.message}`, entry.data)
  }
}