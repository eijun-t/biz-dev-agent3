'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Building, Heart, Cpu, Leaf, ShoppingCart, Briefcase,
  Rocket, Globe, Zap, Book, Car, Home, Palette, Music
} from 'lucide-react';
import { cn } from '@/lib/utils';

// 拡張テーマリスト
export const themes = [
  { id: 'smart-city', icon: Building, label: 'スマートシティ', color: 'from-blue-500 to-cyan-500', description: '都市インフラのデジタル化' },
  { id: 'healthcare', icon: Heart, label: 'ヘルスケア', color: 'from-red-500 to-pink-500', description: '医療・健康管理の革新' },
  { id: 'ai-tech', icon: Cpu, label: 'AI・テクノロジー', color: 'from-purple-500 to-indigo-500', description: '人工知能ソリューション' },
  { id: 'sustainability', icon: Leaf, label: '環境・サステナビリティ', color: 'from-green-500 to-emerald-500', description: 'エコフレンドリー事業' },
  { id: 'ecommerce', icon: ShoppingCart, label: 'Eコマース', color: 'from-orange-500 to-yellow-500', description: 'オンライン販売プラットフォーム' },
  { id: 'fintech', icon: Briefcase, label: 'フィンテック', color: 'from-gray-500 to-slate-500', description: '金融テクノロジー' },
  { id: 'space-tech', icon: Rocket, label: '宇宙テック', color: 'from-indigo-500 to-purple-500', description: '宇宙関連ビジネス' },
  { id: 'global', icon: Globe, label: 'グローバル', color: 'from-blue-600 to-teal-500', description: '国際展開事業' },
  { id: 'energy', icon: Zap, label: 'エネルギー', color: 'from-yellow-500 to-orange-500', description: '新エネルギー開発' },
  { id: 'education', icon: Book, label: '教育', color: 'from-pink-500 to-rose-500', description: 'EdTechソリューション' },
  { id: 'mobility', icon: Car, label: 'モビリティ', color: 'from-cyan-500 to-blue-500', description: '次世代交通システム' },
  { id: 'real-estate', icon: Home, label: '不動産', color: 'from-amber-500 to-orange-500', description: '不動産テック' },
];

interface ThemeSelectorProps {
  selectedTheme: string;
  onThemeChange: (themeId: string) => void;
  showDescription?: boolean;
  columns?: 2 | 3 | 4;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  selectedTheme,
  onThemeChange,
  showDescription = true,
  columns = 3
}) => {
  const [hoveredTheme, setHoveredTheme] = useState<string | null>(null);

  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4'
  };

  return (
    <div className={cn('grid gap-3', gridCols[columns])}>
      {themes.map((theme, index) => (
        <motion.button
          key={theme.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.03 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onThemeChange(theme.id)}
          onMouseEnter={() => setHoveredTheme(theme.id)}
          onMouseLeave={() => setHoveredTheme(null)}
          className={cn(
            'relative p-4 rounded-xl border-2 transition-all overflow-hidden',
            selectedTheme === theme.id
              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-lg'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          )}
        >
          {/* 背景グラデーション */}
          {(selectedTheme === theme.id || hoveredTheme === theme.id) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.1 }}
              className={cn(
                'absolute inset-0 bg-gradient-to-br',
                theme.color
              )}
            />
          )}

          <div className="relative z-10">
            {/* アイコン */}
            <div className={cn(
              'w-12 h-12 rounded-lg bg-gradient-to-r mb-3 flex items-center justify-center mx-auto',
              theme.color
            )}>
              <theme.icon size={24} className="text-white" />
            </div>

            {/* ラベル */}
            <div className="text-center">
              <span className={cn(
                'font-medium text-sm block',
                selectedTheme === theme.id && 'text-purple-700 dark:text-purple-300'
              )}>
                {theme.label}
              </span>
              
              {/* 説明文 */}
              {showDescription && (
                <motion.p
                  initial={false}
                  animate={{
                    opacity: selectedTheme === theme.id || hoveredTheme === theme.id ? 1 : 0,
                    height: selectedTheme === theme.id || hoveredTheme === theme.id ? 'auto' : 0
                  }}
                  className="text-xs text-gray-500 dark:text-gray-400 mt-1 overflow-hidden"
                >
                  {theme.description}
                </motion.p>
              )}
            </div>
          </div>

          {/* 選択インジケーター */}
          {selectedTheme === theme.id && (
            <motion.div
              layoutId="selected-theme-indicator"
              className="absolute top-2 right-2 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center"
              initial={false}
              transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
            >
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </motion.div>
          )}
        </motion.button>
      ))}
    </div>
  );
};

// クイック選択バージョン
export const ThemeSelectorQuick: React.FC<{
  selectedTheme: string;
  onThemeChange: (themeId: string) => void;
}> = ({ selectedTheme, onThemeChange }) => {
  const popularThemes = themes.slice(0, 6);

  return (
    <div className="flex flex-wrap gap-2">
      {popularThemes.map((theme) => (
        <motion.button
          key={theme.id}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onThemeChange(theme.id)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-full border transition-all',
            selectedTheme === theme.id
              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
              : 'border-gray-300 dark:border-gray-700 hover:border-gray-400'
          )}
        >
          <theme.icon size={16} />
          <span className="text-sm font-medium">{theme.label}</span>
        </motion.button>
      ))}
      <button
        className="px-4 py-2 text-sm text-purple-600 hover:text-purple-700 font-medium"
        onClick={() => {/* Open full theme selector */}}
      >
        もっと見る →
      </button>
    </div>
  );
};

export default ThemeSelector;