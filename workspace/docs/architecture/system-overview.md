# システムアーキテクチャ概要

## 🎯 システム設計思想

### 基本原則
1. **自律性**: 各エージェントが独立して動作
2. **協調性**: エージェント間の効率的な連携
3. **拡張性**: 新規エージェントの追加が容易
4. **信頼性**: エラー処理とリトライ機構
5. **観測可能性**: 処理状況の可視化

## 🏗️ 4層アーキテクチャ

### Layer 1: プレゼンテーション層
```
┌─────────────────────────────────────────────┐
│          Next.js App Router (v15)           │
│  ┌─────────────────────────────────────┐   │
│  │    React Server Components          │   │
│  │    Client Components                │   │
│  │    Streaming UI                     │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

**責務**:
- ユーザーインタラクション
- リアルタイム更新
- レスポンシブUI

**技術スタック**:
- Next.js 15 (App Router)
- React 19
- Tailwind CSS
- shadcn/ui

### Layer 2: API層
```
┌─────────────────────────────────────────────┐
│            API Routes (Edge)                │
│  ┌─────────────────────────────────────┐   │
│  │  /api/agents/execute                │   │
│  │  /api/agents/[agent]/run            │   │
│  │  /api/projects                      │   │
│  │  /api/reports                       │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

**責務**:
- HTTPリクエスト処理
- 認証・認可
- レート制限
- エラーハンドリング

**エンドポイント設計**:
- RESTful API
- Edge Runtime対応
- ストリーミングレスポンス

### Layer 3: オーケストレーション層
```
┌─────────────────────────────────────────────┐
│           LangGraph Workflow                 │
│  ┌─────────────────────────────────────┐   │
│  │    State Management                 │   │
│  │    Workflow Definition              │   │
│  │    Agent Coordination               │   │
│  │    Error Recovery                   │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

**責務**:
- ワークフロー管理
- 状態遷移制御
- エージェント間通信
- 並列処理制御

**LangGraphワークフロー**:
```typescript
const workflow = new StateGraph({
  nodes: {
    research: researcherNode,
    ideate: ideatorNode,
    critique: criticNode,
    analyze: analystNode,
    write: writerNode
  },
  edges: [
    ['research', 'ideate'],
    ['ideate', 'critique'],
    ['critique', 'analyze'],
    ['critique', 'write'],
    ['analyze', 'write']
  ]
});
```

### Layer 4: エージェント層
```
┌─────────────────────────────────────────────┐
│              Agent Instances                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │Researcher│ │ Ideator  │ │  Critic  │   │
│  └──────────┘ └──────────┘ └──────────┘   │
│  ┌──────────┐ ┌──────────┐                │
│  │ Analyst  │ │  Writer  │                │
│  └──────────┘ └──────────┘                │
└─────────────────────────────────────────────┘
```

**各エージェントの実装パターン**:
```typescript
interface Agent {
  id: string;
  name: string;
  description: string;
  execute(input: AgentInput): Promise<AgentOutput>;
  validate(input: AgentInput): ValidationResult;
  handleError(error: Error): ErrorResponse;
}
```

## 📊 データフロー

### 1. リクエストフロー
```
User Input
    ↓
Next.js Frontend
    ↓
API Route Handler
    ↓
LangGraph Orchestrator
    ↓
Agent Execution
    ↓
Result Aggregation
    ↓
Response to User
```

### 2. エージェント間通信
```
Researcher → Market Data
    ↓
Ideator ← Market Data
    ↓
Ideas → Critic
    ↓
Selected Ideas → Analyst & Writer
    ↓
Final Report
```

## 🔄 状態管理

### グローバル状態
```typescript
interface WorkflowState {
  projectId: string;
  phase: 'research' | 'ideation' | 'evaluation' | 'analysis' | 'writing';
  agents: {
    [agentId: string]: {
      status: 'idle' | 'running' | 'completed' | 'error';
      output?: any;
      error?: Error;
    };
  };
  results: {
    research?: ResearchResult;
    ideas?: Idea[];
    selectedIdeas?: Idea[];
    analysis?: AnalysisResult;
    report?: Report;
  };
}
```

### エージェント状態
```typescript
interface AgentState {
  input: any;
  processing: boolean;
  output?: any;
  error?: Error;
  retryCount: number;
  executionTime?: number;
}
```

## 🔐 セキュリティ設計

### 認証・認可
- Supabase Auth
- Row Level Security (RLS)
- JWT トークン管理

### API保護
- Rate Limiting
- CORS設定
- Input Validation
- SQL Injection防止

### シークレット管理
- 環境変数
- Vercel環境変数
- Supabase Vault（検討中）

## ⚡ パフォーマンス最適化

### フロントエンド
- React Server Components
- Dynamic Imports
- Image Optimization
- Code Splitting

### バックエンド
- Edge Functions
- Connection Pooling
- Response Caching
- Parallel Processing

### データベース
- インデックス最適化
- クエリ最適化
- Prepared Statements

## 📈 スケーラビリティ

### 水平スケーリング
- Vercel自動スケーリング
- Supabase Pro/Team プラン
- Redis Cache（将来）

### 垂直スケーリング
- Function Memory増加
- Timeout延長
- Concurrent Execution

## 🔍 監視とログ

### モニタリング
- Vercel Analytics
- Error Tracking (Sentry検討中)
- Custom Metrics

### ログ管理
```typescript
logger.info('Agent execution started', {
  agentId,
  projectId,
  timestamp
});
```

## 🚀 デプロイメント

### 環境構成
- Development: localhost
- Staging: vercel preview
- Production: vercel production

### CI/CD パイプライン
```yaml
- Build → Test → Deploy
- Automatic rollback
- Blue-Green deployment
```

## 📚 技術的決定事項

### なぜNext.js 15？
- App Router の成熟
- React Server Components
- Edge Runtime サポート
- Vercel統合

### なぜLangGraph？
- 複雑なワークフロー管理
- 状態管理の簡潔性
- エラーリカバリ
- 並列処理サポート

### なぜSupabase？
- リアルタイムサポート
- 組み込み認証
- PostgreSQL
- Edge Functions