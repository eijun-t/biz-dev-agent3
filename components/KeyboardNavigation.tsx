'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Command, Search, Settings, Home, History, FileText, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KeyboardShortcut {
  key: string;
  description: string;
  action: () => void;
  icon?: React.ElementType;
}

interface KeyboardNavigationProps {
  shortcuts?: KeyboardShortcut[];
  className?: string;
}

export const KeyboardNavigation: React.FC<KeyboardNavigationProps> = ({
  shortcuts: customShortcuts = [],
  className
}) => {
  const [showPalette, setShowPalette] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // デフォルトショートカット
  const defaultShortcuts: KeyboardShortcut[] = [
    {
      key: 'cmd+k',
      description: 'コマンドパレットを開く',
      action: () => setShowPalette(!showPalette),
      icon: Command
    },
    {
      key: 'cmd+/',
      description: 'ヘルプを表示',
      action: () => console.log('Show help'),
      icon: HelpCircle
    },
    {
      key: 'cmd+shift+p',
      description: '設定を開く',
      action: () => console.log('Open settings'),
      icon: Settings
    },
    {
      key: 'cmd+h',
      description: 'ホームに戻る',
      action: () => window.location.href = '/',
      icon: Home
    },
    {
      key: 'cmd+shift+h',
      description: '履歴を表示',
      action: () => window.location.href = '/history',
      icon: History
    },
    {
      key: 'cmd+n',
      description: '新規レポート作成',
      action: () => window.location.href = '/new',
      icon: FileText
    },
    {
      key: 'cmd+f',
      description: '検索にフォーカス',
      action: () => {
        const searchInput = document.querySelector('input[type="search"], input[placeholder*="検索"]') as HTMLInputElement;
        searchInput?.focus();
      },
      icon: Search
    }
  ];

  const shortcuts = [...defaultShortcuts, ...customShortcuts];

  // フィルタリングされたショートカット
  const filteredShortcuts = shortcuts.filter(shortcut =>
    shortcut.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    shortcut.key.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // キーボードイベントハンドラー
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // コマンドパレット表示/非表示
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowPalette(!showPalette);
        return;
      }

      // ESCで閉じる
      if (e.key === 'Escape' && showPalette) {
        setShowPalette(false);
        setSearchQuery('');
        setSelectedIndex(0);
        return;
      }

      // パレット内のナビゲーション
      if (showPalette) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredShortcuts.length - 1 ? prev + 1 : 0
          );
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredShortcuts.length - 1
          );
        } else if (e.key === 'Enter' && filteredShortcuts[selectedIndex]) {
          e.preventDefault();
          filteredShortcuts[selectedIndex].action();
          setShowPalette(false);
          setSearchQuery('');
          setSelectedIndex(0);
        }
        return;
      }

      // グローバルショートカット
      shortcuts.forEach(shortcut => {
        const keys = shortcut.key.toLowerCase().split('+');
        const isMatch = keys.every(key => {
          switch (key) {
            case 'cmd':
            case 'meta':
              return e.metaKey || e.ctrlKey;
            case 'ctrl':
              return e.ctrlKey;
            case 'alt':
              return e.altKey;
            case 'shift':
              return e.shiftKey;
            default:
              return e.key.toLowerCase() === key;
          }
        });

        if (isMatch) {
          e.preventDefault();
          shortcut.action();
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPalette, shortcuts, filteredShortcuts, selectedIndex]);

  // フォーカストラップ
  useEffect(() => {
    if (showPalette) {
      const searchInput = document.getElementById('command-search') as HTMLInputElement;
      searchInput?.focus();
    }
  }, [showPalette]);

  return (
    <>
      {/* コマンドパレット */}
      <AnimatePresence>
        {showPalette && (
          <>
            {/* オーバーレイ */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
              onClick={() => setShowPalette(false)}
              aria-hidden="true"
            />

            {/* パレット */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.2 }}
              className={cn(
                'fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-2xl',
                'bg-background border rounded-lg shadow-2xl z-50',
                'overflow-hidden',
                className
              )}
              role="dialog"
              aria-modal="true"
              aria-label="コマンドパレット"
            >
              {/* 検索入力 */}
              <div className="flex items-center border-b px-4 py-3">
                <Search className="h-4 w-4 text-muted-foreground mr-2" aria-hidden="true" />
                <input
                  id="command-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSelectedIndex(0);
                  }}
                  placeholder="コマンドを検索..."
                  className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
                  aria-label="コマンド検索"
                  aria-autocomplete="list"
                  aria-controls="command-list"
                />
                <kbd className="text-xs text-muted-foreground">ESC</kbd>
              </div>

              {/* ショートカットリスト */}
              <div
                id="command-list"
                className="max-h-[400px] overflow-y-auto p-2"
                role="listbox"
                aria-label="利用可能なコマンド"
              >
                {filteredShortcuts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    コマンドが見つかりません
                  </div>
                ) : (
                  filteredShortcuts.map((shortcut, index) => {
                    const Icon = shortcut.icon;
                    return (
                      <motion.button
                        key={shortcut.key}
                        onClick={() => {
                          shortcut.action();
                          setShowPalette(false);
                          setSearchQuery('');
                          setSelectedIndex(0);
                        }}
                        className={cn(
                          'w-full flex items-center justify-between px-3 py-2 rounded-md',
                          'text-left transition-colors',
                          selectedIndex === index
                            ? 'bg-accent text-accent-foreground'
                            : 'hover:bg-accent/50'
                        )}
                        onMouseEnter={() => setSelectedIndex(index)}
                        role="option"
                        aria-selected={selectedIndex === index}
                        tabIndex={selectedIndex === index ? 0 : -1}
                      >
                        <div className="flex items-center gap-3">
                          {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
                          <span>{shortcut.description}</span>
                        </div>
                        <kbd className="text-xs bg-muted px-2 py-1 rounded">
                          {shortcut.key.split('+').map(key => 
                            key === 'cmd' ? '⌘' : 
                            key === 'shift' ? '⇧' : 
                            key === 'alt' ? '⌥' : 
                            key.toUpperCase()
                          ).join(' ')}
                        </kbd>
                      </motion.button>
                    );
                  })
                )}
              </div>

              {/* フッター */}
              <div className="border-t px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex gap-4">
                  <span className="flex items-center gap-1">
                    <kbd>↑↓</kbd> ナビゲート
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd>↵</kbd> 実行
                  </span>
                </div>
                <span>{filteredShortcuts.length}個のコマンド</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ヘルプインジケーター */}
      <motion.div
        className="fixed bottom-4 right-4 z-40"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
      >
        <motion.button
          onClick={() => setShowPalette(true)}
          className="flex items-center gap-2 px-3 py-2 bg-background/90 backdrop-blur-sm border rounded-lg shadow-lg text-sm"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="キーボードショートカットを表示"
        >
          <Command className="h-4 w-4" />
          <span className="hidden sm:inline">⌘K</span>
        </motion.button>
      </motion.div>
    </>
  );
};

export default KeyboardNavigation;