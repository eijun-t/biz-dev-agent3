'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, Rocket, Target, Lightbulb, TrendingUp,
  ChevronRight, Info, Zap, Brain, Search, Globe,
  Building, Heart, Cpu, Leaf, ShoppingCart, Briefcase
} from 'lucide-react';
import { cn } from '@/lib/utils';

// プロジェクトテーマ
const themes = [
  { id: 'smart-city', icon: Building, label: 'スマートシティ', color: 'from-blue-500 to-cyan-500' },
  { id: 'healthcare', icon: Heart, label: 'ヘルスケア', color: 'from-red-500 to-pink-500' },
  { id: 'ai-tech', icon: Cpu, label: 'AI・テクノロジー', color: 'from-purple-500 to-indigo-500' },
  { id: 'sustainability', icon: Leaf, label: '環境・サステナビリティ', color: 'from-green-500 to-emerald-500' },
  { id: 'ecommerce', icon: ShoppingCart, label: 'Eコマース', color: 'from-orange-500 to-yellow-500' },
  { id: 'fintech', icon: Briefcase, label: 'フィンテック', color: 'from-gray-500 to-slate-500' },
];

// 分析深度
const analysisLevels = [
  { 
    id: 'quick', 
    label: 'クイック分析', 
    time: '5分', 
    description: '基本的な市場分析とアイデア生成',
    agents: 3
  },
  { 
    id: 'standard', 
    label: 'スタンダード', 
    time: '10分', 
    description: '詳細な競合分析と実現性評価を含む',
    agents: 5,
    recommended: true
  },
  { 
    id: 'deep', 
    label: 'ディープ分析', 
    time: '20分', 
    description: '包括的な市場調査とビジネスプラン作成',
    agents: 7
  },
];

export const NewProject: React.FC = () => {
  const [selectedTheme, setSelectedTheme] = useState('smart-city');
  const [customPrompt, setCustomPrompt] = useState('');
  const [analysisLevel, setAnalysisLevel] = useState('standard');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    // API呼び出しのシミュレーション
    setTimeout(() => {
      window.location.href = '/reports/generating';
    }, 1500);
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* ヘッダー */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          新しいビジネスアイデアを生成
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          AIエージェントが市場調査から戦略立案まで全自動で実行します
        </p>
      </motion.div>

      {/* メインフォーム */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 左側：入力エリア */}
        <div className="lg:col-span-2 space-y-6">
          {/* プロンプト入力 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
          >
            <label className="block text-sm font-semibold mb-3">
              ビジネスアイデアのテーマや要望
            </label>
            <div className="relative">
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="例：高齢者向けのスマートホームソリューション、環境に優しい配送サービス、AIを活用した教育プラットフォーム..."
                className="w-full h-32 p-4 pr-12 border border-gray-300 dark:border-gray-700 rounded-xl resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800"
              />
              <Sparkles className="absolute right-4 top-4 text-purple-400 animate-pulse" size={20} />
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
              <Info size={14} />
              <span>具体的な要望を入力すると、より精度の高い分析が可能です</span>
            </div>
          </motion.div>

          {/* テーマ選択 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
          >
            <label className="block text-sm font-semibold mb-3">
              業界・分野を選択
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setSelectedTheme(theme.id)}
                  className={cn(
                    'relative p-4 rounded-xl border-2 transition-all',
                    selectedTheme === theme.id
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  )}
                >
                  <div className={cn(
                    'w-10 h-10 rounded-lg bg-gradient-to-r mb-2 flex items-center justify-center',
                    theme.color
                  )}>
                    <theme.icon size={20} className="text-white" />
                  </div>
                  <span className="text-sm font-medium">{theme.label}</span>
                  {selectedTheme === theme.id && (
                    <motion.div
                      layoutId="selected-theme"
                      className="absolute inset-0 border-2 border-purple-500 rounded-xl"
                      initial={false}
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </button>
              ))}
            </div>
          </motion.div>

          {/* 分析レベル選択 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
          >
            <label className="block text-sm font-semibold mb-3">
              分析の深度
            </label>
            <div className="space-y-3">
              {analysisLevels.map((level) => (
                <div
                  key={level.id}
                  onClick={() => setAnalysisLevel(level.id)}
                  className={cn(
                    'relative p-4 rounded-xl border-2 cursor-pointer transition-all',
                    analysisLevel === level.id
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{level.label}</span>
                        {level.recommended && (
                          <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-xs rounded-full">
                            おすすめ
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {level.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-purple-600 dark:text-purple-400">
                        {level.time}
                      </div>
                      <div className="text-xs text-gray-500">
                        {level.agents} エージェント
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* 高度な設定 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
          >
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm font-semibold mb-3"
            >
              <ChevronRight 
                size={16} 
                className={cn('transition-transform', showAdvanced && 'rotate-90')}
              />
              高度な設定
            </button>
            
            {showAdvanced && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-4 mt-4"
              >
                <div>
                  <label className="text-sm font-medium">ターゲット市場</label>
                  <select className="w-full mt-1 p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                    <option>日本国内</option>
                    <option>アジア全体</option>
                    <option>グローバル</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">予算規模</label>
                  <select className="w-full mt-1 p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                    <option>〜1000万円</option>
                    <option>1000万円〜1億円</option>
                    <option>1億円以上</option>
                  </select>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* 右側：プレビューとアクション */}
        <div className="space-y-6">
          {/* エージェントプレビュー */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-6 text-white"
          >
            <h3 className="text-lg font-semibold mb-4">実行されるエージェント</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Search size={16} />
                </div>
                <div>
                  <div className="font-medium">Researcher</div>
                  <div className="text-xs opacity-80">市場調査・競合分析</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Lightbulb size={16} />
                </div>
                <div>
                  <div className="font-medium">Ideator</div>
                  <div className="text-xs opacity-80">革新的アイデア生成</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Target size={16} />
                </div>
                <div>
                  <div className="font-medium">Critic</div>
                  <div className="text-xs opacity-80">実現性評価</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <TrendingUp size={16} />
                </div>
                <div>
                  <div className="font-medium">Analyst</div>
                  <div className="text-xs opacity-80">詳細分析・戦略立案</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Brain size={16} />
                </div>
                <div>
                  <div className="font-medium">Writer</div>
                  <div className="text-xs opacity-80">レポート作成</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 予想成果物 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-sm font-semibold mb-3">生成される成果物</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                <span>市場規模・成長率分析</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                <span>競合他社マッピング</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                <span>ビジネスモデル提案</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                <span>収益予測シミュレーション</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                <span>実行ロードマップ</span>
              </li>
            </ul>
          </motion.div>

          {/* 生成ボタン */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={handleGenerate}
            disabled={isGenerating || !customPrompt}
            className={cn(
              'w-full py-4 px-6 rounded-xl font-semibold text-white transition-all',
              'bg-gradient-to-r from-purple-600 to-blue-600',
              'hover:shadow-xl hover:scale-105',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
              'flex items-center justify-center gap-3'
            )}
          >
            {isGenerating ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles size={20} />
                </motion.div>
                <span>生成中...</span>
              </>
            ) : (
              <>
                <Rocket size={20} />
                <span>アイデア生成を開始</span>
              </>
            )}
          </motion.button>

          {/* 注意事項 */}
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            生成には約{analysisLevels.find(l => l.id === analysisLevel)?.time}かかります
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewProject;