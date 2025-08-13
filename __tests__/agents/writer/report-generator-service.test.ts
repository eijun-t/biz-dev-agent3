/**
 * Report Generator Service Tests
 * ReportGeneratorServiceのテスト
 */

import { ReportGeneratorService, getReportGeneratorService } from '@/lib/agents/writer/services/report-generator';
import { WriterInput } from '@/lib/types/writer';

// ReportGeneratorServiceクラスを再エクスポート用にインポート
const { ReportGeneratorService: ReportGeneratorServiceClass } = jest.requireActual('@/lib/agents/writer/services/report-generator');

// 依存サービスのモック
jest.mock('@/lib/agents/writer/services/data-integration-service', () => ({
  getDataIntegrationService: jest.fn(() => ({
    integrateData: jest.fn().mockImplementation((input) => ({
      businessIdea: {
        title: 'テストビジネス',
        description: 'テスト説明',
        targetCustomer: { segment: '大企業', needs: ['効率化'] },
        customerProblem: { problems: ['課題1'], priority: 'high' },
        valueProposition: { uniqueValue: '独自価値', competitiveAdvantage: ['優位性1'] },
        revenueStructure: { sources: ['月額'], pricing: '10万円', costStructure: '初期100万円' },
      },
      marketAnalysis: {
        tam: 1000000000,
        pam: 500000000,
        sam: 100000000,
        growthRate: 15,
        competitors: [],
        marketTrends: ['DX'],
        regulations: [],
      },
      synergyAnalysis: {
        totalScore: 85,
        breakdown: {
          realEstateUtilization: 90,
          customerBaseUtilization: 80,
          brandValueEnhancement: 85,
        },
        initiatives: [],
        risks: input.analystData.synergyAnalysis.risks,
      },
      validationPlan: {
        phases: [{
          name: 'POC',
          duration: 3,
          milestones: ['マイルストーン1'],
          kpis: [{ metric: 'KPI1', target: 80 }],
          requiredResources: {
            personnel: 5,
            budget: 10000000,
            technology: ['Tech1'],
          },
          goNoGoCriteria: ['基準1'],
        }],
        totalDuration: input.analystData.validationPlan.totalDuration,
        requiredBudget: input.analystData.validationPlan.requiredBudget,
      },
      dataQuality: {
        completeness: 90,
        consistency: true,
        warnings: [],
      },
    })),
    formatCurrency: jest.fn((amount: number) => `¥${amount.toLocaleString()}`),
  })),
  DataIntegrationService: jest.fn(),
}));

jest.mock('@/lib/agents/writer/services/html-template-service', () => ({
  getHtmlTemplateService: jest.fn(() => ({
    generateHtml: jest.fn().mockResolvedValue('<html><body>Test Report</body></html>'),
    generateTable: jest.fn((headers, rows) => `<table>${headers.join('')}${rows.join('')}</table>`),
    generateHighlight: jest.fn((content) => `<div class="highlight">${content}</div>`),
  })),
  HtmlTemplateService: jest.fn(),
}));

jest.mock('@/lib/agents/writer/services/section-generator-service', () => ({
  getSectionGeneratorService: jest.fn(() => ({
    generateExecutiveSummary: jest.fn().mockResolvedValue({
      id: 'section-1',
      type: 'executive_summary',
      title: 'エグゼクティブサマリー',
      content: '<p>サマリー内容</p>',
      order: 1,
    }),
    generateBusinessIdea: jest.fn().mockResolvedValue({
      id: 'section-2',
      type: 'business_idea',
      title: 'ビジネスアイデア詳細',
      content: '<p>ビジネス内容</p>',
      order: 2,
    }),
    generateMarketAnalysis: jest.fn().mockResolvedValue({
      id: 'section-3',
      type: 'market_analysis',
      title: '市場分析',
      content: '<p>市場分析内容</p>',
      order: 3,
    }),
    generateSynergyAnalysis: jest.fn().mockResolvedValue({
      id: 'section-4',
      type: 'synergy_analysis',
      title: 'シナジー分析',
      content: '<p>シナジー内容</p>',
      order: 4,
    }),
    generateValidationPlan: jest.fn().mockResolvedValue({
      id: 'section-5',
      type: 'validation_plan',
      title: '検証計画',
      content: '<p>検証計画内容</p>',
      order: 5,
    }),
  })),
  SectionGeneratorService: jest.fn(),
}));

describe('ReportGeneratorService', () => {
  let service: ReportGeneratorService;
  let validInput: WriterInput;

  beforeEach(() => {
    jest.clearAllMocks();
    // シングルトンインスタンスをリセット
    (global as any).__reportGeneratorServiceInstance = null;
    service = getReportGeneratorService();
    
    validInput = {
      sessionId: '123e4567-e89b-12d3-a456-426614174000',
      ideaId: '123e4567-e89b-12d3-a456-426614174001',
      analystData: {
        businessIdea: {
          id: '123e4567-e89b-12d3-a456-426614174002',
          title: 'スマートオフィス',
          description: 'IoT統合オフィス',
          targetCustomer: {
            segment: '大企業',
            ageRange: '30-50',
            occupation: '経営者',
            needs: ['効率化'],
          },
          customerProblem: {
            problems: ['稼働率低下'],
            priority: 'high',
          },
          valueProposition: {
            uniqueValue: 'AI最適化',
            competitiveAdvantage: ['不動産知見'],
          },
          revenueStructure: {
            sources: ['月額'],
            pricing: '月額10万円',
            costStructure: '初期1000万円',
          },
        },
        marketAnalysis: {
          tam: 1000000000,
          pam: 500000000,
          sam: 100000000,
          growthRate: 15.5,
          competitors: [],
          marketTrends: ['DX推進'],
          regulations: [],
        },
        synergyAnalysis: {
          totalScore: 85,
          breakdown: {
            realEstateUtilization: 90,
            customerBaseUtilization: 80,
            brandValueEnhancement: 85,
          },
          initiatives: [],
          risks: [],
        },
        validationPlan: {
          phases: [{
            name: 'POC',
            duration: 3,
            milestones: ['プロトタイプ'],
            kpis: [{ metric: '満足度', target: 80 }],
            requiredResources: {
              personnel: 5,
              budget: 10000000,
              technology: ['IoT'],
            },
            goNoGoCriteria: ['ROI 3年'],
          }],
          totalDuration: 12,
          requiredBudget: 100000000,
        },
      },
      metadata: {
        generatedAt: new Date(),
        version: '1.0.0',
      },
    };
  });

  describe('generateReport', () => {
    it('should generate a complete HTML report', async () => {
      const report = await service.generateReport(validInput);

      expect(report).toBeDefined();
      expect(report.id).toBeDefined();
      expect(report.sessionId).toBe(validInput.sessionId);
      expect(report.ideaId).toBe(validInput.ideaId);
      expect(report.title).toBe('テストビジネス');
      expect(report.htmlContent).toContain('<html>');
      expect(report.sections).toHaveLength(5);
      expect(report.metrics).toBeDefined();
      expect(report.generatedAt).toBeInstanceOf(Date);
      expect(report.generationTime).toBeGreaterThanOrEqual(0);
    });

    it('should generate all 5 required sections', async () => {
      const report = await service.generateReport(validInput);

      const sectionTypes = report.sections.map(s => s.type);
      expect(sectionTypes).toContain('executive_summary');
      expect(sectionTypes).toContain('business_idea');
      expect(sectionTypes).toContain('market_analysis');
      expect(sectionTypes).toContain('synergy_analysis');
      expect(sectionTypes).toContain('validation_plan');
    });

    it('should calculate metrics correctly', async () => {
      const report = await service.generateReport(validInput);

      expect(report.metrics.tam).toBe(1000000000);
      expect(report.metrics.pam).toBe(500000000);
      expect(report.metrics.sam).toBe(100000000);
      expect(report.metrics.synergyScore).toBe(85);
      expect(report.metrics.timeToMarket).toBe(12);
      expect(report.metrics.revenueProjection3Y).toBeGreaterThan(0);
      expect(['low', 'medium', 'high']).toContain(report.metrics.implementationDifficulty);
    });

    it('should complete within 5 seconds', async () => {
      const startTime = Date.now();
      await service.generateReport(validInput);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(5000);
    });
  });

  describe('generateReportWithRetry', () => {
    it('should retry on failure', async () => {
      let callCount = 0;
      const originalGenerateReport = service.generateReport;
      
      service.generateReport = jest.fn().mockImplementation(async () => {
        callCount++;
        if (callCount < 3) {
          throw new Error('Temporary failure');
        }
        return originalGenerateReport.call(service, validInput);
      });

      const report = await service.generateReportWithRetry(validInput, 3);

      expect(report).toBeDefined();
      expect(callCount).toBe(3);
    });

    it('should fail after max retries', async () => {
      service.generateReport = jest.fn().mockRejectedValue(new Error('Persistent failure'));

      await expect(service.generateReportWithRetry(validInput, 2))
        .rejects
        .toThrow('Persistent failure');
      
      expect(service.generateReport).toHaveBeenCalledTimes(2);
    });
  });

  describe('updateSection', () => {
    it('should update a section', async () => {
      const updatedSection = await service.updateSection(
        'report-123',
        'executive_summary',
        '<p>Updated content</p>'
      );

      expect(updatedSection.id).toBeDefined();
      expect(updatedSection.type).toBe('executive_summary');
      expect(updatedSection.title).toBe('エグゼクティブサマリー');
      expect(updatedSection.content).toBe('<p>Updated content</p>');
      expect(updatedSection.order).toBe(1);
      expect(updatedSection.metadata?.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('implementation difficulty assessment', () => {
    it('should return low difficulty for small projects', async () => {
      // 新しいサービスインスタンスを作成
      const freshService = new ReportGeneratorServiceClass();
      validInput.analystData.validationPlan.requiredBudget = 10000000; // 1000万円
      validInput.analystData.validationPlan.totalDuration = 3; // 3ヶ月
      validInput.analystData.synergyAnalysis.risks = [];

      const report = await freshService.generateReport(validInput);
      expect(report.metrics.implementationDifficulty).toBe('low');
    });

    it('should return high difficulty for large projects', async () => {
      // 新しいサービスインスタンスを作成
      const freshService = new ReportGeneratorServiceClass();
      validInput.analystData.validationPlan.requiredBudget = 200000000; // 2億円
      validInput.analystData.validationPlan.totalDuration = 18; // 18ヶ月
      validInput.analystData.synergyAnalysis.risks = [
        { description: 'リスク1', mitigation: '対策1' },
        { description: 'リスク2', mitigation: '対策2' },
        { description: 'リスク3', mitigation: '対策3' },
        { description: 'リスク4', mitigation: '対策4' },
        { description: 'リスク5', mitigation: '対策5' },
      ];

      const report = await freshService.generateReport(validInput);
      expect(report.metrics.implementationDifficulty).toBe('high');
    });
  });

  describe('revenue projection calculation', () => {
    it('should calculate 3-year revenue projection', async () => {
      // 新しいサービスインスタンスを作成
      const freshService = new ReportGeneratorServiceClass();
      const report = await freshService.generateReport(validInput);
      
      // SAMの10%をベースに、成長率15%で3年間成長（モックでは15に変更されている）
      const expectedBase = 100000000 * 0.1; // 1000万円
      const expectedGrowth = Math.pow(1.15, 3); // 15%成長率
      const expectedRevenue = Math.round(expectedBase * expectedGrowth);
      
      expect(report.metrics.revenueProjection3Y).toBe(expectedRevenue);
    });
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = getReportGeneratorService();
      const instance2 = getReportGeneratorService();
      
      expect(instance1).toBe(instance2);
    });
  });
});