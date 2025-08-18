/**
 * Responsive Layout Components
 * タブレット最適化・ブレークポイント管理
 */

import { ReactNode, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ブレークポイント定義
export const breakpoints = {
  xs: 0,     // モバイル
  sm: 640,   // 大型モバイル
  md: 768,   // タブレット
  lg: 1024,  // デスクトップ
  xl: 1280,  // 大型デスクトップ
  '2xl': 1536 // 超大型デスクトップ
} as const

// デバイスタイプ
export type DeviceType = 'mobile' | 'tablet' | 'desktop'

// レスポンシブフック
export const useResponsive = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768
  })
  
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop')
  
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      
      setWindowSize({ width, height })
      
      if (width < breakpoints.md) {
        setDeviceType('mobile')
      } else if (width < breakpoints.lg) {
        setDeviceType('tablet')
      } else {
        setDeviceType('desktop')
      }
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  const isMobile = deviceType === 'mobile'
  const isTablet = deviceType === 'tablet'
  const isDesktop = deviceType === 'desktop'
  
  return {
    windowSize,
    deviceType,
    isMobile,
    isTablet,
    isDesktop,
    breakpoints
  }
}

// レスポンシブコンテナ
export const ResponsiveContainer = ({ 
  children,
  className = ''
}: { 
  children: ReactNode
  className?: string
}) => {
  const { deviceType } = useResponsive()
  
  const containerClass = {
    mobile: 'px-4 max-w-full',
    tablet: 'px-6 max-w-3xl mx-auto',
    desktop: 'px-8 max-w-7xl mx-auto'
  }[deviceType]
  
  return (
    <div className={`${containerClass} ${className}`}>
      {children}
    </div>
  )
}

// レスポンシブグリッド
export const ResponsiveGrid = ({ 
  children,
  cols = { mobile: 1, tablet: 2, desktop: 3 }
}: { 
  children: ReactNode
  cols?: { mobile: number; tablet: number; desktop: number }
}) => {
  const { deviceType } = useResponsive()
  const columns = cols[deviceType]
  
  return (
    <div 
      className={`
        grid gap-4
        grid-cols-${deviceType === 'mobile' ? '1' : ''}
        md:grid-cols-${deviceType === 'tablet' ? '2' : ''}
        lg:grid-cols-${deviceType === 'desktop' ? columns : ''}
      `}
    >
      {children}
    </div>
  )
}

// タブレット最適化サイドバー
export const ResponsiveSidebar = ({ 
  sidebar,
  content,
  sidebarWidth = { mobile: 'full', tablet: '1/3', desktop: '1/4' }
}: { 
  sidebar: ReactNode
  content: ReactNode
  sidebarWidth?: { mobile: string; tablet: string; desktop: string }
}) => {
  const { deviceType, isMobile } = useResponsive()
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile)
  
  useEffect(() => {
    setIsSidebarOpen(!isMobile)
  }, [isMobile])
  
  return (
    <div className="flex h-full">
      {/* モバイルメニューボタン */}
      {isMobile && (
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg lg:hidden"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d={isSidebarOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} 
            />
          </svg>
        </button>
      )}
      
      {/* サイドバー */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: isMobile ? -300 : 0, opacity: isMobile ? 0 : 1 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: isMobile ? -300 : 0, opacity: isMobile ? 0 : 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={`
              ${isMobile ? 'fixed inset-y-0 left-0 z-40' : 'relative'}
              ${isMobile ? 'w-64' : ''}
              ${deviceType === 'tablet' ? 'w-80' : ''}
              ${deviceType === 'desktop' ? 'w-96' : ''}
              bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
              overflow-y-auto
            `}
          >
            {sidebar}
          </motion.aside>
        )}
      </AnimatePresence>
      
      {/* オーバーレイ */}
      {isMobile && isSidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-30"
        />
      )}
      
      {/* メインコンテンツ */}
      <main className="flex-1 overflow-y-auto">
        {content}
      </main>
    </div>
  )
}

// レスポンシブカード
export const ResponsiveCard = ({ 
  children,
  className = ''
}: { 
  children: ReactNode
  className?: string
}) => {
  const { deviceType } = useResponsive()
  
  const paddingClass = {
    mobile: 'p-4',
    tablet: 'p-6',
    desktop: 'p-8'
  }[deviceType]
  
  return (
    <motion.div
      className={`
        bg-white dark:bg-gray-800 rounded-lg shadow-md
        ${paddingClass} ${className}
      `}
      whileHover={{ scale: deviceType === 'desktop' ? 1.02 : 1 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      {children}
    </motion.div>
  )
}

// タブレット専用ナビゲーション
export const TabletNavigation = ({ 
  items,
  activeItem,
  onItemClick
}: {
  items: { id: string; label: string; icon?: ReactNode }[]
  activeItem: string
  onItemClick: (id: string) => void
}) => {
  const { isTablet } = useResponsive()
  
  if (!isTablet) return null
  
  return (
    <nav className="flex justify-around items-center p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      {items.map(item => (
        <button
          key={item.id}
          onClick={() => onItemClick(item.id)}
          className={`
            flex flex-col items-center gap-1 px-6 py-3 rounded-lg transition-all
            ${activeItem === item.id 
              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }
          `}
        >
          {item.icon && <span className="text-2xl">{item.icon}</span>}
          <span className="text-sm font-medium">{item.label}</span>
        </button>
      ))}
    </nav>
  )
}

// フレキシブルテーブル
export const ResponsiveTable = ({ 
  headers,
  rows,
  renderCell
}: {
  headers: string[]
  rows: any[]
  renderCell: (row: any, column: string, index: number) => ReactNode
}) => {
  const { deviceType } = useResponsive()
  
  if (deviceType === 'mobile') {
    // モバイル：カード形式
    return (
      <div className="space-y-4">
        {rows.map((row, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            {headers.map(header => (
              <div key={header} className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {header}
                </span>
                <span className="text-sm text-gray-900 dark:text-white">
                  {renderCell(row, header, index)}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    )
  }
  
  // タブレット・デスクトップ：テーブル形式
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {headers.map(header => (
              <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {rows.map((row, index) => (
            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
              {headers.map(header => (
                <td key={header} className="px-6 py-4 whitespace-nowrap text-sm">
                  {renderCell(row, header, index)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// アダプティブモーダル
export const ResponsiveModal = ({ 
  isOpen,
  onClose,
  title,
  children
}: {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
}) => {
  const { deviceType } = useResponsive()
  
  const modalSize = {
    mobile: 'inset-x-0 bottom-0 rounded-t-2xl',
    tablet: 'inset-4 rounded-2xl max-w-2xl mx-auto my-auto',
    desktop: 'inset-0 m-auto rounded-2xl max-w-3xl max-h-[90vh]'
  }[deviceType]
  
  return (
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
            initial={{ 
              opacity: 0,
              y: deviceType === 'mobile' ? 100 : 0,
              scale: deviceType !== 'mobile' ? 0.9 : 1
            }}
            animate={{ 
              opacity: 1,
              y: 0,
              scale: 1
            }}
            exit={{ 
              opacity: 0,
              y: deviceType === 'mobile' ? 100 : 0,
              scale: deviceType !== 'mobile' ? 0.9 : 1
            }}
            className={`fixed ${modalSize} bg-white dark:bg-gray-800 z-50 flex flex-col`}
          >
            {/* ヘッダー */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-bold">{title}</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* コンテンツ */}
            <div className="flex-1 overflow-y-auto p-4">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}