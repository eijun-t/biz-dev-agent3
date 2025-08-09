# Critic Agent Documentation

## 概要

Critic Agentは、Ideatorエージェントが生成した複数のビジネスアイデアを評価し、最も有望なアイデアを選定するエージェントです。市場規模（50点）と三菱地所シナジー（50点）の2軸で評価を行います。

## 主要機能

### 1. 市場評価（0-50点）
- **市場規模評価（0-20点）**: 市場の大きさを定量評価
- **成長性評価（0-15点）**: 市場の成長ポテンシャルを分析
- **収益性評価（0-15点）**: 営業利益10億円以上を重視した収益性評価

### 2. シナジー評価（0-50点）
3段階の評価プロセス：
1. **ケイパビリティマッピング（0-20点）**: 必要能力と三菱地所の保有能力をマッチング
2. **シナジーシナリオ生成（0-15点）**: 具体的な活用ストーリーを作成
3. **シナリオ検証（0-15点）**: 論理的整合性、実現可能性、独自性を検証

### 3. 三菱地所ケイパビリティ

#### 不動産開発・運営
- 丸の内エリア30棟のビル群
- テナント企業3000社（就業者28万人）
- 年間賃料収入5000億円以上
- ロイヤルパークホテルズ

#### 施設運営・サービス
- 管理床面積900万㎡
- プレミアムアウトレット9施設
- 空港運営（高松、福岡、北海道等）
- ロジクロス物流施設

#### 金融・投資
- 日本ビルファンド（資産規模1.4兆円）
- ジャパンリアルエステイト投資法人（1.2兆円）
- 海外不動産投資（米国、アジア、欧州）

#### イノベーション・新規事業
- FINOLAB（フィンテック拠点）
- xLINK（ライフサイエンス拠点）
- Inspired.Lab（AI・ロボティクス）
- スタートアップ投資100社以上

## アーキテクチャ

```
CriticAgent
├── EvaluationPipeline（評価パイプライン）
│   ├── MarketScoringService（市場評価）
│   └── SynergyScoringService（シナジー評価）
│       └── CapabilityMatcher（ケイパビリティマッチング）
├── LLMEvaluator（LLM統合）
│   ├── 市場評価
│   ├── ケイパビリティマッチング
│   ├── シナリオ生成
│   └── シナリオ検証
└── ErrorHandling（エラーハンドリング）
    ├── リトライロジック（最大2回）
    └── タイムアウト処理（30秒）
```

## 使用方法

### 基本的な使用例

```typescript
import { createCriticAgent } from '@/lib/agents/critic/critic-agent';
import { CriticInput } from '@/lib/types/critic';

// エージェントの作成
const criticAgent = createCriticAgent({
  marketWeight: 0.5,      // 市場評価の重み
  synergyWeight: 0.5,     // シナジー評価の重み
  minimumTotalScore: 60,  // 最小スコア要件
  temperature: 0.3,       // LLMの温度パラメータ
});

// 評価の実行
const input: CriticInput = {
  sessionId: 'session-001',
  ideas: [/* BusinessIdea配列 */],
};

const output = await criticAgent.execute(input);

// 結果の取得
console.log('最優秀アイデア:', output.selectedIdea.ideaTitle);
console.log('総合スコア:', output.selectedIdea.totalScore);
```

### 入力形式（BusinessIdea）

```typescript
interface BusinessIdea {
  id: string;
  title: string;
  description: string;
  targetCustomer: string;
  customerProblem: string;
  proposedSolution: string;
  revenueModel: string;
  estimatedRevenue?: number;  // 年間営業利益（円）
  marketSize?: string;
  competitors?: string[];
  implementation?: {
    difficulty: 'low' | 'medium' | 'high';
    timeframe: string;
    requiredResources: string[];
  };
}
```

### 出力形式（CriticOutput）

```typescript
interface CriticOutput {
  sessionId: string;
  evaluationResults: EvaluationResult[];  // 全アイデアの評価結果
  selectedIdea: EvaluationResult;         // 最高評価のアイデア
  summary: string;                        // 評価サマリー
  metadata: EvaluationMetadata;           // メタデータ
}
```

## 評価基準

### スコアリング

| 評価軸 | 配点 | 内訳 |
|--------|------|------|
| **市場評価** | 50点 | |
| - 市場規模 | 20点 | 1000億円以上で高得点 |
| - 成長性 | 15点 | AI/DX/サステナ関連で高評価 |
| - 収益性 | 15点 | 営業利益10億円以上で満点近く |
| **シナジー評価** | 50点 | |
| - ケイパビリティマッチ | 20点 | 保有能力との適合度 |
| - シナジー効果 | 15点 | 相乗効果の大きさ |
| - 独自優位性 | 15点 | 他社との差別化 |

### 推奨レベル

- **80点以上**: 強く推奨 - 早期の事業化検討を推奨
- **70-79点**: 推奨 - 十分な事業ポテンシャルあり
- **60-69点**: 条件付き推奨 - 一部課題はあるが検討の価値あり
- **50-59点**: 要改善 - 市場性またはシナジーの強化が必要
- **50点未満**: 非推奨 - 現時点では事業化は困難

## パフォーマンス

- **処理時間**: 5アイデアで約10-30秒（LLM呼び出し含む）
- **並列処理**: 最大3アイデアを同時評価
- **タイムアウト**: 個別評価30秒、全体60秒
- **リトライ**: LLMエラー時は最大2回リトライ
- **トークン使用量**: 1アイデアあたり約1500-2000トークン

## エラーハンドリング

| エラーコード | 説明 | リトライ可能 |
|-------------|------|-------------|
| INVALID_INPUT | 入力データ不正 | ✗ |
| LLM_ERROR | LLM呼び出しエラー | ✓ |
| EVALUATION_FAILED | 評価処理失敗 | ✗ |
| TIMEOUT | タイムアウト | ✓ |
| CACHE_ERROR | キャッシュエラー | ✗ |
| CONFIG_ERROR | 設定エラー | ✗ |

## 実装状況

### 完了済み（2025年1月）
- ✅ コア型定義とバリデーション
- ✅ エラーハンドリング基盤
- ✅ LLM統合サービス
- ✅ 市場評価サービス
- ✅ シナジー評価サービス（3段階評価）
- ✅ ケイパビリティマッチング
- ✅ 評価パイプライン
- ✅ メインエージェントクラス

### 未実装
- ⏳ キャッシュ機能
- ⏳ データベース統合
- ⏳ APIエンドポイント
- ⏳ 統合テスト

## テスト

### 単体テストの実行
```bash
npm test -- __tests__/types/critic.test.ts
npm test -- __tests__/types/mitsubishi-capability.test.ts
npm test -- __tests__/agents/critic/errors.test.ts
```

### 動作確認スクリプト
```bash
node test-critic-simple.js
```

## 注意事項

1. **OpenAI API Key必須**: 環境変数`OPENAI_API_KEY`の設定が必要
2. **Edge Functions対応**: ファイルシステム依存なし
3. **三菱地所特化**: 評価基準は三菱地所のケイパビリティに最適化
4. **営業利益重視**: 10億円以上の営業利益を特に重視する設計

## 関連ドキュメント

- [Requirements](/.kiro/specs/critic-agent/requirements.md) - 要件定義
- [Design](/.kiro/specs/critic-agent/design.md) - 技術設計
- [Tasks](/.kiro/specs/critic-agent/tasks.md) - 実装タスク