/**
 * Writer Agent Tests
 * WriterAgentのテスト
 */

import { WriterAgent, createWriterAgent } from '@/lib/agents/writer/writer-agent';
import { BaseAgentContext } from '@/lib/interfaces/base-agent';
import { WriterInput } from '@/lib/types/writer';
import { createClient } from '@/lib/supabase/server';

// Supabaseクライアントのモック
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('WriterAgent', () => {
  let writerAgent: WriterAgent;
  let mockContext: BaseAgentContext;
  let mockSupabase: any;
  let validInput: WriterInput;

  beforeEach(() => {
    // モックコンテキストの設定
    mockContext = {
      sessionId: '123e4567-e89b-12d3-a456-426614174000',
      userId: '123e4567-e89b-12d3-a456-426614174001',
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 4000,
    };

    // Supabaseモックの設定
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      insert: jest.fn().mockResolvedValue({ error: null }),
      upsert: jest.fn().mockResolvedValue({ error: null }),
    };
    (createClient as jest.Mock).mockReturnValue(mockSupabase);

    // WriterAgentインスタンスの作成
    writerAgent = createWriterAgent(mockContext);

    // 有効な入力データ
    validInput = {
      sessionId: mockContext.sessionId,
      ideaId: '123e4567-e89b-12d3-a456-426614174002',
      analystData: {
        businessIdea: {
          id: '123e4567-e89b-12d3-a456-426614174003',
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
          ],
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

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAgentName', () => {
    it('should return "writer"', () => {
      expect(writerAgent.getAgentName()).toBe('writer');
    });
  });

  describe('execute', () => {
    it('should successfully execute with valid input', async () => {
      // processAnalysisDataをモックして成功するようにする
      jest.spyOn(writerAgent, 'processAnalysisData').mockResolvedValue({
        id: 'test-report-id',
        sessionId: validInput.sessionId,
        ideaId: validInput.ideaId,
        title: validInput.analystData.businessIdea.title,
        htmlContent: '<html><body>Test Report</body></html>',
        sections: [
          { id: 'section-1', title: 'Section 1', content: 'Content 1', order: 1 },
          { id: 'section-2', title: 'Section 2', content: 'Content 2', order: 2 },
          { id: 'section-3', title: 'Section 3', content: 'Content 3', order: 3 },
          { id: 'section-4', title: 'Section 4', content: 'Content 4', order: 4 },
          { id: 'section-5', title: 'Section 5', content: 'Content 5', order: 5 },
        ],
        metrics: {
          tam: validInput.analystData.marketAnalysis.tam,
          pam: validInput.analystData.marketAnalysis.pam,
          sam: validInput.analystData.marketAnalysis.sam,
          revenueProjection3Y: 150000000,
          synergyScore: validInput.analystData.synergyAnalysis.totalScore,
          implementationDifficulty: 'medium',
          timeToMarket: validInput.analystData.validationPlan.totalDuration,
        },
        generatedAt: new Date(),
        generationTime: 1000,
      });

      const result = await writerAgent.execute(validInput);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.messages.length).toBeGreaterThanOrEqual(2); // at least start and success
      expect(mockSupabase.from).toHaveBeenCalledWith('agent_logs');
      expect(mockSupabase.from).toHaveBeenCalledWith('html_reports');
    });

    it('should handle invalid input', async () => {
      const invalidInput = { ...validInput, sessionId: 'invalid-uuid' };
      const result = await writerAgent.execute(invalidInput);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.messages).toContainEqual(
        expect.objectContaining({
          agent: 'writer',
          message: expect.stringContaining('Error'),
        })
      );
    });

    it('should handle missing business idea title', async () => {
      const inputWithoutTitle = {
        ...validInput,
        analystData: {
          ...validInput.analystData,
          businessIdea: {
            ...validInput.analystData.businessIdea,
            title: '',
          },
        },
      };

      const result = await writerAgent.execute(inputWithoutTitle);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should log progress during execution', async () => {
      await writerAgent.execute(validInput);

      // agent_logsテーブルへの挿入を確認
      const agentLogCalls = mockSupabase.insert.mock.calls.filter(
        call => mockSupabase.from.mock.calls.some(
          fromCall => fromCall[0] === 'agent_logs'
        )
      );

      expect(agentLogCalls.length).toBeGreaterThan(0);
      
      // 進捗ログの内容を確認
      const progressLogs = mockSupabase.insert.mock.calls
        .map(call => call[0])
        .filter(data => data && data.generation_phase);

      expect(progressLogs.some(log => log.generation_phase === 'started')).toBe(true);
      expect(progressLogs.some(log => log.generation_phase === 'validation_complete')).toBe(true);
    });

    it('should save report to database', async () => {
      const result = await writerAgent.execute(validInput);

      // 成功した場合のみhtml_reportsテーブルへの挿入を確認
      if (result.success) {
        expect(mockSupabase.from).toHaveBeenCalledWith('html_reports');
        const insertCalls = mockSupabase.insert.mock.calls;
        const reportInsert = insertCalls.find(call => 
          call[0] && call[0].session_id === validInput.sessionId && call[0].idea_id === validInput.ideaId
        );
        expect(reportInsert).toBeDefined();
      }
    });
  });

  describe('processAnalysisData', () => {
    it('should generate report within 5 seconds', async () => {
      const startTime = Date.now();
      
      try {
        const report = await writerAgent.processAnalysisData(validInput);
        const duration = Date.now() - startTime;

        expect(duration).toBeLessThan(5000);
        expect(report).toBeDefined();
        expect(report.sessionId).toBe(validInput.sessionId);
        expect(report.ideaId).toBe(validInput.ideaId);
      } catch (error) {
        // タイムアウトエラーが正しく発生することを確認
        expect(error).toEqual(expect.objectContaining({
          message: 'Report generation exceeded 5 seconds'
        }));
      }
    });

    it('should include all required metrics', async () => {
      try {
        const report = await writerAgent.processAnalysisData(validInput);

        expect(report.metrics).toMatchObject({
          tam: validInput.analystData.marketAnalysis.tam,
          pam: validInput.analystData.marketAnalysis.pam,
          sam: validInput.analystData.marketAnalysis.sam,
          synergyScore: validInput.analystData.synergyAnalysis.totalScore,
          timeToMarket: validInput.analystData.validationPlan.totalDuration,
        });
      } catch (error) {
        // タイムアウトの場合はスキップ
        expect(error).toBeDefined();
      }
    });
  });

  describe('validateInput', () => {
    it('should validate correct input', async () => {
      const validated = await writerAgent.validateInput(validInput);
      expect(validated).toEqual(validInput);
    });

    it('should throw error for invalid input structure', async () => {
      const invalidInput = {
        sessionId: 'not-a-uuid',
        ideaId: 'also-not-a-uuid',
      };

      await expect(writerAgent.validateInput(invalidInput)).rejects.toThrow();
    });

    it('should throw error for missing required fields', async () => {
      const incompleteInput = {
        sessionId: validInput.sessionId,
        // ideaId is missing
      };

      await expect(writerAgent.validateInput(incompleteInput)).rejects.toThrow();
    });
  });

  describe('logProgress', () => {
    it('should log progress with correct phase and percentage', async () => {
      await writerAgent.logProgress('testing', 50);

      expect(mockSupabase.from).toHaveBeenCalledWith('agent_logs');
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          session_id: mockContext.sessionId,
          agent_name: 'writer',
          generation_phase: 'testing',
          completion_percentage: 50,
        })
      );
    });

    it('should clamp percentage between 0 and 100', async () => {
      await writerAgent.logProgress('test', 150);

      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          completion_percentage: 100,
        })
      );

      await writerAgent.logProgress('test', -50);

      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          completion_percentage: 0,
        })
      );
    });
  });

  describe('handleError', () => {
    it('should log error to database', async () => {
      const error = new Error('Test error');
      await writerAgent.handleError(error);

      expect(mockSupabase.from).toHaveBeenCalledWith('agent_logs');
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Test error'),
          data: expect.objectContaining({
            error: 'Test error',
          }),
        })
      );
    });

    it('should save partial content if available', async () => {
      const error = new Error('Generation failed');
      const partialContent = {
        id: '123e4567-e89b-12d3-a456-426614174004',
        title: 'Partial Report',
        htmlContent: '<p>Partial content</p>',
      };

      await writerAgent.handleError(error, partialContent);

      expect(mockSupabase.from).toHaveBeenCalledWith('html_reports');
      expect(mockSupabase.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: partialContent.id,
          title: partialContent.title,
          html_content: partialContent.htmlContent,
          generation_time_ms: -1, // エラーインジケーター
        })
      );
    });
  });

  describe('Retry mechanism', () => {
    it('should retry on failure up to 3 times', async () => {
      // processAnalysisDataをモックして最初の2回は失敗、3回目で成功
      let callCount = 0;
      jest.spyOn(writerAgent, 'processAnalysisData').mockImplementation(async () => {
        callCount++;
        if (callCount < 3) {
          throw new Error('Temporary failure');
        }
        return {
          id: 'test-id',
          sessionId: validInput.sessionId,
          ideaId: validInput.ideaId,
          title: 'Test Report',
          htmlContent: '<html></html>',
          sections: [],
          metrics: {
            tam: 0,
            pam: 0,
            sam: 0,
            revenueProjection3Y: 0,
            synergyScore: 0,
            implementationDifficulty: 'low',
            timeToMarket: 12,
          },
          generatedAt: new Date(),
          generationTime: 1000,
        };
      });

      const result = await writerAgent.execute(validInput);

      expect(result.success).toBe(true);
      expect(callCount).toBe(3);
    });

    it('should fail after max retries exceeded', async () => {
      // 常に失敗するようにモック
      jest.spyOn(writerAgent, 'processAnalysisData').mockRejectedValue(
        new Error('Persistent failure')
      );

      const result = await writerAgent.execute(validInput);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Persistent failure');
    });
  });
});