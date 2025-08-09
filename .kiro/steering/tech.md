# Technology Stack

## Architecture
**Application Type**: Full-stack Web Application  
**Architecture Pattern**: Multi-Agent System with Edge Functions  
**Deployment Model**: Serverless (Vercel + Supabase)

## Frontend Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI Components**: shadcn/ui
- **Styling**: TailwindCSS
- **State Management**: React Server Components + Client Components
- **Authentication**: Supabase Auth (Password-based)

## Backend Stack
- **Runtime**: Next.js API Routes (Edge Functions)
- **AI Framework**: LangChain + LangGraph
- **LLM Provider**: GPT-4o (configurable via environment variable)
- **Agent System**: 5 specialized agents orchestrated by LangGraph
  - Broad Researcher: Web検索・情報収集
    - SerperSearchService: Serper API統合（日本・海外市場検索）
    - SearchResultProcessor: 検索結果の構造化・分析
    - ProductionResearcherAgent: 本番環境用最適化版
    - EnhancedOutputGenerator: 詳細な出力データ生成
  - Ideator: ビジネスアイデア生成 [実装待ち]
  - Critic: 評価・選定 [実装待ち]
  - Analyst: 詳細市場分析 [実装待ち]
  - Writer: レポート作成 [実装待ち]

## Database & Storage
- **Database**: Supabase (PostgreSQL)
- **File Storage**: Supabase Storage
- **Authentication**: Supabase Auth
- **Security**: Row-Level Security (RLS)

## Development Environment
- **Package Manager**: npm/yarn/pnpm
- **Version Control**: GitHub (Private Repository)
- **CI/CD**: GitHub Actions
- **Development Tools**: ESLint, Prettier, TypeScript
- **Testing**: Jest, React Testing Library

## Common Commands

### Development
```bash
npm run dev              # 開発サーバー起動 (localhost:3000)
npm run build            # プロダクションビルド
npm run start            # プロダクションサーバー起動
npm run lint             # ESLint実行
npm run type-check       # TypeScriptチェック
npm run format           # Prettierでコードフォーマット
npm run test             # Jestテスト実行
npm run test:watch       # Jestテストをwatchモードで実行
```

### Database
```bash
npx supabase init        # Supabaseプロジェクト初期化
npx supabase db push     # マイグレーション適用
npm run db:types         # TypeScript型生成 (supabase gen types)
npx supabase start       # ローカルSupabase起動
npx supabase stop        # ローカルSupabase停止
```

### Deployment
```bash
vercel                   # Vercelへデプロイ
vercel --prod           # 本番環境へデプロイ
```

## Environment Variables
```env
# LLM Configuration
OPENAI_API_KEY=           # OpenAI APIキー
LLM_MODEL=gpt-4o          # 使用するLLMモデル

# Supabase
NEXT_PUBLIC_SUPABASE_URL=      # Supabase URL
NEXT_PUBLIC_SUPABASE_ANON_KEY= # Supabase公開キー
SUPABASE_SERVICE_ROLE_KEY=     # Supabaseサービスキー

# Application
NEXT_PUBLIC_APP_URL=      # アプリケーションURL
API_COST_LIMIT=3000       # 月額APIコスト上限（円）

# Web Search Configuration
SERPER_API_KEY=           # Serper API key
SERPER_API_TIMEOUT=5000   # API timeout in ms
SERPER_CACHE_TTL=3600000  # Cache TTL in ms (1 hour)
SERPER_MAX_RETRIES=3      # Max retry attempts
```

## Port Configuration
- **Development**: 3000 (Next.js)
- **Production**: Vercel自動割当

## Key Dependencies
```json
{
  "next": "^15.4.5",
  "react": "^19.1.1",
  "typescript": "^5.9.2",
  "@supabase/supabase-js": "^2.53.0",
  "@supabase/ssr": "^0.6.1",
  "@supabase/auth-helpers-nextjs": "^0.10.0",
  "@langchain/core": "^0.3.66",
  "@langchain/openai": "^0.6.3",
  "langchain": "^0.3.30",
  "openai": "^5.12.0",
  "tailwindcss": "^4.1.11",
  "zod": "^4.0.14",
  "lucide-react": "^0.536.0",
  "class-variance-authority": "^0.7.1",
  "jest": "^30.0.5",
  "@testing-library/react": "^16.3.0",
  "ts-jest": "^29.4.1"
}
```

## Development Patterns [UPDATED: 2025-01-08]
- **エージェント設計**: 
  - BaseAgent抽象クラスによる共通インターフェース
  - LangChain統合でLLM呼び出し
  - 独立したサービスクラス（SerperSearchService等）
- **エラーハンドリング**: 
  - リトライ機構（最大3回、指数バックオフ）
  - 詳細なエラーログ（EdgeLogger）
  - エラー隠蔽のフォールバック禁止
- **コスト管理**: 
  - トークン使用量監視（usage_metadata）
  - API呼び出し回数トラッキング
  - キャッシュによるAPI呼び出し削減
- **パフォーマンス最適化**:
  - インメモリキャッシュ（LRU、1時間TTL）
  - 並列検索実行
  - Edge Functions互換（fs依存なし）
- **レスポンシブデザイン**: A3横フォーマット最適化
- **セキュリティ**: CSRF対策、SSL、RLS有効化

## Performance Requirements
- **レポート生成時間**: < 10分（エンドツーエンド）
- **同時実行**: 最大5ループ並行処理
- **API応答**: Edge Functionsによる低レイテンシ
- **キャッシュ**: Vercel Edge Cache活用

## Current Implementation Status [UPDATED: 2025-01-08]
- ✅ **基盤インフラ**: Next.js, TypeScript, Supabase設定完了
- ✅ **認証システム**: パスワードベース認証実装済み
- ✅ **データモデル**: 型定義とバリデーション実装済み
- ✅ **テスト環境**: Jest + React Testing Library設定済み
- ✅ **Broad Researcher Agent**: 実装完了（v1、v2、Production版）
- ✅ **Web検索**: Serper API統合完了（キャッシュ機能付き）
- ✅ **LLM統合**: OpenAI/LangChain統合完了
- ✅ **Edge Functions対応**: fs依存を除去、Edge Runtime互換
- ✅ **エラーハンドリング**: リトライ機構、ロギング実装済み
- ✅ **出力強化**: EnhancedOutputGenerator実装済み
- 🚧 **Ideator Agent**: 実装待ち
- 🚧 **Critic Agent**: 実装待ち 
- 🚧 **Analyst Agent**: 実装待ち
- 🚧 **Writer Agent**: 実装待ち
- 🚧 **エージェントオーケストレーション**: LangGraph実装待ち
- 🚧 **レポート生成UI**: HTML形式レポート実装待ち