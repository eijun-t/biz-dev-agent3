export interface User {
  id: string
  email: string
  name: string | null
  created_at: string
}

export interface IdeationSession {
  id: string
  user_id: string
  status: 'initializing' | 'researching' | 'generating' | 'analyzing' | 'completed' | 'error'
  current_phase: string
  progress: number
  created_at: string
  updated_at: string
  completed_at?: string
  error_message?: string
}

export interface BusinessIdea {
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

export interface IdeaFeedback {
  id: string
  idea_id: string
  user_id: string
  score: number
  comment?: string
  created_at: string
}

export interface AgentMessage {
  agent: 'researcher' | 'ideator' | 'critic' | 'analyst' | 'writer'
  message: string
  timestamp: string
  data?: any
}

export interface WebSearchResult {
  title: string
  link: string
  snippet: string
  date?: string
}

export interface AgentConfig {
  model: string
  temperature: number
  max_tokens: number
  timeout: number
}

export interface ApplicationConfig {
  openai_api_key: string
  serper_api_key: string
  cost_limit: number
  max_ideas_per_session: number
  session_timeout: number
}