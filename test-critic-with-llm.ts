/**
 * Critic Agent LLM Test Script
 * 実際のLLMを使用してCritic Agentの動作を確認
 */

import * as dotenv from 'dotenv';
import { CriticAgent } from './lib/agents/critic/critic-agent';
import { CriticInput, BusinessIdea } from './lib/types/critic';

// 環境変数の読み込み
dotenv.config({ path: '.env.local' });

// OpenAI APIキーの確認
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ Error: OPENAI_API_KEY is not set in .env.local');
  console.log('Please add your OpenAI API key to .env.local:');
  console.log('OPENAI_API_KEY=sk-...');
  process.exit(1);
}

// テスト用のビジネスアイデア（Ideatorからの想定出力）
const testIdeas: BusinessIdea[] = [
  {
    id: 'idea-1',
    title: 'AI駆動型スマートビルディング管理プラットフォーム',
    description: 'AIとIoTセンサーを活用して、丸の内エリア30棟のビル群を統合管理。エネルギー効率を30%改善し、テナント満足度を向上させるプラットフォーム。予測メンテナンスによりビル管理コストを20%削減。',
    targetCustomer: '大規模ビルオーナー、不動産管理会社、テナント企業の総務部門',
    customerProblem: 'ビル管理コストの増大、カーボンニュートラル対応の圧力、テナント満足度の低下、設備故障による機会損失',
    proposedSolution: 'AI予測制御による空調・照明の最適化、故障予測による予防保全、テナントアプリによる快適性向上、ESGレポート自動生成',
    revenueModel: 'SaaS月額課金（ビル規模に応じた従量制）＋省エネ成果報酬（削減額の20%）',
    estimatedRevenue: 2500000000, // 25億円
    marketSize: '国内スマートビル市場3000億円、年率15%成長',
    competitors: ['日立ビルシステム', 'Johnson Controls', '三菱電機ビルテクノサービス'],
    implementation: {
      difficulty: 'medium' as const,
      timeframe: '18ヶ月',
      requiredResources: ['AIエンジニア10名', 'IoT専門家5名', '初期投資3億円'],
    },
  },
  {
    id: 'idea-2',
    title: '丸の内イノベーションエコシステム構築サービス',
    description: '丸の内の3000社のテナント企業とスタートアップをマッチング。FINOLAB、xLINK等の施設を活用した実証実験支援とオープンイノベーション促進プラットフォーム。',
    targetCustomer: '大手企業のイノベーション部門、R&D部門、新規事業開発部門',
    customerProblem: 'イノベーションの内製化の限界、スタートアップとの接点不足、実証実験場所の確保困難、協業ノウハウ不足',
    proposedSolution: 'AIマッチングシステム、実証実験スペース提供、メンタリング支援、三菱グループネットワーク活用',
    revenueModel: '年会費制（企業規模別）＋マッチング成功報酬＋実証実験場所利用料',
    estimatedRevenue: 1200000000, // 12億円
    marketSize: 'オープンイノベーション市場800億円',
    competitors: ['Plug and Play', 'アクセラレータープログラム各社', 'CVC'],
    implementation: {
      difficulty: 'low' as const,
      timeframe: '6ヶ月',
      requiredResources: ['プログラムマネージャー5名', 'コミュニティマネージャー3名', '初期投資1億円'],
    },
  },
  {
    id: 'idea-3',
    title: '不動産DXコンサルティング＆REIT組成支援',
    description: '中小ビルオーナー向けDX化支援とREIT組成アドバイザリー。三菱地所の不動産運営ノウハウとREIT運用実績（資産規模2.6兆円）を活用したトータルソリューション。',
    targetCustomer: '中小規模ビルオーナー、地方不動産会社、ファミリーオフィス',
    customerProblem: 'デジタル化の遅れ、資産価値向上手段の不足、流動性の欠如、事業承継問題',
    proposedSolution: 'DX導入支援、資産価値向上コンサル、REIT組成アドバイザリー、M&A仲介',
    revenueModel: 'コンサルティングフィー＋成功報酬（REIT組成時の資産額の1-2%）',
    estimatedRevenue: 1800000000, // 18億円
    marketSize: '不動産コンサル市場2000億円、REIT市場20兆円',
    implementation: {
      difficulty: 'medium' as const,
      timeframe: '12ヶ月',
      requiredResources: ['不動産コンサルタント10名', 'DX専門家5名', '初期投資2億円'],
    },
  },
];

// 詳細な出力を表示する関数
function displayDetailedResults(output: any) {
  console.log('\n' + '='.repeat(80));
  console.log('📊 CRITIC AGENT - 詳細評価結果');
  console.log('='.repeat(80) + '\n');

  // 各アイデアの詳細評価
  output.evaluationResults.forEach((result: any, index: number) => {
    console.log(`\n${'─'.repeat(70)}`);
    console.log(`📝 アイデア ${index + 1}: ${result.ideaTitle}`);
    console.log(`${'─'.repeat(70)}`);
    
    console.log('\n🎯 総合スコア:', `${result.totalScore}/100点`);
    
    // 市場評価の詳細
    console.log('\n📈 市場評価:', `${result.marketScore.total}/50点`);
    console.log('  内訳:');
    console.log(`    - 市場規模: ${result.marketScore.breakdown.marketSize}/20点`);
    console.log(`    - 成長性: ${result.marketScore.breakdown.growthPotential}/15点`);
    console.log(`    - 収益性: ${result.marketScore.breakdown.profitability}/15点`);
    console.log('  評価理由:', result.marketScore.reasoning);
    console.log('  エビデンス:');
    result.marketScore.evidence.forEach((e: string) => {
      console.log(`    • ${e}`);
    });
    
    // シナジー評価の詳細
    console.log('\n🤝 シナジー評価:', `${result.synergyScore.total}/50点`);
    console.log('  内訳:');
    console.log(`    - ケイパビリティマッチ: ${result.synergyScore.breakdown.capabilityMatch}/20点`);
    console.log(`    - シナジー効果: ${result.synergyScore.breakdown.synergyEffect}/15点`);
    console.log(`    - 独自優位性: ${result.synergyScore.breakdown.uniqueAdvantage}/15点`);
    console.log('  評価理由:', result.synergyScore.reasoning);
    
    // ケイパビリティマッピング
    console.log('\n🔧 ケイパビリティマッピング:');
    console.log(`  マッチスコア: ${result.synergyScore.capabilityMapping.matchScore}%`);
    if (result.synergyScore.capabilityMapping.requiredCapabilities.length > 0) {
      console.log('  必要なケイパビリティ:');
      result.synergyScore.capabilityMapping.requiredCapabilities.forEach((cap: any) => {
        console.log(`    • ${cap.name} (${cap.importance}): ${cap.description}`);
      });
    }
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
    if (validation.validationComments.length > 0) {
      console.log('  検証コメント:');
      validation.validationComments.forEach((comment: string) => {
        console.log(`    💬 ${comment}`);
      });
    }
    
    // リスクと機会
    if (result.risks && result.risks.length > 0) {
      console.log('\n⚠️ リスク:');
      result.risks.forEach((risk: string) => {
        console.log(`    • ${risk}`);
      });
    }
    if (result.opportunities && result.opportunities.length > 0) {
      console.log('\n💡 機会:');
      result.opportunities.forEach((opp: string) => {
        console.log(`    • ${opp}`);
      });
    }
    
    console.log('\n📌 推奨事項:', result.recommendation);
  });
  
  // 最優秀アイデア
  console.log('\n' + '='.repeat(80));
  console.log('🏆 最優秀アイデア');
  console.log('='.repeat(80));
  console.log(`\n選定アイデア: 「${output.selectedIdea.ideaTitle}」`);
  console.log(`総合スコア: ${output.selectedIdea.totalScore}点`);
  console.log(`\n${output.summary}`);
  
  // メタデータ
  console.log('\n' + '='.repeat(80));
  console.log('📊 処理統計');
  console.log('='.repeat(80));
  console.log(`評価ID: ${output.metadata.evaluationId}`);
  console.log(`処理時間: ${output.metadata.processingTime}ms`);
  console.log(`トークン使用量: ${output.metadata.tokensUsed}`);
  console.log(`LLM呼び出し回数: ${output.metadata.llmCalls}`);
  if (output.metadata.errors.length > 0) {
    console.log(`エラー: ${output.metadata.errors.join(', ')}`);
  }
}

// メイン実行関数
async function testCriticWithLLM() {
  console.log('🚀 Starting Critic Agent Test with Real LLM\n');
  console.log('⚠️  Note: This will make actual OpenAI API calls and consume tokens.\n');
  
  try {
    // Critic Agentの作成
    const criticAgent = new CriticAgent({
      marketWeight: 0.5,
      synergyWeight: 0.5,
      minimumTotalScore: 60,
      temperature: 0.3,
      maxRetries: 2,
    });
    
    // 入力データの準備
    const input: CriticInput = {
      sessionId: 'test-session-' + Date.now(),
      ideas: testIdeas.slice(0, 2), // まず2つのアイデアでテスト（コスト削減）
      evaluationConfig: {
        marketWeight: 0.5,
        synergyWeight: 0.5,
      },
    };
    
    console.log(`📝 Evaluating ${input.ideas.length} business ideas:`);
    input.ideas.forEach((idea, i) => {
      console.log(`  ${i + 1}. ${idea.title}`);
    });
    console.log('\n🔄 Processing... (this may take 10-30 seconds)\n');
    
    // 実際の評価を実行
    const startTime = Date.now();
    const output = await criticAgent.execute(input);
    const endTime = Date.now();
    
    console.log(`✅ Evaluation completed in ${endTime - startTime}ms\n`);
    
    // 詳細結果の表示
    displayDetailedResults(output);
    
    // JSON出力をファイルに保存（詳細確認用）
    const fs = await import('fs/promises');
    const outputPath = `./debug-output/critic-evaluation-${Date.now()}.json`;
    await fs.mkdir('./debug-output', { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(output, null, 2));
    console.log(`\n💾 Full output saved to: ${outputPath}`);
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('401')) {
        console.error('\n⚠️  Authentication Error: Please check your OPENAI_API_KEY');
      } else if (error.message.includes('429')) {
        console.error('\n⚠️  Rate Limit Error: Too many requests. Please wait and try again.');
      } else if (error.message.includes('timeout')) {
        console.error('\n⚠️  Timeout Error: The evaluation took too long. Try with fewer ideas.');
      }
    }
    
    process.exit(1);
  }
}

// スクリプト実行
if (require.main === module) {
  testCriticWithLLM()
    .then(() => {
      console.log('\n✨ Test completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}