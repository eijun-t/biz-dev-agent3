# Requirements Document

## Project Overview
Broad Researcherエージェントの実装。autonomous-ideation-agentプロジェクトのTask 5として、Web検索を使用して情報収集を行う最初のエージェントを構築します。

## Project Description (User Input)
researcher-agent - Task 5: Broad Researcherエージェントの実装。

## Parent Specification Reference
> 親仕様: `.kiro/specs/autonomous-ideation-agent/tasks.md` - Task 5
> 
> このspecificationは、メインプロジェクトのTask 5「エージェントシステムのコア実装」の一部として、Broad Researcherエージェントを実装します。

## Requirements

### Requirement 1: Web検索サービスの実装
**User Story:** エージェントシステムとして、Serper APIを使用して日本市場および海外先端事例の包括的なWeb検索を実行したい

#### Acceptance Criteria

1. WHEN SerperSearchServiceがインスタンス化される THEN システムは 環境変数からAPIキーを読み込み、検証する SHALL
2. WHEN 検索クエリが実行される THEN システムは 日本市場向けの設定（gl=jp, hl=ja）で検索を実行する SHALL
8. WHEN 海外先端事例の検索が必要な場合 THEN システムは 英語での検索（gl=us, hl=en）を追加で実行する SHALL
9. WHERE 海外検索 THE SYSTEM SHALL 先進的な企業、スタートアップ、技術トレンドに焦点を当てた検索を行う
3. WHEN 同じクエリが再度実行される THEN システムは キャッシュから結果を返す（TTL: 1時間） SHALL
4. IF APIエラーが発生した場合 THEN システムは 最大2回までリトライを実行する SHALL
5. WHEN レート制限（1分100リクエスト）に達した場合 THEN システムは 適切な待機時間を設けて実行を継続する SHALL
6. WHERE 検索結果 THE SYSTEM SHALL タイトル、リンク、スニペット、ポジションを構造化データとして返す
7. WHEN タイムアウト（5秒）が発生した場合 THEN システムは エラーを記録し、空の結果セットを返す SHALL

### Requirement 2: Broad Researcherエージェントの実装
**User Story:** ビジネスアイデア生成システムとして、与えられたテーマに基づいて日本市場と海外先端事例の包括的な市場調査を自動実行したい

#### Acceptance Criteria

1. WHEN Broad Researcherエージェントが起動する THEN システムは BaseAgentクラスを継承した実装を使用する SHALL
2. WHEN テーマが入力される THEN システムは LLMを使用して8つの効果的な検索クエリを生成する SHALL（日本市場向け5つ、海外先端事例向け3つ）
3. WHERE 検索クエリ生成 THE SYSTEM SHALL 以下の観点を含むクエリを生成する:
   【日本市場向け】
   - 市場規模と成長性
   - 主要プレーヤーと競合状況
   - 最新トレンドと技術動向
   - 規制と政策動向
   - 顧客ニーズと課題
   【海外先端事例向け】
   - 革新的なスタートアップとユニコーン企業
   - 最先端技術の実装事例
   - グローバルトレンドとベストプラクティス
4. WHEN 検索クエリが生成される THEN システムは 並列で検索を実行する SHALL
5. WHEN 検索結果が収集される THEN システムは LLMを使用して結果を要約・統合する SHALL
6. IF エラーが発生した場合 THEN システムは エラーメッセージと共にAgentExecutionResultを返す SHALL
7. WHILE 処理が実行中 THE SYSTEM SHALL AgentMessageを通じて進捗を報告する

### Requirement 3: 検索結果の処理と統合
**User Story:** リサーチャーエージェントとして、収集した検索結果を構造化し、後続のエージェントが利用しやすい形式で提供したい

#### Acceptance Criteria

1. WHEN 検索結果が収集される THEN システムは 重複URLを除去する SHALL
2. WHEN 結果の要約が実行される THEN システムは 各検索結果から重要な情報を抽出する SHALL
3. WHERE 要約結果 THE SYSTEM SHALL 以下の構造でデータを返す:
   - theme: 調査テーマ
   - queries: 使用した検索クエリリスト（日本/海外別）
   - rawResults: 生の検索結果（日本/海外別）
   - summary: LLMによる統合要約
   - globalInsights: 海外先端事例から得られた知見
   - sources: ユニークな情報源リスト（日本/海外別）
4. WHEN 要約が生成される THEN システムは 市場規模、競合、トレンドなどのキーインサイトを抽出する SHALL
6. WHEN 海外事例が収集される THEN システムは 日本市場への適用可能性を分析する SHALL
5. IF 検索結果が不十分な場合 THEN システムは 追加の検索クエリを生成して再検索する SHALL

### Requirement 4: エージェントのテストとモニタリング
**User Story:** 開発者として、Broad Researcherエージェントの品質と性能を確保したい

#### Acceptance Criteria

1. WHEN ユニットテストが実行される THEN システムは 80%以上のカバレッジを達成する SHALL
2. WHERE テストケース THE SYSTEM SHALL 以下のシナリオをカバーする:
   - 正常な検索フロー
   - APIエラーハンドリング
   - レート制限処理
   - キャッシュ機能
   - タイムアウト処理
3. WHEN エージェントが実行される THEN システムは 実行時間、トークン使用量、API呼び出し数を記録する SHALL
4. IF パフォーマンス問題が検出された場合 THEN システムは 詳細なログを出力する SHALL
5. WHEN モックテストが実行される THEN システムは 外部API依存を排除してテストできる SHALL

### Requirement 5: 設定と環境管理
**User Story:** システム管理者として、Broad Researcherエージェントの設定を柔軟に管理したい

#### Acceptance Criteria

1. WHERE 環境変数 THE SYSTEM SHALL 以下の設定をサポートする:
   - SERPER_API_KEY: Serper APIキー
   - SERPER_API_TIMEOUT: タイムアウト設定（デフォルト: 5000ms）
   - SERPER_CACHE_TTL: キャッシュ有効期限（デフォルト: 3600000ms）
   - SERPER_MAX_RETRIES: 最大リトライ回数（デフォルト: 3）
2. WHEN 設定が不正な場合 THEN システムは 起動時に明確なエラーメッセージを表示する SHALL
3. IF APIキーが無効な場合 THEN システムは 詳細なエラー情報と設定手順を提供する SHALL
4. WHEN キャッシュがクリアされる THEN システムは すべての保存された検索結果を削除する SHALL

### Requirement 6: 既存システムとの統合
**User Story:** エージェントオーケストレーターとして、Broad Researcherエージェントを既存のシステムにシームレスに統合したい

#### Acceptance Criteria

1. WHEN エージェントが作成される THEN システムは BaseAgentContextを使用して初期化する SHALL
2. WHERE エージェント実行結果 THE SYSTEM SHALL AgentExecutionResult形式で返す
3. WHEN エージェントメッセージが生成される THEN システムは agent_logsテーブルに記録する SHALL
4. IF データベース接続エラーが発生した場合 THEN システムは 処理を継続し、ローカルログに記録する SHALL
5. WHEN エージェントが完了する THEN システムは 後続のIdeatorエージェントに必要なデータ構造を提供する SHALL

---
**STATUS**: Requirements generated
**NEXT STEP**: Review these requirements, then run `/kiro:spec-design researcher-agent` to generate the technical design