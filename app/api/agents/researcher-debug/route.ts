/**
 * Debug version of Researcher Agent API Route
 * No authentication required
 */

import { NextRequest, NextResponse } from 'next/server'
import { ProductionResearcherAgent } from '@/lib/agents/broad-researcher/production-researcher-agent'
import { SerperSearchService } from '@/lib/services/serper/serper-search-service'
import { ChatOpenAI } from '@langchain/openai'
import { z } from 'zod'

// Edge runtime configuration
export const runtime = 'edge'

// Mock database for debug
class MockDatabaseService {
  async query(): Promise<any> { return { rows: [] } }
  async insert(): Promise<any> { return { id: 'mock-id' } }
  async update(): Promise<any> { return {} }
  async delete(): Promise<any> { return {} }
}

// Request validation schema
const requestSchema = z.object({
  theme: z.string().min(1).max(500),
  sessionId: z.string().uuid(),
  userId: z.string().optional()
})

// POST handler
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validatedData = requestSchema.parse(body)

    // Validate environment variables
    if (!process.env.SERPER_API_KEY) {
      return NextResponse.json(
        { error: 'SERPER_API_KEY is not configured' },
        { status: 500 }
      )
    }
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY is not configured' },
        { status: 500 }
      )
    }

    // Initialize services
    const searchService = new SerperSearchService()
    const llm = new ChatOpenAI({
      modelName: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.7,
      openAIApiKey: process.env.OPENAI_API_KEY
    })
    const db = new MockDatabaseService()

    // Create agent context
    const context = {
      sessionId: validatedData.sessionId,
      userId: validatedData.userId || 'debug-user',
      metadata: {
        requestId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        debugMode: true
      }
    }

    // Initialize production agent
    const agent = new ProductionResearcherAgent(
      context,
      searchService,
      llm,
      db as any
    )

    // Execute research
    const result = await agent.execute({
      theme: validatedData.theme,
      sessionId: validatedData.sessionId
    })

    // Return response
    return NextResponse.json(result)

  } catch (error) {
    console.error('Debug API Route Error:', error)

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid input data',
          details: error.errors
        },
        { status: 400 }
      )
    }

    // Handle other errors
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Health check endpoint
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    service: 'researcher-debug',
    env: {
      hasSerperKey: !!process.env.SERPER_API_KEY,
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini'
    },
    timestamp: new Date().toISOString()
  })
}