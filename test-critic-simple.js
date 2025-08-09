/**
 * Simple Critic Agent Test
 * 簡単な動作確認用スクリプト
 */

// テスト用のビジネスアイデア
const testIdeas = [
  {
    id: 'idea-1',
    title: 'スマートビルディング管理プラットフォーム',
    description: 'AIとIoTを活用して丸の内エリアのビル群を統合管理し、エネルギー効率を30%改善するプラットフォーム',
    targetCustomer: 'ビルオーナー、テナント企業',
    customerProblem: 'ビル管理コストの増大とカーボンニュートラル対応の必要性',
    proposedSolution: 'AI予測制御によるエネルギー最適化とテナント満足度向上',
    revenueModel: 'SaaS月額課金＋省エネ成果報酬',
    estimatedRevenue: 2000000000, // 20億円
    marketSize: '国内スマートビル市場3000億円',
    competitors: ['日立ビルシステム', 'Johnson Controls'],
    implementation: {
      difficulty: 'medium',
      timeframe: '18ヶ月',
      requiredResources: ['エンジニア15名', '初期投資3億円'],
    },
  },
  {
    id: 'idea-2',
    title: 'テナント企業向けイノベーション支援サービス',
    description: '丸の内の3000社のテナント企業向けに、スタートアップとのマッチングと実証実験場所を提供',
    targetCustomer: '大手テナント企業のイノベーション部門',
    customerProblem: 'オープンイノベーションの推進と実証実験場所の確保',
    proposedSolution: 'FINOLABやxLINKを活用したマッチングと実証支援',
    revenueModel: '会員制年会費＋成果報酬',
    estimatedRevenue: 800000000, // 8億円
    marketSize: 'オープンイノベーション市場500億円',
    competitors: ['アクセラレータープログラム各社'],
    implementation: {
      difficulty: 'low',
      timeframe: '6ヶ月',
      requiredResources: ['コーディネーター5名', '初期投資5000万円'],
    },
  },
  {
    id: 'idea-3',
    title: '不動産DXコンサルティング',
    description: '中小ビルオーナー向けにDX化支援とREIT組成アドバイザリーを提供',
    targetCustomer: '中小規模ビルオーナー',
    customerProblem: 'デジタル化の遅れと資産価値向上の必要性',
    proposedSolution: '三菱地所のノウハウを活用したトータルソリューション',
    revenueModel: 'コンサルティングフィー＋成功報酬',
    estimatedRevenue: 1500000000, // 15億円
    marketSize: '不動産コンサル市場2000億円',
    implementation: {
      difficulty: 'medium',
      timeframe: '12ヶ月',
      requiredResources: ['コンサルタント10名', '初期投資1億円'],
    },
  },
];

// 簡単な評価ロジック
function evaluateIdeas(ideas) {
  console.log('=== Critic Agent Simulation ===\n');
  console.log(`評価対象: ${ideas.length}件のビジネスアイデア\n`);

  const results = ideas.map((idea, index) => {
    // 市場スコアの計算（簡易版）
    const marketSize = idea.estimatedRevenue >= 1500000000 ? 15 : 10;
    const growthPotential = idea.description.includes('AI') || idea.description.includes('DX') ? 12 : 8;
    const profitability = idea.estimatedRevenue >= 1000000000 ? 13 : 8;
    const marketScore = marketSize + growthPotential + profitability;

    // シナジースコアの計算（簡易版）
    const capabilityMatch = idea.description.includes('丸の内') || idea.description.includes('テナント') ? 18 : 12;
    const synergyEffect = idea.description.includes('三菱地所') ? 12 : 8;
    const uniqueAdvantage = idea.description.includes('3000社') || idea.description.includes('30棟') ? 13 : 9;
    const synergyScore = capabilityMatch + synergyEffect + uniqueAdvantage;

    const totalScore = marketScore + synergyScore;

    return {
      ideaId: idea.id,
      ideaTitle: idea.title,
      marketScore: {
        total: marketScore,
        breakdown: {
          marketSize,
          growthPotential,
          profitability,
        },
      },
      synergyScore: {
        total: synergyScore,
        breakdown: {
          capabilityMatch,
          synergyEffect,
          uniqueAdvantage,
        },
      },
      totalScore,
      estimatedRevenue: idea.estimatedRevenue,
    };
  });

  // ソートして順位付け
  results.sort((a, b) => b.totalScore - a.totalScore);

  // 結果表示
  console.log('📊 評価結果:\n');
  results.forEach((result, index) => {
    const rank = index + 1;
    console.log(`${rank}位: ${result.ideaTitle}`);
    console.log(`  総合スコア: ${result.totalScore}/100点`);
    console.log(`  - 市場スコア: ${result.marketScore.total}/50点`);
    console.log(`    (市場規模: ${result.marketScore.breakdown.marketSize}, 成長性: ${result.marketScore.breakdown.growthPotential}, 収益性: ${result.marketScore.breakdown.profitability})`);
    console.log(`  - シナジースコア: ${result.synergyScore.total}/50点`);
    console.log(`    (ケイパビリティ: ${result.synergyScore.breakdown.capabilityMatch}, 効果: ${result.synergyScore.breakdown.synergyEffect}, 優位性: ${result.synergyScore.breakdown.uniqueAdvantage})`);
    console.log(`  - 想定営業利益: ${(result.estimatedRevenue / 100000000).toFixed(1)}億円`);
    console.log('');
  });

  // 最優秀アイデア
  const winner = results[0];
  console.log('🏆 最優秀アイデア:');
  console.log(`  「${winner.ideaTitle}」`);
  console.log(`  総合評価: ${winner.totalScore}点`);
  
  // 推奨事項
  let recommendation = '';
  if (winner.totalScore >= 80) {
    recommendation = '強く推奨: 市場性・シナジー共に優れており、早期の事業化検討を推奨';
  } else if (winner.totalScore >= 70) {
    recommendation = '推奨: 十分な事業ポテンシャルあり、詳細検討を推奨';
  } else if (winner.totalScore >= 60) {
    recommendation = '条件付き推奨: 一部課題はあるが検討の価値あり';
  } else {
    recommendation = '要改善: 市場性またはシナジーの強化が必要';
  }
  console.log(`  推奨: ${recommendation}`);

  return {
    results,
    winner,
    recommendation,
  };
}

// 三菱地所ケイパビリティの確認
function showCapabilities() {
  console.log('\n📋 三菱地所の主要ケイパビリティ:\n');
  
  const capabilities = {
    '不動産開発・運営': [
      '丸の内エリア30棟のビル群',
      'テナント企業3000社（就業者28万人）',
      '年間賃料収入5000億円以上',
      'ロイヤルパークホテルズ',
    ],
    '施設運営・サービス': [
      '管理床面積900万㎡',
      'プレミアムアウトレット9施設',
      '空港運営（高松、福岡、北海道等）',
      'ロジクロス物流施設',
    ],
    '金融・投資': [
      '日本ビルファンド（資産規模1.4兆円）',
      'ジャパンリアルエステイト投資法人（1.2兆円）',
      '海外不動産投資（米国、アジア、欧州）',
    ],
    'イノベーション・新規事業': [
      'FINOLAB（フィンテック拠点）',
      'xLINK（ライフサイエンス拠点）',
      'Inspired.Lab（AI・ロボティクス）',
      'スタートアップ投資100社以上',
    ],
  };

  Object.entries(capabilities).forEach(([category, items]) => {
    console.log(`【${category}】`);
    items.forEach(item => console.log(`  • ${item}`));
    console.log('');
  });
}

// メイン実行
function main() {
  console.log('========================================');
  console.log('  Critic Agent - ビジネスアイデア評価');
  console.log('========================================\n');

  // ケイパビリティ表示
  showCapabilities();

  console.log('========================================\n');

  // 評価実行
  const evaluation = evaluateIdeas(testIdeas);

  console.log('\n========================================');
  console.log('  評価完了');
  console.log('========================================\n');

  // メタデータ
  console.log('📈 評価統計:');
  console.log(`  評価アイデア数: ${testIdeas.length}件`);
  console.log(`  最高スコア: ${evaluation.winner.totalScore}点`);
  console.log(`  最低スコア: ${evaluation.results[evaluation.results.length - 1].totalScore}点`);
  console.log(`  平均スコア: ${Math.round(evaluation.results.reduce((sum, r) => sum + r.totalScore, 0) / evaluation.results.length)}点`);
}

// 実行
main();