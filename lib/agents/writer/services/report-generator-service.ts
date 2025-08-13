/**
 * Report Generator Service
 * レポート生成サービス - HTMLレポートの生成と整形を担当
 */

import {
  WriterInput,
  HTMLReport,
  ReportSection,
  ReportMetrics,
  IntegratedData,
} from '@/lib/types/writer';
import { getDataIntegrationService } from './data-integration-service';

export class ReportGeneratorService {
  private dataIntegrationService = getDataIntegrationService();
  private readonly sectionGenerationTimeout = 1000; // 1秒/セクション
  private readonly maxConcurrentSections = 3;

  /**
   * HTMLレポートを生成
   */
  async generateReport(input: WriterInput): Promise<HTMLReport> {
    const startTime = Date.now();
    
    // データ統合
    const integratedData = await this.dataIntegrationService.integrateData(input);
    
    // データの不整合を修正
    const reconciledData = await this.dataIntegrationService.reconcileInconsistencies(
      integratedData
    );

    // レポートID生成
    const reportId = this.generateReportId();
    
    // メトリクス計算
    const metrics = await this.calculateMetrics(reconciledData);
    
    // セクション生成（並列処理）
    const sections = await this.generateSections(reconciledData);
    
    // HTML生成
    const htmlContent = await this.composeHTML(
      reconciledData.businessIdea.title,
      sections,
      metrics,
      reconciledData.dataQuality
    );

    const generationTime = Date.now() - startTime;

    return {
      id: reportId,
      sessionId: input.sessionId,
      ideaId: input.ideaId,
      title: reconciledData.businessIdea.title,
      htmlContent,
      sections,
      metrics,
      generatedAt: new Date(),
      generationTime,
    };
  }

  /**
   * レポートID生成
   */
  private generateReportId(): string {
    return `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * メトリクス計算
   */
  private async calculateMetrics(data: IntegratedData): Promise<ReportMetrics> {
    const { marketAnalysis, synergyAnalysis, validationPlan } = data;
    
    // 3年間の収益予測を計算
    const revenueProjection3Y = this.calculateRevenueProjection(
      marketAnalysis.sam,
      marketAnalysis.growthRate
    );
    
    // 実装難易度を判定
    const implementationDifficulty = this.assessImplementationDifficulty(
      validationPlan,
      synergyAnalysis.totalScore
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
   * 3年間の収益予測計算
   */
  private calculateRevenueProjection(sam: number, growthRate: number): number {
    // SAMの10%を初年度シェアとして、成長率を適用
    const year1 = sam * 0.1;
    const year2 = year1 * (1 + growthRate / 100);
    const year3 = year2 * (1 + growthRate / 100);
    
    return Math.round(year1 + year2 + year3);
  }

  /**
   * 実装難易度を評価
   */
  private assessImplementationDifficulty(
    validationPlan: any,
    synergyScore: number
  ): 'low' | 'medium' | 'high' {
    const budget = validationPlan.requiredBudget;
    const duration = validationPlan.totalDuration;
    const phases = validationPlan.phases.length;
    
    // スコアリング
    let difficultyScore = 0;
    
    // 予算による評価
    if (budget > 500000000) difficultyScore += 3; // 5億円以上
    else if (budget > 100000000) difficultyScore += 2; // 1億円以上
    else difficultyScore += 1;
    
    // 期間による評価
    if (duration > 18) difficultyScore += 3; // 18ヶ月以上
    else if (duration > 12) difficultyScore += 2; // 12ヶ月以上
    else difficultyScore += 1;
    
    // フェーズ数による評価
    if (phases > 4) difficultyScore += 2;
    else if (phases > 2) difficultyScore += 1;
    
    // シナジースコアによる調整
    if (synergyScore > 80) difficultyScore -= 1;
    else if (synergyScore < 50) difficultyScore += 1;
    
    // 判定
    if (difficultyScore >= 7) return 'high';
    if (difficultyScore >= 4) return 'medium';
    return 'low';
  }

  /**
   * セクション生成（並列処理）
   */
  private async generateSections(data: IntegratedData): Promise<ReportSection[]> {
    const sectionGenerators = [
      () => this.generateExecutiveSummary(data),
      () => this.generateBusinessOverview(data),
      () => this.generateMarketAnalysis(data),
      () => this.generateSynergyAnalysis(data),
      () => this.generateImplementationPlan(data),
    ];

    // 並列実行（最大3つまで同時実行）
    const sections: ReportSection[] = [];
    
    for (let i = 0; i < sectionGenerators.length; i += this.maxConcurrentSections) {
      const batch = sectionGenerators.slice(i, i + this.maxConcurrentSections);
      const batchResults = await Promise.all(
        batch.map(generator => 
          this.generateSectionWithTimeout(generator)
        )
      );
      sections.push(...batchResults);
    }

    return sections;
  }

  /**
   * タイムアウト付きセクション生成
   */
  private async generateSectionWithTimeout(
    generator: () => Promise<ReportSection>
  ): Promise<ReportSection> {
    return Promise.race([
      generator(),
      new Promise<ReportSection>((_, reject) =>
        setTimeout(
          () => reject(new Error('Section generation timeout')),
          this.sectionGenerationTimeout
        )
      ),
    ]);
  }

  /**
   * エグゼクティブサマリー生成
   */
  private async generateExecutiveSummary(data: IntegratedData): Promise<ReportSection> {
    const { businessIdea, marketAnalysis, synergyAnalysis } = data;
    
    const summary = `${businessIdea.title}は、${businessIdea.targetCustomer.segment}を対象とした` +
      `${businessIdea.valueProposition.uniqueValue}を提供する新規事業です。` +
      `市場規模は${this.dataIntegrationService.formatCurrency(marketAnalysis.tam)}で、` +
      `シナジースコア${synergyAnalysis.totalScore}点と高い評価を得ています。`;

    const keyPoints = [
      `ターゲット市場: ${businessIdea.targetCustomer.segment}`,
      `独自価値: ${businessIdea.valueProposition.uniqueValue}`,
      `市場規模: TAM ${this.dataIntegrationService.formatCurrency(marketAnalysis.tam)}`,
      `シナジースコア: ${synergyAnalysis.totalScore}点`,
      `市場成長率: ${marketAnalysis.growthRate}%`,
    ];

    return {
      id: 'executive-summary',
      title: 'エグゼクティブサマリー',
      content: `
        <div class="executive-summary">
          <p class="summary-text">${summary}</p>
          <ul class="key-points">
            ${keyPoints.map(point => `<li>${point}</li>`).join('')}
          </ul>
        </div>
      `,
      order: 1,
    };
  }

  /**
   * ビジネス概要生成
   */
  private async generateBusinessOverview(data: IntegratedData): Promise<ReportSection> {
    const { businessIdea } = data;
    
    return {
      id: 'business-overview',
      title: 'ビジネス概要',
      content: `
        <div class="business-overview">
          <h3>事業概要</h3>
          <p>${businessIdea.description}</p>
          
          <h3>顧客セグメント</h3>
          <div class="customer-segment">
            <p><strong>対象:</strong> ${businessIdea.targetCustomer.segment}</p>
            <p><strong>年齢層:</strong> ${businessIdea.targetCustomer.ageRange}</p>
            <p><strong>職業:</strong> ${businessIdea.targetCustomer.occupation}</p>
            <p><strong>ニーズ:</strong> ${businessIdea.targetCustomer.needs.join(', ')}</p>
          </div>
          
          <h3>顧客の課題</h3>
          <ul>
            ${businessIdea.customerProblem.problems.map(p => `<li>${p}</li>`).join('')}
          </ul>
          <p><strong>優先度:</strong> ${this.translatePriority(businessIdea.customerProblem.priority)}</p>
          
          <h3>提供価値</h3>
          <p><strong>独自価値:</strong> ${businessIdea.valueProposition.uniqueValue}</p>
          <p><strong>競争優位性:</strong></p>
          <ul>
            ${businessIdea.valueProposition.competitiveAdvantage.map(a => `<li>${a}</li>`).join('')}
          </ul>
          
          <h3>収益構造</h3>
          <p><strong>収益源:</strong> ${businessIdea.revenueStructure.sources.join(', ')}</p>
          <p><strong>価格設定:</strong> ${businessIdea.revenueStructure.pricing}</p>
          <p><strong>コスト構造:</strong> ${businessIdea.revenueStructure.costStructure}</p>
        </div>
      `,
      order: 2,
    };
  }

  /**
   * 市場分析セクション生成
   */
  private async generateMarketAnalysis(data: IntegratedData): Promise<ReportSection> {
    const { marketAnalysis } = data;
    const formatter = this.dataIntegrationService.formatCurrency.bind(this.dataIntegrationService);
    
    return {
      id: 'market-analysis',
      title: '市場分析',
      content: `
        <div class="market-analysis">
          <h3>市場規模</h3>
          <div class="market-size">
            <div class="market-metric">
              <label>TAM (総市場規模)</label>
              <value>${formatter(marketAnalysis.tam)}</value>
            </div>
            <div class="market-metric">
              <label>PAM (獲得可能市場)</label>
              <value>${formatter(marketAnalysis.pam)}</value>
            </div>
            <div class="market-metric">
              <label>SAM (サービス提供可能市場)</label>
              <value>${formatter(marketAnalysis.sam)}</value>
            </div>
            <div class="market-metric">
              <label>市場成長率</label>
              <value>${marketAnalysis.growthRate}%/年</value>
            </div>
          </div>
          
          <h3>市場トレンド</h3>
          <ul>
            ${marketAnalysis.marketTrends.map(trend => `<li>${trend}</li>`).join('')}
          </ul>
          
          ${marketAnalysis.competitors.length > 0 ? `
            <h3>競合分析</h3>
            <div class="competitors">
              ${marketAnalysis.competitors.map(comp => `
                <div class="competitor-card">
                  <h4>${comp.name}</h4>
                  <p><strong>市場シェア:</strong> ${comp.marketShare}%</p>
                  <p><strong>強み:</strong> ${comp.strengths.join(', ')}</p>
                  <p><strong>弱み:</strong> ${comp.weaknesses.join(', ')}</p>
                  ${comp.revenue ? `<p><strong>収益:</strong> ${formatter(comp.revenue)}</p>` : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}
          
          ${marketAnalysis.regulations.length > 0 ? `
            <h3>規制・法令</h3>
            <ul>
              ${marketAnalysis.regulations.map(reg => `<li>${reg}</li>`).join('')}
            </ul>
          ` : ''}
        </div>
      `,
      order: 3,
    };
  }

  /**
   * シナジー分析セクション生成
   */
  private async generateSynergyAnalysis(data: IntegratedData): Promise<ReportSection> {
    const { synergyAnalysis } = data;
    
    return {
      id: 'synergy-analysis',
      title: 'シナジー分析',
      content: `
        <div class="synergy-analysis">
          <h3>シナジースコア</h3>
          <div class="synergy-score">
            <div class="total-score">${synergyAnalysis.totalScore}/100</div>
            <div class="score-breakdown">
              <div class="score-item">
                <label>不動産資産活用</label>
                <progress value="${synergyAnalysis.breakdown.realEstateUtilization}" max="100"></progress>
                <span>${synergyAnalysis.breakdown.realEstateUtilization}点</span>
              </div>
              <div class="score-item">
                <label>顧客基盤活用</label>
                <progress value="${synergyAnalysis.breakdown.customerBaseUtilization}" max="100"></progress>
                <span>${synergyAnalysis.breakdown.customerBaseUtilization}点</span>
              </div>
              <div class="score-item">
                <label>ブランド価値向上</label>
                <progress value="${synergyAnalysis.breakdown.brandValueEnhancement}" max="100"></progress>
                <span>${synergyAnalysis.breakdown.brandValueEnhancement}点</span>
              </div>
            </div>
          </div>
          
          ${synergyAnalysis.initiatives.length > 0 ? `
            <h3>シナジー創出施策</h3>
            <div class="initiatives">
              ${synergyAnalysis.initiatives.map(init => `
                <div class="initiative-card priority-${init.priority}">
                  <h4>${init.title}</h4>
                  <p><strong>優先度:</strong> ${this.translatePriority(init.priority)}</p>
                  <p><strong>期待効果:</strong> ${init.expectedImpact}</p>
                </div>
              `).join('')}
            </div>
          ` : ''}
          
          ${synergyAnalysis.risks.length > 0 ? `
            <h3>リスクと対策</h3>
            <div class="risks">
              ${synergyAnalysis.risks.map(risk => `
                <div class="risk-card">
                  <p><strong>リスク:</strong> ${risk.description}</p>
                  <p><strong>対策:</strong> ${risk.mitigation}</p>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      `,
      order: 4,
    };
  }

  /**
   * 実装計画セクション生成
   */
  private async generateImplementationPlan(data: IntegratedData): Promise<ReportSection> {
    const { validationPlan } = data;
    const formatter = this.dataIntegrationService.formatCurrency.bind(this.dataIntegrationService);
    
    return {
      id: 'implementation-plan',
      title: '実装計画',
      content: `
        <div class="implementation-plan">
          <h3>全体計画</h3>
          <div class="plan-overview">
            <p><strong>総期間:</strong> ${validationPlan.totalDuration}ヶ月</p>
            <p><strong>必要予算:</strong> ${formatter(validationPlan.requiredBudget)}</p>
            <p><strong>フェーズ数:</strong> ${validationPlan.phases.length}</p>
          </div>
          
          <h3>フェーズ詳細</h3>
          <div class="phases">
            ${validationPlan.phases.map((phase, index) => `
              <div class="phase-card">
                <h4>Phase ${index + 1}: ${phase.name}</h4>
                <p><strong>期間:</strong> ${phase.duration}ヶ月</p>
                
                <p><strong>マイルストーン:</strong></p>
                <ul>
                  ${phase.milestones.map(m => `<li>${m}</li>`).join('')}
                </ul>
                
                <p><strong>KPI:</strong></p>
                <ul>
                  ${phase.kpis.map(kpi => `
                    <li>${kpi.metric}: ${kpi.target}${typeof kpi.target === 'number' ? '' : ''}</li>
                  `).join('')}
                </ul>
                
                <p><strong>必要リソース:</strong></p>
                <ul>
                  <li>人員: ${phase.requiredResources.personnel}名</li>
                  <li>予算: ${formatter(phase.requiredResources.budget)}</li>
                  <li>技術: ${phase.requiredResources.technology.join(', ')}</li>
                </ul>
                
                <p><strong>Go/No-Go判定基準:</strong></p>
                <ul>
                  ${phase.goNoGoCriteria.map(c => `<li>${c}</li>`).join('')}
                </ul>
              </div>
            `).join('')}
          </div>
        </div>
      `,
      order: 5,
    };
  }

  /**
   * 優先度の日本語変換
   */
  private translatePriority(priority: string): string {
    const map: Record<string, string> = {
      'high': '高',
      'medium': '中',
      'low': '低',
    };
    return map[priority.toLowerCase()] || priority;
  }

  /**
   * HTMLコンポーズ
   */
  private async composeHTML(
    title: string,
    sections: ReportSection[],
    metrics: ReportMetrics,
    dataQuality: any
  ): Promise<string> {
    const sortedSections = sections.sort((a, b) => a.order - b.order);
    const formatter = this.dataIntegrationService.formatCurrency.bind(this.dataIntegrationService);
    
    return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - ビジネスレポート</title>
  <style>
    ${this.getReportStyles()}
  </style>
</head>
<body>
  <div class="report-container">
    <header class="report-header">
      <h1>${title}</h1>
      <div class="report-meta">
        <span>生成日時: ${new Date().toLocaleString('ja-JP')}</span>
        <span>データ品質: ${dataQuality.completeness}%</span>
      </div>
    </header>
    
    <div class="metrics-dashboard">
      <h2>主要指標</h2>
      <div class="metrics-grid">
        <div class="metric-card">
          <label>TAM</label>
          <value>${formatter(metrics.tam)}</value>
        </div>
        <div class="metric-card">
          <label>PAM</label>
          <value>${formatter(metrics.pam)}</value>
        </div>
        <div class="metric-card">
          <label>SAM</label>
          <value>${formatter(metrics.sam)}</value>
        </div>
        <div class="metric-card">
          <label>3年収益予測</label>
          <value>${formatter(metrics.revenueProjection3Y)}</value>
        </div>
        <div class="metric-card">
          <label>シナジースコア</label>
          <value>${metrics.synergyScore}/100</value>
        </div>
        <div class="metric-card">
          <label>実装難易度</label>
          <value>${this.translateDifficulty(metrics.implementationDifficulty)}</value>
        </div>
        <div class="metric-card">
          <label>市場投入期間</label>
          <value>${metrics.timeToMarket}ヶ月</value>
        </div>
      </div>
    </div>
    
    <main class="report-content">
      ${sortedSections.map(section => `
        <section id="${section.id}" class="report-section">
          <h2>${section.title}</h2>
          ${section.content}
        </section>
      `).join('')}
    </main>
    
    ${dataQuality.warnings.length > 0 ? `
      <div class="data-warnings">
        <h3>データ品質に関する注意</h3>
        <ul>
          ${dataQuality.warnings.map(w => `<li>${w}</li>`).join('')}
        </ul>
      </div>
    ` : ''}
    
    <footer class="report-footer">
      <p>© 2025 Autonomous Ideation Agent AI - Business Report</p>
    </footer>
  </div>
</body>
</html>
    `;
  }

  /**
   * 難易度の日本語変換
   */
  private translateDifficulty(difficulty: string): string {
    const map: Record<string, string> = {
      'low': '低',
      'medium': '中',
      'high': '高',
    };
    return map[difficulty.toLowerCase()] || difficulty;
  }

  /**
   * レポートのスタイル定義
   */
  private getReportStyles(): string {
    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: 'Noto Sans JP', -apple-system, BlinkMacSystemFont, sans-serif;
        line-height: 1.6;
        color: #333;
        background: #f5f5f5;
      }
      
      .report-container {
        max-width: 1200px;
        margin: 0 auto;
        background: white;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      }
      
      .report-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 2rem;
      }
      
      .report-header h1 {
        font-size: 2.5rem;
        margin-bottom: 0.5rem;
      }
      
      .report-meta {
        display: flex;
        gap: 2rem;
        opacity: 0.9;
      }
      
      .metrics-dashboard {
        padding: 2rem;
        background: #f9f9f9;
        border-bottom: 1px solid #e0e0e0;
      }
      
      .metrics-dashboard h2 {
        margin-bottom: 1.5rem;
        color: #555;
      }
      
      .metrics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
      }
      
      .metric-card {
        background: white;
        padding: 1rem;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      
      .metric-card label {
        display: block;
        font-size: 0.875rem;
        color: #666;
        margin-bottom: 0.5rem;
      }
      
      .metric-card value {
        display: block;
        font-size: 1.5rem;
        font-weight: bold;
        color: #333;
      }
      
      .report-content {
        padding: 2rem;
      }
      
      .report-section {
        margin-bottom: 3rem;
      }
      
      .report-section h2 {
        color: #667eea;
        margin-bottom: 1.5rem;
        padding-bottom: 0.5rem;
        border-bottom: 2px solid #667eea;
      }
      
      .report-section h3 {
        color: #555;
        margin: 1.5rem 0 1rem;
      }
      
      .report-section h4 {
        color: #666;
        margin: 1rem 0 0.5rem;
      }
      
      .report-section ul {
        margin-left: 2rem;
        margin-bottom: 1rem;
      }
      
      .report-section li {
        margin-bottom: 0.5rem;
      }
      
      .customer-segment,
      .market-size,
      .score-breakdown {
        background: #f9f9f9;
        padding: 1rem;
        border-radius: 8px;
        margin: 1rem 0;
      }
      
      .market-metric {
        display: flex;
        justify-content: space-between;
        padding: 0.5rem 0;
        border-bottom: 1px solid #e0e0e0;
      }
      
      .market-metric:last-child {
        border-bottom: none;
      }
      
      .competitor-card,
      .initiative-card,
      .risk-card,
      .phase-card {
        background: #f9f9f9;
        padding: 1rem;
        border-radius: 8px;
        margin-bottom: 1rem;
      }
      
      .initiative-card.priority-high {
        border-left: 4px solid #ff6b6b;
      }
      
      .initiative-card.priority-medium {
        border-left: 4px solid #feca57;
      }
      
      .initiative-card.priority-low {
        border-left: 4px solid #48dbfb;
      }
      
      progress {
        width: 100%;
        height: 20px;
        margin: 0.5rem 0;
      }
      
      .score-item {
        margin-bottom: 1rem;
      }
      
      .score-item label {
        display: block;
        margin-bottom: 0.25rem;
        font-weight: 500;
      }
      
      .total-score {
        font-size: 3rem;
        font-weight: bold;
        text-align: center;
        color: #667eea;
        margin-bottom: 1.5rem;
      }
      
      .data-warnings {
        background: #fff3cd;
        border: 1px solid #ffc107;
        border-radius: 8px;
        padding: 1rem;
        margin: 2rem;
      }
      
      .data-warnings h3 {
        color: #856404;
        margin-bottom: 0.5rem;
      }
      
      .data-warnings ul {
        margin-left: 1.5rem;
        color: #856404;
      }
      
      .report-footer {
        background: #333;
        color: white;
        text-align: center;
        padding: 1rem;
      }
      
      @media (max-width: 768px) {
        .report-header h1 {
          font-size: 1.75rem;
        }
        
        .metrics-grid {
          grid-template-columns: 1fr;
        }
        
        .report-content {
          padding: 1rem;
        }
      }
      
      @media print {
        .report-container {
          box-shadow: none;
        }
        
        .report-header {
          background: none;
          color: #333;
          border-bottom: 2px solid #333;
        }
        
        .metrics-dashboard {
          page-break-after: always;
        }
        
        .report-section {
          page-break-inside: avoid;
        }
      }
    `;
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