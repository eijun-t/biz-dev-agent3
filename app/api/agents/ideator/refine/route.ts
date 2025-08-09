/**
 * Ideator Agent Refine API Route
 * ビジネスアイデアの改善エンドポイント
 */

import { NextRequest, NextResponse } from 'next/server';
import { IdeatorAgent } from '@/lib/agents/ideator';
import { z } from 'zod';
import { businessIdeaSchema } from '@/lib/validations/ideator';

/**
 * リクエストボディのバリデーションスキーマ
 */
const refineRequestSchema = z.object({
  idea: businessIdeaSchema,
  feedback: z.string().min(1, 'フィードバックは必須です'),
  validateResult: z.boolean().optional()
});

/**
 * POST /api/agents/ideator/refine
 * ビジネスアイデアを改善
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // バリデーション
    const validationResult = refineRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request parameters',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const { idea, feedback, validateResult = true } = validationResult.data;

    // Ideatorエージェントの初期化
    const ideator = new IdeatorAgent({
      enableValidation: validateResult,
      enableLogging: process.env.NODE_ENV === 'development'
    });

    // アイデアの改善
    const refinedIdea = await ideator.refineIdea(idea, feedback);

    // 改善後の検証（オプション）
    let validation = null;
    let analysis = null;
    if (validateResult) {
      validation = ideator.validateIdea(refinedIdea);
      analysis = ideator.analyzeIdea(refinedIdea);
    }

    // メトリクスを取得
    const metrics = ideator.getMetrics();

    return NextResponse.json({
      success: true,
      data: {
        originalIdea: idea,
        refinedIdea,
        validation,
        analysis,
        improvements: {
          titleChanged: idea.title !== refinedIdea.title,
          descriptionChanged: idea.description !== refinedIdea.description,
          revenueChanged: idea.estimatedRevenue !== refinedIdea.estimatedRevenue
        }
      },
      metrics: {
        tokenUsage: metrics.tokenUsage
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Ideator Refine API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to refine idea',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}