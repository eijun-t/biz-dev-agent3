/**
 * Capability Matcher Service
 * ケイパビリティマッチングサービス
 */

import { 
  MitsubishiCapability,
  RequiredCapability,
  CapabilityMapping 
} from '@/lib/types/critic';
import { 
  MITSUBISHI_CAPABILITIES,
  CapabilityDetail,
  getFlatCapabilityList
} from '@/lib/types/mitsubishi-capability';

/**
 * Capability Matcher Service
 */
export class CapabilityMatcher {
  /**
   * 必要なケイパビリティと三菱地所のケイパビリティをマッチング
   */
  match(
    requiredCapabilities: RequiredCapability[],
    matchedFromLLM?: MitsubishiCapability[]
  ): {
    matched: MitsubishiCapability[];
    matchScore: number;
    gaps: string[];
    details: MatchDetail[];
  } {
    const flatCapabilities = getFlatCapabilityList();
    const matchDetails: MatchDetail[] = [];
    const gaps: string[] = [];

    // 各必要ケイパビリティに対してマッチングを実行
    for (const required of requiredCapabilities) {
      const match = this.findBestMatch(required, flatCapabilities);
      
      if (match.score >= 0.7) { // 70%以上のマッチ
        matchDetails.push({
          required,
          matched: match.capability,
          score: match.score,
          category: match.category,
        });
      } else if (required.importance === 'critical') {
        gaps.push(`重要なケイパビリティ「${required.name}」のギャップ`);
      } else if (required.importance === 'important') {
        gaps.push(`${required.name}の部分的なギャップ`);
      }
    }

    // LLMからの提案も統合
    const mergedCapabilities = this.mergeCapabilities(matchDetails, matchedFromLLM);
    
    // スコア計算
    const matchScore = this.calculateMatchScore(requiredCapabilities, matchDetails);

    return {
      matched: mergedCapabilities,
      matchScore,
      gaps,
      details: matchDetails,
    };
  }

  /**
   * 最適なケイパビリティマッチを探す
   */
  private findBestMatch(
    required: RequiredCapability,
    capabilities: Array<{
      category: string;
      categoryName: string;
      capability: CapabilityDetail;
    }>
  ): {
    capability: MitsubishiCapability;
    score: number;
    category: string;
  } {
    let bestMatch = {
      capability: null as any,
      score: 0,
      category: '',
    };

    for (const cap of capabilities) {
      const score = this.calculateSimilarity(
        required.description,
        `${cap.capability.name} ${cap.capability.description}`
      );

      if (score > bestMatch.score) {
        bestMatch = {
          capability: {
            category: cap.category as any,
            name: cap.capability.name,
            description: cap.capability.description,
            specificAssets: cap.capability.specificAssets,
          },
          score,
          category: cap.categoryName,
        };
      }
    }

    return bestMatch;
  }

  /**
   * 文字列の類似度を計算（簡易版）
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const keywords1 = this.extractKeywords(str1);
    const keywords2 = this.extractKeywords(str2);
    
    const intersection = keywords1.filter(k => keywords2.includes(k));
    const union = [...new Set([...keywords1, ...keywords2])];
    
    return union.length > 0 ? intersection.length / union.length : 0;
  }

  /**
   * キーワード抽出
   */
  private extractKeywords(text: string): string[] {
    // 重要なキーワードを抽出（簡易版）
    const keywords = text
      .toLowerCase()
      .split(/[、。\s,\.]+/)
      .filter(word => word.length > 2)
      .filter(word => !['です', 'ます', 'する', 'こと', 'もの'].includes(word));
    
    return keywords;
  }

  /**
   * ケイパビリティを統合
   */
  private mergeCapabilities(
    matchDetails: MatchDetail[],
    llmSuggestions?: MitsubishiCapability[]
  ): MitsubishiCapability[] {
    const merged: MitsubishiCapability[] = matchDetails.map(d => d.matched);
    
    if (llmSuggestions) {
      // LLMの提案で重複しないものを追加
      for (const suggestion of llmSuggestions) {
        const isDuplicate = merged.some(m => 
          m.name === suggestion.name && m.category === suggestion.category
        );
        
        if (!isDuplicate) {
          merged.push(suggestion);
        }
      }
    }

    return merged;
  }

  /**
   * マッチスコアを計算
   */
  private calculateMatchScore(
    required: RequiredCapability[],
    matches: MatchDetail[]
  ): number {
    if (required.length === 0) return 0;

    let totalScore = 0;
    let totalWeight = 0;

    for (const req of required) {
      const weight = this.getImportanceWeight(req.importance);
      const match = matches.find(m => m.required.name === req.name);
      
      if (match) {
        totalScore += match.score * weight;
      }
      
      totalWeight += weight;
    }

    return totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) : 0;
  }

  /**
   * 重要度の重み付け
   */
  private getImportanceWeight(importance: RequiredCapability['importance']): number {
    switch (importance) {
      case 'critical':
        return 3;
      case 'important':
        return 2;
      case 'nice-to-have':
        return 1;
      default:
        return 1;
    }
  }

  /**
   * ケイパビリティのスコアリング（4大カテゴリ別）
   */
  scoreByCate gory(capabilities: MitsubishiCapability[]): {
    realEstateDevelopment: number;
    operations: number;
    finance: number;
    innovation: number;
  } {
    const scores = {
      realEstateDevelopment: 0,
      operations: 0,
      finance: 0,
      innovation: 0,
    };

    const categoryMap = {
      'real_estate_development': 'realEstateDevelopment',
      'operations': 'operations',
      'finance': 'finance',
      'innovation': 'innovation',
    } as const;

    for (const cap of capabilities) {
      const category = categoryMap[cap.category];
      if (category) {
        scores[category] += 25; // 各カテゴリ最大25点
      }
    }

    // 正規化（各カテゴリ0-25点）
    Object.keys(scores).forEach(key => {
      scores[key as keyof typeof scores] = Math.min(scores[key as keyof typeof scores], 25);
    });

    return scores;
  }
}

/**
 * マッチ詳細
 */
interface MatchDetail {
  required: RequiredCapability;
  matched: MitsubishiCapability;
  score: number;
  category: string;
}