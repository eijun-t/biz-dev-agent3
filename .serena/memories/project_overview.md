# Project Overview

## プロジェクト概要
**biz-dev-agent3** - 自律型アイディエーションエージェントAI新事業創出支援システム

三菱地所の新事業創出を加速する自律型AIシステム。5つの専門エージェント（Broad Researcher、Ideator、Critic、Analyst、Writer）が協調して、市場調査からビジネスアイデア生成、評価、詳細分析、レポート作成までを完全自動化。

## 技術スタック
- **Frontend**: Next.js 15.4, React 19, TypeScript
- **Backend**: Supabase (PostgreSQL, Edge Functions)
- **AI/ML**: LangChain 0.3, LangGraph 0.4, OpenAI API
- **Styling**: Tailwind CSS 4.1
- **Testing**: Jest, Playwright
- **Package Manager**: npm

## ディレクトリ構造
```
/
├── app/              # Next.js App Router
├── components/       # React components
├── lib/
│   ├── agents/      # エージェント実装
│   │   ├── broad-researcher/
│   │   ├── ideator/
│   │   ├── critic/
│   │   ├── analyst/
│   │   ├── writer/
│   │   └── orchestration/
│   ├── services/    # 共通サービス
│   ├── types/       # TypeScript types
│   └── utils/       # Utilities
├── __tests__/       # テスト
├── supabase/        # Database migrations
└── .kiro/          # Spec-driven development
```

## エージェント構成
1. **Broad Researcher**: Web検索による情報収集（Serper API）
2. **Ideator**: ビジネスアイデア生成（5つの案を生成）
3. **Critic**: アイデア評価・選定（市場規模50点 + シナジー50点）
4. **Analyst**: 詳細市場分析（TAM/PAM/SAM分析、競合分析）
5. **Writer**: 構造化レポート生成（HTML形式、タブ構成）

## 要件
- 営業利益10億円規模の事業案を10分以内で生成
- 継続的な学習により日々精度を向上
- Row-Level Security (RLS)によるセキュアなデータアクセス
- 最大5つまでの並行処理をサポート