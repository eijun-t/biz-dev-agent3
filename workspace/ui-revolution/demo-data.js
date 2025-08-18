/**
 * Demo Data Generator
 * 完璧なデモンストレーション用データセット
 */

// デモシナリオデータ
const demoScenarios = {
  // シナリオ1: AIビジネスアイデア生成
  aiBusinessIdea: {
    title: "AI-Powered Business Innovation",
    agents: [
      {
        name: "Researcher",
        tasks: [
          "市場調査: AI/MLトレンド分析",
          "競合分析: 主要プレイヤー調査",
          "技術動向: 最新技術スタック確認"
        ],
        duration: 15000,
        output: {
          marketSize: "$10.7B",
          growthRate: "38.1%",
          competitors: 152,
          opportunities: ["Healthcare AI", "FinTech", "EdTech"]
        }
      },
      {
        name: "Ideator",
        tasks: [
          "アイデア生成: 100個のビジネスアイデア",
          "フィルタリング: 実現可能性評価",
          "優先順位付け: ROI基準でランキング"
        ],
        duration: 12000,
        output: {
          totalIdeas: 100,
          filtered: 25,
          topIdeas: [
            "AI医療診断支援システム",
            "パーソナライズ学習プラットフォーム",
            "自動財務アドバイザー"
          ]
        }
      },
      {
        name: "Critic",
        tasks: [
          "リスク評価: 技術的・市場的リスク",
          "実現可能性: リソース要件分析",
          "改善提案: 各アイデアの最適化"
        ],
        duration: 10000,
        output: {
          approved: 3,
          rejected: 22,
          riskLevel: "Medium",
          recommendations: ["MVP開発", "段階的リリース", "パートナーシップ構築"]
        }
      },
      {
        name: "Analyst",
        tasks: [
          "詳細市場分析: TAM/SAM/SOM計算",
          "財務予測: 5年間の収益モデル",
          "競争優位性: SWOT分析"
        ],
        duration: 18000,
        output: {
          tam: "$50B",
          sam: "$15B",
          som: "$1.5B",
          breakEven: "18 months",
          roi: "420%"
        }
      },
      {
        name: "Writer",
        tasks: [
          "ビジネスプラン作成: 50ページ",
          "エグゼクティブサマリー: 2ページ",
          "プレゼンテーション資料: 20スライド"
        ],
        duration: 20000,
        output: {
          documents: 3,
          pages: 72,
          format: "PDF/PPTX",
          language: "Japanese/English"
        }
      }
    ]
  },

  // シナリオ2: スタートアップ評価
  startupEvaluation: {
    title: "Startup Investment Analysis",
    agents: [
      {
        name: "Researcher",
        tasks: ["業界分析", "チーム背景調査", "技術評価"],
        duration: 8000,
        output: { score: 8.5, recommendation: "投資推奨" }
      },
      {
        name: "Ideator",
        tasks: ["成長戦略提案", "パートナーシップ案", "拡張計画"],
        duration: 7000,
        output: { strategies: 5, partnerships: 3 }
      },
      {
        name: "Critic",
        tasks: ["リスク分析", "弱点特定", "改善提案"],
        duration: 6000,
        output: { risks: 8, critical: 2 }
      },
      {
        name: "Analyst",
        tasks: ["財務分析", "バリュエーション", "投資条件"],
        duration: 10000,
        output: { valuation: "$10M", equity: "20%" }
      },
      {
        name: "Writer",
        tasks: ["投資メモ作成", "DD報告書", "契約書ドラフト"],
        duration: 12000,
        output: { documents: 3, pages: 45 }
      }
    ]
  }
};

// パフォーマンステストデータ
const performanceTestData = {
  // 負荷テスト用データ
  loadTest: {
    connections: 1000,
    messagesPerSecond: 100,
    duration: 60000, // 1分間
    payload: {
      small: { size: 100, data: "x".repeat(100) },
      medium: { size: 1000, data: "x".repeat(1000) },
      large: { size: 10000, data: "x".repeat(10000) }
    }
  },

  // レイテンシテスト
  latencyTest: {
    iterations: 1000,
    targetLatency: 50, // 50ms以内
    checkpoints: [10, 25, 50, 100, 200]
  },

  // スループットテスト
  throughputTest: {
    duration: 30000, // 30秒
    targetMessagesPerSecond: 1000,
    concurrentConnections: [1, 10, 50, 100, 500, 1000]
  }
};

// リアルタイムデータ生成関数
function generateRealtimeData() {
  const agents = ['Researcher', 'Ideator', 'Critic', 'Analyst', 'Writer'];
  const statuses = ['idle', 'running', 'completed', 'error'];
  
  return {
    timestamp: new Date().toISOString(),
    sessionId: `session-${Date.now()}`,
    agents: agents.map(name => ({
      name,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      progress: Math.floor(Math.random() * 100),
      metrics: {
        executionTime: Math.floor(Math.random() * 10000),
        apiCalls: Math.floor(Math.random() * 100),
        dataProcessed: Math.floor(Math.random() * 1000000),
        memoryUsage: Math.floor(Math.random() * 500),
        cpuUsage: Math.floor(Math.random() * 100),
        throughput: Math.random() * 1000,
        latency: Math.random() * 100
      },
      currentTask: `Processing ${name} task ${Math.floor(Math.random() * 10)}`,
      output: {
        type: 'partial',
        data: `Sample output from ${name}`,
        confidence: Math.random()
      }
    }))
  };
}

// デモ実行関数
async function runDemo(scenarioName = 'aiBusinessIdea') {
  const scenario = demoScenarios[scenarioName];
  if (!scenario) {
    console.error('Scenario not found:', scenarioName);
    return;
  }

  console.log(`🎬 Starting demo: ${scenario.title}`);
  console.log('=' .repeat(50));

  for (const agent of scenario.agents) {
    console.log(`\n🤖 ${agent.name} starting...`);
    
    // タスク実行シミュレーション
    for (const task of agent.tasks) {
      console.log(`  📋 ${task}`);
      await sleep(agent.duration / agent.tasks.length);
    }
    
    console.log(`  ✅ ${agent.name} completed!`);
    console.log(`  📊 Output:`, JSON.stringify(agent.output, null, 2));
  }

  console.log('\n' + '=' .repeat(50));
  console.log('🎉 Demo completed successfully!');
}

// パフォーマンステスト実行
async function runPerformanceTest() {
  console.log('⚡ Starting performance tests...\n');

  // レイテンシテスト
  console.log('1. Latency Test');
  const latencies = [];
  for (let i = 0; i < performanceTestData.latencyTest.iterations; i++) {
    const start = Date.now();
    // WebSocket送信シミュレーション
    await simulateWebSocketSend();
    latencies.push(Date.now() - start);
  }
  
  const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  const maxLatency = Math.max(...latencies);
  const minLatency = Math.min(...latencies);
  
  console.log(`  Average: ${avgLatency.toFixed(2)}ms`);
  console.log(`  Min: ${minLatency}ms`);
  console.log(`  Max: ${maxLatency}ms`);
  console.log(`  Target: <${performanceTestData.latencyTest.targetLatency}ms`);
  console.log(`  Result: ${avgLatency < performanceTestData.latencyTest.targetLatency ? '✅ PASS' : '❌ FAIL'}`);

  // スループットテスト
  console.log('\n2. Throughput Test');
  let messagesSent = 0;
  const startTime = Date.now();
  
  while (Date.now() - startTime < performanceTestData.throughputTest.duration) {
    await simulateWebSocketSend();
    messagesSent++;
  }
  
  const throughput = messagesSent / (performanceTestData.throughputTest.duration / 1000);
  console.log(`  Messages sent: ${messagesSent}`);
  console.log(`  Throughput: ${throughput.toFixed(2)} msg/s`);
  console.log(`  Target: >${performanceTestData.throughputTest.targetMessagesPerSecond} msg/s`);
  console.log(`  Result: ${throughput > performanceTestData.throughputTest.targetMessagesPerSecond ? '✅ PASS' : '❌ FAIL'}`);

  console.log('\n✨ Performance test completed!');
}

// ヘルパー関数
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function simulateWebSocketSend() {
  // WebSocket送信のシミュレーション
  await sleep(Math.random() * 10);
}

// エクスポート（Node.js環境用）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    demoScenarios,
    performanceTestData,
    generateRealtimeData,
    runDemo,
    runPerformanceTest
  };
}

// ブラウザ環境での自動実行
if (typeof window !== 'undefined') {
  window.demoData = {
    scenarios: demoScenarios,
    generateRealtimeData,
    runDemo,
    runPerformanceTest
  };
  
  console.log('📦 Demo data loaded! Use window.demoData to access.');
}