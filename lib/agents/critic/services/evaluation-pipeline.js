"use strict";
/**
 * Evaluation Pipeline Service
 * 評価パイプライン - 複数アイデアの並列評価と選定
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationPipeline = void 0;
const market_scoring_service_1 = require("./market-scoring-service");
const synergy_scoring_service_1 = require("./synergy-scoring-service");
const llm_evaluator_1 = require("./llm-evaluator");
const errors_1 = require("../errors");
const uuid_1 = require("uuid");
/**
 * Evaluation Pipeline Service
 */
class EvaluationPipeline {
    constructor(config) {
        this.config = {
            marketWeight: config?.marketWeight ?? 0.5,
            synergyWeight: config?.synergyWeight ?? 0.5,
            minimumTotalScore: config?.minimumTotalScore ?? 60,
            llmModel: config?.llmModel || 'gpt-4o',
            temperature: config?.temperature ?? 0.3,
            maxRetries: config?.maxRetries ?? 2,
            cacheEnabled: config?.cacheEnabled ?? true,
            cacheTTL: config?.cacheTTL ?? 3600000,
            parallelProcessing: config?.parallelProcessing ?? true,
            maxConcurrent: config?.maxConcurrent ?? 3,
        };
        // 重みの正規化
        const totalWeight = this.config.marketWeight + this.config.synergyWeight;
        if (Math.abs(totalWeight - 1.0) > 0.01) {
            this.config.marketWeight = this.config.marketWeight / totalWeight;
            this.config.synergyWeight = this.config.synergyWeight / totalWeight;
        }
        // サービスの初期化
        this.marketScorer = new market_scoring_service_1.MarketScoringService({
            llmModel: this.config.llmModel,
            temperature: this.config.temperature,
        });
        this.synergyScorer = new synergy_scoring_service_1.SynergyScoringService({
            llmModel: this.config.llmModel,
            temperature: this.config.temperature,
        });
        this.llmEvaluator = new llm_evaluator_1.LLMEvaluator({
            model: this.config.llmModel,
            temperature: this.config.temperature,
            maxRetries: this.config.maxRetries,
        });
    }
    /**
     * 評価パイプラインの実行
     */
    async evaluate(input) {
        const startTime = new Date();
        const evaluationId = (0, uuid_1.v4)();
        const errors = [];
        let tokensUsed = 0;
        let llmCalls = 0;
        let cacheHits = 0;
        try {
            // 並列評価の実行
            const evaluationResults = await this.evaluateIdeas(input.ideas);
            // 最優秀アイデアの選定
            const selectedIdea = this.selectBestIdea(evaluationResults);
            // サマリー生成
            const summary = await this.generateSummary(input.ideas, evaluationResults);
            // メタデータ作成
            const endTime = new Date();
            const metadata = {
                evaluationId,
                startTime,
                endTime,
                processingTime: endTime.getTime() - startTime.getTime(),
                tokensUsed: this.llmEvaluator.getTokenUsage(),
                llmCalls: evaluationResults.length * 3, // 市場評価、シナジー評価×3段階
                cacheHits,
                errors,
            };
            return {
                sessionId: input.sessionId,
                evaluationResults,
                selectedIdea,
                summary,
                metadata,
            };
        }
        catch (error) {
            // 部分的な結果がある場合は返す
            if (error instanceof errors_1.PartialResultError) {
                const endTime = new Date();
                const metadata = {
                    evaluationId,
                    startTime,
                    endTime,
                    processingTime: endTime.getTime() - startTime.getTime(),
                    tokensUsed,
                    llmCalls,
                    cacheHits,
                    errors: [...errors, error.message],
                };
                // 部分的な結果から最良のものを選択
                const partialResults = error.partialResults;
                const selectedIdea = partialResults.length > 0
                    ? this.selectBestIdea(partialResults)
                    : null;
                if (selectedIdea) {
                    return {
                        sessionId: input.sessionId,
                        evaluationResults: partialResults,
                        selectedIdea,
                        summary: `部分的な評価完了: ${partialResults.length}/${input.ideas.length}件を評価`,
                        metadata,
                    };
                }
            }
            throw error;
        }
    }
    /**
     * 複数アイデアの評価（並列処理）
     */
    async evaluateIdeas(ideas) {
        if (this.config.parallelProcessing) {
            // 並列処理
            const chunks = this.chunkArray(ideas, this.config.maxConcurrent);
            const results = [];
            for (const chunk of chunks) {
                const chunkResults = await Promise.all(chunk.map(idea => this.evaluateSingleIdea(idea)));
                results.push(...chunkResults);
            }
            // ランキング付け
            return this.rankResults(results);
        }
        else {
            // 逐次処理
            const results = [];
            for (const idea of ideas) {
                const result = await this.evaluateSingleIdea(idea);
                results.push(result);
            }
            return this.rankResults(results);
        }
    }
    /**
     * 単一アイデアの評価
     */
    async evaluateSingleIdea(idea) {
        // 30秒のタイムアウト設定
        return (0, errors_1.withTimeout)(this.evaluateIdeaInternal(idea), 30000, `Evaluation timeout for idea: ${idea.title}`);
    }
    /**
     * アイデア評価の内部実装
     */
    async evaluateIdeaInternal(idea) {
        // 市場評価とシナジー評価を並列実行
        const [marketScore, synergyScore] = await Promise.all([
            this.marketScorer.evaluateMarket(idea),
            this.synergyScorer.evaluateSynergy(idea),
        ]);
        // リスクと機会の分析（LLMから取得済み）
        const risks = [];
        const opportunities = [];
        // 推奨事項の生成
        const totalScore = this.calculateTotalScore(marketScore.total, synergyScore.total);
        const recommendation = this.generateRecommendation(totalScore, marketScore, synergyScore);
        return {
            ideaId: idea.id,
            ideaTitle: idea.title,
            marketScore,
            synergyScore,
            totalScore,
            recommendation,
            risks,
            opportunities,
        };
    }
    /**
     * 合計スコアの計算
     */
    calculateTotalScore(marketScore, synergyScore) {
        // 重み付き平均を計算し、100点満点に正規化
        const weightedMarket = marketScore * this.config.marketWeight * 2; // 50点満点を100点満点に
        const weightedSynergy = synergyScore * this.config.synergyWeight * 2;
        return Math.round(weightedMarket + weightedSynergy);
    }
    /**
     * 最優秀アイデアの選定
     */
    selectBestIdea(results) {
        if (results.length === 0) {
            throw new Error('No evaluation results to select from');
        }
        // 合計スコアでソート
        const sorted = [...results].sort((a, b) => b.totalScore - a.totalScore);
        // 最小スコア要件をチェック
        if (sorted[0].totalScore < this.config.minimumTotalScore) {
            console.warn(`Best idea score (${sorted[0].totalScore}) is below minimum threshold (${this.config.minimumTotalScore})`);
        }
        return sorted[0];
    }
    /**
     * 結果のランキング付け
     */
    rankResults(results) {
        const sorted = [...results].sort((a, b) => b.totalScore - a.totalScore);
        return sorted.map((result, index) => ({
            ...result,
            rank: index + 1,
        }));
    }
    /**
     * 推奨事項の生成
     */
    generateRecommendation(totalScore, marketScore, synergyScore) {
        if (totalScore >= 80) {
            return '強く推奨: 市場性・シナジー共に優れており、早期の事業化検討を推奨';
        }
        else if (totalScore >= 70) {
            return '推奨: 十分な事業ポテンシャルあり、詳細検討を推奨';
        }
        else if (totalScore >= 60) {
            return '条件付き推奨: 一部課題はあるが検討の価値あり';
        }
        else if (totalScore >= 50) {
            return '要改善: 市場性またはシナジーの強化が必要';
        }
        else {
            return '非推奨: 現時点では事業化は困難';
        }
    }
    /**
     * 評価サマリーの生成
     */
    async generateSummary(ideas, results) {
        try {
            return await this.llmEvaluator.generateSummary(ideas, results);
        }
        catch (error) {
            // エラー時はデフォルトサマリー
            const best = this.selectBestIdea(results);
            return `評価完了: 「${best.ideaTitle}」が最高評価（${best.totalScore}点）を獲得。` +
                `市場スコア${best.marketScore.total}点、シナジースコア${best.synergyScore.total}点。`;
        }
    }
    /**
     * 配列をチャンクに分割
     */
    chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }
}
exports.EvaluationPipeline = EvaluationPipeline;
