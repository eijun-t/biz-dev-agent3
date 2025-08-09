# Project Structure

## Root Directory Organization
```
biz-dev-agent3/
├── CLAUDE.md              # Claude Code configuration and instructions
├── README.md              # Project documentation
├── package.json           # Node.js dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── next.config.js         # Next.js configuration
├── tailwind.config.js     # TailwindCSS configuration
├── .env.local             # Local environment variables
├── postcss.config.js       # PostCSS configuration  
├── jest.config.js          # Jest configuration
├── jest.config.node.js     # Jest configuration for Node tests
├── jest.setup.js           # Jest setup file
├── middleware.ts           # Next.js middleware
├── .gitignore             # Git ignore patterns
│
├── app/                   # Next.js App Router
├── components/            # React components
├── lib/                   # Library code and utilities
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript type definitions
├── public/                # Static assets
├── scripts/               # Utility scripts
│   └── test-researcher-integration.ts  # 統合テストスクリプト
├── docs/                  # Project documentation
│   └── agents/            # Agent documentation
│       └── broad-researcher/
│           ├── README.md
│           ├── api-configuration.md
│           └── release-checklist.md
│
├── .claude/               # Claude Code extension
│   └── commands/          # Kiro slash commands
├── .kiro/                 # Kiro framework
│   ├── steering/          # Project context documents
│   └── specs/             # Feature specifications
└── supabase/              # Supabase configuration
    └── migrations/        # Database migrations
```

## Subdirectory Structures

### `app/` - Next.js App Router
```
app/
├── layout.tsx             # Root layout with providers
├── page.tsx               # Home page with auth links
├── globals.css            # Global styles
├── actions/               # Server actions
│   └── auth.ts            # Authentication actions
├── auth/                  # Authentication pages
│   ├── signin/            # Sign in page
│   │   └── page.tsx
│   └── signup/            # Sign up page
│       └── page.tsx
├── dashboard/             # Protected dashboard area
│   ├── layout.tsx         # Dashboard layout with auth check
│   └── page.tsx           # Dashboard main page
├── debug/                 # Debug pages
│   └── researcher/        # Researcher debug page
│       └── page.tsx
├── test-enhanced-researcher/  # Test page
│   └── page.tsx
└── api/                   # API routes
    ├── auth/              # Authentication API
    │   └── signout/       # Sign out endpoint
    │       └── route.ts
    ├── agents/            # Agent API endpoints
    │   ├── researcher/    # Researcher agent endpoint
    │   │   └── route.ts
    │   └── researcher-debug/  # Debug endpoint
    │       └── route.ts
    └── test-enhanced-researcher/  # Test endpoint
        └── route.ts
```

### `components/` - React Components
```
components/
├── auth/                  # Authentication components
│   ├── sign-in-form.tsx   # Sign in form with validation
│   └── sign-up-form.tsx   # Sign up form with validation
└── ui/                    # shadcn/ui components
    ├── alert.tsx
    ├── button.tsx
    ├── card.tsx
    ├── input.tsx
    ├── label.tsx
    ├── progress.tsx
    ├── spinner.tsx
    └── textarea.tsx
```

### `lib/` - Core Libraries [UPDATED: 2025-01-08]
```
lib/
├── interfaces/            # Core interfaces and abstractions
│   ├── base-agent.ts      # Base agent class
│   ├── database.ts        # Database service interface
│   ├── event-stream.ts    # Event streaming interface
│   ├── llm.ts            # LLM service interface
│   └── web-search.ts      # Web search service interface
├── agents/                # Agent implementations
│   └── broad-researcher/  # Broad Researcher Agent
│       ├── broad-researcher-agent.ts      # Agent v1
│       ├── broad-researcher-agent-v2.ts   # Agent v2 (深い分析)
│       ├── production-researcher-agent.ts # 本番環境用
│       ├── search-result-processor.ts     # 検索結果処理
│       ├── advanced-search-processor.ts   # 高度なLLM分析
│       ├── enhanced-output-generator.ts   # 拡張出力生成
│       ├── edge-logger.ts                 # Edge Functions用ロガー
│       ├── local-logger.ts                # ローカルロガー
│       ├── performance-monitor.ts         # パフォーマンス監視
│       └── errors.ts                      # エラー定義
├── services/              # Service implementations
│   ├── agent-logger.ts    # Agent logging service
│   ├── database.ts        # Supabase database service
│   └── serper/            # Serper API integration
│       └── serper-search-service.ts  # Serper APIサービス
├── utils/                 # Utility functions
│   └── rate-limiter.ts    # レートリミットユーティリティ
├── supabase/              # Supabase client and utilities
│   ├── client.ts          # Browser client
│   ├── server.ts          # Server client
│   └── middleware.ts      # Session middleware
├── types/                 # TypeScript type definitions
│   ├── database.ts        # Manual database types
│   ├── database.generated.ts # Generated Supabase types
│   ├── index.ts           # Core application types
│   ├── agents.ts          # Agent-specific types
│   └── search.ts          # Search-related types
├── validations/           # Zod validation schemas
│   ├── agent.ts           # Agent-related validations
│   ├── feedback.ts        # Feedback validations
│   ├── idea.ts           # Business idea validations
│   ├── search.ts          # Search validations
│   ├── session.ts        # Session validations
│   ├── user.ts           # User validations
│   └── index.ts          # Export aggregator
└── utils.ts              # Utility functions (cn)
```

### `__tests__/` - Test Files [UPDATED: 2025-01-08]
```
__tests__/
├── components/            # Component tests
│   └── auth/             # Authentication component tests
│       ├── sign-in-form.test.tsx
│       └── sign-up-form.test.tsx
├── agents/                # Agent tests
│   └── broad-researcher/  # Broad Researcher tests
│       ├── broad-researcher-agent.test.ts
│       ├── search-result-processor.test.ts
│       └── errors-and-performance.test.ts
├── services/              # Service tests
│   └── serper/            # Serper service tests
│       └── serper-search-service.test.ts
├── validations/          # Validation schema tests
│   ├── idea.test.ts
│   ├── session.test.ts
│   └── user.test.ts
├── basic-functionality-test.ts    # 基本機能テスト
├── mock-integration-test.ts       # モック統合テスト
└── simple-test.ts                 # シンプルテスト
```

### `supabase/` - Database Configuration
```
supabase/
├── migrations/            # SQL migration files
│   └── 20250108_initial_schema.sql  # Complete schema with RLS policies
├── seed.sql               # Initial data (empty for now)
└── config.toml            # Supabase local configuration
```

## Database Schema
```sql
-- Main tables
users                      -- ユーザープロファイル (auth.usersを拡張)
├── id (UUID)
├── email
├── name
├── created_at
└── updated_at

ideation_sessions          -- アイディエーションセッション
├── id (UUID)
├── user_id
├── status (initializing/researching/generating/analyzing/completed/error)
├── current_phase
├── progress (0-100)
├── created_at
├── updated_at
├── completed_at
└── error_message

business_ideas             -- 生成されたビジネスアイデア
├── id (UUID)
├── session_id
├── title
├── description
├── market_analysis
├── revenue_projection (BIGINT)
├── implementation_difficulty (low/medium/high)
├── time_to_market
├── required_resources (TEXT[])
├── risks (TEXT[])
├── opportunities (TEXT[])
└── created_at

idea_feedback              -- ユーザーフィードバック
├── id (UUID)
├── idea_id
├── user_id
├── score (1-5)
├── comment
└── created_at

agent_logs                 -- エージェント実行ログ
├── id (UUID)
├── session_id
├── agent_name (researcher/ideator/critic/analyst/writer)
├── message
├── data (JSONB)
└── created_at

system_logs                -- システムログ
├── id (UUID)
├── session_id
├── user_id
├── action
├── details (JSONB)
└── created_at
```

## File Naming Conventions
- **Components**: PascalCase (`ReportViewer.tsx`)
- **Utilities**: camelCase (`formatDate.ts`)
- **API Routes**: kebab-case folders (`/api/agent-runs`)
- **Database**: snake_case tables and columns
- **Environment**: SCREAMING_SNAKE_CASE

## Import Organization
```typescript
// 1. External imports
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

// 2. Internal absolute imports
import { Button } from '@/components/ui/button'
import { ReportService } from '@/lib/services/report-service'

// 3. Relative imports
import { formatDate } from './utils'

// 4. Type imports
import type { Report, Score } from '@/types'
```

## Key Architectural Principles
1. **Server-First**: Server Components by default, Client Components when needed
2. **Type Safety**: Strict TypeScript with generated Supabase types
3. **Edge Optimized**: API Routes run on Vercel Edge Runtime
4. **Modular Agents**: Each agent is independently testable
5. **Progressive Enhancement**: Works without JavaScript for critical paths
6. **Security by Design**: Row-Level Security and auth checks at every layer
7. **Cost Control**: Token tracking and API limits built-in