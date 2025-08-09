/**
 * Generate Real Critic Output with LLM
 * 実際のLLMを使用してCriticOutputを生成し、保存する
 */

const dotenv = require('dotenv');
const { ChatOpenAI } = require('@langchain/openai');
const { HumanMessage, SystemMessage } = require('@langchain/core/messages');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// 環境変数の読み込み
dotenv.config({ path: '.env.local' });

if (!process.env.OPENAI_API_KEY) {
  console.error('❌ Error: OPENAI_API_KEY is not set');
  process.exit(1);
}

// テスト用のビジネスアイデア（2つだけでコスト削減）
const testIdeas = [
  {
    id: 'idea-1',
    title: 'AI駆動型スマートビルディング管理プラットフォーム',
    description: 'AIとIoTセンサーを活用して、丸の内エリア30棟のビル群を統合管理。エネルギー効率を30%改善し、テナント満足度を向上させるプラットフォーム。',
    targetCustomer: '大規模ビルオーナー、不動産管理会社',
    customerProblem: 'ビル管理コストの増大、カーボンニュートラル対応の圧力',
    proposedSolution: 'AI予測制御による空調・照明の最適化、故障予測による予防保全',
    revenueModel: 'SaaS月額課金＋省エネ成果報酬',
    estimatedRevenue: 2500000000,
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
    proposedSolution: 'AIマッチングシステム、実証実験スペース提供',
    revenueModel: '年会費制＋マッチング成功報酬',
    estimatedRevenue: 1200000000,
    marketSize: 'オープンイノベーション市場800億円',
    competitors: ['Plug and Play'],
    implementation: {
      difficulty: 'low',
      timeframe: '6ヶ月',
      requiredResources: ['プログラムマネージャー5名'],
    },
  },
];

async function evaluateWithLLM(idea) {
  const llm = new ChatOpenAI({
    modelName: 'gpt-4o',
    temperature: 0.3,
    maxTokens: 2000,
    apiKey: process.env.OPENAI_API_KEY,
  });

  // 市場評価
  const marketPrompt = `以下のビジネスアイデアの市場評価を行ってください。
  
タイトル: ${idea.title}
説明: ${idea.description}
市場規模: ${idea.marketSize}
想定営業利益: ${idea.estimatedRevenue}円

評価基準:
- 市場規模(0-20点): 1000億円以上なら16-20点
- 成長性(0-15点): AI/DX関連なら12-15点
- 収益性(0-15点): 営業利益10億円以上なら11-15点

JSON形式で回答:
{
  "total": <合計0-50>,
  "breakdown": {
    "marketSize": <0-20>,
    "growthPotential": <0-15>,
    "profitability": <0-15>
  },
  "reasoning": "<理由>",
  "evidence": ["<根拠1>", "<根拠2>"],
  "risks": ["<リスク1>", "<リスク2>"],
  "opportunities": ["<機会1>", "<機会2>"]
}`;

  console.log(`📊 Evaluating: ${idea.title}`);
  
  const marketResponse = await llm.invoke([
    new SystemMessage('あなたは新規事業の市場評価専門家です。'),
    new HumanMessage(marketPrompt),
  ]);

  const marketJson = JSON.parse(marketResponse.content.toString().match(/\{[\s\S]*\}/)[0]);

  // シナジー評価
  const synergyPrompt = `三菱地所のケイパビリティとのシナジーを評価してください。

ビジネス: ${idea.title}
${idea.description}

三菱地所の強み:
- 丸の内30棟のビル運営
- テナント企業3000社
- FINOLAB等のイノベーション拠点
- RE100、ネットゼロ目標

評価してJSON形式で回答:
{
  "total": <合計0-50>,
  "breakdown": {
    "capabilityMatch": <0-20>,
    "synergyEffect": <0-15>,
    "uniqueAdvantage": <0-15>
  },
  "scenario": "<シナジーシナリオ>",
  "keyAdvantages": ["<優位性1>", "<優位性2>"],
  "matchScore": <0-100>,
  "gaps": ["<ギャップ>"]
}`;

  const synergyResponse = await llm.invoke([
    new SystemMessage('あなたは三菱地所のシナジー評価専門家です。'),
    new HumanMessage(synergyPrompt),
  ]);

  const synergyJson = JSON.parse(synergyResponse.content.toString().match(/\{[\s\S]*\}/)[0]);

  // 評価結果を構築
  return {
    ideaId: idea.id,
    ideaTitle: idea.title,
    marketScore: {
      total: marketJson.total,
      breakdown: marketJson.breakdown,
      reasoning: marketJson.reasoning,
      evidence: marketJson.evidence || [],
    },
    synergyScore: {
      total: synergyJson.total,
      breakdown: synergyJson.breakdown,
      capabilityMapping: {
        requiredCapabilities: [
          {
            name: idea.title.includes('ビル') ? '不動産運営ノウハウ' : 'イノベーション支援',
            importance: 'critical',
            description: '核となる能力',
          },
        ],
        mitsubishiCapabilities: [
          {
            category: 'real_estate_development',
            name: '丸の内エリア運営',
            description: '30棟の運営実績',
            specificAssets: ['丸の内ビルディング'],
          },
        ],
        matchScore: synergyJson.matchScore || 85,
        gaps: synergyJson.gaps || [],
      },
      synergyScenario: {
        scenario: synergyJson.scenario,
        keyAdvantages: synergyJson.keyAdvantages,
        synergyMultiplier: 1.3,
      },
      scenarioValidation: {
        logicalConsistency: 85,
        feasibility: 82,
        uniqueness: 80,
        overallCredibility: 82,
        validationComments: ['実現可能性が高い'],
      },
      reasoning: '三菱地所の強みを活かせる',
    },
    totalScore: marketJson.total + synergyJson.total,
    recommendation: marketJson.total + synergyJson.total >= 80 ? 
      '強く推奨: 市場性・シナジー共に優れており、早期の事業化検討を推奨' :
      '推奨: 十分な事業ポテンシャルあり',
    risks: marketJson.risks || [],
    opportunities: marketJson.opportunities || [],
  };
}

async function generateRealCriticOutput() {
  console.log('🚀 Generating Real Critic Output with LLM\n');
  
  const startTime = new Date();
  const sessionId = `session-${Date.now()}`;
  const evaluationId = uuidv4();
  
  try {
    // 各アイデアを評価
    const evaluationResults = [];
    let tokensUsed = 0;
    
    for (const [index, idea] of testIdeas.entries()) {
      console.log(`\n[${index + 1}/${testIdeas.length}] Processing...`);
      
      const result = await evaluateWithLLM(idea);
      evaluationResults.push(result);
      
      tokensUsed += 1500; // 推定
      
      // レート制限回避
      if (index < testIdeas.length - 1) {
        console.log('⏳ Waiting 2 seconds...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // ランキング付け
    evaluationResults.sort((a, b) => b.totalScore - a.totalScore);
    evaluationResults.forEach((r, i) => r.rank = i + 1);
    
    // 最優秀アイデアを選定
    const selectedIdea = evaluationResults[0];
    
    // CriticOutput構造を作成
    const criticOutput = {
      sessionId,
      evaluationResults,
      selectedIdea,
      summary: `${selectedIdea.ideaTitle}が最高評価（${selectedIdea.totalScore}点）を獲得。` +
               `市場スコア${selectedIdea.marketScore.total}点、シナジースコア${selectedIdea.synergyScore.total}点。` +
               `${selectedIdea.marketScore.reasoning} ${selectedIdea.synergyScore.reasoning}`,
      metadata: {
        evaluationId,
        startTime,
        endTime: new Date(),
        processingTime: Date.now() - startTime.getTime(),
        tokensUsed,
        llmCalls: testIdeas.length * 2, // 市場評価とシナジー評価
        cacheHits: 0,
        errors: [],
      },
    };
    
    // 結果を表示
    console.log('\n' + '='.repeat(70));
    console.log('📊 EVALUATION RESULTS');
    console.log('='.repeat(70));
    
    evaluationResults.forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.ideaTitle}`);
      console.log(`   Total: ${result.totalScore} (Market: ${result.marketScore.total}, Synergy: ${result.synergyScore.total})`);
    });
    
    console.log('\n🏆 Selected Idea:', selectedIdea.ideaTitle);
    console.log('   Score:', selectedIdea.totalScore);
    
    // JSONファイルに保存
    const outputPath = './debug-output/critic-real-output.json';
    fs.mkdirSync('./debug-output', { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(criticOutput, null, 2));
    
    console.log(`\n✅ Real output saved to: ${outputPath}`);
    
    // Analyst用の入力形式も保存
    const analystInput = {
      sessionId: criticOutput.sessionId,
      selectedIdea: {
        // 元のアイデア情報
        id: selectedIdea.ideaId,
        title: selectedIdea.ideaTitle,
        description: testIdeas.find(i => i.id === selectedIdea.ideaId).description,
        targetCustomer: testIdeas.find(i => i.id === selectedIdea.ideaId).targetCustomer,
        customerProblem: testIdeas.find(i => i.id === selectedIdea.ideaId).customerProblem,
        proposedSolution: testIdeas.find(i => i.id === selectedIdea.ideaId).proposedSolution,
        revenueModel: testIdeas.find(i => i.id === selectedIdea.ideaId).revenueModel,
        estimatedRevenue: testIdeas.find(i => i.id === selectedIdea.ideaId).estimatedRevenue,
        marketSize: testIdeas.find(i => i.id === selectedIdea.ideaId).marketSize,
        
        // Criticの評価結果
        criticEvaluation: {
          totalScore: selectedIdea.totalScore,
          marketScore: selectedIdea.marketScore,
          synergyScore: selectedIdea.synergyScore,
          recommendation: selectedIdea.recommendation,
          risks: selectedIdea.risks,
          opportunities: selectedIdea.opportunities,
        },
      },
      analysisConfig: {
        includeTAMSAMSOM: true,
        includeCompetitorAnalysis: true,
        includeMarketTrends: true,
        includeImplementationPlan: true,
        depth: 'detailed',
      },
    };
    
    const analystInputPath = './debug-output/analyst-input.json';
    fs.writeFileSync(analystInputPath, JSON.stringify(analystInput, null, 2));
    console.log(`✅ Analyst input saved to: ${analystInputPath}`);
    
    return criticOutput;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// 実行
if (require.main === module) {
  generateRealCriticOutput().then(() => {
    console.log('\n✨ Complete!');
  });
}