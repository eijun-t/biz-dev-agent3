'use client';

import React, { forwardRef, ButtonHTMLAttributes } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface AccessibleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  loading?: boolean;
  hapticFeedback?: boolean;
  ariaLabel?: string;
  tooltipText?: string;
  keyboardShortcut?: string;
}

export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({
    className,
    variant = 'default',
    size = 'default',
    loading = false,
    hapticFeedback = true,
    ariaLabel,
    tooltipText,
    keyboardShortcut,
    disabled,
    children,
    onClick,
    ...props
  }, ref) => {
    // ボタンバリアントのスタイル
    const variants = {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm',
      outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm',
      ghost: 'hover:bg-accent hover:text-accent-foreground',
      link: 'text-primary underline-offset-4 hover:underline',
    };

    // サイズバリアント
    const sizes = {
      default: 'h-10 px-4 py-2',
      sm: 'h-9 rounded-md px-3',
      lg: 'h-11 rounded-md px-8',
      icon: 'h-10 w-10',
    };

    // マイクロインタラクション
    const microInteractions = {
      tap: { scale: 0.98 },
      hover: { scale: 1.02 },
      focus: { 
        boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.5)',
        transition: { duration: 0.2 }
      }
    };

    // ハプティックフィードバック（対応デバイスのみ）
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (hapticFeedback && 'vibrate' in navigator) {
        navigator.vibrate(10);
      }
      onClick?.(e);
    };

    // キーボードショートカット処理
    React.useEffect(() => {
      if (!keyboardShortcut) return;

      const handleKeyPress = (e: KeyboardEvent) => {
        const keys = keyboardShortcut.toLowerCase().split('+');
        const isMatch = keys.every(key => {
          switch (key) {
            case 'cmd':
            case 'meta':
              return e.metaKey;
            case 'ctrl':
              return e.ctrlKey;
            case 'alt':
              return e.altKey;
            case 'shift':
              return e.shiftKey;
            default:
              return e.key.toLowerCase() === key;
          }
        });

        if (isMatch) {
          e.preventDefault();
          (ref as any)?.current?.click();
        }
      };

      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }, [keyboardShortcut, ref]);

    return (
      <motion.button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          'select-none',
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled || loading}
        onClick={handleClick}
        whileTap={!disabled && !loading ? microInteractions.tap : undefined}
        whileHover={!disabled && !loading ? microInteractions.hover : undefined}
        whileFocus={microInteractions.focus}
        aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
        aria-busy={loading}
        aria-disabled={disabled || loading}
        title={tooltipText}
        data-keyboard-shortcut={keyboardShortcut}
        {...props}
      >
        {loading && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
        )}
        {children}
        {keyboardShortcut && (
          <kbd className="ml-2 hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            {keyboardShortcut.split('+').map((key, i) => (
              <span key={i}>
                {key === 'cmd' ? '⌘' : key === 'shift' ? '⇧' : key === 'alt' ? '⌥' : key.toUpperCase()}
              </span>
            ))}
          </kbd>
        )}
      </motion.button>
    );
  }
);

AccessibleButton.displayName = 'AccessibleButton';

export default AccessibleButton;