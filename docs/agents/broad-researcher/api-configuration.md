# Broad Researcher Agent API Configuration

## Serper API設定

### 1. APIキーの取得

1. [Serper](https://serper.dev)にアクセス
2. アカウントを作成
3. Dashboard > API Keyからキーを取得

### 2. 環境変数の設定

```bash
# .env.local
SERPER_API_KEY=your_api_key_here
```

### 3. オプション設定

```typescript
// カスタム設定例
const searchService = new SerperSearchService({
  apiKey: process.env.SERPER_API_KEY,
  config: {
    timeout: 15000,        // 15秒
    cacheTTL: 600,        // 10分
    maxRetries: 5         // 5回リトライ
  },
  rateLimit: {
    tokensPerInterval: 100,
    interval: 60000       // 1分
  }
})
```

### 4. Serper APIパラメータ

#### 基本パラメータ

```typescript
interface SearchOptions {
  q: string          // 検索クエリ（必須）
  gl?: string        // 国コード (jp, us, ukなど)
  hl?: string        // 言語コード (ja, enなど)
  num?: number       // 結果数 (1-100, デフォルト10)
  page?: number      // ページ番号 (1-10)
  type?: string      // search, news, imagesなど
}
```

#### 日本市場向け設定

```typescript
const japaneseSearchOptions = {
  gl: 'jp',          // 日本の検索結果
  hl: 'ja',          // 日本語表示
  num: 10            // 10件取得
}
```

#### グローバル検索設定

```typescript
const globalSearchOptions = {
  gl: 'us',          // アメリカの検索結果
  hl: 'en',          // 英語表示
  num: 10            // 10件取得
}
```

### 5. API制限とコスト

#### 無料プラン
- 2,500クレジット/月
- 1検索 = 1クレジット
- 約2,500回の検索が可能

#### 有料プラン
- Pay as you go: $0.001/検索
- 月額プラン: $50/月から

### 6. レート制限対策

```typescript
// レート制限設定
const rateLimiter = new RateLimiter({
  tokensPerInterval: 100,    // 100リクエスト
  interval: 60000,           // 1分間あたり
  fireImmediately: true      // 即座に実行
})
```

## OpenAI API設定

### 1. APIキーの取得

1. [OpenAI Platform](https://platform.openai.com)にアクセス
2. API Keysセクションからキーを作成

### 2. 環境変数の設定

```bash
# .env.local
OPENAI_API_KEY=sk-...
```

### 3. LangChain設定

```typescript
import { ChatOpenAI } from '@langchain/openai'

const llm = new ChatOpenAI({
  modelName: 'gpt-4-turbo-preview',
  temperature: 0.7,
  maxTokens: 4000,
  streaming: false,
  openAIApiKey: process.env.OPENAI_API_KEY
})
```

### 4. モデル選択ガイド

#### 推奨設定

```typescript
// 高品質・高コスト
const highQualityLLM = new ChatOpenAI({
  modelName: 'gpt-4-turbo-preview',
  temperature: 0.7
})

// バランス型
const balancedLLM = new ChatOpenAI({
  modelName: 'gpt-3.5-turbo',
  temperature: 0.7
})

// 高速・低コスト
const fastLLM = new ChatOpenAI({
  modelName: 'gpt-3.5-turbo',
  temperature: 0.5,
  maxTokens: 2000
})
```

### 5. トークンコスト計算

```typescript
// GPT-4 Turbo
// 入力: $0.01 / 1K tokens
// 出力: $0.03 / 1K tokens

// GPT-3.5 Turbo
// 入力: $0.0005 / 1K tokens
// 出力: $0.0015 / 1K tokens

// コスト計算例
function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const costs = {
    'gpt-4-turbo-preview': {
      input: 0.01,
      output: 0.03
    },
    'gpt-3.5-turbo': {
      input: 0.0005,
      output: 0.0015
    }
  }
  
  const modelCost = costs[model]
  return (inputTokens * modelCost.input + outputTokens * modelCost.output) / 1000
}
```

## 統合設定例

### 開発環境

```typescript
// config/development.ts
export const developmentConfig = {
  serper: {
    apiKey: process.env.SERPER_API_KEY,
    timeout: 30000,        // デバッグ用に長め
    cacheTTL: 60,         // 1分（短め）
    maxRetries: 1         // リトライ少なめ
  },
  openai: {
    model: 'gpt-3.5-turbo', // コスト削減
    temperature: 0.7,
    maxTokens: 2000         // 制限
  },
  performance: {
    maxExecutionTime: 60000,  // 1分
    maxApiCalls: 20
  }
}
```

### 本番環境

```typescript
// config/production.ts
export const productionConfig = {
  serper: {
    apiKey: process.env.SERPER_API_KEY,
    timeout: 10000,        // 10秒
    cacheTTL: 300,        // 5分
    maxRetries: 3         // 3回リトライ
  },
  openai: {
    model: 'gpt-4-turbo-preview',
    temperature: 0.7,
    maxTokens: 4000
  },
  performance: {
    maxExecutionTime: 30000,  // 30秒
    maxApiCalls: 50
  }
}
```

## セキュリティ設定

### 1. APIキーの保護

```typescript
// 絶対にコミットしない
if (process.env.NODE_ENV === 'production') {
  if (!process.env.SERPER_API_KEY?.startsWith('ser_')) {
    throw new Error('Invalid Serper API key format')
  }
  if (!process.env.OPENAI_API_KEY?.startsWith('sk-')) {
    throw new Error('Invalid OpenAI API key format')
  }
}
```

### 2. クライアントサイド保護

```typescript
// pages/api/agents/research.ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // APIキーをクライアントに公開しない
  const { theme, sessionId } = req.body
  
  // サーバーサイドでのみ実行
  const agent = new BroadResearcherAgent(
    { sessionId, userId: req.session.userId },
    searchService,  // サーバーサイドで初期化
    llm,           // サーバーサイドで初期化
    db
  )
  
  const result = await agent.execute({ theme, sessionId })
  res.json(result)
}
```

## モニタリング

### API使用状況の確認

```typescript
// 月次レポート生成
async function generateMonthlyReport() {
  const logs = await db.query(
    'SELECT * FROM agent_logs WHERE created_at >= $1',
    [new Date(new Date().setDate(1))]
  )
  
  const report = {
    totalSearches: logs.filter(l => l.type === 'search').length,
    totalTokens: logs.reduce((sum, l) => sum + (l.tokens || 0), 0),
    estimatedCost: calculateTotalCost(logs),
    cacheHitRate: calculateCacheHitRate(logs),
    averageExecutionTime: calculateAverageTime(logs)
  }
  
  return report
}
```

## トラブルシューティング

### Serper API

1. **429 Too Many Requests**
   ```typescript
   // レート制限を緩和
   const limiter = new RateLimiter({
     tokensPerInterval: 50,  // 半分に減らす
     interval: 60000
   })
   ```

2. **空の検索結果**
   ```typescript
   // クエリを調整
   if (results.length === 0) {
     // より一般的なクエリに変更
     return await searchWithFallback(simplifyQuery(query))
   }
   ```

### OpenAI API

1. **コンテキスト長超過**
   ```typescript
   // コンテキストを分割
   const chunks = splitIntoChunks(context, 3000)
   const summaries = await Promise.all(
     chunks.map(chunk => llm.invoke(chunk))
   )
   ```

2. **タイムアウト**
   ```typescript
   // ストリーミングを無効化
   const llm = new ChatOpenAI({
     streaming: false,
     timeout: 60000  // 60秒
   })
   ```