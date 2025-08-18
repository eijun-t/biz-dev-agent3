'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, X, Home, FileText, PlusCircle, Settings, 
  LogOut, Moon, Sun, Search, Bell, User, ChevronRight,
  BarChart3, Sparkles, History, Star, Tag
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children, className }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifications, setNotifications] = useState(3);

  // ダークモード切り替え
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // サイドバーメニュー項目
  const menuItems = [
    { 
      icon: Home, 
      label: 'ダッシュボード', 
      path: '/dashboard',
      badge: null 
    },
    { 
      icon: PlusCircle, 
      label: '新規作成', 
      path: '/create',
      badge: 'NEW',
      highlight: true 
    },
    { 
      icon: History, 
      label: 'レポート履歴', 
      path: '/reports',
      badge: '12' 
    },
    { 
      icon: Star, 
      label: 'お気に入り', 
      path: '/favorites',
      badge: null 
    },
    { 
      icon: Tag, 
      label: 'タグ管理', 
      path: '/tags',
      badge: null 
    },
    { 
      icon: BarChart3, 
      label: '分析', 
      path: '/analytics',
      badge: null 
    },
  ];

  const bottomMenuItems = [
    { icon: Settings, label: '設定', path: '/settings' },
    { icon: LogOut, label: 'ログアウト', path: '/logout' },
  ];

  return (
    <div className={cn(
      'min-h-screen bg-gradient-to-br from-gray-50 to-gray-100',
      'dark:from-gray-900 dark:to-gray-800',
      'transition-all duration-300',
      className
    )}>
      {/* ヘッダー */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between h-16 px-4">
          {/* 左側: メニュー & ロゴ */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <motion.div
                animate={{ rotate: sidebarOpen ? 0 : 180 }}
                transition={{ duration: 0.3 }}
              >
                {sidebarOpen ? <Menu size={20} /> : <Menu size={20} />}
              </motion.div>
            </button>
            
            <div className="flex items-center gap-2">
              <Sparkles className="text-purple-600 dark:text-purple-400" size={24} />
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
                AI Agent Platform
              </span>
            </div>
          </div>

          {/* 右側: アクション */}
          <div className="flex items-center gap-3">
            {/* 検索 */}
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Search size={20} />
            </button>

            {/* 通知 */}
            <button className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <Bell size={20} />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </button>

            {/* ダークモード切り替え */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <AnimatePresence mode="wait">
                {darkMode ? (
                  <motion.div
                    key="moon"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Moon size={20} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="sun"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Sun size={20} />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>

            {/* ユーザーメニュー */}
            <div className="flex items-center gap-2 pl-3 border-l border-gray-200 dark:border-gray-700">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center text-white">
                <User size={16} />
              </div>
              <span className="text-sm font-medium hidden md:block">
                ユーザー名
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* サイドバー */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
            className="fixed left-0 top-16 bottom-0 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 z-30"
          >
            <div className="flex flex-col h-full">
              {/* メインメニュー */}
              <nav className="flex-1 p-4">
                <div className="space-y-1">
                  {menuItems.map((item, index) => (
                    <motion.a
                      key={item.path}
                      href={item.path}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg transition-all',
                        'hover:bg-gray-100 dark:hover:bg-gray-800',
                        item.highlight && 'bg-gradient-to-r from-purple-500/10 to-blue-500/10 hover:from-purple-500/20 hover:to-blue-500/20'
                      )}
                    >
                      <item.icon size={20} className={item.highlight ? 'text-purple-600 dark:text-purple-400' : ''} />
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <span className={cn(
                          'px-2 py-0.5 text-xs rounded-full',
                          item.badge === 'NEW' 
                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-700'
                        )}>
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.a>
                  ))}
                </div>
              </nav>

              {/* ボトムメニュー */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="space-y-1">
                  {bottomMenuItems.map((item) => (
                    <a
                      key={item.path}
                      href={item.path}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                    >
                      <item.icon size={20} />
                      <span>{item.label}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* メインコンテンツ */}
      <main 
        className={cn(
          'pt-16 transition-all duration-300',
          sidebarOpen ? 'ml-64' : 'ml-0'
        )}
      >
        <div className="p-6">
          {children}
        </div>
      </main>

      {/* 検索モーダル */}
      <AnimatePresence>
        {searchOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setSearchOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl z-50 p-4"
            >
              <div className="flex items-center gap-3">
                <Search size={20} className="text-gray-400" />
                <input
                  type="text"
                  placeholder="レポート、タグ、日付で検索..."
                  className="flex-1 bg-transparent outline-none text-lg"
                  autoFocus
                />
                <button
                  onClick={() => setSearchOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X size={20} />
                </button>
              </div>
              
              {/* 検索候補 */}
              <div className="mt-4 space-y-2">
                <div className="text-xs font-medium text-gray-500 uppercase">最近の検索</div>
                <div className="space-y-1">
                  {['スマートシティ', 'グリーンビルディング', '不動産テック'].map((term) => (
                    <div key={term} className="px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
                      {term}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ワンクリック新規作成ボタン（フローティング） */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full shadow-lg flex items-center justify-center text-white z-40"
        onClick={() => window.location.href = '/create'}
      >
        <PlusCircle size={24} />
      </motion.button>
    </div>
  );
};

export default MainLayout;