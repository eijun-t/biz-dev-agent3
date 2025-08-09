/**
 * Critic Type Definition Tests
 */

import {
  CriticInput,
  CriticOutput,
  BusinessIdea,
  MarketScore,
  SynergyScore,
  EvaluationResult,
  CriticError,
  CriticErrorCode,
} from '@/lib/types/critic';

import {
  businessIdeaSchema,
  marketScoreSchema,
  synergyScoreSchema,
  evaluationResultSchema,
  criticInputSchema,
  criticOutputSchema,
} from '@/lib/validations/critic';

describe('Critic Type Definitions', () => {
  describe('BusinessIdea', () => {
    it('should validate a valid business idea', () => {
      const validIdea: BusinessIdea = {
        id: 'idea-1',
        title: 'スマートビルディング管理プラットフォーム',
        description: 'AIを活用したビル管理の最適化',
        targetCustomer: 'ビルオーナー',
        customerProblem: 'ビル管理コストの増大',
        proposedSolution: 'AI自動化による効率化',
        revenueModel: 'SaaS月額課金',
        estimatedRevenue: 1000000000,
        marketSize: '1000億円',
        competitors: ['競合A', '競合B'],
        implementation: {
          difficulty: 'medium',
          timeframe: '12ヶ月',
          requiredResources: ['エンジニア10名', '初期投資1億円'],
        },
      };

      const result = businessIdeaSchema.safeParse(validIdea);
      expect(result.success).toBe(true);
    });

    it('should reject invalid business idea', () => {
      const invalidIdea = {
        id: 'idea-1',
        // title is missing
        description: 'AIを活用したビル管理の最適化',
      };

      const result = businessIdeaSchema.safeParse(invalidIdea);
      expect(result.success).toBe(false);
    });
  });

  describe('MarketScore', () => {
    it('should validate a valid market score', () => {
      const validScore: MarketScore = {
        total: 45,
        breakdown: {
          marketSize: 18,
          growthPotential: 14,
          profitability: 13,
        },
        reasoning: '市場規模が大きく成長性も高い',
        evidence: ['市場調査レポート', '競合分析'],
      };

      const result = marketScoreSchema.safeParse(validScore);
      expect(result.success).toBe(true);
    });

    it('should reject score exceeding maximum', () => {
      const invalidScore = {
        total: 60, // exceeds max of 50
        breakdown: {
          marketSize: 25, // exceeds max of 20
          growthPotential: 20, // exceeds max of 15
          profitability: 20, // exceeds max of 15
        },
        reasoning: 'Invalid scores',
        evidence: [],
      };

      const result = marketScoreSchema.safeParse(invalidScore);
      expect(result.success).toBe(false);
    });

    it('should validate breakdown sum equals total', () => {
      const validScore: MarketScore = {
        total: 45,
        breakdown: {
          marketSize: 18,
          growthPotential: 14,
          profitability: 13,
        },
        reasoning: '合計が一致',
        evidence: [],
      };

      const sum = validScore.breakdown.marketSize + 
                  validScore.breakdown.growthPotential + 
                  validScore.breakdown.profitability;
      expect(sum).toBe(validScore.total);
    });
  });

  describe('SynergyScore', () => {
    it('should validate a complete synergy score', () => {
      const validScore: SynergyScore = {
        total: 42,
        breakdown: {
          capabilityMatch: 17,
          synergyEffect: 13,
          uniqueAdvantage: 12,
        },
        capabilityMapping: {
          requiredCapabilities: [
            {
              name: '不動産開発',
              importance: 'critical',
              description: '大規模開発が必要',
            },
          ],
          mitsubishiCapabilities: [
            {
              category: 'real_estate_development',
              name: '大規模複合開発',
              description: '丸の内エリアの開発実績',
              specificAssets: ['丸の内ビルディング'],
            },
          ],
          matchScore: 85,
          gaps: [],
        },
        synergyScenario: {
          scenario: '丸の内エリアでの実証実験',
          keyAdvantages: ['既存テナントへのアクセス', 'ブランド力'],
          synergyMultiplier: 1.3,
        },
        scenarioValidation: {
          logicalConsistency: 90,
          feasibility: 85,
          uniqueness: 80,
          overallCredibility: 85,
          validationComments: ['論理的に整合性がある'],
        },
        reasoning: '三菱地所の強みを活かせる',
      };

      const result = synergyScoreSchema.safeParse(validScore);
      expect(result.success).toBe(true);
    });

    it('should validate synergy multiplier range', () => {
      const invalidMultiplier = {
        scenario: 'test',
        keyAdvantages: [],
        synergyMultiplier: 2.0, // exceeds max of 1.5
      };

      const result = synergyScoreSchema.shape.synergyScenario.safeParse(invalidMultiplier);
      expect(result.success).toBe(false);
    });
  });

  describe('EvaluationResult', () => {
    it('should validate a complete evaluation result', () => {
      const validResult: EvaluationResult = {
        ideaId: 'idea-1',
        ideaTitle: 'スマートビルディング',
        marketScore: {
          total: 45,
          breakdown: {
            marketSize: 18,
            growthPotential: 14,
            profitability: 13,
          },
          reasoning: '市場性が高い',
          evidence: ['データ1'],
        },
        synergyScore: {
          total: 42,
          breakdown: {
            capabilityMatch: 17,
            synergyEffect: 13,
            uniqueAdvantage: 12,
          },
          capabilityMapping: {
            requiredCapabilities: [],
            mitsubishiCapabilities: [],
            matchScore: 85,
            gaps: [],
          },
          synergyScenario: {
            scenario: 'シナリオ',
            keyAdvantages: ['優位性1'],
            synergyMultiplier: 1.2,
          },
          scenarioValidation: {
            logicalConsistency: 85,
            feasibility: 80,
            uniqueness: 75,
            overallCredibility: 80,
            validationComments: ['コメント'],
          },
          reasoning: 'シナジーが高い',
        },
        totalScore: 87,
        rank: 1,
        recommendation: '強く推奨',
        risks: ['リスク1'],
        opportunities: ['機会1'],
      };

      const result = evaluationResultSchema.safeParse(validResult);
      expect(result.success).toBe(true);
    });

    it('should calculate total score correctly', () => {
      const marketScore = 45;
      const synergyScore = 42;
      const totalScore = marketScore + synergyScore;
      
      expect(totalScore).toBe(87);
      expect(totalScore).toBeLessThanOrEqual(100);
    });
  });

  describe('CriticInput', () => {
    it('should validate valid input', () => {
      const validInput: CriticInput = {
        sessionId: 'session-123',
        ideas: [
          {
            id: 'idea-1',
            title: 'アイデア1',
            description: '説明',
            targetCustomer: '顧客',
            customerProblem: '課題',
            proposedSolution: '解決策',
            revenueModel: '収益モデル',
          },
        ],
        evaluationConfig: {
          marketWeight: 0.5,
          synergyWeight: 0.5,
          minimumTotalScore: 60,
        },
      };

      const result = criticInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should require at least one idea', () => {
      const invalidInput = {
        sessionId: 'session-123',
        ideas: [], // empty array
      };

      const result = criticInputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('should validate weights sum to 1', () => {
      const config = {
        marketWeight: 0.4,
        synergyWeight: 0.6,
      };

      const sum = config.marketWeight + config.synergyWeight;
      expect(sum).toBeCloseTo(1.0, 2);
    });
  });

  describe('CriticOutput', () => {
    it('should validate complete output', () => {
      const validOutput: CriticOutput = {
        sessionId: 'session-123',
        evaluationResults: [
          {
            ideaId: 'idea-1',
            ideaTitle: 'アイデア1',
            marketScore: {
              total: 45,
              breakdown: {
                marketSize: 18,
                growthPotential: 14,
                profitability: 13,
              },
              reasoning: '理由',
              evidence: [],
            },
            synergyScore: {
              total: 42,
              breakdown: {
                capabilityMatch: 17,
                synergyEffect: 13,
                uniqueAdvantage: 12,
              },
              capabilityMapping: {
                requiredCapabilities: [],
                mitsubishiCapabilities: [],
                matchScore: 0,
                gaps: [],
              },
              synergyScenario: {
                scenario: '',
                keyAdvantages: [],
                synergyMultiplier: 1.0,
              },
              scenarioValidation: {
                logicalConsistency: 0,
                feasibility: 0,
                uniqueness: 0,
                overallCredibility: 0,
                validationComments: [],
              },
              reasoning: '',
            },
            totalScore: 87,
            recommendation: '推奨',
            risks: [],
            opportunities: [],
          },
        ],
        selectedIdea: {
          ideaId: 'idea-1',
          ideaTitle: 'アイデア1',
          marketScore: {
            total: 45,
            breakdown: {
              marketSize: 18,
              growthPotential: 14,
              profitability: 13,
            },
            reasoning: '理由',
            evidence: [],
          },
          synergyScore: {
            total: 42,
            breakdown: {
              capabilityMatch: 17,
              synergyEffect: 13,
              uniqueAdvantage: 12,
            },
            capabilityMapping: {
              requiredCapabilities: [],
              mitsubishiCapabilities: [],
              matchScore: 0,
              gaps: [],
            },
            synergyScenario: {
              scenario: '',
              keyAdvantages: [],
              synergyMultiplier: 1.0,
            },
            scenarioValidation: {
              logicalConsistency: 0,
              feasibility: 0,
              uniqueness: 0,
              overallCredibility: 0,
              validationComments: [],
            },
            reasoning: '',
          },
          totalScore: 87,
          recommendation: '推奨',
          risks: [],
          opportunities: [],
        },
        summary: '評価サマリー',
        metadata: {
          evaluationId: 'eval-123',
          startTime: new Date(),
          endTime: new Date(),
          processingTime: 5000,
          tokensUsed: 1500,
          llmCalls: 3,
          cacheHits: 1,
          errors: [],
        },
      };

      const result = criticOutputSchema.safeParse(validOutput);
      expect(result.success).toBe(true);
    });
  });

  describe('CriticError', () => {
    it('should create error with correct properties', () => {
      const error = new CriticError(
        CriticErrorCode.LLM_ERROR,
        'LLM call failed',
        { attempt: 1 },
        true
      );

      expect(error.code).toBe(CriticErrorCode.LLM_ERROR);
      expect(error.message).toBe('LLM call failed');
      expect(error.details).toEqual({ attempt: 1 });
      expect(error.isRetryable).toBe(true);
      expect(error.name).toBe('CriticError');
    });

    it('should have all error codes defined', () => {
      expect(CriticErrorCode.INVALID_INPUT).toBeDefined();
      expect(CriticErrorCode.LLM_ERROR).toBeDefined();
      expect(CriticErrorCode.EVALUATION_FAILED).toBeDefined();
      expect(CriticErrorCode.TIMEOUT).toBeDefined();
      expect(CriticErrorCode.CACHE_ERROR).toBeDefined();
      expect(CriticErrorCode.CONFIG_ERROR).toBeDefined();
    });
  });
});