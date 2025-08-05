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
├── .env.example           # Environment variables template
├── .gitignore             # Git ignore patterns
│
├── app/                   # Next.js App Router
├── components/            # React components
├── lib/                   # Library code and utilities
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript type definitions
├── public/                # Static assets
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
├── page.tsx               # Home/dashboard page
├── globals.css            # Global styles
├── (auth)/                # Authentication group
│   ├── login/             # Login page
│   └── register/          # Registration page
├── dashboard/             # Main application
│   ├── page.tsx           # Dashboard overview
│   ├── new/               # New ideation flow
│   ├── reports/           # Report listing and viewing
│   │   ├── page.tsx       # Reports list
│   │   └── [id]/          # Individual report
│   └── history/           # Historical data
└── api/                   # API routes
    ├── agents/            # Agent endpoints
    │   ├── route.ts       # Main orchestration
    │   └── [agent]/       # Individual agent routes
    └── reports/           # Report management
```

### `components/` - React Components
```
components/
├── ui/                    # shadcn/ui components
│   ├── button.tsx
│   ├── card.tsx
│   ├── form.tsx
│   └── ...
├── layout/                # Layout components
│   ├── header.tsx
│   ├── sidebar.tsx
│   └── footer.tsx
├── report/                # Report-specific components
│   ├── report-viewer.tsx
│   ├── report-sections/   # Individual sections
│   └── score-form.tsx
└── agents/                # Agent UI components
    ├── agent-status.tsx
    └── progress-bar.tsx
```

### `lib/` - Core Libraries
```
lib/
├── agents/                # LangGraph agent implementations
│   ├── graph.ts          # Main orchestration graph
│   ├── broad-researcher.ts
│   ├── ideator.ts
│   ├── critic.ts
│   ├── analyst.ts
│   └── writer.ts
├── langchain/             # LangChain configuration
│   ├── chains.ts
│   ├── prompts.ts
│   └── memory.ts
├── supabase/              # Supabase client and utilities
│   ├── client.ts
│   ├── server.ts
│   └── middleware.ts
├── utils/                 # Utility functions
│   ├── format.ts
│   ├── validation.ts
│   └── constants.ts
└── services/              # Business logic services
    ├── report-service.ts
    ├── score-service.ts
    └── auth-service.ts
```

### `types/` - TypeScript Definitions
```
types/
├── agents.ts              # Agent-related types
├── report.ts              # Report data structures
├── database.ts            # Database schema types
├── api.ts                 # API request/response types
└── supabase.ts            # Generated Supabase types
```

### `supabase/` - Database Configuration
```
supabase/
├── migrations/            # SQL migration files
│   ├── 001_initial_schema.sql
│   ├── 002_auth_setup.sql
│   └── 003_reports_table.sql
├── seed.sql               # Initial data
└── config.toml            # Supabase local config
```

## Database Schema
```sql
-- Main tables
reports                    -- 生成されたレポート
├── id
├── user_id
├── title
├── summary
├── content (JSON)
├── status
└── created_at

scores                     -- ユーザー評価
├── id
├── report_id
├── market_score (0-50)
├── synergy_score (0-50)
├── comment
└── created_at

agent_runs                 -- エージェント実行履歴
├── id
├── report_id
├── agent_name
├── input
├── output
├── tokens_used
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