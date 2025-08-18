'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format, subDays, subMonths, subYears, startOfToday, endOfToday } from 'date-fns';
import { ja } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';

interface DateRangeFilterProps {
  onDateRangeChange: (range: DateRange | undefined) => void;
  className?: string;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  onDateRangeChange,
  className
}) => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [quickSelect, setQuickSelect] = useState<string>('all');

  // クイック選択オプション
  const quickSelectOptions = [
    { value: 'all', label: 'すべての期間' },
    { value: 'today', label: '今日' },
    { value: 'yesterday', label: '昨日' },
    { value: 'last7days', label: '過去7日間' },
    { value: 'last30days', label: '過去30日間' },
    { value: 'last3months', label: '過去3ヶ月' },
    { value: 'last6months', label: '過去6ヶ月' },
    { value: 'lastyear', label: '過去1年' },
    { value: 'custom', label: 'カスタム期間' }
  ];

  // クイック選択の処理
  const handleQuickSelect = (value: string) => {
    setQuickSelect(value);
    const today = new Date();
    let range: DateRange | undefined;

    switch (value) {
      case 'today':
        range = {
          from: startOfToday(),
          to: endOfToday()
        };
        break;
      case 'yesterday':
        range = {
          from: subDays(startOfToday(), 1),
          to: subDays(endOfToday(), 1)
        };
        break;
      case 'last7days':
        range = {
          from: subDays(today, 7),
          to: today
        };
        break;
      case 'last30days':
        range = {
          from: subDays(today, 30),
          to: today
        };
        break;
      case 'last3months':
        range = {
          from: subMonths(today, 3),
          to: today
        };
        break;
      case 'last6months':
        range = {
          from: subMonths(today, 6),
          to: today
        };
        break;
      case 'lastyear':
        range = {
          from: subYears(today, 1),
          to: today
        };
        break;
      case 'all':
        range = undefined;
        break;
      case 'custom':
        // カスタムの場合は現在の選択を維持
        range = dateRange;
        break;
    }

    setDateRange(range);
    onDateRangeChange(range);
  };

  // カスタム日付の選択
  const handleDateRangeSelect = (range: DateRange | undefined) => {
    setDateRange(range);
    setQuickSelect('custom');
    onDateRangeChange(range);
  };

  // 日付範囲の表示テキスト
  const getDateRangeText = () => {
    if (!dateRange?.from) {
      return 'すべての期間';
    }
    if (!dateRange.to) {
      return format(dateRange.from, 'PPP', { locale: ja });
    }
    return `${format(dateRange.from, 'yyyy/MM/dd')} - ${format(dateRange.to, 'yyyy/MM/dd')}`;
  };

  return (
    <div className={cn('flex flex-col sm:flex-row gap-2', className)}>
      {/* クイック選択 */}
      <Select value={quickSelect} onValueChange={handleQuickSelect}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <Calendar className="mr-2 h-4 w-4" />
          <SelectValue placeholder="期間を選択" />
        </SelectTrigger>
        <SelectContent>
          {quickSelectOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* カスタム日付選択 */}
      {quickSelect === 'custom' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'justify-start text-left font-normal',
                  !dateRange && 'text-muted-foreground'
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {getDateRangeText()}
                <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={handleDateRangeSelect}
                numberOfMonths={2}
                locale={ja}
              />
            </PopoverContent>
          </Popover>
        </motion.div>
      )}

      {/* 選択された期間の表示 */}
      {dateRange && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center text-sm text-muted-foreground"
        >
          <span className="hidden sm:inline">選択期間:</span>
          <span className="ml-1 font-medium">{getDateRangeText()}</span>
        </motion.div>
      )}
    </div>
  );
};

export default DateRangeFilter;