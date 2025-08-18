import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    // ユーザーの認証確認
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 特定のレポートを取得
    const { data: session, error } = await supabase
      .from('ideation_sessions')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (error || !session) {
      console.error('Failed to fetch report:', error)
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    // レポートデータを整形
    const report = {
      id: session.id,
      title: session.topic || session.theme || 'Untitled',
      topic: session.topic || session.theme || '',
      created_at: session.created_at,
      completed_at: session.completed_at,
      status: session.status,
      progress: session.progress,
      current_phase: session.current_phase,
      result: session.result,
      final_report: session.final_report,
      error_message: session.error_message
    }

    return NextResponse.json({ report })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}