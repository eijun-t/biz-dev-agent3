import { WriterInput, HTMLReport } from '@/lib/types/writer';

export class ReportGeneratorService {
  async generateReport(input: WriterInput): Promise<HTMLReport> {
    const report: HTMLReport = {
      id: 'test-report-id',
      sessionId: input.sessionId,
      ideaId: input.businessIdea?.id || 'test-idea-id',
      title: input.businessIdea?.title || 'テストレポート',
      htmlContent: '<html><body>Test Report</body></html>',
      summary: {
        executive: 'テストサマリー',
        targetMarket: input.businessIdea?.targetMarket || '',
        valueProposition: input.businessIdea?.valueProposition || '',
        estimatedRevenue: {
          year1: '¥10,000,000',
          year3: '¥50,000,000',
          year5: '¥150,000,000'
        }
      },
      businessModel: {
        overview: 'テストビジネスモデル',
        customerSegments: ['セグメント1', 'セグメント2'],
        valueProposition: {
          core: 'コアバリュー',
          differentiators: ['差別化要因1']
        },
        channels: {
          primary: ['オンライン'],
          secondary: ['パートナー']
        },
        revenueModel: {
          primary: 'サブスクリプション',
          secondary: ['広告'],
          pricing: '月額5,000円'
        },
        costStructure: {
          fixed: '¥3,000,000',
          variable: '¥2,000,000',
          breakEvenPoint: '18ヶ月'
        }
      },
      marketAnalysis: {
        marketSize: {
          tam: '¥5,000,000,000',
          pam: '¥2,000,000,000',
          sam: '¥500,000,000'
        },
        growthRate: 25,
        competitors: input.marketAnalysis?.competitors || [],
        competitiveAdvantage: 'AI技術の活用',
        trends: input.marketAnalysis?.trends || []
      },
      synergy: {
        overallScore: input.strategicAlignment?.synergyScore || 85,
        opportunities: input.strategicAlignment?.opportunities || [],
        risks: input.strategicAlignment?.risks || [],
        strategicFit: '高い戦略的適合性',
        recommendations: input.strategicAlignment?.recommendations || []
      },
      validationPlan: {
        phases: [
          {
            phase: 1,
            name: 'MVP開発',
            duration: '3ヶ月',
            objectives: ['プロトタイプ作成'],
            budget: '¥1,000,000',
            successCriteria: ['ユーザー10名獲得']
          },
          {
            phase: 2,
            name: 'パイロット展開',
            duration: '6ヶ月',
            objectives: ['市場検証'],
            budget: '¥3,000,000',
            successCriteria: ['ユーザー100名獲得']
          },
          {
            phase: 3,
            name: '本格展開',
            duration: '12ヶ月',
            objectives: ['スケール'],
            budget: '¥10,000,000',
            successCriteria: ['月間売上1000万円達成']
          }
        ],
        totalBudget: '¥14,000,000',
        timeline: '21ヶ月'
      },
      sections: [
        {
          id: 'summary',
          type: 'summary' as const,
          title: 'エグゼクティブサマリー',
          content: '<div>サマリーコンテンツ</div>',
          order: 1
        }
      ],
      metrics: {
        completionPercentage: 100,
        sectionsGenerated: 5,
        generationTime: 1000,
        dataQualityScore: 95
      },
      generatedAt: new Date().toISOString(),
      generationTime: 1000
    };
    return report;
  }
}

export function getReportGeneratorService() {
  return new ReportGeneratorService();
}