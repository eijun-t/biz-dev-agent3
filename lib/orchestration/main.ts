/**
 * メインオーケストレーション - Kiro仕様準拠
 * 5つのエージェントを順次実行するシンプルな実装
 */

import { ProductionResearcherAgent } from '@/lib/agents/broad-researcher/production-researcher-agent';
import { IdeatorAgentAdapter } from '@/lib/agents/ideator/ideator-agent-adapter';
import { CriticAgentAdapter } from '@/lib/agents/critic/critic-agent-adapter';
// import { AnalystAgent } from '@/lib/agents/analyst/analyst-agent';
import { AnalystAgentImpl } from '@/lib/agents/analyst/analyst-agent-impl';
import { WriterAgent } from '@/lib/agents/writer/writer-agent';
import { ChatOpenAI } from '@langchain/openai';
// import { SerperSearchService } from '@/lib/services/serper/serper-search-service';
import { GoogleSearchService } from '@/lib/services/google/google-search-service';
import type { SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { createServiceLogger } from '@/lib/utils/logger';

const logger = createServiceLogger('OrchestrationMain');

export interface OrchestrationConfig {
  sessionId: string;
  userId: string;
  topic: string;
  supabase: SupabaseClient;
  onProgress?: (progress: number, message: string) => void;
}

export interface OrchestrationResult {
  success: boolean;
  data?: {
    researcher: any;
    ideator: any;
    critic: any;
    analyst: any;
    writer: any;
  };
  error?: string;
}

export class MainOrchestration {
  private llm: ChatOpenAI;
  private searchService: GoogleSearchService;
  
  constructor() {
    this.llm = new ChatOpenAI({
      modelName: 'gpt-4o',
      temperature: 0.7,
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Google Custom Search APIを使用
    this.searchService = new GoogleSearchService({
      apiKey: process.env.GOOGLE_API_KEY!,
      searchEngineId: process.env.GOOGLE_SEARCH_ENGINE_ID!,
      defaultLimit: 10,
    });
  }

  /**
   * 5つのエージェントを順次実行
   */
  async execute(config: OrchestrationConfig): Promise<OrchestrationResult> {
    const { sessionId, userId, topic, supabase, onProgress } = config;
    const results: any = {};
    
    const baseContext = {
      sessionId,
      userId,
      model: 'gpt-4o',
      temperature: 0.7,
      maxTokens: 4000,
    };

    try {
      // 1. Researcher (20%)
      if (onProgress) onProgress(10, 'リサーチを開始...');
      const researcher = new ProductionResearcherAgent(baseContext, this.searchService, this.llm, supabase);
      const researchResult = await researcher.execute({ theme: topic, sessionId });
      if (!researchResult.success) throw new Error('Research failed');
      results.researcher = researchResult.data;
      if (onProgress) onProgress(20, 'リサーチ完了');

      // 2. Ideator (40%)
      if (onProgress) onProgress(30, 'アイデア生成中...');
      const ideator = new IdeatorAgentAdapter(baseContext);
      const ideatorResult = await ideator.execute({
        researchOutput: results.researcher,
        config: { model: 'gpt-4o', temperature: 0.7 }
      });
      if (!ideatorResult.success) throw new Error('Ideation failed');
      results.ideator = ideatorResult.data;
      if (onProgress) onProgress(40, 'アイデア生成完了');

      // 3. Critic (60%)
      if (onProgress) onProgress(50, 'アイデア評価中...');
      const critic = new CriticAgentAdapter(baseContext);
      const criticResult = await critic.execute({
        sessionId,
        ideatorOutput: results.ideator,
        researcherOutput: results.researcher
      });
      if (!criticResult.success) {
        logger.error('Critic failed', new Error(criticResult.error || 'Unknown error'), {
          sessionId: config.sessionId
        });
        throw new Error(`Evaluation failed: ${criticResult.error}`);
      }
      results.critic = criticResult.data;
      if (onProgress) onProgress(60, '評価完了');

      // 4. Analyst (80%)
      console.log('=== ANALYST AGENT STARTING ===');
      if (onProgress) onProgress(70, '詳細分析中...');
      const analyst = new AnalystAgentImpl(baseContext);
      const analystResult = await analyst.execute({
        sessionId,
        selectedIdea: results.critic.selectedIdea,
        researchData: results.researcher
      });
      console.log('Analyst result:', analystResult.success ? 'SUCCESS' : 'FAILED');
      if (!analystResult.success) throw new Error('Analysis failed');
      results.analyst = analystResult.data;
      if (onProgress) onProgress(80, '分析完了');

      // 5. Writer (100%)
      console.log('=== WRITER AGENT STARTING ===');
      if (onProgress) onProgress(90, 'レポート作成中...');
      const writer = new WriterAgent({ ...baseContext, timeout: 300000 });
      
      // Writerの入力形式に合わせる
      const selectedIdea = results.critic.selectedIdea || results.critic.selectedIdeas?.[0];
      const ideaId = uuidv4();
      
      // Analystの出力を確認
      console.log('[Orchestration] Analyst output structure:', {
        hasAnalyst: !!results.analyst,
        hasIdeaId: !!results.analyst?.ideaId,
        ideaIdValue: results.analyst?.ideaId,
        hasAnalystData: !!results.analyst?.analystData,
        analystDataKeys: results.analyst?.analystData ? Object.keys(results.analyst.analystData) : []
      });
      
      // AnalystのデータをそのままWriterに渡す
      const writerInput = {
        sessionId,
        ideaId: results.analyst?.ideaId || ideaId,
        analystData: results.analyst?.analystData || {},
        metadata: {
          generatedAt: new Date(),
          version: '1.0.0',
        },
      };
      
      console.log('[Orchestration] Writer input:', {
        sessionId: writerInput.sessionId,
        ideaId: writerInput.ideaId,
        hasAnalystData: !!writerInput.analystData,
        businessIdeaId: writerInput.analystData?.businessIdea?.id
      });
      
      const writerResult = await writer.execute(writerInput);
      if (!writerResult.success) {
        logger.error('Writer failed', new Error(writerResult.error || 'Unknown error'), {
          sessionId: config.sessionId
        });
        logger.debug('Writer input data', {
          hasSelectedIdeas: !!results.critic.selectedIdeas,
          selectedIdeasCount: results.critic.selectedIdeas?.length,
          hasAnalysisData: !!results.analyst,
          hasResearchData: !!results.researcher
        });
        throw new Error(`Report generation failed: ${writerResult.error}`);
      }
      results.writer = writerResult.data;
      if (onProgress) onProgress(100, '完了');

      return { success: true, data: results };
      
    } catch (error) {
      logger.error('Orchestration error', error as Error, {
        sessionId: config.sessionId,
        topic: config.topic
      });
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}