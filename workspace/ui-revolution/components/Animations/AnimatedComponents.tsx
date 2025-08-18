/**
 * Animated Components - Framer Motion統合
 * 60fps GPU最適化アニメーション
 */

import { motion, AnimatePresence, Variants } from 'framer-motion'
import { ReactNode } from 'react'

// アニメーション定義
const animations = {
  // フェードイン
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3 }
  },
  
  // スライドイン
  slideIn: {
    initial: { x: 100, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -100, opacity: 0 },
    transition: { type: 'spring', stiffness: 300, damping: 30 }
  },
  
  // スケールイン
  scaleIn: {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.8, opacity: 0 },
    transition: { duration: 0.2 }
  },
  
  // バウンス
  bounce: {
    animate: {
      y: [0, -10, 0],
      transition: {
        duration: 0.6,
        repeat: Infinity,
        repeatDelay: 3
      }
    }
  }
}

// ステガーアニメーション
const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

// アニメーションカード
export const AnimatedCard = ({ 
  children, 
  delay = 0,
  className = ''
}: { 
  children: ReactNode
  delay?: number
  className?: string
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ 
      duration: 0.5, 
      delay,
      type: 'spring',
      stiffness: 100
    }}
    whileHover={{ 
      scale: 1.02,
      boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
    }}
    whileTap={{ scale: 0.98 }}
    className={`transform-gpu ${className}`}
  >
    {children}
  </motion.div>
)

// プログレスバーアニメーション
export const AnimatedProgress = ({ 
  progress, 
  color = 'bg-blue-500' 
}: { 
  progress: number
  color?: string
}) => (
  <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
    <motion.div
      className={`h-full ${color}`}
      initial={{ width: 0 }}
      animate={{ width: `${progress}%` }}
      transition={{ 
        duration: 0.5,
        ease: 'easeOut'
      }}
    />
  </div>
)

// ローディングスピナー
export const AnimatedSpinner = ({ size = 40 }: { size?: number }) => (
  <motion.div
    className="inline-block"
    animate={{ rotate: 360 }}
    transition={{
      duration: 1,
      repeat: Infinity,
      ease: 'linear'
    }}
  >
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className="text-blue-500"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="60"
        strokeDashoffset="20"
      />
    </svg>
  </motion.div>
)

// パルスアニメーション
export const AnimatedPulse = ({ children }: { children: ReactNode }) => (
  <motion.div
    animate={{
      scale: [1, 1.05, 1],
      opacity: [1, 0.8, 1]
    }}
    transition={{
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut'
    }}
    className="transform-gpu"
  >
    {children}
  </motion.div>
)

// スケルトンローダー
export const AnimatedSkeleton = ({ 
  width = '100%', 
  height = '20px',
  className = ''
}: { 
  width?: string
  height?: string
  className?: string
}) => (
  <motion.div
    className={`bg-gray-200 dark:bg-gray-700 rounded ${className}`}
    style={{ width, height }}
    animate={{
      opacity: [0.5, 1, 0.5]
    }}
    transition={{
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut'
    }}
  />
)

// ページトランジション
export const PageTransition = ({ children }: { children: ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 20 }}
    transition={{ 
      duration: 0.3,
      type: 'spring',
      stiffness: 200,
      damping: 20
    }}
    className="transform-gpu"
  >
    {children}
  </motion.div>
)

// モーダルアニメーション
export const AnimatedModal = ({ 
  isOpen, 
  onClose,
  children 
}: { 
  isOpen: boolean
  onClose: () => void
  children: ReactNode
}) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 z-40"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ 
            type: 'spring',
            stiffness: 300,
            damping: 25
          }}
          className="fixed inset-0 flex items-center justify-center z-50 p-4 transform-gpu"
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            {children}
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
)

// リストアニメーション
export const AnimatedList = ({ 
  items,
  renderItem
}: { 
  items: any[]
  renderItem: (item: any, index: number) => ReactNode
}) => (
  <motion.div
    variants={staggerContainer}
    initial="hidden"
    animate="show"
    className="space-y-2"
  >
    {items.map((item, index) => (
      <motion.div
        key={index}
        variants={staggerItem}
        className="transform-gpu"
      >
        {renderItem(item, index)}
      </motion.div>
    ))}
  </motion.div>
)

// フローティングアクションボタン
export const AnimatedFAB = ({ 
  onClick,
  icon
}: { 
  onClick: () => void
  icon: ReactNode
}) => (
  <motion.button
    onClick={onClick}
    className="fixed bottom-6 right-6 w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center z-30 transform-gpu"
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.9 }}
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    transition={{ 
      type: 'spring',
      stiffness: 260,
      damping: 20
    }}
  >
    {icon}
  </motion.button>
)

// 数値カウントアップ
export const AnimatedCounter = ({ 
  from = 0,
  to,
  duration = 2,
  suffix = ''
}: { 
  from?: number
  to: number
  duration?: number
  suffix?: string
}) => {
  const [count, setCount] = useState(from)
  
  useEffect(() => {
    const controls = animate(from, to, {
      duration,
      onUpdate(value) {
        setCount(Math.floor(value))
      }
    })
    
    return controls.stop
  }, [from, to, duration])
  
  return <span>{count}{suffix}</span>
}

// GPU最適化グリッド
export const AnimatedGrid = ({ 
  children,
  columns = 3
}: { 
  children: ReactNode[]
  columns?: number
}) => (
  <motion.div
    className={`grid grid-cols-${columns} gap-4`}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5 }}
  >
    {React.Children.map(children, (child, index) => (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          delay: index * 0.1,
          duration: 0.5,
          type: 'spring',
          stiffness: 100
        }}
        className="transform-gpu"
      >
        {child}
      </motion.div>
    ))}
  </motion.div>
)

import React, { useEffect } from 'react'
import { animate } from 'framer-motion'