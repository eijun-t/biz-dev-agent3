'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Monitor, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

type Theme = 'light' | 'dark' | 'system';
type ColorScheme = 'purple' | 'blue' | 'green' | 'orange' | 'pink';

interface DarkModeToggleProps {
  showLabel?: boolean;
  variant?: 'default' | 'compact' | 'expanded';
  allowColorScheme?: boolean;
}

export const DarkModeToggle: React.FC<DarkModeToggleProps> = ({
  showLabel = false,
  variant = 'default',
  allowColorScheme = false
}) => {
  const [theme, setTheme] = useState<Theme>('system');
  const [colorScheme, setColorScheme] = useState<ColorScheme>('purple');
  const [mounted, setMounted] = useState(false);
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light');

  // マウント後のみレンダリング（SSRとのミスマッチ回避）
  useEffect(() => {
    setMounted(true);
    
    // ローカルストレージから設定読み込み
    const savedTheme = localStorage.getItem('theme') as Theme || 'system';
    const savedColorScheme = localStorage.getItem('colorScheme') as ColorScheme || 'purple';
    setTheme(savedTheme);
    setColorScheme(savedColorScheme);

    // システムテーマ検出
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // テーマ適用
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    const effectiveTheme = theme === 'system' ? systemTheme : theme;
    
    // ダークモードクラス適用
    if (effectiveTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // カラースキーム適用
    root.setAttribute('data-color-scheme', colorScheme);
    
    // ローカルストレージに保存
    localStorage.setItem('theme', theme);
    localStorage.setItem('colorScheme', colorScheme);
  }, [theme, colorScheme, systemTheme, mounted]);

  if (!mounted) {
    return null;
  }

  const currentTheme = theme === 'system' ? systemTheme : theme;

  // コンパクトバージョン（アイコンのみ）
  if (variant === 'compact') {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
          setTheme(nextTheme);
        }}
        className="relative w-9 h-9"
      >
        <AnimatePresence mode="wait">
          {currentTheme === 'light' ? (
            <motion.div
              key="sun"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Sun className="h-5 w-5" />
            </motion.div>
          ) : (
            <motion.div
              key="moon"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Moon className="h-5 w-5" />
            </motion.div>
          )}
        </AnimatePresence>
      </Button>
    );
  }

  // 拡張バージョン（ドロップダウンメニュー）
  if (variant === 'expanded') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            {currentTheme === 'light' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
            {showLabel && (
              <span>
                {theme === 'light' && 'ライトモード'}
                {theme === 'dark' && 'ダークモード'}
                {theme === 'system' && 'システム設定'}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>テーマ設定</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* テーマ選択 */}
          <DropdownMenuItem
            onClick={() => setTheme('light')}
            className={cn(
              'gap-2',
              theme === 'light' && 'bg-accent'
            )}
          >
            <Sun className="h-4 w-4" />
            ライトモード
            {theme === 'light' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="ml-auto"
              >
                ✓
              </motion.div>
            )}
          </DropdownMenuItem>
          
          <DropdownMenuItem
            onClick={() => setTheme('dark')}
            className={cn(
              'gap-2',
              theme === 'dark' && 'bg-accent'
            )}
          >
            <Moon className="h-4 w-4" />
            ダークモード
            {theme === 'dark' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="ml-auto"
              >
                ✓
              </motion.div>
            )}
          </DropdownMenuItem>
          
          <DropdownMenuItem
            onClick={() => setTheme('system')}
            className={cn(
              'gap-2',
              theme === 'system' && 'bg-accent'
            )}
          >
            <Monitor className="h-4 w-4" />
            システム設定
            {theme === 'system' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="ml-auto"
              >
                ✓
              </motion.div>
            )}
          </DropdownMenuItem>

          {/* カラースキーム選択 */}
          {allowColorScheme && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>カラーテーマ</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <div className="p-2">
                <div className="grid grid-cols-5 gap-1">
                  {(['purple', 'blue', 'green', 'orange', 'pink'] as ColorScheme[]).map((color) => (
                    <button
                      key={color}
                      onClick={() => setColorScheme(color)}
                      className={cn(
                        'w-8 h-8 rounded-md transition-all',
                        color === 'purple' && 'bg-purple-500',
                        color === 'blue' && 'bg-blue-500',
                        color === 'green' && 'bg-green-500',
                        color === 'orange' && 'bg-orange-500',
                        color === 'pink' && 'bg-pink-500',
                        colorScheme === color && 'ring-2 ring-offset-2 ring-offset-background'
                      )}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // デフォルトバージョン（トグルボタン）
  return (
    <div className="flex items-center gap-2">
      {showLabel && (
        <span className="text-sm text-muted-foreground">
          テーマ
        </span>
      )}
      <div className="flex items-center p-1 bg-muted rounded-lg">
        <Button
          variant={theme === 'light' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setTheme('light')}
          className="h-8 px-3"
        >
          <Sun className="h-4 w-4" />
        </Button>
        <Button
          variant={theme === 'dark' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setTheme('dark')}
          className="h-8 px-3"
        >
          <Moon className="h-4 w-4" />
        </Button>
        <Button
          variant={theme === 'system' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setTheme('system')}
          className="h-8 px-3"
        >
          <Monitor className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default DarkModeToggle;