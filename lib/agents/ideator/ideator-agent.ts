/**
 * Ideator Agent
 * ビジネスアイデア生成エージェントのメインクラス
 */

import { ChatOpenAI } from '@langchain/openai';
import type { EnhancedOutput } from '../broad-researcher/enhanced-output-generator';
import type {
  BusinessIdea,
  IdeatorOutput,
  IdeationRequest,
  IdeationContext,
  ValidationResult,
  AgentConfig
} from '../../types/ideator';
import { CreativePromptBuilder } from './creative-prompt-builder';
import { LLMIntegrationService } from './llm-integration-service';
import { StructuredOutputGenerator } from './structured-output-generator';
import { QualityValidator } from './quality-validator';
import { IdeatorError, IdeatorErrorCode } from './errors';
import { DEFAULT_LLM_CONFIG, IDEATION_CONFIG } from './constants';

/**
 * IdeatorAgentのオプション
 */
export interface IdeatorAgentOptions {
  llm?: ChatOpenAI;
  config?: Partial<AgentConfig>;
  enableValidation?: boolean;
  enableLogging?: boolean;
}

/**
 * Ideatorエージェント
 */
export class IdeatorAgent {
  private promptBuilder: CreativePromptBuilder;
  private llmService: LLMIntegrationService;
  private outputGenerator: StructuredOutputGenerator;
  private validator: QualityValidator;
  private config: AgentConfig;
  private enableValidation: boolean;
  private enableLogging: boolean;

  constructor(options: IdeatorAgentOptions = {}) {
    // 設定の初期化
    this.config = {
      llmConfig: { ...DEFAULT_LLM_CONFIG, ...options.config?.llmConfig },
      ideationConfig: { ...IDEATION_CONFIG, ...options.config?.ideationConfig },
      validationConfig: options.config?.validationConfig || {
        enableValidation: true,
        minQualityScore: 60,
        maxRetries: 3
      }
    };

    this.enableValidation = options.enableValidation ?? true;
    this.enableLogging = options.enableLogging ?? false;

    // サービスの初期化
    this.promptBuilder = new CreativePromptBuilder();
    this.llmService = new LLMIntegrationService(options.llm);
    this.outputGenerator = new StructuredOutputGenerator(this.llmService);
    this.validator = new QualityValidator();

    // LLM設定を適用
    this.llmService.configureLLM(this.config.llmConfig);
  }

  /**
   * ビジネスアイデアを生成
   */
  async generateIdeas(
    researchOutput: any, // ResearcherOutputまたはEnhancedOutputを受け入れる
    request?: IdeationRequest
  ): Promise<IdeatorOutput> {
    try {
      this.log('Starting idea generation process...');

      // コンテキストを構築
      const context = this.buildContext(researchOutput);
      
      // リクエストの初期化
      const finalRequest: IdeationRequest = {
        numberOfIdeas: request?.numberOfIdeas || this.config.ideationConfig?.defaultNumberOfIdeas || 5,
        temperature: request?.temperature || this.config.llmConfig.temperature,
        maxTokens: request?.maxTokens || this.config.llmConfig.maxTokens,
        focusAreas: request?.focusAreas || [],
        constraints: request?.constraints || [],
        targetMarket: request?.targetMarket
      };

      // アイデアを生成
      let output = await this.outputGenerator.generateBusinessIdeas(
        context,
        finalRequest
      );

      // バリデーションを実行
      if (this.enableValidation) {
        output = await this.validateAndImprove(output, context, finalRequest);
      }

      // アイデアをランキング
      output.ideas = this.outputGenerator.rankIdeas(output.ideas);

      // トークン使用量を記録
      const tokenUsage = this.llmService.getTokenUsage();
      this.log(`Token usage - Prompt: ${tokenUsage.promptTokens}, Completion: ${tokenUsage.completionTokens}`);

      return output;
    } catch (error) {
      throw IdeatorError.fromError(error);
    }
  }

  /**
   * 単一のアイデアを生成
   */
  async generateSingleIdea(
    researchOutput: EnhancedOutput,
    focus?: string
  ): Promise<BusinessIdea> {
    try {
      const context = this.buildContext(researchOutput);
      const idea = await this.outputGenerator.generateSingleIdea(context, focus);

      if (this.enableValidation) {
        const validationResult = this.validator.validateIdea(idea);
        if (!validationResult.isValid) {
          this.log('Generated idea failed validation, attempting to refine...');
          const suggestions = this.validator.generateImprovementSuggestions(idea, validationResult);
          return await this.outputGenerator.refineIdea(idea, suggestions.join('\n'));
        }
      }

      return idea;
    } catch (error) {
      throw IdeatorError.fromError(error);
    }
  }

  /**
   * アイデアを改善
   */
  async refineIdea(
    idea: BusinessIdea,
    feedback: string
  ): Promise<BusinessIdea> {
    try {
      const refinedIdea = await this.outputGenerator.refineIdea(idea, feedback);
      
      if (this.enableValidation) {
        const validationResult = this.validator.validateIdea(refinedIdea);
        if (validationResult.qualityScore < this.config.validationConfig.minQualityScore) {
          this.log(`Refined idea quality score (${validationResult.qualityScore}) below threshold`);
        }
      }

      return refinedIdea;
    } catch (error) {
      throw IdeatorError.fromError(error);
    }
  }

  /**
   * アイデアを検証
   */
  validateIdea(idea: BusinessIdea): ValidationResult {
    return this.validator.validateIdea(idea);
  }

  /**
   * アイデアの強み・弱みを分析
   */
  analyzeIdea(idea: BusinessIdea): {
    strengths: string[];
    weaknesses: string[];
    validationResult: ValidationResult;
    suggestions: string[];
  } {
    const validationResult = this.validator.validateIdea(idea);
    const strengths = this.validator.analyzeStrengths(idea);
    const weaknesses = this.validator.analyzeWeaknesses(idea);
    const suggestions = this.validator.generateImprovementSuggestions(idea, validationResult);

    return {
      strengths,
      weaknesses,
      validationResult,
      suggestions
    };
  }

  /**
   * 設定を更新
   */
  updateConfig(config: Partial<AgentConfig>): void {
    if (config.llmConfig) {
      this.config.llmConfig = { ...this.config.llmConfig, ...config.llmConfig };
      this.llmService.configureLLM(this.config.llmConfig);
    }
    if (config.ideationConfig) {
      this.config.ideationConfig = { ...this.config.ideationConfig, ...config.ideationConfig };
    }
    if (config.validationConfig) {
      this.config.validationConfig = { ...this.config.validationConfig, ...config.validationConfig };
    }
  }

  /**
   * パフォーマンスメトリクスを取得
   */
  getMetrics() {
    return {
      tokenUsage: this.llmService.getTokenUsage(),
      performanceMetrics: this.llmService.getPerformanceMetrics()
    };
  }

  /**
   * トークン使用量をリセット
   */
  resetMetrics(): void {
    this.llmService.resetTokenUsage();
  }

  // Private methods

  /**
   * コンテキストを構築
   */
  private buildContext(researchOutput: any): IdeationContext {
    // ResearcherOutputの場合は、実際のresearchデータを取得
    const actualResearch = researchOutput.research || researchOutput;
    
    // 最小限の有効なEnhancedOutput構造を作成
    const enhancedOutput = {
      processedResearch: actualResearch,
      facts: actualResearch.keyFindings || [],
      metrics: {
        marketSize: this.parseMarketSize(actualResearch.insights?.marketSize || ''),
        growthRate: this.parseGrowthRate(actualResearch.insights?.growthRate || '')
      },
      entities: this.extractEntities(actualResearch),
      detailedAnalysis: actualResearch.detailedAnalysis || {
        opportunities: actualResearch.insights?.customerNeeds || [],
        competitiveLandscape: actualResearch.insights?.competitors?.join(', ') || ''
      }
    };
    
    const opportunities = this.promptBuilder.extractOpportunities(enhancedOutput);
    const customerPains = this.promptBuilder.identifyCustomerPains(enhancedOutput);
    const trends = this.promptBuilder.extractTrends(enhancedOutput);
    const competitiveLandscape = this.promptBuilder.summarizeCompetitiveLandscape(enhancedOutput);

    return {
      opportunities,
      customerPains,
      trends,
      competitiveLandscape,
      researchSummary: actualResearch.summary || ''
    };
  }
  
  private parseMarketSize(marketSizeStr: string): number {
    const match = marketSizeStr.match(/(\d+[\d,]*)\s*(億|兆)/);
    if (!match) return 0;
    const num = parseFloat(match[1].replace(/,/g, ''));
    return match[2] === '兆' ? num * 1000000000000 : num * 100000000;
  }
  
  private parseGrowthRate(growthRateStr: string): number {
    const match = growthRateStr.match(/(\d+[\d.]*)/);
    return match ? parseFloat(match[1]) : 10;
  }
  
  private extractEntities(research: any): any[] {
    const entities = [];
    if (research.insights?.competitors) {
      research.insights.competitors.forEach((name: string) => {
        entities.push({ type: 'competitor', name });
      });
    }
    return entities;
  }

  /**
   * バリデーションと改善
   */
  private async validateAndImprove(
    output: IdeatorOutput,
    context: IdeationContext,
    request: IdeationRequest
  ): Promise<IdeatorOutput> {
    const validationResult = this.validator.validateOutput(output);
    
    if (!validationResult.isValid || 
        validationResult.overallScore < this.config.validationConfig.minQualityScore) {
      
      this.log(`Validation failed or quality score too low (${validationResult.overallScore})`);
      
      // 無効なアイデアを改善
      const improvedIdeas: BusinessIdea[] = [];
      
      for (const idea of output.ideas) {
        const ideaValidation = this.validator.validateIdea(idea);
        
        if (!ideaValidation.isValid || 
            ideaValidation.qualityScore < this.config.validationConfig.minQualityScore) {
          
          const suggestions = this.validator.generateImprovementSuggestions(idea, ideaValidation);
          const improvedIdea = await this.outputGenerator.refineIdea(
            idea,
            suggestions.join('\n')
          );
          improvedIdeas.push(improvedIdea);
        } else {
          improvedIdeas.push(idea);
        }
      }

      // 不足分のアイデアを追加生成
      const targetCount = request.numberOfIdeas || this.config.ideationConfig?.defaultNumberOfIdeas || 5;
      while (improvedIdeas.length < targetCount) {
        const newIdea = await this.outputGenerator.generateSingleIdea(context);
        improvedIdeas.push(newIdea);
      }

      output.ideas = improvedIdeas;
    }

    return output;
  }

  /**
   * ログ出力
   */
  private log(message: string): void {
    if (this.enableLogging) {
      console.log(`[IdeatorAgent] ${message}`);
    }
  }
}