'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Heart, Star, Bookmark, Share2, Copy, Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

// リップルエフェクト
export const RippleButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}> = ({ children, onClick, className }) => {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();

    setRipples(prev => [...prev, { x, y, id }]);
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id));
    }, 600);

    onClick?.();
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'relative overflow-hidden px-6 py-3 rounded-lg',
        'bg-primary text-primary-foreground',
        'transition-all duration-200',
        className
      )}
    >
      {children}
      <AnimatePresence>
        {ripples.map(ripple => (
          <motion.span
            key={ripple.id}
            className="absolute bg-white/30 rounded-full pointer-events-none"
            style={{
              left: ripple.x,
              top: ripple.y,
              transform: 'translate(-50%, -50%)',
            }}
            initial={{ width: 0, height: 0, opacity: 1 }}
            animate={{ width: 300, height: 300, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>
    </button>
  );
};

// いいねボタン
export const LikeButton: React.FC<{
  initialLiked?: boolean;
  onLike?: (liked: boolean) => void;
}> = ({ initialLiked = false, onLike }) => {
  const [liked, setLiked] = useState(initialLiked);
  const controls = useAnimation();

  const handleLike = async () => {
    const newLiked = !liked;
    setLiked(newLiked);
    onLike?.(newLiked);

    if (newLiked) {
      // ハートアニメーション
      await controls.start({
        scale: [1, 1.2, 0.9, 1.1, 1],
        transition: { duration: 0.4 }
      });

      // パーティクルエフェクト
      confetti({
        particleCount: 30,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#ff6b6b', '#ff8787', '#ffa8a8']
      });
    }
  };

  return (
    <motion.button
      onClick={handleLike}
      animate={controls}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="p-2 rounded-full hover:bg-accent transition-colors"
      aria-label={liked ? 'いいねを取り消す' : 'いいねする'}
      aria-pressed={liked}
    >
      <motion.div
        animate={{ 
          rotate: liked ? [0, -10, 10, -10, 0] : 0,
        }}
        transition={{ duration: 0.4 }}
      >
        <Heart
          className={cn(
            'h-5 w-5 transition-colors',
            liked ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
          )}
        />
      </motion.div>
    </motion.button>
  );
};

// スターレーティング
export const StarRating: React.FC<{
  rating: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
}> = ({ rating, onChange, readonly = false }) => {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="flex gap-1" role="group" aria-label="評価">
      {[1, 2, 3, 4, 5].map((star) => (
        <motion.button
          key={star}
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && setHoverRating(star)}
          onMouseLeave={() => !readonly && setHoverRating(0)}
          disabled={readonly}
          whileHover={!readonly ? { scale: 1.2 } : undefined}
          whileTap={!readonly ? { scale: 0.9 } : undefined}
          animate={{
            scale: (hoverRating || rating) >= star ? [1, 1.2, 1] : 1,
            rotate: (hoverRating || rating) >= star ? [0, 10, -10, 0] : 0
          }}
          transition={{ duration: 0.2 }}
          className={cn(
            'p-1 transition-colors',
            !readonly && 'hover:bg-accent rounded'
          )}
          aria-label={`${star}つ星`}
        >
          <Star
            className={cn(
              'h-5 w-5 transition-colors',
              (hoverRating || rating) >= star
                ? 'fill-yellow-500 text-yellow-500'
                : 'text-muted-foreground'
            )}
          />
        </motion.button>
      ))}
    </div>
  );
};

// コピーボタン
export const CopyButton: React.FC<{
  text: string;
  className?: string;
}> = ({ text, className }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.button
      onClick={handleCopy}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        'p-2 rounded-lg hover:bg-accent transition-all',
        className
      )}
      aria-label={copied ? 'コピー済み' : 'クリップボードにコピー'}
    >
      <AnimatePresence mode="wait">
        {copied ? (
          <motion.div
            key="check"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ duration: 0.2 }}
          >
            <Check className="h-4 w-4 text-green-600" />
          </motion.div>
        ) : (
          <motion.div
            key="copy"
            initial={{ scale: 0, rotate: 180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: -180 }}
            transition={{ duration: 0.2 }}
          >
            <Copy className="h-4 w-4" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

// マジックボタン（AI提案など）
export const MagicButton: React.FC<{
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}> = ({ onClick, children, className }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    setIsAnimating(true);
    onClick?.();
    
    // スパークルエフェクト
    confetti({
      particleCount: 20,
      spread: 360,
      ticks: 30,
      gravity: 0,
      decay: 0.95,
      startVelocity: 15,
      shapes: ['star'],
      colors: ['#9333ea', '#a855f7', '#c084fc', '#e9d5ff']
    });

    setTimeout(() => setIsAnimating(false), 1000);
  };

  return (
    <motion.button
      onClick={handleClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        'relative px-4 py-2 rounded-lg',
        'bg-gradient-to-r from-purple-600 to-pink-600',
        'text-white font-medium',
        'shadow-lg hover:shadow-xl transition-all',
        className
      )}
    >
      <motion.div
        animate={isAnimating ? {
          rotate: [0, 360],
          scale: [1, 1.2, 1]
        } : {}}
        transition={{ duration: 0.5 }}
        className="absolute -top-1 -right-1"
      >
        <Sparkles className="h-4 w-4 text-yellow-400" />
      </motion.div>
      
      <motion.span
        animate={isAnimating ? {
          opacity: [1, 0.5, 1],
          scale: [1, 1.05, 1]
        } : {}}
        transition={{ duration: 0.5 }}
      >
        {children}
      </motion.span>

      {/* グローエフェクト */}
      <motion.div
        className="absolute inset-0 rounded-lg opacity-0"
        animate={isAnimating ? {
          opacity: [0, 0.5, 0],
          scale: [1, 1.5, 1.8]
        } : {}}
        transition={{ duration: 0.6 }}
        style={{
          background: 'radial-gradient(circle, rgba(168,85,247,0.4) 0%, transparent 70%)',
          pointerEvents: 'none'
        }}
      />
    </motion.button>
  );
};

// プログレスボタン
export const ProgressButton: React.FC<{
  onClick?: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
}> = ({ onClick, children, className }) => {
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setProgress(0);

    // プログレスアニメーション
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 100);

    try {
      await onClick?.();
      setProgress(100);
      
      setTimeout(() => {
        setProgress(0);
        setIsLoading(false);
      }, 500);
    } catch (error) {
      clearInterval(interval);
      setProgress(0);
      setIsLoading(false);
    }
  };

  return (
    <motion.button
      onClick={handleClick}
      disabled={isLoading}
      whileHover={!isLoading ? { scale: 1.02 } : undefined}
      whileTap={!isLoading ? { scale: 0.98 } : undefined}
      className={cn(
        'relative px-6 py-3 rounded-lg overflow-hidden',
        'bg-primary text-primary-foreground',
        'disabled:opacity-70 disabled:cursor-not-allowed',
        className
      )}
    >
      {/* プログレスバー */}
      <motion.div
        className="absolute inset-0 bg-white/20"
        initial={{ x: '-100%' }}
        animate={{ x: `${progress - 100}%` }}
        transition={{ duration: 0.2 }}
      />
      
      <span className="relative z-10">
        {isLoading ? `${progress}%` : children}
      </span>
    </motion.button>
  );
};

export default {
  RippleButton,
  LikeButton,
  StarRating,
  CopyButton,
  MagicButton,
  ProgressButton
};