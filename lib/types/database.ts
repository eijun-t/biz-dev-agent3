export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      ideation_sessions: {
        Row: {
          id: string
          user_id: string
          status: 'initializing' | 'researching' | 'generating' | 'analyzing' | 'completed' | 'error'
          current_phase: string
          progress: number
          created_at: string
          updated_at: string
          completed_at: string | null
          error_message: string | null
        }
        Insert: {
          id?: string
          user_id: string
          status?: 'initializing' | 'researching' | 'generating' | 'analyzing' | 'completed' | 'error'
          current_phase?: string
          progress?: number
          created_at?: string
          updated_at?: string
          completed_at?: string | null
          error_message?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          status?: 'initializing' | 'researching' | 'generating' | 'analyzing' | 'completed' | 'error'
          current_phase?: string
          progress?: number
          created_at?: string
          updated_at?: string
          completed_at?: string | null
          error_message?: string | null
        }
      }
      business_ideas: {
        Row: {
          id: string
          session_id: string
          title: string
          description: string
          market_analysis: string
          revenue_projection: number
          implementation_difficulty: 'low' | 'medium' | 'high'
          time_to_market: string
          required_resources: string[]
          risks: string[]
          opportunities: string[]
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          title: string
          description: string
          market_analysis: string
          revenue_projection: number
          implementation_difficulty: 'low' | 'medium' | 'high'
          time_to_market: string
          required_resources?: string[]
          risks?: string[]
          opportunities?: string[]
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          title?: string
          description?: string
          market_analysis?: string
          revenue_projection?: number
          implementation_difficulty?: 'low' | 'medium' | 'high'
          time_to_market?: string
          required_resources?: string[]
          risks?: string[]
          opportunities?: string[]
          created_at?: string
        }
      }
      idea_feedback: {
        Row: {
          id: string
          idea_id: string
          user_id: string
          score: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          idea_id: string
          user_id: string
          score: number
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          idea_id?: string
          user_id?: string
          score?: number
          comment?: string | null
          created_at?: string
        }
      }
      agent_logs: {
        Row: {
          id: string
          session_id: string
          agent_name: 'researcher' | 'ideator' | 'critic' | 'analyst' | 'writer'
          message: string
          data: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          agent_name: 'researcher' | 'ideator' | 'critic' | 'analyst' | 'writer'
          message: string
          data?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          agent_name?: 'researcher' | 'ideator' | 'critic' | 'analyst' | 'writer'
          message?: string
          data?: Json | null
          created_at?: string
        }
      }
      system_logs: {
        Row: {
          id: string
          session_id: string | null
          user_id: string | null
          action: string
          details: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id?: string | null
          user_id?: string | null
          action: string
          details?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string | null
          user_id?: string | null
          action?: string
          details?: Json | null
          created_at?: string
        }
      }
      generation_jobs: {
        Row: {
          id: string
          user_id: string
          session_id: string
          status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
          priority: number
          input: Json
          output: Json | null
          error: string | null
          created_at: string
          updated_at: string
          started_at: string | null
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          session_id: string
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
          priority?: number
          input: Json
          output?: Json | null
          error?: string | null
          created_at?: string
          updated_at?: string
          started_at?: string | null
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          session_id?: string
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
          priority?: number
          input?: Json
          output?: Json | null
          error?: string | null
          created_at?: string
          updated_at?: string
          started_at?: string | null
          completed_at?: string | null
        }
      }
      checkpoints: {
        Row: {
          id: string
          session_id: string
          state: Json
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          state: Json
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          state?: Json
          created_at?: string
        }
      }
      progress_events: {
        Row: {
          id: string
          session_id: string
          event_type: string
          event_data: Json
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          event_type: string
          event_data: Json
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          event_type?: string
          event_data?: Json
          created_at?: string
        }
      }
      html_reports: {
        Row: {
          id: string
          session_id: string
          idea_id: string
          html_content: string
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_id: string
          idea_id: string
          html_content: string
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          idea_id?: string
          html_content?: string
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      dequeue_job: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          user_id: string
          session_id: string
          status: string
          priority: number
          input: Json
          output: Json | null
          error: string | null
          created_at: string
          updated_at: string
          started_at: string | null
          completed_at: string | null
        } | null
      }
      get_active_job_count: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}