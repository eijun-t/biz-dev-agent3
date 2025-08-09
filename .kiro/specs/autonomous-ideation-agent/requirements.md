# Requirements Document

## Introduction
本システムは、三菱地所の新事業創出を加速する自律型アイディエーションエージェントAIです。5つの専門エージェント（Broad Researcher、Ideator、Critic、Analyst、Writer）が協調して、市場調査からビジネスアイデア生成、評価、詳細分析、レポート作成までを完全自動化します。営業利益10億円規模の事業案を10分以内で生成し、継続的な学習により日々精度を向上させる革新的なシステムです。

## Requirements

### Requirement 1: 認証・ユーザー管理
**User Story:** 三菱地所の新事業担当者として、安全にシステムにアクセスし、自分の生成履歴を管理したい

#### Acceptance Criteria

1. WHEN ユーザーがシステムに初回アクセスする THEN システムは メールアドレスによるパスワード認証を要求する SHALL
2. WHEN ユーザーがメールアドレスとパスワードを入力する THEN システムは ユーザーをダッシュボードにリダイレクトする SHALL
3. WHEN 未認証ユーザーが保護されたページにアクセスする THEN システムは ログインページにリダイレクトする SHALL
4. IF ユーザーがログインしている THEN システムは ユーザー専用のダッシュボードを表示する SHALL
5. WHEN ユーザーがログアウトする THEN システムは セッションを終了し、ログインページに遷移する SHALL

### Requirement 2: ビジネスアイデア生成フロー
**User Story:** 新事業担当者として、テーマを入力して自動的にビジネスアイデアを生成したい

#### Acceptance Criteria

1. WHEN ユーザーがダッシュボードで「新規作成」をクリックする THEN システムは アイデア生成開始画面を表示する SHALL
2. WHEN ユーザーがテーマや条件などを入力して生成を開始する THEN システムは 入力されたテーマや条件を基に自律的な処理を開始する SHALL
3. IF ユーザーがテーマを入力しない場合 THEN システムは AIが自動的にテーマを選定して処理を開始する SHALL
4. WHILE エージェントが処理を実行中 THE SYSTEM SHALL リアルタイムで進捗状況を表示する
5. WHEN エージェントの処理でエラーが発生する THEN システムは 最大2回までリトライを実行する SHALL
6. IF 2回のリトライ後もエラーが解消しない THEN システムは エラー内容を明示してユーザーに通知する SHALL
7. WHEN 全エージェントの処理が完了する THEN システムは 生成されたレポートを表示する SHALL
8. WHERE レポート生成時間が10分を超える場合 THE SYSTEM SHALL ユーザーに通知して現状の進捗状況を表示した上で生成を続けるか確認する
9. WHEN ユーザーが生成継続を許可した場合　THEN 生成を続けてレポートを表示する
10. IF ユーザーが拒否した場合/2回目も10分を超えた場合　THEN エラーを通知する

### Requirement 3: 多エージェントシステム
**User Story:** システム管理者として、5つのエージェントが協調して高品質なビジネスアイデアを生成することを確実にしたい

#### Acceptance Criteria

1. WHEN Broad Researcherエージェントが起動する THEN システムは Serper APIを使用してWeb検索を実行し、日本市場と海外市場の両方から関連情報を収集する SHALL
2. WHEN Ideatorエージェントが起動する THEN システムは 収集された情報を基に5つのビジネスモデル案を生成する SHALL
3. WHEN Criticエージェントが起動する THEN システムは 各ビジネスモデルを市場規模（50点）とシナジー（50点）で評価する SHALL
4. WHEN Analystエージェントが起動する THEN システムは 最高評価のビジネスモデルについてTAM/PAM/SAM分析と競合分析を実行する SHALL
5. WHEN Writerエージェントが起動する THEN システムは HTML形式でタブ区切りのレポートを生成する SHALL
6. WHILE エージェントが処理中 THE SYSTEM SHALL 各エージェントの入出力とトークン使用量をagent_runsテーブルに記録し、EdgeLoggerでメモリ内ログも保持する
7. IF APIコストが月額上限（3,000円）に達した THEN システムは 新規生成を一時停止する SHALL

### Requirement 4: レポート管理・表示
**User Story:** 新事業担当者として、生成されたレポートを効率的に閲覧・管理したい

#### Acceptance Criteria

1. WHEN レポートが生成される THEN システムは 以下のタブ構成でHTML形式のレポートを表示する SHALL：
   - サマリータブ
   - ビジネスモデルタブ（想定顧客・顧客課題・提供価値・収益構造）
   - 市場規模及び競合プレーヤータブ
   - 三菱地所が取り組む意義タブ
   - 検証計画タブ
2. WHEN ユーザーがレポート一覧にアクセスする THEN システムは 過去の生成履歴を時系列で表示する SHALL
3. WHEN ユーザーが特定のレポートを選択する THEN システムは 該当レポートの詳細を表示する SHALL
4. IF レポートのステータスが「failed」の場合 THEN システムは エラー理由を明示的に表示する SHALL

### Requirement 5: 評価・フィードバックシステム
**User Story:** 新事業担当者として、生成されたアイデアを評価し、システムの精度向上に貢献したい

#### Acceptance Criteria

1. WHEN ユーザーがレポートを閲覧している THEN システムは 各評価項目（市場性・シナジー等）の採点フォーム（0-100点）を表示する SHALL
2. WHEN ユーザーが評価を入力して保存する THEN システムは スコアとコメントをデータベースに記録する SHALL
3. WHEN 新しい評価が保存される THEN システムは 統計処理を実行して平均・分散を算出する SHALL
4. WHEN 次回のアイデア生成時 THEN システムは 過去の評価データを参照してプロンプトを最適化する SHALL
5. WHILE フィードバックデータが蓄積される THE SYSTEM SHALL 継続的に生成品質を向上させる

### Requirement 6: セキュリティ・データ保護
**User Story:** システム管理者として、ユーザーデータと生成コンテンツを安全に保護したい

#### Acceptance Criteria

1. WHEN データベースアクセスが発生する THEN システムは Row-Level Security (RLS)を適用する SHALL
2. WHEN APIリクエストが送信される THEN システムは CSRF対策を実施する SHALL
3. WHERE 本番環境 THE SYSTEM SHALL SSL/TLS暗号化通信を使用する
4. WHEN ユーザーが他のユーザーのデータにアクセスしようとする THEN システムは アクセスを拒否する SHALL
5. IF 異常なAPIアクセスパターンが検出された THEN システムは アクセスを一時的にブロックする SHALL

### Requirement 7: パフォーマンス・スケーラビリティ
**User Story:** システム管理者として、複数ユーザーが同時に使用してもパフォーマンスを維持したい

#### Acceptance Criteria

1. WHEN 複数のレポート生成が同時に実行される THEN システムは 最大5つまで並行処理を許可する SHALL
2. WHEN 並行処理の上限に達した場合 THEN システムは 新規リクエストをキューに追加する SHALL
3. WHERE Edge Functions実行環境 THE SYSTEM SHALL 低レイテンシでAPIレスポンスを返す
4. WHEN 静的アセットへのアクセスが発生する THEN システムは Vercel Edge Cacheを活用する SHALL
5. IF システム負荷が高い場合 THEN システムは 処理優先度に基づいてリソースを配分する SHALL

### Requirement 8: 開発・運用サポート

### Requirement 9: Web検索API統合 [ADDED: 2025-01-08]
**User Story:** システムとして、効率的かつ信頼性の高いWeb検索を実行し、最新の市場情報を収集したい

#### Acceptance Criteria

1. WHEN Serper APIを初期化する THEN システムは APIキーの有効性を検証する SHALL
2. WHEN 検索を実行する THEN システムは キャッシュを確認し、1時間以内の同一クエリ結果を再利用する SHALL
3. IF 検索がエラーになった場合 THEN システムは 最大3回まで指数バックオフでリトライする SHALL
4. WHEN 日本市場を検索する THEN システムは gl=jp, hl=jaパラメータを使用する SHALL
5. WHEN 海外市場を検索する THEN システムは gl=us, hl=enパラメータを使用する SHALL
6. IF レート制限（1分100リクエスト）に達した場合 THEN システムは 適切な待機時間後に再実行する SHALL

### Requirement 10: Edge Functions互換性 [ADDED: 2025-01-08]
**User Story:** システム管理者として、Edge Functions環境で動作する軽量で高速なアプリケーションを維持したい

#### Acceptance Criteria

1. WHEN エージェントがログを記録する THEN システムは ファイルシステムを使用せずメモリ内に保持する SHALL
2. WHEN デプロイされる THEN システムは Node.js固有のモジュール（fs、path等）を含まない SHALL
3. WHERE Edge Functions実行時 THE SYSTEM SHALL 50KB以下のバンドルサイズを維持する
4. WHEN エラーが発生する THEN システムは EdgeLoggerを使用してメモリ内ログを記録する SHALL

### Requirement 8: 開発・運用サポート
**User Story:** 開発者として、効率的に開発・デバッグ・デプロイできる環境が欲しい

#### Acceptance Criteria

1. WHEN 開発者が `npm run dev` を実行する THEN システムは ローカル開発サーバーを起動する SHALL
2. WHEN コードが変更される THEN システムは ホットリロードを実行する SHALL
3. WHEN `npm run lint` が実行される THEN システムは ESLintによるコード検証を実行する SHALL
4. WHEN `npm run type-check` が実行される THEN システムは TypeScript型チェックを実行する SHALL
5. WHEN GitHubにプッシュされる THEN システムは GitHub Actionsで自動テストを実行する SHALL
6. WHEN `vercel --prod` が実行される THEN システムは 本番環境にデプロイする SHALL