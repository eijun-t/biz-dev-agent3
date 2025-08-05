# Implementation Plan

- [x] 1. プロジェクトの初期セットアップとコアインターフェース定義
  - Next.js 15プロジェクトを作成し、必要な依存関係をインストール
  - TypeScript設定、ESLint、Prettierの設定を行う
  - 環境変数テンプレート（.env.example）を作成
  - shadcn/uiの初期設定とTailwindCSSの設定
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 2. Supabaseプロジェクトセットアップとデータベーススキーマ実装
- [x] 2.1 Supabaseプロジェクトの初期化とローカル開発環境構築
  - `supabase init`でローカルプロジェクトを初期化
  - 環境変数にSupabase URLとキーを設定
  - データベース接続をテストするスクリプトを作成
  - _Requirements: 6.1_

- [x] 2.2 認証とユーザー管理のデータベーススキーマ作成
  - migrations/001_initial_schema.sqlを作成
  - usersテーブル、reportsテーブル、scoresテーブル、agent_runsテーブルを定義
  - generation_jobsテーブルを追加
  - 必要なインデックスを作成
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2.3 Row-Level Security (RLS)ポリシーの実装
  - 各テーブルのRLSを有効化
  - ユーザーが自分のデータのみアクセスできるポリシーを作成
  - RLSポリシーのテストスクリプトを作成
  - _Requirements: 6.1, 6.2, 6.4_

- [x] 3. 型定義とデータモデルのテスト駆動実装
- [x] 3.1 TypeScript型定義ファイルの作成
  - types/user.ts、types/report.ts、types/score.tsを作成
  - types/agents.ts、types/database.ts、types/api.tsを作成
  - Supabaseから型を自動生成（`supabase gen types`）
  - _Requirements: 全般_

- [x] 3.2 データモデルのバリデーションとテスト実装
  - Zodスキーマを使用してバリデーションルールを定義
  - 各モデルのユニットテストを作成（__tests__/models/）
  - バリデーションエラーのテストケースを網羅
  - _Requirements: 1.2, 4.1_

- [x] 4. 認証システムのテスト駆動実装
- [x] 4.1 Supabase Auth統合とミドルウェア実装
  - lib/supabase/client.tsとserver.tsを作成
  - middleware.tsでセッション検証とCSRF対策を実装
  - 認証ヘルパー関数のテストを作成
  - _Requirements: 1.1, 1.3, 6.2_

- [x] 4.2 認証APIエンドポイントの実装
  - app/api/auth/signin/route.tsを作成（パスワード認証）
  - app/api/auth/signout/route.tsを作成
  - app/api/auth/session/route.tsを作成
  - 各エンドポイントの統合テストを作成
  - _Requirements: 1.2, 1.5_

- [x] 4.3 認証UIコンポーネントの実装
  - components/auth/LoginForm.tsxを作成（shadcn/ui使用）
  - components/auth/AuthGuard.tsxを作成
  - コンポーネントテストを実装（React Testing Library）
  - _Requirements: 1.1, 1.4_

- [ ] 5. エージェントシステムのコア実装
- [ ] 5.1 LangGraphとLangChainの基本設定
  - lib/langchain/config.tsでLLM設定を実装
  - lib/langchain/memory.tsでメモリ管理を実装
  - 環境変数からOpenAI APIキーを読み込む設定
  - _Requirements: 3.6, 5.4_

- [ ] 5.2 Web検索サービス（Serper API）の実装
  - lib/services/web-search.tsを作成
  - SerperSearchServiceクラスを実装（キャッシュ機能付き）
  - レート制限とリトライロジックを実装
  - Web検索サービスのユニットテストを作成
  - _Requirements: 3.1_

- [ ] 5.3 Broad Researcherエージェントの実装
  - lib/agents/broad-researcher.tsを作成
  - 検索クエリ生成と並列検索実行を実装
  - 検索結果の要約と統合機能を実装
  - エージェントのユニットテストを作成
  - _Requirements: 3.1_

- [ ] 5.4 Ideatorエージェントの実装
  - lib/agents/ideator.tsを作成
  - 5つのビジネスアイデア生成ロジックを実装
  - リサーチ結果を基にしたアイデア生成
  - エージェントのユニットテストを作成
  - _Requirements: 3.2_

- [ ] 5.5 Criticエージェントの実装
  - lib/agents/critic.tsを作成
  - 市場規模（50点）とシナジー（50点）の評価ロジック
  - 最高評価アイデアの選定機能
  - エージェントのユニットテストを作成
  - _Requirements: 3.3_

- [ ] 5.6 Analystエージェントの実装
  - lib/agents/analyst.tsを作成
  - TAM/PAM/SAM分析機能を実装
  - 競合分析機能を実装
  - エージェントのユニットテストを作成
  - _Requirements: 3.4_

- [ ] 5.7 Writerエージェントの実装
  - lib/agents/writer.tsを作成
  - HTML形式のレポート生成機能
  - 5つのタブセクション構成の実装
  - エージェントのユニットテストを作成
  - _Requirements: 3.5, 4.1_

- [ ] 6. LangGraphオーケストレーションの実装
- [ ] 6.1 エージェントグラフとステートマシンの構築
  - lib/agents/graph.tsを作成
  - 5つのエージェントの実行順序を定義
  - 状態遷移とエラーハンドリングを実装
  - _Requirements: 2.2, 2.5, 2.6, 3.6_

- [ ] 6.2 ジョブキューと並行処理管理の実装
  - lib/services/job-queue.tsを作成
  - 最大5つの並行処理制限を実装
  - キューイングシステムのテストを作成
  - _Requirements: 7.1, 7.2_

- [ ] 6.3 進捗トラッキングとSSE配信の実装
  - lib/services/progress-tracker.tsを作成
  - エージェント実行履歴の記録機能
  - Server-Sent Eventsでの進捗配信
  - _Requirements: 2.4, 3.6_

- [ ] 7. APIエンドポイントの実装
- [ ] 7.1 エージェント生成APIの実装
  - app/api/agents/generate/route.tsを作成
  - コスト上限チェック機能を実装
  - ジョブ開始と状態管理
  - APIエンドポイントの統合テストを作成
  - _Requirements: 2.1, 2.2, 2.3, 3.7_

- [ ] 7.2 ジョブ管理APIの実装
  - app/api/agents/jobs/[id]/route.tsを作成
  - app/api/agents/jobs/[id]/stream/route.tsを作成（SSE）
  - ジョブキャンセル機能を実装
  - _Requirements: 2.4, 2.8, 2.9, 2.10_

- [ ] 7.3 レポート管理APIの実装
  - app/api/reports/route.tsを作成（一覧取得）
  - app/api/reports/[id]/route.tsを作成（詳細取得）
  - RLSによるアクセス制御の確認
  - _Requirements: 4.2, 4.3_

- [ ] 7.4 スコア管理APIの実装
  - app/api/reports/[id]/score/route.tsを作成
  - app/api/reports/[id]/scores/route.tsを作成
  - 統計処理と学習データ更新機能
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 8. フロントエンドUIコンポーネントの実装
- [ ] 8.1 基盤UIコンポーネントの作成
  - components/ui/以下にshadcn/uiコンポーネントを設定
  - components/layout/Header.tsx、Sidebar.tsxを作成
  - レイアウトコンポーネントのテストを作成
  - _Requirements: 全般_

- [ ] 8.2 ダッシュボードページの実装
  - app/dashboard/page.tsxを作成
  - components/dashboard/DashboardStats.tsxを作成
  - 「新規作成」ボタンとナビゲーション
  - _Requirements: 1.4, 2.1_

- [ ] 8.3 アイデア生成フォームの実装
  - app/dashboard/new/page.tsxを作成
  - components/ideation/IdeationForm.tsxを作成
  - テーマ入力と自動選定オプション
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 8.4 進捗表示コンポーネントの実装
  - components/agents/ProgressTracker.tsxを作成
  - components/agents/AgentStatus.tsxを作成
  - SSEによるリアルタイム更新機能
  - _Requirements: 2.4_

- [ ] 8.5 レポート表示コンポーネントの実装
  - components/report/ReportViewer.tsxを作成
  - components/report/ReportTabs.tsxを作成
  - 5つのタブセクションの実装
  - _Requirements: 4.1_

- [ ] 8.6 レポート一覧と履歴管理の実装
  - app/dashboard/reports/page.tsxを作成
  - components/report/ReportList.tsxを作成
  - フィルタリングと並び替え機能
  - _Requirements: 4.2, 4.3, 4.4_

- [ ] 8.7 評価フォームの実装
  - components/report/ScoreForm.tsxを作成
  - 市場スコアとシナジースコアの入力UI
  - コメント入力と保存機能
  - _Requirements: 5.1, 5.2_

- [ ] 9. 統合とエンドツーエンドテスト
- [ ] 9.1 全コンポーネントの統合
  - app/layout.tsxでプロバイダー設定
  - 認証ガードの適用
  - エラーバウンダリーの設定
  - _Requirements: 全般_

- [ ] 9.2 エンドツーエンドテストの実装
  - e2e/auth.spec.tsを作成（認証フロー）
  - e2e/ideation.spec.tsを作成（アイデア生成フロー）
  - e2e/report.spec.tsを作成（レポート管理）
  - e2e/score.spec.tsを作成（評価フロー）
  - _Requirements: 全要件の統合確認_

- [ ] 9.3 パフォーマンステストの実装
  - tests/performance/load-test.jsを作成（k6使用）
  - 並行生成テストシナリオ
  - スパイクテストシナリオ
  - _Requirements: 7.3, 7.4, 7.5_

- [ ] 10. 最終統合と本番準備
- [ ] 10.1 環境変数とセキュリティ設定の確認
  - .env.exampleの完成
  - セキュリティヘッダーの設定確認
  - APIキーのバリデーション
  - _Requirements: 6.1, 6.2, 6.3, 6.5_

- [ ] 10.2 エラーハンドリングとリトライ機構の最終確認
  - 全エラーパターンのテスト
  - ユーザーフレンドリーなエラーメッセージ
  - ログ収集の設定
  - _Requirements: 2.5, 2.6, 2.10_

- [ ] 10.3 CI/CDパイプラインの設定
  - .github/workflows/test.ymlを作成
  - 自動テスト実行の設定
  - ビルドとデプロイの自動化
  - _Requirements: 8.5, 8.6_