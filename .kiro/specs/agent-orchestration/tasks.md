# Implementation Plan

## Task 1: プロジェクト構造とコアインターフェース定義

- [ ] 1.1 オーケストレーション用ディレクトリ構造の作成
  - lib/agents/orchestration/ディレクトリを作成
  - lib/services/ディレクトリ配下にjob-queue.ts、progress-tracker.tsを配置
  - lib/types/orchestration.tsで型定義ファイルを作成
  - __tests__/orchestration/ディレクトリでテスト構造を準備
  - _Requirements: 1.1, 2.1_

- [ ] 1.2 LangGraph依存関係のインストールと設定
  - package.jsonに@langchain/langgraph依存関係を追加
  - tsconfig.jsonでLangGraph型定義の設定を確認
  - Edge Runtime互換性の確認（fs依存がないことを確認）
  - _Requirements: 1.1, 6.1_

- [ ] 1.3 オーケストレーション用TypeScript型定義の作成
  - lib/types/orchestration.tsにGraphState、Job、Checkpoint、ProgressEvent型を定義
  - 各エージェントの出力型インターフェースを定義（ResearcherOutput等）
  - エラー型とリカバリーアクション型を定義
  - _Requirements: 2.1, 2.5_

## Task 2: データベーススキーマとマイグレーション実装

- [ ] 2.1 generation_jobsテーブルのマイグレーション作成
  - supabase/migrations/に新規マイグレーションファイルを作成
  - generation_jobsテーブルのCREATE文を実装（status、priority、input/output JSONB含む）
  - インデックス作成（status、user_id、created_at）
  - RLSポリシーの設定（user_idベースのアクセス制御）
  - _Requirements: 3.1, 6.1, 8.1_

- [ ] 2.2 checkpointsテーブルのマイグレーション作成
  - checkpointsテーブルのCREATE文を実装（state JSONB含む）
  - session_idとcreated_atの複合インデックス作成
  - RLSポリシーの設定（session経由のアクセス制御）
  - マイグレーションを実行してデータベースを更新
  - _Requirements: 6.1, 6.4, 8.3_

## Task 3: Zodスキーマとバリデーション実装

- [ ] 3.1 オーケストレーション用Zodスキーマの作成
  - lib/validations/orchestration.tsを作成
  - GraphStateSchema、JobInputSchema、ProgressEventSchemaを定義
  - 各エージェント入出力のバリデーションスキーマを作成
  - _Requirements: 2.2, 2.3_

- [ ] 3.2 バリデーションユニットテストの作成
  - __tests__/validations/orchestration.test.tsを作成
  - 正常系・異常系のバリデーションテストを実装
  - 型エラーメッセージの検証テストを追加
  - _Requirements: 2.3, 2.5_

## Task 4: StateManagerサービスの実装

- [ ] 4.1 StateManagerクラスの基本実装
  - lib/agents/orchestration/state-manager.tsを作成
  - validateInput、transformOutput、mergeStateメソッドを実装
  - serializeForCheckpointメソッドでJSONシリアライズを実装
  - _Requirements: 2.1, 2.2, 2.4_

- [ ] 4.2 StateManagerのユニットテスト作成
  - __tests__/orchestration/state-manager.test.tsを作成
  - 各メソッドの正常系テストを実装
  - エージェント間のデータ変換テストを追加
  - _Requirements: 2.3, 2.5_

## Task 5: JobQueueServiceの実装

- [ ] 5.1 JobQueueServiceクラスの基本実装
  - lib/services/job-queue.tsを作成
  - enqueue、dequeue、updateStatusメソッドを実装
  - FIFOキューロジックとpriority処理を実装
  - getActiveJobsで並行実行数チェック機能を追加
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 5.2 並行処理制御とキャンセル機能の実装
  - ConcurrencyControllerクラスを実装（MAX_CONCURRENT=5）
  - cancelJobメソッドで実行中ジョブの安全な停止を実装
  - waitForSlotメソッドでキュー待機処理を実装
  - _Requirements: 3.3, 3.7, 7.4_

- [ ] 5.3 JobQueueServiceの統合テスト作成
  - __tests__/services/job-queue.test.tsを作成
  - 並行実行制限のテスト（5ジョブ同時実行）
  - FIFO順序保証のテスト
  - キャンセル処理のテストを実装
  - _Requirements: 3.2, 3.3, 3.7_

## Task 6: LangGraph AgentGraphの実装

- [ ] 6.1 AgentGraphクラスの基本構造実装
  - lib/agents/orchestration/agent-graph.tsを作成
  - LangGraphのStateGraphを使用してエージェントノードを定義
  - Researcher → Ideator → Critic → Analyst → Writerの順序でedgeを設定
  - compileメソッドでグラフをコンパイル
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 6.2 エージェント実行とデータ受け渡しの実装
  - executeメソッドで各エージェントを順次実行
  - 各エージェント間でGraphStateを介してデータを受け渡し
  - current_phaseとprogressの更新ロジックを実装
  - agent_logsテーブルへの記録処理を追加
  - _Requirements: 1.2, 1.3, 1.5, 2.4_

- [ ] 6.3 チェックポイント機能の実装
  - checkpointメソッドで中間状態を保存
  - resumeメソッドでチェックポイントからの再開を実装
  - CheckpointerAdapterでSupabaseとの連携を実装
  - _Requirements: 6.1, 6.2, 6.3_

- [ ] 6.4 AgentGraphの統合テスト作成
  - __tests__/orchestration/agent-graph.test.tsを作成
  - エージェント実行順序のテスト
  - チェックポイントからの再開テスト
  - エラー時のリトライテストを実装
  - _Requirements: 1.1, 1.4, 5.1_

## Task 7: エラーハンドリングとリトライ機構実装

- [ ] 7.1 OrchestrationErrorHandlerクラスの実装
  - lib/agents/orchestration/error-handler.tsを作成
  - handleError、retry、shouldRetryメソッドを実装
  - 指数バックオフロジック（最大3回リトライ）を実装
  - エラーカテゴリ別の処理戦略を実装
  - _Requirements: 1.4, 5.1, 5.2_

- [ ] 7.2 ErrorRecoveryStrategyの実装
  - recoverメソッドでエラータイプ別のリカバリー戦略を実装
  - チェックポイントからの再開処理
  - 部分結果の保存処理
  - system_logsテーブルへのエラー記録
  - _Requirements: 5.3, 5.4, 5.5, 5.6_

- [ ] 7.3 エラーハンドリングの統合テスト
  - __tests__/orchestration/error-handler.test.tsを作成
  - 各エラータイプのリトライテスト
  - タイムアウト処理のテスト
  - 部分結果保存のテストを実装
  - _Requirements: 5.1, 5.3, 5.4_

## Task 8: ProgressTrackerとSSE配信実装

- [ ] 8.1 ProgressTrackerサービスの実装
  - lib/services/progress-tracker.tsを作成
  - startTracking、updateProgress、sendEventメソッドを実装
  - SSEイベントフォーマットの定義
  - 1秒ごとの定期更新処理を実装
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 8.2 SSE APIエンドポイントの実装
  - app/api/agents/jobs/[id]/stream/route.tsを作成
  - Server-Sent Eventsのレスポンスヘッダー設定
  - EventStreamの実装（Edge Runtime互換）
  - 接続管理とハートビート送信の実装
  - _Requirements: 4.1, 4.4, 4.6_

- [ ] 8.3 ProgressTrackerの統合テスト
  - __tests__/services/progress-tracker.test.tsを作成
  - イベント送信のテスト
  - 進捗更新のテスト
  - SSE接続切断・再接続のテストを実装
  - _Requirements: 4.2, 4.4, 4.5_

## Task 9: APIエンドポイント実装

- [ ] 9.1 ジョブ生成APIエンドポイントの実装
  - app/api/agents/generate/route.tsを作成
  - POSTハンドラーでジョブをキューに追加
  - Supabase Auth認証チェック
  - レート制限（10リクエスト/分）の実装
  - _Requirements: 8.1, 8.4, 8.5_

- [ ] 9.2 ジョブ管理APIエンドポイントの実装
  - app/api/agents/jobs/[id]/route.tsを作成（GET/DELETE）
  - app/api/agents/jobs/route.tsを作成（一覧取得）
  - RLSによるアクセス制御の確認
  - エラーレスポンスの標準化
  - _Requirements: 8.1, 8.2, 8.3_

- [ ] 9.3 API統合テストの作成
  - __tests__/api/agents/generate.test.tsを作成
  - __tests__/api/agents/jobs.test.tsを作成
  - 認証・認可のテスト
  - レート制限のテストを実装
  - _Requirements: 8.4, 8.5_

## Task 10: フロントエンドコンポーネント実装

- [ ] 10.1 ジョブ作成フォームコンポーネントの実装
  - components/orchestration/JobInitiator.tsxを作成
  - テーマ入力フォームとバリデーション
  - ジョブ作成APIの呼び出し
  - ローディング状態とエラーハンドリング
  - _Requirements: 1.1, 2.1_

- [ ] 10.2 進捗表示コンポーネントの実装
  - components/orchestration/ProgressDisplay.tsxを作成
  - EventSourceでSSE接続を確立
  - 各エージェントの進捗をリアルタイム表示
  - エラー時の再接続処理を実装
  - _Requirements: 4.1, 4.2, 4.4_

- [ ] 10.3 コンポーネント統合テストの作成
  - __tests__/components/orchestration/JobInitiator.test.tsxを作成
  - __tests__/components/orchestration/ProgressDisplay.test.tsxを作成
  - ユーザーインタラクションのテスト
  - SSE接続のモックテストを実装
  - _Requirements: 4.3, 4.5_

## Task 11: パフォーマンスモニタリング実装

- [ ] 11.1 PerformanceMonitorクラスの実装
  - lib/services/performance-monitor.tsを作成
  - メトリクス収集（処理時間、メモリ使用量、API呼び出し回数）
  - 95パーセンタイル計算機能
  - 閾値チェック機能（メモリ90%超過検知）
  - _Requirements: 7.1, 7.3, 7.4, 7.5_

- [ ] 11.2 パフォーマンステストの実装
  - __tests__/performance/orchestration.test.tsを作成
  - 単一ジョブの10分以内完了テスト
  - 5ジョブ並行実行の15分以内完了テスト
  - メモリリークチェックテスト
  - _Requirements: 7.1, 7.2, 7.3_

## Task 12: エンドツーエンド統合

- [ ] 12.1 全コンポーネントの統合実装
  - lib/agents/orchestration/index.tsでエクスポートを整理
  - 各エージェントとオーケストレーターの接続確認
  - データフロー全体の動作確認
  - エラーハンドリングパスの確認
  - _Requirements: 1.1, 1.2, 1.6, 1.7_

- [ ] 12.2 E2Eテストの実装
  - __tests__/e2e/orchestration-flow.test.tsを作成
  - テーマ入力から最終レポート生成までの完全フロー
  - エラー発生時のリカバリーフロー
  - 並行実行とキューイングのテスト
  - _Requirements: 1.6, 3.1-3.7, 7.1_

- [ ] 12.3 最終動作確認と調整
  - 全テストスイートの実行と確認
  - パフォーマンス目標の達成確認（10分以内）
  - セキュリティチェック（RLS、認証、レート制限）
  - Edge Runtime互換性の最終確認
  - _Requirements: 7.1, 7.5, 8.1-8.5_

---