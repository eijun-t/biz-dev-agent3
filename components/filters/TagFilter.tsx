'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hash, X, Check, ChevronDown, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface TagFilterProps {
  availableTags: string[];
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  maxTags?: number;
  className?: string;
}

export const TagFilter: React.FC<TagFilterProps> = ({
  availableTags,
  selectedTags,
  onTagsChange,
  maxTags = 10,
  className
}) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // タグの追加/削除
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter(t => t !== tag));
    } else if (selectedTags.length < maxTags) {
      onTagsChange([...selectedTags, tag]);
    }
  };

  // タグの削除
  const removeTag = (tag: string) => {
    onTagsChange(selectedTags.filter(t => t !== tag));
  };

  // 全タグクリア
  const clearAllTags = () => {
    onTagsChange([]);
  };

  // 検索フィルタリング
  const filteredTags = useMemo(() => {
    if (!searchQuery) return availableTags;
    return availableTags.filter(tag =>
      tag.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [availableTags, searchQuery]);

  // タグの色を生成
  const getTagColor = (tag: string) => {
    const colors = [
      'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400',
      'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400',
    ];
    const hash = tag.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* タグ選択ボタン */}
      <div className="flex items-center gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="justify-between"
            >
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4" />
                <span>タグを選択</span>
                {selectedTags.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {selectedTags.length}
                  </Badge>
                )}
              </div>
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0">
            <Command>
              <CommandInput 
                placeholder="タグを検索..." 
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
              <CommandEmpty>タグが見つかりません</CommandEmpty>
              <ScrollArea className="h-[300px]">
                <CommandGroup>
                  {filteredTags.map((tag) => (
                    <CommandItem
                      key={tag}
                      onSelect={() => {
                        toggleTag(tag);
                      }}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <Hash className="h-3 w-3" />
                          <span>{tag}</span>
                        </div>
                        {selectedTags.includes(tag) && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </ScrollArea>
              
              {/* アクション */}
              <div className="border-t p-2 flex justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllTags}
                  disabled={selectedTags.length === 0}
                >
                  すべてクリア
                </Button>
                <Button
                  size="sm"
                  onClick={() => setOpen(false)}
                >
                  完了
                </Button>
              </div>
            </Command>
          </PopoverContent>
        </Popover>

        {/* クイックアクション */}
        {selectedTags.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllTags}
            className="h-8"
          >
            <X className="h-3 w-3 mr-1" />
            クリア
          </Button>
        )}
      </div>

      {/* 選択されたタグの表示 */}
      <AnimatePresence>
        {selectedTags.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2"
          >
            {selectedTags.map((tag, index) => (
              <motion.div
                key={tag}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: index * 0.05 }}
              >
                <Badge
                  variant="secondary"
                  className={cn(
                    'gap-1 pr-1 hover:bg-destructive/10 transition-colors',
                    getTagColor(tag)
                  )}
                >
                  <Hash className="h-3 w-3" />
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* タグ統計 */}
      {selectedTags.length > 0 && (
        <div className="text-xs text-muted-foreground">
          {selectedTags.length}個のタグを選択中
          {maxTags && ` (最大${maxTags}個)`}
        </div>
      )}
    </div>
  );
};

export default TagFilter;