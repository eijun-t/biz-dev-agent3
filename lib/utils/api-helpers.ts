/**
 * API Helper Utilities
 * 
 * API共通ヘルパー関数
 * - エラーレスポンス標準化
 * - CORS設定
 * - 認証チェック
 * - Edge Runtime対応
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ErrorResponse } from '@/lib/validations/orchestration';
import { createServiceLogger } from '@/lib/utils/logger';

const logger = createServiceLogger('APIHelpers');

/**
 * CORS ヘッダーを設定
 */
export function setCorsHeaders(response: NextResponse, methods: string[] = ['GET', 'POST', 'DELETE', 'OPTIONS']): NextResponse {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', methods.join(', '));
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Max-Age', '86400');
  return response;
}

/**
 * エラーレスポンスを作成
 */
export function createErrorResponse(
  error: string, 
  code?: string, 
  status: number = 500, 
  details?: any
): NextResponse {
  const errorResponse: ErrorResponse = {
    error,
    code,
    details,
    retryable: status >= 500
  };
  
  const response = NextResponse.json(errorResponse, { status });
  return setCorsHeaders(response);
}

/**
 * 成功レスポンスを作成
 */
export function createSuccessResponse(
  data: any, 
  status: number = 200,
  methods?: string[]
): NextResponse {
  const response = NextResponse.json(data, { status });
  return setCorsHeaders(response, methods);
}

/**
 * OPTIONS レスポンスを作成
 */
export function createOptionsResponse(methods: string[] = ['GET', 'POST', 'DELETE', 'OPTIONS']): NextResponse {
  const response = new NextResponse(null, { status: 200 });
  return setCorsHeaders(response, methods);
}

/**
 * 認証ユーザーを取得
 */
export async function getAuthenticatedUser(request?: NextRequest): Promise<{
  user: any;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('getAuthenticatedUser - No user or auth error:', authError);
      return { user: null, error: '認証が必要です' };
    }
    
    console.log('getAuthenticatedUser - User authenticated:', user.id);
    return { user };
  } catch (error) {
    logger.error('Authentication error', error as Error, { path: request.url });
    return { user: null, error: '認証の確認に失敗しました' };
  }
}

/**
 * リクエストボディをJSONとして解析
 */
export async function parseRequestBody<T>(request: NextRequest): Promise<{
  data?: T;
  error?: string;
}> {
  try {
    const body = await request.json();
    return { data: body };
  } catch (error) {
    logger.error('Request body parsing error', error as Error, { path: request.url });
    return { error: 'リクエストボディの解析に失敗しました' };
  }
}

/**
 * エラーの種類を判定してHTTPステータスコードを決定
 */
export function getErrorStatusCode(error: Error): number {
  const message = error.message.toLowerCase();
  
  if (message.includes('認証') || message.includes('unauthorized')) {
    return 401;
  }
  
  if (message.includes('権限') || message.includes('access') || message.includes('forbidden')) {
    return 403;
  }
  
  if (message.includes('見つかりません') || message.includes('not found')) {
    return 404;
  }
  
  if (message.includes('バリデーション') || message.includes('validation') || message.includes('形式')) {
    return 400;
  }
  
  if (message.includes('レート制限') || message.includes('rate limit')) {
    return 429;
  }
  
  if (message.includes('データベース') || message.includes('database') || message.includes('キュー')) {
    return 503;
  }
  
  // デフォルトは500 (Internal Server Error)
  return 500;
}

/**
 * エラーコードを生成
 */
export function generateErrorCode(error: Error): string {
  const message = error.message.toLowerCase();
  
  if (message.includes('認証')) return 'UNAUTHORIZED';
  if (message.includes('権限') || message.includes('access')) return 'ACCESS_DENIED';
  if (message.includes('見つかりません') || message.includes('not found')) return 'NOT_FOUND';
  if (message.includes('バリデーション') || message.includes('validation')) return 'VALIDATION_ERROR';
  if (message.includes('レート制限')) return 'RATE_LIMIT_EXCEEDED';
  if (message.includes('データベース')) return 'DATABASE_ERROR';
  if (message.includes('キュー')) return 'QUEUE_ERROR';
  if (message.includes('ネットワーク')) return 'NETWORK_ERROR';
  
  return 'INTERNAL_ERROR';
}

/**
 * エラーハンドリングミドルウェア
 */
export function handleApiError(error: unknown): NextResponse {
  logger.error('API Error', error instanceof Error ? error : new Error(String(error)), {
    statusCode,
    path: typeof window !== 'undefined' ? window.location.pathname : 'unknown'
  });
  
  if (error instanceof Error) {
    const statusCode = getErrorStatusCode(error);
    const errorCode = generateErrorCode(error);
    
    return createErrorResponse(
      error.message,
      errorCode,
      statusCode
    );
  }
  
  return createErrorResponse(
    '内部サーバーエラーが発生しました',
    'INTERNAL_ERROR',
    500
  );
}

/**
 * APIエンドポイントラッパー
 * 共通的なエラーハンドリングとCORS設定を提供
 */
export function withApiHandler(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      return await handler(request, context);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

/**
 * クエリパラメータの解析とバリデーション
 */
export function parseQueryParam(
  url: URL, 
  paramName: string, 
  defaultValue: string | number, 
  validator?: (value: string) => boolean
): string | number {
  const value = url.searchParams.get(paramName);
  
  if (!value) {
    return defaultValue;
  }
  
  if (validator && !validator(value)) {
    return defaultValue;
  }
  
  if (typeof defaultValue === 'number') {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  
  return value;
}