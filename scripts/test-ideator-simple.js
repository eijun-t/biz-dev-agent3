#!/usr/bin/env node

/**
 * Ideator Agent 簡易テストスクリプト
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(80));
  log(title, colors.bright + colors.cyan);
  console.log('='.repeat(80));
}

function formatCurrency(amount) {
  if (amount >= 1000000000000) {
    return `${(amount / 1000000000000).toFixed(1)}兆円`;
  } else if (amount >= 100000000) {
    return `${(amount / 100000000).toFixed(1)}億円`;
  } else if (amount >= 10000) {
    return `${(amount / 10000).toFixed(0)}万円`;
  } else {
    return `${amount}円`;
  }
}

// モックデータ
const mockIdeas = [
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
    title: 'AI在庫最適化「在庫マスター」',
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
  },
  {
    id: 'idea-004',
    title: 'スマート契約管理AI',
    description: '契約書の作成から管理、更新までを自動化するAIプラットフォーム。法的リスクを最小化しながら、契約業務を90%効率化。',
    targetCustomers: ['法務部門', '中堅企業', 'フリーランス'],
    customerPains: ['契約管理の煩雑さ', '法的リスクの見落とし', '更新漏れ'],
    valueProposition: 'AIが契約リスクを自動検出、更新期限を自動通知',
    revenueModel: '月額サブスクリプション（3万円〜）',
    estimatedRevenue: 600000000,
    implementationDifficulty: 'medium',
    marketOpportunity: 'リーガルテック市場の成長と規制強化による需要増'
  },
  {
    id: 'idea-005',
    title: 'パーソナルAI栄養アドバイザー',
    description: '個人の健康データと食事履歴を分析し、最適な栄養バランスを提案するAIアプリ。生活習慣病の予防と健康寿命延伸に貢献。',
    targetCustomers: ['健康意識の高い個人', 'フィットネスジム', '企業の健康経営部門'],
    customerPains: ['栄養管理の難しさ', '健康維持のコスト', '継続的なモチベーション維持'],
    valueProposition: 'AIが24時間365日、パーソナライズされた健康アドバイスを提供',
    revenueModel: 'フリーミアムモデル（無料版＋プレミアム月額980円）',
    estimatedRevenue: 400000000,
    implementationDifficulty: 'low',
    marketOpportunity: 'ヘルスケア市場の拡大と予防医療への関心の高まり'
  }
];

function displayIdea(idea, index) {
  console.log(`\n${colors.bright}【アイデア ${index + 1}】${colors.reset}`);
  console.log(`${colors.green}タイトル:${colors.reset} ${idea.title}`);
  console.log(`${colors.blue}説明:${colors.reset}\n  ${idea.description}`);
  console.log(`${colors.yellow}ターゲット顧客:${colors.reset} ${idea.targetCustomers.join(', ')}`);
  console.log(`${colors.magenta}解決する課題:${colors.reset} ${idea.customerPains.join(', ')}`);
  console.log(`${colors.cyan}提供価値:${colors.reset}\n  ${idea.valueProposition}`);
  console.log(`収益モデル: ${idea.revenueModel}`);
  console.log(`推定営業利益: ${formatCurrency(idea.estimatedRevenue)}`);
  console.log(`実装難易度: ${getDifficultyLabel(idea.implementationDifficulty)}`);
  console.log(`市場機会:\n  ${idea.marketOpportunity}`);
  
  // 簡易評価
  const score = evaluateIdea(idea);
  console.log(`\n${colors.bright}【品質評価】${colors.reset}`);
  console.log(`総合スコア: ${score}/100 ${getScoreEmoji(score)}`);
  
  // 強み・弱みの分析
  const analysis = analyzeIdea(idea);
  if (analysis.strengths.length > 0) {
    console.log(`${colors.green}強み:${colors.reset}`);
    analysis.strengths.forEach(s => console.log(`  ✓ ${s}`));
  }
  if (analysis.weaknesses.length > 0) {
    console.log(`${colors.yellow}改善点:${colors.reset}`);
    analysis.weaknesses.forEach(w => console.log(`  ⚠ ${w}`));
  }
}

function getDifficultyLabel(difficulty) {
  const labels = {
    'low': '低（3-6ヶ月で実現可能）',
    'medium': '中（6-12ヶ月で実現可能）',
    'high': '高（12ヶ月以上必要）'
  };
  return labels[difficulty] || difficulty;
}

function getScoreEmoji(score) {
  if (score >= 90) return '🌟 素晴らしい！';
  if (score >= 80) return '⭐ 優秀';
  if (score >= 70) return '👍 良好';
  if (score >= 60) return '📈 改善余地あり';
  return '⚠️ 要検討';
}

function evaluateIdea(idea) {
  let score = 100;
  
  // 基本的な検証
  if (idea.description.length < 50) score -= 10;
  if (idea.targetCustomers.length < 2) score -= 5;
  if (idea.customerPains.length < 2) score -= 5;
  
  // 収益性評価
  if (idea.estimatedRevenue > 1000000000) score += 10;
  else if (idea.estimatedRevenue < 100000000) score -= 10;
  
  // 実現可能性評価
  if (idea.implementationDifficulty === 'low') score += 5;
  else if (idea.implementationDifficulty === 'high') score -= 5;
  
  return Math.max(0, Math.min(100, score));
}

function analyzeIdea(idea) {
  const strengths = [];
  const weaknesses = [];
  
  // 収益性分析
  if (idea.estimatedRevenue > 1000000000) {
    strengths.push('高い収益性（10億円以上）が期待できる');
  } else if (idea.estimatedRevenue < 500000000) {
    weaknesses.push('収益規模が限定的（5億円未満）');
  }
  
  // 実装難易度分析
  if (idea.implementationDifficulty === 'low') {
    strengths.push('短期間での実現が可能');
  } else if (idea.implementationDifficulty === 'high') {
    weaknesses.push('実装に長期間を要する');
  }
  
  // 市場適合性分析
  if (idea.targetCustomers.length >= 3) {
    strengths.push('幅広い顧客層にアプローチ可能');
  }
  
  if (idea.customerPains.length >= 3) {
    strengths.push('複数の顧客課題を同時に解決');
  }
  
  // SaaSモデルの評価
  if (idea.revenueModel.includes('SaaS') || idea.revenueModel.includes('月額')) {
    strengths.push('安定的な収益モデル（サブスクリプション）');
  }
  
  return { strengths, weaknesses };
}

function displaySummary(ideas) {
  logSection('生成結果サマリー');
  
  const totalRevenue = ideas.reduce((sum, idea) => sum + idea.estimatedRevenue, 0);
  const avgRevenue = totalRevenue / ideas.length;
  
  console.log(`生成アイデア数: ${ideas.length}個`);
  console.log(`合計推定営業利益: ${formatCurrency(totalRevenue)}`);
  console.log(`平均推定営業利益: ${formatCurrency(avgRevenue)}`);
  
  // 難易度別の分類
  const byDifficulty = {
    low: ideas.filter(i => i.implementationDifficulty === 'low').length,
    medium: ideas.filter(i => i.implementationDifficulty === 'medium').length,
    high: ideas.filter(i => i.implementationDifficulty === 'high').length
  };
  
  console.log('\n実装難易度の分布:');
  console.log(`  低: ${byDifficulty.low}個`);
  console.log(`  中: ${byDifficulty.medium}個`);
  console.log(`  高: ${byDifficulty.high}個`);
  
  // TOP3の推奨
  const sortedByScore = ideas
    .map(idea => ({ ...idea, score: evaluateIdea(idea) }))
    .sort((a, b) => b.score - a.score);
  
  console.log('\n📊 推奨TOP3:');
  sortedByScore.slice(0, 3).forEach((idea, index) => {
    console.log(`  ${index + 1}. ${idea.title} (スコア: ${idea.score}/100)`);
  });
}

// メイン実行
function main() {
  console.clear();
  log('🚀 Ideator Agent 出力デモンストレーション', colors.bright + colors.cyan);
  log('=' .repeat(80), colors.cyan);
  
  log('\n以下は、Ideator Agentが生成する典型的なビジネスアイデアの例です。', colors.yellow);
  log('実際の生成では、入力された市場調査データに基づいてカスタマイズされます。\n', colors.yellow);
  
  logSection('生成されたビジネスアイデア');
  
  // 各アイデアを表示
  mockIdeas.forEach((idea, index) => {
    displayIdea(idea, index);
  });
  
  // サマリー表示
  displaySummary(mockIdeas);
  
  // メトリクス情報（シミュレーション）
  logSection('パフォーマンスメトリクス（シミュレーション）');
  console.log('使用トークン数:');
  console.log('  • プロンプト: 1,500 トークン');
  console.log('  • 生成: 2,500 トークン');
  console.log('  • 合計: 4,000 トークン');
  console.log('推定コスト: $0.12 (GPT-4ベース)');
  console.log('処理時間: 3.2秒');
  
  log('\n✨ デモンストレーション完了', colors.bright + colors.green);
  log('実際のAPIでは、リアルタイムで市場データを分析し、より精度の高いアイデアを生成します。', colors.cyan);
}

// 実行
main();