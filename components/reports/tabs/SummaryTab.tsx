'use client'

import React from 'react'
import { ReportSummary } from '@/lib/types/writer'

interface SummaryTabProps {
  summary: ReportSummary
}

const SummaryTab: React.FC<SummaryTabProps> = ({ summary }) => {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">エグゼクティブサマリー</h2>
        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
          {summary.executive}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <span className="mr-2">🎯</span>
            ターゲット市場
          </h3>
          <p className="text-gray-700">{summary.targetMarket}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <span className="mr-2">💎</span>
            バリュープロポジション
          </h3>
          <p className="text-gray-700">{summary.valueProposition}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="mr-2">📊</span>
          主要指標
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {summary.keyMetrics.map((metric, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">{metric.label}</div>
              <div className="text-xl font-bold text-gray-900">{metric.value}</div>
              {metric.unit && (
                <div className="text-sm text-gray-500">{metric.unit}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="mr-2">💰</span>
          予想収益
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-600">初年度</span>
            <span className="text-lg font-semibold text-gray-900">
              {summary.estimatedRevenue.year1}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-600">3年目</span>
            <span className="text-lg font-semibold text-gray-900">
              {summary.estimatedRevenue.year3}
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-600">5年目</span>
            <span className="text-lg font-semibold text-green-600">
              {summary.estimatedRevenue.year5}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SummaryTab