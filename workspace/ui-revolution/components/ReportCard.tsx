'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Star, MoreVertical, Eye, Download, Share2, Trash2, 
  Calendar, TrendingUp, Target, Clock, CheckCircle, 
  AlertCircle, FileText, Edit
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Report } from '@/hooks/useReportHistory';

interface ReportCardProps {
  report: Report;
  onToggleStar?: (reportId: string, starred: boolean) => void;
  onDelete?: (reportId: string) => void;
  onView?: (reportId: string) => void;
  onEdit?: (reportId: string) => void;
  variant?: 'grid' | 'list';
}

export const ReportCard: React.FC<ReportCardProps> = ({
  report,
  onToggleStar,
  onDelete,
  onView,
  onEdit,
  variant = 'grid'
}) => {
  const [isStarred, setIsStarred] = useState(report.starred);

  const handleToggleStar = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsStarred(!isStarred);
    if (onToggleStar) {
      onToggleStar(report.id, report.starred);
    }
  };

  const getStatusIcon = (status: Report['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'processing':
        return <Clock className="w-4 h-4 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4" />;
      case 'draft':
        return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: Report['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getCompetitionBadge = (level?: 'low' | 'medium' | 'high') => {
    if (!level) return null;
    const colors = {
      low: 'bg-green-500',
      medium: 'bg-yellow-500',
      high: 'bg-red-500'
    };
    return <div className={cn('w-2 h-2 rounded-full', colors[level])} />;
  };

  if (variant === 'list') {
    return (
      <motion.div
        whileHover={{ x: 4 }}
        onClick={() => onView?.(report.id)}
        className="group"
      >
        <Card className="cursor-pointer hover:shadow-md transition-all">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              {/* スターボタン */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleStar}
                className="shrink-0"
              >
                <Star 
                  className={cn(
                    'w-5 h-5 transition-colors',
                    isStarred && 'fill-yellow-400 text-yellow-400'
                  )}
                />
              </Button>

              {/* メイン情報 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-semibold truncate">{report.title}</h3>
                  <Badge variant="secondary" className={cn('shrink-0', getStatusColor(report.status))}>
                    {getStatusIcon(report.status)}
                    <span className="ml-1">
                      {report.status === 'completed' && '完了'}
                      {report.status === 'processing' && `${report.progress || 0}%`}
                      {report.status === 'failed' && 'エラー'}
                      {report.status === 'draft' && '下書き'}
                    </span>
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{report.theme}</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(report.created_at).toLocaleDateString('ja-JP')}
                  </span>
                  {report.tags.length > 0 && (
                    <div className="flex gap-1">
                      {report.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {report.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{report.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* メトリクス */}
              {report.metrics && (
                <div className="hidden md:flex items-center gap-6 text-sm">
                  {report.metrics.market_size && (
                    <div>
                      <span className="text-muted-foreground">市場:</span>
                      <span className="ml-1 font-medium">{report.metrics.market_size}</span>
                    </div>
                  )}
                  {report.metrics.growth_rate && (
                    <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                      <TrendingUp className="w-4 h-4" />
                      <span className="font-medium">{report.metrics.growth_rate}</span>
                    </div>
                  )}
                  {report.metrics.competition && (
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">競合:</span>
                      {getCompetitionBadge(report.metrics.competition)}
                    </div>
                  )}
                </div>
              )}

              {/* アクション */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" onClick={(e) => {
                  e.stopPropagation();
                  onView?.(report.id);
                }}>
                  <Eye className="w-4 h-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit?.(report.id)}>
                      <Edit className="w-4 h-4 mr-2" />
                      編集
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Download className="w-4 h-4 mr-2" />
                      ダウンロード
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Share2 className="w-4 h-4 mr-2" />
                      共有
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={() => onDelete?.(report.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      削除
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // グリッド表示
  return (
    <motion.div
      whileHover={{ y: -4 }}
      onClick={() => onView?.(report.id)}
      className="group"
    >
      <Card className="cursor-pointer hover:shadow-lg transition-all h-full">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="line-clamp-2">{report.title}</CardTitle>
              <CardDescription>{report.theme}</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleStar}
              className="shrink-0"
            >
              <Star 
                className={cn(
                  'w-5 h-5 transition-colors',
                  isStarred && 'fill-yellow-400 text-yellow-400'
                )}
              />
            </Button>
          </div>

          {/* ステータスバッジ */}
          <div className="flex items-center gap-2 mt-3">
            <Badge className={cn('text-xs', getStatusColor(report.status))}>
              {getStatusIcon(report.status)}
              <span className="ml-1">
                {report.status === 'completed' && '完了'}
                {report.status === 'processing' && `処理中 ${report.progress || 0}%`}
                {report.status === 'failed' && 'エラー'}
                {report.status === 'draft' && '下書き'}
              </span>
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(report.created_at).toLocaleDateString('ja-JP')}
            </span>
          </div>
        </CardHeader>

        <CardContent>
          {/* サマリー */}
          {report.summary && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
              {report.summary}
            </p>
          )}

          {/* メトリクス */}
          {report.metrics && Object.keys(report.metrics).length > 0 && (
            <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
              {report.metrics.market_size && (
                <div>
                  <span className="text-muted-foreground">市場規模:</span>
                  <span className="ml-1 font-semibold">{report.metrics.market_size}</span>
                </div>
              )}
              {report.metrics.growth_rate && (
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">成長率:</span>
                  <span className="ml-1 font-semibold text-green-600 dark:text-green-400">
                    <TrendingUp className="w-3 h-3 inline" />
                    {report.metrics.growth_rate}
                  </span>
                </div>
              )}
              {report.metrics.competition && (
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">競合度:</span>
                  <span className="ml-1">{getCompetitionBadge(report.metrics.competition)}</span>
                </div>
              )}
              {report.metrics.feasibility && (
                <div>
                  <span className="text-muted-foreground">実現性:</span>
                  <span className="ml-1 font-semibold">{report.metrics.feasibility}%</span>
                </div>
              )}
            </div>
          )}

          {/* タグ */}
          {report.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {report.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-0">
          <div className="flex items-center justify-between w-full opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={(e) => {
                e.stopPropagation();
                onView?.(report.id);
              }}>
                <Eye className="w-4 h-4 mr-1" />
                詳細
              </Button>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit?.(report.id)}>
                  <Edit className="w-4 h-4 mr-2" />
                  編集
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Download className="w-4 h-4 mr-2" />
                  ダウンロード
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Share2 className="w-4 h-4 mr-2" />
                  共有
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={() => onDelete?.(report.id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  削除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardFooter>

        {/* プログレスバー（処理中の場合） */}
        {report.status === 'processing' && report.progress && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 rounded-b-lg overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-600 to-blue-600"
              initial={{ width: 0 }}
              animate={{ width: `${report.progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        )}
      </Card>
    </motion.div>
  );
};

export default ReportCard;