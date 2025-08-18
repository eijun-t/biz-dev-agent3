/**
 * Production Configuration
 * 本番環境設定・最終最適化
 */

// 環境変数
export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_TEST: process.env.NODE_ENV === 'test',
  
  // API設定
  API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://api.production.com',
  WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'wss://ws.production.com',
  
  // 認証
  AUTH_ENABLED: process.env.NEXT_PUBLIC_AUTH_ENABLED === 'true',
  AUTH_PROVIDER: process.env.NEXT_PUBLIC_AUTH_PROVIDER || 'supabase',
  
  // 機能フラグ
  FEATURE_REALTIME: process.env.NEXT_PUBLIC_FEATURE_REALTIME !== 'false',
  FEATURE_DARK_MODE: process.env.NEXT_PUBLIC_FEATURE_DARK_MODE !== 'false',
  FEATURE_SHORTCUTS: process.env.NEXT_PUBLIC_FEATURE_SHORTCUTS !== 'false',
  
  // デバッグ
  DEBUG_MODE: process.env.NEXT_PUBLIC_DEBUG_MODE === 'true',
  LOG_LEVEL: process.env.NEXT_PUBLIC_LOG_LEVEL || 'error'
}

// パフォーマンス設定
export const PERFORMANCE = {
  // レンダリング最適化
  USE_REACT_CONCURRENT: true,
  USE_SUSPENSE: true,
  USE_LAZY_LOADING: true,
  
  // バンドル最適化
  CHUNK_SIZE_LIMIT: 250 * 1024, // 250KB
  TREE_SHAKING: true,
  MINIFY: ENV.IS_PRODUCTION,
  
  // キャッシュ設定
  CACHE_TTL: 3600000, // 1時間
  USE_SERVICE_WORKER: ENV.IS_PRODUCTION,
  USE_PWA: ENV.IS_PRODUCTION,
  
  // WebSocket最適化
  WS_BATCH_SIZE: 50,
  WS_THROTTLE_MS: 100,
  WS_MAX_RECONNECT: 15,
  WS_HEARTBEAT_INTERVAL: 30000,
  
  // メモリ最適化
  MAX_CACHE_SIZE: 50 * 1024 * 1024, // 50MB
  GC_INTERVAL: 300000, // 5分
  
  // アニメーション
  ANIMATION_FPS: 60,
  USE_GPU_ACCELERATION: true,
  REDUCE_MOTION: false
}

// セキュリティ設定
export const SECURITY = {
  // CSP
  CSP_ENABLED: ENV.IS_PRODUCTION,
  CSP_DIRECTIVES: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'https:'],
    'connect-src': ["'self'", ENV.API_URL, ENV.WS_URL],
    'font-src': ["'self'", 'data:'],
    'object-src': ["'none'"],
    'media-src': ["'self'"],
    'frame-src': ["'none'"]
  },
  
  // CORS
  CORS_ENABLED: true,
  CORS_ORIGINS: [ENV.API_URL],
  
  // 認証
  SESSION_TIMEOUT: 3600000, // 1時間
  REFRESH_TOKEN_INTERVAL: 1800000, // 30分
  
  // 暗号化
  USE_HTTPS: ENV.IS_PRODUCTION,
  ENCRYPT_LOCAL_STORAGE: ENV.IS_PRODUCTION
}

// 監視設定
export const MONITORING = {
  // エラー追跡
  SENTRY_ENABLED: ENV.IS_PRODUCTION,
  SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // アナリティクス
  GA_ENABLED: ENV.IS_PRODUCTION,
  GA_TRACKING_ID: process.env.NEXT_PUBLIC_GA_TRACKING_ID,
  
  // パフォーマンス監視
  PERFORMANCE_MONITORING: ENV.IS_PRODUCTION,
  REAL_USER_MONITORING: ENV.IS_PRODUCTION,
  
  // ログ設定
  LOG_TO_CONSOLE: !ENV.IS_PRODUCTION,
  LOG_TO_SERVER: ENV.IS_PRODUCTION,
  LOG_RETENTION_DAYS: 30
}

// 最適化ユーティリティ
export const optimizations = {
  // 遅延読み込み
  lazyLoad: (importFn: () => Promise<any>) => {
    if (!PERFORMANCE.USE_LAZY_LOADING) {
      return importFn()
    }
    return import('react').then(({ lazy }) => lazy(importFn))
  },
  
  // デバウンス
  debounce: <T extends (...args: any[]) => void>(
    func: T,
    wait: number
  ): T => {
    let timeout: NodeJS.Timeout
    return ((...args: Parameters<T>) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func(...args), wait)
    }) as T
  },
  
  // スロットル
  throttle: <T extends (...args: any[]) => void>(
    func: T,
    limit: number
  ): T => {
    let inThrottle: boolean
    return ((...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }) as T
  },
  
  // メモ化
  memoize: <T extends (...args: any[]) => any>(
    func: T,
    resolver?: (...args: Parameters<T>) => string
  ): T => {
    const cache = new Map<string, ReturnType<T>>()
    
    return ((...args: Parameters<T>) => {
      const key = resolver ? resolver(...args) : JSON.stringify(args)
      
      if (cache.has(key)) {
        return cache.get(key)
      }
      
      const result = func(...args)
      cache.set(key, result)
      
      // キャッシュサイズ制限
      if (cache.size > 100) {
        const firstKey = cache.keys().next().value
        cache.delete(firstKey)
      }
      
      return result
    }) as T
  }
}

// パフォーマンス計測
export const measurePerformance = (name: string) => {
  if (!MONITORING.PERFORMANCE_MONITORING) return
  
  const startMark = `${name}-start`
  const endMark = `${name}-end`
  const measureName = `${name}-duration`
  
  return {
    start: () => performance.mark(startMark),
    end: () => {
      performance.mark(endMark)
      performance.measure(measureName, startMark, endMark)
      
      const measure = performance.getEntriesByName(measureName)[0]
      console.log(`[Performance] ${name}: ${measure.duration.toFixed(2)}ms`)
      
      // クリーンアップ
      performance.clearMarks(startMark)
      performance.clearMarks(endMark)
      performance.clearMeasures(measureName)
      
      return measure.duration
    }
  }
}

// WebVitals計測
export const reportWebVitals = (metric: any) => {
  if (!MONITORING.REAL_USER_MONITORING) return
  
  const vitals = {
    FCP: metric.name === 'FCP' ? metric.value : null,
    LCP: metric.name === 'LCP' ? metric.value : null,
    FID: metric.name === 'FID' ? metric.value : null,
    CLS: metric.name === 'CLS' ? metric.value : null,
    TTFB: metric.name === 'TTFB' ? metric.value : null
  }
  
  console.log('[WebVitals]', vitals)
  
  // サーバーへ送信
  if (ENV.IS_PRODUCTION) {
    fetch('/api/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vitals)
    })
  }
}

// エラーバウンダリ設定
export const errorBoundaryConfig = {
  onError: (error: Error, errorInfo: any) => {
    console.error('[ErrorBoundary]', error, errorInfo)
    
    if (MONITORING.SENTRY_ENABLED && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        contexts: { react: errorInfo }
      })
    }
  },
  
  fallback: (error: Error) => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">
          エラーが発生しました
        </h1>
        <p className="text-gray-600 mb-4">{error.message}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          ページを再読み込み
        </button>
      </div>
    </div>
  )
}

// Service Worker設定
export const serviceWorkerConfig = {
  enabled: PERFORMANCE.USE_SERVICE_WORKER,
  scope: '/',
  updateInterval: 3600000, // 1時間
  
  onSuccess: () => {
    console.log('[ServiceWorker] Registration successful')
  },
  
  onUpdate: () => {
    console.log('[ServiceWorker] New version available')
    
    // 更新通知を表示
    if (window.confirm('新しいバージョンが利用可能です。更新しますか？')) {
      window.location.reload()
    }
  },
  
  onError: (error: Error) => {
    console.error('[ServiceWorker] Registration failed:', error)
  }
}