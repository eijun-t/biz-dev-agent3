import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // ユーザーの認証確認
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ideation_sessionsテーブルから過去のレポートを取得
    const { data: sessions, error } = await supabase
      .from('ideation_sessions')
      .select(`
        id,
        topic,
        status,
        created_at,
        completed_at,
        current_phase,
        progress,
        final_report
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Failed to fetch sessions:', error)
      return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
    }

    // セッションデータをレポート形式に変換
    const reports = sessions?.map(session => ({
      id: session.id,
      title: session.topic || 'Untitled',
      topic: session.topic || '',
      created_at: session.created_at,
      status: session.status === 'completed' ? 'completed' : 
              session.status === 'error' ? 'error' : 'processing',
      idea_count: session.final_report?.idea_count || 0,
      selected_count: session.final_report?.selected_count || 0,
      progress: session.progress || 0,
      current_phase: session.current_phase
    })) || []

    return NextResponse.json({ reports })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}