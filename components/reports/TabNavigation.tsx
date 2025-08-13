'use client'

import React from 'react'
import { TabType } from './ReportLayout'

interface TabNavigationProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

interface TabItem {
  id: TabType
  label: string
  icon: string
}

const tabs: TabItem[] = [
  { id: 'summary', label: 'サマリー', icon: '📊' },
  { id: 'business-model', label: 'ビジネスモデル', icon: '💡' },
  { id: 'market-analysis', label: '市場分析', icon: '📈' },
  { id: 'synergy', label: 'シナジー評価', icon: '🤝' },
  { id: 'validation-plan', label: '検証計画', icon: '✅' },
]

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="border-b border-gray-200 bg-white">
      <nav className="-mb-px flex overflow-x-auto" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              group relative min-w-0 flex-1 overflow-hidden py-4 px-4 text-sm font-medium text-center 
              hover:text-gray-700 focus:z-10 focus:outline-none transition-all duration-100
              ${activeTab === tab.id
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 border-b-2 border-transparent hover:border-gray-300'
              }
            `}
            aria-current={activeTab === tab.id ? 'page' : undefined}
          >
            <span className="flex items-center justify-center">
              <span className="mr-2">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.slice(0, 3)}</span>
            </span>
            
            {activeTab === tab.id && (
              <span
                className="absolute inset-x-0 bottom-0 h-0.5 bg-blue-600 animate-slideIn"
                aria-hidden="true"
              />
            )}
          </button>
        ))}
      </nav>
    </div>
  )
}

export default TabNavigation