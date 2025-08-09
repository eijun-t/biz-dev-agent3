"use strict";
/**
 * Creative Prompt Builder
 * 市場機会と顧客課題を抽出し、創造的なプロンプトを構築
 */
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreativePromptBuilder = void 0;
var uuid_1 = require("uuid");
var prompts_1 = require("@langchain/core/prompts");
var constants_1 = require("./constants");
var CreativePromptBuilder = /** @class */ (function () {
    function CreativePromptBuilder() {
    }
    /**
     * EnhancedOutputから市場機会を抽出
     */
    CreativePromptBuilder.prototype.extractOpportunities = function (data) {
        var _this = this;
        var _a;
        var opportunities = [];
        // detailedAnalysisから機会を抽出
        if ((_a = data.detailedAnalysis) === null || _a === void 0 ? void 0 : _a.opportunities) {
            data.detailedAnalysis.opportunities.forEach(function (opp, index) {
                var _a;
                var marketSize = _this.estimateMarketSize(data, index);
                var growthRate = ((_a = data.metrics) === null || _a === void 0 ? void 0 : _a.growthRate) || 10;
                opportunities.push({
                    id: (0, uuid_1.v4)(),
                    description: opp,
                    marketSize: marketSize,
                    growthRate: growthRate,
                    unmetNeeds: _this.extractUnmetNeeds(data, opp),
                    competitiveGaps: _this.extractCompetitiveGaps(data, opp)
                });
            });
        }
        // factsから追加の機会を特定
        var additionalOpportunities = this.identifyOpportunitiesFromFacts(data.facts);
        opportunities.push.apply(opportunities, additionalOpportunities);
        return opportunities;
    };
    /**
     * EnhancedOutputから顧客課題を特定
     */
    CreativePromptBuilder.prototype.identifyCustomerPains = function (data) {
        var _this = this;
        var _a;
        var pains = [];
        // challengesから課題を抽出
        if ((_a = data.detailedAnalysis) === null || _a === void 0 ? void 0 : _a.challenges) {
            data.detailedAnalysis.challenges.forEach(function (challenge) {
                pains.push({
                    id: (0, uuid_1.v4)(),
                    description: challenge,
                    severity: _this.assessSeverity(challenge),
                    frequency: _this.assessFrequency(challenge),
                    currentSolutions: _this.identifyCurrentSolutions(data, challenge),
                    limitations: _this.identifyLimitations(data, challenge)
                });
            });
        }
        // factsから追加の課題を特定
        var additionalPains = this.identifyPainsFromFacts(data.facts);
        pains.push.apply(pains, additionalPains);
        return pains;
    };
    /**
     * アイディエーション用のプロンプトを構築
     */
    CreativePromptBuilder.prototype.buildIdeationPrompt = function (research) {
        var template = "".concat(constants_1.PROMPT_CONFIG.systemRole, "\n\n\u4EE5\u4E0B\u306E\u5E02\u5834\u8ABF\u67FB\u7D50\u679C\u306B\u57FA\u3065\u3044\u3066\u3001\u9769\u65B0\u7684\u306A\u30D3\u30B8\u30CD\u30B9\u30A2\u30A4\u30C7\u30A2\u3092\u6B63\u78BA\u306B").concat(constants_1.IDEA_GENERATION.requiredCount, "\u3064\u751F\u6210\u3057\u3066\u304F\u3060\u3055\u3044\u3002\n\n## \u5E02\u5834\u8ABF\u67FB\u7D50\u679C\n{research_summary}\n\n## \u91CD\u8981\u306A\u4E8B\u5B9F\n{facts}\n\n## \u5E02\u5834\u6A5F\u4F1A\n{market_opportunities}\n\n## \u9867\u5BA2\u8AB2\u984C\n{customer_pains}\n\n## \u5E02\u5834\u30C8\u30EC\u30F3\u30C9\n{trends}\n\n## \u8981\u4EF6\n1. \u5404\u30A2\u30A4\u30C7\u30A2\u306F\u55B6\u696D\u5229\u76CA").concat(constants_1.IDEA_GENERATION.targetRevenue.toLocaleString(), "\u5186\u898F\u6A21\u306E\u5B9F\u73FE\u53EF\u80FD\u6027\u3092\u6301\u3064\u3053\u3068\n2. \u660E\u78BA\u306A\u9867\u5BA2\u30BB\u30B0\u30E1\u30F3\u30C8\u3068\u89E3\u6C7A\u3059\u308B\u8AB2\u984C\u3092\u7279\u5B9A\u3059\u308B\u3053\u3068\n3. \u5177\u4F53\u7684\u306A\u53CE\u76CA\u30E2\u30C7\u30EB\u3092\u63D0\u793A\u3059\u308B\u3053\u3068\n4. \u5B9F\u88C5\u96E3\u6613\u5EA6\uFF08low/medium/high\uFF09\u3092\u8A55\u4FA1\u3059\u308B\u3053\u3068\n5. \u5E02\u5834\u6A5F\u4F1A\u3092\u660E\u78BA\u306B\u8AAC\u660E\u3059\u308B\u3053\u3068\n\n## \u51FA\u529B\u30D5\u30A9\u30FC\u30DE\u30C3\u30C8\n\u4EE5\u4E0B\u306EJSON\u5F62\u5F0F\u3067\u3001\u6B63\u78BA\u306B").concat(constants_1.IDEA_GENERATION.requiredCount, "\u3064\u306E\u30A2\u30A4\u30C7\u30A2\u3092\u751F\u6210\u3057\u3066\u304F\u3060\u3055\u3044\uFF1A\n\n```json\n[\n  {{\n    \"title\": \"30\u6587\u5B57\u4EE5\u5185\u306E\u30BF\u30A4\u30C8\u30EB\",\n    \"description\": \"200\u6587\u5B57\u7A0B\u5EA6\u306E\u8A73\u7D30\u306A\u8AAC\u660E\",\n    \"targetCustomers\": [\"\u9867\u5BA2\u30BB\u30B0\u30E1\u30F3\u30C81\", \"\u9867\u5BA2\u30BB\u30B0\u30E1\u30F3\u30C82\"],\n    \"customerPains\": [\"\u89E3\u6C7A\u3059\u308B\u8AB2\u984C1\", \"\u89E3\u6C7A\u3059\u308B\u8AB2\u984C2\"],\n    \"valueProposition\": \"\u63D0\u4F9B\u4FA1\u5024\u306E\u8A73\u7D30\u306A\u8AAC\u660E\uFF0810\u6587\u5B57\u4EE5\u4E0A\uFF09\",\n    \"revenueModel\": \"\u53CE\u76CA\u30E2\u30C7\u30EB\u306E\u8A73\u7D30\u306A\u8AAC\u660E\uFF0810\u6587\u5B57\u4EE5\u4E0A\uFF09\",\n    \"estimatedRevenue\": \u63A8\u5B9A\u55B6\u696D\u5229\u76CA\uFF08\u6570\u5024\uFF09,\n    \"implementationDifficulty\": \"low/medium/high\",\n    \"marketOpportunity\": \"\u5E02\u5834\u6A5F\u4F1A\u306E\u8A73\u7D30\u306A\u8AAC\u660E\uFF0810\u6587\u5B57\u4EE5\u4E0A\uFF09\"\n  }}\n]\n```\n\n\u5FC5\u305A").concat(constants_1.IDEA_GENERATION.requiredCount, "\u3064\u306E\u30A2\u30A4\u30C7\u30A2\u3092\u751F\u6210\u3057\u3001\u5404\u30D5\u30A3\u30FC\u30EB\u30C9\u306B\u9069\u5207\u306A\u5024\u3092\u8A2D\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044\u3002");
        return new prompts_1.PromptTemplate({
            template: template,
            inputVariables: [
                'research_summary',
                'facts',
                'market_opportunities',
                'customer_pains',
                'trends'
            ]
        });
    };
    /**
     * 市場トレンドを抽出
     */
    CreativePromptBuilder.prototype.extractTrends = function (data) {
        var _a;
        var trends = [];
        if (((_a = data.detailedAnalysis) === null || _a === void 0 ? void 0 : _a.marketTrends) && data.detailedAnalysis.marketTrends.length > 0) {
            trends.push.apply(trends, data.detailedAnalysis.marketTrends);
        }
        // factsからトレンドを抽出（detailedAnalysisが空の場合のみ）
        if (trends.length === 0) {
            var trendKeywords_1 = ['成長', '増加', '拡大', '普及', '移行', '変化'];
            data.facts.forEach(function (fact) {
                if (trendKeywords_1.some(function (keyword) { return fact.includes(keyword); })) {
                    trends.push(fact);
                }
            });
        }
        return __spreadArray([], new Set(trends), true); // 重複を除去
    };
    /**
     * 競合状況をサマライズ
     */
    CreativePromptBuilder.prototype.summarizeCompetitiveLandscape = function (data) {
        var _a, _b;
        if ((_a = data.detailedAnalysis) === null || _a === void 0 ? void 0 : _a.competitiveLandscape) {
            return data.detailedAnalysis.competitiveLandscape;
        }
        // エンティティから競合情報を構築
        var competitors = (_b = data.entities) === null || _b === void 0 ? void 0 : _b.filter(function (e) { return e.type === 'competitor'; }).map(function (e) { return e.name; });
        if (competitors && competitors.length > 0) {
            return "\u4E3B\u8981\u7AF6\u5408: ".concat(competitors.join(', '), "\u3002\u8A73\u7D30\u306A\u7AF6\u5408\u5206\u6790\u306F\u4E0D\u8DB3\u3057\u3066\u3044\u307E\u3059\u3002");
        }
        return '競合情報が不足しています';
    };
    /**
     * 市場コンテキストを分析
     */
    CreativePromptBuilder.prototype.analyzeMarketContext = function (data) {
        return {
            opportunities: this.extractOpportunities(data),
            customerPains: this.identifyCustomerPains(data),
            trends: this.extractTrends(data),
            competitiveLandscape: this.summarizeCompetitiveLandscape(data)
        };
    };
    // Private helper methods
    CreativePromptBuilder.prototype.estimateMarketSize = function (data, index) {
        var _a, _b, _c;
        var baseMarketSize = ((_a = data.metrics) === null || _a === void 0 ? void 0 : _a.marketSize) || 0;
        if (baseMarketSize === 0)
            return 0;
        // 各機会に市場の一部を割り当て
        var opportunityCount = ((_c = (_b = data.detailedAnalysis) === null || _b === void 0 ? void 0 : _b.opportunities) === null || _c === void 0 ? void 0 : _c.length) || 1;
        return Math.floor(baseMarketSize / opportunityCount);
    };
    CreativePromptBuilder.prototype.extractUnmetNeeds = function (data, opportunity) {
        var _a;
        var needs = [];
        // 機会の説明から未解決ニーズを推測
        if (opportunity.includes('不足')) {
            needs.push('既存ソリューションの不足');
        }
        if (opportunity.includes('中小企業')) {
            needs.push('中小企業向けの手頃な価格のソリューション');
        }
        if (opportunity.includes('簡易') || opportunity.includes('シンプル')) {
            needs.push('使いやすいシンプルなソリューション');
        }
        if (opportunity.includes('AI') || opportunity.includes('自動')) {
            needs.push('AI/自動化による効率化');
        }
        // challengesからも抽出
        if ((_a = data.detailedAnalysis) === null || _a === void 0 ? void 0 : _a.challenges) {
            data.detailedAnalysis.challenges.forEach(function (challenge) {
                if (challenge.includes('不足') || challenge.includes('欠如')) {
                    needs.push(challenge);
                }
            });
        }
        return needs.length > 0 ? needs : ['一般的な改善ニーズ'];
    };
    CreativePromptBuilder.prototype.extractCompetitiveGaps = function (data, opportunity) {
        var _a;
        var gaps = [];
        // 競合状況から隙間を特定
        var landscape = ((_a = data.detailedAnalysis) === null || _a === void 0 ? void 0 : _a.competitiveLandscape) || '';
        if (landscape.includes('大企業向け')) {
            gaps.push('中小企業向けソリューションの不在');
        }
        if (landscape.includes('高価') || landscape.includes('高い')) {
            gaps.push('手頃な価格のソリューションの不足');
        }
        if (opportunity.includes('特化')) {
            gaps.push('業界特化型ソリューションの不足');
        }
        return gaps;
    };
    CreativePromptBuilder.prototype.identifyOpportunitiesFromFacts = function (facts) {
        var _this = this;
        var opportunities = [];
        // factsからの追加機会は制限する（重複カウントを避ける）
        var relevantFacts = facts.filter(function (fact) {
            return (fact.includes('成長') || fact.includes('拡大')) &&
                !fact.includes('DX市場');
        } // 既にdetailedAnalysisで処理済みのものは除外
        );
        relevantFacts.slice(0, 1).forEach(function (fact) {
            var marketSizeMatch = fact.match(/(\d+[\d,]*)\s*(億|兆)/);
            var marketSize = marketSizeMatch
                ? _this.parseMarketSize(marketSizeMatch[0])
                : 100000000000; // デフォルト1000億円
            opportunities.push({
                id: (0, uuid_1.v4)(),
                description: fact,
                marketSize: marketSize,
                growthRate: 15, // デフォルト成長率
                unmetNeeds: ['成長市場での先行者利益'],
                competitiveGaps: ['新規参入の機会']
            });
        });
        return opportunities;
    };
    CreativePromptBuilder.prototype.identifyPainsFromFacts = function (facts) {
        var pains = [];
        facts.forEach(function (fact) {
            if (fact.includes('課題') || fact.includes('問題') || fact.includes('困難')) {
                pains.push({
                    id: (0, uuid_1.v4)(),
                    description: fact,
                    severity: 'medium',
                    frequency: 'frequent',
                    currentSolutions: ['既存の手動プロセス'],
                    limitations: ['効率性の欠如', 'スケーラビリティの制限']
                });
            }
        });
        return pains;
    };
    CreativePromptBuilder.prototype.assessSeverity = function (challenge) {
        var highSeverityKeywords = ['深刻', '重大', 'コスト', '人材', '不足'];
        var lowSeverityKeywords = ['軽微', '小さい', '一部'];
        if (highSeverityKeywords.some(function (keyword) { return challenge.includes(keyword); })) {
            return 'high';
        }
        if (lowSeverityKeywords.some(function (keyword) { return challenge.includes(keyword); })) {
            return 'low';
        }
        return 'medium';
    };
    CreativePromptBuilder.prototype.assessFrequency = function (challenge) {
        var frequentKeywords = ['常に', '頻繁', '日常', '継続'];
        var rareKeywords = ['稀', 'まれ', '時々'];
        if (frequentKeywords.some(function (keyword) { return challenge.includes(keyword); })) {
            return 'frequent';
        }
        if (rareKeywords.some(function (keyword) { return challenge.includes(keyword); })) {
            return 'rare';
        }
        return 'occasional';
    };
    CreativePromptBuilder.prototype.identifyCurrentSolutions = function (data, challenge) {
        var _a;
        var solutions = [];
        // エンティティから既存ソリューションを特定
        var competitors = (_a = data.entities) === null || _a === void 0 ? void 0 : _a.filter(function (e) { return e.type === 'competitor'; }).map(function (e) { return e.name; });
        if (competitors && competitors.length > 0) {
            solutions.push.apply(solutions, competitors.map(function (c) { return "".concat(c, "\u306E\u30BD\u30EA\u30E5\u30FC\u30B7\u30E7\u30F3"); }));
        }
        // 一般的なソリューションを追加
        if (challenge.includes('手動') || challenge.includes('人力')) {
            solutions.push('手動プロセス');
        }
        if (challenge.includes('Excel') || challenge.includes('スプレッドシート')) {
            solutions.push('Excelによる管理');
        }
        return solutions.length > 0 ? solutions : ['既存の代替ソリューション'];
    };
    CreativePromptBuilder.prototype.identifyLimitations = function (data, challenge) {
        var limitations = [];
        if (challenge.includes('高い') || challenge.includes('コスト')) {
            limitations.push('高いコスト');
        }
        if (challenge.includes('複雑')) {
            limitations.push('複雑な操作');
        }
        if (challenge.includes('時間')) {
            limitations.push('時間がかかる');
        }
        if (challenge.includes('エラー')) {
            limitations.push('エラーが発生しやすい');
        }
        return limitations.length > 0 ? limitations : ['効率性の欠如'];
    };
    CreativePromptBuilder.prototype.parseMarketSize = function (text) {
        var numMatch = text.match(/(\d+[\d,]*)/);
        if (!numMatch)
            return 0;
        var num = parseFloat(numMatch[0].replace(/,/g, ''));
        if (text.includes('兆')) {
            return num * 1000000000000;
        }
        if (text.includes('億')) {
            return num * 100000000;
        }
        return num;
    };
    return CreativePromptBuilder;
}());
exports.CreativePromptBuilder = CreativePromptBuilder;
