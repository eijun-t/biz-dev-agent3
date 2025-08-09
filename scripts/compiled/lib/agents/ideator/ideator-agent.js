"use strict";
/**
 * Ideator Agent
 * ビジネスアイデア生成エージェントのメインクラス
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdeatorAgent = void 0;
var creative_prompt_builder_1 = require("./creative-prompt-builder");
var llm_integration_service_1 = require("./llm-integration-service");
var structured_output_generator_1 = require("./structured-output-generator");
var quality_validator_1 = require("./quality-validator");
var errors_1 = require("./errors");
var constants_1 = require("./constants");
/**
 * Ideatorエージェント
 */
var IdeatorAgent = /** @class */ (function () {
    function IdeatorAgent(options) {
        if (options === void 0) { options = {}; }
        var _a, _b, _c, _d, _e;
        // 設定の初期化
        this.config = {
            llmConfig: __assign(__assign({}, constants_1.DEFAULT_LLM_CONFIG), (_a = options.config) === null || _a === void 0 ? void 0 : _a.llmConfig),
            ideationConfig: __assign(__assign({}, constants_1.IDEATION_CONFIG), (_b = options.config) === null || _b === void 0 ? void 0 : _b.ideationConfig),
            validationConfig: ((_c = options.config) === null || _c === void 0 ? void 0 : _c.validationConfig) || {
                enableValidation: true,
                minQualityScore: 60,
                maxRetries: 3
            }
        };
        this.enableValidation = (_d = options.enableValidation) !== null && _d !== void 0 ? _d : true;
        this.enableLogging = (_e = options.enableLogging) !== null && _e !== void 0 ? _e : false;
        // サービスの初期化
        this.promptBuilder = new creative_prompt_builder_1.CreativePromptBuilder();
        this.llmService = new llm_integration_service_1.LLMIntegrationService(options.llm);
        this.outputGenerator = new structured_output_generator_1.StructuredOutputGenerator(this.llmService);
        this.validator = new quality_validator_1.QualityValidator();
        // LLM設定を適用
        this.llmService.configureLLM(this.config.llmConfig);
    }
    /**
     * ビジネスアイデアを生成
     */
    IdeatorAgent.prototype.generateIdeas = function (researchOutput, request) {
        return __awaiter(this, void 0, void 0, function () {
            var context, finalRequest, output, tokenUsage, error_1;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 4, , 5]);
                        this.log('Starting idea generation process...');
                        context = this.buildContext(researchOutput);
                        finalRequest = {
                            numberOfIdeas: (request === null || request === void 0 ? void 0 : request.numberOfIdeas) || ((_a = this.config.ideationConfig) === null || _a === void 0 ? void 0 : _a.defaultNumberOfIdeas) || 5,
                            temperature: (request === null || request === void 0 ? void 0 : request.temperature) || this.config.llmConfig.temperature,
                            maxTokens: (request === null || request === void 0 ? void 0 : request.maxTokens) || this.config.llmConfig.maxTokens,
                            focusAreas: (request === null || request === void 0 ? void 0 : request.focusAreas) || [],
                            constraints: (request === null || request === void 0 ? void 0 : request.constraints) || [],
                            targetMarket: request === null || request === void 0 ? void 0 : request.targetMarket
                        };
                        return [4 /*yield*/, this.outputGenerator.generateBusinessIdeas(context, finalRequest)];
                    case 1:
                        output = _b.sent();
                        if (!this.enableValidation) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.validateAndImprove(output, context, finalRequest)];
                    case 2:
                        output = _b.sent();
                        _b.label = 3;
                    case 3:
                        // アイデアをランキング
                        output.ideas = this.outputGenerator.rankIdeas(output.ideas);
                        tokenUsage = this.llmService.getTokenUsage();
                        this.log("Token usage - Prompt: ".concat(tokenUsage.promptTokens, ", Completion: ").concat(tokenUsage.completionTokens));
                        return [2 /*return*/, output];
                    case 4:
                        error_1 = _b.sent();
                        throw errors_1.IdeatorError.fromError(error_1);
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 単一のアイデアを生成
     */
    IdeatorAgent.prototype.generateSingleIdea = function (researchOutput, focus) {
        return __awaiter(this, void 0, void 0, function () {
            var context, idea, validationResult, suggestions, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        context = this.buildContext(researchOutput);
                        return [4 /*yield*/, this.outputGenerator.generateSingleIdea(context, focus)];
                    case 1:
                        idea = _a.sent();
                        if (!this.enableValidation) return [3 /*break*/, 3];
                        validationResult = this.validator.validateIdea(idea);
                        if (!!validationResult.isValid) return [3 /*break*/, 3];
                        this.log('Generated idea failed validation, attempting to refine...');
                        suggestions = this.validator.generateImprovementSuggestions(idea, validationResult);
                        return [4 /*yield*/, this.outputGenerator.refineIdea(idea, suggestions.join('\n'))];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3: return [2 /*return*/, idea];
                    case 4:
                        error_2 = _a.sent();
                        throw errors_1.IdeatorError.fromError(error_2);
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * アイデアを改善
     */
    IdeatorAgent.prototype.refineIdea = function (idea, feedback) {
        return __awaiter(this, void 0, void 0, function () {
            var refinedIdea, validationResult, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.outputGenerator.refineIdea(idea, feedback)];
                    case 1:
                        refinedIdea = _a.sent();
                        if (this.enableValidation) {
                            validationResult = this.validator.validateIdea(refinedIdea);
                            if (validationResult.qualityScore < this.config.validationConfig.minQualityScore) {
                                this.log("Refined idea quality score (".concat(validationResult.qualityScore, ") below threshold"));
                            }
                        }
                        return [2 /*return*/, refinedIdea];
                    case 2:
                        error_3 = _a.sent();
                        throw errors_1.IdeatorError.fromError(error_3);
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * アイデアを検証
     */
    IdeatorAgent.prototype.validateIdea = function (idea) {
        return this.validator.validateIdea(idea);
    };
    /**
     * アイデアの強み・弱みを分析
     */
    IdeatorAgent.prototype.analyzeIdea = function (idea) {
        var validationResult = this.validator.validateIdea(idea);
        var strengths = this.validator.analyzeStrengths(idea);
        var weaknesses = this.validator.analyzeWeaknesses(idea);
        var suggestions = this.validator.generateImprovementSuggestions(idea, validationResult);
        return {
            strengths: strengths,
            weaknesses: weaknesses,
            validationResult: validationResult,
            suggestions: suggestions
        };
    };
    /**
     * 設定を更新
     */
    IdeatorAgent.prototype.updateConfig = function (config) {
        if (config.llmConfig) {
            this.config.llmConfig = __assign(__assign({}, this.config.llmConfig), config.llmConfig);
            this.llmService.configureLLM(this.config.llmConfig);
        }
        if (config.ideationConfig) {
            this.config.ideationConfig = __assign(__assign({}, this.config.ideationConfig), config.ideationConfig);
        }
        if (config.validationConfig) {
            this.config.validationConfig = __assign(__assign({}, this.config.validationConfig), config.validationConfig);
        }
    };
    /**
     * パフォーマンスメトリクスを取得
     */
    IdeatorAgent.prototype.getMetrics = function () {
        return {
            tokenUsage: this.llmService.getTokenUsage(),
            performanceMetrics: this.llmService.getPerformanceMetrics()
        };
    };
    /**
     * トークン使用量をリセット
     */
    IdeatorAgent.prototype.resetMetrics = function () {
        this.llmService.resetTokenUsage();
    };
    // Private methods
    /**
     * コンテキストを構築
     */
    IdeatorAgent.prototype.buildContext = function (researchOutput) {
        var opportunities = this.promptBuilder.extractOpportunities(researchOutput);
        var customerPains = this.promptBuilder.identifyCustomerPains(researchOutput);
        var trends = this.promptBuilder.extractTrends(researchOutput);
        var competitiveLandscape = this.promptBuilder.summarizeCompetitiveLandscape(researchOutput);
        return {
            opportunities: opportunities,
            customerPains: customerPains,
            trends: trends,
            competitiveLandscape: competitiveLandscape,
            researchSummary: researchOutput.processedResearch.summary
        };
    };
    /**
     * バリデーションと改善
     */
    IdeatorAgent.prototype.validateAndImprove = function (output, context, request) {
        return __awaiter(this, void 0, void 0, function () {
            var validationResult, improvedIdeas, _i, _a, idea, ideaValidation, suggestions, improvedIdea, targetCount, newIdea;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        validationResult = this.validator.validateOutput(output);
                        if (!(!validationResult.isValid ||
                            validationResult.overallScore < this.config.validationConfig.minQualityScore)) return [3 /*break*/, 9];
                        this.log("Validation failed or quality score too low (".concat(validationResult.overallScore, ")"));
                        improvedIdeas = [];
                        _i = 0, _a = output.ideas;
                        _c.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 5];
                        idea = _a[_i];
                        ideaValidation = this.validator.validateIdea(idea);
                        if (!(!ideaValidation.isValid ||
                            ideaValidation.qualityScore < this.config.validationConfig.minQualityScore)) return [3 /*break*/, 3];
                        suggestions = this.validator.generateImprovementSuggestions(idea, ideaValidation);
                        return [4 /*yield*/, this.outputGenerator.refineIdea(idea, suggestions.join('\n'))];
                    case 2:
                        improvedIdea = _c.sent();
                        improvedIdeas.push(improvedIdea);
                        return [3 /*break*/, 4];
                    case 3:
                        improvedIdeas.push(idea);
                        _c.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 1];
                    case 5:
                        targetCount = request.numberOfIdeas || ((_b = this.config.ideationConfig) === null || _b === void 0 ? void 0 : _b.defaultNumberOfIdeas) || 5;
                        _c.label = 6;
                    case 6:
                        if (!(improvedIdeas.length < targetCount)) return [3 /*break*/, 8];
                        return [4 /*yield*/, this.outputGenerator.generateSingleIdea(context)];
                    case 7:
                        newIdea = _c.sent();
                        improvedIdeas.push(newIdea);
                        return [3 /*break*/, 6];
                    case 8:
                        output.ideas = improvedIdeas;
                        _c.label = 9;
                    case 9: return [2 /*return*/, output];
                }
            });
        });
    };
    /**
     * ログ出力
     */
    IdeatorAgent.prototype.log = function (message) {
        if (this.enableLogging) {
            console.log("[IdeatorAgent] ".concat(message));
        }
    };
    return IdeatorAgent;
}());
exports.IdeatorAgent = IdeatorAgent;
