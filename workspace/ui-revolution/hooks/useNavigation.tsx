/**
 * Navigation Hook - 履歴管理・遷移最適化
 * ブラウザ履歴連携・状態保持
 */

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

// ナビゲーション状態
export interface NavigationState {
  path: string
  params?: Record<string, any>
  scrollPosition?: number
  timestamp: Date
  title?: string
  data?: any
}

// ナビゲーションオプション
export interface NavigationOptions {
  replace?: boolean
  scroll?: boolean
  shallow?: boolean
  preserveState?: boolean
  animate?: boolean
}

// ナビゲーションフック
export const useNavigation = () => {
  const router = useRouter()
  const [history, setHistory] = useState<NavigationState[]>([])
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [isNavigating, setIsNavigating] = useState(false)
  const [savedStates, setSavedStates] = useState<Map<string, any>>(new Map())

  // 現在の状態
  const currentState = history[currentIndex] || null

  // 状態を保存
  const saveState = useCallback((path: string, state: any) => {
    setSavedStates(prev => new Map(prev).set(path, state))
  }, [])

  // 状態を取得
  const getState = useCallback((path: string) => {
    return savedStates.get(path)
  }, [savedStates])

  // ナビゲート
  const navigate = useCallback(async (
    path: string,
    options: NavigationOptions = {}
  ) => {
    setIsNavigating(true)

    try {
      // スクロール位置を保存
      if (options.preserveState && currentState) {
        const scrollY = window.scrollY
        const updatedState = { ...currentState, scrollPosition: scrollY }
        const newHistory = [...history]
        newHistory[currentIndex] = updatedState
        setHistory(newHistory)
      }

      // 新しい状態を作成
      const newState: NavigationState = {
        path,
        params: options.preserveState ? currentState?.params : {},
        timestamp: new Date(),
        title: document.title
      }

      // 履歴を更新
      if (options.replace) {
        const newHistory = [...history]
        newHistory[currentIndex] = newState
        setHistory(newHistory)
      } else {
        const newHistory = history.slice(0, currentIndex + 1)
        newHistory.push(newState)
        setHistory(newHistory)
        setCurrentIndex(newHistory.length - 1)
      }

      // ルーターでナビゲート
      if (options.replace) {
        router.replace(path)
      } else {
        router.push(path)
      }

      // スクロール位置を復元
      if (options.scroll !== false) {
        setTimeout(() => {
          window.scrollTo(0, 0)
        }, 100)
      }
    } finally {
      setIsNavigating(false)
    }
  }, [router, history, currentIndex, currentState])

  // 戻る
  const goBack = useCallback(() => {
    if (canGoBack()) {
      setIsNavigating(true)
      
      // 現在の状態を保存
      if (currentState) {
        saveState(currentState.path, {
          scrollPosition: window.scrollY,
          data: currentState.data
        })
      }

      const prevIndex = currentIndex - 1
      const prevState = history[prevIndex]
      
      setCurrentIndex(prevIndex)
      router.back()

      // スクロール位置を復元
      if (prevState?.scrollPosition !== undefined) {
        setTimeout(() => {
          window.scrollTo(0, prevState.scrollPosition)
        }, 100)
      }

      setIsNavigating(false)
    }
  }, [currentIndex, history, router, currentState, saveState])

  // 進む
  const goForward = useCallback(() => {
    if (canGoForward()) {
      setIsNavigating(true)

      const nextIndex = currentIndex + 1
      const nextState = history[nextIndex]
      
      setCurrentIndex(nextIndex)
      router.forward()

      // スクロール位置を復元
      if (nextState?.scrollPosition !== undefined) {
        setTimeout(() => {
          window.scrollTo(0, nextState.scrollPosition)
        }, 100)
      }

      setIsNavigating(false)
    }
  }, [currentIndex, history, router])

  // 特定のインデックスへ移動
  const goTo = useCallback((index: number) => {
    if (index >= 0 && index < history.length && index !== currentIndex) {
      const targetState = history[index]
      setCurrentIndex(index)
      navigate(targetState.path, { replace: true })
    }
  }, [history, currentIndex, navigate])

  // ホームへ
  const goHome = useCallback(() => {
    navigate('/', { preserveState: false })
  }, [navigate])

  // リロード
  const reload = useCallback(() => {
    router.refresh()
  }, [router])

  // 履歴をクリア
  const clearHistory = useCallback(() => {
    setHistory([])
    setCurrentIndex(-1)
    setSavedStates(new Map())
  }, [])

  // ナビゲーション可能性チェック
  const canGoBack = useCallback(() => currentIndex > 0, [currentIndex])
  const canGoForward = useCallback(() => currentIndex < history.length - 1, [currentIndex, history])

  // ブラウザの戻る/進むボタン対応
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // ブラウザの履歴と同期
      if (event.state) {
        const index = history.findIndex(h => h.path === window.location.pathname)
        if (index !== -1) {
          setCurrentIndex(index)
        }
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [history])

  // 初期化
  useEffect(() => {
    const initialState: NavigationState = {
      path: window.location.pathname,
      params: Object.fromEntries(new URLSearchParams(window.location.search)),
      timestamp: new Date(),
      title: document.title
    }
    setHistory([initialState])
    setCurrentIndex(0)
  }, [])

  return {
    // ナビゲーション
    navigate,
    goBack,
    goForward,
    goTo,
    goHome,
    reload,
    
    // 状態管理
    saveState,
    getState,
    clearHistory,
    
    // 状態
    history,
    currentIndex,
    currentState,
    isNavigating,
    
    // ヘルパー
    canGoBack: canGoBack(),
    canGoForward: canGoForward()
  }
}

// プリフェッチフック
export const usePrefetch = () => {
  const router = useRouter()
  const [prefetchedPaths, setPrefetchedPaths] = useState<Set<string>>(new Set())

  const prefetch = useCallback((path: string) => {
    if (!prefetchedPaths.has(path)) {
      router.prefetch(path)
      setPrefetchedPaths(prev => new Set(prev).add(path))
    }
  }, [router, prefetchedPaths])

  const prefetchMultiple = useCallback((paths: string[]) => {
    paths.forEach(prefetch)
  }, [prefetch])

  return { prefetch, prefetchMultiple, prefetchedPaths }
}

// トランジションフック
export const usePageTransition = () => {
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [transitionDirection, setTransitionDirection] = useState<'forward' | 'backward'>('forward')

  const startTransition = useCallback((direction: 'forward' | 'backward' = 'forward') => {
    setTransitionDirection(direction)
    setIsTransitioning(true)
  }, [])

  const endTransition = useCallback(() => {
    setIsTransitioning(false)
  }, [])

  return {
    isTransitioning,
    transitionDirection,
    startTransition,
    endTransition
  }
}

// スムーズスクロールフック
export const useSmoothScroll = () => {
  const scrollTo = useCallback((target: number | string, options?: ScrollBehavior) => {
    if (typeof target === 'number') {
      window.scrollTo({
        top: target,
        behavior: options || 'smooth'
      })
    } else {
      const element = document.querySelector(target)
      if (element) {
        element.scrollIntoView({
          behavior: options || 'smooth',
          block: 'start'
        })
      }
    }
  }, [])

  const scrollToTop = useCallback(() => {
    scrollTo(0)
  }, [scrollTo])

  const scrollToBottom = useCallback(() => {
    scrollTo(document.documentElement.scrollHeight)
  }, [scrollTo])

  return { scrollTo, scrollToTop, scrollToBottom }
}

// ナビゲーションガード
export const useNavigationGuard = (
  shouldBlock: boolean,
  message: string = '変更が保存されていません。本当にページを離れますか？'
) => {
  useEffect(() => {
    if (!shouldBlock) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = message
      return message
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [shouldBlock, message])
}

// ルート監視フック
export const useRouteChange = (
  onRouteChangeStart?: (url: string) => void,
  onRouteChangeComplete?: (url: string) => void,
  onRouteChangeError?: (err: Error, url: string) => void
) => {
  useEffect(() => {
    // Next.js App Router doesn't have route events like Pages Router
    // So we'll use a custom implementation with MutationObserver
    
    let currentPath = window.location.pathname
    
    const observer = new MutationObserver(() => {
      const newPath = window.location.pathname
      if (newPath !== currentPath) {
        onRouteChangeComplete?.(newPath)
        currentPath = newPath
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    return () => observer.disconnect()
  }, [onRouteChangeComplete])
}