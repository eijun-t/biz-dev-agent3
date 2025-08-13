/**
 * Report Generator Service
 * レポート生成サービス - HTMLレポートの生成
 */

import {
  WriterInput,
  HTMLReport,
  ReportSection,
  ReportMetrics,
  SectionType,
} from '@/lib/types/writer';
import { DataIntegrationService, getDataIntegrationService } from './data-integration-service';
import { HtmlTemplateService, getHtmlTemplateService } from './html-template-service';
import { SectionGeneratorService, getSectionGeneratorService } from './section-generator-service';

export class ReportGeneratorService {
  private dataIntegrationService: DataIntegrationService;
  private htmlTemplateService: HtmlTemplateService | null = null;
  private sectionGeneratorService: SectionGeneratorService | null = null;

  constructor() {
    this.dataIntegrationService = getDataIntegrationService();
  }

  private async ensureServices() {
    if (!this.htmlTemplateService) {
      this.htmlTemplateService = getHtmlTemplateService();
    }
    if (!this.sectionGeneratorService) {
      this.sectionGeneratorService = getSectionGeneratorService();
    }
  }

  /**
   * HTMLレポートを生成
   */
  async generateReport(input: WriterInput): Promise<HTMLReport> {
    await this.ensureServices();
    const startTime = Date.now();
    const reportId = this.generateReportId();

    // データ統合と検証
    const integratedData = await this.dataIntegrationService.integrateData(input);

    // セクションを並列生成
    const sections = await this.generateSections(integratedData);

    // メトリクスを計算
    const metrics = this.calculateMetrics(integratedData);

    // HTMLコンテンツを生成
    const htmlContent = await this.htmlTemplateService!.generateHtml(
      integratedData,
      sections,
      metrics
    );

    const generationTime = Date.now() - startTime;

    return {
      id: reportId,
      sessionId: input.sessionId,
      ideaId: input.ideaId,
      title: integratedData.businessIdea.title,
      htmlContent,
      sections,
      metrics,
      generatedAt: new Date(),
      generationTime,
    };
  }

  /**
   * セクションを並列生成
   */
  private async generateSections(data: any): Promise<ReportSection[]> {
    await this.ensureServices();
    const sectionPromises = [
      this.sectionGeneratorService!.generateExecutiveSummary(data),
      this.sectionGeneratorService!.generateBusinessIdea(data),
      this.sectionGeneratorService!.generateMarketAnalysis(data),
      this.sectionGeneratorService!.generateSynergyAnalysis(data),
      this.sectionGeneratorService!.generateValidationPlan(data),
    ];

    const sections = await Promise.all(sectionPromises);
    
    // セクションに順序を付与
    return sections.map((section, index) => ({
      ...section,
      order: index + 1,
    }));
  }

  /**
   * メトリクスを計算
   */
  private calculateMetrics(data: any): ReportMetrics {
    const { marketAnalysis, synergyAnalysis, validationPlan } = data;

    // 3年後の収益予測を計算（簡易版）
    const revenueProjection3Y = this.calculateRevenueProjection(
      marketAnalysis.sam,
      marketAnalysis.growthRate
    );

    // 実装難易度を判定
    const implementationDifficulty = this.assessImplementationDifficulty(
      validationPlan,
      synergyAnalysis.risks
    );

    return {
      tam: marketAnalysis.tam,
      pam: marketAnalysis.pam,
      sam: marketAnalysis.sam,
      revenueProjection3Y,
      synergyScore: synergyAnalysis.totalScore,
      implementationDifficulty,
      timeToMarket: validationPlan.totalDuration,
    };
  }

  /**
   * 3年後の収益予測を計算
   */
  private calculateRevenueProjection(sam: number, growthRate: number): number {
    // SAMの10%をターゲットシェアとして、成長率を加味して3年後を計算
    const targetShare = 0.1; // 10%
    const baseRevenue = sam * targetShare;
    const growthMultiplier = Math.pow(1 + growthRate / 100, 3);
    
    return Math.round(baseRevenue * growthMultiplier);
  }

  /**
   * 実装難易度を判定
   */
  private assessImplementationDifficulty(
    validationPlan: any,
    risks: any[]
  ): 'low' | 'medium' | 'high' {
    // 予算、期間、リスク数から難易度を判定
    const budget = validationPlan.requiredBudget;
    const duration = validationPlan.totalDuration;
    const riskCount = risks.length;

    let difficultyScore = 0;

    // 予算による判定（1億円以上で高難易度）
    if (budget >= 100000000) difficultyScore += 2;
    else if (budget >= 50000000) difficultyScore += 1;

    // 期間による判定（12ヶ月以上で高難易度）
    if (duration >= 12) difficultyScore += 2;
    else if (duration >= 6) difficultyScore += 1;

    // リスク数による判定（5個以上で高難易度）
    if (riskCount >= 5) difficultyScore += 2;
    else if (riskCount >= 3) difficultyScore += 1;

    // スコアから難易度を決定
    if (difficultyScore >= 4) return 'high';
    if (difficultyScore >= 2) return 'medium';
    return 'low';
  }

  /**
   * レポートIDを生成
   */
  private generateReportId(): string {
    return crypto.randomUUID();
  }

  /**
   * レポート生成のリトライ処理
   */
  async generateReportWithRetry(
    input: WriterInput,
    maxRetries: number = 3
  ): Promise<HTMLReport> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.generateReport(input);
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries) {
          // 指数バックオフ
          const delay = 1000 * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Failed to generate report after retries');
  }

  /**
   * セクションの更新
   */
  async updateSection(
    reportId: string,
    sectionType: SectionType,
    content: string
  ): Promise<ReportSection> {
    // セクションの更新ロジック（将来的な拡張用）
    return {
      id: crypto.randomUUID(),
      type: sectionType,
      title: this.getSectionTitle(sectionType),
      content,
      order: this.getSectionOrder(sectionType),
      metadata: {
        updatedAt: new Date(),
      },
    };
  }

  /**
   * セクションタイトルを取得
   */
  private getSectionTitle(type: SectionType): string {
    const titles: Record<SectionType, string> = {
      executive_summary: 'エグゼクティブサマリー',
      business_idea: 'ビジネスアイデア詳細',
      market_analysis: '市場分析',
      synergy_analysis: 'シナジー分析',
      validation_plan: '検証計画',
    };
    return titles[type];
  }

  /**
   * セクション順序を取得
   */
  private getSectionOrder(type: SectionType): number {
    const orders: Record<SectionType, number> = {
      executive_summary: 1,
      business_idea: 2,
      market_analysis: 3,
      synergy_analysis: 4,
      validation_plan: 5,
    };
    return orders[type];
  }
}

/**
 * ReportGeneratorServiceのシングルトンインスタンス
 */
let instance: ReportGeneratorService | null = null;

export function getReportGeneratorService(): ReportGeneratorService {
  if (!instance) {
    instance = new ReportGeneratorService();
  }
  return instance;
}