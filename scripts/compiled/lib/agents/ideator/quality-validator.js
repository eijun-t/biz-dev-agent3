"use strict";
/**
 * Quality Validator
 * ビジネスアイデアの品質検証バリデーター
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.QualityValidator = void 0;
var ideator_1 = require("../../validations/ideator");
/**
 * 品質検証バリデーター
 */
var QualityValidator = /** @class */ (function () {
    function QualityValidator() {
        this.rules = this.initializeRules();
    }
    /**
     * ビジネスアイデアを検証
     */
    QualityValidator.prototype.validateIdea = function (idea) {
        var issues = [];
        var isValid = true;
        // スキーマバリデーション
        var parseResult = ideator_1.businessIdeaSchema.safeParse(idea);
        if (!parseResult.success) {
            if (parseResult.error && parseResult.error.errors) {
                parseResult.error.errors.forEach(function (err) {
                    issues.push({
                        field: err.path.join('.'),
                        message: err.message,
                        severity: 'error'
                    });
                });
            }
            isValid = false;
        }
        // カスタムルールによる検証
        for (var _i = 0, _a = this.rules; _i < _a.length; _i++) {
            var rule = _a[_i];
            var issue = rule.validate(idea);
            if (issue) {
                issues.push(issue);
                if (issue.severity === 'error') {
                    isValid = false;
                }
            }
        }
        // 品質スコアを計算
        var qualityScore = this.calculateQualityScore(idea, issues);
        return {
            isValid: isValid,
            issues: issues,
            qualityScore: qualityScore,
            ideaId: idea.id
        };
    };
    /**
     * 複数のアイデアを検証
     */
    QualityValidator.prototype.validateOutput = function (output) {
        var validIdeas = [];
        var invalidIdeas = [];
        var issuesMap = new Map();
        var totalScore = 0;
        for (var _i = 0, _a = output.ideas; _i < _a.length; _i++) {
            var idea = _a[_i];
            var result = this.validateIdea(idea);
            if (result.isValid) {
                validIdeas.push(idea);
            }
            else {
                invalidIdeas.push(idea);
            }
            if (result.issues.length > 0) {
                issuesMap.set(idea.id, result.issues);
            }
            totalScore += result.qualityScore;
        }
        var overallScore = output.ideas.length > 0
            ? totalScore / output.ideas.length
            : 0;
        return {
            isValid: invalidIdeas.length === 0,
            validIdeas: validIdeas,
            invalidIdeas: invalidIdeas,
            issues: issuesMap,
            overallScore: overallScore
        };
    };
    /**
     * アイデアの改善提案を生成
     */
    QualityValidator.prototype.generateImprovementSuggestions = function (idea, validationResult) {
        var _this = this;
        var suggestions = [];
        // エラーに基づく提案
        validationResult.issues
            .filter(function (issue) { return issue.severity === 'error'; })
            .forEach(function (issue) {
            suggestions.push(_this.getSuggestionForIssue(issue, idea));
        });
        // 警告に基づく提案
        validationResult.issues
            .filter(function (issue) { return issue.severity === 'warning'; })
            .forEach(function (issue) {
            suggestions.push(_this.getSuggestionForIssue(issue, idea));
        });
        // 品質スコアに基づく全般的な提案
        if (validationResult.qualityScore < 60) {
            suggestions.push('アイデアの具体性を高め、実現可能性を詳細に検討してください。');
        }
        else if (validationResult.qualityScore < 80) {
            suggestions.push('収益モデルと市場機会の説明をより詳細にしてください。');
        }
        return suggestions;
    };
    /**
     * 検証ルールを初期化
     */
    QualityValidator.prototype.initializeRules = function () {
        return [
            {
                id: 'title-length',
                name: 'タイトル長チェック',
                description: 'タイトルが適切な長さか確認',
                severity: 'error',
                validate: function (idea) {
                    if (!idea.title || idea.title.length === 0) {
                        return {
                            field: 'title',
                            message: 'タイトルが設定されていません',
                            severity: 'error'
                        };
                    }
                    if (idea.title.length > 30) {
                        return {
                            field: 'title',
                            message: 'タイトルは30文字以内にしてください',
                            severity: 'error'
                        };
                    }
                    return null;
                }
            },
            {
                id: 'description-quality',
                name: '説明文の品質チェック',
                description: '説明文が十分詳細か確認',
                severity: 'warning',
                validate: function (idea) {
                    if (!idea.description || idea.description.length < 50) {
                        return {
                            field: 'description',
                            message: '説明文が短すぎます。より詳細な説明を追加してください',
                            severity: 'warning'
                        };
                    }
                    if (idea.description.length > 500) {
                        return {
                            field: 'description',
                            message: '説明文が長すぎます。要点を絞って簡潔にしてください',
                            severity: 'warning'
                        };
                    }
                    return null;
                }
            },
            {
                id: 'target-customers',
                name: 'ターゲット顧客の具体性',
                description: 'ターゲット顧客が明確か確認',
                severity: 'error',
                validate: function (idea) {
                    if (!idea.targetCustomers || idea.targetCustomers.length === 0) {
                        return {
                            field: 'targetCustomers',
                            message: 'ターゲット顧客が設定されていません',
                            severity: 'error'
                        };
                    }
                    if (idea.targetCustomers.some(function (tc) { return tc.length < 2; })) {
                        return {
                            field: 'targetCustomers',
                            message: 'ターゲット顧客の説明が不十分です',
                            severity: 'warning'
                        };
                    }
                    return null;
                }
            },
            {
                id: 'revenue-realism',
                name: '収益予測の現実性',
                description: '推定営業利益が現実的か確認',
                severity: 'warning',
                validate: function (idea) {
                    if (!idea.estimatedRevenue || idea.estimatedRevenue <= 0) {
                        return {
                            field: 'estimatedRevenue',
                            message: '推定営業利益が設定されていません',
                            severity: 'error'
                        };
                    }
                    if (idea.estimatedRevenue > 100000000000) { // 1000億円以上
                        return {
                            field: 'estimatedRevenue',
                            message: '推定営業利益が非現実的に高い可能性があります',
                            severity: 'warning'
                        };
                    }
                    if (idea.estimatedRevenue < 10000000) { // 1000万円未満
                        return {
                            field: 'estimatedRevenue',
                            message: '推定営業利益が事業として小さすぎる可能性があります',
                            severity: 'info'
                        };
                    }
                    return null;
                }
            },
            {
                id: 'value-proposition-clarity',
                name: '提供価値の明確性',
                description: '提供価値が明確に定義されているか確認',
                severity: 'error',
                validate: function (idea) {
                    if (!idea.valueProposition || idea.valueProposition.length < 10) {
                        return {
                            field: 'valueProposition',
                            message: '提供価値が不明確です',
                            severity: 'error'
                        };
                    }
                    return null;
                }
            },
            {
                id: 'revenue-model-detail',
                name: '収益モデルの詳細度',
                description: '収益モデルが十分詳細か確認',
                severity: 'warning',
                validate: function (idea) {
                    if (!idea.revenueModel || idea.revenueModel.length < 10) {
                        return {
                            field: 'revenueModel',
                            message: '収益モデルの説明が不十分です',
                            severity: 'warning'
                        };
                    }
                    return null;
                }
            },
            {
                id: 'customer-pain-alignment',
                name: '顧客課題との整合性',
                description: '解決する顧客課題が明確か確認',
                severity: 'warning',
                validate: function (idea) {
                    if (!idea.customerPains || idea.customerPains.length === 0) {
                        return {
                            field: 'customerPains',
                            message: '解決する顧客課題が設定されていません',
                            severity: 'warning'
                        };
                    }
                    if (idea.customerPains.length > 10) {
                        return {
                            field: 'customerPains',
                            message: '顧客課題が多すぎます。焦点を絞ることを検討してください',
                            severity: 'info'
                        };
                    }
                    return null;
                }
            },
            {
                id: 'implementation-assessment',
                name: '実装難易度の妥当性',
                description: '実装難易度が適切に評価されているか確認',
                severity: 'info',
                validate: function (idea) {
                    var validDifficulties = ['low', 'medium', 'high'];
                    if (!validDifficulties.includes(idea.implementationDifficulty)) {
                        return {
                            field: 'implementationDifficulty',
                            message: '実装難易度が正しく設定されていません',
                            severity: 'error'
                        };
                    }
                    // 高収益だが低難易度の場合、再検討を促す
                    if (idea.estimatedRevenue > 1000000000 && idea.implementationDifficulty === 'low') {
                        return {
                            field: 'implementationDifficulty',
                            message: '高収益にも関わらず実装難易度が低いです。競合優位性を再検討してください',
                            severity: 'info'
                        };
                    }
                    return null;
                }
            },
            {
                id: 'market-opportunity-link',
                name: '市場機会との関連性',
                description: '市場機会が明確に示されているか確認',
                severity: 'warning',
                validate: function (idea) {
                    if (!idea.marketOpportunity || idea.marketOpportunity.length < 10) {
                        return {
                            field: 'marketOpportunity',
                            message: '市場機会の説明が不十分です',
                            severity: 'warning'
                        };
                    }
                    return null;
                }
            }
        ];
    };
    /**
     * 品質スコアを計算
     */
    QualityValidator.prototype.calculateQualityScore = function (idea, issues) {
        var score = 100;
        // エラーごとに減点
        var errorCount = issues.filter(function (i) { return i.severity === 'error'; }).length;
        var warningCount = issues.filter(function (i) { return i.severity === 'warning'; }).length;
        var infoCount = issues.filter(function (i) { return i.severity === 'info'; }).length;
        score -= errorCount * 20;
        score -= warningCount * 10;
        score -= infoCount * 5;
        // 完成度ボーナス
        if (idea.description && idea.description.length > 100)
            score += 5;
        if (idea.targetCustomers && idea.targetCustomers.length >= 2)
            score += 5;
        if (idea.customerPains && idea.customerPains.length >= 2)
            score += 5;
        if (idea.revenueModel && idea.revenueModel.length > 20)
            score += 5;
        // 現実性ボーナス
        if (idea.estimatedRevenue > 100000000 && idea.estimatedRevenue < 10000000000) {
            score += 10; // 1億〜100億円の現実的な範囲
        }
        return Math.max(0, Math.min(100, score));
    };
    /**
     * 課題に対する改善提案を取得
     */
    QualityValidator.prototype.getSuggestionForIssue = function (issue, idea) {
        var suggestionMap = {
            'title': "\u30BF\u30A4\u30C8\u30EB\u300C".concat(idea.title, "\u300D\u3092\u898B\u76F4\u3057\u3001\u3088\u308A\u9B45\u529B\u7684\u3067\u7C21\u6F54\u306A\u8868\u73FE\u306B\u3057\u3066\u304F\u3060\u3055\u3044\u3002"),
            'description': '説明文をより具体的にし、独自性と価値提案を明確にしてください。',
            'targetCustomers': 'ターゲット顧客をより具体的に定義し、ペルソナを明確にしてください。',
            'estimatedRevenue': '市場規模と獲得可能シェアから、より現実的な収益予測を行ってください。',
            'valueProposition': '競合と差別化された明確な価値提案を定義してください。',
            'revenueModel': '収益化の具体的な方法（価格設定、課金モデル等）を詳細に説明してください。',
            'customerPains': '解決する顧客課題を優先順位付けし、最も重要なものに焦点を当ててください。',
            'implementationDifficulty': '技術的要件、必要リソース、期間を考慮して実装難易度を再評価してください。',
            'marketOpportunity': '市場調査データに基づいて、具体的な市場機会を説明してください。'
        };
        return suggestionMap[issue.field] ||
            "".concat(issue.field, "\u306B\u95A2\u3059\u308B\u554F\u984C: ").concat(issue.message);
    };
    /**
     * アイデアの強みを分析
     */
    QualityValidator.prototype.analyzeStrengths = function (idea) {
        var strengths = [];
        // 収益性の評価
        if (idea.estimatedRevenue > 1000000000) {
            strengths.push('高い収益性が期待できる');
        }
        // 実現可能性の評価
        if (idea.implementationDifficulty === 'low') {
            strengths.push('実装が比較的容易で早期実現が可能');
        }
        // 市場適合性の評価
        if (idea.targetCustomers.length >= 3) {
            strengths.push('幅広い顧客セグメントに対応可能');
        }
        // 課題解決力の評価
        if (idea.customerPains.length >= 3) {
            strengths.push('複数の顧客課題を同時に解決');
        }
        // 差別化の評価
        if (idea.valueProposition && idea.valueProposition.length > 50) {
            strengths.push('明確な価値提案による差別化');
        }
        return strengths;
    };
    /**
     * アイデアの弱みを分析
     */
    QualityValidator.prototype.analyzeWeaknesses = function (idea) {
        var weaknesses = [];
        // 実装難易度の課題
        if (idea.implementationDifficulty === 'high') {
            weaknesses.push('実装が複雑で時間とリソースが必要');
        }
        // 市場規模の課題
        if (idea.estimatedRevenue < 100000000) {
            weaknesses.push('市場規模が限定的で成長性に課題');
        }
        // ターゲットの課題
        if (idea.targetCustomers.length === 1) {
            weaknesses.push('ターゲット顧客が限定的でリスクが高い');
        }
        // 収益モデルの課題
        if (!idea.revenueModel || idea.revenueModel.length < 30) {
            weaknesses.push('収益モデルの具体性が不足');
        }
        return weaknesses;
    };
    return QualityValidator;
}());
exports.QualityValidator = QualityValidator;
