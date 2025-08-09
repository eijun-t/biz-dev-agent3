"use strict";
/**
 * Synergy Scoring Service
 * 三菱地所シナジー評価サービス
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SynergyScoringService = void 0;
const mitsubishi_capability_1 = require("@/lib/types/mitsubishi-capability");
const llm_evaluator_1 = require("./llm-evaluator");
const errors_1 = require("../errors");
/**
 * Synergy Scoring Service
 */
class SynergyScoringService {
    constructor(config) {
        this.config = {
            llmModel: config?.llmModel || 'gpt-4o',
            temperature: config?.temperature ?? 0.4, // 少し高めでクリエイティブなシナリオ生成
            enableMultiStageEvaluation: config?.enableMultiStageEvaluation ?? true,
        };
        this.llmEvaluator = new llm_evaluator_1.LLMEvaluator({
            model: this.config.llmModel,
            temperature: this.config.temperature,
        });
    }
    /**
     * シナジー評価を実行（3段階評価）
     */
    async evaluateSynergy(idea) {
        try {
            // Stage 1: ケイパビリティマッピング
            const capabilityMapping = await this.evaluateCapabilityMapping(idea);
            // Stage 2: シナジーシナリオ生成
            const synergyScenario = await this.generateSynergyScenario(idea, capabilityMapping);
            // Stage 3: シナリオ検証
            const scenarioValidation = await this.validateScenario(synergyScenario);
            // スコア計算
            const score = this.calculateSynergyScore(capabilityMapping, synergyScenario, scenarioValidation);
            return {
                total: score.total,
                breakdown: score.breakdown,
                capabilityMapping,
                synergyScenario,
                scenarioValidation,
                reasoning: this.generateReasoning(capabilityMapping, synergyScenario, scenarioValidation),
            };
        }
        catch (error) {
            throw (0, errors_1.toCriticError)(error);
        }
    }
    /**
     * Stage 1: ケイパビリティマッピング
     */
    async evaluateCapabilityMapping(idea) {
        const mitsubishiCapabilities = (0, mitsubishi_capability_1.generateCapabilityDescription)();
        const llmResult = await this.llmEvaluator.evaluateCapabilityMatch(idea, mitsubishiCapabilities);
        return {
            requiredCapabilities: llmResult.requiredCapabilities,
            mitsubishiCapabilities: llmResult.matchedCapabilities,
            matchScore: llmResult.matchScore,
            gaps: llmResult.gaps,
        };
    }
    /**
     * Stage 2: シナジーシナリオ生成
     */
    async generateSynergyScenario(idea, capabilityMapping) {
        const llmResult = await this.llmEvaluator.generateSynergyScenario(idea, capabilityMapping.mitsubishiCapabilities);
        return {
            scenario: llmResult.scenario,
            keyAdvantages: llmResult.keyAdvantages,
            synergyMultiplier: llmResult.synergyMultiplier,
        };
    }
    /**
     * Stage 3: シナリオ検証
     */
    async validateScenario(synergyScenario) {
        const llmResult = await this.llmEvaluator.validateScenario(synergyScenario.scenario, synergyScenario.keyAdvantages);
        return {
            logicalConsistency: llmResult.logicalConsistency,
            feasibility: llmResult.feasibility,
            uniqueness: llmResult.uniqueness,
            overallCredibility: llmResult.overallCredibility,
            validationComments: llmResult.validationComments,
        };
    }
    /**
     * シナジースコア計算
     */
    calculateSynergyScore(capabilityMapping, synergyScenario, scenarioValidation) {
        // ケイパビリティマッチ度 (0-20点)
        const capabilityMatch = Math.round((capabilityMapping.matchScore / 100) * 20);
        // シナジー効果 (0-15点)
        // シナジー乗数とシナリオの実現可能性から計算
        const synergyEffect = Math.round(((synergyScenario.synergyMultiplier - 1.0) / 0.5) * 10 + // 乗数効果（最大10点）
            (scenarioValidation.feasibility / 100) * 5 // 実現可能性（最大5点）
        );
        // 独自優位性 (0-15点)
        // 独自性と総合的な納得度から計算
        const uniqueAdvantage = Math.round((scenarioValidation.uniqueness / 100) * 10 + // 独自性（最大10点）
            (scenarioValidation.overallCredibility / 100) * 5 // 納得度（最大5点）
        );
        // 各項目を範囲内に収める
        const breakdown = {
            capabilityMatch: Math.min(capabilityMatch, 20),
            synergyEffect: Math.min(synergyEffect, 15),
            uniqueAdvantage: Math.min(uniqueAdvantage, 15),
        };
        return {
            total: breakdown.capabilityMatch + breakdown.synergyEffect + breakdown.uniqueAdvantage,
            breakdown,
        };
    }
    /**
     * 評価理由の生成
     */
    generateReasoning(capabilityMapping, synergyScenario, scenarioValidation) {
        const reasons = [];
        // ケイパビリティマッチについて
        if (capabilityMapping.matchScore >= 80) {
            reasons.push('三菱地所の既存ケイパビリティと高い親和性');
        }
        else if (capabilityMapping.matchScore >= 60) {
            reasons.push('三菱地所のケイパビリティを活用可能');
        }
        else {
            reasons.push('ケイパビリティのギャップ存在も補完可能');
        }
        // シナジー効果について
        if (synergyScenario.synergyMultiplier >= 1.3) {
            reasons.push('顕著なシナジー効果（1.3倍以上）が期待');
        }
        // 独自優位性について
        if (scenarioValidation.uniqueness >= 80) {
            reasons.push('他社には模倣困難な独自優位性を確立');
        }
        // ギャップがある場合
        if (capabilityMapping.gaps.length > 0) {
            reasons.push(`課題: ${capabilityMapping.gaps[0]}`);
        }
        return reasons.join('。') + '。';
    }
    /**
     * 詳細なシナジー評価レポート生成
     */
    async generateDetailedReport(idea, synergyScore) {
        const capabilities = (0, mitsubishi_capability_1.getFlatCapabilityList)();
        const matchedCapNames = synergyScore.capabilityMapping.mitsubishiCapabilities
            .map(c => c.name)
            .join('、');
        const report = `
## シナジー評価レポート: ${idea.title}

### 総合スコア: ${synergyScore.total}/50点

#### 評価内訳:
- ケイパビリティマッチ: ${synergyScore.breakdown.capabilityMatch}/20点
- シナジー効果: ${synergyScore.breakdown.synergyEffect}/15点
- 独自優位性: ${synergyScore.breakdown.uniqueAdvantage}/15点

### 活用可能なケイパビリティ:
${matchedCapNames}

### シナジーシナリオ:
${synergyScore.synergyScenario.scenario}

### 主要な優位性:
${synergyScore.synergyScenario.keyAdvantages.map(a => `- ${a}`).join('\n')}

### シナリオ検証結果:
- 論理的整合性: ${synergyScore.scenarioValidation.logicalConsistency}%
- 実現可能性: ${synergyScore.scenarioValidation.feasibility}%
- 独自性: ${synergyScore.scenarioValidation.uniqueness}%
- 総合的納得度: ${synergyScore.scenarioValidation.overallCredibility}%

### 評価コメント:
${synergyScore.scenarioValidation.validationComments.map(c => `- ${c}`).join('\n')}

### ギャップ分析:
${synergyScore.capabilityMapping.gaps.length > 0
            ? synergyScore.capabilityMapping.gaps.map(g => `- ${g}`).join('\n')
            : '- 重大なギャップなし'}
`;
        return report.trim();
    }
}
exports.SynergyScoringService = SynergyScoringService;
