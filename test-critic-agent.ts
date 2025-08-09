/**
 * Critic Agent Test Script
 * Criticエージェントの動作確認スクリプト
 */

import { createCriticAgent } from './lib/agents/critic/critic-agent';
import { CriticInput, BusinessIdea } from './lib/types/critic';

// テスト用のビジネスアイデア
const testIdeas: BusinessIdea[] = [
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
      difficulty: 'medium' as const,
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
      difficulty: 'low' as const,
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
      difficulty: 'medium' as const,
      timeframe: '12ヶ月',
      requiredResources: ['コンサルタント10名', '初期投資1億円'],
    },
  },
  {
    id: 'idea-4',
    title: 'グリーンビルディング認証支援サービス',
    description: 'LEED、CASBEEなどの環境認証取得を支援し、ESG投資を呼び込む',
    targetCustomer: 'ESG重視のビルオーナー、機関投資家',
    customerProblem: '環境認証取得の複雑さとコスト',
    proposedSolution: 'ワンストップ認証取得支援とグリーン改修提案',
    revenueModel: '認証取得支援フィー＋改修工事マージン',
    estimatedRevenue: 1200000000, // 12億円
    marketSize: 'グリーンビル市場5000億円',
    competitors: ['大手ゼネコン', '環境コンサル'],
  },
  {
    id: 'idea-5',
    title: 'ワークプレイス最適化AI',
    description: 'オフィス利用データを分析し、ハイブリッドワークに最適な空間設計を提案',
    targetCustomer: 'ハイブリッドワーク導入企業',
    customerProblem: 'オフィス稼働率の低下と従業員エンゲージメント',
    proposedSolution: 'AIによる最適レイアウト提案と柔軟な契約形態',
    revenueModel: 'サブスクリプション＋レイアウト変更工事',
    estimatedRevenue: 1800000000, // 18億円
    marketSize: 'ワークプレイス市場1兆円',
    implementation: {
      difficulty: 'high' as const,
      timeframe: '24ヶ月',
      requiredResources: ['データサイエンティスト8名', '初期投資2億円'],
    },
  },
];

async function testCriticAgent() {
  console.log('=== Critic Agent Test Start ===\n');

  try {
    // Criticエージェントの作成
    const criticAgent = createCriticAgent({
      marketWeight: 0.5,
      synergyWeight: 0.5,
      minimumTotalScore: 60,
      temperature: 0.3,
    });

    // エージェントステータスの確認
    const status = await criticAgent.getStatus();
    console.log('Agent Status:', status);
    console.log('');

    // テスト入力の作成
    const input: CriticInput = {
      sessionId: 'test-session-001',
      ideas: testIdeas,
      evaluationConfig: {
        marketWeight: 0.5,
        synergyWeight: 0.5,
      },
    };

    console.log(`Evaluating ${input.ideas.length} business ideas...`);
    console.log('Ideas:');
    input.ideas.forEach((idea, index) => {
      console.log(`  ${index + 1}. ${idea.title}`);
    });
    console.log('');

    // モック評価の実行（実際のLLM呼び出しは行わない）
    console.log('Running mock evaluation...');
    const output = await criticAgent.mockEvaluate(input);

    // 結果の表示
    console.log('\n=== Evaluation Results ===\n');
    
    output.evaluationResults.forEach((result) => {
      console.log(`📊 ${result.ideaTitle}`);
      console.log(`   Total Score: ${result.totalScore}/100`);
      console.log(`   - Market Score: ${result.marketScore.total}/50`);
      console.log(`     (Size: ${result.marketScore.breakdown.marketSize}, Growth: ${result.marketScore.breakdown.growthPotential}, Profit: ${result.marketScore.breakdown.profitability})`);
      console.log(`   - Synergy Score: ${result.synergyScore.total}/50`);
      console.log(`     (Match: ${result.synergyScore.breakdown.capabilityMatch}, Effect: ${result.synergyScore.breakdown.synergyEffect}, Unique: ${result.synergyScore.breakdown.uniqueAdvantage})`);
      console.log(`   Recommendation: ${result.recommendation}`);
      console.log('');
    });

    console.log('=== Selected Best Idea ===\n');
    console.log(`🏆 Winner: ${output.selectedIdea.ideaTitle}`);
    console.log(`   Total Score: ${output.selectedIdea.totalScore}/100`);
    console.log(`   ${output.summary}`);
    console.log('');

    console.log('=== Metadata ===');
    console.log(`Processing Time: ${output.metadata.processingTime}ms`);
    console.log(`Tokens Used: ${output.metadata.tokensUsed}`);
    console.log(`LLM Calls: ${output.metadata.llmCalls}`);
    console.log(`Cache Hits: ${output.metadata.cacheHits}`);
    
    if (output.metadata.errors.length > 0) {
      console.log(`Errors: ${output.metadata.errors.join(', ')}`);
    }

    console.log('\n=== Test Completed Successfully ===');

  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

// メイン実行
if (require.main === module) {
  testCriticAgent().catch(console.error);
}