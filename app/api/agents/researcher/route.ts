/**
 * Broad Researcher Agent API Route
 * Edge Function for executing market research
 */

import { NextRequest, NextResponse } from 'next/server'
import { BroadResearcherAgent } from '@/lib/agents/broad-researcher/broad-researcher-agent'
import { SerperSearchService } from '@/lib/services/serper/serper-search-service'
import { ChatOpenAI } from '@langchain/openai'
import { createClient } from '@supabase/supabase-js'
import { researcherInputSchema } from '@/lib/validations/search'
import { ErrorHandler } from '@/lib/agents/broad-researcher/errors'
import { z } from 'zod'

// Edge runtime configuration
export const runtime = 'edge'

// Initialize services
const initializeServices = () => {
  // Validate environment variables
  if (!process.env.SERPER_API_KEY) {
    throw new Error('SERPER_API_KEY is required')
  }
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is required')
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase credentials are required')
  }

  // Initialize Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false
      }
    }
  )

  // Initialize search service
  const searchService = new SerperSearchService()

  // Initialize LLM
  const llm = new ChatOpenAI({
    modelName: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
    temperature: 0.7,
    openAIApiKey: process.env.OPENAI_API_KEY
  })

  return { supabase, searchService, llm }
}

// Database service adapter for Edge Functions
class EdgeDatabaseService {
  constructor(private supabase: any) {}

  async query(text: string, params?: any[]): Promise<any> {
    // Edge Functions don't support direct SQL queries
    // Use Supabase client methods instead
    throw new Error('Direct SQL queries not supported in Edge Functions')
  }

  async insert(table: string, data: any): Promise<any> {
    const { data: result, error } = await this.supabase
      .from(table)
      .insert(data)
      .select()
      .single()

    if (error) throw error
    return result
  }

  async update(table: string, data: any, where: any): Promise<any> {
    const { data: result, error } = await this.supabase
      .from(table)
      .update(data)
      .match(where)
      .select()
      .single()

    if (error) throw error
    return result
  }

  async delete(table: string, where: any): Promise<any> {
    const { error } = await this.supabase
      .from(table)
      .delete()
      .match(where)

    if (error) throw error
  }
}

// Request validation schema
const requestSchema = z.object({
  theme: z.string().min(1).max(500),
  sessionId: z.string().uuid(),
  userId: z.string().uuid().optional()
})

// OPTIONS handler for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
}

// POST handler
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validatedData = requestSchema.parse(body)

    // Get authorization header (optional for debug mode)
    const authHeader = request.headers.get('authorization')
    const isDebugMode = validatedData.userId === 'debug-user'

    // Initialize services
    const { supabase, searchService, llm } = initializeServices()
    const db = new EdgeDatabaseService(supabase)

    // Verify user token (skip in debug mode)
    let userId = validatedData.userId || 'anonymous'
    
    if (!isDebugMode) {
      if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json(
          { error: '認証が必要です' },
          { status: 401 }
        )
      }
      
      const token = authHeader.substring(7)
      const { data: { user }, error: authError } = await supabase.auth.getUser(token)
      
      if (authError || !user) {
        return NextResponse.json(
          { error: '無効な認証トークンです' },
          { status: 401 }
        )
      }
      
      userId = user.id
    }

    // Create agent context
    const context = {
      sessionId: validatedData.sessionId,
      userId: userId,
      metadata: {
        requestId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        debugMode: isDebugMode
      }
    }

    // Initialize agent
    const agent = new BroadResearcherAgent(
      context,
      searchService,
      llm,
      db
    )

    // Execute research
    const result = await agent.execute({
      theme: validatedData.theme,
      sessionId: validatedData.sessionId
    })

    // Return response
    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.data,
        messages: result.messages
      })
    } else {
      // Handle agent execution error
      const userMessage = ErrorHandler.getUserMessage(
        new Error(result.error || '不明なエラー')
      )
      
      return NextResponse.json(
        {
          success: false,
          error: userMessage,
          messages: result.messages
        },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('API Route Error:', error)

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: '入力データが不正です',
          details: error.errors
        },
        { status: 400 }
      )
    }

    // Handle other errors
    const userMessage = ErrorHandler.getUserMessage(error)
    const isRetryable = ErrorHandler.isRetryable(error)

    return NextResponse.json(
      {
        success: false,
        error: userMessage,
        retryable: isRetryable
      },
      { status: 500 }
    )
  }
}

// Health check endpoint
export async function GET(request: NextRequest) {
  try {
    const { searchService } = initializeServices()
    
    // Validate API keys
    const isValid = await searchService.validateApiKey()
    
    return NextResponse.json({
      status: 'ok',
      service: 'broad-researcher-agent',
      apiKeyValid: isValid,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        service: 'broad-researcher-agent',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    )
  }
}