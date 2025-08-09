/**
 * Critic Agent Output Format Test
 * Critic → Analyst へのデータ受け渡し形式を確認
 */

// Criticエージェントの出力形式（CriticOutput型）
const mockCriticOutput = {
  // セッションID（全エージェント共通）
  sessionId: "session-20250109-001",
  
  // 全アイデアの評価結果配列
  evaluationResults: [
    {
      ideaId: "idea-1",
      ideaTitle: "AI駆動型スマートビルディング管理プラットフォーム",
      
      // 市場評価（0-50点）
      marketScore: {
        total: 47,
        breakdown: {
          marketSize: 20,        // 市場規模（0-20点）
          growthPotential: 15,   // 成長性（0-15点）
          profitability: 12      // 収益性（0-15点）
        },
        reasoning: "国内スマートビル市場3000億円、年率15%成長、営業利益25億円見込み",
        evidence: [
          "市場規模: 国内スマートビル市場3000億円",
          "成長率: 年率15%の急成長",
          "営業利益: 25億円（目標10億円を大幅超過）",
          "カーボンニュートラル需要の拡大"
        ]
      },
      
      // シナジー評価（0-50点）
      synergyScore: {
        total: 45,
        breakdown: {
          capabilityMatch: 19,   // ケイパビリティマッチ（0-20点）
          synergyEffect: 14,     // シナジー効果（0-15点）
          uniqueAdvantage: 12    // 独自優位性（0-15点）
        },
        
        // ケイパビリティマッピング
        capabilityMapping: {
          requiredCapabilities: [
            {
              name: "不動産運営ノウハウ",
              importance: "critical",
              description: "大規模ビル群の統合管理経験"
            },
            {
              name: "テナントネットワーク",
              importance: "important",
              description: "3000社のテナント企業との関係"
            },
            {
              name: "AI/IoT技術",
              importance: "important",
              description: "スマートビル技術の実装能力"
            }
          ],
          mitsubishiCapabilities: [
            {
              category: "real_estate_development",
              name: "丸の内30棟運営",
              description: "日本最大級のビジネス街区運営実績",
              specificAssets: ["丸の内ビルディング", "新丸の内ビルディング", "JPタワー"]
            },
            {
              category: "operations",
              name: "テナント管理",
              description: "3000社・28万人の就業者管理",
              specificAssets: ["テナント企業3000社", "年間賃料5000億円"]
            },
            {
              category: "innovation",
              name: "スマートシティ推進",
              description: "丸の内データコンソーシアム運営",
              specificAssets: ["ビッグデータ活用", "AI・IoT実証実験"]
            }
          ],
          matchScore: 85,
          gaps: ["AI技術者の採用・育成が必要"]
        },
        
        // シナジーシナリオ
        synergyScenario: {
          scenario: "丸の内30棟を実証フィールドとして活用し、3000社のテナントとの既存関係を基盤に迅速展開。初期導入コストを最小化しながら、実績を積み上げて全国展開へ。",
          keyAdvantages: [
            "丸の内エリアでの圧倒的な実績と信頼",
            "3000社のテナントへの直接アクセス",
            "実証実験から本格導入までワンストップ",
            "三菱グループのシナジー効果"
          ],
          synergyMultiplier: 1.3
        },
        
        // シナリオ検証
        scenarioValidation: {
          logicalConsistency: 88,
          feasibility: 85,
          uniqueness: 82,
          overallCredibility: 85,
          validationComments: [
            "既存アセットの活用で実現可能性が高い",
            "テナントニーズと合致",
            "他社には模倣困難な独自ポジション"
          ]
        },
        
        reasoning: "三菱地所の既存ケイパビリティと高い親和性。丸の内エリアでの実績を最大限活用可能。"
      },
      
      // 総合評価
      totalScore: 92,
      rank: 1,
      recommendation: "強く推奨: 市場性・シナジー共に優れており、早期の事業化検討を推奨",
      
      // リスクと機会
      risks: [
        "初期投資3億円の回収期間",
        "AI技術者の確保・育成コスト",
        "競合他社（日立、JC）との差別化"
      ],
      opportunities: [
        "カーボンニュートラル規制強化による需要増",
        "ESG投資の拡大",
        "海外展開（アジア都市）の可能性",
        "政府のDX推進補助金活用"
      ]
    },
    // ... 他のアイデアの評価結果も同様の構造
  ],
  
  // 最優秀アイデア（evaluationResultsの中から選定）
  selectedIdea: null, // 後で設定
  
  // 評価サマリー
  summary: "AI駆動型スマートビルディング管理プラットフォームが最高評価（92点）を獲得。市場規模3000億円・年率15%成長の有望市場において、営業利益25億円を見込む。三菱地所の丸の内30棟・テナント3000社の既存アセットを活用することで、他社には模倣困難な競争優位を確立可能。",
  
  // メタデータ
  metadata: {
    evaluationId: "eval-20250109-001",
    startTime: new Date("2025-01-09T10:00:00Z"),
    endTime: new Date("2025-01-09T10:00:30Z"),
    processingTime: 30000, // 30秒
    tokensUsed: 3500,
    llmCalls: 6, // 各アイデア3回（市場、ケイパビリティ、シナリオ）
    cacheHits: 0,
    errors: []
  }
};

// selectedIdeaを設定
mockCriticOutput.selectedIdea = mockCriticOutput.evaluationResults[0];

// Analystエージェントへの入力形式（想定）
const analystInput = {
  sessionId: mockCriticOutput.sessionId,
  
  // Criticが選定した最優秀アイデア
  selectedIdea: {
    // 基本情報（Ideatorからの情報を含む）
    id: mockCriticOutput.selectedIdea.ideaId,
    title: mockCriticOutput.selectedIdea.ideaTitle,
    description: "AIとIoTセンサーを活用して、丸の内エリア30棟のビル群を統合管理。エネルギー効率を30%改善。",
    targetCustomer: "大規模ビルオーナー、不動産管理会社、テナント企業の総務部門",
    customerProblem: "ビル管理コストの増大、カーボンニュートラル対応の圧力",
    proposedSolution: "AI予測制御による空調・照明の最適化、故障予測による予防保全",
    revenueModel: "SaaS月額課金＋省エネ成果報酬",
    estimatedRevenue: 2500000000,
    marketSize: "国内スマートビル市場3000億円",
    
    // Criticの評価結果
    criticEvaluation: {
      totalScore: mockCriticOutput.selectedIdea.totalScore,
      marketScore: mockCriticOutput.selectedIdea.marketScore,
      synergyScore: mockCriticOutput.selectedIdea.synergyScore,
      recommendation: mockCriticOutput.selectedIdea.recommendation,
      risks: mockCriticOutput.selectedIdea.risks,
      opportunities: mockCriticOutput.selectedIdea.opportunities
    }
  },
  
  // Researcherからの元データ（参考用）
  researchData: {
    // 省略（必要に応じて含める）
  },
  
  // 分析の指示
  analysisConfig: {
    includeTAMSAMSOM: true,      // TAM/SAM/SOM分析を含める
    includeCompetitorAnalysis: true, // 競合分析を含める
    includeMarketTrends: true,    // 市場トレンド分析を含める
    includeImplementationPlan: true, // 実装計画を含める
    depth: "detailed"             // 分析の深さ
  }
};

// 表示
console.log('=' .repeat(80));
console.log('📤 CRITIC AGENT OUTPUT FORMAT (Critic → Analyst)');
console.log('=' .repeat(80));

console.log('\n1️⃣ CRITIC OUTPUT STRUCTURE:\n');
console.log('CriticOutput = {');
console.log('  sessionId: string,');
console.log('  evaluationResults: EvaluationResult[],  // 全評価結果');
console.log('  selectedIdea: EvaluationResult,         // 最優秀アイデア');
console.log('  summary: string,                        // サマリー');
console.log('  metadata: EvaluationMetadata            // メタデータ');
console.log('}');

console.log('\n2️⃣ SELECTED IDEA DETAILS:\n');
console.log(JSON.stringify(mockCriticOutput.selectedIdea, null, 2));

console.log('\n3️⃣ KEY DATA POINTS FOR ANALYST:\n');
console.log('📊 Scores:');
console.log(`  - Total Score: ${mockCriticOutput.selectedIdea.totalScore}/100`);
console.log(`  - Market Score: ${mockCriticOutput.selectedIdea.marketScore.total}/50`);
console.log(`  - Synergy Score: ${mockCriticOutput.selectedIdea.synergyScore.total}/50`);

console.log('\n🎯 Market Evaluation:');
console.log(`  - Market Size Score: ${mockCriticOutput.selectedIdea.marketScore.breakdown.marketSize}/20`);
console.log(`  - Growth Potential: ${mockCriticOutput.selectedIdea.marketScore.breakdown.growthPotential}/15`);
console.log(`  - Profitability: ${mockCriticOutput.selectedIdea.marketScore.breakdown.profitability}/15`);
console.log(`  - Evidence: ${mockCriticOutput.selectedIdea.marketScore.evidence.length} items`);

console.log('\n🤝 Synergy Analysis:');
console.log(`  - Capability Match: ${mockCriticOutput.selectedIdea.synergyScore.capabilityMapping.matchScore}%`);
console.log(`  - Required Capabilities: ${mockCriticOutput.selectedIdea.synergyScore.capabilityMapping.requiredCapabilities.length}`);
console.log(`  - Mitsubishi Capabilities: ${mockCriticOutput.selectedIdea.synergyScore.capabilityMapping.mitsubishiCapabilities.length}`);
console.log(`  - Synergy Multiplier: ${mockCriticOutput.selectedIdea.synergyScore.synergyScenario.synergyMultiplier}x`);

console.log('\n⚠️ Risks & Opportunities:');
console.log(`  - Risks: ${mockCriticOutput.selectedIdea.risks.length} identified`);
mockCriticOutput.selectedIdea.risks.forEach(risk => {
  console.log(`    • ${risk}`);
});
console.log(`  - Opportunities: ${mockCriticOutput.selectedIdea.opportunities.length} identified`);
mockCriticOutput.selectedIdea.opportunities.forEach(opp => {
  console.log(`    • ${opp}`);
});

console.log('\n4️⃣ ANALYST INPUT FORMAT (EXPECTED):\n');
console.log(JSON.stringify(analystInput, null, 2).substring(0, 1500) + '...');

console.log('\n' + '=' .repeat(80));
console.log('📥 DATA FLOW: Ideator → Critic → Analyst → Writer');
console.log('=' .repeat(80));

console.log('\n🔄 Data Transformation:');
console.log('1. Ideator generates 5 business ideas');
console.log('2. Critic evaluates all 5 and selects the best one');
console.log('3. Analyst receives ONLY the selected idea with evaluation details');
console.log('4. Analyst performs deep dive analysis (TAM/SAM/SOM, competitors, etc.)');
console.log('5. Writer creates the final HTML report');

console.log('\n✅ Key Points:');
console.log('• Analyst receives the SELECTED idea, not all 5');
console.log('• Includes both original idea data AND Critic evaluation');
console.log('• Preserves sessionId for tracking');
console.log('• Includes risks/opportunities for deeper analysis');

console.log('\n💾 To save this output structure:');
console.log('fs.writeFileSync("critic-output.json", JSON.stringify(mockCriticOutput, null, 2))');

// 実際のファイル保存
const fs = require('fs');
const outputPath = './debug-output/critic-output-format.json';
fs.mkdirSync('./debug-output', { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(mockCriticOutput, null, 2));
console.log(`\n✨ Full output format saved to: ${outputPath}`);