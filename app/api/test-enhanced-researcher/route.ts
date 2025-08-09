import { NextResponse } from 'next/server'
import { ProductionResearcherAgent } from '@/lib/agents/broad-researcher/production-researcher-agent'
import { SerperSearchService } from '@/lib/services/serper/serper-search-service'
import { ChatOpenAI } from '@langchain/openai'

export async function POST(request: Request) {
  try {
    const { theme } = await request.json()

    // Initialize services with server-side environment variables
    const searchService = new SerperSearchService({
      apiKey: process.env.SERPER_API_KEY!,
    })
    
    const llm = new ChatOpenAI({
      modelName: 'gpt-4o-mini',
      temperature: 0.7,
      apiKey: process.env.OPENAI_API_KEY!,
    })

    // Create agent
    const agent = new ProductionResearcherAgent(
      {
        sessionId: crypto.randomUUID(),
        userId: 'test-user',
        model: 'gpt-4o-mini',
        temperature: 0.7,
        maxTokens: 4000,
      },
      searchService,
      llm,
      null
    )

    // Execute research
    const response = await agent.execute({
      theme: theme || 'AIを活用したビジネス自動化',
      sessionId: crypto.randomUUID(),
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}