import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import ReportLayout from '@/components/reports/ReportLayout'
import { HTMLReport } from '@/lib/types/writer'

const mockReport: HTMLReport = {
  id: 'test-report-1',
  sessionId: 'session-123',
  metadata: {
    title: 'テストビジネスレポート',
    generatedAt: new Date().toISOString(),
    version: '1.0.0',
    sessionId: 'session-123'
  },
  summary: {
    executive: 'エグゼクティブサマリーテキスト',
    targetMarket: 'ターゲット市場の説明',
    valueProposition: 'バリュープロポジション',
    estimatedRevenue: {
      year1: '¥10,000,000',
      year3: '¥50,000,000',
      year5: '¥100,000,000'
    },
    keyMetrics: [
      { label: 'ROI', value: '150%', unit: '' },
      { label: '回収期間', value: '18', unit: 'ヶ月' }
    ]
  },
  businessModel: {
    customerSegments: ['セグメント1', 'セグメント2'],
    revenueModel: {
      primary: 'サブスクリプション',
      secondary: 'コンサルティング',
      pricingStrategy: '段階的価格設定'
    },
    keyResources: ['技術チーム', '特許技術'],
    costStructure: {
      fixed: '¥5,000,000/月',
      variable: '¥1,000/ユーザー',
      breakEvenPoint: '500ユーザー'
    },
    scalability: 'スケーラビリティ分析の説明'
  },
  marketAnalysis: {
    marketSize: {
      tam: '¥1,000,000,000',
      pam: '¥500,000,000',
      sam: '¥100,000,000'
    },
    growthRate: {
      cagr: 25,
      year1: 20,
      year3: 30,
      year5: 35
    },
    competitors: [
      {
        name: '競合A',
        marketShare: 30,
        strengths: '強み',
        weaknesses: '弱み'
      }
    ],
    trends: ['トレンド1', 'トレンド2']
  },
  synergy: {
    overallScore: 85,
    scores: {
      technology: 90,
      market: 80,
      operations: 85,
      financial: 75,
      strategic: 95
    },
    opportunities: ['機会1', '機会2'],
    risks: ['リスク1'],
    recommendations: ['推奨事項1', '推奨事項2']
  },
  validationPlan: {
    phases: [
      {
        phase: 1,
        name: 'MVP開発',
        duration: '3ヶ月',
        budget: '¥5,000,000',
        objective: '基本機能の検証',
        activities: ['開発', 'テスト'],
        successCriteria: ['100ユーザー獲得']
      }
    ],
    milestones: [
      {
        name: 'MVP完成',
        deadline: '2024-03-31',
        status: '進行中'
      }
    ],
    kpis: [
      {
        name: 'ユーザー数',
        target: '1,000',
        measurement: '月次'
      }
    ]
  },
  generatedAt: new Date().toISOString()
}

describe('ReportLayout', () => {
  it('デフォルトでサマリータブがアクティブになる', () => {
    render(<ReportLayout report={mockReport} />)
    
    const summaryContent = screen.getByText('エグゼクティブサマリー')
    expect(summaryContent).toBeInTheDocument()
  })

  it('タブ切り替えが0.1秒以内で動作する', async () => {
    const { rerender } = render(<ReportLayout report={mockReport} />)
    
    const startTime = performance.now()
    
    const businessModelTab = screen.getByRole('button', { name: /ビジネスモデル/i })
    fireEvent.click(businessModelTab)
    
    await waitFor(() => {
      expect(screen.getByText('ビジネスモデル詳細')).toBeInTheDocument()
    })
    
    const endTime = performance.now()
    const duration = endTime - startTime
    
    expect(duration).toBeLessThan(100)
  })

  it('すべてのタブが正しく切り替わる', async () => {
    render(<ReportLayout report={mockReport} />)
    
    const tabs = [
      { name: /市場分析/i, content: '市場分析' },
      { name: /シナジー/i, content: 'シナジー評価' },
      { name: /検証計画/i, content: '検証計画' },
      { name: /サマリー/i, content: 'エグゼクティブサマリー' }
    ]
    
    for (const tab of tabs) {
      const tabButton = screen.getByRole('button', { name: tab.name })
      fireEvent.click(tabButton)
      
      await waitFor(() => {
        expect(screen.getByText(tab.content)).toBeInTheDocument()
      })
    }
  })

  it('レポートメタデータが正しく表示される', () => {
    render(<ReportLayout report={mockReport} />)
    
    expect(screen.getByText(mockReport.metadata.title)).toBeInTheDocument()
    expect(screen.getByText(/session-123/)).toBeInTheDocument()
    expect(screen.getByText(/1.0.0/)).toBeInTheDocument()
  })

  it('レスポンシブデザインが適用される', () => {
    const { container } = render(<ReportLayout report={mockReport} />)
    
    const responsiveElements = container.querySelectorAll('.sm\\:px-6, .lg\\:px-8')
    expect(responsiveElements.length).toBeGreaterThan(0)
    
    const tabNav = container.querySelector('nav')
    expect(tabNav).toHaveClass('overflow-x-auto')
  })

  it('カスタムクラスが適用される', () => {
    const { container } = render(
      <ReportLayout report={mockReport} className="custom-class" />
    )
    
    const layoutDiv = container.querySelector('.custom-class')
    expect(layoutDiv).toBeInTheDocument()
  })
})