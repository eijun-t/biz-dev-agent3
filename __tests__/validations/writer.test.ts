/**
 * Writer Validation Schema Tests
 * Writerバリデーションスキーマのテスト
 */

import {
  writerInputSchema,
  businessIdeaSchema,
  marketAnalysisSchema,
  synergyAnalysisSchema,
  validationPlanSchema,
  htmlReportSchema,
  reportMetricsSchema,
  currencySchema,
  currencyFormatSchema,
  summarySectionSchema,
} from '@/lib/validations/writer';

describe('Writer Validation Schemas', () => {
  describe('businessIdeaSchema', () => {
    const validBusinessIdea = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      title: 'スマートオフィスソリューション',
      description: '三菱地所の不動産にIoTを統合した次世代オフィス',
      targetCustomer: {
        segment: '大企業',
        ageRange: '30-50歳',
        occupation: '経営者・管理職',
        needs: ['効率化', 'コスト削減', '働き方改革'],
      },
      customerProblem: {
        problems: ['オフィスの稼働率低下', 'エネルギーコスト増加'],
        priority: 'high' as const,
      },
      valueProposition: {
        uniqueValue: 'AIによる最適化されたオフィス環境',
        competitiveAdvantage: ['不動産知見', 'テナントネットワーク'],
      },
      revenueStructure: {
        sources: ['月額サービス料', 'コンサルティング料'],
        pricing: '月額10万円〜',
        costStructure: '初期投資1000万円、運用コスト月額50万円',
      },
    };

    it('should validate a valid business idea', () => {
      const result = businessIdeaSchema.safeParse(validBusinessIdea);
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID', () => {
      const invalidData = { ...validBusinessIdea, id: 'not-a-uuid' };
      const result = businessIdeaSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('UUID');
      }
    });

    it('should require title', () => {
      const invalidData = { ...validBusinessIdea, title: '' };
      const result = businessIdeaSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should limit title to 100 characters', () => {
      const invalidData = { ...validBusinessIdea, title: 'a'.repeat(101) };
      const result = businessIdeaSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should require at least one customer need', () => {
      const invalidData = {
        ...validBusinessIdea,
        targetCustomer: { ...validBusinessIdea.targetCustomer, needs: [] },
      };
      const result = businessIdeaSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should limit problems to maximum 5', () => {
      const invalidData = {
        ...validBusinessIdea,
        customerProblem: {
          problems: Array(6).fill('問題'),
          priority: 'high' as const,
        },
      };
      const result = businessIdeaSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('marketAnalysisSchema', () => {
    const validMarketAnalysis = {
      tam: 1000000000, // 10億円
      pam: 500000000,  // 5億円
      sam: 100000000,  // 1億円
      growthRate: 15.5,
      competitors: [
        {
          name: '競合A社',
          marketShare: 25.5,
          strengths: ['技術力', 'ブランド'],
          weaknesses: ['価格', 'サポート'],
          revenue: 5000000000,
        },
      ],
      marketTrends: ['DX推進', 'リモートワーク'],
      regulations: ['個人情報保護法', '建築基準法'],
    };

    it('should validate valid market analysis', () => {
      const result = marketAnalysisSchema.safeParse(validMarketAnalysis);
      expect(result.success).toBe(true);
    });

    it('should validate TAM/PAM/SAM as positive numbers', () => {
      const invalidData = { ...validMarketAnalysis, tam: -1000 };
      const result = marketAnalysisSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate market share percentage', () => {
      const invalidData = {
        ...validMarketAnalysis,
        competitors: [
          {
            ...validMarketAnalysis.competitors[0],
            marketShare: 150, // 150%は無効
          },
        ],
      };
      const result = marketAnalysisSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should limit competitors to maximum 10', () => {
      const invalidData = {
        ...validMarketAnalysis,
        competitors: Array(11).fill(validMarketAnalysis.competitors[0]),
      };
      const result = marketAnalysisSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('synergyAnalysisSchema', () => {
    const validSynergyAnalysis = {
      totalScore: 85,
      breakdown: {
        realEstateUtilization: 90,
        customerBaseUtilization: 80,
        brandValueEnhancement: 85,
      },
      initiatives: [
        {
          title: '既存ビルへの展開',
          priority: 'high' as const,
          expectedImpact: '年間売上10億円増',
        },
      ],
      risks: [
        {
          description: '初期投資の回収期間',
          mitigation: '段階的展開による投資分散',
        },
      ],
    };

    it('should validate valid synergy analysis', () => {
      const result = synergyAnalysisSchema.safeParse(validSynergyAnalysis);
      expect(result.success).toBe(true);
    });

    it('should validate score range 0-100', () => {
      const invalidData = { ...validSynergyAnalysis, totalScore: 150 };
      const result = synergyAnalysisSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate breakdown scores', () => {
      const invalidData = {
        ...validSynergyAnalysis,
        breakdown: {
          ...validSynergyAnalysis.breakdown,
          realEstateUtilization: -10,
        },
      };
      const result = synergyAnalysisSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('validationPlanSchema', () => {
    const validValidationPlan = {
      phases: [
        {
          name: 'POC' as const,
          duration: 3,
          milestones: ['プロトタイプ完成', 'ユーザーテスト'],
          kpis: [
            { metric: 'ユーザー満足度', target: 80 },
            { metric: 'コスト削減率', target: '20%' },
          ],
          requiredResources: {
            personnel: 5,
            budget: 10000000,
            technology: ['IoTセンサー', 'クラウド基盤'],
          },
          goNoGoCriteria: ['ROI 3年以内', '顧客満足度80%以上'],
        },
      ],
      totalDuration: 12,
      requiredBudget: 100000000,
    };

    it('should validate valid validation plan', () => {
      const result = validationPlanSchema.safeParse(validValidationPlan);
      expect(result.success).toBe(true);
    });

    it('should validate phase duration range', () => {
      const invalidData = {
        ...validValidationPlan,
        phases: [
          {
            ...validValidationPlan.phases[0],
            duration: 50, // 36ヶ月を超える
          },
        ],
      };
      const result = validationPlanSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should require at least one KPI', () => {
      const invalidData = {
        ...validValidationPlan,
        phases: [
          {
            ...validValidationPlan.phases[0],
            kpis: [],
          },
        ],
      };
      const result = validationPlanSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('htmlReportSchema', () => {
    const validHTMLReport = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      sessionId: '123e4567-e89b-12d3-a456-426614174001',
      ideaId: '123e4567-e89b-12d3-a456-426614174002',
      title: 'スマートオフィスソリューション事業計画',
      htmlContent: '<html>...</html>',
      sections: Array(5).fill(null).map((_, i) => ({
        id: `123e4567-e89b-12d3-a456-42661417400${i}`,
        type: ['summary', 'business_model', 'market', 'synergy', 'validation'][i],
        title: `Section ${i + 1}`,
        content: '<div>...</div>',
        order: i,
      })),
      metrics: {
        tam: 1000000000,
        pam: 500000000,
        sam: 100000000,
        revenueProjection3Y: 300000000,
        synergyScore: 85,
        implementationDifficulty: 'medium' as const,
        timeToMarket: 12,
      },
      generatedAt: new Date(),
      generationTime: 4500,
    };

    it('should validate valid HTML report', () => {
      const result = htmlReportSchema.safeParse(validHTMLReport);
      expect(result.success).toBe(true);
    });

    it('should require exactly 5 sections', () => {
      const invalidData = {
        ...validHTMLReport,
        sections: validHTMLReport.sections.slice(0, 4),
      };
      const result = htmlReportSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate generation time limit', () => {
      const invalidData = {
        ...validHTMLReport,
        generationTime: 70000, // 70秒は上限を超える
      };
      const result = htmlReportSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('Currency Validation', () => {
    describe('currencySchema', () => {
      it('should validate positive integers', () => {
        expect(currencySchema.safeParse(1000000).success).toBe(true);
        expect(currencySchema.safeParse(0).success).toBe(true);
      });

      it('should reject negative values', () => {
        expect(currencySchema.safeParse(-1000).success).toBe(false);
      });

      it('should reject decimal values', () => {
        expect(currencySchema.safeParse(1000.5).success).toBe(false);
      });
    });

    describe('currencyFormatSchema', () => {
      it('should validate JPY format', () => {
        expect(currencyFormatSchema.safeParse('¥1,000,000').success).toBe(true);
        expect(currencyFormatSchema.safeParse('¥100').success).toBe(true);
      });

      it('should reject invalid format', () => {
        expect(currencyFormatSchema.safeParse('1000000').success).toBe(false);
        expect(currencyFormatSchema.safeParse('$1,000').success).toBe(false);
      });
    });
  });

  describe('summarySectionSchema', () => {
    it('should validate summary within 300 characters', () => {
      const validSummary = {
        content: '三菱地所の不動産資産を活用した革新的なスマートオフィスソリューション',
        keyPoints: ['IoT活用', 'コスト削減', '生産性向上'],
      };
      expect(summarySectionSchema.safeParse(validSummary).success).toBe(true);
    });

    it('should reject summary over 300 characters', () => {
      const invalidSummary = {
        content: 'あ'.repeat(301),
        keyPoints: ['ポイント1'],
      };
      expect(summarySectionSchema.safeParse(invalidSummary).success).toBe(false);
    });

    it('should limit key points to 5', () => {
      const invalidSummary = {
        content: '概要',
        keyPoints: Array(6).fill('ポイント'),
      };
      expect(summarySectionSchema.safeParse(invalidSummary).success).toBe(false);
    });
  });
});