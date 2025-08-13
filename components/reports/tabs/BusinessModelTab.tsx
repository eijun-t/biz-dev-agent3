'use client'

import React from 'react'
import { BusinessModel } from '@/lib/types/writer'

interface BusinessModelTabProps {
  businessModel: BusinessModel
}

const BusinessModelTab: React.FC<BusinessModelTabProps> = ({ businessModel }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">ビジネスモデル詳細</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="bg-blue-50 rounded-lg p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <span className="mr-2">🎯</span>
                顧客セグメント
              </h3>
              <div className="space-y-2">
                {businessModel.customerSegments.map((segment, index) => (
                  <div key={index} className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span className="text-gray-700">{segment}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <span className="mr-2">💰</span>
                収益モデル
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-600 mb-1">主要収益源</div>
                  <div className="text-gray-900 font-medium">
                    {businessModel.revenueModel.primary}
                  </div>
                </div>
                {businessModel.revenueModel.secondary && (
                  <div>
                    <div className="text-sm text-gray-600 mb-1">副次的収益源</div>
                    <div className="text-gray-700">
                      {businessModel.revenueModel.secondary}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-sm text-gray-600 mb-1">価格戦略</div>
                  <div className="text-gray-700">
                    {businessModel.revenueModel.pricingStrategy}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-purple-50 rounded-lg p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <span className="mr-2">🔑</span>
                主要リソース
              </h3>
              <div className="space-y-2">
                {businessModel.keyResources.map((resource, index) => (
                  <div key={index} className="flex items-start">
                    <span className="text-purple-600 mr-2">•</span>
                    <span className="text-gray-700">{resource}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-orange-50 rounded-lg p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <span className="mr-2">📊</span>
                コスト構造
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-600 mb-1">固定費</div>
                  <div className="text-gray-900 font-medium">
                    {businessModel.costStructure.fixed}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">変動費</div>
                  <div className="text-gray-700">
                    {businessModel.costStructure.variable}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">損益分岐点</div>
                  <div className="text-gray-900 font-semibold">
                    {businessModel.costStructure.breakEvenPoint}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="mr-2">🚀</span>
          スケーラビリティ分析
        </h3>
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-5">
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {businessModel.scalability}
          </p>
        </div>
      </div>
    </div>
  )
}

export default BusinessModelTab