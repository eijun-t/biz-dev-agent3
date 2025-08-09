"use strict";
/**
 * Structured Output Generator
 * 構造化された出力を生成するサービス
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
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
exports.StructuredOutputGenerator = void 0;
var prompts_1 = require("@langchain/core/prompts");
var ideator_1 = require("../../validations/ideator");
var errors_1 = require("./errors");
var constants_1 = require("./constants");
/**
 * 構造化出力生成のためのプロンプトテンプレート
 */
var STRUCTURED_OUTPUT_PROMPT = new prompts_1.PromptTemplate({
    template: "\u3042\u306A\u305F\u306F\u9769\u65B0\u7684\u306A\u30D3\u30B8\u30CD\u30B9\u30A2\u30A4\u30C7\u30A2\u3092\u751F\u6210\u3059\u308B\u5C02\u9580\u5BB6\u3067\u3059\u3002\n\u4EE5\u4E0B\u306E\u5E02\u5834\u8ABF\u67FB\u7D50\u679C\u3068\u5206\u6790\u306B\u57FA\u3065\u3044\u3066\u3001{ideaCount}\u500B\u306E\u30D3\u30B8\u30CD\u30B9\u30A2\u30A4\u30C7\u30A2\u3092\u751F\u6210\u3057\u3066\u304F\u3060\u3055\u3044\u3002\n\n## \u5E02\u5834\u8ABF\u67FB\u7D50\u679C\n{researchSummary}\n\n## \u5E02\u5834\u6A5F\u4F1A\n{marketOpportunities}\n\n## \u9867\u5BA2\u8AB2\u984C\n{customerPains}\n\n## \u5E02\u5834\u30C8\u30EC\u30F3\u30C9\n{marketTrends}\n\n## \u7AF6\u5408\u72B6\u6CC1\n{competitiveLandscape}\n\n## \u751F\u6210\u8981\u4EF6\n- \u5404\u30A2\u30A4\u30C7\u30A2\u306F\u5177\u4F53\u7684\u3067\u5B9F\u73FE\u53EF\u80FD\u306A\u3082\u306E\u306B\u3057\u3066\u304F\u3060\u3055\u3044\n- \u30BF\u30FC\u30B2\u30C3\u30C8\u9867\u5BA2\u3068\u89E3\u6C7A\u3059\u308B\u8AB2\u984C\u3092\u660E\u78BA\u306B\u3057\u3066\u304F\u3060\u3055\u3044\n- \u53CE\u76CA\u30E2\u30C7\u30EB\u3092\u660E\u78BA\u306B\u8AAC\u660E\u3057\u3066\u304F\u3060\u3055\u3044\n- \u63A8\u5B9A\u55B6\u696D\u5229\u76CA\u306F\u73FE\u5B9F\u7684\u306A\u6570\u5024\u306B\u3057\u3066\u304F\u3060\u3055\u3044\n- \u5B9F\u88C5\u96E3\u6613\u5EA6\u3092\u9069\u5207\u306B\u8A55\u4FA1\u3057\u3066\u304F\u3060\u3055\u3044\n\n## \u51FA\u529B\u30D5\u30A9\u30FC\u30DE\u30C3\u30C8\n\u4EE5\u4E0B\u306EJSON\u5F62\u5F0F\u3067\u51FA\u529B\u3057\u3066\u304F\u3060\u3055\u3044\uFF1A\n{{\n  \"ideas\": [\n    {{\n      \"id\": \"unique-id\",\n      \"title\": \"30\u6587\u5B57\u4EE5\u5185\u306E\u30BF\u30A4\u30C8\u30EB\",\n      \"description\": \"200\u6587\u5B57\u7A0B\u5EA6\u306E\u8A73\u7D30\u306A\u8AAC\u660E\",\n      \"targetCustomers\": [\"\u9867\u5BA2\u30BB\u30B0\u30E1\u30F3\u30C81\", \"\u9867\u5BA2\u30BB\u30B0\u30E1\u30F3\u30C82\"],\n      \"customerPains\": [\"\u89E3\u6C7A\u3059\u308B\u8AB2\u984C1\", \"\u89E3\u6C7A\u3059\u308B\u8AB2\u984C2\"],\n      \"valueProposition\": \"\u63D0\u4F9B\u4FA1\u5024\u306E\u660E\u78BA\u306A\u8AAC\u660E\",\n      \"revenueModel\": \"\u53CE\u76CA\u69CB\u9020\u306E\u8A73\u7D30\",\n      \"estimatedRevenue\": 10000000,\n      \"implementationDifficulty\": \"low|medium|high\",\n      \"marketOpportunity\": \"\u5E02\u5834\u6A5F\u4F1A\u306E\u8AAC\u660E\"\n    }}\n  ],\n  \"summary\": \"\u751F\u6210\u3055\u308C\u305F\u30A2\u30A4\u30C7\u30A2\u306E\u5168\u4F53\u7684\u306A\u8981\u7D04\",\n  \"metadata\": {{\n    \"totalIdeas\": {ideaCount},\n    \"averageRevenue\": 0,\n    \"marketSize\": 0,\n    \"generationDate\": \"ISO 8601\u5F62\u5F0F\u306E\u65E5\u6642\"\n  }}\n}}\n\nJSON\u306E\u307F\u3092\u51FA\u529B\u3057\u3001\u4ED6\u306E\u8AAC\u660E\u306F\u542B\u3081\u306A\u3044\u3067\u304F\u3060\u3055\u3044\u3002",
    inputVariables: [
        'ideaCount',
        'researchSummary',
        'marketOpportunities',
        'customerPains',
        'marketTrends',
        'competitiveLandscape'
    ]
});
/**
 * 構造化出力ジェネレーター
 */
var StructuredOutputGenerator = /** @class */ (function () {
    function StructuredOutputGenerator(llmService) {
        this.llmService = llmService;
    }
    /**
     * ビジネスアイデアを生成
     */
    StructuredOutputGenerator.prototype.generateBusinessIdeas = function (context, request) {
        return __awaiter(this, void 0, void 0, function () {
            var prompt_1, response, validatedOutput, error_1;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, this.buildPrompt(context, request)];
                    case 1:
                        prompt_1 = _c.sent();
                        return [4 /*yield*/, this.llmService.invokeStructured(prompt_1, ideator_1.ideatorOutputSchema, {
                                temperature: (_a = request.temperature) !== null && _a !== void 0 ? _a : 0.8,
                                maxTokens: (_b = request.maxTokens) !== null && _b !== void 0 ? _b : 8000
                            })];
                    case 2:
                        response = _c.sent();
                        return [4 /*yield*/, this.validateAndEnrichOutput(response, context)];
                    case 3:
                        validatedOutput = _c.sent();
                        return [2 /*return*/, validatedOutput];
                    case 4:
                        error_1 = _c.sent();
                        throw errors_1.IdeatorError.fromError(error_1, errors_1.IdeatorErrorCode.OUTPUT_GENERATION_FAILED);
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 単一のビジネスアイデアを生成
     */
    StructuredOutputGenerator.prototype.generateSingleIdea = function (context, focus) {
        return __awaiter(this, void 0, void 0, function () {
            var singleIdeaPrompt, prompt, idea;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        singleIdeaPrompt = new prompts_1.PromptTemplate({
                            template: "\u4EE5\u4E0B\u306E\u5E02\u5834\u8ABF\u67FB\u7D50\u679C\u306B\u57FA\u3065\u3044\u3066\u30011\u3064\u306E\u9769\u65B0\u7684\u306A\u30D3\u30B8\u30CD\u30B9\u30A2\u30A4\u30C7\u30A2\u3092\u751F\u6210\u3057\u3066\u304F\u3060\u3055\u3044\u3002\n".concat(focus ? "\u7279\u306B\u300C".concat(focus, "\u300D\u306B\u7126\u70B9\u3092\u5F53\u3066\u3066\u304F\u3060\u3055\u3044\u3002") : '', "\n\n## \u5E02\u5834\u8ABF\u67FB\u7D50\u679C\n{researchSummary}\n\n## \u5E02\u5834\u6A5F\u4F1A\n{marketOpportunities}\n\n## \u9867\u5BA2\u8AB2\u984C\n{customerPains}\n\n\u4EE5\u4E0B\u306EJSON\u5F62\u5F0F\u30671\u3064\u306E\u30A2\u30A4\u30C7\u30A2\u306E\u307F\u3092\u51FA\u529B\u3057\u3066\u304F\u3060\u3055\u3044\uFF1A\n{{\n  \"id\": \"unique-id\",\n  \"title\": \"30\u6587\u5B57\u4EE5\u5185\u306E\u30BF\u30A4\u30C8\u30EB\",\n  \"description\": \"200\u6587\u5B57\u7A0B\u5EA6\u306E\u8A73\u7D30\u306A\u8AAC\u660E\",\n  \"targetCustomers\": [\"\u9867\u5BA2\u30BB\u30B0\u30E1\u30F3\u30C8\"],\n  \"customerPains\": [\"\u89E3\u6C7A\u3059\u308B\u8AB2\u984C\"],\n  \"valueProposition\": \"\u63D0\u4F9B\u4FA1\u5024\",\n  \"revenueModel\": \"\u53CE\u76CA\u69CB\u9020\",\n  \"estimatedRevenue\": 10000000,\n  \"implementationDifficulty\": \"low|medium|high\",\n  \"marketOpportunity\": \"\u5E02\u5834\u6A5F\u4F1A\"\n}}"),
                            inputVariables: ['researchSummary', 'marketOpportunities', 'customerPains']
                        });
                        return [4 /*yield*/, singleIdeaPrompt.format({
                                researchSummary: context.researchSummary || '',
                                marketOpportunities: JSON.stringify(context.opportunities.slice(0, 3)),
                                customerPains: JSON.stringify(context.customerPains.slice(0, 3))
                            })];
                    case 1:
                        prompt = _a.sent();
                        return [4 /*yield*/, this.llmService.invokeStructured(prompt, ideator_1.businessIdeaSchema, {
                                temperature: 0.9,
                                maxTokens: 2000
                            })];
                    case 2:
                        idea = _a.sent();
                        return [2 /*return*/, idea];
                }
            });
        });
    };
    /**
     * アイデアを洗練・改善
     */
    StructuredOutputGenerator.prototype.refineIdea = function (idea, feedback) {
        return __awaiter(this, void 0, void 0, function () {
            var refinePrompt, prompt, refinedIdea;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        refinePrompt = new prompts_1.PromptTemplate({
                            template: "\u4EE5\u4E0B\u306E\u30D3\u30B8\u30CD\u30B9\u30A2\u30A4\u30C7\u30A2\u3092\u30D5\u30A3\u30FC\u30C9\u30D0\u30C3\u30AF\u306B\u57FA\u3065\u3044\u3066\u6539\u5584\u3057\u3066\u304F\u3060\u3055\u3044\u3002\n\n## \u73FE\u5728\u306E\u30A2\u30A4\u30C7\u30A2\n{currentIdea}\n\n## \u30D5\u30A3\u30FC\u30C9\u30D0\u30C3\u30AF\n{feedback}\n\n\u6539\u5584\u3055\u308C\u305F\u30A2\u30A4\u30C7\u30A2\u3092\u540C\u3058JSON\u5F62\u5F0F\u3067\u51FA\u529B\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
                            inputVariables: ['currentIdea', 'feedback']
                        });
                        return [4 /*yield*/, refinePrompt.format({
                                currentIdea: JSON.stringify(idea, null, 2),
                                feedback: feedback
                            })];
                    case 1:
                        prompt = _a.sent();
                        return [4 /*yield*/, this.llmService.invokeStructured(prompt, ideator_1.businessIdeaSchema, {
                                temperature: 0.7,
                                maxTokens: 2000
                            })];
                    case 2:
                        refinedIdea = _a.sent();
                        return [2 /*return*/, refinedIdea];
                }
            });
        });
    };
    /**
     * プロンプトを構築
     */
    StructuredOutputGenerator.prototype.buildPrompt = function (context, request) {
        return __awaiter(this, void 0, void 0, function () {
            var ideaCount, prompt;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        ideaCount = request.numberOfIdeas || constants_1.IDEATION_CONFIG.defaultNumberOfIdeas;
                        return [4 /*yield*/, STRUCTURED_OUTPUT_PROMPT.format({
                                ideaCount: ideaCount.toString(),
                                researchSummary: context.researchSummary || '市場調査結果なし',
                                marketOpportunities: this.formatMarketOpportunities(context.opportunities),
                                customerPains: this.formatCustomerPains(context.customerPains),
                                marketTrends: ((_a = context.trends) === null || _a === void 0 ? void 0 : _a.join('\n')) || 'トレンド情報なし',
                                competitiveLandscape: context.competitiveLandscape || '競合情報なし'
                            })];
                    case 1:
                        prompt = _b.sent();
                        return [2 /*return*/, prompt];
                }
            });
        });
    };
    /**
     * 市場機会をフォーマット
     */
    StructuredOutputGenerator.prototype.formatMarketOpportunities = function (opportunities) {
        var _this = this;
        if (!opportunities || opportunities.length === 0) {
            return '市場機会情報なし';
        }
        return opportunities
            .slice(0, 5)
            .map(function (opp, index) {
            return "".concat(index + 1, ". ").concat(opp.description, "\n") +
                "   - \u5E02\u5834\u898F\u6A21: ".concat(_this.formatCurrency(opp.marketSize), "\n") +
                "   - \u6210\u9577\u7387: ".concat(opp.growthRate, "%\n") +
                "   - \u672A\u5145\u8DB3\u30CB\u30FC\u30BA: ".concat(opp.unmetNeeds.join(', '));
        })
            .join('\n\n');
    };
    /**
     * 顧客課題をフォーマット
     */
    StructuredOutputGenerator.prototype.formatCustomerPains = function (pains) {
        if (!pains || pains.length === 0) {
            return '顧客課題情報なし';
        }
        return pains
            .slice(0, 5)
            .map(function (pain, index) {
            return "".concat(index + 1, ". ").concat(pain.description, "\n") +
                "   - \u6DF1\u523B\u5EA6: ".concat(pain.severity, "\n") +
                "   - \u983B\u5EA6: ".concat(pain.frequency, "\n") +
                "   - \u73FE\u5728\u306E\u89E3\u6C7A\u7B56\u306E\u9650\u754C: ".concat(pain.limitations.join(', '));
        })
            .join('\n\n');
    };
    /**
     * 通貨をフォーマット
     */
    StructuredOutputGenerator.prototype.formatCurrency = function (amount) {
        if (amount >= 1000000000000) {
            return "".concat((amount / 1000000000000).toFixed(1), "\u5146\u5186");
        }
        else if (amount >= 100000000) {
            return "".concat((amount / 100000000).toFixed(1), "\u5104\u5186");
        }
        else if (amount >= 10000) {
            return "".concat((amount / 10000).toFixed(0), "\u4E07\u5186");
        }
        else {
            return "".concat(amount, "\u5186");
        }
    };
    /**
     * 出力を検証して補強
     */
    StructuredOutputGenerator.prototype.validateAndEnrichOutput = function (output, context) {
        return __awaiter(this, void 0, void 0, function () {
            var enrichedIdeas, totalRevenue, averageRevenue, marketSize;
            var _a;
            return __generator(this, function (_b) {
                enrichedIdeas = output.ideas.map(function (idea, index) {
                    var _a;
                    return (__assign(__assign({}, idea), { id: idea.id || "idea-".concat(Date.now(), "-").concat(index), marketOpportunity: idea.marketOpportunity ||
                            ((_a = context.opportunities[0]) === null || _a === void 0 ? void 0 : _a.description) ||
                            '市場機会の詳細分析が必要' }));
                });
                totalRevenue = enrichedIdeas.reduce(function (sum, idea) { return sum + (idea.estimatedRevenue || 0); }, 0);
                averageRevenue = enrichedIdeas.length > 0
                    ? totalRevenue / enrichedIdeas.length
                    : 0;
                marketSize = context.opportunities.reduce(function (sum, opp) { return sum + (opp.marketSize || 0); }, 0);
                return [2 /*return*/, {
                        ideas: enrichedIdeas,
                        summary: output.summary || this.generateSummary(enrichedIdeas),
                        metadata: __assign(__assign({}, output.metadata), { totalIdeas: enrichedIdeas.length, averageRevenue: averageRevenue, marketSize: marketSize, generationDate: ((_a = output.metadata) === null || _a === void 0 ? void 0 : _a.generationDate) || new Date().toISOString() })
                    }];
            });
        });
    };
    /**
     * サマリーを生成
     */
    StructuredOutputGenerator.prototype.generateSummary = function (ideas) {
        if (ideas.length === 0) {
            return 'ビジネスアイデアが生成されませんでした。';
        }
        var highValueIdeas = ideas.filter(function (idea) { return idea.estimatedRevenue > 100000000; });
        var easyImplementIdeas = ideas.filter(function (idea) { return idea.implementationDifficulty === 'low'; });
        return "".concat(ideas.length, "\u500B\u306E\u30D3\u30B8\u30CD\u30B9\u30A2\u30A4\u30C7\u30A2\u3092\u751F\u6210\u3057\u307E\u3057\u305F\u3002") +
            "".concat(highValueIdeas.length > 0 ? " \u3046\u3061".concat(highValueIdeas.length, "\u500B\u306F1\u5104\u5186\u4EE5\u4E0A\u306E\u55B6\u696D\u5229\u76CA\u304C\u898B\u8FBC\u307E\u308C\u307E\u3059\u3002") : '') +
            "".concat(easyImplementIdeas.length > 0 ? " ".concat(easyImplementIdeas.length, "\u500B\u306F\u5B9F\u88C5\u96E3\u6613\u5EA6\u304C\u4F4E\u304F\u3001\u65E9\u671F\u306B\u5B9F\u73FE\u53EF\u80FD\u3067\u3059\u3002") : '');
    };
    /**
     * アイデアをランキング
     */
    StructuredOutputGenerator.prototype.rankIdeas = function (ideas) {
        var _this = this;
        return __spreadArray([], ideas, true).sort(function (a, b) {
            // スコアリング: 収益性 (40%) + 実現可能性 (30%) + 市場適合性 (30%)
            var scoreA = _this.calculateIdeaScore(a);
            var scoreB = _this.calculateIdeaScore(b);
            return scoreB - scoreA;
        });
    };
    /**
     * アイデアのスコアを計算
     */
    StructuredOutputGenerator.prototype.calculateIdeaScore = function (idea) {
        var score = 0;
        // 収益性スコア (40%)
        var revenueScore = Math.min(idea.estimatedRevenue / 1000000000, 1) * 40;
        score += revenueScore;
        // 実現可能性スコア (30%)
        var feasibilityScore = idea.implementationDifficulty === 'low' ? 30 :
            idea.implementationDifficulty === 'medium' ? 20 : 10;
        score += feasibilityScore;
        // 市場適合性スコア (30%)
        var marketFitScore = (idea.targetCustomers.length * 5) +
            (idea.customerPains.length * 5);
        score += Math.min(marketFitScore, 30);
        return score;
    };
    return StructuredOutputGenerator;
}());
exports.StructuredOutputGenerator = StructuredOutputGenerator;
