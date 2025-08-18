'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReports, useToggleStar, useDeleteReport } from '@/hooks/useReports';
import { useReportHistoryStore } from '@/hooks/useReportHistory';
import { ReportCard } from '@/components/ReportCard';
import { SearchFilter } from '@/components/SearchFilter';
import { Pagination, InfiniteScroll } from '@/components/Pagination';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Grid, List, FileText, TrendingUp, CheckCircle, 
  Star, Plus, Download, RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const ReportHistoryPage: React.FC = () => {
  const { filters, setFilters, viewMode, setViewMode } = useReportHistoryStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [useInfiniteScroll, setUseInfiniteScroll] = useState(false);

  // API呼び出し
  const { 
    data: reports = [], 
    isLoading, 
    error, 
    refetch 
  } = useReports(filters);
  
  const toggleStarMutation = useToggleStar();
  const deleteReportMutation = useDeleteReport();

  // ページネーション計算
  const totalItems = reports.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedReports = useMemo(() => {
    if (useInfiniteScroll) return reports;
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return reports.slice(start, end);
  }, [reports, currentPage, itemsPerPage, useInfiniteScroll]);

  // 全タグ取得
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    reports.forEach(report => {
      report.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [reports]);

  // 統計情報
  const statistics = useMemo(() => {
    const completed = reports.filter(r => r.status === 'completed').length;
    const processing = reports.filter(r => r.status === 'processing').length;
    const starred = reports.filter(r => r.starred).length;
    const thisWeek = reports.filter(r => {
      const date = new Date(r.created_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return date > weekAgo;
    }).length;

    return { 
      total: reports.length, 
      completed, 
      processing, 
      starred, 
      thisWeek 
    };
  }, [reports]);

  // ハンドラー
  const handleToggleStar = (reportId: string, starred: boolean) => {
    toggleStarMutation.mutate({ id: reportId, starred });
  };

  const handleDeleteReport = (reportId: string) => {
    if (confirm('このレポートを削除してもよろしいですか？')) {
      deleteReportMutation.mutate(reportId);
    }
  };

  const handleViewReport = (reportId: string) => {
    window.location.href = `/reports/${reportId}`;
  };

  const handleEditReport = (reportId: string) => {
    window.location.href = `/reports/${reportId}/edit`;
  };

  const handleExportReports = () => {
    const csvContent = [
      ['ID', 'タイトル', 'テーマ', 'ステータス', '作成日', 'タグ'],
      ...reports.map(r => [
        r.id,
        r.title,
        r.theme,
        r.status,
        new Date(r.created_at).toLocaleDateString('ja-JP'),
        r.tags.join(', ')
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `reports_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen p-6">
      {/* ヘッダー */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">レポート履歴</h1>
            <p className="text-muted-foreground">
              AIが生成したビジネスアイデアレポートの管理
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleExportReports}
              disabled={reports.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              エクスポート
            </Button>
            <Button
              onClick={() => window.location.href = '/reports/new'}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              新規作成
            </Button>
          </div>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-900 rounded-xl p-6 border"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">総レポート数</span>
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-2xl font-bold">{statistics.total}</div>
            <div className="text-xs text-green-600">
              +{statistics.thisWeek} 今週
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-900 rounded-xl p-6 border"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">完了済み</span>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold">{statistics.completed}</div>
            <div className="text-xs text-muted-foreground">
              成功率 {statistics.total > 0 ? Math.round((statistics.completed / statistics.total) * 100) : 0}%
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-900 rounded-xl p-6 border"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">処理中</span>
              <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
            </div>
            <div className="text-2xl font-bold">{statistics.processing}</div>
            <div className="text-xs text-muted-foreground">
              実行中のタスク
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-900 rounded-xl p-6 border"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">お気に入り</span>
              <Star className="w-5 h-5 text-yellow-500" />
            </div>
            <div className="text-2xl font-bold">{statistics.starred}</div>
            <div className="text-xs text-muted-foreground">
              重要なレポート
            </div>
          </motion.div>
        </div>
      </div>

      {/* 検索・フィルター */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 mb-6 border">
        <SearchFilter
          filters={filters}
          onFiltersChange={setFilters}
          availableTags={allTags}
          totalResults={reports.length}
        />
        
        {/* ビューモード切り替え */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">表示モード:</span>
            <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-8 px-3"
              >
                <Grid className="w-4 h-4 mr-1" />
                グリッド
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8 px-3"
              >
                <List className="w-4 h-4 mr-1" />
                リスト
              </Button>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={cn('w-4 h-4 mr-1', isLoading && 'animate-spin')} />
            更新
          </Button>
        </div>
      </div>

      {/* レポート一覧 */}
      {isLoading ? (
        <div className={cn(
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-3'
        )}>
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">レポートの読み込みに失敗しました</p>
          <Button onClick={() => refetch()}>
            再試行
          </Button>
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-muted-foreground mb-4">
            条件に一致するレポートが見つかりません
          </p>
          <Button onClick={() => window.location.href = '/reports/new'}>
            最初のレポートを作成
          </Button>
        </div>
      ) : (
        <>
          {useInfiniteScroll ? (
            <InfiniteScroll
              onLoadMore={() => {}}
              hasMore={false}
              isLoading={false}
              className={cn(
                viewMode === 'grid' 
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                  : 'space-y-3'
              )}
            >
              <AnimatePresence mode="popLayout">
                {paginatedReports.map((report, index) => (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <ReportCard
                      report={report}
                      onToggleStar={handleToggleStar}
                      onDelete={handleDeleteReport}
                      onView={handleViewReport}
                      onEdit={handleEditReport}
                      variant={viewMode}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </InfiniteScroll>
          ) : (
            <>
              <div className={cn(
                viewMode === 'grid' 
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                  : 'space-y-3'
              )}>
                <AnimatePresence mode="popLayout">
                  {paginatedReports.map((report, index) => (
                    <motion.div
                      key={report.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <ReportCard
                        report={report}
                        onToggleStar={handleToggleStar}
                        onDelete={handleDeleteReport}
                        onView={handleViewReport}
                        onEdit={handleEditReport}
                        variant={viewMode}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* ページネーション */}
              {totalPages > 1 && (
                <div className="mt-8">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={setItemsPerPage}
                    isLoading={isLoading}
                  />
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ReportHistoryPage;