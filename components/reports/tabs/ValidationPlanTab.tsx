'use client'

import React from 'react'
import { ValidationPlan } from '@/lib/types/writer'

interface ValidationPlanTabProps {
  validationPlan: ValidationPlan
}

const ValidationPlanTab: React.FC<ValidationPlanTabProps> = ({ validationPlan }) => {
  const getPhaseColor = (phase: number) => {
    const colors = [
      'from-blue-500 to-blue-600',
      'from-purple-500 to-purple-600',
      'from-green-500 to-green-600'
    ]
    return colors[phase - 1] || colors[0]
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case '完了':
        return 'bg-green-100 text-green-800'
      case '進行中':
        return 'bg-yellow-100 text-yellow-800'
      case '未開始':
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">検証計画</h2>
        
        <div className="space-y-6">
          {validationPlan.phases.map((phase, index) => (
            <div key={index} className="relative">
              {index < validationPlan.phases.length - 1 && (
                <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-gray-300" />
              )}
              
              <div className="bg-gray-50 rounded-lg p-6 relative">
                <div className="flex items-start space-x-4">
                  <div className={`flex-shrink-0 w-12 h-12 bg-gradient-to-r ${getPhaseColor(phase.phase)} rounded-full flex items-center justify-center text-white font-bold text-lg`}>
                    {phase.phase}
                  </div>
                  
                  <div className="flex-grow">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {phase.name}
                      </h3>
                      <div className="flex items-center space-x-3">
                        <span className="text-sm text-gray-600">
                          期間: {phase.duration}
                        </span>
                        <span className="text-sm text-gray-600">
                          予算: {phase.budget}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 mb-4">{phase.objective}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">活動内容</h4>
                        <ul className="space-y-1">
                          {phase.activities.map((activity, actIndex) => (
                            <li key={actIndex} className="flex items-start">
                              <span className="text-blue-500 mr-2">•</span>
                              <span className="text-sm text-gray-600">{activity}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">成功指標</h4>
                        <ul className="space-y-1">
                          {phase.successCriteria.map((criteria, critIndex) => (
                            <li key={critIndex} className="flex items-start">
                              <span className="text-green-500 mr-2">✓</span>
                              <span className="text-sm text-gray-600">{criteria}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="mr-2">🎯</span>
          主要マイルストーン
        </h3>
        <div className="space-y-3">
          {validationPlan.milestones.map((milestone, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full" />
                <div>
                  <div className="font-medium text-gray-900">{milestone.name}</div>
                  <div className="text-sm text-gray-600">期限: {milestone.deadline}</div>
                </div>
              </div>
              <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusBadge(milestone.status || '未開始')}`}>
                {milestone.status || '未開始'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="mr-2">📊</span>
          KPI設定
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {validationPlan.kpis.map((kpi, index) => (
            <div key={index} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-700 mb-2">{kpi.name}</div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{kpi.target}</div>
              <div className="text-xs text-gray-600">{kpi.measurement}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ValidationPlanTab