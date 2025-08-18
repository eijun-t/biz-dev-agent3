'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  History, Search, Filter, Download, GitCompare,
  RefreshCw, Settings, ChevronRight, Loader2,
  TrendingUp, Target, DollarSign, Users,
  AlertCircle, CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

// コンポーネントのインポート
import { DateRangeFilter } from '@/components/filters/DateRangeFilter';
import { TagFilter } from '@/components/filters/TagFilter';
import { StatusFilter, ReportStatus } from '@/components/filters/StatusFilter';
import { ReportComparison } from '@/components/ReportComparison';
import { ExportUI } from '@/components/ExportUI';
import { AdvancedSearchFilter } from '@/components/AdvancedSearchFilter';
import { DarkModeToggle } from '@/components/DarkModeToggle';

// Hooksのインポート
import { useReportHistory, Report } from '@/hooks/useReportHistory';
import { useDebounce } from '@/hooks/useDebounce';
import { DateRange } from 'react-day-picker';

export const ReportHistory: React.FC = () => {
  // State管理
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<ReportStatus[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // デバウンス処理
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // データ取得
  const { 
    reports, 
    loading, 
    error, 
    refetch,
    availableTags,
    statusCounts 
  } = useReportHistory({
    search: debouncedSearchQuery,
    statuses: selectedStatuses,
    tags: selectedTags,
    dateRange
  });

  // レポート選択
  const toggleReportSelection = (reportId: string) => {
    setSelectedReports(prev => 
      prev.includes(reportId)
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId]
    );
  };

  // 全選択/全解除
  const toggleAllSelection = () => {
    if (selectedReports.length === reports.length) {
      setSelectedReports([]);
    } else {
      setSelectedReports(reports.map(r => r.id));
    }
  };

  // 比較モード開始
  const startComparison = () => {
    if (selectedReports.length >= 2) {
      setShowComparison(true);
    }
  };

  // エクスポート処理
  const handleExport = async (options: any) => {
    console.log('Exporting reports:', selectedReports, options);
    // Worker3のAPIと連携
    await new Promise(resolve => setTimeout(resolve, 2000));
  };

  // リアルタイム更新（WebSocket）
  useEffect(() => {
    // WebSocket接続（Worker3のAPIと連携）
    const ws = new WebSocket('ws://localhost:3001/ws/reports');
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'report_updated') {
        refetch();
      }
    };

    return () => ws.close();
  }, [refetch]);

  // レポートカード
  const ReportCard: React.FC<{ report: Report }> = ({ report }) => {
    const isSelected = selectedReports.includes(report.id);
    const statusConfig = {
      completed: { color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle },
      processing: { color: 'text-blue-600', bg: 'bg-blue-100', icon: RefreshCw },
      failed: { color: 'text-red-600', bg: 'bg-red-100', icon: AlertCircle },
      draft: { color: 'text-gray-600', bg: 'bg-gray-100', icon: Settings }
    };
    const config = statusConfig[report.status];
    const StatusIcon = config.icon;

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        whileHover={{ scale: 1.02 }}
        className={cn(
          'relative cursor-pointer transition-all',
          isSelected && 'ring-2 ring-primary ring-offset-2'
        )}
        onClick={() => toggleReportSelection(report.id)}
      >
        <Card className="h-full">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg line-clamp-1">
                  {report.title}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {new Date(report.created_at).toLocaleDateString('ja-JP')}
                </p>
              </div>
              <Badge className={cn(config.bg, config.color, 'gap-1')}>
                <StatusIcon className="h-3 w-3" />
                {report.status === 'completed' ? '完了' :
                 report.status === 'processing' ? '処理中' :
                 report.status === 'failed' ? 'エラー' : '下書き'}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-3">
            {/* サマリー */}
            <p className="text-sm text-muted-foreground line-clamp-2">
              {report.summary}
            </p>
            
            {/* メトリクス */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-1">
                <DollarSign className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs">
                  {report.metrics?.market_size || '-'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <span className="text-xs">
                  {report.metrics?.growth_rate || '-'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Target className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs">
                  実現性: {report.metrics?.feasibility || 0}%
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs">
                  {report.metrics?.target_users || '-'}
                </span>
              </div>
            </div>
            
            {/* タグ */}
            <div className="flex flex-wrap gap-1">
              {report.tags.slice(0, 3).map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  #{tag}
                </Badge>
              ))}
              {report.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{report.tags.length - 3}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* ヘッダー */}
      <div className="border-b">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <History className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">レポート履歴</h1>
              <Badge variant="secondary" className="ml-2">
                {reports.length}件
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={refetch}
                disabled={loading}
              >
                <RefreshCw className={cn(
                  'h-4 w-4',
                  loading && 'animate-spin'
                )} />
              </Button>
              <DarkModeToggle variant="compact" />
            </div>
          </div>
          
          {/* 検索バー */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="タイトル、サマリー、タグで検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <AdvancedSearchFilter
              onFiltersChange={(filters) => {
                // 詳細フィルター適用
                console.log('Advanced filters:', filters);
              }}
            />
          </div>
        </div>
        
        {/* フィルターバー */}
        <div className="px-4 pb-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            <DateRangeFilter onDateRangeChange={setDateRange} />
            <StatusFilter
              selectedStatuses={selectedStatuses}
              onStatusChange={setSelectedStatuses}
              showCounts
              statusCounts={statusCounts}
            />
            <TagFilter
              availableTags={availableTags}
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
            />
          </div>
        </div>
      </div>

      {/* アクションバー */}
      {selectedReports.length > 0 && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-b bg-muted/50"
        >
          <div className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="default">
                {selectedReports.length}個選択中
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleAllSelection}
              >
                {selectedReports.length === reports.length ? '全解除' : '全選択'}
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={startComparison}
                disabled={selectedReports.length < 2}
                className="gap-2"
              >
                <GitCompare className="h-4 w-4" />
                比較
              </Button>
              <ExportUI
                reportIds={selectedReports}
                onExport={handleExport}
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* メインコンテンツ */}
      <ScrollArea className="flex-1">
        {loading && !reports.length ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-2" />
              <p className="text-muted-foreground">エラーが発生しました</p>
            </div>
          </div>
        ) : reports.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <History className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">レポートが見つかりません</p>
            </div>
          </div>
        ) : (
          <div className="p-4">
            {/* ビュー切り替え */}
            <div className="flex justify-end mb-4">
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
                <TabsList>
                  <TabsTrigger value="grid">グリッド</TabsTrigger>
                  <TabsTrigger value="list">リスト</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            {/* レポートグリッド */}
            <AnimatePresence mode="popLayout">
              <motion.div
                layout
                className={cn(
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                    : 'space-y-4'
                )}
              >
                {reports.map((report) => (
                  <ReportCard key={report.id} report={report} />
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </ScrollArea>

      {/* 比較モーダル */}
      <AnimatePresence>
        {showComparison && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            onClick={() => setShowComparison(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed inset-4 bg-background border rounded-lg shadow-lg overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <ReportComparison
                reports={reports.filter(r => selectedReports.includes(r.id))}
                onClose={() => setShowComparison(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReportHistory;