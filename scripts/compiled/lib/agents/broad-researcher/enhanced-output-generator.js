"use strict";
/**
 * Enhanced Output Generator for Researcher Agent
 * より豊富な情報を次のエージェントに渡すための拡張出力生成器
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
exports.EnhancedOutputGenerator = void 0;
var EnhancedOutputGenerator = /** @class */ (function () {
    function EnhancedOutputGenerator() {
    }
    /**
     * Generate enriched output for the next agent
     */
    EnhancedOutputGenerator.generateEnrichedOutput = function (processed, searchResults) {
        // 検索結果から重要な情報を抽出
        var extractedData = this.extractKeyInformation(searchResults);
        // 詳細分析データの統合
        var enrichedData = __assign(__assign({}, processed), { summary: processed.insights.marketSize || '', keyFindings: [], generatedAt: new Date(), 
            // 追加: 拡張データ
            enrichedData: {
                // 検索結果から抽出した具体的な情報
                extractedFacts: extractedData.facts,
                extractedMetrics: extractedData.metrics,
                extractedEntities: extractedData.entities,
                // カテゴリ別の詳細情報
                marketIntelligence: {
                    sizeAndGrowth: this.extractMarketData(searchResults),
                    segments: this.extractSegmentData(searchResults),
                    drivers: this.extractMarketDrivers(searchResults)
                },
                competitiveIntelligence: {
                    players: this.extractCompetitorData(searchResults),
                    dynamics: this.extractCompetitiveDynamics(searchResults),
                    strategies: this.extractStrategies(searchResults)
                },
                customerIntelligence: {
                    needs: this.extractCustomerNeeds(searchResults),
                    behaviors: this.extractCustomerBehaviors(searchResults),
                    segments: this.extractCustomerSegments(searchResults)
                },
                technologicalIntelligence: {
                    current: this.extractCurrentTech(searchResults),
                    emerging: this.extractEmergingTech(searchResults),
                    disruptions: this.extractDisruptions(searchResults)
                },
                // 重要な引用と証拠
                keyQuotes: this.extractKeyQuotes(searchResults),
                evidenceBase: this.extractEvidence(searchResults),
                // ビジネスインテリジェンス
                opportunities: this.identifyOpportunities(processed, searchResults),
                threats: this.identifyThreats(processed, searchResults),
                recommendations: this.generateActionableRecommendations(processed, searchResults)
            } });
        return enrichedData;
    };
    /**
     * Extract key information from search results
     */
    EnhancedOutputGenerator.extractKeyInformation = function (results) {
        var facts = [];
        var metrics = [];
        var entities = [];
        var allResults = __spreadArray(__spreadArray([], results.japanese, true), results.global, true);
        allResults.forEach(function (result) {
            // 数値データの抽出
            var numbers = result.snippet.match(/\d+[\d,\.]*\s*(?:兆|億|万|million|billion|%|円|ドル)/g);
            if (numbers) {
                numbers.forEach(function (num) {
                    metrics.push({
                        label: '抽出された指標',
                        value: num,
                        source: result.title
                    });
                });
            }
            // 企業名の抽出
            var companies = result.snippet.match(/(?:株式会社|Inc\.|Corp\.|Ltd\.)\s*[\w\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]+/g);
            if (companies) {
                companies.forEach(function (company) {
                    entities.push({
                        type: 'company',
                        name: company,
                        context: result.snippet.substring(0, 100)
                    });
                });
            }
            // 重要な事実の抽出
            if (result.snippet.includes('初めて') || result.snippet.includes('最大') || result.snippet.includes('唯一')) {
                facts.push(result.snippet);
            }
        });
        return { facts: facts, metrics: metrics, entities: entities };
    };
    /**
     * Extract market data
     */
    EnhancedOutputGenerator.extractMarketData = function (results) {
        var marketData = {
            sizes: [],
            growthRates: [],
            projections: []
        };
        var allResults = __spreadArray(__spreadArray([], results.japanese, true), results.global, true);
        allResults.forEach(function (result) {
            // 市場規模
            if (result.snippet.match(/市場.*\d+.*(?:兆|億)/)) {
                marketData.sizes.push(result.snippet);
            }
            // 成長率
            if (result.snippet.match(/成長.*\d+.*%/)) {
                marketData.growthRates.push(result.snippet);
            }
            // 将来予測
            if (result.snippet.match(/20\d{2}年.*(?:予測|見込|達する)/)) {
                marketData.projections.push(result.snippet);
            }
        });
        return marketData;
    };
    /**
     * Extract segment data
     */
    EnhancedOutputGenerator.extractSegmentData = function (results) {
        var segments = new Set();
        var segmentKeywords = ['セグメント', '分野', '領域', 'segment', 'category', 'vertical'];
        results.japanese.forEach(function (result) {
            segmentKeywords.forEach(function (keyword) {
                if (result.snippet.includes(keyword)) {
                    // セグメント名を抽出する簡易ロジック
                    var matches = result.snippet.match(/「([^」]+)」/g);
                    if (matches) {
                        matches.forEach(function (match) { return segments.add(match.replace(/[「」]/g, '')); });
                    }
                }
            });
        });
        return Array.from(segments);
    };
    /**
     * Extract market drivers
     */
    EnhancedOutputGenerator.extractMarketDrivers = function (results) {
        var drivers = [];
        var driverKeywords = ['要因', '促進', '推進', 'driver', 'driving', 'catalyst'];
        results.japanese.forEach(function (result) {
            driverKeywords.forEach(function (keyword) {
                if (result.snippet.includes(keyword)) {
                    drivers.push(result.snippet);
                }
            });
        });
        return drivers.slice(0, 5);
    };
    /**
     * Extract competitor data
     */
    EnhancedOutputGenerator.extractCompetitorData = function (results) {
        var competitors = [];
        var competitorKeywords = ['シェア', '大手', 'トップ', '主要', 'leader', 'top player'];
        results.japanese.forEach(function (result) {
            competitorKeywords.forEach(function (keyword) {
                if (result.snippet.includes(keyword)) {
                    // 企業名とシェアを抽出
                    var shareMatch = result.snippet.match(/(\S+).*?(\d+\.?\d*)\s*%/);
                    if (shareMatch) {
                        competitors.push({
                            name: shareMatch[1],
                            share: shareMatch[2] + '%',
                            source: result.title
                        });
                    }
                }
            });
        });
        return competitors;
    };
    /**
     * Extract competitive dynamics
     */
    EnhancedOutputGenerator.extractCompetitiveDynamics = function (results) {
        var dynamics = [];
        var dynamicsKeywords = ['競争', '競合', 'M&A', '買収', '提携', 'competition'];
        results.japanese.forEach(function (result) {
            dynamicsKeywords.forEach(function (keyword) {
                if (result.snippet.includes(keyword)) {
                    dynamics.push(result.snippet);
                }
            });
        });
        return dynamics.slice(0, 3);
    };
    /**
     * Extract strategies
     */
    EnhancedOutputGenerator.extractStrategies = function (results) {
        var strategies = [];
        var strategyKeywords = ['戦略', '施策', 'アプローチ', 'strategy', 'approach'];
        var allResults = __spreadArray(__spreadArray([], results.japanese, true), results.global, true);
        allResults.forEach(function (result) {
            strategyKeywords.forEach(function (keyword) {
                if (result.snippet.toLowerCase().includes(keyword)) {
                    strategies.push(result.snippet);
                }
            });
        });
        return strategies.slice(0, 5);
    };
    /**
     * Extract customer needs
     */
    EnhancedOutputGenerator.extractCustomerNeeds = function (results) {
        var needs = [];
        var needKeywords = ['ニーズ', '要望', '課題', '求め', 'need', 'demand', 'requirement'];
        results.japanese.forEach(function (result) {
            needKeywords.forEach(function (keyword) {
                if (result.snippet.includes(keyword)) {
                    needs.push(result.snippet);
                }
            });
        });
        return needs.slice(0, 5);
    };
    /**
     * Extract customer behaviors
     */
    EnhancedOutputGenerator.extractCustomerBehaviors = function (results) {
        var behaviors = [];
        var behaviorKeywords = ['行動', '傾向', '利用', '購買', 'behavior', 'usage', 'purchase'];
        results.japanese.forEach(function (result) {
            behaviorKeywords.forEach(function (keyword) {
                if (result.snippet.includes(keyword)) {
                    behaviors.push(result.snippet);
                }
            });
        });
        return behaviors.slice(0, 3);
    };
    /**
     * Extract customer segments
     */
    EnhancedOutputGenerator.extractCustomerSegments = function (results) {
        var segments = [];
        var segmentKeywords = ['層', '世代', 'ユーザー', '顧客', 'demographic', 'segment'];
        results.japanese.forEach(function (result) {
            segmentKeywords.forEach(function (keyword) {
                if (result.snippet.includes(keyword)) {
                    var matches = result.snippet.match(/(\S+(?:層|世代|ユーザー))/g);
                    if (matches) {
                        matches.forEach(function (match) { return segments.push(match); });
                    }
                }
            });
        });
        return Array.from(new Set(segments)).slice(0, 5);
    };
    /**
     * Extract current technologies
     */
    EnhancedOutputGenerator.extractCurrentTech = function (results) {
        var tech = [];
        var techKeywords = ['技術', 'テクノロジー', 'システム', 'technology', 'system', 'platform'];
        var allResults = __spreadArray(__spreadArray([], results.japanese, true), results.global, true);
        allResults.forEach(function (result) {
            techKeywords.forEach(function (keyword) {
                if (result.snippet.toLowerCase().includes(keyword)) {
                    tech.push(result.snippet);
                }
            });
        });
        return tech.slice(0, 5);
    };
    /**
     * Extract emerging technologies
     */
    EnhancedOutputGenerator.extractEmergingTech = function (results) {
        var emerging = [];
        var emergingKeywords = ['最新', '革新', '次世代', 'emerging', 'innovative', 'next-gen'];
        var allResults = __spreadArray(__spreadArray([], results.japanese, true), results.global, true);
        allResults.forEach(function (result) {
            emergingKeywords.forEach(function (keyword) {
                if (result.snippet.toLowerCase().includes(keyword)) {
                    emerging.push(result.snippet);
                }
            });
        });
        return emerging.slice(0, 5);
    };
    /**
     * Extract disruptions
     */
    EnhancedOutputGenerator.extractDisruptions = function (results) {
        var disruptions = [];
        var disruptionKeywords = ['破壊', '変革', 'ディスラプ', 'disrupt', 'transform', 'revolutionize'];
        var allResults = __spreadArray(__spreadArray([], results.japanese, true), results.global, true);
        allResults.forEach(function (result) {
            disruptionKeywords.forEach(function (keyword) {
                if (result.snippet.toLowerCase().includes(keyword)) {
                    disruptions.push(result.snippet);
                }
            });
        });
        return disruptions.slice(0, 3);
    };
    /**
     * Extract key quotes
     */
    EnhancedOutputGenerator.extractKeyQuotes = function (results) {
        var quotes = [];
        var allResults = __spreadArray(__spreadArray([], results.japanese, true), results.global, true).slice(0, 10);
        allResults.forEach(function (result) {
            if (result.snippet.includes('「') || result.snippet.includes('"')) {
                quotes.push({
                    quote: result.snippet,
                    source: result.title
                });
            }
        });
        return quotes.slice(0, 5);
    };
    /**
     * Extract evidence
     */
    EnhancedOutputGenerator.extractEvidence = function (results) {
        var evidence = [];
        var importantResults = __spreadArray(__spreadArray([], results.japanese, true), results.global, true).filter(function (r) { return r.position && r.position <= 5; })
            .slice(0, 10);
        importantResults.forEach(function (result) {
            evidence.push({
                fact: result.snippet,
                source: result.title,
                url: result.link
            });
        });
        return evidence;
    };
    /**
     * Identify opportunities
     */
    EnhancedOutputGenerator.identifyOpportunities = function (processed, results) {
        var opportunities = [];
        // ギャップ分析
        if (processed.insights.customerNeeds && processed.insights.customerNeeds.length > 0) {
            opportunities.push("\u9867\u5BA2\u30CB\u30FC\u30BA\u300C".concat(processed.insights.customerNeeds[0], "\u300D\u306B\u5BFE\u3059\u308B\u30BD\u30EA\u30E5\u30FC\u30B7\u30E7\u30F3\u958B\u767A"));
        }
        // 技術機会
        if (processed.globalInsights.technologies && processed.globalInsights.technologies.length > 0) {
            opportunities.push("".concat(processed.globalInsights.technologies[0], "\u306E\u65E5\u672C\u5E02\u5834\u3078\u306E\u5C0E\u5165"));
        }
        // 未開拓セグメント
        var segments = this.extractSegmentData(results);
        if (segments.length > 0) {
            opportunities.push("".concat(segments[0], "\u30BB\u30B0\u30E1\u30F3\u30C8\u3078\u306E\u53C2\u5165"));
        }
        return opportunities;
    };
    /**
     * Identify threats
     */
    EnhancedOutputGenerator.identifyThreats = function (processed, results) {
        var threats = [];
        // 競争脅威
        if (processed.insights.competitors && processed.insights.competitors.length > 0) {
            threats.push("".concat(processed.insights.competitors[0], "\u306B\u3088\u308B\u5E02\u5834\u652F\u914D\u306E\u5F37\u5316"));
        }
        // 規制脅威
        if (processed.insights.regulations && processed.insights.regulations.length > 0) {
            threats.push("\u65B0\u898F\u5236\u306B\u3088\u308B\u4E8B\u696D\u3078\u306E\u5F71\u97FF");
        }
        // 技術的脅威
        var disruptions = this.extractDisruptions(results);
        if (disruptions.length > 0) {
            threats.push("\u7834\u58CA\u7684\u6280\u8853\u306B\u3088\u308B\u65E2\u5B58\u30D3\u30B8\u30CD\u30B9\u30E2\u30C7\u30EB\u306E\u9673\u8150\u5316");
        }
        return threats;
    };
    /**
     * Generate actionable recommendations
     */
    EnhancedOutputGenerator.generateActionableRecommendations = function (processed, results) {
        var recommendations = [];
        // 市場参入
        if (processed.insights.marketSize) {
            recommendations.push({
                action: '成長市場への早期参入',
                rationale: processed.insights.marketSize,
                priority: 'high'
            });
        }
        // 技術導入
        if (processed.globalInsights.technologies && processed.globalInsights.technologies.length > 0) {
            recommendations.push({
                action: "".concat(processed.globalInsights.technologies[0], "\u306E\u5C0E\u5165\u691C\u8A0E"),
                rationale: '競争優位性の確立',
                priority: 'high'
            });
        }
        // パートナーシップ
        if (processed.insights.competitors && processed.insights.competitors.length > 1) {
            recommendations.push({
                action: '戦略的パートナーシップの構築',
                rationale: '市場での地位確立',
                priority: 'medium'
            });
        }
        return recommendations;
    };
    return EnhancedOutputGenerator;
}());
exports.EnhancedOutputGenerator = EnhancedOutputGenerator;
