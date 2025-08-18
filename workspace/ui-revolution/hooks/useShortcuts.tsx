/**
 * Keyboard Shortcuts Hook
 * グローバルショートカットキー管理
 */

import { useEffect, useCallback, useState } from 'react'

// ショートカット定義
export interface Shortcut {
  key: string
  ctrl?: boolean
  cmd?: boolean
  shift?: boolean
  alt?: boolean
  description: string
  handler: (e: KeyboardEvent) => void
  enabled?: boolean
  preventDefault?: boolean
}

// デフォルトショートカット
export const defaultShortcuts: Record<string, Omit<Shortcut, 'handler'>> = {
  search: {
    key: 'k',
    cmd: true,
    ctrl: true,
    description: '検索を開く',
    preventDefault: true
  },
  new: {
    key: 'n',
    cmd: true,
    ctrl: true,
    description: '新規作成',
    preventDefault: true
  },
  save: {
    key: 's',
    cmd: true,
    ctrl: true,
    description: '保存',
    preventDefault: true
  },
  escape: {
    key: 'Escape',
    description: 'キャンセル/閉じる',
    preventDefault: false
  },
  undo: {
    key: 'z',
    cmd: true,
    ctrl: true,
    description: '元に戻す',
    preventDefault: true
  },
  redo: {
    key: 'z',
    cmd: true,
    ctrl: true,
    shift: true,
    description: 'やり直し',
    preventDefault: true
  },
  copy: {
    key: 'c',
    cmd: true,
    ctrl: true,
    description: 'コピー',
    preventDefault: false
  },
  paste: {
    key: 'v',
    cmd: true,
    ctrl: true,
    description: 'ペースト',
    preventDefault: false
  },
  cut: {
    key: 'x',
    cmd: true,
    ctrl: true,
    description: 'カット',
    preventDefault: false
  },
  selectAll: {
    key: 'a',
    cmd: true,
    ctrl: true,
    description: '全選択',
    preventDefault: false
  }
}

// ショートカットフック
export const useShortcuts = (shortcuts: Record<string, Shortcut>) => {
  const [activeShortcuts, setActiveShortcuts] = useState<Record<string, Shortcut>>(shortcuts)
  const [isEnabled, setIsEnabled] = useState(true)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isEnabled) return

    // 入力フィールドでは動作しない（ESC以外）
    const target = e.target as HTMLElement
    const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
    
    Object.values(activeShortcuts).forEach(shortcut => {
      if (!shortcut.enabled && shortcut.enabled !== undefined) return
      
      // キーマッチング
      const keyMatch = e.key === shortcut.key || e.key.toLowerCase() === shortcut.key.toLowerCase()
      if (!keyMatch) return

      // 修飾キーマッチング
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const cmdKey = isMac ? e.metaKey : e.ctrlKey
      const ctrlKey = e.ctrlKey

      const modifiersMatch = 
        (shortcut.cmd ? cmdKey : true) &&
        (shortcut.ctrl ? ctrlKey : true) &&
        (shortcut.shift ? e.shiftKey : !e.shiftKey) &&
        (shortcut.alt ? e.altKey : !e.altKey)

      if (modifiersMatch) {
        // ESCは入力フィールドでも動作
        if (shortcut.key === 'Escape' || !isInput) {
          if (shortcut.preventDefault) {
            e.preventDefault()
          }
          shortcut.handler(e)
        }
      }
    })
  }, [activeShortcuts, isEnabled])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const registerShortcut = (id: string, shortcut: Shortcut) => {
    setActiveShortcuts(prev => ({ ...prev, [id]: shortcut }))
  }

  const unregisterShortcut = (id: string) => {
    setActiveShortcuts(prev => {
      const { [id]: _, ...rest } = prev
      return rest
    })
  }

  const enableShortcut = (id: string) => {
    setActiveShortcuts(prev => ({
      ...prev,
      [id]: { ...prev[id], enabled: true }
    }))
  }

  const disableShortcut = (id: string) => {
    setActiveShortcuts(prev => ({
      ...prev,
      [id]: { ...prev[id], enabled: false }
    }))
  }

  const enableAll = () => setIsEnabled(true)
  const disableAll = () => setIsEnabled(false)

  return {
    registerShortcut,
    unregisterShortcut,
    enableShortcut,
    disableShortcut,
    enableAll,
    disableAll,
    isEnabled,
    shortcuts: activeShortcuts
  }
}

// グローバルショートカットプロバイダー
import React, { createContext, useContext, ReactNode } from 'react'

interface ShortcutContextType {
  registerShortcut: (id: string, shortcut: Shortcut) => void
  unregisterShortcut: (id: string) => void
  shortcuts: Record<string, Shortcut>
}

const ShortcutContext = createContext<ShortcutContextType | undefined>(undefined)

export const ShortcutProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [globalShortcuts, setGlobalShortcuts] = useState<Record<string, Shortcut>>({})

  const registerShortcut = useCallback((id: string, shortcut: Shortcut) => {
    setGlobalShortcuts(prev => ({ ...prev, [id]: shortcut }))
  }, [])

  const unregisterShortcut = useCallback((id: string) => {
    setGlobalShortcuts(prev => {
      const { [id]: _, ...rest } = prev
      return rest
    })
  }, [])

  // グローバルショートカット登録
  useShortcuts(globalShortcuts)

  return (
    <ShortcutContext.Provider value={{ registerShortcut, unregisterShortcut, shortcuts: globalShortcuts }}>
      {children}
    </ShortcutContext.Provider>
  )
}

export const useGlobalShortcuts = () => {
  const context = useContext(ShortcutContext)
  if (!context) {
    throw new Error('useGlobalShortcuts must be used within ShortcutProvider')
  }
  return context
}

// ショートカットヘルプモーダル
export const ShortcutHelp: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { shortcuts } = useGlobalShortcuts()
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0

  if (!isOpen) return null

  const formatKey = (shortcut: Shortcut) => {
    const keys = []
    if (shortcut.cmd && isMac) keys.push('⌘')
    if (shortcut.ctrl && !isMac) keys.push('Ctrl')
    if (shortcut.ctrl && isMac) keys.push('⌃')
    if (shortcut.alt) keys.push(isMac ? '⌥' : 'Alt')
    if (shortcut.shift) keys.push(isMac ? '⇧' : 'Shift')
    keys.push(shortcut.key.length === 1 ? shortcut.key.toUpperCase() : shortcut.key)
    return keys.join(isMac ? '' : '+')
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">キーボードショートカット</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="p-4">
          <div className="space-y-2">
            {Object.entries(shortcuts).map(([id, shortcut]) => (
              <div key={id} className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                <span className="text-gray-700 dark:text-gray-300">{shortcut.description}</span>
                <kbd className="px-2 py-1 text-sm font-mono bg-gray-100 dark:bg-gray-700 rounded">
                  {formatKey(shortcut)}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// コマンドパレット
export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Cmd/Ctrl+K でオープン
  useShortcuts({
    openCommand: {
      key: 'k',
      cmd: true,
      ctrl: true,
      description: 'コマンドパレットを開く',
      handler: () => setIsOpen(true),
      preventDefault: true
    }
  })

  const commands = [
    { id: 'new', label: '新規作成', icon: '➕', action: () => console.log('新規作成') },
    { id: 'save', label: '保存', icon: '💾', action: () => console.log('保存') },
    { id: 'search', label: '検索', icon: '🔍', action: () => console.log('検索') },
    { id: 'settings', label: '設定', icon: '⚙️', action: () => console.log('設定') },
    { id: 'help', label: 'ヘルプ', icon: '❓', action: () => console.log('ヘルプ') }
  ]

  const filteredCommands = commands.filter(cmd =>
    cmd.label.toLowerCase().includes(search.toLowerCase())
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev + 1) % filteredCommands.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action()
        setIsOpen(false)
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="コマンドを入力..."
            className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {filteredCommands.map((cmd, index) => (
            <button
              key={cmd.id}
              onClick={() => {
                cmd.action()
                setIsOpen(false)
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 ${
                index === selectedIndex ? 'bg-gray-50 dark:bg-gray-700' : ''
              }`}
            >
              <span className="text-2xl">{cmd.icon}</span>
              <span className="text-gray-700 dark:text-gray-300">{cmd.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}