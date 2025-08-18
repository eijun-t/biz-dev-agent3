'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, Calendar, Tag, Star, TrendingUp,
  ChevronDown, X, SlidersHorizontal, Hash, Clock,
  Target, Zap, RefreshCw, Save, Download
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface AdvancedFilter {
  // 基本フィルター
  searchQuery: string;
  status: string[];
  tags: string[];
  starred: boolean;
  
  // 日付フィルター
  dateRange: 'all' | 'today' | 'week' | 'month' | 'year' | 'custom';
  dateFrom?: Date;
  dateTo?: Date;
  
  // メトリクスフィルター
  marketSizeMin?: number;
  marketSizeMax?: number;
  growthRateMin?: number;
  growthRateMax?: number;
  feasibilityMin?: number;
  feasibilityMax?: number;
  competition?: ('low' | 'medium' | 'high')[];
  
  // ソート＆表示
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  viewMode: 'grid' | 'list' | 'compact';
  itemsPerPage: number;
}

interface AdvancedSearchFilterProps {
  onFiltersChange: (filters: AdvancedFilter) => void;
  availableTags: string[];
  onSaveFilter?: (name: string, filter: AdvancedFilter) => void;
  savedFilters?: { name: string; filter: AdvancedFilter }[];
}

export const AdvancedSearchFilter: React.FC<AdvancedSearchFilterProps> = ({
  onFiltersChange,
  availableTags,
  onSaveFilter,
  savedFilters = []
}) => {
  const [filters, setFilters] = useState<AdvancedFilter>({
    searchQuery: '',
    status: [],
    tags: [],
    starred: false,
    dateRange: 'all',
    sortBy: 'date',
    sortOrder: 'desc',
    viewMode: 'grid',
    itemsPerPage: 12,
    competition: []
  });
  
  const [filterName, setFilterName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // フィルター適用
  const applyFilters = () => {
    onFiltersChange(filters);
  };

  // フィルターリセット
  const resetFilters = () => {
    const defaultFilters: AdvancedFilter = {
      searchQuery: '',
      status: [],
      tags: [],
      starred: false,
      dateRange: 'all',
      sortBy: 'date',
      sortOrder: 'desc',
      viewMode: 'grid',
      itemsPerPage: 12,
      competition: []
    };
    setFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  // 保存済みフィルター適用
  const applySavedFilter = (savedFilter: AdvancedFilter) => {
    setFilters(savedFilter);
    onFiltersChange(savedFilter);
  };

  // アクティブフィルター数計算
  const activeFilterCount = [
    filters.searchQuery,
    filters.status.length > 0,
    filters.tags.length > 0,
    filters.starred,
    filters.dateRange !== 'all',
    filters.marketSizeMin || filters.marketSizeMax,
    filters.growthRateMin || filters.growthRateMax,
    filters.feasibilityMin || filters.feasibilityMax,
    filters.competition && filters.competition.length > 0
  ].filter(Boolean).length;

  return (
    <div className="w-full">
      {/* メイン検索バー */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
          <Input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => {
              setFilters({ ...filters, searchQuery: e.target.value });
              onFiltersChange({ ...filters, searchQuery: e.target.value });
            }}
            placeholder="タイトル、テーマ、タグで検索..."
            className="pl-10"
          />
        </div>

        {/* 詳細フィルターシート */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="gap-2">
              <SlidersHorizontal size={16} />
              詳細フィルター
              {activeFilterCount > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          
          <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>詳細フィルター設定</SheetTitle>
              <SheetDescription>
                複数の条件を組み合わせて、レポートを絞り込みます
              </SheetDescription>
            </SheetHeader>

            <div className="py-6 space-y-6">
              {/* 保存済みフィルター */}
              {savedFilters.length > 0 && (
                <div>
                  <Label className="mb-3 block">保存済みフィルター</Label>
                  <div className="flex flex-wrap gap-2">
                    {savedFilters.map((saved) => (
                      <Button
                        key={saved.name}
                        variant="outline"
                        size="sm"
                        onClick={() => applySavedFilter(saved.filter)}
                      >
                        <Save className="w-3 h-3 mr-1" />
                        {saved.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* アコーディオン形式のフィルター */}
              <Accordion type="multiple" className="w-full">
                
                {/* ステータスフィルター */}
                <AccordionItem value="status">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Target size={16} />
                      ステータス
                      {filters.status.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {filters.status.length}
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {['completed', 'processing', 'failed', 'draft'].map((status) => (
                        <label key={status} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.status.includes(status)}
                            onChange={(e) => {
                              const newStatus = e.target.checked
                                ? [...filters.status, status]
                                : filters.status.filter(s => s !== status);
                              setFilters({ ...filters, status: newStatus });
                            }}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">
                            {status === 'completed' && '完了'}
                            {status === 'processing' && '処理中'}
                            {status === 'failed' && 'エラー'}
                            {status === 'draft' && '下書き'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* タグフィルター */}
                <AccordionItem value="tags">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Hash size={16} />
                      タグ
                      {filters.tags.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {filters.tags.length}
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-wrap gap-2">
                      {availableTags.map((tag) => (
                        <Badge
                          key={tag}
                          variant={filters.tags.includes(tag) ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => {
                            const newTags = filters.tags.includes(tag)
                              ? filters.tags.filter(t => t !== tag)
                              : [...filters.tags, tag];
                            setFilters({ ...filters, tags: newTags });
                          }}
                        >
                          {filters.tags.includes(tag) && <X className="w-3 h-3 mr-1" />}
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* 日付フィルター */}
                <AccordionItem value="date">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Calendar size={16} />
                      日付範囲
                      {filters.dateRange !== 'all' && (
                        <Badge variant="secondary" className="ml-2">
                          設定済み
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <RadioGroup
                      value={filters.dateRange}
                      onValueChange={(value: any) => setFilters({ ...filters, dateRange: value })}
                    >
                      <div className="space-y-2">
                        {['all', 'today', 'week', 'month', 'year', 'custom'].map((range) => (
                          <div key={range} className="flex items-center space-x-2">
                            <RadioGroupItem value={range} id={range} />
                            <Label htmlFor={range}>
                              {range === 'all' && 'すべて'}
                              {range === 'today' && '今日'}
                              {range === 'week' && '今週'}
                              {range === 'month' && '今月'}
                              {range === 'year' && '今年'}
                              {range === 'custom' && 'カスタム'}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>

                    {filters.dateRange === 'custom' && (
                      <div className="mt-4 space-y-2">
                        <div className="flex gap-2">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="justify-start text-left font-normal">
                                <Calendar className="mr-2 h-4 w-4" />
                                {filters.dateFrom ? format(filters.dateFrom, 'PPP', { locale: ja }) : '開始日'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <CalendarComponent
                                mode="single"
                                selected={filters.dateFrom}
                                onSelect={(date) => setFilters({ ...filters, dateFrom: date })}
                              />
                            </PopoverContent>
                          </Popover>
                          
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="justify-start text-left font-normal">
                                <Calendar className="mr-2 h-4 w-4" />
                                {filters.dateTo ? format(filters.dateTo, 'PPP', { locale: ja }) : '終了日'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <CalendarComponent
                                mode="single"
                                selected={filters.dateTo}
                                onSelect={(date) => setFilters({ ...filters, dateTo: date })}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>

                {/* メトリクスフィルター */}
                <AccordionItem value="metrics">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <TrendingUp size={16} />
                      メトリクス
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    {/* 実現性スコア */}
                    <div>
                      <Label className="mb-2 block">実現性スコア</Label>
                      <div className="flex items-center gap-4">
                        <span className="text-sm w-12">{filters.feasibilityMin || 0}%</span>
                        <Slider
                          value={[filters.feasibilityMin || 0, filters.feasibilityMax || 100]}
                          onValueChange={([min, max]) => {
                            setFilters({ ...filters, feasibilityMin: min, feasibilityMax: max });
                          }}
                          max={100}
                          step={5}
                          className="flex-1"
                        />
                        <span className="text-sm w-12">{filters.feasibilityMax || 100}%</span>
                      </div>
                    </div>

                    {/* 成長率 */}
                    <div>
                      <Label className="mb-2 block">成長率</Label>
                      <div className="flex items-center gap-4">
                        <span className="text-sm w-12">{filters.growthRateMin || 0}%</span>
                        <Slider
                          value={[filters.growthRateMin || 0, filters.growthRateMax || 100]}
                          onValueChange={([min, max]) => {
                            setFilters({ ...filters, growthRateMin: min, growthRateMax: max });
                          }}
                          max={100}
                          step={5}
                          className="flex-1"
                        />
                        <span className="text-sm w-12">{filters.growthRateMax || 100}%</span>
                      </div>
                    </div>

                    {/* 競合度 */}
                    <div>
                      <Label className="mb-2 block">競合度</Label>
                      <div className="flex gap-2">
                        {['low', 'medium', 'high'].map((level) => (
                          <Badge
                            key={level}
                            variant={filters.competition?.includes(level as any) ? 'default' : 'outline'}
                            className="cursor-pointer"
                            onClick={() => {
                              const newCompetition = filters.competition?.includes(level as any)
                                ? filters.competition.filter(c => c !== level)
                                : [...(filters.competition || []), level as any];
                              setFilters({ ...filters, competition: newCompetition });
                            }}
                          >
                            {level === 'low' && '低'}
                            {level === 'medium' && '中'}
                            {level === 'high' && '高'}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* その他の設定 */}
                <AccordionItem value="other">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Star size={16} />
                      その他
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="starred">お気に入りのみ</Label>
                        <Switch
                          id="starred"
                          checked={filters.starred}
                          onCheckedChange={(checked) => setFilters({ ...filters, starred: checked })}
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            <SheetFooter className="flex gap-2">
              <Button variant="outline" onClick={resetFilters}>
                <RefreshCw className="w-4 h-4 mr-2" />
                リセット
              </Button>
              {onSaveFilter && (
                <Button variant="outline" onClick={() => setShowSaveDialog(true)}>
                  <Save className="w-4 h-4 mr-2" />
                  保存
                </Button>
              )}
              <Button onClick={applyFilters}>
                <Filter className="w-4 h-4 mr-2" />
                適用
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      {/* アクティブフィルター表示 */}
      <AnimatePresence>
        {activeFilterCount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 flex-wrap mb-4"
          >
            <span className="text-sm text-muted-foreground">適用中:</span>
            
            {filters.searchQuery && (
              <Badge variant="secondary">
                検索: {filters.searchQuery}
                <button
                  onClick={() => setFilters({ ...filters, searchQuery: '' })}
                  className="ml-2"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            
            {filters.status.length > 0 && (
              <Badge variant="secondary">
                ステータス: {filters.status.length}件
                <button
                  onClick={() => setFilters({ ...filters, status: [] })}
                  className="ml-2"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            
            {filters.tags.length > 0 && (
              <Badge variant="secondary">
                タグ: {filters.tags.length}件
                <button
                  onClick={() => setFilters({ ...filters, tags: [] })}
                  className="ml-2"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            
            {filters.dateRange !== 'all' && (
              <Badge variant="secondary">
                期間: {filters.dateRange}
                <button
                  onClick={() => setFilters({ ...filters, dateRange: 'all' })}
                  className="ml-2"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-6"
            >
              すべてクリア
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdvancedSearchFilter;