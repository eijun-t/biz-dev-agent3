# Broad Researcher Agent

## 概要

Broad Researcher Agentは、Web検索APIを活用して包括的な市場調査を実施する専門エージェントです。新事業創出の第一段階として、市場動向、競合分析、顧客ニーズを体系的に収集・分析します。

## 🎯 主要機能

### 1. 情報収集
- **Web検索**: Serper APIによる高精度検索
- **データ抽出**: 構造化データの自動抽出
- **ソース管理**: 信頼性の高い情報源の優先

### 2. 分析機能
- **トレンド分析**: 市場動向の時系列分析
- **競合分析**: 主要プレイヤーの戦略分析
- **機会発見**: 未開拓市場の特定

### 3. レポート生成
- **構造化出力**: JSON形式での標準化出力
- **要約生成**: エグゼクティブサマリー自動生成
- **視覚化**: データの可視化支援

## 📊 入出力仕様

### 入力スキーマ
```typescript
interface ResearcherInput {
  topic: string;           // 調査テーマ
  scope: {
    industries: string[];  // 対象業界
    regions: string[];     // 対象地域
    timeframe: string;     // 調査期間
  };
  depth: 'basic' | 'standard' | 'comprehensive';
  keywords?: string[];     // 追加キーワード
}
```

### 出力スキーマ
```typescript
interface ResearcherOutput {
  summary: {
    overview: string;
    keyFindings: string[];
    opportunities: string[];
  };
  marketAnalysis: {
    size: number;
    growth: number;
    trends: Trend[];
    drivers: string[];
    challenges: string[];
  };
  competitiveLandscape: {
    majorPlayers: Company[];
    marketShare: MarketShare[];
    strategies: Strategy[];
  };
  customerInsights: {
    segments: Segment[];
    needs: string[];
    painPoints: string[];
  };
  sources: Source[];
  timestamp: string;
}
```

## 🔧 技術実装

### コアコンポーネント
```typescript
// lib/agents/broad-researcher/index.ts
export class BroadResearcherAgent {
  private serperClient: SerperClient;
  private llm: OpenAI;
  
  async execute(input: ResearcherInput): Promise<ResearcherOutput> {
    // 1. 検索クエリ生成
    const queries = await this.generateQueries(input);
    
    // 2. 並列検索実行
    const searchResults = await Promise.all(
      queries.map(q => this.serperClient.search(q))
    );
    
    // 3. 情報抽出と構造化
    const structured = await this.structureData(searchResults);
    
    // 4. 分析と洞察生成
    const insights = await this.generateInsights(structured);
    
    return insights;
  }
}
```

### API統合
```typescript
// Serper API設定
const serperConfig = {
  apiKey: process.env.SERPER_API_KEY,
  options: {
    gl: 'jp',        // 地域設定
    hl: 'ja',        // 言語設定
    num: 20,         // 結果数
    type: 'search'   // 検索タイプ
  }
};
```

## 🚀 使用方法

### 基本的な使用例
```typescript
import { BroadResearcherAgent } from '@/lib/agents/broad-researcher';

const researcher = new BroadResearcherAgent();

const result = await researcher.execute({
  topic: "スマートシティ市場",
  scope: {
    industries: ["IoT", "インフラ", "エネルギー"],
    regions: ["日本", "アジア太平洋"],
    timeframe: "2024-2030"
  },
  depth: 'comprehensive'
});
```

### API経由での実行
```bash
curl -X POST https://api.example.com/api/agents/researcher/execute \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "スマートシティ市場",
    "scope": {
      "industries": ["IoT"],
      "regions": ["日本"],
      "timeframe": "2024-2030"
    },
    "depth": "standard"
  }'
```

## ⚙️ 設定

### 環境変数
```env
SERPER_API_KEY=your_serper_api_key
OPENAI_API_KEY=your_openai_api_key
RESEARCHER_MAX_RETRIES=3
RESEARCHER_TIMEOUT=30000
RESEARCHER_CACHE_TTL=3600
```

### カスタマイズオプション
```typescript
const config = {
  maxSearchQueries: 10,      // 最大検索クエリ数
  maxSourcesPerQuery: 5,     // クエリあたりの最大ソース数
  minSourceReliability: 0.7, // 最小信頼性スコア
  enableCaching: true,        // キャッシュ有効化
  cacheExpiration: 3600       // キャッシュ有効期限（秒）
};
```

## 📈 パフォーマンス

### ベンチマーク
- 平均実行時間: 15-30秒
- 検索精度: 85%以上
- データ構造化成功率: 92%

### 最適化のヒント
1. **並列処理**: 複数の検索を並行実行
2. **キャッシング**: 頻繁なクエリをキャッシュ
3. **フィルタリング**: 信頼性の低いソースを除外

## 🐛 トラブルシューティング

### よくある問題

#### 1. Serper APIレート制限
```typescript
// エラー: Rate limit exceeded
// 解決策: リトライロジックを実装
const retryWithBackoff = async (fn, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(r => setTimeout(r, 2 ** i * 1000));
    }
  }
};
```

#### 2. タイムアウトエラー
```typescript
// エラー: Request timeout
// 解決策: タイムアウト値を調整
const result = await researcher.execute(input, {
  timeout: 60000 // 60秒に延長
});
```

#### 3. 不完全なデータ
```typescript
// エラー: Incomplete data structure
// 解決策: バリデーションを強化
const validateOutput = (output: any): boolean => {
  return output.summary && 
         output.marketAnalysis && 
         output.sources.length > 0;
};
```

## 📚 関連ドキュメント

- [Ideator Agent](./ideator-agent.md)
- [Critic Agent](./critic-agent.md)
- [API仕様](../api/researcher-api.md)
- [LangGraph統合](../architecture/langgraph-integration.md)

## 🔄 更新履歴

- **v1.2.0** (2025-01-17): Serper API統合完了
- **v1.1.0** (2025-01-10): 並列検索実装
- **v1.0.0** (2025-01-08): 初期リリース