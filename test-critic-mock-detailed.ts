/**
 * Critic Agent Mock Test with Detailed Output
 * モックLLMを使用した詳細出力テスト
 */

import { CriticAgent } from './lib/agents/critic/critic-agent';
import { CriticInput, BusinessIdea } from './lib/types/critic';

// テスト用のビジネスアイデア
const testIdeas: BusinessIdea[] = [
  {
    id: 'idea-1',
    title: 'AI駆動型スマートビルディング管理プラットフォーム',
    description: 'AIとIoTセンサーを活用して、丸の内エリア30棟のビル群を統合管理。エネルギー効率を30%改善し、テナント満足度を向上させるプラットフォーム。',
    targetCustomer: '大規模ビルオーナー、不動産管理会社',
    customerProblem: 'ビル管理コストの増大、カーボンニュートラル対応の圧力',
    proposedSolution: 'AI予測制御による空調・照明の最適化、故障予測による予防保全',
    revenueModel: 'SaaS月額課金＋省エネ成果報酬',
    estimatedRevenue: 2500000000, // 25億円
    marketSize: '国内スマートビル市場3000億円',
    competitors: ['日立ビルシステム', 'Johnson Controls'],
    implementation: {
      difficulty: 'medium' as const,
      timeframe: '18ヶ月',
      requiredResources: ['AIエンジニア10名', '初期投資3億円'],
    },
  },
  {
    id: 'idea-2',
    title: '丸の内イノベーションエコシステム構築サービス',
    description: '丸の内の3000社のテナント企業とスタートアップをマッチング。FINOLAB、xLINK等の施設を活用した実証実験支援。',
    targetCustomer: '大手企業のイノベーション部門',
    customerProblem: 'イノベーションの内製化の限界、スタートアップとの接点不足',
    proposedSolution: 'AIマッチングシステム、実証実験スペース提供、メンタリング支援',
    revenueModel: '年会費制＋マッチング成功報酬',
    estimatedRevenue: 1200000000, // 12億円
    marketSize: 'オープンイノベーション市場800億円',
    competitors: ['Plug and Play', 'アクセラレータープログラム各社'],
    implementation: {
      difficulty: 'low' as const,
      timeframe: '6ヶ月',
      requiredResources: ['プログラムマネージャー5名', '初期投資1億円'],
    },
  },
];

// モック評価結果を生成
function generateMockEvaluation(idea: BusinessIdea, index: number) {
  // 市場スコアの計算（モック）
  const marketSize = idea.estimatedRevenue! >= 2000000000 ? 18 : 
                     idea.estimatedRevenue! >= 1000000000 ? 15 : 10;
  const growthPotential = idea.description.includes('AI') ? 14 : 10;
  const profitability = idea.estimatedRevenue! >= 2000000000 ? 15 : 
                       idea.estimatedRevenue! >= 1000000000 ? 12 : 8;
  
  // シナジースコアの計算（モック）
  const capabilityMatch = idea.description.includes('丸の内') ? 18 : 14;
  const synergyEffect = idea.description.includes('3000社') || idea.description.includes('30棟') ? 14 : 10;
  const uniqueAdvantage = idea.description.includes('FINOLAB') || idea.description.includes('xLINK') ? 13 : 10;
  
  return {
    ideaId: idea.id,
    ideaTitle: idea.title,
    marketScore: {
      total: marketSize + growthPotential + profitability,
      breakdown: {
        marketSize,
        growthPotential,
        profitability,
      },
      reasoning: `市場規模${idea.marketSize}で高い成長性が期待できる。営業利益${(idea.estimatedRevenue! / 100000000).toFixed(0)}億円は三菱地所の目標を上回る。`,
      evidence: [
        `市場規模: ${idea.marketSize}`,
        `想定営業利益: ${(idea.estimatedRevenue! / 100000000).toFixed(0)}億円`,
        idea.description.includes('AI') ? 'AI/DX関連で高成長期待' : '安定的な市場成長',
        'カーボンニュートラル需要の拡大',
      ],
    },
    synergyScore: {
      total: capabilityMatch + synergyEffect + uniqueAdvantage,
      breakdown: {
        capabilityMatch,
        synergyEffect,
        uniqueAdvantage,
      },
      capabilityMapping: {
        requiredCapabilities: [
          {
            name: '不動産運営ノウハウ',
            importance: 'critical' as const,
            description: 'ビル管理・運営の専門知識が必要',
          },
          {
            name: 'テナントネットワーク',
            importance: 'important' as const,
            description: '既存テナントとの関係性を活用',
          },
          {
            name: 'デジタル技術',
            importance: 'important' as const,
            description: 'AI/IoT技術の導入と運用',
          },
        ],
        mitsubishiCapabilities: [
          {
            category: 'real_estate_development' as const,
            name: '大規模ビル運営',
            description: '丸の内30棟の運営実績を活用',
            specificAssets: ['丸の内ビルディング', '新丸の内ビルディング', 'JPタワー'],
          },
          {
            category: 'operations' as const,
            name: 'テナント管理',
            description: '3000社のテナント企業との関係性',
            specificAssets: ['テナント企業3000社', '就業者28万人'],
          },
          idea.description.includes('FINOLAB') ? {
            category: 'innovation' as const,
            name: 'イノベーション拠点',
            description: 'FINOLAB、xLINKの運営ノウハウ',
            specificAssets: ['FINOLAB', 'xLINK', 'Inspired.Lab'],
          } : {
            category: 'innovation' as const,
            name: 'DX推進',
            description: '丸の内データコンソーシアムの知見',
            specificAssets: ['スマートシティ推進', 'ビッグデータ活用'],
          },
        ],
        matchScore: 85,
        gaps: idea.description.includes('AI') ? ['AI技術者の確保が課題'] : [],
      },
      synergyScenario: {
        scenario: `三菱地所の${idea.description.includes('丸の内') ? '丸の内30棟' : '不動産運営'}の実績を活かし、${idea.description.includes('3000社') ? '既存テナント3000社' : 'テナントネットワーク'}を巻き込んだ事業展開が可能。${idea.description.includes('FINOLAB') ? 'FINOLAB等の既存施設' : '既存インフラ'}を活用することで、初期投資を抑えながら迅速な立ち上げが実現できる。`,
        keyAdvantages: [
          '丸の内エリアでの圧倒的な存在感',
          'テナント企業との既存の信頼関係',
          '不動産運営の深い知見とノウハウ',
          idea.description.includes('FINOLAB') ? 'イノベーション拠点の運営実績' : 'スマートシティ推進の先行実績',
        ],
        synergyMultiplier: 1.3,
      },
      scenarioValidation: {
        logicalConsistency: 88,
        feasibility: 85,
        uniqueness: 82,
        overallCredibility: 85,
        validationComments: [
          '既存アセットの活用により実現可能性が高い',
          'テナント企業のニーズと合致している',
          '他社には模倣困難な独自の優位性がある',
        ],
      },
      reasoning: '三菱地所の既存ケイパビリティと高い親和性があり、丸の内エリアの強みを最大限活用できる。',
    },
    totalScore: (marketSize + growthPotential + profitability) + (capabilityMatch + synergyEffect + uniqueAdvantage),
    rank: index + 1,
    recommendation: '強く推奨: 市場性・シナジー共に優れており、早期の事業化検討を推奨',
    risks: [
      '初期投資の回収期間が長い可能性',
      '競合他社の参入による価格競争',
      idea.description.includes('AI') ? 'AI技術者の採用・育成コスト' : '人材確保の課題',
    ],
    opportunities: [
      'ESG投資の拡大による需要増',
      '政府のDX推進政策による後押し',
      '海外展開の可能性',
    ],
  };
}

// 詳細な出力を表示
function displayResults(output: any) {
  console.log('\n' + '='.repeat(80));
  console.log('📊 CRITIC AGENT - モック評価結果（詳細版）');
  console.log('='.repeat(80) + '\n');

  output.evaluationResults.forEach((result: any, index: number) => {
    console.log(`\n${'─'.repeat(70)}`);
    console.log(`📝 アイデア ${index + 1}: ${result.ideaTitle}`);
    console.log(`${'─'.repeat(70)}`);
    
    console.log('\n🎯 総合スコア:', `${result.totalScore}/100点`);
    
    // 市場評価
    console.log('\n📈 市場評価:', `${result.marketScore.total}/50点`);
    console.log('  内訳:');
    console.log(`    - 市場規模: ${result.marketScore.breakdown.marketSize}/20点`);
    console.log(`    - 成長性: ${result.marketScore.breakdown.growthPotential}/15点`);
    console.log(`    - 収益性: ${result.marketScore.breakdown.profitability}/15点`);
    console.log('  評価理由:', result.marketScore.reasoning);
    console.log('  エビデンス:');
    result.marketScore.evidence.forEach((e: string) => console.log(`    • ${e}`));
    
    // シナジー評価
    console.log('\n🤝 シナジー評価:', `${result.synergyScore.total}/50点`);
    console.log('  内訳:');
    console.log(`    - ケイパビリティマッチ: ${result.synergyScore.breakdown.capabilityMatch}/20点`);
    console.log(`    - シナジー効果: ${result.synergyScore.breakdown.synergyEffect}/15点`);
    console.log(`    - 独自優位性: ${result.synergyScore.breakdown.uniqueAdvantage}/15点`);
    
    // ケイパビリティマッピング
    console.log('\n🔧 ケイパビリティマッピング:');
    console.log(`  マッチスコア: ${result.synergyScore.capabilityMapping.matchScore}%`);
    console.log('  必要なケイパビリティ:');
    result.synergyScore.capabilityMapping.requiredCapabilities.forEach((cap: any) => {
      console.log(`    • ${cap.name} (${cap.importance}): ${cap.description}`);
    });
    console.log('  活用可能な三菱地所ケイパビリティ:');
    result.synergyScore.capabilityMapping.mitsubishiCapabilities.forEach((cap: any) => {
      console.log(`    • [${cap.category}] ${cap.name}: ${cap.description}`);
      if (cap.specificAssets) {
        console.log(`      資産: ${cap.specificAssets.join(', ')}`);
      }
    });
    if (result.synergyScore.capabilityMapping.gaps.length > 0) {
      console.log('  ギャップ:');
      result.synergyScore.capabilityMapping.gaps.forEach((gap: string) => {
        console.log(`    ⚠️ ${gap}`);
      });
    }
    
    // シナジーシナリオ
    console.log('\n📖 シナジーシナリオ:');
    console.log(`  ${result.synergyScore.synergyScenario.scenario}`);
    console.log('  主要な優位性:');
    result.synergyScore.synergyScenario.keyAdvantages.forEach((adv: string) => {
      console.log(`    ✓ ${adv}`);
    });
    console.log(`  シナジー乗数: ${result.synergyScore.synergyScenario.synergyMultiplier}倍`);
    
    // シナリオ検証
    console.log('\n✅ シナリオ検証:');
    const validation = result.synergyScore.scenarioValidation;
    console.log(`  - 論理的整合性: ${validation.logicalConsistency}%`);
    console.log(`  - 実現可能性: ${validation.feasibility}%`);
    console.log(`  - 独自性: ${validation.uniqueness}%`);
    console.log(`  - 総合的納得度: ${validation.overallCredibility}%`);
    console.log('  検証コメント:');
    validation.validationComments.forEach((comment: string) => {
      console.log(`    💬 ${comment}`);
    });
    
    // リスクと機会
    console.log('\n⚠️ リスク:');
    result.risks.forEach((risk: string) => console.log(`    • ${risk}`));
    console.log('\n💡 機会:');
    result.opportunities.forEach((opp: string) => console.log(`    • ${opp}`));
    
    console.log('\n📌 推奨事項:', result.recommendation);
  });
  
  // 最優秀アイデア
  console.log('\n' + '='.repeat(80));
  console.log('🏆 最優秀アイデア');
  console.log('='.repeat(80));
  console.log(`\n選定: 「${output.selectedIdea.ideaTitle}」`);
  console.log(`総合スコア: ${output.selectedIdea.totalScore}点`);
  console.log(`市場: ${output.selectedIdea.marketScore.total}点 / シナジー: ${output.selectedIdea.synergyScore.total}点`);
  console.log(`\nサマリー: ${output.summary}`);
}

// メイン実行
async function testMockDetailed() {
  console.log('🚀 Critic Agent Mock Test - Detailed Output\n');
  
  try {
    const criticAgent = new CriticAgent({
      marketWeight: 0.5,
      synergyWeight: 0.5,
      minimumTotalScore: 60,
    });
    
    // モック評価結果を生成
    const mockResults = testIdeas.map((idea, index) => generateMockEvaluation(idea, index));
    
    // ランキング
    mockResults.sort((a, b) => b.totalScore - a.totalScore);
    mockResults.forEach((r, i) => r.rank = i + 1);
    
    const output = {
      sessionId: 'test-mock-' + Date.now(),
      evaluationResults: mockResults,
      selectedIdea: mockResults[0],
      summary: `${mockResults[0].ideaTitle}が最高評価（${mockResults[0].totalScore}点）を獲得。市場規模と三菱地所シナジーの両面で優れた評価。特に丸の内エリアの既存アセット活用による独自優位性が高く評価された。`,
      metadata: {
        evaluationId: 'mock-eval-' + Date.now(),
        startTime: new Date(),
        endTime: new Date(),
        processingTime: 150,
        tokensUsed: 0,
        llmCalls: 0,
        cacheHits: 0,
        errors: [],
      },
    };
    
    displayResults(output);
    
    // JSON保存
    const fs = await import('fs/promises');
    const outputPath = `./debug-output/critic-mock-${Date.now()}.json`;
    await fs.mkdir('./debug-output', { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(output, null, 2));
    console.log(`\n💾 Output saved to: ${outputPath}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

if (require.main === module) {
  testMockDetailed();
}