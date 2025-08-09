# Implementation Plan

## タスク概要
Ideatorエージェントの実装を段階的に進めるためのコード生成タスクです。各タスクはテスト駆動開発を採用し、既存のBroad Researcherエージェントとの統合を確実に行います。

- [x] 1. プロジェクト構造とコアインターフェースのセットアップ
  - lib/agents/ideator/ディレクトリを作成
  - 基本的な型定義とインターフェースをlib/types/ideator.tsに実装
  - BaseAgentクラスを拡張するための準備
  - Jestテスト環境の設定とモックファイルの準備
  - _Requirements: 1.1, 3.1, 4.1_

- [x] 2. データモデルのテスト駆動実装
- [x] 2.1 ビジネスアイデアモデルの作成
  - __tests__/types/ideator.test.tsにBusinessIdeaモデルのテストを作成
  - lib/types/ideator.tsにBusinessIdea、MarketOpportunity、CustomerPainインターフェースを実装
  - Zodスキーマによるバリデーションをlib/validations/ideator.tsに実装
  - _Requirements: 4.2, 4.3_

- [x] 2.2 IdeatorOutput型の実装と検証
  - IdeatorOutput型のテストケースを追加（5アイデア必須、メタデータ、品質メトリクス）
  - lib/types/ideator.tsにIdeatorOutput、メタデータ、品質メトリクス型を実装
  - 出力検証ロジックの実装とエッジケーステスト
  - _Requirements: 4.1, 4.2, 6.3_

- [x] 3. データアクセス層のテスト駆動実装
- [x] 3.1 市場機会抽出サービスの構築
  - __tests__/agents/ideator/creative-prompt-builder.test.tsを作成
  - lib/agents/ideator/creative-prompt-builder.tsにCreativePromptBuilderクラスを実装
  - extractOpportunities()、identifyCustomerPains()メソッドをテストファーストで実装
  - EnhancedOutputからの情報抽出ロジックを実装
  - _Requirements: 1.2, 2.1, 2.2_

- [x] 3.2 LLM統合サービスの実装
  - __tests__/agents/ideator/llm-integration-service.test.tsを作成
  - lib/agents/ideator/llm-integration-service.tsにLLMIntegrationServiceクラスを実装
  - invokeWithRetry()、invokeStructured()、trackTokenUsage()メソッドを実装
  - ChatOpenAI統合とリトライロジック（指数バックオフ）の実装
  - _Requirements: 3.1, 3.2, 3.3, 5.2_

- [x] 4. ビジネスロジック層のテスト駆動構築
- [x] 4.1 構造化出力ジェネレーターの実装
  - __tests__/agents/ideator/structured-output-generator.test.tsを作成
  - lib/agents/ideator/structured-output-generator.tsにStructuredOutputGeneratorクラスを実装
  - parseRawOutput()、ensureExactCount()、formatOutput()メソッドを実装
  - 5アイデアの保証ロジックとエラーハンドリングを実装
  - _Requirements: 1.3, 4.2, 4.4_

- [x] 4.2 エラーハンドリングとリトライマネージャーの実装
  - __tests__/agents/ideator/error-handler.test.tsを作成
  - lib/agents/ideator/errors.tsにIdeatorError、IdeatorErrorCodeを定義
  - lib/agents/ideator/error-handler.tsにErrorHandlerクラスを実装
  - handleWithRetry()、exponentialBackoff()、isNonRetryableError()メソッドを実装
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 4.3 品質検証バリデーターの実装
  - __tests__/agents/ideator/quality-validator.test.tsを作成
  - lib/agents/ideator/quality-validator.tsにQualityValidatorクラスを実装
  - 構造完全性、内容一貫性、市場機会明確性の検証ロジックを実装
  - 品質スコアリング（0-100）とアラート発行の実装
  - _Requirements: 6.1, 6.3, 6.5_

- [x] 5. メインエージェントクラスの統合実装
- [x] 5.1 IdeatorAgentクラスの基本実装
  - __tests__/agents/ideator/ideator-agent.test.tsを作成（モックLLM使用）
  - lib/agents/ideator/ideator-agent.tsにIdeatorAgentクラスを実装
  - BaseAgentを拡張し、generateIdeas()メインメソッドを実装
  - 依存サービスの注入とエラーハンドリングを実装
  - _Requirements: 1.1, 1.2, 1.4, 1.5_

- [x] 5.2 プロンプトエンジニアリングとLLM統合
  - 創造的プロンプトテンプレートの実装とテスト
  - temperature=0.7-0.8の設定と創造性・一貫性バランスの実装
  - gpt-4oモデルとの統合とトークン使用量追跡
  - プロンプトインジェクション対策の実装
  - _Requirements: 2.3, 3.2, 3.4, 3.5_

- [x] 5.3 Edge Functions互換性の確保
  - EdgeLoggerとの統合実装
  - fsモジュール依存の除去確認とメモリベース処理の実装
  - ステートレス処理の保証とメモリ使用量最適化（< 512MB）
  - Edge Functions制限への対応実装
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 6. APIエンドポイントと統合テスト
- [x] 6.1 APIルートの実装
  - app/api/agents/ideator/route.tsを作成
  - POSTエンドポイントの実装（/api/agents/ideator）
  - JWT認証ミドルウェアの統合
  - エラーレスポンスとステータスコードの実装
  - _Requirements: 4.1, 5.3, 5.4_

- [x] 6.2 Broad Researcherとの統合テスト
  - __tests__/agents/ideator/integration.test.tsを作成
  - 実際のBroad Researcher出力を使用した統合テスト
  - エンドツーエンドのアイデア生成フローテスト
  - 60秒以内の処理完了とメモリ使用量のテスト
  - _Requirements: 1.1, 5.1, 6.2_

- [x] 6.3 パフォーマンステストと最適化
  - __tests__/agents/ideator/performance.test.tsを作成
  - 並行実行テスト（10リクエスト同時実行）
  - レスポンスタイムの計測（p95 < 30秒、p99 < 60秒）
  - トークン使用量の最適化とキャッシング実装
  - _Requirements: 5.1, 5.5, 6.4_

- [x] 7. 最終統合とシステム全体の検証
- [x] 7.1 完全なアプリケーション統合
  - すべてのコンポーネントの接続確認
  - データベーステーブル（ideator_outputs、ideator_ideas）の作成
  - ログ記録とモニタリングの動作確認
  - エラーハンドリングの包括的テスト
  - _Requirements: 4.3, 4.4, 6.4_

- [x] 7.2 自動E2Eテストの実装
  - __tests__/e2e/ideator-flow.test.tsを作成
  - 完全なユーザーワークフローのテスト（調査→アイデア生成→検証）
  - 5アイデアの生成保証と品質基準の確認
  - システム全体の統合動作確認
  - _Requirements: 1.3, 1.4, 1.5, 6.5_