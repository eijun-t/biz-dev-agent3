/**
 * 統合実行エンドポイント
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { MainOrchestration } from '@/lib/orchestration/main';
import { v4 as uuidv4 } from 'uuid';
import { createAPILogger } from '@/lib/utils/logger';

const logger = createAPILogger('/api/agents/execute');

export async function POST(request: NextRequest) {
  try {
    // 認証
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // 開発環境では認証をスキップ
    const isDev = process.env.NODE_ENV === 'development';
    const userId = user?.id || (isDev ? '00000000-0000-0000-0000-000000000000' : null);
    
    if (!isDev && (authError || !user)) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // パラメータ取得
    const { topic, theme } = await request.json();
    const targetTopic = topic || theme;
    if (!targetTopic) {
      return NextResponse.json({ error: 'トピックが必要です' }, { status: 400 });
    }

    // セッション作成
    const sessionId = uuidv4();
    const { error: insertError } = await supabase.from('ideation_sessions').insert({
      id: sessionId,
      user_id: userId,
      theme: targetTopic,
      status: 'generating',  // 'processing'ではなく'generating'を使用
      progress: 0,
    });
    
    if (insertError) {
      logger.error('Failed to create session', insertError as Error, {
        sessionId,
        userId
      });
      return NextResponse.json({ error: 'セッション作成に失敗しました' }, { status: 500 });
    }
    
    console.log('Session created:', sessionId);

    // オーケストレーション実行
    const orchestration = new MainOrchestration();
    const result = await orchestration.execute({
      sessionId,
      userId: userId,
      topic: targetTopic,
      supabase,
      onProgress: async (progress, message) => {
        await supabase.from('ideation_sessions')
          .update({ progress, current_phase: message })
          .eq('id', sessionId);
      }
    });

    // 結果を保存
    if (result.success) {
      await supabase.from('ideation_sessions')
        .update({ 
          status: 'completed',
          result: result.data?.writer,
          completed_at: new Date().toISOString()
        })
        .eq('id', sessionId);
    } else {
      await supabase.from('ideation_sessions')
        .update({ 
          status: 'error',
          error_message: result.error
        })
        .eq('id', sessionId);
    }

    return NextResponse.json(result);
    
  } catch (error) {
    logger.error('Execution error', error as Error, {
      path: request.url
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}