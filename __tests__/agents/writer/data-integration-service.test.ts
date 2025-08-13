/**
 * Data Integration Service Tests
 * DataIntegrationServiceのテスト
 */

import { DataIntegrationService, getDataIntegrationService } from '@/lib/agents/writer/services/data-integration-service';
import { WriterInput, IntegratedData } from '@/lib/types/writer';

describe('DataIntegrationService', () => {
  let service: DataIntegrationService;
  let validInput: WriterInput;

  beforeEach(() => {
    service = new DataIntegrationService();
    
    // 有効な入力データ
    validInput = {
      sessionId: '123e4567-e89b-12d3-a456-426614174000',
      ideaId: '123e4567-e89b-12d3-a456-426614174001',
      analystData: {
        businessIdea: {
          id: '123e4567-e89b-12d3-a456-426614174002',
          title: 'スマートオフィスソリューション',
          description: 'IoT統合型次世代オフィス',
          targetCustomer: {
            segment: '大企業',
            ageRange: '30-50歳',
            occupation: '経営者',
            needs: ['効率化', 'コスト削減'],
          },
          customerProblem: {
            problems: ['稼働率低下', 'エネルギーコスト'],
            priority: 'high',
          },
          valueProposition: {
            uniqueValue: 'AI最適化',
            competitiveAdvantage: ['不動産知見'],
          },
          revenueStructure: {
            sources: ['月額料金'],
            pricing: '月額10万円',
            costStructure: '初期投資1000万円',
          },
        },
        marketAnalysis: {
          tam: 1000000000, // 10億円
          pam: 500000000,  // 5億円
          sam: 100000000,  // 1億円
          growthRate: 15.5,
          competitors: [
            {
              name: '競合A社',
              marketShare: 25.5,
              strengths: ['技術力'],
              weaknesses: ['価格'],
              revenue: 5000000000,
            },
          ],
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
          initiatives: [
            {
              title: '既存ビル展開',
              priority: 'high',
              expectedImpact: '売上10億円',
            },
          ],
          risks: [
            {
              description: '初期投資',
              mitigation: '段階展開',
            },
          ],
        },
        validationPlan: {
          phases: [
            {
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
            },
            {
              name: 'Pilot',
              duration: 6,
              milestones: ['パイロット運用'],
              kpis: [{ metric: '稼働率', target: '70%' }],
              requiredResources: {
                personnel: 10,
                budget: 50000000,
                technology: ['クラウド'],
              },
              goNoGoCriteria: ['顧客満足度80%'],
            },
            {
              name: 'FullScale',
              duration: 3,
              milestones: ['全面展開'],
              kpis: [{ metric: '収益', target: 100000000 }],
              requiredResources: {
                personnel: 20,
                budget: 100000000,
                technology: ['AI'],
              },
              goNoGoCriteria: ['黒字化'],
            },
          ],
          totalDuration: 12,
          requiredBudget: 160000000,
        },
      },
      metadata: {
        generatedAt: new Date(),
        version: '1.0.0',
      },
    };
  });

  describe('integrateData', () => {
    it('should successfully integrate valid data', async () => {
      const result = await service.integrateData(validInput);

      expect(result).toBeDefined();
      expect(result.businessIdea).toEqual(validInput.analystData.businessIdea);
      expect(result.dataQuality.consistency).toBe(true);
      expect(result.dataQuality.completeness).toBeGreaterThan(80);
    });

    it('should normalize currency to JPY', async () => {
      const result = await service.integrateData(validInput);

      // 市場規模が整数になっていることを確認
      expect(Number.isInteger(result.marketAnalysis.tam)).toBe(true);
      expect(Number.isInteger(result.marketAnalysis.pam)).toBe(true);
      expect(Number.isInteger(result.marketAnalysis.sam)).toBe(true);
    });

    it('should include data quality metrics', async () => {
      const result = await service.integrateData(validInput);

      expect(result.dataQuality).toBeDefined();
      expect(result.dataQuality.completeness).toBeGreaterThanOrEqual(0);
      expect(result.dataQuality.completeness).toBeLessThanOrEqual(100);
      expect(typeof result.dataQuality.consistency).toBe('boolean');
      expect(Array.isArray(result.dataQuality.warnings)).toBe(true);
    });
  });

  describe('validateConsistency', () => {
    it('should validate correct data', async () => {
      const result = await service.validateConsistency(validInput);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect TAM/PAM/SAM hierarchy errors', async () => {
      const invalidInput = {
        ...validInput,
        analystData: {
          ...validInput.analystData,
          marketAnalysis: {
            ...validInput.analystData.marketAnalysis,
            tam: 100000000,  // 1億円
            pam: 500000000,  // 5億円（TAMより大きい - エラー）
            sam: 100000000,  // 1億円
          },
        },
      };

      const result = await service.validateConsistency(invalidInput);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'marketAnalysis',
          message: expect.stringContaining('TAM should be > PAM > SAM'),
        })
      );
    });

    it('should warn about synergy score discrepancies', async () => {
      const inputWithDiscrepancy = {
        ...validInput,
        analystData: {
          ...validInput.analystData,
          synergyAnalysis: {
            ...validInput.analystData.synergyAnalysis,
            totalScore: 50, // 平均85と大きく異なる
          },
        },
      };

      const result = await service.validateConsistency(inputWithDiscrepancy);

      expect(result.warnings).toContainEqual(
        expect.stringContaining('Synergy total score')
      );
    });

    it('should detect validation plan duration mismatch', async () => {
      const invalidInput = {
        ...validInput,
        analystData: {
          ...validInput.analystData,
          validationPlan: {
            ...validInput.analystData.validationPlan,
            totalDuration: 20, // フェーズの合計12と異なる
          },
        },
      };

      const result = await service.validateConsistency(invalidInput);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'validationPlan',
        })
      );
    });

    it('should warn about excessive market share', async () => {
      const inputWithExcessiveShare = {
        ...validInput,
        analystData: {
          ...validInput.analystData,
          marketAnalysis: {
            ...validInput.analystData.marketAnalysis,
            competitors: [
              { name: 'A社', marketShare: 60, strengths: ['技術'], weaknesses: ['価格'] },
              { name: 'B社', marketShare: 50, strengths: ['価格'], weaknesses: ['技術'] },
            ],
          },
        },
      };

      const result = await service.validateConsistency(inputWithExcessiveShare);

      expect(result.warnings).toContainEqual(
        expect.stringContaining('Total competitor market share')
      );
    });
  });

  describe('formatCurrency', () => {
    it('should format small amounts', () => {
      expect(service.formatCurrency(1000)).toBe('¥1,000');
      expect(service.formatCurrency(9999)).toBe('¥9,999');
    });

    it('should format amounts in 万 (10,000s)', () => {
      expect(service.formatCurrency(10000)).toBe('¥1万');
      expect(service.formatCurrency(999999)).toBe('¥99万9,999');
      expect(service.formatCurrency(1234567)).toBe('¥123万4,567');
    });

    it('should format amounts in 億 (100,000,000s)', () => {
      expect(service.formatCurrency(100000000)).toBe('¥1億');
      expect(service.formatCurrency(1234567890)).toBe('¥12億3,456万');
      expect(service.formatCurrency(10000000000)).toBe('¥100億');
    });

    it('should handle negative amounts', () => {
      expect(service.formatCurrency(-1000)).toBe('-¥1,000');
      expect(service.formatCurrency(-10000)).toBe('-¥1万');
      expect(service.formatCurrency(-100000000)).toBe('-¥1億');
    });

    it('should handle zero', () => {
      expect(service.formatCurrency(0)).toBe('¥0');
    });
  });

  describe('convertCurrency', () => {
    it('should convert USD to JPY', async () => {
      const result = await service.convertCurrency(100, 'USD');
      expect(result).toBe(15000); // 100 USD * 150 = 15,000 JPY
    });

    it('should convert EUR to JPY', async () => {
      const result = await service.convertCurrency(100, 'EUR');
      expect(result).toBe(16000); // 100 EUR * 160 = 16,000 JPY
    });

    it('should handle JPY (no conversion)', async () => {
      const result = await service.convertCurrency(10000, 'JPY');
      expect(result).toBe(10000);
    });

    it('should handle unknown currency (default to 1:1)', async () => {
      const result = await service.convertCurrency(100, 'XYZ');
      expect(result).toBe(100);
    });

    it('should round to nearest integer', async () => {
      const result = await service.convertCurrency(7, 'CNY');
      expect(result).toBe(147); // 7 * 21 = 147
    });
  });

  describe('handleMissingData', () => {
    it('should return data when present', () => {
      const result = service.handleMissingData('value', 'default', 'test');
      expect(result).toBe('value');
    });

    it('should return default when data is undefined', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const result = service.handleMissingData(undefined, 'default', 'test');
      
      expect(result).toBe('default');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Missing data: test')
      );
      
      consoleSpy.mockRestore();
    });

    it('should return default when data is null', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const result = service.handleMissingData(null, 'default', 'test');
      
      expect(result).toBe('default');
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('reconcileInconsistencies', () => {
    it('should adjust TAM when less than PAM', async () => {
      const inconsistentData: IntegratedData = {
        businessIdea: validInput.analystData.businessIdea,
        marketAnalysis: {
          ...validInput.analystData.marketAnalysis,
          tam: 100000000,  // 1億円
          pam: 200000000,  // 2億円（TAMより大きい）
          sam: 50000000,   // 5千万円
        },
        synergyAnalysis: validInput.analystData.synergyAnalysis,
        validationPlan: validInput.analystData.validationPlan,
        dataQuality: {
          completeness: 90,
          consistency: true,
          warnings: [],
        },
      };

      const result = await service.reconcileInconsistencies(inconsistentData);

      expect(result.marketAnalysis.tam).toBeGreaterThan(result.marketAnalysis.pam);
      expect(result.dataQuality.warnings).toContain('TAM adjusted to maintain hierarchy');
    });

    it('should adjust synergy score to match breakdown', async () => {
      const inconsistentData: IntegratedData = {
        businessIdea: validInput.analystData.businessIdea,
        marketAnalysis: validInput.analystData.marketAnalysis,
        synergyAnalysis: {
          ...validInput.analystData.synergyAnalysis,
          totalScore: 50,
          breakdown: {
            realEstateUtilization: 90,
            customerBaseUtilization: 90,
            brandValueEnhancement: 90,
          },
        },
        validationPlan: validInput.analystData.validationPlan,
        dataQuality: {
          completeness: 90,
          consistency: true,
          warnings: [],
        },
      };

      const result = await service.reconcileInconsistencies(inconsistentData);

      expect(result.synergyAnalysis.totalScore).toBe(90); // 平均値
      expect(result.dataQuality.warnings).toContain('Synergy score adjusted to match breakdown');
    });
  });

  describe('getDataIntegrationService', () => {
    it('should return singleton instance', () => {
      const instance1 = getDataIntegrationService();
      const instance2 = getDataIntegrationService();

      expect(instance1).toBe(instance2);
    });
  });
});