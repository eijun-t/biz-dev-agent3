"use strict";
/**
 * LLM Integration Service
 * LLMとの統合を管理するサービス
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
exports.LLMIntegrationService = void 0;
var openai_1 = require("@langchain/openai");
var errors_1 = require("./errors");
var constants_1 = require("./constants");
var LLMIntegrationService = /** @class */ (function () {
    function LLMIntegrationService(llm) {
        this.currentConfig = constants_1.DEFAULT_LLM_CONFIG;
        this.llm = llm || this.createLLM(this.currentConfig);
        this.tokenUsage = {
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
            invocationCount: 0
        };
        this.performanceMetrics = {
            lastInvocationTime: 0,
            averageInvocationTime: 0,
            retryCount: 0,
            successCount: 0,
            errorCount: 0
        };
    }
    /**
     * リトライ機構付きでLLMを呼び出す
     */
    LLMIntegrationService.prototype.invokeWithRetry = function (prompt_1, config_1) {
        return __awaiter(this, arguments, void 0, function (prompt, config, maxRetries) {
            var finalConfig, lastError, retryCount, attempt, startTime, response, error_1;
            if (maxRetries === void 0) { maxRetries = constants_1.RETRY_CONFIG.maxAttempts; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        finalConfig = __assign(__assign({}, this.currentConfig), config);
                        retryCount = 0;
                        attempt = 0;
                        _a.label = 1;
                    case 1:
                        if (!(attempt < maxRetries)) return [3 /*break*/, 7];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 6]);
                        startTime = Date.now();
                        return [4 /*yield*/, this.invokeLLM(prompt, finalConfig)];
                    case 3:
                        response = _a.sent();
                        // パフォーマンスメトリクスを更新
                        this.updatePerformanceMetrics(Date.now() - startTime, retryCount, true);
                        return [2 /*return*/, response];
                    case 4:
                        error_1 = _a.sent();
                        lastError = error_1;
                        retryCount++;
                        // リトライ不可能なエラーの場合は即座に失敗
                        if (!(0, errors_1.isRetryableError)(error_1)) {
                            this.updatePerformanceMetrics(0, retryCount, false);
                            throw errors_1.IdeatorError.fromError(error_1);
                        }
                        // 最後の試行の場合はエラーをスロー
                        if (attempt === maxRetries - 1) {
                            this.updatePerformanceMetrics(0, retryCount, false);
                            throw errors_1.IdeatorError.fromError(error_1, errors_1.IdeatorErrorCode.LLM_GENERATION_FAILED);
                        }
                        // エクスポネンシャルバックオフで待機
                        return [4 /*yield*/, this.waitWithBackoff(attempt)];
                    case 5:
                        // エクスポネンシャルバックオフで待機
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 6:
                        attempt++;
                        return [3 /*break*/, 1];
                    case 7: throw errors_1.IdeatorError.fromCode(errors_1.IdeatorErrorCode.LLM_GENERATION_FAILED, { originalError: lastError, retryCount: retryCount });
                }
            });
        });
    };
    /**
     * 構造化された出力を取得
     */
    LLMIntegrationService.prototype.invokeStructured = function (prompt, schema, config) {
        return __awaiter(this, void 0, void 0, function () {
            var maxRetries, attempt, response, parsedData, jsonMatch, validationResult, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        maxRetries = constants_1.RETRY_CONFIG.maxAttempts;
                        attempt = 0;
                        _a.label = 1;
                    case 1:
                        if (!(attempt < maxRetries)) return [3 /*break*/, 8];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 7]);
                        return [4 /*yield*/, this.invokeWithRetry(prompt, config, maxRetries - attempt // 残りリトライ回数
                            )];
                    case 3:
                        response = _a.sent();
                        parsedData = void 0;
                        try {
                            parsedData = JSON.parse(response);
                        }
                        catch (parseError) {
                            jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/);
                            if (jsonMatch) {
                                parsedData = JSON.parse(jsonMatch[1]);
                            }
                            else {
                                throw new Error('Invalid JSON format in response');
                            }
                        }
                        validationResult = schema.safeParse(parsedData);
                        if (!validationResult.success) {
                            throw errors_1.IdeatorError.fromCode(errors_1.IdeatorErrorCode.INVALID_OUTPUT_FORMAT, {
                                errors: validationResult.error.errors,
                                rawData: parsedData
                            });
                        }
                        return [2 /*return*/, validationResult.data];
                    case 4:
                        error_2 = _a.sent();
                        if (!(attempt < maxRetries - 1)) return [3 /*break*/, 6];
                        return [4 /*yield*/, this.waitWithBackoff(attempt)];
                    case 5:
                        _a.sent();
                        return [3 /*break*/, 7];
                    case 6: throw errors_1.IdeatorError.fromError(error_2);
                    case 7:
                        attempt++;
                        return [3 /*break*/, 1];
                    case 8: throw errors_1.IdeatorError.fromCode(errors_1.IdeatorErrorCode.LLM_GENERATION_FAILED, { message: 'Failed to get structured output after retries' });
                }
            });
        });
    };
    /**
     * トークン使用量を追跡
     */
    LLMIntegrationService.prototype.trackTokenUsage = function (metadata) {
        this.tokenUsage.promptTokens += metadata.promptTokens || 0;
        this.tokenUsage.completionTokens += metadata.completionTokens || 0;
        this.tokenUsage.totalTokens += metadata.totalTokens || 0;
        this.tokenUsage.invocationCount++;
    };
    /**
     * LLM設定を更新
     */
    LLMIntegrationService.prototype.configureLLM = function (config) {
        this.currentConfig = config;
        // モックLLMが注入されている場合は新しいLLMを作成しない
        if (!this.llm || !this.llm.invoke) {
            this.llm = this.createLLM(config);
        }
    };
    /**
     * 現在の設定を取得
     */
    LLMIntegrationService.prototype.getCurrentConfig = function () {
        return __assign({}, this.currentConfig);
    };
    /**
     * トークン使用量を取得
     */
    LLMIntegrationService.prototype.getTokenUsage = function () {
        return __assign({}, this.tokenUsage);
    };
    /**
     * トークン使用量をリセット
     */
    LLMIntegrationService.prototype.resetTokenUsage = function () {
        this.tokenUsage = {
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
            invocationCount: 0
        };
    };
    /**
     * パフォーマンスメトリクスを取得
     */
    LLMIntegrationService.prototype.getPerformanceMetrics = function () {
        return __assign({}, this.performanceMetrics);
    };
    // Private methods
    /**
     * LLMインスタンスを作成
     */
    LLMIntegrationService.prototype.createLLM = function (config) {
        return new openai_1.ChatOpenAI({
            modelName: config.model,
            temperature: config.temperature,
            maxTokens: config.maxTokens,
            topP: config.topP,
            presencePenalty: config.presencePenalty,
            frequencyPenalty: config.frequencyPenalty,
            timeout: constants_1.TIMEOUT_CONFIG.llmCall,
            openAIApiKey: process.env.OPENAI_API_KEY
        });
    };
    /**
     * LLMを直接呼び出す
     */
    LLMIntegrationService.prototype.invokeLLM = function (prompt, config) {
        return __awaiter(this, void 0, void 0, function () {
            var response, content, usage;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        // 設定が変更されている場合はLLMを再作成（モックLLMの場合はスキップ）
                        if (!this.llm) {
                            this.llm = this.createLLM(config);
                            this.currentConfig = config;
                        }
                        else if (this.configChanged(config) && !this.llm.invoke) {
                            // invokeメソッドがない場合のみ再作成（モックの場合はinvokeメソッドがある）
                            this.llm = this.createLLM(config);
                            this.currentConfig = config;
                        }
                        return [4 /*yield*/, this.llm.invoke(prompt)];
                    case 1:
                        response = _b.sent();
                        if (typeof response.content === 'string') {
                            content = response.content;
                        }
                        else if (response.content && typeof response.content === 'object') {
                            content = JSON.stringify(response.content);
                        }
                        else {
                            throw errors_1.IdeatorError.fromCode(errors_1.IdeatorErrorCode.INVALID_OUTPUT_FORMAT, { response: response });
                        }
                        // 使用量メタデータを追跡
                        if ((_a = response.response_metadata) === null || _a === void 0 ? void 0 : _a.usage) {
                            usage = response.response_metadata.usage;
                            this.trackTokenUsage({
                                promptTokens: usage.prompt_tokens || 0,
                                completionTokens: usage.completion_tokens || 0,
                                totalTokens: usage.total_tokens || 0,
                                modelName: config.model
                            });
                        }
                        return [2 /*return*/, content];
                }
            });
        });
    };
    /**
     * 設定が変更されたかチェック
     */
    LLMIntegrationService.prototype.configChanged = function (config) {
        return JSON.stringify(config) !== JSON.stringify(this.currentConfig);
    };
    /**
     * エクスポネンシャルバックオフで待機
     */
    LLMIntegrationService.prototype.waitWithBackoff = function (attempt) {
        return __awaiter(this, void 0, void 0, function () {
            var delay, jitter, finalDelay;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        delay = Math.min(constants_1.RETRY_CONFIG.baseDelay * Math.pow(constants_1.RETRY_CONFIG.backoffMultiplier, attempt), constants_1.RETRY_CONFIG.maxDelay);
                        jitter = Math.random() * delay * 0.1;
                        finalDelay = delay + jitter;
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, finalDelay); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * パフォーマンスメトリクスを更新
     */
    LLMIntegrationService.prototype.updatePerformanceMetrics = function (invocationTime, retryCount, success) {
        if (success) {
            this.performanceMetrics.successCount++;
            this.performanceMetrics.lastInvocationTime = invocationTime;
            // 平均時間を更新
            var totalTime = this.performanceMetrics.averageInvocationTime *
                (this.performanceMetrics.successCount - 1) + invocationTime;
            this.performanceMetrics.averageInvocationTime =
                totalTime / this.performanceMetrics.successCount;
        }
        else {
            this.performanceMetrics.errorCount++;
        }
        this.performanceMetrics.retryCount += retryCount;
    };
    return LLMIntegrationService;
}());
exports.LLMIntegrationService = LLMIntegrationService;
