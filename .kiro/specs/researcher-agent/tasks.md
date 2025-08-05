# Implementation Plan

## Parent Task Reference
> Implements: `.kiro/specs/autonomous-ideation-agent/tasks.md` - Task 5.3 Broad Researcherエージェントの実装

## Implementation Tasks

### 1. 環境設定とプロジェクト構造の準備
- [ ] 1.1 環境変数の追加（.env.example, .env.local）
  - SERPER_API_KEY
  - SERPER_API_TIMEOUT (デフォルト: 5000)
  - SERPER_CACHE_TTL (デフォルト: 3600000)
  - SERPER_MAX_RETRIES (デフォルト: 2)
  - _Requirements: 5.1_

- [ ] 1.2 必要な依存関係のインストール
  - langchain と @langchain/openai
  - openai
  - crypto (ハッシュ生成用)
  - _Requirements: 全般_

- [ ] 1.3 ディレクトリ構造の作成
  - lib/agents/broad-researcher/
  - lib/services/serper/
  - lib/utils/rate-limiter.ts
  - _Requirements: 全般_

### 2. 型定義とインターフェースの実装
- [ ] 2.1 検索関連の型定義作成
  - lib/types/search.ts を作成
  - SearchQuery, SearchQuerySet, SearchResults インターフェース定義
  - SearchOptions, WebSearchResult の拡張
  - _Requirements: 1.6, 3.3_

- [ ] 2.2 エージェント関連の型定義拡張
  - lib/types/agents.ts を更新
  - ResearcherInput, ProcessedResearch, ResearchSummary インターフェース追加
  - AgentMetrics インターフェースの定義
  - _Requirements: 2.1, 3.3_

- [ ] 2.3 Zodバリデーションスキーマの作成
  - lib/validations/search.ts を作成
  - 検索クエリ、結果、設定のバリデーション
  - _Requirements: 4.2_

### 3. Serper API統合サービスの実装
- [ ] 3.1 SerperSearchService基本実装
  - lib/services/serper/serper-search-service.ts を作成
  - コンストラクタとAPIキー検証
  - 基本的な検索メソッド実装
  - _Requirements: 1.1, 1.2, 1.8, 1.9_

- [ ] 3.2 キャッシュ機能の実装
  - インメモリMapベースのキャッシュ
  - TTL管理とLRU的な動作
  - clearCache メソッド
  - _Requirements: 1.3_

- [ ] 3.3 レート制限とリトライ機能
  - lib/utils/rate-limiter.ts の実装
  - 指数バックオフによるリトライロジック
  - searchWithRetry メソッド
  - _Requirements: 1.4, 1.5_

- [ ] 3.4 エラーハンドリングとタイムアウト
  - SerperAPIError クラスの実装
  - タイムアウト処理（5秒）
  - エラーログと空結果の返却
  - _Requirements: 1.7_

### 4. SearchResultProcessorの実装
- [ ] 4.1 結果処理ユーティリティクラス
  - lib/agents/broad-researcher/search-result-processor.ts を作成
  - removeDuplicates メソッド（URL重複除去）
  - categorizeByRegion メソッド（日本/海外分類）
  - _Requirements: 3.1, 3.3_

- [ ] 4.2 インサイト抽出機能
  - extractKeyInsights メソッド
  - 市場規模、競合、トレンドの抽出ロジック
  - _Requirements: 3.2, 3.4_

- [ ] 4.3 海外事例分析機能
  - analyzeApplicability メソッド
  - 日本市場への適用可能性分析
  - グローバルインサイトの構造化
  - _Requirements: 3.6_

### 5. BroadResearcherAgentの実装
- [ ] 5.1 エージェント基本構造
  - lib/agents/broad-researcher/broad-researcher-agent.ts を作成
  - BaseAgent を継承
  - コンストラクタとDI設定
  - _Requirements: 2.1, 6.1_

- [ ] 5.2 検索クエリ生成機能
  - generateSearchQueries メソッド
  - LLMプロンプトの実装（日本5つ、海外3つ）
  - クエリ生成エラーハンドリング
  - _Requirements: 2.2, 2.3_

- [ ] 5.3 並列検索実行機能
  - executeSearches メソッド
  - Promise.all による並列実行
  - 部分的失敗の処理
  - _Requirements: 2.4_

- [ ] 5.4 結果要約と統合
  - processResults メソッド
  - summarizeResults メソッド
  - LLMによる要約生成
  - _Requirements: 2.5, 3.4_

- [ ] 5.5 エージェントメッセージとログ
  - 進捗メッセージの生成
  - agent_logs への記録
  - メトリクス収集
  - _Requirements: 2.7, 6.3_

### 6. エラーハンドリングとモニタリング
- [ ] 6.1 包括的エラーハンドリング
  - 各種エラークラスの定義
  - フォールバック戦略の実装
  - エラーログの詳細化
  - _Requirements: 2.6, 4.4_

- [ ] 6.2 パフォーマンスモニタリング
  - 実行時間測定
  - トークン使用量追跡
  - API呼び出し回数カウント
  - キャッシュヒット率計算
  - _Requirements: 4.3_

- [ ] 6.3 ローカルログフォールバック
  - データベース接続エラー時の処理
  - ファイルベースのログ出力
  - _Requirements: 6.4_

### 7. テストの実装
- [ ] 7.1 SerperSearchServiceのユニットテスト
  - __tests__/services/serper/serper-search-service.test.ts
  - キャッシュ、レート制限、リトライのテスト
  - モックAPIレスポンス
  - _Requirements: 4.1, 4.2_

- [ ] 7.2 BroadResearcherAgentのユニットテスト
  - __tests__/agents/broad-researcher/broad-researcher-agent.test.ts
  - クエリ生成、検索実行、結果処理のテスト
  - モックLLMレスポンス
  - _Requirements: 4.1, 4.2_

- [ ] 7.3 統合テスト
  - __tests__/agents/broad-researcher/integration.test.ts
  - エンドツーエンドフローのテスト
  - 部分的失敗のシナリオ
  - _Requirements: 4.2_

- [ ] 7.4 パフォーマンステスト
  - __tests__/agents/broad-researcher/performance.test.ts
  - 並列実行時間の測定
  - メモリ使用量の確認
  - _Requirements: 4.3_

### 8. ドキュメントと設定
- [ ] 8.1 使用方法ドキュメント
  - lib/agents/broad-researcher/README.md
  - 設定方法と使用例
  - エラー対処法
  - _Requirements: 5.3_

- [ ] 8.2 環境変数ドキュメント更新
  - .env.example の更新
  - README.md への追記
  - _Requirements: 5.2_

### 9. 統合とデプロイ準備
- [ ] 9.1 既存システムとの統合確認
  - BaseAgent インターフェース準拠
  - AgentExecutionResult 形式の確認
  - _Requirements: 6.2, 6.5_

- [ ] 9.2 エッジ関数対応の確認
  - メモリ使用量の最適化
  - Edge Runtime互換性チェック
  - _Requirements: 全般_

### 10. 最終検証とリリース
- [ ] 10.1 全体的な動作確認
  - 「スマートシティ」テーマでの実行テスト
  - 日本語と英語の検索結果確認
  - _Requirements: 全要件_

- [ ] 10.2 パフォーマンス基準の達成確認
  - 30秒以内の完了
  - 50MB以下のメモリ使用
  - 30%以上のキャッシュヒット率
  - _Requirements: 4.3_

## 実装の優先順位
1. **高優先度**: タスク1-3（基盤構築）
2. **中優先度**: タスク4-6（コア機能）
3. **低優先度**: タスク7-10（品質保証）

## 推定工数
- **総工数**: 約40-50時間
- **基盤構築**: 8-10時間
- **コア実装**: 20-25時間
- **テスト**: 8-10時間
- **統合・最終調整**: 4-5時間

---
**STATUS**: Tasks generated
**NEXT STEP**: Review and approve tasks, then begin implementation