'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, Clock, AlertCircle, FileText, 
  Filter, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export type ReportStatus = 'completed' | 'processing' | 'failed' | 'draft';

interface StatusFilterProps {
  selectedStatuses: ReportStatus[];
  onStatusChange: (statuses: ReportStatus[]) => void;
  showCounts?: boolean;
  statusCounts?: Record<ReportStatus, number>;
  className?: string;
}

const statusConfig: Record<ReportStatus, {
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}> = {
  completed: {
    label: '完了',
    icon: CheckCircle,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/20'
  },
  processing: {
    label: '処理中',
    icon: Clock,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20'
  },
  failed: {
    label: 'エラー',
    icon: AlertCircle,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/20'
  },
  draft: {
    label: '下書き',
    icon: FileText,
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-900/20'
  }
};

export const StatusFilter: React.FC<StatusFilterProps> = ({
  selectedStatuses,
  onStatusChange,
  showCounts = false,
  statusCounts = { completed: 0, processing: 0, failed: 0, draft: 0 },
  className
}) => {
  const allStatuses: ReportStatus[] = ['completed', 'processing', 'failed', 'draft'];

  // ステータスの追加/削除
  const toggleStatus = (status: ReportStatus) => {
    if (selectedStatuses.includes(status)) {
      onStatusChange(selectedStatuses.filter(s => s !== status));
    } else {
      onStatusChange([...selectedStatuses, status]);
    }
  };

  // 全選択/全解除
  const toggleAll = () => {
    if (selectedStatuses.length === allStatuses.length) {
      onStatusChange([]);
    } else {
      onStatusChange(allStatuses);
    }
  };

  // クイック選択
  const quickSelections = [
    {
      label: 'アクティブ',
      statuses: ['processing', 'draft'] as ReportStatus[],
      icon: Zap
    },
    {
      label: '完了済み',
      statuses: ['completed'] as ReportStatus[],
      icon: CheckCircle
    },
    {
      label: '要確認',
      statuses: ['failed'] as ReportStatus[],
      icon: AlertCircle
    }
  ];

  return (
    <div className={cn('space-y-3', className)}>
      {/* メインフィルターボタン */}
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              ステータス
              {selectedStatuses.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {selectedStatuses.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>ステータスでフィルター</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {/* 全選択/全解除 */}
            <DropdownMenuItem onClick={toggleAll}>
              <Checkbox
                checked={selectedStatuses.length === allStatuses.length}
                className="mr-2"
              />
              すべて選択
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            
            {/* 個別ステータス */}
            {allStatuses.map((status) => {
              const config = statusConfig[status];
              const Icon = config.icon;
              return (
                <DropdownMenuItem
                  key={status}
                  onClick={() => toggleStatus(status)}
                >
                  <Checkbox
                    checked={selectedStatuses.includes(status)}
                    className="mr-2"
                  />
                  <Icon className={cn('h-4 w-4 mr-2', config.color)} />
                  <span className="flex-1">{config.label}</span>
                  {showCounts && (
                    <Badge variant="outline" className="ml-2">
                      {statusCounts[status]}
                    </Badge>
                  )}
                </DropdownMenuItem>
              );
            })}
            
            <DropdownMenuSeparator />
            
            {/* クイック選択 */}
            <DropdownMenuLabel className="text-xs">クイック選択</DropdownMenuLabel>
            {quickSelections.map((quick) => (
              <DropdownMenuItem
                key={quick.label}
                onClick={() => onStatusChange(quick.statuses)}
              >
                <quick.icon className="h-4 w-4 mr-2" />
                {quick.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 選択されたステータスの表示 */}
        {selectedStatuses.length > 0 && selectedStatuses.length < allStatuses.length && (
          <div className="flex gap-1">
            {selectedStatuses.map((status, index) => {
              const config = statusConfig[status];
              const Icon = config.icon;
              return (
                <motion.div
                  key={status}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Badge
                    variant="secondary"
                    className={cn('gap-1', config.bgColor, config.color)}
                  >
                    <Icon className="h-3 w-3" />
                    {config.label}
                  </Badge>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ステータスバッジ（コンパクト表示） */}
      <div className="flex flex-wrap gap-2">
        {allStatuses.map((status) => {
          const config = statusConfig[status];
          const Icon = config.icon;
          const isSelected = selectedStatuses.includes(status);
          
          return (
            <motion.button
              key={status}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleStatus(status)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                isSelected
                  ? cn(config.bgColor, config.color, 'ring-2 ring-offset-2 ring-offset-background')
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{config.label}</span>
              {showCounts && (
                <span className="ml-1 text-xs opacity-70">
                  ({statusCounts[status]})
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default StatusFilter;