/**
 * Quality Validator Test
 * 品質検証バリデーターのテスト
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { QualityValidator } from '../../../lib/agents/ideator/quality-validator';
import type { BusinessIdea, IdeatorOutput } from '../../../lib/types/ideator';

describe('QualityValidator', () => {
  let validator: QualityValidator;

  // 有効なビジネスアイデアのサンプル
  const validIdea: BusinessIdea = {
    id: 'idea-1',
    title: 'AI業務自動化プラットフォーム',
    description: 'AIを活用して中小企業の業務プロセスを自動化するクラウドプラットフォーム。導入が簡単で、プログラミング知識不要。月額制で手軽に始められる。',
    targetCustomers: ['中小企業', 'スタートアップ', '個人事業主'],
    customerPains: ['人手不足', '業務効率化', 'コスト削減'],
    valueProposition: 'ノーコードで業務自動化を実現し、人的リソースを戦略的業務に集中可能にする',
    revenueModel: 'SaaS型月額課金モデル。基本プラン5万円/月、エンタープライズプラン20万円/月',
    estimatedRevenue: 500000000,
    implementationDifficulty: 'medium',
    marketOpportunity: 'DX推進による業務自動化市場の急成長。中小企業のデジタル化需要増加。'
  };

  // 問題のあるビジネスアイデアのサンプル
  const invalidIdea: BusinessIdea = {
    id: 'idea-2',
    title: 'これは非常に長いタイトルで30文字を超えてしまっているビジネスアイデア',
    description: '短い説明',
    targetCustomers: [],
    customerPains: [],
    valueProposition: '',
    revenueModel: '',
    estimatedRevenue: -1000,
    implementationDifficulty: 'invalid' as any,
    marketOpportunity: ''
  };

  beforeEach(() => {
    validator = new QualityValidator();
  });

  describe('validateIdea', () => {
    it('should validate a valid business idea', () => {
      const result = validator.validateIdea(validIdea);

      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
      expect(result.qualityScore).toBeGreaterThan(80);
      expect(result.ideaId).toBe('idea-1');
    });

    it('should detect errors in invalid idea', () => {
      const result = validator.validateIdea(invalidIdea);

      expect(result.isValid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.qualityScore).toBeLessThan(50);
      
      const errorIssues = result.issues.filter(i => i.severity === 'error');
      expect(errorIssues.length).toBeGreaterThan(0);
    });

    it('should validate title length', () => {
      const ideaWithLongTitle = {
        ...validIdea,
        title: 'これは30文字を超える非常に長いタイトルのビジネスアイデアです'
      };

      const result = validator.validateIdea(ideaWithLongTitle);
      
      const titleIssue = result.issues.find(i => i.field === 'title');
      expect(titleIssue).toBeDefined();
      expect(titleIssue?.severity).toBe('error');
    });

    it('should validate description quality', () => {
      const ideaWithShortDesc = {
        ...validIdea,
        description: '短い'
      };

      const result = validator.validateIdea(ideaWithShortDesc);
      
      const descIssue = result.issues.find(i => i.field === 'description');
      expect(descIssue).toBeDefined();
      expect(descIssue?.severity).toBe('warning');
    });

    it('should validate revenue realism', () => {
      const ideaWithHighRevenue = {
        ...validIdea,
        estimatedRevenue: 999999999999999
      };

      const result = validator.validateIdea(ideaWithHighRevenue);
      
      const revenueIssue = result.issues.find(i => i.field === 'estimatedRevenue');
      expect(revenueIssue).toBeDefined();
      expect(revenueIssue?.severity).toBe('warning');
    });

    it('should validate target customers', () => {
      const ideaWithoutCustomers = {
        ...validIdea,
        targetCustomers: []
      };

      const result = validator.validateIdea(ideaWithoutCustomers);
      
      expect(result.isValid).toBe(false);
      const customerIssue = result.issues.find(i => i.field === 'targetCustomers');
      expect(customerIssue?.severity).toBe('error');
    });
  });

  describe('validateOutput', () => {
    it('should validate multiple ideas', () => {
      const output: IdeatorOutput = {
        ideas: [validIdea, validIdea],
        summary: 'テストサマリー',
        metadata: {
          totalIdeas: 2,
          averageRevenue: 500000000,
          marketSize: 1000000000000,
          generationDate: new Date().toISOString()
        }
      };

      const result = validator.validateOutput(output);

      expect(result.isValid).toBe(true);
      expect(result.validIdeas).toHaveLength(2);
      expect(result.invalidIdeas).toHaveLength(0);
      expect(result.overallScore).toBeGreaterThan(80);
    });

    it('should separate valid and invalid ideas', () => {
      const output: IdeatorOutput = {
        ideas: [validIdea, invalidIdea],
        summary: 'テストサマリー',
        metadata: {
          totalIdeas: 2,
          averageRevenue: 250000000,
          marketSize: 1000000000000,
          generationDate: new Date().toISOString()
        }
      };

      const result = validator.validateOutput(output);

      expect(result.isValid).toBe(false);
      expect(result.validIdeas).toHaveLength(1);
      expect(result.invalidIdeas).toHaveLength(1);
      expect(result.issues.size).toBe(1);
    });

    it('should handle empty output', () => {
      const output: IdeatorOutput = {
        ideas: [],
        summary: 'No ideas',
        metadata: {
          totalIdeas: 0,
          averageRevenue: 0,
          marketSize: 0,
          generationDate: new Date().toISOString()
        }
      };

      const result = validator.validateOutput(output);

      expect(result.isValid).toBe(true);
      expect(result.validIdeas).toHaveLength(0);
      expect(result.overallScore).toBe(0);
    });
  });

  describe('generateImprovementSuggestions', () => {
    it('should generate suggestions for low quality idea', () => {
      const result = validator.validateIdea(invalidIdea);
      const suggestions = validator.generateImprovementSuggestions(invalidIdea, result);

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.includes('タイトル'))).toBe(true);
    });

    it('should generate quality-based suggestions', () => {
      const lowQualityIdea = {
        ...validIdea,
        description: '短い説明文',
        revenueModel: '不明確'
      };

      const result = validator.validateIdea(lowQualityIdea);
      const suggestions = validator.generateImprovementSuggestions(lowQualityIdea, result);

      expect(suggestions.some(s => s.includes('説明文'))).toBe(true);
      expect(suggestions.some(s => s.includes('収益モデル'))).toBe(true);
    });

    it('should suggest improvements for low score', () => {
      const result = {
        isValid: true,
        issues: [],
        qualityScore: 55,
        ideaId: 'test'
      };

      const suggestions = validator.generateImprovementSuggestions(validIdea, result);
      
      expect(suggestions.some(s => s.includes('具体性'))).toBe(true);
    });
  });

  describe('analyzeStrengths', () => {
    it('should identify strengths of high-quality idea', () => {
      const highQualityIdea: BusinessIdea = {
        ...validIdea,
        estimatedRevenue: 2000000000,
        implementationDifficulty: 'low',
        targetCustomers: ['企業A', '企業B', '企業C', '企業D'],
        customerPains: ['課題1', '課題2', '課題3', '課題4']
      };

      const strengths = validator.analyzeStrengths(highQualityIdea);

      expect(strengths).toContain('高い収益性が期待できる');
      expect(strengths).toContain('実装が比較的容易で早期実現が可能');
      expect(strengths).toContain('幅広い顧客セグメントに対応可能');
      expect(strengths).toContain('複数の顧客課題を同時に解決');
    });

    it('should identify value proposition strength', () => {
      const ideaWithStrongValue = {
        ...validIdea,
        valueProposition: 'これは非常に詳細で明確な価値提案です。競合との差別化ポイントが明確で、顧客にとっての具体的な価値が示されています。'
      };

      const strengths = validator.analyzeStrengths(ideaWithStrongValue);
      
      expect(strengths).toContain('明確な価値提案による差別化');
    });
  });

  describe('analyzeWeaknesses', () => {
    it('should identify weaknesses of challenging idea', () => {
      const challengingIdea: BusinessIdea = {
        ...validIdea,
        implementationDifficulty: 'high',
        estimatedRevenue: 50000000,
        targetCustomers: ['単一顧客'],
        revenueModel: '不明'
      };

      const weaknesses = validator.analyzeWeaknesses(challengingIdea);

      expect(weaknesses).toContain('実装が複雑で時間とリソースが必要');
      expect(weaknesses).toContain('市場規模が限定的で成長性に課題');
      expect(weaknesses).toContain('ターゲット顧客が限定的でリスクが高い');
      expect(weaknesses).toContain('収益モデルの具体性が不足');
    });

    it('should handle idea with no weaknesses', () => {
      const strongIdea: BusinessIdea = {
        ...validIdea,
        implementationDifficulty: 'medium',
        estimatedRevenue: 500000000,
        targetCustomers: ['顧客A', '顧客B'],
        revenueModel: '詳細な収益モデルの説明がここに入ります。月額課金制で安定収入を確保。'
      };

      const weaknesses = validator.analyzeWeaknesses(strongIdea);
      
      expect(weaknesses.length).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle idea with all empty strings', () => {
      const emptyIdea: BusinessIdea = {
        id: '',
        title: '',
        description: '',
        targetCustomers: [],
        customerPains: [],
        valueProposition: '',
        revenueModel: '',
        estimatedRevenue: 0,
        implementationDifficulty: 'low',
        marketOpportunity: ''
      };

      const result = validator.validateIdea(emptyIdea);
      
      expect(result.isValid).toBe(false);
      expect(result.issues.filter(i => i.severity === 'error').length).toBeGreaterThan(0);
      expect(result.qualityScore).toBeLessThan(50);
    });

    it('should handle extremely high quality scores', () => {
      const perfectIdea: BusinessIdea = {
        ...validIdea,
        description: 'これは100文字を超える非常に詳細な説明文です。ビジネスモデル、ターゲット市場、競合優位性など、すべての要素が含まれています。導入事例や期待される効果も明確に記載されています。',
        targetCustomers: ['顧客A', '顧客B', '顧客C'],
        customerPains: ['課題1', '課題2', '課題3'],
        revenueModel: '詳細な収益モデル：基本プラン、プレミアムプラン、エンタープライズプランの3段階',
        estimatedRevenue: 1000000000
      };

      const result = validator.validateIdea(perfectIdea);
      
      expect(result.qualityScore).toBeGreaterThanOrEqual(90);
      expect(result.qualityScore).toBeLessThanOrEqual(100);
    });

    it('should cap quality score at 0 for very poor ideas', () => {
      const terribleIdea: BusinessIdea = {
        ...invalidIdea,
        estimatedRevenue: -999999999
      };

      const result = validator.validateIdea(terribleIdea);
      
      expect(result.qualityScore).toBeGreaterThanOrEqual(0);
    });
  });
});