# Implementation Plan

## Task 1: プロジェクト構造とコアインターフェース設定
- [x] 1.1 Writerエージェント用ディレクトリ構造を作成
  - `lib/agents/writer/`ディレクトリを作成
  - 必要なサブディレクトリ（types, services, components）を作成
  - `__tests__/agents/writer/`テストディレクトリを作成
  - _Requirements: 1.1, 1.5_

- [x] 1.2 TypeScript型定義とインターフェース作成
  - `lib/types/writer.ts`にWriterInput、HTMLReport、ReportSectionインターフェースを定義
  - `lib/types/report-metrics.ts`にReportMetricsインターフェースを定義
  - Zodスキーマを`lib/validations/writer.ts`に作成
  - _Requirements: 1.2, 8.1_

## Task 2: データモデルとバリデーション実装
- [x] 2.1 データベーススキーマ更新
  - `supabase/migrations/`にhtml_reportsテーブル作成マイグレーションを追加
  - agent_logsテーブルにgeneration_phase、completion_percentageカラムを追加
  - マイグレーションを実行してスキーマを更新
  - _Requirements: 1.5, 8.5_

- [x] 2.2 Zodバリデーションスキーマのテスト作成と実装
  - `__tests__/validations/writer.test.ts`でバリデーションテストを作成
  - WriterInputスキーマの検証（必須フィールド、型チェック）
  - HTMLReportスキーマの検証（円単位の数値フィールド）
  - _Requirements: 1.2, 8.4_

## Task 3: Writerエージェントコア実装
- [x] 3.1 BaseAgentを継承したWriterAgentクラスの実装
  - `lib/agents/writer/writer-agent.ts`にWriterAgentクラスを作成
  - BaseAgentクラスを継承し、processAnalysisDataメソッドを実装
  - エラーハンドリングとリトライ機構を実装
  - _Requirements: 1.1, 1.3, 1.4_

- [x] 3.2 WriterAgentのテスト作成
  - `__tests__/agents/writer/writer-agent.test.ts`でユニットテストを作成
  - 自動起動の検証、エラーハンドリングのテスト
  - 5秒以内の処理完了を検証
  - _Requirements: 1.3, 9.1_

## Task 4: データ統合サービス実装
- [x] 4.1 DataIntegrationServiceクラスの実装
  - `lib/agents/writer/services/data-integration-service.ts`を作成
  - 複数データソースの統合ロジックを実装
  - 通貨を円単位に統一する処理を実装（¥1,000,000形式）
  - _Requirements: 8.1, 8.4_

- [x] 4.2 DataIntegrationServiceのテスト作成
  - データ整合性検証のテスト
  - 通貨変換と円単位フォーマットのテスト
  - 欠落データ処理のテスト
  - _Requirements: 8.2, 8.3_

## Task 5: レポート生成サービス実装
- [x] 5.1 ReportGeneratorサービスの実装
  - `lib/agents/writer/services/report-generator.ts`を作成
  - 各セクション生成メソッドを並列処理で実装
  - 5秒以内のタイムアウト処理を追加
  - _Requirements: 1.3, 9.1_

- [x] 5.2 セクション生成ロジックの実装
  - generateSummary（300文字以内、円単位表記）
  - generateBusinessModel（4サブセクション）
  - generateMarketAnalysis（TAM/PAM/SAM円単位）
  - generateSynergy（スコア100点満点）
  - generateValidationPlan（3フェーズ）
  - _Requirements: 3.1-3.5, 4.1-4.5, 5.1-5.5, 6.1-6.5, 7.1-7.5_

## Task 6: React UIコンポーネント実装
- [x] 6.1 基礎UIコンポーネントの作成
  - `components/reports/ReportLayout.tsx`でメインレイアウトを実装
  - `components/reports/TabNavigation.tsx`でタブナビゲーションを実装
  - TailwindCSSでレスポンシブデザインを適用
  - _Requirements: 2.1, 2.4, 2.5_

- [x] 6.2 タブコンテンツコンポーネントの実装
  - `components/reports/tabs/SummaryTab.tsx`を作成
  - `components/reports/tabs/BusinessModelTab.tsx`を作成
  - `components/reports/tabs/MarketAnalysisTab.tsx`を作成
  - `components/reports/tabs/SynergyTab.tsx`を作成
  - `components/reports/tabs/ValidationPlanTab.tsx`を作成
  - _Requirements: 2.1, 2.3, 3.1-7.5_

- [x] 6.3 UIコンポーネントのテスト作成
  - `__tests__/components/reports/`でReact Testing Libraryを使用
  - タブ切り替えが0.1秒以内で動作することを検証
  - デフォルトでサマリータブがアクティブか確認
  - _Requirements: 2.2, 2.3_

## Task 7: APIエンドポイント実装
- [x] 7.1 Writer APIエンドポイントの作成
  - `app/api/agents/writer/route.ts`でPOSTエンドポイントを実装
  - 認証チェックとレート制限（10リクエスト/分）を追加
  - エラーレスポンスとステータスコード処理
  - _Requirements: 1.1, 1.2_

- [x] 7.2 レポート取得エンドポイントの実装
  - `app/api/reports/[id]/route.ts`でGETエンドポイントを実装
  - `app/api/reports/[id]/status/route.ts`でステータス確認エンドポイントを実装
  - Row Level Securityによるアクセス制御
  - _Requirements: 8.1_

- [x] 7.3 APIエンドポイントのテスト作成
  - 統合テストで全エンドポイントをテスト
  - 5秒以内のレスポンスタイムを検証
  - 認証とレート制限のテスト
  - _Requirements: 1.3, 9.1, 9.2_

## Task 8: ログと監視機能実装
- [x] 8.1 エージェントログ機能の実装
  - `lib/agents/writer/services/writer-logger.ts`を作成
  - agent_logsテーブルへの進捗記録（generation_phase、completion_percentage）
  - リアルタイムでの進捗更新処理
  - _Requirements: 1.5_

- [x] 8.2 パフォーマンス監視の実装
  - `lib/agents/writer/services/performance-monitor.ts`を作成
  - 生成時間の測定と記録
  - 95パーセンタイルで5秒以内の達成を監視
  - _Requirements: 9.1, 9.3_

## Task 9: エラーハンドリングとリトライ機構
- [x] 9.1 WriterErrorHandlerクラスの実装
  - `lib/agents/writer/errors.ts`でエラー型定義とハンドラーを作成
  - 部分生成コンテンツの保存処理
  - 最大3回のリトライ機構（指数バックオフ）
  - _Requirements: 1.4, 9.4_

- [x] 9.2 エラーハンドリングのテスト作成
  - タイムアウトエラーのテスト
  - 部分コンテンツ保存の検証
  - リトライ機構の動作確認
  - _Requirements: 1.4, 9.4_

## Task 10: 統合とE2Eテスト
- [x] 10.1 エージェント間統合の実装
  - Analystエージェントとの接続処理を実装
  - データフロー全体の統合テストを作成
  - セッション管理とトランザクション処理
  - _Requirements: 1.1, 8.3_

- [x] 10.2 E2Eテストの作成
  - `__tests__/e2e/writer-flow.test.ts`で完全なフローをテスト
  - Analystデータ受信からHTML表示までの検証
  - 5秒以内の完全なレポート生成を確認
  - 10件の並行処理をテスト
  - _Requirements: 1.3, 9.1, 9.2_

- [x] 10.3 最終統合と動作確認
  - 全コンポーネントの結合テスト
  - デスクトップ（1920px以上）とモバイルでの表示確認
  - パフォーマンス目標の達成確認（p95で5秒、p99で8秒）
  - _Requirements: 2.4, 2.5, 9.1_