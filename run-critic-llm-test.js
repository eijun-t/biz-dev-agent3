/**
 * Run Critic Agent with Real LLM
 * 実際のOpenAI APIを使用したテスト
 */

const dotenv = require('dotenv');
const path = require('path');

// 環境変数の読み込み
dotenv.config({ path: '.env.local' });

// OpenAI APIキーの確認
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ Error: OPENAI_API_KEY is not set in .env.local');
  process.exit(1);
}

console.log('✅ OpenAI API Key is configured');
console.log('🚀 Starting Critic Agent Test with Real LLM\n');
console.log('⚠️  Note: This will make actual OpenAI API calls and consume tokens.\n');

// テスト用のビジネスアイデア（2つに限定してコスト削減）
const testIdeas = [
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
      difficulty: 'medium',
      timeframe: '18ヶ月',
      requiredResources: ['AIエンジニア10名', 'IoT専門家5名', '初期投資3億円'],
    },
  },
  {
    id: 'idea-2',
    title: 'グリーンビルディング認証・ESG投資支援サービス',
    description: 'LEED、CASBEE等の環境認証取得支援とESG投資呼び込み。三菱地所のRE100実績と2050年ネットゼロ目標のノウハウを活用し、ビルオーナーのESG対応を包括支援。',
    targetCustomer: 'ESG重視のビルオーナー、機関投資家、REIT運用会社',
    customerProblem: '環境認証取得の複雑さとコスト、ESG投資家からの圧力、グリーン改修の技術的ハードル',
    proposedSolution: 'ワンストップ認証取得支援、グリーン改修コンサル、ESGレポート作成、投資家マッチング',
    revenueModel: '認証取得支援フィー＋改修工事マージン＋継続ESGコンサルティング',
    estimatedRevenue: 1800000000, // 18億円
    marketSize: 'グリーンビル市場5000億円、ESG不動産投資200兆円',
    competitors: ['大手ゼネコン', '環境コンサルティング会社', 'サステナビリティ専門企業'],
    implementation: {
      difficulty: 'medium',
      timeframe: '12ヶ月',
      requiredResources: ['環境コンサルタント8名', 'エンジニア5名', '初期投資1.5億円'],
    },
  },
];

console.log(`📝 Evaluating ${testIdeas.length} business ideas:`);
testIdeas.forEach((idea, i) => {
  console.log(`  ${i + 1}. ${idea.title}`);
});

console.log('\n🔄 Processing with GPT-4... (this may take 10-30 seconds)\n');

// 簡易的なLLM呼び出しシミュレーション
// 注意: 実際のLLM統合にはCriticAgentクラスの正しいインポートが必要
async function simulateLLMEvaluation() {
  const { ChatOpenAI } = require('@langchain/openai');
  const { HumanMessage, SystemMessage } = require('@langchain/core/messages');
  
  const llm = new ChatOpenAI({
    modelName: 'gpt-4o',
    temperature: 0.3,
    maxTokens: 2000,
    apiKey: process.env.OPENAI_API_KEY,
  });

  console.log('📊 Calling OpenAI API for market evaluation...\n');

  for (const [index, idea] of testIdeas.entries()) {
    console.log(`\n${'─'.repeat(70)}`);
    console.log(`Evaluating Idea ${index + 1}: ${idea.title}`);
    console.log(`${'─'.repeat(70)}\n`);

    try {
      // 市場評価のプロンプト
      const marketSystemPrompt = `あなたは新規事業の市場性を評価する専門家です。
以下の基準で市場評価を行ってください：

1. 市場規模 (0-20点)
   - 10億円未満: 0-5点
   - 10-100億円: 6-10点
   - 100-1000億円: 11-15点
   - 1000億円以上: 16-20点

2. 成長性 (0-15点)
   - 縮小市場: 0-3点
   - 横ばい: 4-7点
   - 緩やかな成長: 8-11点
   - 急成長: 12-15点

3. 収益性 (0-15点)
   - 営業利益率5%未満: 0-5点
   - 営業利益率5-10%: 6-10点
   - 営業利益率10%以上: 11-15点
   - 特に10億円以上の営業利益が見込める場合は高得点

必ず合計50点満点で評価し、JSON形式で回答してください。`;

      const marketUserPrompt = `以下のビジネスアイデアを評価してください：

タイトル: ${idea.title}
説明: ${idea.description}
ターゲット顧客: ${idea.targetCustomer}
顧客の課題: ${idea.customerProblem}
提案する解決策: ${idea.proposedSolution}
収益モデル: ${idea.revenueModel}
想定年間営業利益: ${idea.estimatedRevenue}円
市場規模: ${idea.marketSize}

以下のJSON形式で回答してください：
{
  "marketScore": {
    "total": <合計点数0-50>,
    "breakdown": {
      "marketSize": <市場規模0-20>,
      "growthPotential": <成長性0-15>,
      "profitability": <収益性0-15>
    },
    "reasoning": "<評価の理由>",
    "evidence": ["<根拠1>", "<根拠2>", ...]
  },
  "risks": ["<リスク1>", "<リスク2>", ...],
  "opportunities": ["<機会1>", "<機会2>", ...],
  "recommendation": "<推奨事項>"
}`;

      console.log('🤖 Requesting market evaluation from GPT-4...');
      const marketResponse = await llm.invoke([
        new SystemMessage(marketSystemPrompt),
        new HumanMessage(marketUserPrompt),
      ]);

      const marketContent = marketResponse.content.toString();
      console.log('\n📈 Market Evaluation Response received');
      
      // JSONを抽出して表示
      const jsonMatch = marketContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const marketResult = JSON.parse(jsonMatch[0]);
          console.log('\n📊 Market Score:', marketResult.marketScore.total + '/50');
          console.log('  - Market Size:', marketResult.marketScore.breakdown.marketSize + '/20');
          console.log('  - Growth:', marketResult.marketScore.breakdown.growthPotential + '/15');
          console.log('  - Profitability:', marketResult.marketScore.breakdown.profitability + '/15');
          console.log('  Reasoning:', marketResult.marketScore.reasoning);
          
          // シナジー評価のプロンプト
          const synergySystemPrompt = `あなたは三菱地所のケイパビリティとビジネスアイデアの適合性を評価する専門家です。

三菱地所の主要ケイパビリティ：
1. 不動産開発・運営：丸の内30棟、テナント3000社、年間賃料5000億円
2. 施設運営：管理床面積900万㎡、プレミアムアウトレット9施設、空港運営
3. 金融・投資：日本ビルファンド（1.4兆円）、海外不動産投資
4. イノベーション：FINOLAB、xLINK、Inspired.Lab、スタートアップ投資100社以上

このビジネスが「三菱地所のケイパビリティを掛け合わせることによって他社がこの事業を行うよりも圧倒的に有利に進められる」シナリオを作成し、評価してください。`;

          const synergyUserPrompt = `${idea.title}について、三菱地所のケイパビリティを活用したシナジーシナリオを作成し、以下のJSON形式で回答してください：

{
  "scenario": "<具体的な実行シナリオ>",
  "keyAdvantages": ["<優位性1>", "<優位性2>", ...],
  "capabilityUtilization": {
    "realEstate": "<不動産開発の活用方法>",
    "operations": "<運営サービスの活用方法>", 
    "finance": "<金融・投資の活用方法>",
    "innovation": "<イノベーションの活用方法>"
  },
  "synergyScore": <0-50の合計スコア>,
  "feasibility": <実現可能性0-100>,
  "uniqueness": <独自性0-100>
}`;

          console.log('\n🤖 Requesting synergy evaluation from GPT-4...');
          const synergyResponse = await llm.invoke([
            new SystemMessage(synergySystemPrompt),
            new HumanMessage(synergyUserPrompt),
          ]);

          const synergyContent = synergyResponse.content.toString();
          console.log('🤝 Synergy Evaluation Response received');
          
          const synergyJsonMatch = synergyContent.match(/\{[\s\S]*\}/);
          if (synergyJsonMatch) {
            const synergyResult = JSON.parse(synergyJsonMatch[0]);
            console.log('\n🤝 Synergy Score:', (synergyResult.synergyScore || 40) + '/50');
            console.log('  Scenario:', synergyResult.scenario?.substring(0, 100) + '...');
            console.log('  Feasibility:', synergyResult.feasibility + '%');
            console.log('  Uniqueness:', synergyResult.uniqueness + '%');
            
            const totalScore = marketResult.marketScore.total + (synergyResult.synergyScore || 40);
            console.log('\n🎯 Total Score:', totalScore + '/100');
          }
        } catch (parseError) {
          console.error('JSON Parse Error:', parseError.message);
          console.log('Raw response:', marketContent.substring(0, 500));
        }
      }

    } catch (error) {
      console.error(`\n❌ Error evaluating idea ${index + 1}:`, error.message);
      if (error.message.includes('429')) {
        console.log('⚠️  Rate limit reached. Please wait before retrying.');
      }
    }

    // レート制限回避のため待機
    if (index < testIdeas.length - 1) {
      console.log('\n⏳ Waiting 2 seconds before next evaluation...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ Evaluation Complete');
  console.log('='.repeat(70));
}

// 実行
simulateLLMEvaluation().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});