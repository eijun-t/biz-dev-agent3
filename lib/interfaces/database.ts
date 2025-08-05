import { User, IdeationSession, BusinessIdea, IdeaFeedback } from '@/lib/types'

export interface DatabaseService {
  // User operations
  createUser(email: string, password: string, name?: string): Promise<User>
  getUserById(id: string): Promise<User | null>
  getUserByEmail(email: string): Promise<User | null>
  updateUser(id: string, data: Partial<User>): Promise<User>
  
  // Session operations
  createSession(userId: string): Promise<IdeationSession>
  getSession(id: string): Promise<IdeationSession | null>
  getUserSessions(userId: string): Promise<IdeationSession[]>
  updateSession(id: string, data: Partial<IdeationSession>): Promise<IdeationSession>
  
  // Idea operations
  createIdea(sessionId: string, data: Omit<BusinessIdea, 'id' | 'created_at'>): Promise<BusinessIdea>
  getIdea(id: string): Promise<BusinessIdea | null>
  getSessionIdeas(sessionId: string): Promise<BusinessIdea[]>
  updateIdea(id: string, data: Partial<BusinessIdea>): Promise<BusinessIdea>
  
  // Feedback operations
  createFeedback(ideaId: string, userId: string, score: number, comment?: string): Promise<IdeaFeedback>
  getIdeaFeedback(ideaId: string): Promise<IdeaFeedback[]>
  getUserFeedback(userId: string): Promise<IdeaFeedback[]>
}