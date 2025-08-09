/**
 * Critic Agent Standalone Test
 * 詳細な評価結果を表示するスタンドアロンテスト
 */

// テスト用のビジネスアイデア
const testIdeas = [
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
      difficulty: 'medium',
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
      difficulty: 'low',
      timeframe: '6ヶ月',
      requiredResources: ['プログラムマネージャー5名', '初期投資1億円'],
    },
  },
  {
    id: 'idea-3',
    title: 'グリーンビルディング認証・ESG投資支援サービス',
    description: 'LEED、CASBEE等の環境認証取得支援とESG投資呼び込み。三菱地所のRE100実績と2050年ネットゼロ目標のノウハウを活用。',
    targetCustomer: 'ESG重視のビルオーナー、機関投資家、REIT',
    customerProblem: '環境認証取得の複雑さ、ESG対応の遅れ、投資家からの圧力',
    proposedSolution: 'ワンストップ認証取得支援、グリーン改修提案、ESGレポート作成',
    revenueModel: '認証取得支援フィー＋改修工事マージン＋継続コンサル',
    estimatedRevenue: 1800000000, // 18億円
    marketSize: 'グリーンビル市場5000億円、ESG投資200兆円',
    competitors: ['大手ゼネコン', '環境コンサル会社'],
    implementation: {
      difficulty: 'medium',
      timeframe: '12ヶ月',
      requiredResources: ['環境コンサルタント8名', '初期投資1.5億円'],
    },
  },
];

// 市場評価の詳細生成
function generateMarketEvaluation(idea) {
  const revenue = idea.estimatedRevenue || 0;
  
  // 市場規模スコア（0-20点）
  let marketSize = 10;
  if (idea.marketSize.includes('兆') || idea.marketSize.includes('5000億')) {
    marketSize = 18;
  } else if (idea.marketSize.includes('3000億')) {
    marketSize = 16;
  } else if (idea.marketSize.includes('1000億') || idea.marketSize.includes('2000億')) {
    marketSize = 14;
  } else if (idea.marketSize.includes('800億')) {
    marketSize = 12;
  }
  
  // 成長性スコア（0-15点）
  let growthPotential = 10;
  if (idea.description.includes('AI') || idea.description.includes('DX')) {
    growthPotential = 14;
  } else if (idea.description.includes('ESG') || idea.description.includes('グリーン')) {
    growthPotential = 13;
  } else if (idea.description.includes('イノベーション')) {
    growthPotential = 11;
  }
  
  // 収益性スコア（0-15点）- 営業利益10億円以上を重視
  let profitability = 8;
  if (revenue >= 2000000000) { // 20億円以上
    profitability = 15;
  } else if (revenue >= 1500000000) { // 15億円以上
    profitability = 13;
  } else if (revenue >= 1000000000) { // 10億円以上
    profitability = 11;
  }
  
  return {
    total: marketSize + growthPotential + profitability,
    breakdown: {
      marketSize,
      growthPotential,
      profitability,
    },
    reasoning: `市場規模${idea.marketSize}で${growthPotential >= 13 ? '高い' : '安定的な'}成長性が期待できる。営業利益${(revenue / 100000000).toFixed(0)}億円は三菱地所の目標${revenue >= 1000000000 ? 'を上回る' : 'に近い'}水準。`,
    evidence: [
      `市場規模: ${idea.marketSize}`,
      `想定営業利益: ${(revenue / 100000000).toFixed(0)}億円`,
      idea.description.includes('AI') ? 'AI/DX関連で高成長期待' : 
      idea.description.includes('ESG') ? 'ESG投資の急拡大で需要増' :
      '安定的な市場成長',
      revenue >= 1000000000 ? '営業利益10億円以上を達成可能' : '収益性改善の余地あり',
    ],
  };
}

// シナジー評価の詳細生成
function generateSynergyEvaluation(idea) {
  // ケイパビリティマッチ（0-20点）
  let capabilityMatch = 12;
  if (idea.description.includes('丸の内') && idea.description.includes('30棟')) {
    capabilityMatch = 19;
  } else if (idea.description.includes('丸の内') || idea.description.includes('3000社')) {
    capabilityMatch = 17;
  } else if (idea.description.includes('RE100') || idea.description.includes('ネットゼロ')) {
    capabilityMatch = 16;
  }
  
  // シナジー効果（0-15点）
  let synergyEffect = 10;
  if (idea.description.includes('3000社') || idea.description.includes('テナント企業')) {
    synergyEffect = 14;
  } else if (idea.description.includes('FINOLAB') || idea.description.includes('xLINK')) {
    synergyEffect = 13;
  } else if (idea.description.includes('REIT') || idea.description.includes('ESG投資')) {
    synergyEffect = 12;
  }
  
  // 独自優位性（0-15点）
  let uniqueAdvantage = 10;
  if (idea.description.includes('丸の内') && (idea.description.includes('30棟') || idea.description.includes('3000社'))) {
    uniqueAdvantage = 14;
  } else if (idea.description.includes('FINOLAB') || idea.description.includes('RE100')) {
    uniqueAdvantage = 12;
  }
  
  // ケイパビリティマッピング生成
  const requiredCapabilities = [];
  const mitsubishiCapabilities = [];
  
  if (idea.title.includes('ビル')) {
    requiredCapabilities.push({
      name: '不動産運営ノウハウ',
      importance: 'critical',
      description: 'ビル管理・運営の専門知識が必要',
    });
    mitsubishiCapabilities.push({
      category: 'real_estate_development',
      name: '大規模ビル運営',
      description: '丸の内30棟の運営実績を活用',
      specificAssets: ['丸の内ビルディング', '新丸の内ビルディング', 'JPタワー'],
    });
  }
  
  if (idea.description.includes('テナント') || idea.description.includes('企業')) {
    requiredCapabilities.push({
      name: 'テナントネットワーク',
      importance: 'important',
      description: '既存テナントとの関係性を活用',
    });
    mitsubishiCapabilities.push({
      category: 'operations',
      name: 'テナント管理',
      description: '3000社のテナント企業との関係性',
      specificAssets: ['テナント企業3000社', '就業者28万人'],
    });
  }
  
  if (idea.description.includes('AI') || idea.description.includes('DX')) {
    requiredCapabilities.push({
      name: 'デジタル技術',
      importance: 'important',
      description: 'AI/IoT技術の導入と運用',
    });
  }
  
  if (idea.description.includes('FINOLAB') || idea.description.includes('イノベーション')) {
    mitsubishiCapabilities.push({
      category: 'innovation',
      name: 'イノベーション拠点',
      description: 'FINOLAB、xLINK等の運営ノウハウ',
      specificAssets: ['FINOLAB', 'xLINK', 'Inspired.Lab', 'TMIP'],
    });
  }
  
  if (idea.description.includes('ESG') || idea.description.includes('グリーン')) {
    mitsubishiCapabilities.push({
      category: 'innovation',
      name: '脱炭素・サステナビリティ',
      description: 'RE100、2050年ネットゼロ目標の実績',
      specificAssets: ['RE100対応', 'ZEB開発', 'グリーンビル認証'],
    });
  }
  
  // シナジーシナリオ生成
  let scenario = '';
  let keyAdvantages = [];
  
  if (idea.description.includes('丸の内')) {
    scenario = `三菱地所の丸の内エリア30棟のビル群を実証フィールドとして活用し、`;
    keyAdvantages.push('丸の内エリアでの圧倒的な存在感と信頼性');
  } else {
    scenario = `三菱地所の不動産運営ノウハウと`;
  }
  
  if (idea.description.includes('3000社')) {
    scenario += `既存テナント3000社のネットワークを最大限活用。`;
    keyAdvantages.push('3000社のテナント企業への直接アクセス');
  }
  
  if (idea.description.includes('FINOLAB')) {
    scenario += `FINOLAB等のイノベーション拠点での実績を基に、スタートアップエコシステムを構築。`;
    keyAdvantages.push('イノベーション拠点の運営実績と知見');
  }
  
  if (idea.description.includes('ESG')) {
    scenario += `RE100達成と2050年ネットゼロ目標の先進的取り組みを活かし、業界をリード。`;
    keyAdvantages.push('ESG/脱炭素分野での先進的実績');
  }
  
  scenario += `初期投資を抑えながら迅速な事業立ち上げが可能。他社には模倣困難な独自のポジションを確立。`;
  
  keyAdvantages.push('不動産運営の深い知見とノウハウ');
  keyAdvantages.push('三菱グループのシナジー効果');
  
  return {
    total: capabilityMatch + synergyEffect + uniqueAdvantage,
    breakdown: {
      capabilityMatch,
      synergyEffect,
      uniqueAdvantage,
    },
    capabilityMapping: {
      requiredCapabilities,
      mitsubishiCapabilities,
      matchScore: 75 + Math.floor(capabilityMatch * 1.25),
      gaps: idea.description.includes('AI') ? ['AI技術者の確保が課題'] : [],
    },
    synergyScenario: {
      scenario,
      keyAdvantages,
      synergyMultiplier: 1.2 + (uniqueAdvantage / 50),
    },
    scenarioValidation: {
      logicalConsistency: 85 + Math.floor(capabilityMatch * 0.5),
      feasibility: 80 + Math.floor(synergyEffect * 0.5),
      uniqueness: 75 + Math.floor(uniqueAdvantage * 0.8),
      overallCredibility: 82 + Math.floor((capabilityMatch + synergyEffect + uniqueAdvantage) * 0.3),
      validationComments: [
        '既存アセットの活用により実現可能性が高い',
        capabilityMatch >= 17 ? '三菱地所の強みと完全に合致' : 'ケイパビリティの補強により実現可能',
        uniqueAdvantage >= 12 ? '他社には模倣困難な独自の優位性を確立' : '差別化要素の強化が必要',
      ],
    },
    reasoning: `三菱地所の${capabilityMatch >= 17 ? '既存ケイパビリティと高い親和性' : 'ケイパビリティを活用可能'}。${keyAdvantages[0]}を最大限活用できる。`,
  };
}

// 詳細な結果表示
function displayDetailedResults(ideas) {
  console.log('\n' + '='.repeat(80));
  console.log('📊 CRITIC AGENT - ビジネスアイデア詳細評価');
  console.log('='.repeat(80));
  
  const results = [];
  
  ideas.forEach((idea, index) => {
    const marketScore = generateMarketEvaluation(idea);
    const synergyScore = generateSynergyEvaluation(idea);
    const totalScore = marketScore.total + synergyScore.total;
    
    results.push({
      idea,
      marketScore,
      synergyScore,
      totalScore,
    });
    
    console.log(`\n${'─'.repeat(70)}`);
    console.log(`📝 アイデア ${index + 1}: ${idea.title}`);
    console.log(`${'─'.repeat(70)}`);
    
    console.log(`\n📄 概要: ${idea.description}`);
    console.log(`👥 ターゲット: ${idea.targetCustomer}`);
    console.log(`❓ 解決する課題: ${idea.customerProblem}`);
    console.log(`💡 ソリューション: ${idea.proposedSolution}`);
    console.log(`💰 収益モデル: ${idea.revenueModel}`);
    
    console.log('\n🎯 総合スコア:', `${totalScore}/100点`);
    
    // 市場評価
    console.log('\n📈 市場評価:', `${marketScore.total}/50点`);
    console.log('  内訳:');
    console.log(`    - 市場規模: ${marketScore.breakdown.marketSize}/20点`);
    console.log(`    - 成長性: ${marketScore.breakdown.growthPotential}/15点`);
    console.log(`    - 収益性: ${marketScore.breakdown.profitability}/15点`);
    console.log('  評価理由:', marketScore.reasoning);
    console.log('  エビデンス:');
    marketScore.evidence.forEach(e => console.log(`    • ${e}`));
    
    // シナジー評価
    console.log('\n🤝 シナジー評価:', `${synergyScore.total}/50点`);
    console.log('  内訳:');
    console.log(`    - ケイパビリティマッチ: ${synergyScore.breakdown.capabilityMatch}/20点`);
    console.log(`    - シナジー効果: ${synergyScore.breakdown.synergyEffect}/15点`);
    console.log(`    - 独自優位性: ${synergyScore.breakdown.uniqueAdvantage}/15点`);
    console.log('  評価理由:', synergyScore.reasoning);
    
    // ケイパビリティマッピング
    console.log('\n🔧 ケイパビリティマッピング:');
    console.log(`  マッチスコア: ${synergyScore.capabilityMapping.matchScore}%`);
    
    if (synergyScore.capabilityMapping.requiredCapabilities.length > 0) {
      console.log('  必要なケイパビリティ:');
      synergyScore.capabilityMapping.requiredCapabilities.forEach(cap => {
        console.log(`    • ${cap.name} (${cap.importance}): ${cap.description}`);
      });
    }
    
    if (synergyScore.capabilityMapping.mitsubishiCapabilities.length > 0) {
      console.log('  活用可能な三菱地所ケイパビリティ:');
      synergyScore.capabilityMapping.mitsubishiCapabilities.forEach(cap => {
        console.log(`    • [${cap.category}] ${cap.name}: ${cap.description}`);
        if (cap.specificAssets) {
          console.log(`      資産: ${cap.specificAssets.join(', ')}`);
        }
      });
    }
    
    if (synergyScore.capabilityMapping.gaps.length > 0) {
      console.log('  ギャップ:');
      synergyScore.capabilityMapping.gaps.forEach(gap => {
        console.log(`    ⚠️ ${gap}`);
      });
    }
    
    // シナジーシナリオ
    console.log('\n📖 シナジーシナリオ:');
    console.log(`  ${synergyScore.synergyScenario.scenario}`);
    console.log('  主要な優位性:');
    synergyScore.synergyScenario.keyAdvantages.forEach(adv => {
      console.log(`    ✓ ${adv}`);
    });
    console.log(`  シナジー乗数: ${synergyScore.synergyScenario.synergyMultiplier.toFixed(2)}倍`);
    
    // シナリオ検証
    console.log('\n✅ シナリオ検証:');
    console.log(`  - 論理的整合性: ${synergyScore.scenarioValidation.logicalConsistency}%`);
    console.log(`  - 実現可能性: ${synergyScore.scenarioValidation.feasibility}%`);
    console.log(`  - 独自性: ${synergyScore.scenarioValidation.uniqueness}%`);
    console.log(`  - 総合的納得度: ${synergyScore.scenarioValidation.overallCredibility}%`);
    console.log('  検証コメント:');
    synergyScore.scenarioValidation.validationComments.forEach(comment => {
      console.log(`    💬 ${comment}`);
    });
    
    // 推奨事項
    let recommendation = '';
    if (totalScore >= 80) {
      recommendation = '強く推奨: 市場性・シナジー共に優れており、早期の事業化検討を推奨';
    } else if (totalScore >= 70) {
      recommendation = '推奨: 十分な事業ポテンシャルあり、詳細検討を推奨';
    } else if (totalScore >= 60) {
      recommendation = '条件付き推奨: 一部課題はあるが検討の価値あり';
    } else {
      recommendation = '要改善: 市場性またはシナジーの強化が必要';
    }
    console.log('\n📌 推奨事項:', recommendation);
  });
  
  // ランキングと最優秀アイデア
  results.sort((a, b) => b.totalScore - a.totalScore);
  
  console.log('\n' + '='.repeat(80));
  console.log('🏆 評価ランキング');
  console.log('='.repeat(80));
  
  results.forEach((r, i) => {
    console.log(`\n${i + 1}位: ${r.idea.title}`);
    console.log(`  総合スコア: ${r.totalScore}点 (市場: ${r.marketScore.total}点 / シナジー: ${r.synergyScore.total}点)`);
    console.log(`  想定営業利益: ${(r.idea.estimatedRevenue / 100000000).toFixed(0)}億円`);
  });
  
  const winner = results[0];
  console.log('\n' + '='.repeat(80));
  console.log('🥇 最優秀アイデア');
  console.log('='.repeat(80));
  console.log(`\n「${winner.idea.title}」が最高評価を獲得`);
  console.log(`\n総合評価: ${winner.totalScore}点`);
  console.log(`- 市場評価: ${winner.marketScore.total}点 (規模${winner.marketScore.breakdown.marketSize}点 + 成長${winner.marketScore.breakdown.growthPotential}点 + 収益${winner.marketScore.breakdown.profitability}点)`);
  console.log(`- シナジー: ${winner.synergyScore.total}点 (マッチ${winner.synergyScore.breakdown.capabilityMatch}点 + 効果${winner.synergyScore.breakdown.synergyEffect}点 + 優位性${winner.synergyScore.breakdown.uniqueAdvantage}点)`);
  console.log(`\nサマリー: ${winner.marketScore.reasoning} ${winner.synergyScore.reasoning}`);
  
  // 統計情報
  console.log('\n' + '='.repeat(80));
  console.log('📊 評価統計');
  console.log('='.repeat(80));
  const avgScore = results.reduce((sum, r) => sum + r.totalScore, 0) / results.length;
  const maxRevenue = Math.max(...results.map(r => r.idea.estimatedRevenue));
  const totalRevenue = results.reduce((sum, r) => sum + r.idea.estimatedRevenue, 0);
  
  console.log(`\n評価アイデア数: ${results.length}件`);
  console.log(`最高スコア: ${results[0].totalScore}点`);
  console.log(`最低スコア: ${results[results.length - 1].totalScore}点`);
  console.log(`平均スコア: ${avgScore.toFixed(1)}点`);
  console.log(`最大営業利益: ${(maxRevenue / 100000000).toFixed(0)}億円`);
  console.log(`合計営業利益: ${(totalRevenue / 100000000).toFixed(0)}億円`);
}

// 実行
console.log('🚀 Critic Agent Detailed Evaluation Test\n');
console.log('📋 評価対象アイデア:');
testIdeas.forEach((idea, i) => {
  console.log(`  ${i + 1}. ${idea.title}`);
});

displayDetailedResults(testIdeas);

console.log('\n✨ 評価完了\n');
console.log('💡 Note: これはモック評価です。実際のLLM評価では、より詳細で文脈に応じた分析が行われます。');