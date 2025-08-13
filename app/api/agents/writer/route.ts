import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { WriterAgent } from '@/lib/agents/writer/writer-agent'
import { writerInputSchema } from '@/lib/validations/writer'
import { z } from 'zod'

const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 10
const RATE_LIMIT_WINDOW = 60000

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const userLimit = rateLimitMap.get(userId)

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (userLimit.count >= RATE_LIMIT) {
    return false
  }

  userLimit.count++
  return true
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!checkRateLimit(user.id)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Maximum 10 requests per minute.' },
        { status: 429 }
      )
    }

    const body = await request.json()

    let validatedInput
    try {
      validatedInput = writerInputSchema.parse(body)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid input', details: error.errors },
          { status: 400 }
        )
      }
      throw error
    }

    const writerAgent = new WriterAgent({
      sessionId: validatedInput.sessionId,
      userId: user.id
    })

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 5000)
    })

    const reportPromise = writerAgent.processAnalysisData(validatedInput)

    try {
      const report = await Promise.race([reportPromise, timeoutPromise])
      
      const { data: savedReport, error: saveError } = await supabase
        .from('html_reports')
        .insert({
          session_id: validatedInput.sessionId,
          user_id: user.id,
          report_data: report,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (saveError) {
        console.error('Error saving report:', saveError)
        return NextResponse.json(
          { error: 'Failed to save report' },
          { status: 500 }
        )
      }

      await supabase
        .from('agent_logs')
        .insert({
          agent_type: 'writer',
          session_id: validatedInput.sessionId,
          user_id: user.id,
          action: 'report_generated',
          details: {
            reportId: savedReport.id,
            generationTime: Date.now()
          },
          generation_phase: 'completed',
          completion_percentage: 100,
          created_at: new Date().toISOString()
        })

      return NextResponse.json({
        success: true,
        reportId: savedReport.id,
        report: report
      })

    } catch (error) {
      if (error instanceof Error && error.message === 'Request timeout') {
        return NextResponse.json(
          { error: 'Report generation timeout. Please try again.' },
          { status: 504 }
        )
      }
      throw error
    }

  } catch (error) {
    console.error('Writer API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}