'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, Users, FileText, Clock, Zap,
  ArrowUp, ArrowDown, MoreVertical, Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';

// KPIカード
const KPICard: React.FC<{
  title: string;
  value: string | number;
  change: number;
  icon: React.ElementType;
  color: string;
}> = ({ title, value, change, icon: Icon, color }) => (
  <motion.div
    whileHover={{ y: -4 }}
    className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
  >
    <div className="flex items-center justify-between mb-4">
      <div className={cn('p-3 rounded-lg', color)}>
        <Icon size={24} className="text-white" />
      </div>
      <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
        <MoreVertical size={16} />
      </button>
    </div>
    <div className="space-y-1">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
      <div className="flex items-center gap-1">
        {change > 0 ? (
          <ArrowUp size={16} className="text-green-500" />
        ) : (
          <ArrowDown size={16} className="text-red-500" />
        )}
        <span className={cn(
          'text-sm font-medium',
          change > 0 ? 'text-green-500' : 'text-red-500'
        )}>
          {Math.abs(change)}%
        </span>
        <span className="text-xs text-gray-500">前月比</span>
      </div>
    </div>
  </motion.div>
);

// 最近のアクティビティ
const ActivityItem: React.FC<{
  title: string;
  time: string;
  status: 'completed' | 'processing' | 'failed';
}> = ({ title, time, status }) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
    <div className="flex items-center gap-3">
      <div className={cn(
        'w-2 h-2 rounded-full',
        status === 'completed' && 'bg-green-500',
        status === 'processing' && 'bg-blue-500 animate-pulse',
        status === 'failed' && 'bg-red-500'
      )} />
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-gray-500">{time}</p>
      </div>
    </div>
    <span className={cn(
      'px-2 py-1 text-xs rounded-full',
      status === 'completed' && 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400',
      status === 'processing' && 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
      status === 'failed' && 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
    )}>
      {status === 'completed' && '完了'}
      {status === 'processing' && '処理中'}
      {status === 'failed' && 'エラー'}
    </span>
  </div>
);

export const DashboardHome: React.FC = () => {
  const kpiData = [
    { title: '総レポート数', value: 127, change: 12, icon: FileText, color: 'bg-purple-600' },
    { title: 'アクティブプロジェクト', value: 8, change: -5, icon: Clock, color: 'bg-blue-600' },
    { title: '成功率', value: '92%', change: 3, icon: TrendingUp, color: 'bg-green-600' },
    { title: 'エージェント稼働', value: 5, change: 25, icon: Users, color: 'bg-orange-600' },
  ];

  const activities = [
    { title: 'スマートシティプロジェクト分析完了', time: '10分前', status: 'completed' as const },
    { title: 'ヘルスケアAI市場調査', time: '25分前', status: 'processing' as const },
    { title: 'フィンテック競合分析', time: '1時間前', status: 'completed' as const },
    { title: 'Eコマース戦略立案', time: '2時間前', status: 'failed' as const },
    { title: '環境テック投資分析', time: '3時間前', status: 'completed' as const },
  ];

  return (
    <div className="space-y-8">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">ダッシュボード</h1>
          <p className="text-gray-600 dark:text-gray-400">
            プロジェクトの概要とパフォーマンス
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium flex items-center gap-2"
        >
          <Plus size={20} />
          新規プロジェクト
        </motion.button>
      </div>

      {/* KPIカード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi, index) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <KPICard {...kpi} />
          </motion.div>
        ))}
      </div>

      {/* メインコンテンツ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* パフォーマンスチャート */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">プロジェクト進捗</h2>
            <select className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
              <option>過去7日間</option>
              <option>過去30日間</option>
              <option>過去90日間</option>
            </select>
          </div>
          
          {/* チャートプレースホルダー */}
          <div className="h-64 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Zap size={48} className="mx-auto text-purple-600 mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Worker3の可視化コンポーネントと統合予定
              </p>
            </div>
          </div>
        </motion.div>

        {/* 最近のアクティビティ */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">最近のアクティビティ</h2>
            <button className="text-sm text-purple-600 hover:text-purple-700">
              すべて表示
            </button>
          </div>
          
          <div className="space-y-1">
            {activities.map((activity, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <ActivityItem {...activity} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* クイックアクション */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-8 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              アイデア生成の準備はできましたか？
            </h2>
            <p className="opacity-90">
              AIエージェントが革新的なビジネスアイデアを生成します
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 bg-white text-purple-600 rounded-xl font-semibold hover:shadow-xl"
          >
            今すぐ開始
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default DashboardHome;