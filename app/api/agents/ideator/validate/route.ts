/**
 * Ideator Agent Validation API Route
 * ビジネスアイデアの検証エンドポイント
 */

import { NextRequest, NextResponse } from 'next/server';
import { IdeatorAgent } from '@/lib/agents/ideator';
import { z } from 'zod';
import { businessIdeaSchema } from '@/lib/validations/ideator';

/**
 * リクエストボディのバリデーションスキーマ
 */
const validateRequestSchema = z.object({
  idea: businessIdeaSchema,
  analyzeStrengthsAndWeaknesses: z.boolean().optional()
});

/**
 * POST /api/agents/ideator/validate
 * ビジネスアイデアを検証
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // バリデーション
    const validationResult = validateRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request parameters',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const { idea, analyzeStrengthsAndWeaknesses = false } = validationResult.data;

    // Ideatorエージェントの初期化
    const ideator = new IdeatorAgent({
      enableValidation: true,
      enableLogging: false
    });

    // アイデアの検証
    const validationResults = ideator.validateIdea(idea);

    // 強み・弱み分析（オプション）
    let analysis = null;
    if (analyzeStrengthsAndWeaknesses) {
      analysis = ideator.analyzeIdea(idea);
    }

    return NextResponse.json({
      success: true,
      data: {
        validation: validationResults,
        analysis: analysis
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Ideator Validate API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to validate idea',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}