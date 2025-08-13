'use client'

import React from 'react'
import { SynergyEvaluation } from '@/lib/types/writer'

interface SynergyTabProps {
  synergy: SynergyEvaluation
}

const SynergyTab: React.FC<SynergyTabProps> = ({ synergy }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'from-green-500 to-green-600'
    if (score >= 60) return 'from-yellow-500 to-yellow-600'
    return 'from-red-500 to-red-600'
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">シナジー評価</h2>
        
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-8 mb-6">
          <div className="text-center">
            <div className="text-5xl font-bold mb-2">
              <span className={getScoreColor(synergy.overallScore)}>
                {synergy.overallScore}
              </span>
              <span className="text-2xl text-gray-600">/100</span>
            </div>
            <div className="text-lg text-gray-700">総合シナジースコア</div>
            <div className="mt-4 max-w-md mx-auto">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`bg-gradient-to-r ${getScoreBgColor(synergy.overallScore)} h-3 rounded-full transition-all duration-700`}
                  style={{ width: `${synergy.overallScore}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {Object.entries(synergy.scores).map(([key, value]) => {
            const labels: Record<string, string> = {
              technology: '技術シナジー',
              market: '市場シナジー',
              operations: 'オペレーションシナジー',
              financial: '財務シナジー',
              strategic: '戦略的シナジー'
            }
            
            return (
              <div key={key} className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    {labels[key] || key}
                  </span>
                  <span className={`text-lg font-bold ${getScoreColor(value)}`}>
                    {value}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`bg-gradient-to-r ${getScoreBgColor(value)} h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${value}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="mr-2">🚀</span>
          機会領域
        </h3>
        <div className="space-y-3">
          {synergy.opportunities.map((opportunity, index) => (
            <div key={index} className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4">
              <p className="text-gray-700">{opportunity}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="mr-2">⚠️</span>
          リスク要因
        </h3>
        <div className="space-y-3">
          {synergy.risks.map((risk, index) => (
            <div key={index} className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
              <p className="text-gray-700">{risk}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="mr-2">📋</span>
          推奨アクション
        </h3>
        <div className="space-y-3">
          {synergy.recommendations.map((recommendation, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-sm">
                  {index + 1}
                </span>
              </div>
              <p className="text-gray-700 pt-1">{recommendation}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default SynergyTab