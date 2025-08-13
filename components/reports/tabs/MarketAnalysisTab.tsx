'use client'

import React from 'react'
import { MarketAnalysis } from '@/lib/types/writer'

interface MarketAnalysisTabProps {
  marketAnalysis: MarketAnalysis
}

const MarketAnalysisTab: React.FC<MarketAnalysisTabProps> = ({ marketAnalysis }) => {
  const formatPercentage = (value: number) => `${value}%`
  
  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">市場分析</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">TAM</h3>
              <span className="text-2xl">🌍</span>
            </div>
            <div className="text-3xl font-bold mb-2">
              {marketAnalysis.marketSize.tam}
            </div>
            <div className="text-blue-100 text-sm">
              Total Addressable Market
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">PAM</h3>
              <span className="text-2xl">🎯</span>
            </div>
            <div className="text-3xl font-bold mb-2">
              {marketAnalysis.marketSize.pam}
            </div>
            <div className="text-green-100 text-sm">
              Product Addressable Market
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">SAM</h3>
              <span className="text-2xl">📊</span>
            </div>
            <div className="text-3xl font-bold mb-2">
              {marketAnalysis.marketSize.sam}
            </div>
            <div className="text-purple-100 text-sm">
              Serviceable Available Market
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">成長率予測</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">年間成長率 (CAGR)</span>
                <span className="text-sm font-semibold text-gray-900">
                  {formatPercentage(marketAnalysis.growthRate.cagr)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(marketAnalysis.growthRate.cagr, 100)}%` }}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {formatPercentage(marketAnalysis.growthRate.year1)}
                </div>
                <div className="text-sm text-gray-600">1年目</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {formatPercentage(marketAnalysis.growthRate.year3)}
                </div>
                <div className="text-sm text-gray-600">3年目</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {formatPercentage(marketAnalysis.growthRate.year5)}
                </div>
                <div className="text-sm text-gray-600">5年目</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="mr-2">⚔️</span>
          競合分析
        </h3>
        <div className="space-y-4">
          {marketAnalysis.competitors.map((competitor, index) => (
            <div key={index} className="border-l-4 border-blue-500 bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-gray-900">{competitor.name}</h4>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                  シェア: {formatPercentage(competitor.marketShare)}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <div>
                  <span className="text-sm text-gray-600">強み:</span>
                  <p className="text-sm text-gray-700 mt-1">{competitor.strengths}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">弱み:</span>
                  <p className="text-sm text-gray-700 mt-1">{competitor.weaknesses}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="mr-2">📈</span>
          市場トレンド
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {marketAnalysis.trends.map((trend, index) => (
            <div key={index} className="flex items-start space-x-3">
              <span className="text-green-500 mt-1">✓</span>
              <p className="text-gray-700">{trend}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default MarketAnalysisTab