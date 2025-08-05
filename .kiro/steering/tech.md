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
- **Authentication**: Supabase Auth (Passwordless Email)

## Backend Stack
- **Runtime**: Next.js API Routes (Edge Functions)
- **AI Framework**: LangChain + LangGraph
- **LLM Provider**: GPT-4o (configurable via environment variable)
- **Agent System**: 5 specialized agents orchestrated by LangGraph
  - Broad Researcher: Web検索・情報収集
  - Ideator: ビジネスアイデア生成
  - Critic: 評価・選定
  - Analyst: 詳細市場分析
  - Writer: レポート作成

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
- **Testing**: Jest, React Testing Library (MVP後)

## Common Commands

### Development
```bash
npm run dev              # 開発サーバー起動 (localhost:3000)
npm run build            # プロダクションビルド
npm run start            # プロダクションサーバー起動
npm run lint             # ESLint実行
npm run type-check       # TypeScriptチェック
```

### Database
```bash
npx supabase init        # Supabaseプロジェクト初期化
npx supabase db push     # マイグレーション適用
npx supabase gen types   # TypeScript型生成
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
  "next": "15.x",
  "react": "19.x",
  "typescript": "5.x",
  "@langchain/core": "latest",
  "@langchain/langgraph": "latest",
  "@langchain/openai": "latest",
  "@supabase/supabase-js": "2.x",
  "@supabase/auth-helpers-nextjs": "latest",
  "tailwindcss": "3.x",
  "@shadcn/ui": "latest"
}
```

## Development Patterns
- **エージェント設計**: LangGraphによる状態管理と遷移制御
- **エラーハンドリング**: リトライ機構（2回）　但しエラー隠蔽のフォールバックは禁止。エラーが出ていることを明示
- **コスト管理**: トークン使用量監視とAPI呼び出し上限
- **レスポンシブデザイン**: A3横フォーマット最適化
- **セキュリティ**: CSRF対策、SSL、RLS有効化

## Performance Requirements
- **レポート生成時間**: < 10分（エンドツーエンド）
- **同時実行**: 最大5ループ並行処理
- **API応答**: Edge Functionsによる低レイテンシ
- **キャッシュ**: Vercel Edge Cache活用