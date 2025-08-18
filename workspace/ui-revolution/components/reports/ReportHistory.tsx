'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Calendar, Tag, Star, Filter, Search,
  ChevronDown, Download, Eye, Share2, Trash2,
  TrendingUp, Clock, CheckCircle, AlertCircle,
  MoreVertical, Grid, List, SortAsc, SortDesc
} from 'lucide-react';
import { cn } from '@/lib/utils';

// レポートのステータス
type ReportStatus = 'completed' | 'processing' | 'failed' | 'draft';

// レポートデータ型
interface Report {
  id: string;
  title: string;
  theme: string;
  createdAt: Date;
  status: ReportStatus;
  progress?: number;
  tags: string[];
  starred: boolean;
  metrics: {
    marketSize?: string;
    growthRate?: string;
    competition?: 'low' | 'medium' | 'high';
    feasibility?: number;
  };
  summary: string;
  thumbnail?: string;
}

// フィルターオプション
interface FilterOptions {
  status: ReportStatus | 'all';
  tags: string[];
  dateRange: 'all' | 'today' | 'week' | 'month' | 'year';
  starred: boolean;
}

// 表示モード
type ViewMode = 'grid' | 'list';
type SortOption = 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc' | 'status';

export const ReportHistory: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortOption, setSortOption] = useState<SortOption>('date-desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  
  // フィルター状態
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    tags: [],
    dateRange: 'all',
    starred: false
  });

  // サンプルデータ
  const reports: Report[] = [
    {
      id: '1',
      title: 'スマートシティ向けIoTプラットフォーム',
      theme: 'スマートシティ',
      createdAt: new Date('2024-01-17T10:30:00'),
      status: 'completed',
      tags: ['IoT', 'スマートシティ', 'インフラ'],
      starred: true,
      metrics: {
        marketSize: '5.2兆円',
        growthRate: '23.4%',
        competition: 'medium',
        feasibility: 85
      },
      summary: '都市インフラのデジタル化により、交通渋滞を30%削減し、エネルギー効率を25%向上させる革新的なプラットフォーム。'
    },
    {
      id: '2',
      title: 'グリーンビルディング最適化システム',
      theme: '環境・サステナビリティ',
      createdAt: new Date('2024-01-16T14:20:00'),
      status: 'processing',
      progress: 65,
      tags: ['環境', '建築', 'AI'],
      starred: false,
      metrics: {
        marketSize: '3.8兆円',
        growthRate: '18.7%',
        competition: 'low',
        feasibility: 72
      },
      summary: 'AIを活用してビルのエネルギー消費を最適化し、カーボンニュートラルを実現。'
    },
    {
      id: '3',
      title: '不動産投資AIアドバイザー',
      theme: '不動産テック',
      createdAt: new Date('2024-01-15T09:15:00'),
      status: 'completed',
      tags: ['不動産', 'AI', '投資'],
      starred: true,
      metrics: {
        marketSize: '2.1兆円',
        growthRate: '31.2%',
        competition: 'high',
        feasibility: 78
      },
      summary: '機械学習により不動産投資のリスクを最小化し、収益を最大化する自動化システム。'
    },
    {
      id: '4',
      title: 'ヘルスケアデータ統合プラットフォーム',
      theme: 'ヘルスケア',
      createdAt: new Date('2024-01-14T16:45:00'),
      status: 'failed',
      tags: ['ヘルスケア', 'データ', 'プラットフォーム'],
      starred: false,
      metrics: {},
      summary: '医療データの統合と分析により、個別化医療を実現するプラットフォーム。'
    },
    {
      id: '5',
      title: '教育テクノロジー革新プログラム',
      theme: 'EdTech',
      createdAt: new Date('2024-01-13T11:00:00'),
      status: 'draft',
      tags: ['教育', 'テクノロジー', 'AI'],
      starred: false,
      metrics: {
        marketSize: '1.5兆円',
        growthRate: '28.9%',
        competition: 'medium',
        feasibility: 68
      },
      summary: 'AIチューターと適応学習システムによる個別最適化された教育体験。'
    }
  ];

  // 全タグの取得
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    reports.forEach(report => report.tags.forEach(tag => tags.add(tag)));
    return Array.from(tags);
  }, []);

  // フィルタリングとソート
  const filteredReports = useMemo(() => {
    let filtered = [...reports];

    // 検索フィルター
    if (searchQuery) {
      filtered = filtered.filter(report => 
        report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.theme.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.summary.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // ステータスフィルター
    if (filters.status !== 'all') {
      filtered = filtered.filter(report => report.status === filters.status);
    }

    // タグフィルター
    if (selectedTags.length > 0) {
      filtered = filtered.filter(report => 
        selectedTags.some(tag => report.tags.includes(tag))
      );
    }

    // お気に入りフィルター
    if (filters.starred) {
      filtered = filtered.filter(report => report.starred);
    }

    // 日付フィルター
    const now = new Date();
    if (filters.dateRange !== 'all') {
      filtered = filtered.filter(report => {
        const diff = now.getTime() - report.createdAt.getTime();
        const days = diff / (1000 * 60 * 60 * 24);
        
        switch (filters.dateRange) {
          case 'today': return days < 1;
          case 'week': return days < 7;
          case 'month': return days < 30;
          case 'year': return days < 365;
          default: return true;
        }
      });
    }

    // ソート
    filtered.sort((a, b) => {
      switch (sortOption) {
        case 'date-desc':
          return b.createdAt.getTime() - a.createdAt.getTime();
        case 'date-asc':
          return a.createdAt.getTime() - b.createdAt.getTime();
        case 'name-asc':
          return a.title.localeCompare(b.title);
        case 'name-desc':
          return b.title.localeCompare(a.title);
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

    return filtered;
  }, [searchQuery, filters, selectedTags, sortOption]);

  // ステータスごとのカラー取得
  const getStatusColor = (status: ReportStatus) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
      case 'processing':
        return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20';
      case 'failed':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20';
      case 'draft':
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20';
    }
  };

  // ステータスアイコン取得
  const getStatusIcon = (status: ReportStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} />;
      case 'processing':
        return <Clock size={16} className="animate-spin" />;
      case 'failed':
        return <AlertCircle size={16} />;
      case 'draft':
        return <FileText size={16} />;
    }
  };

  // 競合度のバッジカラー
  const getCompetitionColor = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'low':
        return 'bg-green-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'high':
        return 'bg-red-500';
    }
  };

  // レポートカード（グリッド表示）
  const ReportCard: React.FC<{ report: Report }> = ({ report }) => (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -4 }}
      className={cn(
        'relative bg-white dark:bg-gray-900 rounded-xl shadow-lg hover:shadow-xl transition-all',
        'border border-gray-200 dark:border-gray-700 overflow-hidden cursor-pointer',
        selectedReport === report.id && 'ring-2 ring-purple-500'
      )}
      onClick={() => setSelectedReport(report.id)}
    >
      {/* ヘッダー */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-1 line-clamp-2">
              {report.title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {report.theme}
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Toggle star
            }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Star 
              size={20} 
              className={report.starred ? 'fill-yellow-400 text-yellow-400' : ''} 
            />
          </button>
        </div>

        {/* ステータスバッジ */}
        <div className="flex items-center gap-2 mb-4">
          <span className={cn(
            'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
            getStatusColor(report.status)
          )}>
            {getStatusIcon(report.status)}
            {report.status === 'completed' && '完了'}
            {report.status === 'processing' && `処理中 ${report.progress}%`}
            {report.status === 'failed' && 'エラー'}
            {report.status === 'draft' && '下書き'}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            <Calendar size={12} className="inline mr-1" />
            {report.createdAt.toLocaleDateString()}
          </span>
        </div>

        {/* サマリー */}
        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-4">
          {report.summary}
        </p>

        {/* メトリクス */}
        {report.metrics && Object.keys(report.metrics).length > 0 && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            {report.metrics.marketSize && (
              <div className="text-xs">
                <span className="text-gray-500">市場規模:</span>
                <span className="ml-1 font-semibold">{report.metrics.marketSize}</span>
              </div>
            )}
            {report.metrics.growthRate && (
              <div className="text-xs">
                <span className="text-gray-500">成長率:</span>
                <span className="ml-1 font-semibold text-green-600 dark:text-green-400">
                  <TrendingUp size={10} className="inline" />
                  {report.metrics.growthRate}
                </span>
              </div>
            )}
            {report.metrics.competition && (
              <div className="text-xs">
                <span className="text-gray-500">競合度:</span>
                <span className={cn(
                  'ml-1 inline-block w-2 h-2 rounded-full',
                  getCompetitionColor(report.metrics.competition)
                )} />
              </div>
            )}
            {report.metrics.feasibility && (
              <div className="text-xs">
                <span className="text-gray-500">実現性:</span>
                <span className="ml-1 font-semibold">{report.metrics.feasibility}%</span>
              </div>
            )}
          </div>
        )}

        {/* タグ */}
        <div className="flex flex-wrap gap-1">
          {report.tags.map(tag => (
            <span
              key={tag}
              className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-xs rounded-md"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* アクションバー */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-3 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <Eye size={16} />
          </button>
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <Download size={16} />
          </button>
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <Share2 size={16} />
          </button>
        </div>
        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
          <MoreVertical size={16} />
        </button>
      </div>

      {/* プログレスバー（処理中の場合） */}
      {report.status === 'processing' && report.progress && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-600 to-blue-600"
            initial={{ width: 0 }}
            animate={{ width: `${report.progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      )}
    </motion.div>
  );

  // レポート行（リスト表示）
  const ReportRow: React.FC<{ report: Report }> = ({ report }) => (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={cn(
        'bg-white dark:bg-gray-900 rounded-lg p-4 hover:shadow-md transition-all',
        'border border-gray-200 dark:border-gray-700 cursor-pointer',
        selectedReport === report.id && 'ring-2 ring-purple-500'
      )}
      onClick={() => setSelectedReport(report.id)}
    >
      <div className="flex items-center gap-4">
        {/* スター */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            // Toggle star
          }}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
        >
          <Star 
            size={18} 
            className={report.starred ? 'fill-yellow-400 text-yellow-400' : ''} 
          />
        </button>

        {/* メイン情報 */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="font-medium">{report.title}</h3>
            <span className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs',
              getStatusColor(report.status)
            )}>
              {getStatusIcon(report.status)}
              {report.status === 'completed' && '完了'}
              {report.status === 'processing' && `${report.progress}%`}
              {report.status === 'failed' && 'エラー'}
              {report.status === 'draft' && '下書き'}
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {report.theme} • {report.createdAt.toLocaleDateString()}
          </p>
        </div>

        {/* メトリクス */}
        <div className="hidden md:flex items-center gap-6 text-sm">
          {report.metrics?.marketSize && (
            <div>
              <span className="text-gray-500">市場:</span>
              <span className="ml-1 font-medium">{report.metrics.marketSize}</span>
            </div>
          )}
          {report.metrics?.growthRate && (
            <div className="text-green-600 dark:text-green-400">
              <TrendingUp size={14} className="inline" />
              <span className="ml-1 font-medium">{report.metrics.growthRate}</span>
            </div>
          )}
        </div>

        {/* アクション */}
        <div className="flex items-center gap-1">
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <Eye size={16} />
          </button>
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <Download size={16} />
          </button>
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <MoreVertical size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen">
      {/* ヘッダー */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">レポート履歴</h1>
        <p className="text-gray-600 dark:text-gray-400">
          生成されたビジネスアイデアレポートの一覧
        </p>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">総レポート数</span>
            <FileText size={20} className="text-purple-600" />
          </div>
          <div className="text-2xl font-bold">{reports.length}</div>
          <div className="text-xs text-green-600 dark:text-green-400">
            +12% 前月比
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">完了済み</span>
            <CheckCircle size={20} className="text-green-600" />
          </div>
          <div className="text-2xl font-bold">
            {reports.filter(r => r.status === 'completed').length}
          </div>
          <div className="text-xs text-gray-500">
            成功率 {Math.round((reports.filter(r => r.status === 'completed').length / reports.length) * 100)}%
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">お気に入り</span>
            <Star size={20} className="text-yellow-500" />
          </div>
          <div className="text-2xl font-bold">
            {reports.filter(r => r.starred).length}
          </div>
          <div className="text-xs text-gray-500">
            重要なレポート
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">今週の生成</span>
            <TrendingUp size={20} className="text-blue-600" />
          </div>
          <div className="text-2xl font-bold">7</div>
          <div className="text-xs text-blue-600 dark:text-blue-400">
            +23% 前週比
          </div>
        </motion.div>
      </div>

      {/* コントロールバー */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-4 mb-6 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* 検索 */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="レポートを検索..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800"
              />
            </div>
          </div>

          {/* フィルター */}
          <div className="flex items-center gap-2">
            {/* タグフィルター */}
            <div className="relative">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <Filter size={16} />
                <span>フィルター</span>
                {selectedTags.length > 0 && (
                  <span className="px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full">
                    {selectedTags.length}
                  </span>
                )}
                <ChevronDown size={16} />
              </button>
            </div>

            {/* ソート */}
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
            >
              <option value="date-desc">新しい順</option>
              <option value="date-asc">古い順</option>
              <option value="name-asc">名前順 (A-Z)</option>
              <option value="name-desc">名前順 (Z-A)</option>
              <option value="status">ステータス順</option>
            </select>

            {/* ビューモード切り替え */}
            <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-2 rounded transition-colors',
                  viewMode === 'grid' 
                    ? 'bg-white dark:bg-gray-700 shadow-sm' 
                    : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                )}
              >
                <Grid size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-2 rounded transition-colors',
                  viewMode === 'list' 
                    ? 'bg-white dark:bg-gray-700 shadow-sm' 
                    : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                )}
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* フィルタードロップダウン */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* ステータスフィルター */}
                <div>
                  <label className="block text-sm font-medium mb-2">ステータス</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                  >
                    <option value="all">すべて</option>
                    <option value="completed">完了</option>
                    <option value="processing">処理中</option>
                    <option value="failed">エラー</option>
                    <option value="draft">下書き</option>
                  </select>
                </div>

                {/* 期間フィルター */}
                <div>
                  <label className="block text-sm font-medium mb-2">期間</label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => setFilters({ ...filters, dateRange: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                  >
                    <option value="all">すべて</option>
                    <option value="today">今日</option>
                    <option value="week">今週</option>
                    <option value="month">今月</option>
                    <option value="year">今年</option>
                  </select>
                </div>

                {/* お気に入りフィルター */}
                <div>
                  <label className="block text-sm font-medium mb-2">その他</label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.starred}
                      onChange={(e) => setFilters({ ...filters, starred: e.target.checked })}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm">お気に入りのみ表示</span>
                  </label>
                </div>
              </div>

              {/* タグ選択 */}
              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">タグ</label>
                <div className="flex flex-wrap gap-2">
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => {
                        if (selectedTags.includes(tag)) {
                          setSelectedTags(selectedTags.filter(t => t !== tag));
                        } else {
                          setSelectedTags([...selectedTags, tag]);
                        }
                      }}
                      className={cn(
                        'px-3 py-1 rounded-full text-sm transition-all',
                        selectedTags.includes(tag)
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                      )}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* レポート一覧 */}
      <AnimatePresence mode="popLayout">
        {viewMode === 'grid' ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredReports.map(report => (
              <ReportCard key={report.id} report={report} />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {filteredReports.map(report => (
              <ReportRow key={report.id} report={report} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 空の状態 */}
      {filteredReports.length === 0 && (
        <div className="text-center py-12">
          <FileText size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            条件に一致するレポートが見つかりません
          </p>
        </div>
      )}
    </div>
  );
};

export default ReportHistory;