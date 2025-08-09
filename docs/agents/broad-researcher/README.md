# Broad Researcher Agent

## 概要

Broad Researcher Agentは、与えられたテーマについて包括的な市場調査を行うAIエージェントです。日本市場と海外先端事例の両方を調査し、ビジネス機会の発見を支援します。

## 主な機能

### 1. 包括的な検索
- **日本市場調査**: 市場規模、競合分析、トレンド、規制、顧客ニーズ
- **海外先端事例**: スタートアップ、最新技術、ベストプラクティス
- **自動クエリ生成**: LLMを使用して最適な検索クエリを生成

### 2. インテリジェントな分析
- **重複除去**: 同一URLの検索結果を自動的に除去
- **インサイト抽出**: 検索結果から重要な情報を自動抽出
- **適用性分析**: 海外事例の日本市場への適用可能性を評価

### 3. パフォーマンス最適化
- **キャッシング**: 同一クエリの結果を一時保存（TTL: 5分）
- **レート制限**: 1分間に100リクエストまで
- **リトライ機能**: ネットワークエラー時の自動リトライ（最大3回）

## アーキテクチャ

```
┌─────────────────────────────────────────────────┐
│           BroadResearcherAgent                  │
│                                                 │
│  ┌─────────────┐    ┌────────────────────┐    │
│  │ Query Gen   │───▶│ SerperSearchService│    │
│  │ (LangChain) │    └────────────────────┘    │
│  └─────────────┘              │                │
│         │                     ▼                │
│         ▼              ┌──────────────┐        │
│  ┌──────────────┐     │ Rate Limiter │        │
│  │Result Process│◀────┤   & Cache    │        │
│  └──────────────┘     └──────────────┘        │
│         │                                      │
│         ▼                                      │
│  ┌──────────────┐                             │
│  │   Summary    │                             │
│  │  Generation  │                             │
│  └──────────────┘                             │
└─────────────────────────────────────────────────┘
```

## 使用方法

### 1. 環境設定

```bash
# 必須の環境変数
SERPER_API_KEY=your_serper_api_key
OPENAI_API_KEY=your_openai_api_key

# オプション設定
SERPER_API_TIMEOUT=10000      # タイムアウト（ミリ秒）
SERPER_CACHE_TTL=300          # キャッシュTTL（秒）
SERPER_MAX_RETRIES=3          # 最大リトライ回数
```

### 2. 基本的な使用例

```typescript
import { BroadResearcherAgent } from '@/lib/agents/broad-researcher'
import { SerperSearchService } from '@/lib/services/serper'
import { ChatOpenAI } from '@langchain/openai'

// エージェントの初期化
const searchService = new SerperSearchService()
const llm = new ChatOpenAI({ 
  modelName: 'gpt-4-turbo-preview',
  temperature: 0.7
})

const agent = new BroadResearcherAgent(
  context,
  searchService,
  llm,
  database
)

// 実行
const result = await agent.execute({
  theme: 'AIが不動産業界に与える影響',
  sessionId: 'session-123'
})

if (result.success) {
  console.log('リサーチ完了:', result.data.research.summary)
  console.log('メトリクス:', result.data.metrics)
}
```

## 出力形式

### ResearcherOutput

```typescript
interface ResearcherOutput {
  research: ResearchSummary
  metrics: AgentMetrics
}

interface ResearchSummary {
  theme: string
  summary: string
  keyFindings: string[]
  recommendations?: string[]
  insights: {
    marketSize?: string
    competitors?: string[]
    trends?: string[]
    regulations?: string[]
    customerNeeds?: string[]
  }
  globalInsights: {
    innovations?: string[]
    technologies?: string[]
    bestPractices?: string[]
    applicability?: string
  }
  sources: {
    japanese: string[]
    global: string[]
  }
  generatedAt: Date
}
```

## エラーハンドリング

### エラータイプ

1. **QueryGenerationError**: クエリ生成失敗（リトライ可能）
2. **SearchExecutionError**: 検索実行エラー（リトライ可能）
3. **ResultProcessingError**: 結果処理エラー（リトライ不可）
4. **SummaryGenerationError**: 要約生成エラー（リトライ可能）
5. **TokenLimitError**: トークン上限超過
6. **CostLimitError**: APIコスト上限超過
7. **ExecutionTimeoutError**: 実行時間超過

### エラー対処法

```typescript
try {
  const result = await agent.execute(input)
} catch (error) {
  if (ErrorHandler.isRetryable(error)) {
    // リトライ可能なエラー
    console.log('リトライしてください')
  } else {
    // ユーザー向けメッセージを取得
    const userMessage = ErrorHandler.getUserMessage(error)
    console.log(userMessage)
  }
}
```

## パフォーマンス監視

### メトリクス

- **実行時間**: 全体の処理時間
- **トークン使用量**: LLMトークン消費
- **API呼び出し数**: 外部API呼び出し回数
- **キャッシュヒット率**: キャッシュの効果
- **エラー**: 発生したエラーのリスト

### 閾値設定

```typescript
const monitor = new PerformanceMonitor({
  maxExecutionTime: 30000,      // 30秒
  maxTokensPerRequest: 4000,    // GPT-4制限
  maxTotalTokens: 20000,        // 総トークン予算
  maxApiCalls: 50,              // API呼び出し上限
  minCacheHitRate: 30           // 最小キャッシュヒット率
})
```

## ローカルロギング

データベース障害時のフォールバックとして、ローカルファイルにログを記録：

```typescript
const logger = new LocalLogger('./logs')

// ログの検索
const logs = logger.searchLogs({
  sessionId: 'session-123',
  level: 'error',
  startDate: new Date('2024-01-01'),
  limit: 100
})
```

## テスト

```bash
# ユニットテスト
npm test -- __tests__/services/serper
npm test -- __tests__/agents/broad-researcher

# 統合テスト
npm test -- __tests__/agents/broad-researcher/broad-researcher-agent.test.ts

# カバレッジ
npm test -- --coverage
```

## トラブルシューティング

### よくある問題

1. **SERPER_API_KEY is required**
   - 環境変数が設定されていません
   - `.env`ファイルを確認してください

2. **Serper API error: 401 Unauthorized**
   - APIキーが無効です
   - Serperダッシュボードで確認してください

3. **Search request timed out**
   - ネットワークが遅い可能性があります
   - `SERPER_API_TIMEOUT`を増やしてください

4. **トークン上限を超過しました**
   - より簡潔なテーマでお試しください
   - モデルを`gpt-3.5-turbo`に変更してください

## ベストプラクティス

1. **テーマの明確化**: 具体的で焦点を絞ったテーマを設定
2. **キャッシュの活用**: 類似の検索を繰り返す場合は効果的
3. **エラー監視**: ログを定期的にチェック
4. **コスト管理**: メトリクスでAPI使用量を監視

## 今後の改善予定

- [ ] 検索結果のランキングアルゴリズム改善
- [ ] より高度な重複検出
- [ ] マルチ言語対応の強化
- [ ] リアルタイムストリーミング対応
- [ ] カスタムプロンプトテンプレート