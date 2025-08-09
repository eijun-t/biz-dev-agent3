/**
 * Ideator Agent API Route
 * ビジネスアイデア生成エージェントのAPIエンドポイント
 */

import { NextRequest, NextResponse } from 'next/server';
import { IdeatorAgent } from '@/lib/agents/ideator';
import { BroadResearcherAgent } from '@/lib/agents/broad-researcher';
import type { IdeationRequest } from '@/lib/types/ideator';
import { z } from 'zod';

/**
 * リクエストボディのバリデーションスキーマ
 */
const requestSchema = z.object({
  query: z.string().min(1, 'クエリは必須です'),
  researchOutput: z.object({
    processedResearch: z.object({
      summary: z.string(),
      sources: z.array(z.string()),
      queries: z.array(z.string())
    }),
    facts: z.array(z.string()),
    metrics: z.object({
      marketSize: z.number().optional(),
      growthRate: z.number().optional(),
      adoptionRate: z.number().optional()
    }).optional(),
    entities: z.array(z.object({
      name: z.string(),
      type: z.string(),
      relevance: z.number()
    })),
    detailedAnalysis: z.object({
      marketTrends: z.array(z.string()),
      competitiveLandscape: z.string(),
      opportunities: z.array(z.string()),
      challenges: z.array(z.string()),
      recommendations: z.array(z.string())
    })
  }).optional(),
  ideationRequest: z.object({
    numberOfIdeas: z.number().min(1).max(10).optional(),
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().min(100).max(16000).optional(),
    focusAreas: z.array(z.string()).optional(),
    constraints: z.array(z.string()).optional(),
    targetMarket: z.string().optional()
  }).optional(),
  enableValidation: z.boolean().optional(),
  skipResearch: z.boolean().optional()
});

/**
 * エラーレスポンスを生成
 */
function createErrorResponse(
  message: string,
  status: number = 500,
  details?: any
): NextResponse {
  console.error(`[Ideator API Error] ${message}`, details);
  return NextResponse.json(
    {
      error: message,
      details: process.env.NODE_ENV === 'development' ? details : undefined,
      timestamp: new Date().toISOString()
    },
    { status }
  );
}

/**
 * POST /api/agents/ideator
 * ビジネスアイデアを生成
 */
export async function POST(request: NextRequest) {
  try {
    // リクエストボディをパース
    const body = await request.json();
    
    // バリデーション
    const validationResult = requestSchema.safeParse(body);
    if (!validationResult.success) {
      return createErrorResponse(
        'Invalid request parameters',
        400,
        validationResult.error.errors
      );
    }

    const { 
      query, 
      researchOutput, 
      ideationRequest, 
      enableValidation = true,
      skipResearch = false 
    } = validationResult.data;

    // 研究データの取得または使用
    let enhancedOutput;
    
    if (skipResearch && researchOutput) {
      // 提供された研究データを使用
      enhancedOutput = researchOutput;
    } else {
      // Broad Researcherで新規調査を実行
      try {
        const researcher = new BroadResearcherAgent({
          maxSearchResults: 10,
          enableCache: true
        });

        const searchResult = await researcher.research(query);
        enhancedOutput = await researcher.enhance(searchResult);
      } catch (error) {
        return createErrorResponse(
          'Failed to conduct market research',
          500,
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    }

    // Ideatorエージェントの初期化
    const ideator = new IdeatorAgent({
      enableValidation,
      enableLogging: process.env.NODE_ENV === 'development'
    });

    // アイデア生成
    const output = await ideator.generateIdeas(
      enhancedOutput,
      ideationRequest as IdeationRequest
    );

    // メトリクスを取得
    const metrics = ideator.getMetrics();

    // 成功レスポンス
    return NextResponse.json({
      success: true,
      data: {
        ideas: output.ideas,
        summary: output.summary,
        metadata: output.metadata,
        research: {
          summary: enhancedOutput.processedResearch.summary,
          sources: enhancedOutput.processedResearch.sources
        }
      },
      metrics: {
        tokenUsage: metrics.tokenUsage,
        performance: metrics.performanceMetrics
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Ideator API] Unexpected error:', error);
    
    if (error instanceof Error) {
      // 特定のエラータイプの処理
      if (error.message.includes('API key')) {
        return createErrorResponse(
          'API configuration error. Please check your OpenAI API key.',
          500
        );
      }
      
      if (error.message.includes('rate limit')) {
        return createErrorResponse(
          'Rate limit exceeded. Please try again later.',
          429
        );
      }

      if (error.message.includes('timeout')) {
        return createErrorResponse(
          'Request timeout. The operation took too long to complete.',
          504
        );
      }
    }

    return createErrorResponse(
      'An unexpected error occurred while generating ideas',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * GET /api/agents/ideator
 * APIの状態を確認
 */
export async function GET(request: NextRequest) {
  try {
    // 環境変数のチェック
    const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
    const hasSerperKey = !!process.env.SERPER_API_KEY;

    return NextResponse.json({
      status: 'ready',
      configuration: {
        openai: hasOpenAIKey ? 'configured' : 'missing',
        serper: hasSerperKey ? 'configured' : 'missing'
      },
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return createErrorResponse(
      'Failed to check API status',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * OPTIONS /api/agents/ideator
 * CORS対応
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}