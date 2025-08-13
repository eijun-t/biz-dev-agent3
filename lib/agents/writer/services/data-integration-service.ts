/**
 * Data Integration Service
 * データ統合サービス - 複数のデータソースを統合し、通貨を円単位に統一
 */

import {
  WriterInput,
  IntegratedData,
  ValidationResult,
  ValidationError,
  BusinessIdea,
  MarketAnalysis,
  SynergyAnalysis,
  ValidationPlan,
} from '@/lib/types/writer';

export class DataIntegrationService {
  /**
   * 複数のデータソースを統合
   */
  async integrateData(input: WriterInput): Promise<IntegratedData> {
    // データの整合性を検証
    const validationResult = await this.validateConsistency(input);
    
    if (!validationResult.isValid) {
      throw new Error(
        `Data validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`
      );
    }

    // 通貨を円単位に統一
    const normalizedData = await this.normalizeCurrency(input);

    // データ完全性スコアを計算
    const completenessScore = this.calculateCompleteness(normalizedData);

    return {
      businessIdea: normalizedData.analystData.businessIdea,
      marketAnalysis: normalizedData.analystData.marketAnalysis,
      synergyAnalysis: normalizedData.analystData.synergyAnalysis,
      validationPlan: normalizedData.analystData.validationPlan,
      dataQuality: {
        completeness: completenessScore,
        consistency: validationResult.isValid,
        warnings: validationResult.warnings,
      },
    };
  }

  /**
   * データの整合性を検証
   */
  async validateConsistency(data: WriterInput | any): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    // WriterInput型かどうかチェック
    const isWriterInput = data.analystData !== undefined;
    const marketAnalysis = isWriterInput ? data.analystData.marketAnalysis : data.marketAnalysis;
    const synergyAnalysis = isWriterInput ? data.analystData.synergyAnalysis : data.synergyAnalysis;
    const validationPlan = isWriterInput ? data.analystData.validationPlan : data.validationPlan;
    const businessIdea = isWriterInput ? data.analystData.businessIdea : data.businessIdea;

    // セッションIDとアイデアIDの整合性チェック
    if (isWriterInput && (!data.sessionId || !data.ideaId)) {
      errors.push({
        field: 'ids',
        message: 'Session ID and Idea ID are required',
      });
    }

    // 市場規模の論理的整合性チェック（TAM > PAM > SAM）
    if (marketAnalysis) {
      const { tam, pam, sam } = marketAnalysis;
      if (tam < pam || pam < sam) {
        errors.push({
          field: 'marketAnalysis',
          message: 'Market size hierarchy is invalid (TAM should be > PAM > SAM)',
          value: { tam, pam, sam },
        });
      }
    }

    // シナジースコアの整合性チェック
    if (synergyAnalysis) {
      const { totalScore, breakdown } = synergyAnalysis;
      const avgBreakdown = (
        breakdown.realEstateUtilization +
        breakdown.customerBaseUtilization +
        breakdown.brandValueEnhancement
      ) / 3;
      
      if (Math.abs(totalScore - avgBreakdown) > 10) {
        warnings.push(
          `Synergy total score (${totalScore}) differs significantly from breakdown average (${avgBreakdown.toFixed(1)})`
        );
      }
    }

    // 検証計画の期間整合性チェック
    if (validationPlan) {
      const { phases, totalDuration } = validationPlan;
      const sumDuration = phases.reduce((sum: number, phase: any) => sum + phase.duration, 0);
      
      if (sumDuration !== totalDuration) {
        errors.push({
          field: 'validationPlan',
          message: `Phase durations sum (${sumDuration}) does not match total duration (${totalDuration})`,
        });
      }
    }

    // 必須フィールドの存在チェック
    if (businessIdea && !businessIdea.title) {
      errors.push({
        field: 'businessIdea.title',
        message: 'Business idea title is required',
      });
    }

    // 競合データの妥当性チェック
    if (marketAnalysis && marketAnalysis.competitors) {
      const competitors = marketAnalysis.competitors;
      const totalMarketShare = competitors.reduce((sum: number, c: any) => sum + c.marketShare, 0);
      
      if (totalMarketShare > 100) {
        warnings.push(
          `Total competitor market share (${totalMarketShare}%) exceeds 100%`
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * 通貨を円単位に統一
   */
  private async normalizeCurrency(data: WriterInput): Promise<WriterInput> {
    // Deep copy to avoid mutating original data
    const normalized = JSON.parse(JSON.stringify(data)) as WriterInput;

    // 市場規模データの正規化（すでに円単位と仮定）
    normalized.analystData.marketAnalysis.tam = Math.round(
      normalized.analystData.marketAnalysis.tam
    );
    normalized.analystData.marketAnalysis.pam = Math.round(
      normalized.analystData.marketAnalysis.pam
    );
    normalized.analystData.marketAnalysis.sam = Math.round(
      normalized.analystData.marketAnalysis.sam
    );

    // 競合企業の収益を円単位に正規化
    normalized.analystData.marketAnalysis.competitors.forEach(competitor => {
      if (competitor.revenue) {
        competitor.revenue = Math.round(competitor.revenue);
      }
    });

    // 検証計画の予算を円単位に正規化
    normalized.analystData.validationPlan.requiredBudget = Math.round(
      normalized.analystData.validationPlan.requiredBudget
    );

    normalized.analystData.validationPlan.phases.forEach(phase => {
      phase.requiredResources.budget = Math.round(
        phase.requiredResources.budget
      );
    });

    return normalized;
  }

  /**
   * 通貨を他の単位から円に変換
   */
  async convertCurrency(amount: number, from: string): Promise<number> {
    // 為替レートのマッピング（実際のアプリケーションでは外部APIを使用）
    const exchangeRates: Record<string, number> = {
      'USD': 150,  // 1 USD = 150 JPY
      'EUR': 160,  // 1 EUR = 160 JPY
      'GBP': 190,  // 1 GBP = 190 JPY
      'CNY': 21,   // 1 CNY = 21 JPY
      'JPY': 1,    // Already in JPY
    };

    const rate = exchangeRates[from.toUpperCase()] || 1;
    return Math.round(amount * rate);
  }

  /**
   * 金額を日本円フォーマットに変換
   */
  formatCurrency(amount: number): string {
    // ゼロの場合
    if (amount === 0) {
      return '¥0';
    }

    // 負の数の場合
    if (amount < 0) {
      return `-${this.formatCurrency(Math.abs(amount))}`;
    }

    // 億単位での表示（1億円以上の場合）
    if (amount >= 100000000) {
      const oku = Math.floor(amount / 100000000);
      const man = Math.floor((amount % 100000000) / 10000);
      
      if (man > 0) {
        return `¥${oku}億${man.toLocaleString('ja-JP')}万`;
      }
      return `¥${oku}億`;
    }

    // 万単位での表示（1万円以上の場合）
    if (amount >= 10000) {
      const man = Math.floor(amount / 10000);
      const remainder = amount % 10000;
      
      if (remainder > 0) {
        return `¥${man}万${remainder.toLocaleString('ja-JP')}`;
      }
      return `¥${man}万`;
    }

    // 通常の表示
    return `¥${amount.toLocaleString('ja-JP')}`;
  }

  /**
   * データ完全性スコアを計算（0-100）
   */
  private calculateCompleteness(data: WriterInput): number {
    let score = 0;
    let totalChecks = 0;

    // ビジネスアイデアの完全性チェック
    const idea = data.analystData.businessIdea;
    totalChecks += 7;
    if (idea.title) score++;
    if (idea.description) score++;
    if (idea.targetCustomer.needs.length > 0) score++;
    if (idea.customerProblem.problems.length > 0) score++;
    if (idea.valueProposition.uniqueValue) score++;
    if (idea.valueProposition.competitiveAdvantage.length > 0) score++;
    if (idea.revenueStructure.sources.length > 0) score++;

    // 市場分析の完全性チェック
    const market = data.analystData.marketAnalysis;
    totalChecks += 5;
    if (market.tam > 0) score++;
    if (market.pam > 0) score++;
    if (market.sam > 0) score++;
    if (market.competitors.length > 0) score++;
    if (market.marketTrends.length > 0) score++;

    // シナジー分析の完全性チェック
    const synergy = data.analystData.synergyAnalysis;
    totalChecks += 4;
    if (synergy.totalScore > 0) score++;
    if (synergy.breakdown.realEstateUtilization > 0) score++;
    if (synergy.initiatives.length > 0) score++;
    if (synergy.risks.length > 0) score++;

    // 検証計画の完全性チェック
    const validation = data.analystData.validationPlan;
    totalChecks += 3;
    if (validation.phases.length > 0) score++;
    if (validation.totalDuration > 0) score++;
    if (validation.requiredBudget > 0) score++;

    return Math.round((score / totalChecks) * 100);
  }

  /**
   * 欠落データの処理
   */
  handleMissingData<T>(data: T | undefined | null, defaultValue: T, warning: string): T {
    if (data === undefined || data === null) {
      console.warn(`Missing data: ${warning}. Using default value.`);
      return defaultValue;
    }
    return data;
  }

  /**
   * 数値範囲の検証
   */
  validateNumberRange(value: number, min: number, max: number, fieldName: string): boolean {
    if (value < min || value > max) {
      console.warn(`${fieldName} is out of range: ${value} (expected ${min}-${max})`);
      return false;
    }
    return true;
  }

  /**
   * データの不整合を修正
   */
  async reconcileInconsistencies(data: IntegratedData): Promise<IntegratedData> {
    const reconciled = { ...data };

    // TAM/PAM/SAMの階層を強制
    if (reconciled.marketAnalysis.tam < reconciled.marketAnalysis.pam) {
      reconciled.marketAnalysis.tam = reconciled.marketAnalysis.pam * 1.5;
      reconciled.dataQuality.warnings.push('TAM adjusted to maintain hierarchy');
    }
    
    if (reconciled.marketAnalysis.pam < reconciled.marketAnalysis.sam) {
      reconciled.marketAnalysis.pam = reconciled.marketAnalysis.sam * 1.5;
      reconciled.dataQuality.warnings.push('PAM adjusted to maintain hierarchy');
    }

    // シナジースコアの調整
    const avgBreakdown = (
      reconciled.synergyAnalysis.breakdown.realEstateUtilization +
      reconciled.synergyAnalysis.breakdown.customerBaseUtilization +
      reconciled.synergyAnalysis.breakdown.brandValueEnhancement
    ) / 3;
    
    if (Math.abs(reconciled.synergyAnalysis.totalScore - avgBreakdown) > 10) {
      reconciled.synergyAnalysis.totalScore = Math.round(avgBreakdown);
      reconciled.dataQuality.warnings.push('Synergy score adjusted to match breakdown');
    }

    return reconciled;
  }
}

/**
 * DataIntegrationServiceのシングルトンインスタンス
 */
let instance: DataIntegrationService | null = null;

export function getDataIntegrationService(): DataIntegrationService {
  if (!instance) {
    instance = new DataIntegrationService();
  }
  return instance;
}