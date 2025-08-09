# Requirements Document - Ideator Agent

## Introduction
Ideatorエージェントは、自律型アイディエーションエージェントシステムの中核コンポーネントの一つです。Broad Researcherエージェントが収集した市場調査データを基に、三菱地所の事業ポートフォリオに適合する革新的なビジネスアイデアを5つ生成します。各アイデアは、営業利益10億円規模の実現可能性を持ち、具体的な顧客像、解決する課題、提供価値、収益構造を含む詳細な提案として構成されます。

## Requirements

### Requirement 1: ビジネスアイデア生成機能
**User Story:** システムとして、Broad Researcherの調査結果から市場機会を特定し、革新的なビジネスアイデアを生成したい

#### Acceptance Criteria

1. WHEN Ideatorエージェントが起動する THEN システムは Broad Researcherの出力データ（EnhancedOutputを含む）を入力として受け取る SHALL
2. WHEN 調査結果を分析する THEN システムは 以下の要素を抽出する SHALL：
   - 顧客の未解決課題（ペインポイント）
   - 市場のギャップ・機会
   - 技術トレンド・イノベーション
   - 規制変化・社会変化
3. WHEN アイデアを生成する THEN システムは 正確に5つのビジネスアイデアを生成する SHALL
4. IF 生成されたアイデアが5つ未満の場合 THEN システムは 再度生成を試みる SHALL
5. WHEN 各アイデアを構成する THEN システムは 以下の構造化された情報を含める SHALL：
   - タイトル（30文字以内）
   - 概要説明（200文字程度）
   - 想定顧客セグメント
   - 解決する顧客課題
   - 提供価値（バリュープロポジション）
   - 収益構造・ビジネスモデル

### Requirement 2: 革新的なビジネスアイデアの創出
**User Story:** システムとして、市場機会に基づいた革新的で実現可能なビジネスアイデアを生成したい

#### Acceptance Criteria

1. WHEN アイデアを生成する THEN システムは 市場トレンドと顧客ニーズのみに基づいて純粋にビジネス機会を探索する SHALL
2. WHEN 各アイデアを構築する THEN システムは 以下の要素に焦点を当てる SHALL：
   - 市場の未開拓領域
   - 新しい技術の活用可能性
   - 顧客の潜在的ニーズ
   - 競合他社が見落としている機会
3. WHEN ビジネスモデルを設計する THEN システムは 業界や企業の制約に囚われない自由な発想を優先する SHALL
4. WHEN 収益構造を提案する THEN システムは 営業利益10億円規模の実現可能性を市場規模とビジネスモデルの観点から検証する SHALL

### Requirement 3: LLM統合と生成品質管理
**User Story:** システム管理者として、高品質で一貫性のあるアイデア生成を確保したい

#### Acceptance Criteria

1. WHEN LLMを初期化する THEN システムは ChatOpenAI（gpt-4o）を使用する SHALL
2. WHEN プロンプトを構成する THEN システムは 以下の要素を含める SHALL：
   - Broad Researcherの調査結果サマリー
   - 抽出された事実とメトリクス
   - 識別されたエンティティと関係性
   - 市場機会と顧客ニーズの分析
3. WHEN 生成パラメータを設定する THEN システムは temperature=0.7-0.8を使用して創造性と一貫性のバランスを取る SHALL
4. IF LLMの出力が構造化されていない場合 THEN システムは 出力を解析して必要な構造に変換する SHALL
5. WHEN トークン使用量を記録する THEN システムは usage_metadataから正確なトークン数を取得する SHALL

### Requirement 4: 出力データ構造とインターフェース
**User Story:** 開発者として、次のエージェント（Critic）が処理しやすい標準化された出力形式が欲しい

#### Acceptance Criteria

1. WHEN アイデア生成が完了する THEN システムは IdeatorOutput型に準拠したデータ構造を返す SHALL
2. WHEN 各アイデアを出力する THEN システムは 以下の必須フィールドを含める SHALL：
   ```typescript
   {
     id: string,
     title: string,
     description: string,
     targetCustomers: string[],
     customerPains: string[],
     valueProposition: string,
     revenueModel: string,
     estimatedRevenue: number,
     implementationDifficulty: 'low' | 'medium' | 'high',
     marketOpportunity: string
   }
   ```
3. WHEN メタデータを含める THEN システムは 生成時刻、使用モデル、トークン使用量を記録する SHALL
4. IF エラーが発生した場合 THEN システムは 詳細なエラー情報を含むエラーオブジェクトを返す SHALL

### Requirement 5: パフォーマンスとエラーハンドリング
**User Story:** システム管理者として、安定した高速なアイデア生成処理を実現したい

#### Acceptance Criteria

1. WHEN アイデア生成を実行する THEN システムは 60秒以内に完了する SHALL
2. IF LLM APIがタイムアウトした場合 THEN システムは 最大2回までリトライする SHALL
3. WHEN エラーが発生する THEN システムは EdgeLoggerを使用してエラーを記録する SHALL
4. IF 入力データが不完全な場合 THEN システムは 明確なエラーメッセージを返す SHALL
5. WHEN メモリ使用量が閾値を超える THEN システムは ガベージコレクションを実行する SHALL

### Requirement 6: テスト可能性とモニタリング
**User Story:** 開発者として、アイデア生成品質を継続的に検証・改善したい

#### Acceptance Criteria

1. WHEN ユニットテストを実行する THEN システムは モックLLMレスポンスで動作を検証できる SHALL
2. WHEN 統合テストを実行する THEN システムは 実際のBroad Researcher出力でテストできる SHALL
3. WHEN アイデアの品質を評価する THEN システムは 以下の指標を計測する SHALL：
   - 構造の完全性（全必須フィールドの存在）
   - 内容の一貫性（矛盾の有無）
   - 市場機会の明確性
4. WHEN ログを出力する THEN システムは 構造化されたJSONログを生成する SHALL
5. IF アイデア生成の成功率が90%を下回る THEN システムは アラートを発行する SHALL

### Requirement 7: Edge Functions互換性
**User Story:** システム管理者として、Edge Functions環境で効率的に動作するエージェントを維持したい

#### Acceptance Criteria

1. WHEN デプロイする THEN システムは Node.js固有モジュール（fs、path等）を使用しない SHALL
2. WHEN ログを記録する THEN システムは EdgeLoggerのメモリベース実装を使用する SHALL
3. WHERE Edge Functions実行時 THE SYSTEM SHALL ステートレスな処理を保証する
4. WHEN 一時データを保存する THEN システムは メモリ内データ構造のみを使用する SHALL
5. IF Edge Functions制限に達した場合 THEN システムは gracefulに処理を終了する SHALL