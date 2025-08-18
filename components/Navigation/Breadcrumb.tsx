/**
 * Breadcrumb Component - 階層ナビゲーション
 * クリック可能・現在位置明示
 */

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline'

export interface BreadcrumbItem {
  label: string
  href?: string
  icon?: React.ReactNode
  active?: boolean
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  separator?: React.ReactNode
  showHome?: boolean
  className?: string
  onItemClick?: (item: BreadcrumbItem, index: number) => void
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  separator = <ChevronRightIcon className="w-4 h-4 text-gray-400" />,
  showHome = true,
  className = '',
  onItemClick
}) => {
  const allItems = showHome 
    ? [{ label: 'ホーム', href: '/', icon: <HomeIcon className="w-4 h-4" /> }, ...items]
    : items

  return (
    <nav aria-label="Breadcrumb" className={`flex items-center space-x-2 ${className}`}>
      <ol className="flex items-center space-x-2">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1
          const isActive = item.active || isLast

          return (
            <motion.li
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center"
            >
              {index > 0 && <span className="mx-2">{separator}</span>}
              
              {isActive ? (
                <span className="flex items-center gap-1 text-gray-900 dark:text-white font-medium">
                  {item.icon}
                  {item.label}
                </span>
              ) : item.href ? (
                <Link
                  href={item.href}
                  onClick={(e) => {
                    if (onItemClick) {
                      e.preventDefault()
                      onItemClick(item, index)
                    }
                  }}
                  className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                >
                  {item.icon}
                  {item.label}
                </Link>
              ) : (
                <button
                  onClick={() => onItemClick?.(item, index)}
                  className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                >
                  {item.icon}
                  {item.label}
                </button>
              )}
            </motion.li>
          )
        })}
      </ol>
    </nav>
  )
}

// アニメーション付きブレッドクラム
export const AnimatedBreadcrumb: React.FC<BreadcrumbProps> = (props) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Breadcrumb {...props} />
    </motion.div>
  )
}

// コンパクトブレッドクラム（モバイル用）
export const CompactBreadcrumb: React.FC<{
  current: string
  onBack?: () => void
}> = ({ current, onBack }) => {
  return (
    <div className="flex items-center space-x-3">
      {onBack && (
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          aria-label="戻る"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}
      <span className="font-medium text-gray-900 dark:text-white">{current}</span>
    </div>
  )
}

// ドロップダウン付きブレッドクラム
export const DropdownBreadcrumb: React.FC<{
  items: BreadcrumbItem[]
  maxVisible?: number
}> = ({ items, maxVisible = 3 }) => {
  const [isOpen, setIsOpen] = React.useState(false)
  
  if (items.length <= maxVisible) {
    return <Breadcrumb items={items} />
  }

  const visibleItems = [
    items[0],
    { label: '...', active: false },
    ...items.slice(-maxVisible + 2)
  ]

  const hiddenItems = items.slice(1, -maxVisible + 2)

  return (
    <nav aria-label="Breadcrumb" className="flex items-center space-x-2">
      <ol className="flex items-center space-x-2">
        {visibleItems.map((item, index) => {
          const isEllipsis = item.label === '...'
          
          if (isEllipsis) {
            return (
              <li key={index} className="flex items-center">
                <span className="mx-2">
                  <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                </span>
                <div className="relative">
                  <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="px-2 py-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    ...
                  </button>
                  
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50"
                    >
                      {hiddenItems.map((hiddenItem, hiddenIndex) => (
                        <Link
                          key={hiddenIndex}
                          href={hiddenItem.href || '#'}
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 whitespace-nowrap"
                          onClick={() => setIsOpen(false)}
                        >
                          {hiddenItem.label}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </div>
              </li>
            )
          }

          const isLast = index === visibleItems.length - 1
          
          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <span className="mx-2">
                  <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                </span>
              )}
              {isLast ? (
                <span className="text-gray-900 dark:text-white font-medium">
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href || '#'}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                >
                  {item.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

// ブレッドクラムフック
export const useBreadcrumb = (initialItems: BreadcrumbItem[] = []) => {
  const [items, setItems] = React.useState<BreadcrumbItem[]>(initialItems)
  const [history, setHistory] = React.useState<BreadcrumbItem[][]>([initialItems])
  const [currentIndex, setCurrentIndex] = React.useState(0)

  const push = (item: BreadcrumbItem) => {
    const newItems = [...items, item]
    setItems(newItems)
    
    const newHistory = history.slice(0, currentIndex + 1)
    newHistory.push(newItems)
    setHistory(newHistory)
    setCurrentIndex(newHistory.length - 1)
  }

  const pop = () => {
    if (items.length > 0) {
      const newItems = items.slice(0, -1)
      setItems(newItems)
      
      const newHistory = history.slice(0, currentIndex + 1)
      newHistory.push(newItems)
      setHistory(newHistory)
      setCurrentIndex(newHistory.length - 1)
    }
  }

  const goTo = (index: number) => {
    const newItems = items.slice(0, index + 1)
    setItems(newItems)
    
    const newHistory = history.slice(0, currentIndex + 1)
    newHistory.push(newItems)
    setHistory(newHistory)
    setCurrentIndex(newHistory.length - 1)
  }

  const goBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setItems(history[currentIndex - 1])
    }
  }

  const goForward = () => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setItems(history[currentIndex + 1])
    }
  }

  const reset = (newItems: BreadcrumbItem[] = []) => {
    setItems(newItems)
    setHistory([newItems])
    setCurrentIndex(0)
  }

  return {
    items,
    push,
    pop,
    goTo,
    goBack,
    goForward,
    reset,
    canGoBack: currentIndex > 0,
    canGoForward: currentIndex < history.length - 1
  }
}