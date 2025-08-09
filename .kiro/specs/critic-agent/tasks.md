# Implementation Plan

## タスク概要
Criticエージェントの実装を段階的に進めるためのコード生成タスクです。各タスクはテスト駆動開発を採用し、既存のIdeatorエージェントとの統合を確実に行います。

- [x] 1. プロジェクト構造とコア型定義のセットアップ
  - lib/agents/critic/ディレクトリを作成
  - lib/types/critic.tsに基本的な型定義を実装
  - lib/validations/critic.tsにZodスキーマを定義
  - __tests__/agents/critic/ディレクトリ構造を準備
  - _Requirements: 1.1, 7.1_

- [x] 2. データモデルのテスト駆動実装
- [x] 2.1 評価結果モデルの作成
  - __tests__/types/critic.test.tsにCriticOutput型のテストを作成
  - lib/types/critic.tsにCriticInput、CriticOutput、EvaluationResult型を実装
  - MarketScore、SynergyScore、EvaluationMetadata型を定義
  - Zodバリデーションスキーマを作成してランタイム検証を実装
  - _Requirements: 3.1, 3.3, 8.5_

- [x] 2.2 三菱地所ケイパビリティモデルの実装
  - __tests__/types/mitsubishi-capability.test.tsを作成
  - lib/types/mitsubishi-capability.tsにMitsubishiCapability、CapabilityMapping型を定義
  - RequiredCapability、CapabilityMatch、SynergyScenario型を実装
  - ScenarioValidation型と検証ロジックを実装
  - _Requirements: 9.1, 9.4_

- [x] 3. エラーハンドリング基盤の構築
- [x] 3.1 カスタムエラークラスの実装
  - __tests__/agents/critic/errors.test.tsを作成
  - lib/agents/critic/errors.tsにCriticError、CriticErrorCodeを定義
  - リトライ可能/不可能なエラーの分類ロジックを実装
  - エラーの詳細情報保持とスタックトレース保存を実装
  - _Requirements: 6.1, 6.3, 6.5_

- [x] 4. LLM統合サービスの実装
- [x] 4.1 LLMEvaluatorサービスの基本実装
  - __tests__/agents/critic/services/llm-evaluator.test.tsを作成
  - lib/agents/critic/services/llm-evaluator.tsにLLMEvaluatorクラスを実装
  - LangChain統合とOpenAI GPT-4o設定を実装
  - temperature設定（0.3-0.5）と一貫性保証ロジックを実装
  - _Requirements: 2.1, 2.5_

- [x] 4.2 リトライ機構とレスポンス解析の実装
  - 指数バックオフリトライロジック（最大2回）のテストを作成
  - handleRetry()メソッドで1秒、2秒の待機時間を実装
  - parseResponse()でJSON形式の構造化出力を抽出
  - Zodスキーマによる型安全なレスポンス検証を実装
  - _Requirements: 2.2, 2.3, 6.5_

- [x] 5. 市場規模評価サービスの実装
- [x] 5.1 MarketScoringServiceクラスの作成
  - __tests__/agents/critic/services/market-scoring-service.test.tsを作成
  - lib/agents/critic/services/market-scoring-service.tsを実装
  - evaluateMarket()メソッドで0-50点のスコア算出ロジックを実装
  - estimatedRevenue、marketOpportunity、成長性の総合分析を実装
  - _Requirements: 1.2, 1.4_

- [x] 5.2 市場評価の詳細ロジック実装
  - calculateRevenueScore()で営業利益10億円以上の重み付けテストを作成
  - analyzeGrowthPotential()でLLMを活用した成長性分析を実装
  - assessMarketSize()で市場規模の定量評価を実装
  - スコア内訳（市場サイズ20点、成長性15点、収益性15点）の算出を実装
  - _Requirements: 1.4, 3.3_

- [x] 6. 三菱地所シナジー評価サービスの実装
- [x] 6.1 SynergyScoringServiceクラスの基本実装
  - __tests__/agents/critic/services/synergy-scoring-service.test.tsを作成
  - lib/agents/critic/services/synergy-scoring-service.tsを実装
  - evaluateSynergy()メソッドで多段階評価プロセスを実装
  - 0-50点のシナジースコア算出ロジックを実装
  - _Requirements: 1.3, 9.1_

- [x] 6.2 ケイパビリティマッピングの実装
  - __tests__/agents/critic/services/capability-matcher.test.tsを作成
  - lib/agents/critic/services/capability-matcher.tsを実装
  - match()メソッドで必要能力と三菱地所保有能力の照合を実装
  - 4大ケイパビリティ（不動産開発、運営管理、金融投資、イノベーション）のスコアリングを実装
  - _Requirements: 9.1, 9.4_

- [x] 6.3 シナジーシナリオ生成と検証の実装
  - generateScenario()で具体的な活用ストーリー生成のテストを作成
  - 丸の内30棟、テナント3000社、三菱グループ連携のシナリオ生成を実装
  - validateScenario()で論理的整合性、実現可能性、独自性の検証を実装
  - シナジー乗数効果（1.2-1.5倍）の適用ロジックを実装
  - _Requirements: 9.2, 9.3, 9.5_

- [x] 7. 評価パイプラインの実装
- [x] 7.1 EvaluationPipelineクラスの作成
  - __tests__/agents/critic/services/evaluation-pipeline.test.tsを作成
  - lib/agents/critic/services/evaluation-pipeline.tsを実装
  - evaluate()メソッドで5つのアイデアの並列評価を実装
  - Promise.all()による非同期並列処理を実装
  - _Requirements: 1.1, 5.2_

- [x] 7.2 最優秀アイデア選定ロジックの実装
  - selectBestIdea()メソッドのテストを作成
  - 合計スコア（市場規模＋シナジー）による順位付けを実装
  - 同点の場合のタイブレーカーロジックを実装
  - 評価詳細の記録と根拠の保存を実装
  - _Requirements: 1.6, 1.5_

- [ ] 8. キャッシュとパフォーマンス最適化
- [ ] 8.1 評価結果キャッシュの実装
  - __tests__/agents/critic/services/evaluation-cache.test.tsを作成
  - lib/agents/critic/services/evaluation-cache.tsを実装
  - LRUキャッシュ（最大100件、TTL 1時間）を実装
  - SHA256ハッシュによるキャッシュキー生成を実装
  - _Requirements: 5.5_

- [ ] 8.2 パフォーマンスモニタリングの実装
  - lib/agents/critic/services/performance-monitor.tsを作成
  - 処理時間、メモリ使用量、トークン使用量の計測を実装
  - 30秒以内の処理完了を保証するタイムアウト機構を実装
  - EdgeLogger統合によるパフォーマンスログ記録を実装
  - _Requirements: 5.1, 5.3, 5.4_

- [x] 9. メインエージェントクラスの統合実装
- [x] 9.1 CriticAgentクラスの実装
  - __tests__/agents/critic/critic-agent.test.tsを作成（モックLLM使用）
  - lib/agents/critic/critic-agent.tsにCriticAgentクラスを実装
  - BaseAgentを継承してexecute()メソッドを実装
  - getAgentName()で'critic'を返すように実装
  - _Requirements: 7.1, 7.5_

- [x] 9.2 エージェント設定とカスタマイズ機能の実装
  - CriticConfigによる評価重み設定（marketWeight、synergyWeight）のテストを作成
  - デフォルト50:50配分とカスタム配分の切り替えを実装
  - 三菱地所固有評価基準の適用ロジックを実装
  - Edge Functions互換性（fs依存なし）の確認と実装
  - _Requirements: 4.1, 4.2, 4.3, 2.4_

- [ ] 10. データベース統合の実装
- [ ] 10.1 評価結果の永続化
  - __tests__/agents/critic/services/critic-data-store.test.tsを作成
  - lib/agents/critic/services/critic-data-store.tsを実装
  - critic_evaluations、evaluation_detailsテーブルへの保存を実装
  - Supabaseクライアント統合とトランザクション処理を実装
  - _Requirements: 3.2, 3.3_

- [ ] 10.2 ログ記録とメタデータ保存の実装
  - EdgeLoggerを使用した評価プロセスログのテストを作成
  - agent_logsテーブルへの詳細ログ記録を実装
  - 評価メタデータ（実行時間、トークン使用量）の保存を実装
  - エラー時の部分結果保存とリカバリーロジックを実装
  - _Requirements: 3.4, 6.1, 6.4_

- [ ] 11. APIエンドポイントの実装
- [ ] 11.1 評価実行APIエンドポイントの作成
  - __tests__/api/agents/critic/route.test.tsを作成
  - app/api/agents/critic/route.tsにPOSTエンドポイントを実装
  - JWT認証ミドルウェアの統合を実装
  - 入力バリデーションとエラーレスポンスを実装
  - _Requirements: 7.4_

- [ ] 11.2 評価結果取得APIの実装
  - GETエンドポイント（/api/agents/critic/:sessionId）のテストを作成
  - セッションIDによる評価結果取得を実装
  - 権限チェックとデータフィルタリングを実装
  - キャッシュからの高速レスポンスを実装
  - _Requirements: 3.1_

- [ ] 12. 統合テストとシステム全体の検証
- [ ] 12.1 IdeatorOutputとの統合テスト
  - __tests__/agents/critic/integration.test.tsを作成
  - 実際のIdeatorOutput形式でのテストデータを使用
  - BusinessIdea[]配列の正しい解析と処理を検証
  - 5つのアイデア評価と最優秀案選定の動作確認
  - _Requirements: 7.1, 8.2_

- [ ] 12.2 エンドツーエンドテストの実装
  - __tests__/agents/critic/e2e.test.tsを作成
  - 完全な評価フロー（入力→評価→選定→出力）のテスト
  - 30秒以内の処理完了を検証
  - メモリ使用量512MB以下、トークン使用量2000以下を確認
  - _Requirements: 5.1, 5.3, 5.4, 8.1_

- [ ] 12.3 パフォーマンステストと負荷テストの実装
  - __tests__/agents/critic/performance.test.tsを作成
  - 100回連続評価でのメモリリーク検証を実装
  - 5セッション同時実行での並行処理テストを実装
  - 評価の一貫性（±5点以内）の検証を実装
  - _Requirements: 5.2, 8.3, 8.4_

- [ ] 13. 最終統合とワイヤリング
- [ ] 13.1 全コンポーネントの接続確認
  - すべてのサービスクラス間の連携を確認
  - 依存性注入とエラーハンドリングの統合を実装
  - LangGraphオーケストレーションへの統合準備を実装
  - Analystエージェントへのデータ受け渡しインターフェースを実装
  - _Requirements: 7.2, 7.3_

- [ ] 13.2 本番環境対応と最適化
  - Edge Functions環境での動作確認テストを作成
  - 環境変数による設定管理を実装
  - プロダクション用ログレベルとエラー通知を実装
  - 最終的な統合動作確認とドキュメント更新
  - _Requirements: 2.4, 7.3, 7.4_