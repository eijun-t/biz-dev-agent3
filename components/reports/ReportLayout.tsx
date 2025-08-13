'use client'

import React, { useState } from 'react'
import { HTMLReport } from '@/lib/types/writer'
import TabNavigation from './TabNavigation'
import SummaryTab from './tabs/SummaryTab'
import BusinessModelTab from './tabs/BusinessModelTab'
import MarketAnalysisTab from './tabs/MarketAnalysisTab'
import SynergyTab from './tabs/SynergyTab'
import ValidationPlanTab from './tabs/ValidationPlanTab'

interface ReportLayoutProps {
  report: HTMLReport
  className?: string
}

export type TabType = 'summary' | 'business-model' | 'market-analysis' | 'synergy' | 'validation-plan'

const ReportLayout: React.FC<ReportLayoutProps> = ({ report, className = '' }) => {
  const [activeTab, setActiveTab] = useState<TabType>('summary')

  const renderTabContent = () => {
    switch (activeTab) {
      case 'summary':
        return <SummaryTab summary={report.summary} />
      case 'business-model':
        return <BusinessModelTab businessModel={report.businessModel} />
      case 'market-analysis':
        return <MarketAnalysisTab marketAnalysis={report.marketAnalysis} />
      case 'synergy':
        return <SynergyTab synergy={report.synergy} />
      case 'validation-plan':
        return <ValidationPlanTab validationPlan={report.validationPlan} />
      default:
        return <SummaryTab summary={report.summary} />
    }
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600">
            <h1 className="text-2xl font-bold text-white">
              {report.metadata.title}
            </h1>
            <p className="text-blue-100 mt-1">
              生成日: {new Date(report.metadata.generatedAt).toLocaleDateString('ja-JP')}
            </p>
          </div>

          <TabNavigation
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          <div className="p-6">
            <div className="animate-fadeIn">
              {renderTabContent()}
            </div>
          </div>

          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
            <div className="flex justify-between items-center text-sm text-gray-600">
              <div>
                <span className="font-medium">セッションID:</span> {report.metadata.sessionId}
              </div>
              <div>
                <span className="font-medium">バージョン:</span> {report.metadata.version}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReportLayout