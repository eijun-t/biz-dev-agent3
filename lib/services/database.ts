import { createClient } from '@/lib/supabase/server'
import type { DatabaseService } from '@/lib/interfaces/database'
import type { User, IdeationSession, BusinessIdea, IdeaFeedback } from '@/lib/types'

export class SupabaseDatabaseService implements DatabaseService {
  // User operations
  async createUser(email: string, password: string, name?: string): Promise<User> {
    const supabase = await createClient()
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || null
        }
      }
    })

    if (authError) throw authError
    if (!authData.user) throw new Error('User creation failed')

    // Wait for trigger to create user profile
    await new Promise(resolve => setTimeout(resolve, 1000))

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (userError) throw userError
    if (!user) throw new Error('User profile not found')

    return user
  }

  async getUserById(id: string): Promise<User | null> {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) return null
    return data
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !data) return null
    return data
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const supabase = await createClient()
    
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    if (!updatedUser) throw new Error('User update failed')

    return updatedUser
  }

  // Session operations
  async createSession(userId: string): Promise<IdeationSession> {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('ideation_sessions')
      .insert({
        user_id: userId,
        status: 'initializing',
        current_phase: 'initialization',
        progress: 0
      })
      .select()
      .single()

    if (error) throw error
    if (!data) throw new Error('Session creation failed')

    return data
  }

  async getSession(id: string): Promise<IdeationSession | null> {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('ideation_sessions')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) return null
    return data
  }

  async getUserSessions(userId: string): Promise<IdeationSession[]> {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('ideation_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  async updateSession(id: string, data: Partial<IdeationSession>): Promise<IdeationSession> {
    const supabase = await createClient()
    
    const { data: updatedSession, error } = await supabase
      .from('ideation_sessions')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    if (!updatedSession) throw new Error('Session update failed')

    return updatedSession
  }

  // Idea operations
  async createIdea(sessionId: string, data: Omit<BusinessIdea, 'id' | 'created_at'>): Promise<BusinessIdea> {
    const supabase = await createClient()
    
    const { data: idea, error } = await supabase
      .from('business_ideas')
      .insert({
        ...data,
        session_id: sessionId
      })
      .select()
      .single()

    if (error) throw error
    if (!idea) throw new Error('Idea creation failed')

    return idea
  }

  async getIdea(id: string): Promise<BusinessIdea | null> {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('business_ideas')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) return null
    return data
  }

  async getSessionIdeas(sessionId: string): Promise<BusinessIdea[]> {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('business_ideas')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  async updateIdea(id: string, data: Partial<BusinessIdea>): Promise<BusinessIdea> {
    const supabase = await createClient()
    
    const { data: updatedIdea, error } = await supabase
      .from('business_ideas')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    if (!updatedIdea) throw new Error('Idea update failed')

    return updatedIdea
  }

  // Feedback operations
  async createFeedback(ideaId: string, userId: string, score: number, comment?: string): Promise<IdeaFeedback> {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('idea_feedback')
      .insert({
        idea_id: ideaId,
        user_id: userId,
        score,
        comment
      })
      .select()
      .single()

    if (error) throw error
    if (!data) throw new Error('Feedback creation failed')

    return data
  }

  async getIdeaFeedback(ideaId: string): Promise<IdeaFeedback[]> {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('idea_feedback')
      .select('*')
      .eq('idea_id', ideaId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  async getUserFeedback(userId: string): Promise<IdeaFeedback[]> {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('idea_feedback')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }
}

// Singleton instance
let databaseService: SupabaseDatabaseService | null = null

export function getDatabaseService(): SupabaseDatabaseService {
  if (!databaseService) {
    databaseService = new SupabaseDatabaseService()
  }
  return databaseService
}