import { createClient } from '@supabase/supabase-js'
import { createServiceLogger } from '@/lib/utils/logger'

export type GenerationPhase = 
  | 'initializing'
  | 'data_integration'
  | 'summary_generation'
  | 'business_model_generation'
  | 'market_analysis_generation'
  | 'synergy_evaluation'
  | 'validation_plan_generation'
  | 'finalizing'
  | 'completed'
  | 'failed'

interface LogEntry {
  agentType: 'writer'
  sessionId: string
  userId: string
  action: string
  details?: Record<string, any>
  generationPhase: GenerationPhase
  completionPercentage: number
}

export class WriterLogger {
  private supabase: ReturnType<typeof createClient>
  private sessionId: string
  private userId: string
  private currentPhase: GenerationPhase = 'initializing'
  private startTime: number
  private logger = createServiceLogger('WriterLogger')

  constructor(config: {
    supabaseUrl: string
    supabaseKey: string
    sessionId: string
    userId: string
  }) {
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey)
    this.sessionId = config.sessionId
    this.userId = config.userId
    this.startTime = Date.now()
  }

  private getCompletionPercentage(phase: GenerationPhase): number {
    const phasePercentages: Record<GenerationPhase, number> = {
      'initializing': 5,
      'data_integration': 15,
      'summary_generation': 30,
      'business_model_generation': 45,
      'market_analysis_generation': 60,
      'synergy_evaluation': 75,
      'validation_plan_generation': 90,
      'finalizing': 95,
      'completed': 100,
      'failed': -1
    }
    return phasePercentages[phase] || 0
  }

  async logPhaseStart(phase: GenerationPhase, details?: Record<string, any>) {
    this.currentPhase = phase
    const percentage = this.getCompletionPercentage(phase)
    
    const logEntry: LogEntry = {
      agentType: 'writer',
      sessionId: this.sessionId,
      userId: this.userId,
      action: `phase_${phase}_started`,
      details: {
        ...details,
        elapsedTime: Date.now() - this.startTime
      },
      generationPhase: phase,
      completionPercentage: percentage
    }

    try {
      const { error } = await this.supabase
        .from('agent_logs')
        .insert({
          agent_type: logEntry.agentType,
          session_id: logEntry.sessionId,
          user_id: logEntry.userId,
          action: logEntry.action,
          details: logEntry.details,
          generation_phase: logEntry.generationPhase,
          completion_percentage: logEntry.completionPercentage,
          created_at: new Date().toISOString()
        })

      if (error) {
        this.logger.debug('Error logging phase start', { error: (error as Error).message })
      }
    } catch (error) {
      this.logger.debug('Failed to log phase start', { error: (error as Error).message })
    }
  }

  async logPhaseComplete(phase: GenerationPhase, details?: Record<string, any>) {
    const logEntry: LogEntry = {
      agentType: 'writer',
      sessionId: this.sessionId,
      userId: this.userId,
      action: `phase_${phase}_completed`,
      details: {
        ...details,
        elapsedTime: Date.now() - this.startTime
      },
      generationPhase: phase,
      completionPercentage: this.getCompletionPercentage(phase)
    }

    try {
      const { error } = await this.supabase
        .from('agent_logs')
        .insert({
          agent_type: logEntry.agentType,
          session_id: logEntry.sessionId,
          user_id: logEntry.userId,
          action: logEntry.action,
          details: logEntry.details,
          generation_phase: logEntry.generationPhase,
          completion_percentage: logEntry.completionPercentage,
          created_at: new Date().toISOString()
        })

      if (error) {
        this.logger.debug('Error logging phase complete', { error: (error as Error).message })
      }
    } catch (error) {
      this.logger.debug('Failed to log phase complete', { error: (error as Error).message })
    }
  }

  async logError(error: Error, phase: GenerationPhase) {
    const logEntry: LogEntry = {
      agentType: 'writer',
      sessionId: this.sessionId,
      userId: this.userId,
      action: 'generation_error',
      details: {
        error: error.message,
        stack: error.stack,
        phase,
        elapsedTime: Date.now() - this.startTime
      },
      generationPhase: 'failed',
      completionPercentage: -1
    }

    try {
      const { error: logError } = await this.supabase
        .from('agent_logs')
        .insert({
          agent_type: logEntry.agentType,
          session_id: logEntry.sessionId,
          user_id: logEntry.userId,
          action: logEntry.action,
          details: logEntry.details,
          generation_phase: logEntry.generationPhase,
          completion_percentage: logEntry.completionPercentage,
          created_at: new Date().toISOString()
        })

      if (logError) {
        this.logger.debug('Error logging error', { error: (logError as Error).message })
      }
    } catch (error) {
      this.logger.debug('Failed to log error', { error: (error as Error).message })
    }
  }

  async logComplete(reportId: string, totalTime: number) {
    await this.logPhaseComplete('completed', {
      reportId,
      totalTime,
      averagePhaseTime: totalTime / 8
    })
  }

  getCurrentPhase(): GenerationPhase {
    return this.currentPhase
  }

  getElapsedTime(): number {
    return Date.now() - this.startTime
  }
}