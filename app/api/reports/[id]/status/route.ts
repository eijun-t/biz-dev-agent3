import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createAPILogger } from '@/lib/utils/logger'

const logger = createAPILogger('/api/reports/[id]/status')

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: logs, error: fetchError } = await supabase
      .from('agent_logs')
      .select('generation_phase, completion_percentage, created_at')
      .eq('agent_type', 'writer')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)

    if (fetchError) {
      logger.error('Error fetching status', fetchError as Error, {
        reportId: params.id
      })
      return NextResponse.json(
        { error: 'Failed to fetch status' },
        { status: 500 }
      )
    }

    const latestLog = logs?.[0]

    if (!latestLog) {
      return NextResponse.json({
        status: 'not_started',
        phase: null,
        completionPercentage: 0
      })
    }

    const status = latestLog.generation_phase === 'completed' 
      ? 'completed'
      : latestLog.generation_phase === 'failed'
      ? 'failed'
      : 'in_progress'

    return NextResponse.json({
      status,
      phase: latestLog.generation_phase,
      completionPercentage: latestLog.completion_percentage || 0,
      lastUpdated: latestLog.created_at
    })

  } catch (error) {
    logger.error('Status API error', error as Error, {
      reportId: params.id
    })
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}