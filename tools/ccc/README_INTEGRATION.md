# 仕様書駆動開発 × 並列エージェント開発 統合ガイド

## 概要
このドキュメントは、仕様書駆動開発（Spec-Driven Development）と並列エージェント開発（Parallel Agent Development）を統合するためのガイドです。

## 問題と解決策

### 発見された問題
- tools/ccc/で作業するエージェントが、プロジェクトルートの仕様書を参照できていなかった
- .kiro/specs/の詳細な仕様書が活用されていなかった
- CLAUDE.mdの設定が反映されていなかった

### 実装した解決策

#### 1. シンボリックリンクの作成
```bash
cd /Users/eijuntei/Desktop/workspace/biz-dev-agent3/tools/ccc/
ln -s ../../.kiro .kiro
```

#### 2. 指示書の更新
以下のファイルに仕様書参照セクションを追加：
- `instructions/president.md`
- `instructions/boss.md`
- `instructions/worker.md`

#### 3. 仕様書パスの明記
全ての指示書に以下のパスを追加：
- プロジェクト仕様: `/Users/eijuntei/Desktop/workspace/biz-dev-agent3/.kiro/specs/`
- プロジェクトルール: `/Users/eijuntei/Desktop/workspace/biz-dev-agent3/CLAUDE.md`
- ステアリング文書: `/Users/eijuntei/Desktop/workspace/biz-dev-agent3/.kiro/steering/`

## 利用可能な仕様書

### 7つのエージェント仕様
1. **autonomous-ideation-agent** - システム全体仕様
2. **researcher-agent** - Web検索による情報収集
3. **ideator-agent** - ビジネスアイデア生成
4. **critic-agent** - ビジネスアイデア評価・選定
5. **analyst-agent** - 詳細市場分析とビジネス戦略
6. **writer-agent** - 構造化レポート作成
7. **agent-orchestration** - マルチエージェント統合

### 各仕様書の構成
```
エージェント名/
├── spec.json         # メタデータ
├── requirements.md   # 要件定義
├── design.md        # 設計書
└── tasks.md         # タスクリスト
```

## エージェントへの指示方法

### PRESIDENT → Boss指示例
```bash
./agent-send.sh boss1 "タスク: researcher-agent機能の実装

仕様書参照:
- 要件: /Users/eijuntei/Desktop/workspace/biz-dev-agent3/.kiro/specs/researcher-agent/requirements.md
- 設計: /Users/eijuntei/Desktop/workspace/biz-dev-agent3/.kiro/specs/researcher-agent/design.md

仕様書に基づいて実装してください。"
```

### Boss → Worker指示例
```bash
./agent-send.sh worker1 "タスク: Serper API統合

仕様書の5.1節を参照:
パス: /Users/eijuntei/Desktop/workspace/biz-dev-agent3/.kiro/specs/researcher-agent/requirements.md

設計パターンに従って実装してください。"
```

## ベストプラクティス

### 1. 常に仕様書を参照
- タスク開始前に必ず関連仕様書を確認
- 実装は設計書に準拠
- 完了基準は仕様書で確認

### 2. 仕様書の更新
- 実装完了後はspec.jsonを更新
- 新たな知見はdesign.mdに反映
- タスク完了状況をtasks.mdに記録

### 3. 品質管理
- 仕様書の要件から逸脱しない
- テストケースは仕様書から導出
- レビューは仕様書ベース

## トラブルシューティング

### Q: エージェントが仕様書を見つけられない
A: 絶対パスを使用してください
```
/Users/eijuntei/Desktop/workspace/biz-dev-agent3/.kiro/specs/
```

### Q: シンボリックリンクが機能しない
A: 相対パスで再作成
```bash
rm .kiro
ln -s ../../.kiro .kiro
```

### Q: 仕様書の更新が反映されない
A: エージェントに明示的に再読み込みを指示
```bash
./agent-send.sh boss1 "仕様書を再読み込みして最新版を確認してください"
```

## まとめ
仕様書駆動開発と並列エージェント開発の統合により：
- 仕様に基づいた一貫性のある開発
- 複数エージェントの並列作業
- 品質の担保と効率の両立

が実現されます。

---
作成日: 2025-01-17
更新日: 2025-01-17