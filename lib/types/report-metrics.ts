/**
 * Report Metrics Type Definitions
 * レポートメトリクス型定義
 */

/**
 * ビジネスメトリクス
 */
export interface BusinessMetrics {
  marketSize: MarketSizeMetrics;
  financial: FinancialMetrics;
  synergy: SynergyMetrics;
  implementation: ImplementationMetrics;
}

/**
 * 市場規模メトリクス
 */
export interface MarketSizeMetrics {
  tam: {
    value: number; // 円
    formatted: string; // "¥1,000,000,000"
    label: string; // "総市場規模"
  };
  pam: {
    value: number; // 円
    formatted: string;
    label: string; // "獲得可能市場"
  };
  sam: {
    value: number; // 円
    formatted: string;
    label: string; // "実現可能市場"
  };
  growthRate: {
    value: number; // パーセント
    formatted: string; // "15.5%"
    trend: 'increasing' | 'stable' | 'decreasing';
  };
}

/**
 * 財務メトリクス
 */
export interface FinancialMetrics {
  revenueProjection: {
    year1: number; // 円
    year2: number; // 円
    year3: number; // 円
    formatted: {
      year1: string;
      year2: string;
      year3: string;
    };
  };
  roi: {
    value: number; // パーセント
    formatted: string;
    paybackPeriod: number; // months
  };
  investmentRequired: {
    initial: number; // 円
    total3Y: number; // 円
    formatted: {
      initial: string;
      total3Y: string;
    };
  };
}

/**
 * シナジーメトリクス
 */
export interface SynergyMetrics {
  totalScore: {
    value: number; // 0-100
    grade: 'S' | 'A' | 'B' | 'C' | 'D';
    color: string; // Tailwind CSS color class
  };
  breakdown: {
    realEstate: {
      score: number; // 0-100
      label: string;
      description: string;
    };
    customerBase: {
      score: number; // 0-100
      label: string;
      description: string;
    };
    brandValue: {
      score: number; // 0-100
      label: string;
      description: string;
    };
  };
}

/**
 * 実装メトリクス
 */
export interface ImplementationMetrics {
  difficulty: {
    level: 'low' | 'medium' | 'high';
    score: number; // 1-10
    factors: string[];
    color: string; // Tailwind CSS color class
  };
  timeToMarket: {
    value: number; // months
    phase: 'immediate' | 'short' | 'medium' | 'long';
    formatted: string; // "6ヶ月"
  };
  resourceRequirement: {
    personnel: {
      total: number;
      byRole: {
        role: string;
        count: number;
      }[];
    };
    budget: {
      total: number; // 円
      formatted: string;
      breakdown: {
        category: string;
        amount: number; // 円
        percentage: number;
      }[];
    };
  };
}

/**
 * パフォーマンスメトリクス
 */
export interface PerformanceMetrics {
  generationTime: {
    total: number; // milliseconds
    breakdown: {
      dataIntegration: number;
      sectionGeneration: number;
      htmlRendering: number;
      databaseWrite: number;
    };
  };
  dataQuality: {
    completeness: number; // 0-100
    consistency: boolean;
    warnings: number;
  };
  cacheHit: boolean;
  parallelExecution: boolean;
}

/**
 * 競合比較メトリクス
 */
export interface CompetitiveMetrics {
  marketPosition: {
    rank: number;
    totalCompetitors: number;
    competitiveAdvantage: string[];
  };
  differentiators: {
    unique: string[];
    shared: string[];
    disadvantages: string[];
  };
  benchmarks: {
    metric: string;
    ourValue: number | string;
    industryAverage: number | string;
    topPerformer: number | string;
  }[];
}

/**
 * 通貨フォーマッター用ユーティリティ型
 */
export interface CurrencyFormatter {
  format(value: number): string;
  parse(formatted: string): number;
  options: {
    currency: 'JPY';
    locale: 'ja-JP';
    minimumFractionDigits: number;
    maximumFractionDigits: number;
  };
}

/**
 * メトリクスサマリー（ダッシュボード表示用）
 */
export interface MetricsSummary {
  keyMetrics: {
    label: string;
    value: string | number;
    unit?: string;
    trend?: 'up' | 'down' | 'stable';
    importance: 'critical' | 'high' | 'medium' | 'low';
  }[];
  statusIndicators: {
    feasibility: 'excellent' | 'good' | 'fair' | 'poor';
    marketOpportunity: 'excellent' | 'good' | 'fair' | 'poor';
    synergyFit: 'excellent' | 'good' | 'fair' | 'poor';
    overallScore: number; // 0-100
  };
}