# Requirements Document

## Introduction
LangGraphを使用したマルチエージェントオーケストレーションシステムの実装要件。5つの独立したエージェント（Researcher、Ideator、Critic、Analyst、Writer）を統合し、エンドツーエンドの自動実行を実現する。本システムにより、テーマ入力から最終レポート生成まで完全自動化され、10分以内でビジネスアイデアの調査・生成・評価・分析・文書化が完了する。

## Requirements

### Requirement 1: エージェントグラフとステートマシン構築
**User Story:** オペレーターとして、5つのエージェントが正しい順序で実行され、データが適切に受け渡されることを確認したい

#### Acceptance Criteria

1. WHEN システムがテーマを受け取った THEN システムはResearcher → Ideator → Critic → Analyst → Writerの順序でエージェントを実行する SHALL
2. IF 前のエージェントが正常終了した THEN 次のエージェントは前のエージェントの出力データを入力として受け取る SHALL
3. WHEN エージェントが処理を開始した THEN システムは現在のフェーズをideation_sessionsテーブルのcurrent_phaseに記録する SHALL
4. IF エージェント実行中にエラーが発生した THEN システムはエラー内容をagent_logsテーブルに記録し、リトライを試みる SHALL
5. WHILE エージェントが実行中である間 THE SYSTEM SHALL 進捗率をideation_sessionsテーブルのprogressフィールドに更新し続ける
6. WHEN 全エージェントが正常完了した THEN システムはセッションステータスを'completed'に更新し、completed_atを記録する SHALL
7. IF 2回のリトライ後もエラーが解消しない場合 THEN システムはセッションステータスを'error'に更新し、error_messageを記録する SHALL

### Requirement 2: データフロー管理と型安全性
**User Story:** 開発者として、各エージェント間のデータ受け渡しが型安全で検証可能であることを確認したい

#### Acceptance Criteria

1. WHEN ResearcherがWeb検索結果を出力した THEN システムはResearchOutputTypeの型で検証を行う SHALL
2. WHEN IdeatorがResearcherの出力を受け取る THEN システムはZodスキーマによる入力検証を実行する SHALL
3. IF 入力データが型検証に失敗した THEN システムは詳細なエラーメッセージをログに記録し、処理を停止する SHALL
4. WHEN 各エージェントがデータを出力する THEN システムはagent_logsテーブルにJSONB形式でデータを保存する SHALL
5. WHERE エージェント間のインターフェースが定義されている場所 THE SYSTEM SHALL TypeScript型定義とZodスキーマの両方を提供する

### Requirement 3: ジョブキューと並行処理管理
**User Story:** システム管理者として、複数のユーザーが同時に処理を実行しても、システムリソースが適切に管理されることを確認したい

#### Acceptance Criteria

1. WHEN 新しいジョブがキューに追加された THEN システムは現在実行中のジョブ数を確認する SHALL
2. IF 実行中のジョブが5つ未満の場合 THEN システムは即座に新しいジョブの処理を開始する SHALL
3. IF 実行中のジョブが5つに達している場合 THEN システムは新しいジョブをFIFO順でキューに追加し、待機させる SHALL
4. WHEN ジョブが完了またはエラーで終了した THEN システムはキューから次のジョブを取り出し、処理を開始する SHALL
5. WHILE ジョブが待機中 THE SYSTEM SHALL generation_jobsテーブルのstatusを'queued'として維持する
6. WHEN ジョブの処理が開始された THEN システムはstatusを'processing'に更新し、started_atを記録する SHALL
7. IF ユーザーがジョブのキャンセルを要求した場合 THEN システムは実行中の処理を安全に停止し、statusを'cancelled'に更新する SHALL

### Requirement 4: リアルタイム進捗追跡とSSE配信
**User Story:** エンドユーザーとして、処理の進捗をリアルタイムで確認し、各エージェントの実行状況を把握したい

#### Acceptance Criteria

1. WHEN ジョブの処理が開始された THEN システムはServer-Sent Events接続を確立する SHALL
2. WHILE エージェントが処理中 THE SYSTEM SHALL 最低1秒ごとに進捗更新イベントをSSEで配信する
3. WHEN エージェントが切り替わった THEN システムは新しいフェーズ名と進捗率0%をSSEイベントで通知する SHALL
4. IF SSE接続が切断された場合 THEN システムは処理を継続し、再接続時に最新状態を送信する SHALL
5. WHEN エージェントが重要なマイルストーンに到達した THEN システムは詳細メッセージを含むイベントを配信する SHALL
6. WHERE クライアントがSSEエンドポイントに接続する場所 THE SYSTEM SHALL /api/agents/jobs/[id]/streamパスでアクセスを提供する

### Requirement 5: エラーハンドリングとリカバリー
**User Story:** システム運用者として、エラーが発生しても適切にリカバリーし、ユーザーへの影響を最小限に抑えたい

#### Acceptance Criteria

1. WHEN エージェント実行中にエラーが発生した THEN システムは指数バックオフで最大3回リトライを試みる SHALL
2. IF OpenAI APIがレート制限エラーを返した場合 THEN システムは適切な待機時間後に自動的にリトライする SHALL
3. WHEN タイムアウトが発生した場合（10分超過） THEN システムは処理を停止し、部分的な結果を保存する SHALL
4. IF 特定のエージェントで連続してエラーが発生した場合 THEN システムはそのエージェントをスキップし、次のエージェントに進む設定オプションを提供する SHALL
5. WHILE エラーリトライ中 THE SYSTEM SHALL エラー詳細とリトライ回数をsystem_logsテーブルに記録する
6. WHEN 致命的エラーが発生した場合 THEN システムは管理者に通知し、デバッグ情報を収集する SHALL

### Requirement 6: 状態管理と永続化
**User Story:** 開発者として、システムの状態が適切に管理され、障害時でも復旧可能であることを確認したい

#### Acceptance Criteria

1. WHEN エージェントが処理を完了した THEN システムはその出力をSupabaseデータベースに永続化する SHALL
2. IF システムが予期せず停止した場合 THEN 再起動時に中断したポイントから処理を再開できる SHALL
3. WHILE 処理が進行中 THE SYSTEM SHALL 各エージェントの入出力データをagent_logsテーブルに記録する
4. WHEN セッションの状態が変更された THEN システムはideation_sessionsテーブルのupdated_atを更新する SHALL
5. WHERE 中間データが保存される場所 THE SYSTEM SHALL JSONB形式で構造化データを保存し、検索可能にする

### Requirement 7: パフォーマンスとスケーラビリティ
**User Story:** プロダクトオーナーとして、システムが要求されたパフォーマンス基準を満たすことを確認したい

#### Acceptance Criteria

1. WHEN 単一のジョブが実行された THEN システムは10分以内に全エージェントの処理を完了する SHALL
2. IF 5つのジョブが並行実行されている場合 THEN 各ジョブは15分以内に完了する SHALL
3. WHILE システムが稼働中 THE SYSTEM SHALL 95パーセンタイルで応答時間1秒未満を維持する
4. WHEN メモリ使用量が閾値（90%）を超えた場合 THEN システムは新規ジョブの受付を一時停止する SHALL
5. WHERE パフォーマンスメトリクスが記録される場所 THE SYSTEM SHALL 処理時間、メモリ使用量、API呼び出し回数を監視する

### Requirement 8: セキュリティとアクセス制御
**User Story:** セキュリティ管理者として、ユーザーデータが適切に保護され、認証されたユーザーのみがアクセスできることを確認したい

#### Acceptance Criteria

1. WHEN ユーザーがジョブを作成した THEN システムはそのユーザーIDをジョブに関連付ける SHALL
2. IF 別のユーザーがジョブの詳細にアクセスしようとした場合 THEN システムはアクセスを拒否し、403エラーを返す SHALL
3. WHERE データベースアクセスが発生する場所 THE SYSTEM SHALL Row-Level Security (RLS)ポリシーを適用する
4. WHEN APIエンドポイントが呼び出された THEN システムはSupabase Authによる認証を検証する SHALL
5. IF 認証トークンが無効または期限切れの場合 THEN システムは401エラーを返し、再認証を要求する SHALL

---