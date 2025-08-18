'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Search, Filter, X, Calendar, Star, Tag,
  ChevronDown, RotateCcw, SlidersHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FilterOptions } from '@/hooks/useReportHistory';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchFilterProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  availableTags: string[];
  totalResults?: number;
  className?: string;
}

export const SearchFilter: React.FC<SearchFilterProps> = ({
  filters,
  onFiltersChange,
  availableTags,
  totalResults,
  className
}) => {
  const [localSearchQuery, setLocalSearchQuery] = useState(filters.searchQuery || '');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>(filters.tags || []);
  
  // デバウンス処理した検索クエリ
  const debouncedSearchQuery = useDebounce(localSearchQuery, 300);

  // 検索クエリの変更を親コンポーネントに通知
  useEffect(() => {
    if (debouncedSearchQuery !== filters.searchQuery) {
      onFiltersChange({
        ...filters,
        searchQuery: debouncedSearchQuery
      });
    }
  }, [debouncedSearchQuery]);

  // フィルターのリセット
  const handleResetFilters = () => {
    setLocalSearchQuery('');
    setSelectedTags([]);
    onFiltersChange({
      status: 'all',
      tags: [],
      dateRange: 'all',
      starred: false,
      searchQuery: '',
      sortBy: 'date-desc'
    });
  };

  // タグの選択/解除
  const handleTagToggle = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    
    setSelectedTags(newTags);
    onFiltersChange({
      ...filters,
      tags: newTags
    });
  };

  // アクティブなフィルター数を計算
  const activeFilterCount = [
    filters.status !== 'all',
    (filters.tags || []).length > 0,
    filters.dateRange !== 'all',
    filters.starred,
    filters.searchQuery
  ].filter(Boolean).length;

  return (
    <div className={cn('space-y-4', className)}>
      {/* メインコントロールバー */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* 検索入力 */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
          <Input
            type="text"
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            placeholder="レポートを検索..."
            className="pl-10 pr-10"
          />
          {localSearchQuery && (
            <button
              onClick={() => setLocalSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* フィルターコントロール */}
        <div className="flex items-center gap-2">
          {/* ステータスフィルター */}
          <Select
            value={filters.status || 'all'}
            onValueChange={(value) => onFiltersChange({ ...filters, status: value as any })}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="ステータス" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              <SelectItem value="completed">完了</SelectItem>
              <SelectItem value="processing">処理中</SelectItem>
              <SelectItem value="failed">エラー</SelectItem>
              <SelectItem value="draft">下書き</SelectItem>
            </SelectContent>
          </Select>

          {/* 期間フィルター */}
          <Select
            value={filters.dateRange || 'all'}
            onValueChange={(value) => onFiltersChange({ ...filters, dateRange: value as any })}
          >
            <SelectTrigger className="w-[120px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue placeholder="期間" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              <SelectItem value="today">今日</SelectItem>
              <SelectItem value="week">今週</SelectItem>
              <SelectItem value="month">今月</SelectItem>
              <SelectItem value="year">今年</SelectItem>
            </SelectContent>
          </Select>

          {/* ソート */}
          <Select
            value={filters.sortBy || 'date-desc'}
            onValueChange={(value) => onFiltersChange({ ...filters, sortBy: value as any })}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="並び替え" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">新しい順</SelectItem>
              <SelectItem value="date-asc">古い順</SelectItem>
              <SelectItem value="name-asc">名前順 (A-Z)</SelectItem>
              <SelectItem value="name-desc">名前順 (Z-A)</SelectItem>
              <SelectItem value="status">ステータス順</SelectItem>
            </SelectContent>
          </Select>

          {/* 詳細フィルター */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="relative">
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                詳細フィルター
                {activeFilterCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center"
                  >
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">詳細フィルター</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResetFilters}
                    className="h-8 px-2"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    リセット
                  </Button>
                </div>
                
                <Separator />

                {/* お気に入りフィルター */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="starred"
                    checked={filters.starred}
                    onCheckedChange={(checked) => 
                      onFiltersChange({ ...filters, starred: checked as boolean })
                    }
                  />
                  <Label htmlFor="starred" className="flex items-center gap-2 cursor-pointer">
                    <Star className="w-4 h-4" />
                    お気に入りのみ表示
                  </Label>
                </div>

                <Separator />

                {/* タグフィルター */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    タグで絞り込み
                  </Label>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {availableTags.map(tag => (
                      <Badge
                        key={tag}
                        variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                        className="cursor-pointer hover:bg-primary/10"
                        onClick={() => handleTagToggle(tag)}
                      >
                        {selectedTags.includes(tag) && (
                          <X className="w-3 h-3 mr-1" />
                        )}
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  {selectedTags.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedTags([]);
                        onFiltersChange({ ...filters, tags: [] });
                      }}
                      className="w-full"
                    >
                      タグをクリア
                    </Button>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* リセットボタン */}
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleResetFilters}
              title="フィルターをリセット"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* アクティブフィルター表示 */}
      <AnimatePresence>
        {(selectedTags.length > 0 || filters.starred) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 flex-wrap"
          >
            <span className="text-sm text-muted-foreground">適用中:</span>
            
            {filters.starred && (
              <Badge variant="secondary" className="gap-1">
                <Star className="w-3 h-3" />
                お気に入り
                <button
                  onClick={() => onFiltersChange({ ...filters, starred: false })}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            
            {selectedTags.map(tag => (
              <Badge key={tag} variant="secondary" className="gap-1">
                #{tag}
                <button
                  onClick={() => handleTagToggle(tag)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 検索結果数 */}
      {totalResults !== undefined && (
        <div className="text-sm text-muted-foreground">
          {totalResults > 0 ? (
            <>
              <span className="font-medium">{totalResults}</span> 件のレポートが見つかりました
            </>
          ) : (
            '条件に一致するレポートが見つかりません'
          )}
        </div>
      )}
    </div>
  );
};

// デバウンスフック
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default SearchFilter;