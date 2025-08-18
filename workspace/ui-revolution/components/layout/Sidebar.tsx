'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Home, PlusCircle, History, Star, BarChart3, Settings,
  ChevronLeft, ChevronRight, Sparkles, Tag, Users, 
  FileText, TrendingUp, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const menuItems = [
    { icon: Home, label: 'ダッシュボード', path: '/dashboard', badge: null },
    { icon: PlusCircle, label: '新規作成', path: '/new', badge: 'HOT', highlight: true },
    { icon: History, label: 'レポート履歴', path: '/reports', badge: '12' },
    { icon: Star, label: 'お気に入り', path: '/favorites', badge: null },
    { icon: Tag, label: 'タグ管理', path: '/tags', badge: null },
    { icon: Users, label: 'エージェント', path: '/agents', badge: '5' },
    { icon: BarChart3, label: '分析', path: '/analytics', badge: null },
    { icon: Settings, label: '設定', path: '/settings', badge: null },
  ];

  const currentPath = '/new'; // 現在のパス（実装時は動的に）

  return (
    <motion.aside
      animate={{ width: collapsed ? 80 : 256 }}
      className="fixed left-0 top-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 z-30"
    >
      {/* ヘッダー */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Sparkles className="text-purple-600" size={24} />
            <span className="font-bold text-lg bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              AI Agent
            </span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* メニュー */}
      <nav className="p-4">
        <div className="space-y-1">
          {menuItems.map((item) => (
            <a
              key={item.path}
              href={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg transition-all group',
                'hover:bg-gray-100 dark:hover:bg-gray-800',
                currentPath === item.path && 'bg-purple-50 dark:bg-purple-900/20',
                item.highlight && 'bg-gradient-to-r from-purple-500/10 to-blue-500/10',
                collapsed && 'justify-center'
              )}
            >
              <item.icon 
                size={20} 
                className={cn(
                  currentPath === item.path && 'text-purple-600',
                  item.highlight && 'text-purple-600'
                )}
              />
              {!collapsed && (
                <>
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className={cn(
                      'px-2 py-0.5 text-xs rounded-full',
                      item.badge === 'HOT' 
                        ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white animate-pulse'
                        : 'bg-gray-200 dark:bg-gray-700'
                    )}>
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </a>
          ))}
        </div>
      </nav>

      {/* クイックアクション */}
      {!collapsed && (
        <div className="absolute bottom-4 left-4 right-4">
          <button className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2">
            <Zap size={18} />
            <span>クイック生成</span>
          </button>
        </div>
      )}
    </motion.aside>
  );
};

export default Sidebar;