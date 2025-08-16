/**
 * Section Generator Service
 * セクション生成サービス - 各セクションのコンテンツを生成
 */

import { ReportSection, SectionType } from '@/lib/types/writer';
import { DataIntegrationService, getDataIntegrationService } from './data-integration-service';
import { HtmlTemplateService, getHtmlTemplateService } from './html-template-service';

export class SectionGeneratorService {
  private dataIntegrationService: DataIntegrationService;
  private htmlTemplateService: HtmlTemplateService;

  constructor() {
    this.dataIntegrationService = getDataIntegrationService();
    this.htmlTemplateService = getHtmlTemplateService();
  }

  /**
   * エグゼクティブサマリーを生成
   */
  async generateExecutiveSummary(data: any): Promise<ReportSection> {
    const { businessIdea, marketAnalysis, synergyAnalysis, validationPlan } = data;
    
    // デバッグ: データ内容を確認
    console.log('[SectionGenerator] Executive Summary data:', {
      hasBusinessIdea: !!businessIdea,
      businessTitle: businessIdea?.title,
      tam: marketAnalysis?.tam,
      synergyScore: synergyAnalysis?.totalScore || synergyAnalysis?.score,
      hasPlan: !!validationPlan
    });
    
    const formatCurrency = this.dataIntegrationService.formatCurrency.bind(this.dataIntegrationService);
    
    const content = `
      <p><strong>${this.escapeHtml(businessIdea?.title || 'ビジネスアイデア')}</strong>は、${this.escapeHtml(businessIdea?.description || '革新的なビジネスモデル')}を実現する新規事業提案です。</p>
      
      <h3>ビジネス機会</h3>
      <ul>
        <li>総市場規模（TAM）: ${formatCurrency(marketAnalysis?.tam || 0)}</li>
        <li>獲得可能市場（SAM）: ${formatCurrency(marketAnalysis?.sam || 0)}</li>
        <li>市場成長率: ${marketAnalysis?.growthRate || 0}%</li>
      </ul>
      
      <h3>競争優位性</h3>
      <p>${businessIdea?.valueProposition?.uniqueValue || '独自の価値提供'}を核とした独自の価値提供により、${(businessIdea?.valueProposition?.competitiveAdvantage || ['競争優位性']).join('、')}という競争優位性を確立します。</p>
      
      <h3>三菱地所とのシナジー</h3>
      <p>シナジースコア: <strong>${synergyAnalysis?.totalScore || synergyAnalysis?.score || 0}点</strong></p>
      <ul>
        <li>不動産活用: ${synergyAnalysis?.breakdown?.realEstateUtilization || 0}点</li>
        <li>顧客基盤活用: ${synergyAnalysis?.breakdown?.customerBaseUtilization || 0}点</li>
        <li>ブランド価値向上: ${synergyAnalysis?.breakdown?.brandValueEnhancement || 0}点</li>
      </ul>
      
      <h3>実装計画</h3>
      <p>総期間: <strong>${validationPlan?.totalDuration || 0}ヶ月</strong> / 必要予算: <strong>${formatCurrency(validationPlan?.requiredBudget || 0)}</strong></p>
      ${this.htmlTemplateService.generateHighlight(`
        <strong>推奨事項:</strong> ${this.generateRecommendation(synergyAnalysis?.totalScore || synergyAnalysis?.score || 0, marketAnalysis?.growthRate || 0)}
      `)}
    `;

    return {
      id: crypto.randomUUID(),
      type: 'executive_summary',
      title: 'エグゼクティブサマリー',
      content,
      order: 1,
      metadata: {
        generatedAt: new Date(),
      },
    };
  }

  /**
   * ビジネスアイデア詳細を生成
   */
  async generateBusinessIdea(data: any): Promise<ReportSection> {
    const { businessIdea } = data;
    
    // デバッグ: データ内容を確認
    console.log('[SectionGenerator] Business Idea data:', {
      hasBusinessIdea: !!businessIdea,
      title: businessIdea?.title,
      hasTargetCustomer: !!businessIdea?.targetCustomer,
      hasValueProp: !!businessIdea?.valueProposition
    });
    
    const content = `
      <h3>事業概要</h3>
      <p>${this.escapeHtml(businessIdea.description)}</p>
      
      <h3>ターゲット顧客</h3>
      <table class="data-table">
        <tr>
          <th>セグメント</th>
          <td>${this.escapeHtml(businessIdea.targetCustomer.segment)}</td>
        </tr>
        <tr>
          <th>年齢層</th>
          <td>${this.escapeHtml(businessIdea.targetCustomer.ageRange)}</td>
        </tr>
        <tr>
          <th>職業</th>
          <td>${this.escapeHtml(businessIdea.targetCustomer.occupation)}</td>
        </tr>
        <tr>
          <th>ニーズ</th>
          <td>${businessIdea.targetCustomer.needs.map((n: string) => this.escapeHtml(n)).join('、')}</td>
        </tr>
      </table>
      
      <h3>顧客の課題</h3>
      <p><strong>優先度: ${this.translatePriority(businessIdea.customerProblem.priority)}</strong></p>
      <ul>
        ${businessIdea.customerProblem.problems.map((p: string) => `<li>${this.escapeHtml(p)}</li>`).join('')}
      </ul>
      
      <h3>価値提案</h3>
      <div class="highlight">
        <p><strong>独自価値:</strong> ${this.escapeHtml(businessIdea.valueProposition.uniqueValue)}</p>
      </div>
      
      <h4>競争優位性</h4>
      <ol>
        ${businessIdea.valueProposition.competitiveAdvantage.map((a: string) => `<li>${this.escapeHtml(a)}</li>`).join('')}
      </ol>
      
      <h3>収益構造</h3>
      <table class="data-table">
        <tr>
          <th>収益源</th>
          <td>${businessIdea.revenueStructure.sources.map((s: string) => this.escapeHtml(s)).join('、')}</td>
        </tr>
        <tr>
          <th>価格設定</th>
          <td>${this.escapeHtml(businessIdea.revenueStructure.pricing)}</td>
        </tr>
        <tr>
          <th>コスト構造</th>
          <td>${this.escapeHtml(businessIdea.revenueStructure.costStructure)}</td>
        </tr>
      </table>
    `;

    return {
      id: crypto.randomUUID(),
      type: 'business_idea',
      title: 'ビジネスアイデア詳細',
      content,
      order: 2,
      metadata: {
        generatedAt: new Date(),
      },
    };
  }

  /**
   * 市場分析を生成
   */
  async generateMarketAnalysis(data: any): Promise<ReportSection> {
    const { marketAnalysis } = data;
    const formatCurrency = this.dataIntegrationService.formatCurrency.bind(this.dataIntegrationService);
    
    const content = `
      <h3>市場規模</h3>
      ${this.generateMarketSizeTable(marketAnalysis, formatCurrency)}
      
      <h3>市場成長性</h3>
      <p>年間成長率: <strong>${marketAnalysis.growthRate}%</strong></p>
      ${this.generateGrowthProjectionChart(marketAnalysis)}
      
      <h3>競合分析</h3>
      ${marketAnalysis.competitors.length > 0 ? this.generateCompetitorTable(marketAnalysis.competitors, formatCurrency) : '<p>競合情報は現在収集中です。</p>'}
      
      <h3>市場トレンド</h3>
      <ul>
        ${marketAnalysis.marketTrends.map((t: string) => `<li>${this.escapeHtml(t)}</li>`).join('')}
      </ul>
      
      ${marketAnalysis.regulations.length > 0 ? `
      <h3>規制・法令</h3>
      <ul>
        ${marketAnalysis.regulations.map((r: string) => `<li>${this.escapeHtml(r)}</li>`).join('')}
      </ul>
      ` : ''}
    `;

    return {
      id: crypto.randomUUID(),
      type: 'market_analysis',
      title: '市場分析',
      content,
      order: 3,
      metadata: {
        generatedAt: new Date(),
      },
    };
  }

  /**
   * シナジー分析を生成
   */
  async generateSynergyAnalysis(data: any): Promise<ReportSection> {
    const { synergyAnalysis } = data;
    
    const content = `
      <h3>シナジー評価</h3>
      <div class="highlight">
        <p>総合スコア: <strong>${synergyAnalysis.totalScore}点</strong> / 100点</p>
      </div>
      
      <h3>評価内訳</h3>
      ${this.generateSynergyBreakdownChart(synergyAnalysis.breakdown)}
      
      <h3>シナジー創出施策</h3>
      ${synergyAnalysis.initiatives.length > 0 ? this.generateInitiativesTable(synergyAnalysis.initiatives) : '<p>施策は検討中です。</p>'}
      
      <h3>リスクと対策</h3>
      ${synergyAnalysis.risks.length > 0 ? this.generateRisksTable(synergyAnalysis.risks) : '<p>リスク評価は実施中です。</p>'}
    `;

    return {
      id: crypto.randomUUID(),
      type: 'synergy_analysis',
      title: 'シナジー分析',
      content,
      order: 4,
      metadata: {
        generatedAt: new Date(),
      },
    };
  }

  /**
   * 検証計画を生成
   */
  async generateValidationPlan(data: any): Promise<ReportSection> {
    const { validationPlan } = data;
    const formatCurrency = this.dataIntegrationService.formatCurrency.bind(this.dataIntegrationService);
    
    const content = `
      <h3>実装フェーズ</h3>
      <p>総期間: <strong>${validationPlan.totalDuration}ヶ月</strong> / 必要予算: <strong>${formatCurrency(validationPlan.requiredBudget)}</strong></p>
      
      ${validationPlan.phases.map((phase: any, index: number) => `
        <div style="margin: 2rem 0; padding: 1rem; border-left: 4px solid #667eea; background: #f8f9fa;">
          <h4>フェーズ${index + 1}: ${this.escapeHtml(phase.name)}</h4>
          <p>期間: <strong>${phase.duration}ヶ月</strong></p>
          
          <h5>マイルストーン</h5>
          <ul>
            ${phase.milestones.map((m: string) => `<li>${this.escapeHtml(m)}</li>`).join('')}
          </ul>
          
          <h5>KPI</h5>
          <ul>
            ${phase.kpis.map((kpi: any) => `<li>${this.escapeHtml(kpi.metric)}: ${this.formatKpiTarget(kpi.target)}</li>`).join('')}
          </ul>
          
          <h5>必要リソース</h5>
          <table class="data-table">
            <tr>
              <th>人員</th>
              <td>${phase.requiredResources.personnel}名</td>
            </tr>
            <tr>
              <th>予算</th>
              <td>${formatCurrency(phase.requiredResources.budget)}</td>
            </tr>
            <tr>
              <th>技術</th>
              <td>${phase.requiredResources.technology.join('、')}</td>
            </tr>
          </table>
          
          <h5>Go/No-Go判断基準</h5>
          <ul>
            ${phase.goNoGoCriteria.map((c: string) => `<li>${this.escapeHtml(c)}</li>`).join('')}
          </ul>
        </div>
      `).join('')}
    `;

    return {
      id: crypto.randomUUID(),
      type: 'validation_plan',
      title: '検証計画',
      content,
      order: 5,
      metadata: {
        generatedAt: new Date(),
      },
    };
  }

  /**
   * 市場規模テーブルを生成
   */
  private generateMarketSizeTable(marketAnalysis: any, formatCurrency: Function): string {
    return this.htmlTemplateService.generateTable(
      ['市場区分', '規模', '説明'],
      [
        ['TAM (総市場規模)', formatCurrency(marketAnalysis.tam), '理論上の最大市場規模'],
        ['PAM (実現可能市場)', formatCurrency(marketAnalysis.pam), '現実的に到達可能な市場規模'],
        ['SAM (獲得可能市場)', formatCurrency(marketAnalysis.sam), '実際に獲得を目指す市場規模'],
      ]
    );
  }

  /**
   * 成長予測チャートを生成（簡易版）
   */
  private generateGrowthProjectionChart(marketAnalysis: any): string {
    const currentYear = new Date().getFullYear();
    const years = [0, 1, 2, 3];
    const formatCurrency = this.dataIntegrationService.formatCurrency.bind(this.dataIntegrationService);
    
    const projections = years.map(year => {
      const multiplier = Math.pow(1 + marketAnalysis.growthRate / 100, year);
      return [
        `${currentYear + year}年`,
        formatCurrency(Math.round(marketAnalysis.sam * multiplier)),
      ];
    });

    return this.htmlTemplateService.generateTable(
      ['年度', 'SAM予測'],
      projections
    );
  }

  /**
   * 競合テーブルを生成
   */
  private generateCompetitorTable(competitors: any[], formatCurrency: Function): string {
    const rows = competitors.map(c => [
      this.escapeHtml(c.name),
      `${c.marketShare}%`,
      c.revenue ? formatCurrency(c.revenue) : 'N/A',
      c.strengths ? c.strengths.join('、') : '',
      c.weaknesses ? c.weaknesses.join('、') : '',
    ]);

    return this.htmlTemplateService.generateTable(
      ['企業名', '市場シェア', '売上高', '強み', '弱み'],
      rows
    );
  }

  /**
   * シナジー内訳チャートを生成
   */
  private generateSynergyBreakdownChart(breakdown: any): string {
    const items = [
      ['不動産活用', `${breakdown.realEstateUtilization}点`],
      ['顧客基盤活用', `${breakdown.customerBaseUtilization}点`],
      ['ブランド価値向上', `${breakdown.brandValueEnhancement}点`],
    ];

    return this.htmlTemplateService.generateTable(
      ['評価項目', 'スコア'],
      items
    );
  }

  /**
   * 施策テーブルを生成
   */
  private generateInitiativesTable(initiatives: any[]): string {
    const rows = initiatives.map(i => [
      this.escapeHtml(i.title),
      this.translatePriority(i.priority),
      this.escapeHtml(i.expectedImpact),
    ]);

    return this.htmlTemplateService.generateTable(
      ['施策名', '優先度', '期待効果'],
      rows
    );
  }

  /**
   * リスクテーブルを生成
   */
  private generateRisksTable(risks: any[]): string {
    const rows = risks.map(r => [
      this.escapeHtml(r.description),
      this.escapeHtml(r.mitigation),
    ]);

    return this.htmlTemplateService.generateTable(
      ['リスク', '対策'],
      rows
    );
  }

  /**
   * 推奨事項を生成
   */
  private generateRecommendation(synergyScore: number, growthRate: number): string {
    if (synergyScore >= 80 && growthRate >= 15) {
      return '高いシナジー効果と市場成長性を持つ優先度の高い案件です。早期の実装開始を推奨します。';
    } else if (synergyScore >= 60 || growthRate >= 10) {
      return '一定のポテンシャルがある案件です。詳細な実現可能性調査の実施を推奨します。';
    } else {
      return '慎重な検討が必要な案件です。追加の市場調査や戦略の見直しを推奨します。';
    }
  }

  /**
   * 優先度を日本語に変換
   */
  private translatePriority(priority: string): string {
    const map: Record<string, string> = {
      high: '高',
      medium: '中',
      low: '低',
    };
    return map[priority.toLowerCase()] || priority;
  }

  /**
   * KPIターゲットをフォーマット
   */
  private formatKpiTarget(target: any): string {
    if (typeof target === 'number') {
      return `${target}${target > 100 ? '' : '%'}`;
    }
    return String(target);
  }

  /**
   * HTMLエスケープ
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }
}

/**
 * SectionGeneratorServiceのシングルトンインスタンス
 */
let instance: SectionGeneratorService | null = null;

export function getSectionGeneratorService(): SectionGeneratorService {
  if (!instance) {
    instance = new SectionGeneratorService();
  }
  return instance;
}