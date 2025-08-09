"use strict";
/**
 * Critic Agent
 * ビジネスアイデアの評価・選定エージェント
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CriticAgent = void 0;
exports.createCriticAgent = createCriticAgent;
const base_agent_1 = require("@/lib/interfaces/base-agent");
const critic_1 = require("@/lib/types/critic");
const critic_2 = require("@/lib/validations/critic");
const evaluation_pipeline_1 = require("./services/evaluation-pipeline");
const errors_1 = require("./errors");
/**
 * Critic Agent Implementation
 */
class CriticAgent extends base_agent_1.BaseAgent {
    constructor(config) {
        super();
        this.config = config || {};
        this.pipeline = new evaluation_pipeline_1.EvaluationPipeline(this.config);
    }
    /**
     * エージェント名を返す
     */
    getAgentName() {
        return 'critic';
    }
    /**
     * エージェントの説明を返す
     */
    getDescription() {
        return 'ビジネスアイデアを市場規模とシナジーの観点から評価し、最適なアイデアを選定します';
    }
    /**
     * 評価を実行
     */
    async execute(input) {
        try {
            // 入力検証
            const validatedInput = await this.validateInput(input);
            // ログ記録
            await this.logExecution('start', {
                ideaCount: validatedInput.ideas.length,
                sessionId: validatedInput.sessionId,
            });
            // 評価パイプライン実行
            const output = await this.pipeline.evaluate(validatedInput);
            // 出力検証
            const validatedOutput = await this.validateOutput(output);
            // 成功ログ
            await this.logExecution('success', {
                selectedIdea: validatedOutput.selectedIdea.ideaTitle,
                totalScore: validatedOutput.selectedIdea.totalScore,
                processingTime: validatedOutput.metadata.processingTime,
            });
            return validatedOutput;
        }
        catch (error) {
            // エラー変換
            const criticError = (0, errors_1.toCriticError)(error);
            // エラーログ
            await this.logExecution('error', {
                error: criticError.message,
                code: criticError.code,
                isRetryable: criticError.isRetryable,
            });
            // ユーザーフレンドリーなメッセージでエラーを投げる
            throw new Error((0, errors_1.formatErrorMessage)(criticError));
        }
    }
    /**
     * 入力の検証
     */
    async validateInput(input) {
        try {
            return critic_2.criticInputSchema.parse(input);
        }
        catch (error) {
            throw new critic_1.CriticError(critic_1.CriticErrorCode.INVALID_INPUT, '入力データの検証に失敗しました', error, false);
        }
    }
    /**
     * 出力の検証
     */
    async validateOutput(output) {
        try {
            return critic_2.criticOutputSchema.parse(output);
        }
        catch (error) {
            throw new critic_1.CriticError(critic_1.CriticErrorCode.EVALUATION_FAILED, '出力データの検証に失敗しました', error, false);
        }
    }
    /**
     * 評価設定を更新
     */
    updateConfig(config) {
        this.config = { ...this.config, ...config };
        this.pipeline = new evaluation_pipeline_1.EvaluationPipeline(this.config);
    }
    /**
     * 現在の設定を取得
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * エージェントの状態を取得
     */
    async getStatus() {
        return {
            ready: true,
            config: this.getConfig(),
            capabilities: [
                '市場規模評価（0-50点）',
                '三菱地所シナジー評価（0-50点）',
                '3段階シナジー検証（ケイパビリティ→シナリオ→検証）',
                '並列評価処理',
                '最優秀アイデア自動選定',
            ],
        };
    }
    /**
     * テスト用のモック評価
     */
    async mockEvaluate(input) {
        // テスト用のモック実装
        const mockResults = input.ideas.map((idea, index) => ({
            ideaId: idea.id,
            ideaTitle: idea.title,
            marketScore: {
                total: 35 + index * 5,
                breakdown: {
                    marketSize: 15,
                    growthPotential: 10 + index * 2,
                    profitability: 10 + index * 3,
                },
                reasoning: 'モック評価',
                evidence: ['テストエビデンス'],
            },
            synergyScore: {
                total: 40 - index * 3,
                breakdown: {
                    capabilityMatch: 15,
                    synergyEffect: 13 - index,
                    uniqueAdvantage: 12 - index * 2,
                },
                capabilityMapping: {
                    requiredCapabilities: [],
                    mitsubishiCapabilities: [],
                    matchScore: 80,
                    gaps: [],
                },
                synergyScenario: {
                    scenario: 'テストシナリオ',
                    keyAdvantages: ['テスト優位性'],
                    synergyMultiplier: 1.2,
                },
                scenarioValidation: {
                    logicalConsistency: 85,
                    feasibility: 80,
                    uniqueness: 75,
                    overallCredibility: 80,
                    validationComments: ['テストコメント'],
                },
                reasoning: 'モックシナジー評価',
            },
            totalScore: 75 + index * 2,
            rank: index + 1,
            recommendation: 'テスト推奨',
            risks: ['テストリスク'],
            opportunities: ['テスト機会'],
        }));
        const selectedIdea = mockResults[0];
        return {
            sessionId: input.sessionId,
            evaluationResults: mockResults,
            selectedIdea,
            summary: 'モック評価完了',
            metadata: {
                evaluationId: 'mock-eval-id',
                startTime: new Date(),
                endTime: new Date(),
                processingTime: 1000,
                tokensUsed: 500,
                llmCalls: 3,
                cacheHits: 0,
                errors: [],
            },
        };
    }
}
exports.CriticAgent = CriticAgent;
/**
 * Factory function to create Critic Agent
 */
function createCriticAgent(config) {
    return new CriticAgent(config);
}
