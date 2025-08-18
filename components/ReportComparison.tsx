'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GitCompare, X, ChevronLeft, ChevronRight, 
  TrendingUp, Target, DollarSign, Users,
  AlertCircle, CheckCircle, Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Report } from '@/hooks/useReportHistory';

interface ReportComparisonProps {
  reports: Report[];
  onClose?: () => void;
  className?: string;
}

export const ReportComparison: React.FC<ReportComparisonProps> = ({
  reports,
  onClose,
  className
}) => {
  const [selectedReports, setSelectedReports] = useState<[Report?, Report?]>([
    reports[0],
    reports[1]
  ]);
  const [comparisonView, setComparisonView] = useState<'side-by-side' | 'overlay'>('side-by-side');

  // レポート選択
  const selectReport = (index: 0 | 1, report: Report) => {
    const newSelection = [...selectedReports] as [Report?, Report?];
    newSelection[index] = report;
    setSelectedReports(newSelection);
  };

  // メトリクス比較
  const compareMetrics = (metric: string, report1?: Report, report2?: Report) => {
    if (!report1?.metrics || !report2?.metrics) return null;
    
    const value1 = report1.metrics[metric as keyof typeof report1.metrics];
    const value2 = report2.metrics[metric as keyof typeof report2.metrics];
    
    if (!value1 || !value2) return null;
    
    // 数値比較
    if (typeof value1 === 'number' && typeof value2 === 'number') {
      const diff = value2 - value1;
      const percentChange = ((diff / value1) * 100).toFixed(1);
      return {
        value1,
        value2,
        diff,
        percentChange,
        improved: diff > 0
      };
    }
    
    return { value1, value2 };
  };

  // 差分ハイライト
  const DifferenceHighlight: React.FC<{ 
    value1: any; 
    value2: any;
    label: string;
  }> = ({ value1, value2, label }) => {
    const isDifferent = value1 !== value2;
    
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">{label}</Label>
        <div className="grid grid-cols-2 gap-4">
          <div className={cn(
            'p-3 rounded-lg border',
            isDifferent && 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
          )}>
            <div className="text-sm text-muted-foreground">レポート1</div>
            <div className="font-medium">{value1 || '-'}</div>
          </div>
          <div className={cn(
            'p-3 rounded-lg border',
            isDifferent && 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          )}>
            <div className="text-sm text-muted-foreground">レポート2</div>
            <div className="font-medium">{value2 || '-'}</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={cn('h-full flex flex-col', className)}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <GitCompare className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">レポート比較</h2>
          <Badge variant="secondary">
            {selectedReports.filter(Boolean).length}個選択中
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          {/* ビュー切り替え */}
          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            <Button
              variant={comparisonView === 'side-by-side' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setComparisonView('side-by-side')}
            >
              並列表示
            </Button>
            <Button
              variant={comparisonView === 'overlay' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setComparisonView('overlay')}
            >
              重ね表示
            </Button>
          </div>
          
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* レポート選択 */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50">
        {[0, 1].map((index) => (
          <div key={index} className="space-y-2">
            <Label className="text-sm font-medium">
              レポート{index + 1}
            </Label>
            <select
              className="w-full p-2 border rounded-lg bg-background"
              value={selectedReports[index as 0 | 1]?.id || ''}
              onChange={(e) => {
                const report = reports.find(r => r.id === e.target.value);
                if (report) selectReport(index as 0 | 1, report);
              }}
            >
              <option value="">レポートを選択</option>
              {reports.map((report) => (
                <option key={report.id} value={report.id}>
                  {report.title}
                </option>
              ))}
            </select>
            
            {selectedReports[index as 0 | 1] && (
              <div className="text-xs text-muted-foreground">
                作成日: {new Date(selectedReports[index as 0 | 1]!.created_at).toLocaleDateString('ja-JP')}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 比較内容 */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">概要</TabsTrigger>
              <TabsTrigger value="metrics">メトリクス</TabsTrigger>
              <TabsTrigger value="tags">タグ</TabsTrigger>
              <TabsTrigger value="timeline">タイムライン</TabsTrigger>
            </TabsList>

            {/* 概要タブ */}
            <TabsContent value="overview" className="space-y-4 mt-4">
              <DifferenceHighlight
                label="タイトル"
                value1={selectedReports[0]?.title}
                value2={selectedReports[1]?.title}
              />
              
              <DifferenceHighlight
                label="テーマ"
                value1={selectedReports[0]?.theme}
                value2={selectedReports[1]?.theme}
              />
              
              <DifferenceHighlight
                label="ステータス"
                value1={selectedReports[0]?.status}
                value2={selectedReports[1]?.status}
              />
              
              <DifferenceHighlight
                label="サマリー"
                value1={selectedReports[0]?.summary}
                value2={selectedReports[1]?.summary}
              />
            </TabsContent>

            {/* メトリクスタブ */}
            <TabsContent value="metrics" className="space-y-4 mt-4">
              {selectedReports[0] && selectedReports[1] && (
                <div className="space-y-4">
                  {/* 市場規模 */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">
                        市場規模
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-2xl font-bold">
                            {selectedReports[0].metrics?.market_size || '-'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {selectedReports[0].title}
                          </div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold">
                            {selectedReports[1].metrics?.market_size || '-'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {selectedReports[1].title}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* 成長率 */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        成長率
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-2xl font-bold text-green-600">
                            {selectedReports[0].metrics?.growth_rate || '-'}
                          </div>
                          <Progress 
                            value={parseFloat(selectedReports[0].metrics?.growth_rate || '0')} 
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-600">
                            {selectedReports[1].metrics?.growth_rate || '-'}
                          </div>
                          <Progress 
                            value={parseFloat(selectedReports[1].metrics?.growth_rate || '0')} 
                            className="mt-2"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* 実現性 */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        実現性スコア
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-2xl font-bold">
                            {selectedReports[0].metrics?.feasibility || 0}%
                          </div>
                          <Progress 
                            value={selectedReports[0].metrics?.feasibility || 0} 
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <div className="text-2xl font-bold">
                            {selectedReports[1].metrics?.feasibility || 0}%
                          </div>
                          <Progress 
                            value={selectedReports[1].metrics?.feasibility || 0} 
                            className="mt-2"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            {/* タグタブ */}
            <TabsContent value="tags" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    レポート1のタグ
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedReports[0]?.tags.map(tag => (
                      <Badge key={tag} variant="secondary">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    レポート2のタグ
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedReports[1]?.tags.map(tag => (
                      <Badge key={tag} variant="secondary">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* 共通タグと差分 */}
              {selectedReports[0] && selectedReports[1] && (
                <div className="space-y-3 pt-4 border-t">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      共通タグ
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedReports[0].tags
                        .filter(tag => selectedReports[1]?.tags.includes(tag))
                        .map(tag => (
                          <Badge key={tag} variant="default">
                            #{tag}
                          </Badge>
                        ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      固有タグ
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedReports[0].tags
                        .filter(tag => !selectedReports[1]?.tags.includes(tag))
                        .map(tag => (
                          <Badge key={tag} variant="outline" className="border-orange-500">
                            #{tag} (1のみ)
                          </Badge>
                        ))}
                      {selectedReports[1].tags
                        .filter(tag => !selectedReports[0]?.tags.includes(tag))
                        .map(tag => (
                          <Badge key={tag} variant="outline" className="border-blue-500">
                            #{tag} (2のみ)
                          </Badge>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* タイムラインタブ */}
            <TabsContent value="timeline" className="space-y-4 mt-4">
              <div className="relative">
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border" />
                
                {selectedReports[0] && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-4 mb-4"
                  >
                    <div className="flex-1 text-right">
                      <div className="font-medium">{selectedReports[0].title}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(selectedReports[0].created_at).toLocaleString('ja-JP')}
                      </div>
                    </div>
                    <div className="w-3 h-3 bg-orange-500 rounded-full border-2 border-background" />
                    <div className="flex-1" />
                  </motion.div>
                )}
                
                {selectedReports[1] && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-4"
                  >
                    <div className="flex-1" />
                    <div className="w-3 h-3 bg-blue-500 rounded-full border-2 border-background" />
                    <div className="flex-1">
                      <div className="font-medium">{selectedReports[1].title}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(selectedReports[1].created_at).toLocaleString('ja-JP')}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
};

// Label コンポーネント（簡易版）
const Label: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className 
}) => (
  <label className={cn('text-sm font-medium', className)}>
    {children}
  </label>
);

export default ReportComparison;