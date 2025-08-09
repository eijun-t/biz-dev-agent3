/**
 * Ideator Agent Test Script
 * 実際の出力を確認するためのテストスクリプト
 */

import { IdeatorAgent } from '../lib/agents/ideator';
import type { BusinessIdea, IdeatorOutput, ValidationResult } from '../lib/types/ideator';
import * as fs from 'fs';
import * as path from 'path';

// 型定義
interface IdeationRequest {
  numberOfIdeas?: number;
  temperature?: number;
  maxTokens?: number;
  focusAreas?: string[];
  constraints?: string[];
  targetMarket?: string;
}

interface EnhancedOutput {
  processedResearch: {
    summary: string;
    sources: string[];
    queries: string[];
  };
  facts: string[];
  metrics: any;
  entities: Array<{
    name: string;
    type: string;
    relevance: number;
  }>;
  detailedAnalysis: {
    marketTrends: string[];
    competitiveLandscape: string;
    opportunities: string[];
    challenges: string[];
    recommendations: string[];
  };
}

// カラー出力用のユーティリティ
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

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(80));
  log(title, colors.bright + colors.cyan);
  console.log('='.repeat(80));
}

function logIdea(idea: any, index: number) {
  console.log(`\n${colors.bright}【アイデア ${index + 1}】${colors.reset}`);
  console.log(`${colors.green}タイトル:${colors.reset} ${idea.title}`);
  console.log(`${colors.blue}説明:${colors.reset} ${idea.description}`);
  console.log(`${colors.yellow}ターゲット顧客:${colors.reset} ${idea.targetCustomers.join(', ')}`);
  console.log(`${colors.magenta}解決する課題:${colors.reset} ${idea.customerPains.join(', ')}`);
  console.log(`${colors.cyan}提供価値:${colors.reset} ${idea.valueProposition}`);
  console.log(`収益モデル: ${idea.revenueModel}`);
  console.log(`推定営業利益: ${formatCurrency(idea.estimatedRevenue)}`);
  console.log(`実装難易度: ${getDifficultyLabel(idea.implementationDifficulty)}`);
  console.log(`市場機会: ${idea.marketOpportunity}`);
}

function formatCurrency(amount: number): string {
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

function getDifficultyLabel(difficulty: string): string {
  const labels: { [key: string]: string } = {
    'low': '低（簡単）',
    'medium': '中（標準）',
    'high': '高（困難）'
  };
  return labels[difficulty] || difficulty;
}

// テスト用のEnhancedOutput（実際のリサーチ結果をシミュレート）
const mockEnhancedOutput: EnhancedOutput = {
  processedResearch: {
    summary: `日本のAI市場は急速な成長を続けており、2025年までに3兆円規模に達すると予測されています。
特に注目すべきは、中小企業向けのAIソリューション市場で、現在は大手ベンダーが参入していない
ブルーオーシャン市場となっています。多くの中小企業がデジタル化を進めたいと考えているものの、
高額な初期投資や専門人材の不足が障壁となっています。`,
    sources: [
      'https://example.com/ai-market-report-2024',
      'https://example.com/sme-digitalization-study',
      'https://example.com/japan-tech-trends'
    ],
    queries: [
      'AI market opportunities Japan 2024',
      'SME digital transformation challenges',
      'Low-code AI platforms'
    ]
  },
  facts: [
    '日本の中小企業の68%がAI導入に興味を持っているが、実際に導入しているのは12%に留まる',
    'AI導入の最大の障壁は「コスト」（45%）と「人材不足」（38%）',
    'ノーコード・ローコードプラットフォーム市場は年率23%で成長中',
    '業務自動化により平均30%の業務時間削減が可能',
    'SaaS型AIサービスの需要が前年比150%増加'
  ],
  metrics: {
    marketSize: 3000000000000,  // 3兆円
    growthRate: 23.5,           // 年間成長率
    adoptionRate: 12            // 導入率
  },
  entities: [
    { name: 'Microsoft', type: 'competitor', relevance: 0.8 },
    { name: 'Google', type: 'competitor', relevance: 0.75 },
    { name: '中小企業', type: 'target_market', relevance: 0.95 },
    { name: '製造業', type: 'industry', relevance: 0.7 },
    { name: '小売業', type: 'industry', relevance: 0.65 }
  ],
  detailedAnalysis: {
    marketTrends: [
      'AIの民主化とアクセシビリティの向上',
      'エッジAIとIoT統合の進展',
      'ノーコード/ローコードプラットフォームの普及',
      'AI倫理とガバナンスの重要性増大',
      'バーティカルSaaSの台頭'
    ],
    competitiveLandscape: `現在の市場は大手テック企業（Microsoft、Google、AWS）が大企業向けに
高度なAIソリューションを提供している一方、中小企業向けの手頃で使いやすいソリューションは
不足しています。この市場ギャップは新規参入者にとって大きな機会となっています。`,
    opportunities: [
      '中小企業向けの簡易AI導入ソリューション',
      '業界特化型のAI自動化ツール',
      'AI人材育成とコンサルティングサービス',
      'データ準備と前処理の自動化サービス',
      'AIモデルのマーケットプレイス'
    ],
    challenges: [
      'AI専門人材の不足と高騰する人件費',
      'データプライバシーとセキュリティへの懸念',
      '初期投資コストの高さ',
      'ROIの不明確さ',
      '既存システムとの統合の複雑さ'
    ],
    recommendations: [
      '段階的な導入アプローチの採用',
      'パイロットプロジェクトから始める',
      'パートナーエコシステムの構築',
      'ユーザー教育とサポート体制の充実',
      '成功事例の積極的な共有'
    ]
  }
};

async function testWithMockLLM() {
  logSection('モックLLMを使用したテスト');
  
  // モックLLMの作成
  const mockLLM = {
    invoke: async (prompt: string) => {
      // プロンプトの内容を確認
      console.log('\n' + colors.yellow + '【送信されたプロンプト（一部）】' + colors.reset);
      console.log(prompt.substring(0, 500) + '...\n');
      
      // モックレスポンスを返す
      return {
        content: JSON.stringify({
          ideas: [
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
              title: 'AI在庫最適化サービス「在庫マスター」',
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
            }
          ],
          summary: '3つの革新的なビジネスアイデアを生成しました。特に中小企業向けAIソリューションは市場ニーズが高く、早期の収益化が期待できます。',
          metadata: {
            totalIdeas: 3,
            averageRevenue: 1166666667,
            marketSize: 3000000000000,
            generationDate: new Date().toISOString()
          }
        }),
        response_metadata: {
          usage: {
            prompt_tokens: 1500,
            completion_tokens: 2500,
            total_tokens: 4000
          }
        }
      };
    },
    _modelType: () => 'chat',
    _llmType: () => 'openai-mock'
  };

  try {
    // IdeatorAgentの初期化（モックLLMを使用）
    const ideator = new IdeatorAgent({
      llm: mockLLM as any,
      enableValidation: true,
      enableLogging: true
    });

    // アイデア生成リクエスト
    const request: IdeationRequest = {
      numberOfIdeas: 3,
      temperature: 0.8,
      focusAreas: ['中小企業', 'AI自動化', 'SaaS'],
      targetMarket: '日本の中小企業市場'
    };

    log('\nアイデア生成を開始します...', colors.yellow);
    
    // アイデアを生成
    const output = await ideator.generateIdeas(mockEnhancedOutput, request);
    
    logSection('生成されたビジネスアイデア');
    
    // 各アイデアを表示
    output.ideas.forEach((idea, index) => {
      logIdea(idea, index);
      
      // 品質検証
      const validation = ideator.validateIdea(idea);
      console.log(`\n${colors.bright}【品質評価】${colors.reset}`);
      console.log(`検証結果: ${validation.isValid ? '✅ 有効' : '❌ 無効'}`);
      console.log(`品質スコア: ${(validation as any).qualityScore || 'N/A'}/100`);
      
      if ((validation as any).issues && (validation as any).issues.length > 0) {
        console.log('改善点:');
        (validation as any).issues.forEach((issue: any) => {
          const icon = issue.severity === 'error' ? '🔴' : 
                       issue.severity === 'warning' ? '🟡' : '🔵';
          console.log(`  ${icon} ${issue.field}: ${issue.message}`);
        });
      }
      
      // 強み・弱み分析
      const analysis = ideator.analyzeIdea(idea);
      if (analysis.strengths.length > 0) {
        console.log(`\n${colors.green}強み:${colors.reset}`);
        analysis.strengths.forEach(s => console.log(`  • ${s}`));
      }
      if (analysis.weaknesses.length > 0) {
        console.log(`\n${colors.yellow}弱み:${colors.reset}`);
        analysis.weaknesses.forEach(w => console.log(`  • ${w}`));
      }
    });
    
    // サマリー情報
    logSection('生成結果サマリー');
    console.log(`総アイデア数: ${(output as any).metadata?.totalIdeas || output.ideas.length}`);
    console.log(`平均推定営業利益: ${formatCurrency((output as any).metadata?.averageRevenue || 0)}`);
    console.log(`対象市場規模: ${formatCurrency((output as any).metadata?.marketSize || 0)}`);
    console.log(`生成日時: ${new Date((output as any).metadata?.generationDate || Date.now()).toLocaleString('ja-JP')}`);
    console.log(`\nサマリー: ${(output as any).summary || '生成完了'}`);
    
    // メトリクス情報
    const metrics = ideator.getMetrics();
    logSection('パフォーマンスメトリクス');
    console.log(`使用トークン数:`);
    console.log(`  • プロンプト: ${metrics.tokenUsage.promptTokens}`);
    console.log(`  • 生成: ${metrics.tokenUsage.completionTokens}`);
    console.log(`  • 合計: ${metrics.tokenUsage.totalTokens}`);
    console.log(`推定コスト: $${((metrics.tokenUsage.totalTokens / 1000) * 0.03).toFixed(4)}`);
    
    // 結果をファイルに保存
    const outputDir = path.join(process.cwd(), 'debug-output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputFile = path.join(outputDir, `ideator-output-${Date.now()}.json`);
    fs.writeFileSync(outputFile, JSON.stringify({
      request,
      output,
      metrics,
      timestamp: new Date().toISOString()
    }, null, 2));
    
    log(`\n✅ 結果を保存しました: ${outputFile}`, colors.green);
    
  } catch (error) {
    console.error(colors.bright + colors.red + '\n❌ エラーが発生しました:' + colors.reset);
    console.error(error);
  }
}

// メイン実行
async function main() {
  console.clear();
  log('🚀 Ideator Agent 出力テスト', colors.bright + colors.cyan);
  log('=' .repeat(80), colors.cyan);
  
  await testWithMockLLM();
  
  log('\n✨ テスト完了', colors.bright + colors.green);
}

// 実行
main().catch(console.error);