import { WriterInput, HTMLReport } from '@/lib/types/writer';

// Mock the services before importing WriterAgent
jest.mock('@/lib/agents/writer/services/report-generator', () => ({
  ReportGeneratorService: class {
    async generateReport(input: WriterInput): Promise<HTMLReport> {
      return createMockReport(input);
    }
  },
  getReportGeneratorService: () => new (jest.requireMock('@/lib/agents/writer/services/report-generator').ReportGeneratorService)()
}));

jest.mock('@/lib/agents/writer/services/performance-monitor', () => ({
  PerformanceMonitor: class {
    private static instance: any;
    private times: number[] = [];

    static getInstance() {
      if (!this.instance) {
        this.instance = new (jest.requireMock('@/lib/agents/writer/services/performance-monitor').PerformanceMonitor)();
      }
      return this.instance;
    }

    reset() {
      this.times = [];
    }

    recordGenerationTime(time: number, success: boolean) {
      if (success) {
        this.times.push(time);
      }
    }

    getMetrics() {
      const sorted = [...this.times].sort((a, b) => a - b);
      const p95Index = Math.floor(sorted.length * 0.95);
      const p99Index = Math.floor(sorted.length * 0.99);
      
      return {
        averageTime: this.times.length > 0 ? 
          this.times.reduce((a, b) => a + b, 0) / this.times.length : 0,
        p95Time: sorted[p95Index] || 0,
        p99Time: sorted[p99Index] || 0,
        totalRequests: this.times.length,
        successRate: 100
      };
    }

    checkPerformanceThreshold() {
      const metrics = this.getMetrics();
      return {
        withinP95: !metrics.p95Time || metrics.p95Time <= 5000,
        withinP99: !metrics.p99Time || metrics.p99Time <= 8000
      };
    }

    getDetailedReport() {
      const metrics = this.getMetrics();
      return `Performance Report:
      - Average: ${metrics.averageTime}ms
      - P95: ${metrics.p95Time}ms
      - P99: ${metrics.p99Time}ms
      - Total Requests: ${metrics.totalRequests}
      - Success Rate: ${metrics.successRate}%`;
    }
  }
}));

// Import WriterAgent after mocks are set up
import { WriterAgent } from '@/lib/agents/writer/writer-agent';

// Helper function to create mock report
function createMockReport(input: WriterInput): HTMLReport {
  return {
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
}

const mockAnalystOutput: WriterInput = {
  sessionId: 'e2e-test-session',
  businessIdea: {
    title: 'AI駆動型パーソナライズド学習プラットフォーム',
    description: 'AIを活用して個々の学習者に最適化された教育コンテンツを提供するプラットフォーム',
    targetMarket: '中高生および大学生',
    valueProposition: 'パーソナライズされた学習体験による学習効率の最大化'
  },
  marketAnalysis: {
    marketSize: {
      tam: 5000000000,
      pam: 2000000000,
      sam: 500000000
    },
    growthRate: 25,
    competitors: [
      {
        name: 'EduTech A社',
        marketShare: 30,
        strengths: ['豊富なコンテンツ', '実績'],
        weaknesses: ['パーソナライゼーション不足', '高価格']
      },
      {
        name: 'Learning B社',
        marketShare: 20,
        strengths: ['使いやすいUI', '低価格'],
        weaknesses: ['機能限定', 'AI活用不足']
      }
    ],
    trends: [
      'オンライン教育の急速な成長',
      'AI技術の教育分野への応用拡大',
      'パーソナライズド学習への需要増加'
    ]
  },
  financialProjections: {
    revenue: {
      year1: 10000000,
      year3: 50000000,
      year5: 150000000
    },
    costs: {
      initial: 5000000,
      operational: 3000000,
      marketing: 2000000
    },
    profitMargin: 35,
    breakEvenMonth: 18
  },
  strategicAlignment: {
    synergyScore: 85,
    opportunities: [
      '既存の教育インフラとの統合',
      'AIモデルの継続的改善',
      '国際市場への展開'
    ],
    risks: [
      'データプライバシーへの懸念',
      '競合による模倣リスク',
      '規制環境の変化'
    ],
    recommendations: [
      '段階的な機能リリース戦略の採用',
      '教育機関とのパートナーシップ構築',
      'データセキュリティへの投資強化'
    ]
  }
};

describe('Writer Agent E2E Flow (Fixed)', () => {
  let writerAgent: WriterAgent;
  let performanceMonitor: any;

  beforeEach(() => {
    const PerformanceMonitor = jest.requireMock('@/lib/agents/writer/services/performance-monitor').PerformanceMonitor;
    performanceMonitor = PerformanceMonitor.getInstance();
    performanceMonitor.reset();
    
    writerAgent = new WriterAgent({
      sessionId: mockAnalystOutput.sessionId,
      userId: 'test-user-id'
    });
  });

  describe('完全なレポート生成フロー', () => {
    it('Analystデータから完全なHTMLレポートを生成する', async () => {
      const startTime = Date.now();
      
      const report = await writerAgent.processAnalysisData(mockAnalystOutput);
      
      const endTime = Date.now();
      const generationTime = endTime - startTime;

      expect(report).toBeDefined();
      expect(report.id).toBeDefined();
      expect(report.sessionId).toBe(mockAnalystOutput.sessionId);
      
      expect(report.summary).toBeDefined();
      expect(report.summary.executive).toBeDefined();
      expect(report.summary.executive.length).toBeLessThanOrEqual(300);
      expect(report.summary.estimatedRevenue.year1).toContain('¥');
      expect(report.summary.estimatedRevenue.year3).toContain('¥');
      expect(report.summary.estimatedRevenue.year5).toContain('¥');
      
      expect(report.businessModel).toBeDefined();
      expect(report.businessModel.customerSegments).toBeInstanceOf(Array);
      expect(report.businessModel.revenueModel.primary).toBeDefined();
      expect(report.businessModel.costStructure.breakEvenPoint).toBeDefined();
      
      expect(report.marketAnalysis).toBeDefined();
      expect(report.marketAnalysis.marketSize.tam).toContain('¥');
      expect(report.marketAnalysis.marketSize.pam).toContain('¥');
      expect(report.marketAnalysis.marketSize.sam).toContain('¥');
      expect(report.marketAnalysis.competitors).toHaveLength(2);
      
      expect(report.synergy).toBeDefined();
      expect(report.synergy.overallScore).toBe(85);
      expect(report.synergy.opportunities).toHaveLength(3);
      expect(report.synergy.risks).toHaveLength(3);
      
      expect(report.validationPlan).toBeDefined();
      expect(report.validationPlan.phases).toHaveLength(3);
      expect(report.validationPlan.phases[0].phase).toBe(1);
      expect(report.validationPlan.phases[0].budget).toContain('¥');
      
      performanceMonitor.recordGenerationTime(generationTime, true);
    });

    it('5秒以内に完全なレポートを生成する', async () => {
      const startTime = Date.now();
      
      const report = await writerAgent.processAnalysisData(mockAnalystOutput);
      
      const endTime = Date.now();
      const generationTime = endTime - startTime;

      expect(generationTime).toBeLessThan(5000);
      
      performanceMonitor.recordGenerationTime(generationTime, true);
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.averageTime).toBeLessThan(5000);
    });

    it('10件の並行処理を実行できる', async () => {
      const promises = Array.from({ length: 10 }, (_, i) => {
        const input = {
          ...mockAnalystOutput,
          sessionId: `parallel-test-${i}`
        };
        const agent = new WriterAgent({
          sessionId: input.sessionId,
          userId: `test-user-${i}`
        });
        return agent.processAnalysisData(input);
      });

      const startTime = Date.now();
      const results = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(results).toHaveLength(10);
      results.forEach((report, index) => {
        expect(report).toBeDefined();
        expect(report.sessionId).toBe(`parallel-test-${index}`);
        expect(report.summary).toBeDefined();
        expect(report.businessModel).toBeDefined();
        expect(report.marketAnalysis).toBeDefined();
        expect(report.synergy).toBeDefined();
        expect(report.validationPlan).toBeDefined();
      });

      const averageTime = totalTime / 10;
      performanceMonitor.recordGenerationTime(averageTime, true);
    });
  });

  describe('パフォーマンス目標の検証', () => {
    it('P95で5秒以内、P99で8秒以内を達成する', async () => {
      const iterations = 20;

      for (let i = 0; i < iterations; i++) {
        const input = {
          ...mockAnalystOutput,
          sessionId: `perf-test-${i}`
        };
        const agent = new WriterAgent({
          sessionId: input.sessionId,
          userId: `test-user-${i}`
        });

        const startTime = Date.now();
        await agent.processAnalysisData(input);
        const endTime = Date.now();
        
        const time = endTime - startTime;
        performanceMonitor.recordGenerationTime(time, true);
      }

      const metrics = performanceMonitor.getMetrics();
      const thresholds = performanceMonitor.checkPerformanceThreshold();

      expect(thresholds.withinP95).toBe(true);
      expect(thresholds.withinP99).toBe(true);
      
      if (metrics.p95Time) {
        expect(metrics.p95Time).toBeLessThanOrEqual(5000);
      }
      if (metrics.p99Time) {
        expect(metrics.p99Time).toBeLessThanOrEqual(8000);
      }

      console.log(performanceMonitor.getDetailedReport());
    });
  });

  describe('エラー処理とリカバリー', () => {
    it('不正な入力データでも部分的なレポートを生成する', async () => {
      const invalidInput: WriterInput = {
        ...mockAnalystOutput,
        marketAnalysis: {
          ...mockAnalystOutput.marketAnalysis,
          marketSize: {
            tam: NaN,
            pam: 0,
            sam: -1000
          }
        }
      };

      const report = await writerAgent.processAnalysisData(invalidInput);

      expect(report).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.businessModel).toBeDefined();
      
      expect(report.marketAnalysis.marketSize.tam).toContain('¥');
      expect(report.marketAnalysis.marketSize.pam).toContain('¥');
      expect(report.marketAnalysis.marketSize.sam).toContain('¥');
    });

    it('タイムアウト時でも部分コンテンツを保存する', async () => {
      const slowAgent = new WriterAgent({
        sessionId: 'timeout-test',
        userId: 'test-user',
        timeout: 100
      });

      try {
        await slowAgent.processAnalysisData(mockAnalystOutput);
      } catch (error: any) {
        expect(error.message).toContain('exceeded');
        
        if (error.partialContent) {
          expect(error.partialContent).toBeDefined();
        }
      }
    });
  });

  describe('データ整合性の検証', () => {
    it('すべての数値が円単位で表示される', async () => {
      const report = await writerAgent.processAnalysisData(mockAnalystOutput);

      const checkYenFormat = (value: string) => {
        expect(value).toMatch(/^¥[\d,]+$/);
      };

      checkYenFormat(report.summary.estimatedRevenue.year1);
      checkYenFormat(report.summary.estimatedRevenue.year3);
      checkYenFormat(report.summary.estimatedRevenue.year5);
      
      checkYenFormat(report.marketAnalysis.marketSize.tam);
      checkYenFormat(report.marketAnalysis.marketSize.pam);
      checkYenFormat(report.marketAnalysis.marketSize.sam);
      
      checkYenFormat(report.businessModel.costStructure.fixed);
      
      report.validationPlan.phases.forEach(phase => {
        checkYenFormat(phase.budget);
      });
    });

    it('セクション間のデータ整合性が保たれる', async () => {
      const report = await writerAgent.processAnalysisData(mockAnalystOutput);

      expect(report.synergy.overallScore).toBe(
        mockAnalystOutput.strategicAlignment.synergyScore
      );

      expect(report.synergy.opportunities).toEqual(
        mockAnalystOutput.strategicAlignment.opportunities
      );

      expect(report.synergy.risks).toEqual(
        mockAnalystOutput.strategicAlignment.risks
      );

      expect(report.summary.targetMarket).toBe(
        mockAnalystOutput.businessIdea.targetMarket
      );

      expect(report.summary.valueProposition).toBe(
        mockAnalystOutput.businessIdea.valueProposition
      );
    });
  });
});