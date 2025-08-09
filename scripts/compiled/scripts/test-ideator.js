"use strict";
/**
 * Ideator Agent Test Script
 * 実際の出力を確認するためのテストスクリプト
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
var ideator_1 = require("../lib/agents/ideator");
var fs = __importStar(require("fs"));
var path = __importStar(require("path"));
// カラー出力用のユーティリティ
var colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    red: '\x1b[31m'
};
function log(message, color) {
    if (color === void 0) { color = colors.reset; }
    console.log("".concat(color).concat(message).concat(colors.reset));
}
function logSection(title) {
    console.log('\n' + '='.repeat(80));
    log(title, colors.bright + colors.cyan);
    console.log('='.repeat(80));
}
function logIdea(idea, index) {
    console.log("\n".concat(colors.bright, "\u3010\u30A2\u30A4\u30C7\u30A2 ").concat(index + 1, "\u3011").concat(colors.reset));
    console.log("".concat(colors.green, "\u30BF\u30A4\u30C8\u30EB:").concat(colors.reset, " ").concat(idea.title));
    console.log("".concat(colors.blue, "\u8AAC\u660E:").concat(colors.reset, " ").concat(idea.description));
    console.log("".concat(colors.yellow, "\u30BF\u30FC\u30B2\u30C3\u30C8\u9867\u5BA2:").concat(colors.reset, " ").concat(idea.targetCustomers.join(', ')));
    console.log("".concat(colors.magenta, "\u89E3\u6C7A\u3059\u308B\u8AB2\u984C:").concat(colors.reset, " ").concat(idea.customerPains.join(', ')));
    console.log("".concat(colors.cyan, "\u63D0\u4F9B\u4FA1\u5024:").concat(colors.reset, " ").concat(idea.valueProposition));
    console.log("\u53CE\u76CA\u30E2\u30C7\u30EB: ".concat(idea.revenueModel));
    console.log("\u63A8\u5B9A\u55B6\u696D\u5229\u76CA: ".concat(formatCurrency(idea.estimatedRevenue)));
    console.log("\u5B9F\u88C5\u96E3\u6613\u5EA6: ".concat(getDifficultyLabel(idea.implementationDifficulty)));
    console.log("\u5E02\u5834\u6A5F\u4F1A: ".concat(idea.marketOpportunity));
}
function formatCurrency(amount) {
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
}
function getDifficultyLabel(difficulty) {
    var labels = {
        'low': '低（簡単）',
        'medium': '中（標準）',
        'high': '高（困難）'
    };
    return labels[difficulty] || difficulty;
}
// テスト用のEnhancedOutput（実際のリサーチ結果をシミュレート）
var mockEnhancedOutput = {
    processedResearch: {
        summary: "\u65E5\u672C\u306EAI\u5E02\u5834\u306F\u6025\u901F\u306A\u6210\u9577\u3092\u7D9A\u3051\u3066\u304A\u308A\u30012025\u5E74\u307E\u3067\u306B3\u5146\u5186\u898F\u6A21\u306B\u9054\u3059\u308B\u3068\u4E88\u6E2C\u3055\u308C\u3066\u3044\u307E\u3059\u3002\n\u7279\u306B\u6CE8\u76EE\u3059\u3079\u304D\u306F\u3001\u4E2D\u5C0F\u4F01\u696D\u5411\u3051\u306EAI\u30BD\u30EA\u30E5\u30FC\u30B7\u30E7\u30F3\u5E02\u5834\u3067\u3001\u73FE\u5728\u306F\u5927\u624B\u30D9\u30F3\u30C0\u30FC\u304C\u53C2\u5165\u3057\u3066\u3044\u306A\u3044\n\u30D6\u30EB\u30FC\u30AA\u30FC\u30B7\u30E3\u30F3\u5E02\u5834\u3068\u306A\u3063\u3066\u3044\u307E\u3059\u3002\u591A\u304F\u306E\u4E2D\u5C0F\u4F01\u696D\u304C\u30C7\u30B8\u30BF\u30EB\u5316\u3092\u9032\u3081\u305F\u3044\u3068\u8003\u3048\u3066\u3044\u308B\u3082\u306E\u306E\u3001\n\u9AD8\u984D\u306A\u521D\u671F\u6295\u8CC7\u3084\u5C02\u9580\u4EBA\u6750\u306E\u4E0D\u8DB3\u304C\u969C\u58C1\u3068\u306A\u3063\u3066\u3044\u307E\u3059\u3002",
        sources: [
            'https://example.com/ai-market-report-2024',
            'https://example.com/sme-digitalization-study',
            'https://example.com/japan-tech-trends'
        ],
        queries: [
            'AI market opportunities Japan 2024',
            'SME digital transformation challenges',
            'Low-code AI platforms'
        ]
    },
    facts: [
        '日本の中小企業の68%がAI導入に興味を持っているが、実際に導入しているのは12%に留まる',
        'AI導入の最大の障壁は「コスト」（45%）と「人材不足」（38%）',
        'ノーコード・ローコードプラットフォーム市場は年率23%で成長中',
        '業務自動化により平均30%の業務時間削減が可能',
        'SaaS型AIサービスの需要が前年比150%増加'
    ],
    metrics: {
        marketSize: 3000000000000, // 3兆円
        growthRate: 23.5, // 年間成長率
        adoptionRate: 12 // 導入率
    },
    entities: [
        { name: 'Microsoft', type: 'competitor', relevance: 0.8 },
        { name: 'Google', type: 'competitor', relevance: 0.75 },
        { name: '中小企業', type: 'target_market', relevance: 0.95 },
        { name: '製造業', type: 'industry', relevance: 0.7 },
        { name: '小売業', type: 'industry', relevance: 0.65 }
    ],
    detailedAnalysis: {
        marketTrends: [
            'AIの民主化とアクセシビリティの向上',
            'エッジAIとIoT統合の進展',
            'ノーコード/ローコードプラットフォームの普及',
            'AI倫理とガバナンスの重要性増大',
            'バーティカルSaaSの台頭'
        ],
        competitiveLandscape: "\u73FE\u5728\u306E\u5E02\u5834\u306F\u5927\u624B\u30C6\u30C3\u30AF\u4F01\u696D\uFF08Microsoft\u3001Google\u3001AWS\uFF09\u304C\u5927\u4F01\u696D\u5411\u3051\u306B\n\u9AD8\u5EA6\u306AAI\u30BD\u30EA\u30E5\u30FC\u30B7\u30E7\u30F3\u3092\u63D0\u4F9B\u3057\u3066\u3044\u308B\u4E00\u65B9\u3001\u4E2D\u5C0F\u4F01\u696D\u5411\u3051\u306E\u624B\u9803\u3067\u4F7F\u3044\u3084\u3059\u3044\u30BD\u30EA\u30E5\u30FC\u30B7\u30E7\u30F3\u306F\n\u4E0D\u8DB3\u3057\u3066\u3044\u307E\u3059\u3002\u3053\u306E\u5E02\u5834\u30AE\u30E3\u30C3\u30D7\u306F\u65B0\u898F\u53C2\u5165\u8005\u306B\u3068\u3063\u3066\u5927\u304D\u306A\u6A5F\u4F1A\u3068\u306A\u3063\u3066\u3044\u307E\u3059\u3002",
        opportunities: [
            '中小企業向けの簡易AI導入ソリューション',
            '業界特化型のAI自動化ツール',
            'AI人材育成とコンサルティングサービス',
            'データ準備と前処理の自動化サービス',
            'AIモデルのマーケットプレイス'
        ],
        challenges: [
            'AI専門人材の不足と高騰する人件費',
            'データプライバシーとセキュリティへの懸念',
            '初期投資コストの高さ',
            'ROIの不明確さ',
            '既存システムとの統合の複雑さ'
        ],
        recommendations: [
            '段階的な導入アプローチの採用',
            'パイロットプロジェクトから始める',
            'パートナーエコシステムの構築',
            'ユーザー教育とサポート体制の充実',
            '成功事例の積極的な共有'
        ]
    }
};
function testWithMockLLM() {
    return __awaiter(this, void 0, void 0, function () {
        var mockLLM, ideator_2, request, output, metrics, outputDir, outputFile, error_1;
        var _this = this;
        var _a, _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    logSection('モックLLMを使用したテスト');
                    mockLLM = {
                        invoke: function (prompt) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                // プロンプトの内容を確認
                                console.log('\n' + colors.yellow + '【送信されたプロンプト（一部）】' + colors.reset);
                                console.log(prompt.substring(0, 500) + '...\n');
                                // モックレスポンスを返す
                                return [2 /*return*/, {
                                        content: JSON.stringify({
                                            ideas: [
                                                {
                                                    id: 'idea-001',
                                                    title: 'AIビジネスアシスタント「スマートヘルパー」',
                                                    description: '中小企業向けのAI搭載業務支援ツール。日常的な業務タスクを自動化し、従業員が本来の価値創造活動に集中できる環境を提供。音声認識とチャット機能で簡単操作を実現。',
                                                    targetCustomers: ['従業員50名以下の中小企業', '個人事業主', 'スタートアップ'],
                                                    customerPains: ['人手不足による業務過多', '定型業務に時間を取られる', 'IT導入コストが高い'],
                                                    valueProposition: 'プログラミング不要で即日導入可能、月額5万円から始められる業務自動化',
                                                    revenueModel: 'SaaS型月額課金（ベーシック5万円、プロ15万円、エンタープライズ30万円）',
                                                    estimatedRevenue: 1200000000,
                                                    implementationDifficulty: 'medium',
                                                    marketOpportunity: '中小企業のDX需要拡大とAI民主化の波に乗る絶好の機会'
                                                },
                                                {
                                                    id: 'idea-002',
                                                    title: 'AI在庫最適化サービス「在庫マスター」',
                                                    description: '小売業・飲食業向けのAI駆動在庫管理システム。需要予測と自動発注により、在庫切れと過剰在庫を同時に削減。食品ロス削減にも貢献。',
                                                    targetCustomers: ['小規模小売店', '飲食チェーン', 'ECサイト運営者'],
                                                    customerPains: ['在庫管理の複雑さ', '廃棄ロスの増大', '発注業務の手間'],
                                                    valueProposition: '在庫回転率30%向上、廃棄ロス50%削減を実現する次世代在庫管理',
                                                    revenueModel: '初期導入費30万円＋月額利用料（売上規模に応じて3-20万円）',
                                                    estimatedRevenue: 800000000,
                                                    implementationDifficulty: 'low',
                                                    marketOpportunity: 'SDGs対応とコスト削減を同時に実現できる社会的意義の高いソリューション'
                                                },
                                                {
                                                    id: 'idea-003',
                                                    title: 'バーチャルAI研修プラットフォーム',
                                                    description: 'VR技術とAIを組み合わせた没入型研修システム。製造業や医療分野での実践的なトレーニングを安全かつ効率的に実施可能。',
                                                    targetCustomers: ['製造業', '医療機関', '教育機関'],
                                                    customerPains: ['実地研修のコストとリスク', '研修効果の測定困難', '講師不足'],
                                                    valueProposition: 'リアルな体験学習を通じて研修効果を3倍に向上、事故リスクゼロ',
                                                    revenueModel: 'ライセンス販売（年間300万円）＋カスタマイズ開発費',
                                                    estimatedRevenue: 1500000000,
                                                    implementationDifficulty: 'high',
                                                    marketOpportunity: 'メタバース時代の新しい教育・研修市場の開拓'
                                                }
                                            ],
                                            summary: '3つの革新的なビジネスアイデアを生成しました。特に中小企業向けAIソリューションは市場ニーズが高く、早期の収益化が期待できます。',
                                            metadata: {
                                                totalIdeas: 3,
                                                averageRevenue: 1166666667,
                                                marketSize: 3000000000000,
                                                generationDate: new Date().toISOString()
                                            }
                                        }),
                                        response_metadata: {
                                            usage: {
                                                prompt_tokens: 1500,
                                                completion_tokens: 2500,
                                                total_tokens: 4000
                                            }
                                        }
                                    }];
                            });
                        }); },
                        _modelType: function () { return 'chat'; },
                        _llmType: function () { return 'openai-mock'; }
                    };
                    _e.label = 1;
                case 1:
                    _e.trys.push([1, 3, , 4]);
                    ideator_2 = new ideator_1.IdeatorAgent({
                        llm: mockLLM,
                        enableValidation: true,
                        enableLogging: true
                    });
                    request = {
                        numberOfIdeas: 3,
                        temperature: 0.8,
                        focusAreas: ['中小企業', 'AI自動化', 'SaaS'],
                        targetMarket: '日本の中小企業市場'
                    };
                    log('\nアイデア生成を開始します...', colors.yellow);
                    return [4 /*yield*/, ideator_2.generateIdeas(mockEnhancedOutput, request)];
                case 2:
                    output = _e.sent();
                    logSection('生成されたビジネスアイデア');
                    // 各アイデアを表示
                    output.ideas.forEach(function (idea, index) {
                        logIdea(idea, index);
                        // 品質検証
                        var validation = ideator_2.validateIdea(idea);
                        console.log("\n".concat(colors.bright, "\u3010\u54C1\u8CEA\u8A55\u4FA1\u3011").concat(colors.reset));
                        console.log("\u691C\u8A3C\u7D50\u679C: ".concat(validation.isValid ? '✅ 有効' : '❌ 無効'));
                        console.log("\u54C1\u8CEA\u30B9\u30B3\u30A2: ".concat(validation.qualityScore || 'N/A', "/100"));
                        if (validation.issues && validation.issues.length > 0) {
                            console.log('改善点:');
                            validation.issues.forEach(function (issue) {
                                var icon = issue.severity === 'error' ? '🔴' :
                                    issue.severity === 'warning' ? '🟡' : '🔵';
                                console.log("  ".concat(icon, " ").concat(issue.field, ": ").concat(issue.message));
                            });
                        }
                        // 強み・弱み分析
                        var analysis = ideator_2.analyzeIdea(idea);
                        if (analysis.strengths.length > 0) {
                            console.log("\n".concat(colors.green, "\u5F37\u307F:").concat(colors.reset));
                            analysis.strengths.forEach(function (s) { return console.log("  \u2022 ".concat(s)); });
                        }
                        if (analysis.weaknesses.length > 0) {
                            console.log("\n".concat(colors.yellow, "\u5F31\u307F:").concat(colors.reset));
                            analysis.weaknesses.forEach(function (w) { return console.log("  \u2022 ".concat(w)); });
                        }
                    });
                    // サマリー情報
                    logSection('生成結果サマリー');
                    console.log("\u7DCF\u30A2\u30A4\u30C7\u30A2\u6570: ".concat(((_a = output.metadata) === null || _a === void 0 ? void 0 : _a.totalIdeas) || output.ideas.length));
                    console.log("\u5E73\u5747\u63A8\u5B9A\u55B6\u696D\u5229\u76CA: ".concat(formatCurrency(((_b = output.metadata) === null || _b === void 0 ? void 0 : _b.averageRevenue) || 0)));
                    console.log("\u5BFE\u8C61\u5E02\u5834\u898F\u6A21: ".concat(formatCurrency(((_c = output.metadata) === null || _c === void 0 ? void 0 : _c.marketSize) || 0)));
                    console.log("\u751F\u6210\u65E5\u6642: ".concat(new Date(((_d = output.metadata) === null || _d === void 0 ? void 0 : _d.generationDate) || Date.now()).toLocaleString('ja-JP')));
                    console.log("\n\u30B5\u30DE\u30EA\u30FC: ".concat(output.summary || '生成完了'));
                    metrics = ideator_2.getMetrics();
                    logSection('パフォーマンスメトリクス');
                    console.log("\u4F7F\u7528\u30C8\u30FC\u30AF\u30F3\u6570:");
                    console.log("  \u2022 \u30D7\u30ED\u30F3\u30D7\u30C8: ".concat(metrics.tokenUsage.promptTokens));
                    console.log("  \u2022 \u751F\u6210: ".concat(metrics.tokenUsage.completionTokens));
                    console.log("  \u2022 \u5408\u8A08: ".concat(metrics.tokenUsage.totalTokens));
                    console.log("\u63A8\u5B9A\u30B3\u30B9\u30C8: $".concat(((metrics.tokenUsage.totalTokens / 1000) * 0.03).toFixed(4)));
                    outputDir = path.join(process.cwd(), 'debug-output');
                    if (!fs.existsSync(outputDir)) {
                        fs.mkdirSync(outputDir, { recursive: true });
                    }
                    outputFile = path.join(outputDir, "ideator-output-".concat(Date.now(), ".json"));
                    fs.writeFileSync(outputFile, JSON.stringify({
                        request: request,
                        output: output,
                        metrics: metrics,
                        timestamp: new Date().toISOString()
                    }, null, 2));
                    log("\n\u2705 \u7D50\u679C\u3092\u4FDD\u5B58\u3057\u307E\u3057\u305F: ".concat(outputFile), colors.green);
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _e.sent();
                    console.error(colors.bright + colors.red + '\n❌ エラーが発生しました:' + colors.reset);
                    console.error(error_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// メイン実行
function main() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.clear();
                    log('🚀 Ideator Agent 出力テスト', colors.bright + colors.cyan);
                    log('='.repeat(80), colors.cyan);
                    return [4 /*yield*/, testWithMockLLM()];
                case 1:
                    _a.sent();
                    log('\n✨ テスト完了', colors.bright + colors.green);
                    return [2 /*return*/];
            }
        });
    });
}
// 実行
main().catch(console.error);
