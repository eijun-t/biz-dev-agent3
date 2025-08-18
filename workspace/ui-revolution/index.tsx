/**
 * UI Revolution Components Export
 * 統合エクスポートファイル
 */

// エラー通知
export { 
  ErrorToastContainer,
  useErrorNotification,
  errorStore,
  ErrorLevel,
  type ErrorNotification
} from './components/ErrorNotification/ErrorToast'

// 一時停止/再開
export {
  PauseResumeControl,
  executionStore,
  usePauseResume,
  ExecutionState,
  type AgentState
} from './components/PauseResume/PauseResumeControl'

// ナビゲーション
export {
  Breadcrumb,
  AnimatedBreadcrumb,
  CompactBreadcrumb,
  DropdownBreadcrumb,
  useBreadcrumb,
  type BreadcrumbItem
} from './components/Navigation/Breadcrumb'

// アニメーション
export {
  AnimatedCard,
  AnimatedProgress,
  AnimatedSpinner,
  AnimatedPulse,
  AnimatedSkeleton,
  PageTransition,
  AnimatedModal,
  AnimatedList,
  AnimatedFAB,
  AnimatedCounter,
  AnimatedGrid
} from './components/Animations/AnimatedComponents'

// レスポンシブ
export {
  ResponsiveContainer,
  ResponsiveGrid,
  ResponsiveSidebar,
  ResponsiveCard,
  TabletNavigation,
  ResponsiveTable,
  ResponsiveModal,
  useResponsive,
  breakpoints,
  type DeviceType
} from './components/Responsive/ResponsiveLayout'

// WebSocket
export {
  EnhancedWebSocket,
  type WebSocketOptions,
  type WebSocketMetrics
} from './lib/websocket-enhanced'

// リアルタイム本番環境
export {
  ProductionWebSocketManager,
  useProductionWebSocket,
  performanceOptimizations
} from './lib/realtime-production'

// 状態管理
export {
  useRealtimeStore,
  handleWebSocketMessage,
  selectAgents,
  selectMetrics,
  selectConnectionStatus,
  selectProgress,
  type AgentState as RealtimeAgentState,
  type SystemMetrics
} from './stores/realtime-store'

// テーマ
export {
  ThemeProvider,
  useTheme,
  ThemeToggle,
  ThemeSettings,
  type Theme
} from './hooks/useTheme'

// ショートカット
export {
  useShortcuts,
  ShortcutProvider,
  useGlobalShortcuts,
  ShortcutHelp,
  CommandPalette,
  defaultShortcuts,
  type Shortcut
} from './hooks/useShortcuts'

// ナビゲーション
export {
  useNavigation,
  usePrefetch,
  usePageTransition,
  useSmoothScroll,
  useNavigationGuard,
  useRouteChange,
  type NavigationState,
  type NavigationOptions
} from './hooks/useNavigation'

// 設定
export {
  ENV,
  PERFORMANCE,
  SECURITY,
  MONITORING,
  optimizations,
  measurePerformance,
  reportWebVitals,
  errorBoundaryConfig,
  serviceWorkerConfig
} from './config/production.config'

// ユーティリティ関数
export const utils = {
  // クラス名結合
  cn: (...classes: (string | undefined | null | false)[]) => {
    return classes.filter(Boolean).join(' ')
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
  
  // フォーマット
  formatNumber: (num: number): string => {
    return new Intl.NumberFormat('ja-JP').format(num)
  },
  
  formatDate: (date: Date | string): string => {
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }
}

// デフォルトエクスポート
export default {
  ErrorToastContainer,
  PauseResumeControl,
  Breadcrumb,
  AnimatedCard,
  ResponsiveContainer,
  EnhancedWebSocket,
  ThemeProvider,
  useShortcuts,
  useNavigation,
  utils
}