"use strict";
/**
 * LLM Evaluator Service
 * LLMを使用した評価サービス
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMEvaluator = void 0;
const openai_1 = require("@langchain/openai");
const messages_1 = require("@langchain/core/messages");
const errors_1 = require("../errors");
const critic_1 = require("@/lib/validations/critic");
/**
 * LLM Evaluator Service
 */
class LLMEvaluator {
    constructor(config) {
        this.config = {
            model: config?.model || process.env.LLM_MODEL || 'gpt-4o',
            temperature: config?.temperature ?? 0.3,
            maxRetries: config?.maxRetries ?? 2,
            timeoutMs: config?.timeoutMs ?? 30000,
        };
        this.llm = new openai_1.ChatOpenAI({
            modelName: this.config.model,
            temperature: this.config.temperature,
            maxTokens: 2000,
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    /**
     * 市場評価を実行
     */
    async evaluateMarket(idea) {
        const systemPrompt = `あなたは新規事業の市場性を評価する専門家です。
以下の基準で市場評価を行ってください：

1. 市場規模 (0-20点)
   - 10億円未満: 0-5点
   - 10-100億円: 6-10点
   - 100-1000億円: 11-15点
   - 1000億円以上: 16-20点

2. 成長性 (0-15点)
   - 縮小市場: 0-3点
   - 横ばい: 4-7点
   - 緩やかな成長: 8-11点
   - 急成長: 12-15点

3. 収益性 (0-15点)
   - 営業利益率5%未満: 0-5点
   - 営業利益率5-10%: 6-10点
   - 営業利益率10%以上: 11-15点
   - 特に10億円以上の営業利益が見込める場合は高得点

必ず合計50点満点で評価し、JSON形式で回答してください。`;
        const userPrompt = `以下のビジネスアイデアを評価してください：

タイトル: ${idea.title}
説明: ${idea.description}
ターゲット顧客: ${idea.targetCustomer}
顧客の課題: ${idea.customerProblem}
提案する解決策: ${idea.proposedSolution}
収益モデル: ${idea.revenueModel}
${idea.estimatedRevenue ? `想定年間営業利益: ${idea.estimatedRevenue}円` : ''}
${idea.marketSize ? `市場規模: ${idea.marketSize}` : ''}

以下のJSON形式で回答してください：
{
  "marketScore": {
    "total": <合計点数0-50>,
    "breakdown": {
      "marketSize": <市場規模0-20>,
      "growthPotential": <成長性0-15>,
      "profitability": <収益性0-15>
    },
    "reasoning": "<評価の理由>",
    "evidence": ["<根拠1>", "<根拠2>", ...]
  },
  "risks": ["<リスク1>", "<リスク2>", ...],
  "opportunities": ["<機会1>", "<機会2>", ...],
  "recommendation": "<推奨事項>"
}`;
        return this.executeWithRetry(async () => {
            const response = await (0, errors_1.withTimeout)(this.llm.invoke([
                new messages_1.SystemMessage(systemPrompt),
                new messages_1.HumanMessage(userPrompt),
            ]), this.config.timeoutMs);
            const content = response.content.toString();
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Failed to extract JSON from LLM response');
            }
            const parsed = JSON.parse(jsonMatch[0]);
            return critic_1.llmEvaluationResponseSchema.parse(parsed);
        });
    }
    /**
     * ケイパビリティマッチング評価
     */
    async evaluateCapabilityMatch(idea, mitsubishiCapabilities) {
        const systemPrompt = `あなたは三菱地所のケイパビリティと新規事業の適合性を評価する専門家です。
三菱地所の保有ケイパビリティ：
${mitsubishiCapabilities}

以下の観点で評価してください：
1. このビジネスに必要なケイパビリティを特定
2. 三菱地所の保有ケイパビリティとのマッチング
3. ギャップの特定
4. マッチ度をパーセンテージで評価`;
        const userPrompt = `以下のビジネスアイデアに必要なケイパビリティを分析してください：

${idea.title}
${idea.description}

JSON形式で回答：
{
  "requiredCapabilities": [
    {
      "name": "<ケイパビリティ名>",
      "importance": "critical|important|nice-to-have",
      "description": "<説明>"
    }
  ],
  "matchedCapabilities": [
    {
      "category": "real_estate_development|operations|finance|innovation",
      "name": "<ケイパビリティ名>",
      "description": "<どのように活用できるか>",
      "specificAssets": ["<具体的な資産>"]
    }
  ],
  "matchScore": <0-100>,
  "gaps": ["<ギャップ1>", "<ギャップ2>"]
}`;
        return this.executeWithRetry(async () => {
            const response = await (0, errors_1.withTimeout)(this.llm.invoke([
                new messages_1.SystemMessage(systemPrompt),
                new messages_1.HumanMessage(userPrompt),
            ]), this.config.timeoutMs);
            const content = response.content.toString();
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Failed to extract JSON from LLM response');
            }
            const parsed = JSON.parse(jsonMatch[0]);
            return critic_1.llmSynergyResponseSchema.parse(parsed);
        });
    }
    /**
     * シナジーシナリオ生成
     */
    async generateSynergyScenario(idea, matchedCapabilities) {
        const systemPrompt = `あなたは三菱地所の強みを活かした事業シナリオを作成する専門家です。
「三菱地所のケイパビリティを掛け合わせることによって他社がこの事業を行うよりも圧倒的に有利に進められる」
という内容のシナリオを作成してください。

具体的に以下を含めてください：
- 丸の内30棟のビル群をどう活用するか
- 3000社のテナント企業をどう巻き込むか
- 三菱グループのシナジーをどう活かすか
- 他社には真似できない独自の優位性は何か`;
        const userPrompt = `ビジネスアイデア: ${idea.title}
${idea.description}

活用可能なケイパビリティ:
${JSON.stringify(matchedCapabilities, null, 2)}

以下のJSON形式でシナリオを作成：
{
  "scenario": "<具体的な実行シナリオ>",
  "keyAdvantages": ["<優位性1>", "<優位性2>", ...],
  "synergyMultiplier": <1.0-1.5のシナジー乗数>,
  "capabilityUtilization": {
    "realEstateDevelopment": "<不動産開発の活用方法>",
    "operations": "<運営サービスの活用方法>",
    "finance": "<金融・投資の活用方法>",
    "innovation": "<イノベーションの活用方法>"
  }
}`;
        return this.executeWithRetry(async () => {
            const response = await (0, errors_1.withTimeout)(this.llm.invoke([
                new messages_1.SystemMessage(systemPrompt),
                new messages_1.HumanMessage(userPrompt),
            ]), this.config.timeoutMs);
            const content = response.content.toString();
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Failed to extract JSON from LLM response');
            }
            const parsed = JSON.parse(jsonMatch[0]);
            return critic_1.llmScenarioResponseSchema.parse(parsed);
        });
    }
    /**
     * シナリオ検証
     */
    async validateScenario(scenario, keyAdvantages) {
        const systemPrompt = `あなたは事業シナリオの客観的な評価者です。
提示されたシナリオについて、以下の観点で0-100点で評価してください：

1. 論理的整合性: シナリオに矛盾がないか
2. 実現可能性: 実際に実行可能か
3. 独自性: 他社には真似できない要素があるか
4. 総合的な納得度: 説得力があるか

批判的な視点で評価し、改善点も指摘してください。`;
        const userPrompt = `以下のシナリオを検証してください：

シナリオ:
${scenario}

主張する優位性:
${keyAdvantages.join('\n')}

JSON形式で評価：
{
  "logicalConsistency": <0-100>,
  "feasibility": <0-100>,
  "uniqueness": <0-100>,
  "overallCredibility": <0-100>,
  "validationComments": ["<検証コメント1>", "<検証コメント2>"],
  "improvements": ["<改善提案1>", "<改善提案2>"]
}`;
        return this.executeWithRetry(async () => {
            const response = await (0, errors_1.withTimeout)(this.llm.invoke([
                new messages_1.SystemMessage(systemPrompt),
                new messages_1.HumanMessage(userPrompt),
            ]), this.config.timeoutMs);
            const content = response.content.toString();
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Failed to extract JSON from LLM response');
            }
            const parsed = JSON.parse(jsonMatch[0]);
            return critic_1.llmScenarioValidationResponseSchema.parse(parsed);
        });
    }
    /**
     * 総合評価サマリー生成
     */
    async generateSummary(ideas, evaluationResults) {
        const systemPrompt = `あなたは新規事業評価のサマリーを作成する専門家です。
5つのビジネスアイデアの評価結果を総括し、最も推奨するアイデアとその理由を簡潔に説明してください。`;
        const userPrompt = `評価結果:
${evaluationResults.map((r, i) => `
${i + 1}. ${ideas[i].title}
- 市場スコア: ${r.marketScore.total}/50点
- シナジースコア: ${r.synergyScore.total}/50点
- 合計: ${r.totalScore}/100点
`).join('\n')}

200文字以内で総括してください。`;
        const response = await this.llm.invoke([
            new messages_1.SystemMessage(systemPrompt),
            new messages_1.HumanMessage(userPrompt),
        ]);
        return response.content.toString();
    }
    /**
     * リトライ付き実行
     */
    async executeWithRetry(fn) {
        return (0, errors_1.retryWithBackoff)(fn, this.config.maxRetries, (attempt, error) => {
            console.log(`LLM call retry attempt ${attempt}: ${error.message}`);
        });
    }
    /**
     * トークン使用量を取得
     */
    getTokenUsage() {
        // Note: This would need actual implementation with token counting
        // For now, return an estimate
        return 1500;
    }
}
exports.LLMEvaluator = LLMEvaluator;
