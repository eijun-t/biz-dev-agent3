/**
 * Test Enhanced Broad Researcher Agent V2
 * 改良版エージェントの動作確認
 */

import { BroadResearcherAgentV2 } from './lib/agents/broad-researcher/broad-researcher-agent-v2'
import { SerperSearchService } from './lib/services/serper/serper-search-service'
import { ChatOpenAI } from '@langchain/openai'
import { config } from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables
config({ path: '.env.local' })

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
}

function print(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

// Mock database
class MockDatabaseService {
  async query(): Promise<any> { return { rows: [] } }
  async insert(): Promise<any> { return { id: 'mock-id' } }
  async update(): Promise<any> { return {} }
  async delete(): Promise<any> { return {} }
}

async function testEnhancedAgent() {
  print('\n=== Enhanced Broad Researcher Agent V2 Test ===\n', 'magenta')
  
  try {
    // Initialize services
    print('サービスを初期化中...', 'yellow')
    
    const searchService = new SerperSearchService()
    const llm = new ChatOpenAI({
      modelName: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.7,
      openAIApiKey: process.env.OPENAI_API_KEY
    })
    const db = new MockDatabaseService()
    
    print('✓ サービス初期化完了', 'green')
    
    // Create agent context
    const context = {
      sessionId: crypto.randomUUID(),
      userId: crypto.randomUUID(),
      metadata: {
        test: true,
        version: 'v2',
        timestamp: new Date().toISOString()
      }
    }
    
    // Initialize enhanced agent
    const agent = new BroadResearcherAgentV2(
      context,
      searchService,
      llm,
      db as any
    )
    
    // Test theme
    const theme = 'AIを活用した不動産価格査定の最新技術とビジネスチャンス'
    print(`\n調査テーマ: "${theme}"`, 'cyan')
    print('='.repeat(80), 'cyan')
    
    // Execute research
    print('\n深層分析を開始します...', 'yellow')
    const startTime = Date.now()
    
    const result = await agent.execute({
      theme,
      sessionId: context.sessionId
    })
    
    const executionTime = Date.now() - startTime
    
    if (result.success && result.data) {
      print('\n✓ 深層分析が正常に完了しました！', 'green')
      
      // Display detailed metrics
      print('\n=== 実行メトリクス ===', 'blue')
      print(`実行時間: ${(executionTime / 1000).toFixed(2)}秒`)
      print(`使用トークン数: ${result.data.metrics.tokensUsed.toLocaleString()}`)
      print(`API呼び出し回数: ${result.data.metrics.apiCallsCount}`)
      print(`キャッシュヒット率: ${result.data.metrics.cacheHitRate.toFixed(1)}%`)
      
      // Display enhanced summary
      print('\n=== エグゼクティブサマリー ===', 'blue')
      const summary = result.data.research.summary
      // 改行で分割して表示
      const paragraphs = summary.split('\n\n')
      paragraphs.forEach(para => {
        if (para.trim()) {
          print(para.trim())
        }
      })
      
      // Display key findings
      if (result.data.research.keyFindings?.length > 0) {
        print('\n=== 主要な発見事項 ===', 'blue')
        result.data.research.keyFindings.forEach((finding: string, i: number) => {
          print(`${i + 1}. ${finding}`, 'cyan')
        })
      }
      
      // Display market insights
      print('\n=== 市場分析 ===', 'blue')
      const insights = result.data.research.insights
      if (typeof insights === 'object' && insights !== null) {
        if (insights.size) print(`市場規模: ${insights.size}`)
        if (insights.growth) print(`成長性: ${insights.growth}`)
        if (insights.segments?.length > 0) {
          print(`主要セグメント: ${insights.segments.join(', ')}`)
        }
        if (insights.keyMetrics?.length > 0) {
          print('主要指標:')
          insights.keyMetrics.forEach((metric: any) => {
            print(`  - ${metric.label}: ${metric.value}`, 'yellow')
          })
        }
      }
      
      // Display recommendations
      if (result.data.research.recommendations?.length > 0) {
        print('\n=== 推奨アクション ===', 'blue')
        result.data.research.recommendations.forEach((rec: string, i: number) => {
          print(`${i + 1}. ${rec}`, 'green')
        })
      }
      
      // Display sources
      print('\n=== 情報源 ===', 'blue')
      print(`日本語ソース: ${result.data.research.sources.japanese.length}件`)
      result.data.research.sources.japanese.slice(0, 3).forEach((url: string) => {
        print(`  - ${url}`, 'yellow')
      })
      print(`\n英語ソース: ${result.data.research.sources.global.length}件`)
      result.data.research.sources.global.slice(0, 3).forEach((url: string) => {
        print(`  - ${url}`, 'yellow')
      })
      
      // Cost estimation
      const tokenCost = (result.data.metrics.tokensUsed * 0.002 / 1000)
      const searchCost = result.data.metrics.apiCallsCount * 0.001
      print('\n=== コスト見積もり ===', 'blue')
      print(`トークンコスト: $${tokenCost.toFixed(4)}`)
      print(`検索コスト: $${searchCost.toFixed(4)}`)
      print(`合計コスト: $${(tokenCost + searchCost).toFixed(4)}`)
      
      // Save detailed report
      const outputDir = './enhanced-output'
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
      }
      
      const filename = `enhanced-research-${Date.now()}.json`
      const filepath = path.join(outputDir, filename)
      
      fs.writeFileSync(filepath, JSON.stringify({
        timestamp: new Date().toISOString(),
        executionTime,
        theme,
        result: result.data,
        messages: result.messages
      }, null, 2))
      
      print(`\n✓ 詳細レポートを保存しました: ${filepath}`, 'green')
      
    } else {
      print(`\n✗ 分析が失敗しました: ${result.error}`, 'red')
      if (result.messages) {
        print('\n実行トレース:', 'yellow')
        result.messages.forEach(msg => {
          const phase = msg.data?.phase || 'unknown'
          print(`  [${phase}] ${msg.message}`)
        })
      }
    }
    
  } catch (error) {
    print(`\n✗ 予期しないエラー: ${error}`, 'red')
    if (error instanceof Error) {
      print(`スタック: ${error.stack}`, 'red')
    }
  }
}

// Run test
testEnhancedAgent().then(() => {
  print('\n✓ テスト完了！', 'green')
  print('\n改良版エージェントは、以下の機能を提供します:', 'cyan')
  print('- LLMによる各検索結果の深い分析', 'yellow')
  print('- 数値データとエンティティの自動抽出', 'yellow')
  print('- 複数の洞察を統合した包括的な市場理解', 'yellow')
  print('- 具体的で実行可能な推奨アクション', 'yellow')
  print('- 海外事例の日本市場への適用可能性分析', 'yellow')
  process.exit(0)
}).catch(error => {
  print(`\n致命的エラー: ${error}`, 'red')
  process.exit(1)
})