# Workspace Directory Structure

## 📁 ディレクトリ構成

```
workspace/
├── agents/              # 各エージェントの作業ディレクトリ
│   ├── researcher/     # Broad Researcher Agent
│   ├── ideator/        # Ideator Agent
│   ├── critic/         # Critic Agent
│   ├── analyst/        # Analyst Agent
│   └── writer/         # Writer Agent
├── shared/             # チーム共有ファイル
├── docs/              # プロジェクトドキュメント
├── tests/             # 統合テスト・E2Eテスト
├── configs/           # 共通設定ファイル
├── integration/       # エージェント統合作業
├── deployment/        # デプロイ関連ファイル
├── monitoring/        # モニタリング・ログ
└── backups/          # バックアップファイル
```

## 📝 各ディレクトリの用途

### agents/
各エージェントの個別作業スペース。エージェント固有のテストやドキュメントを配置。

### shared/
全workerが共有するファイル。API定義、共通インターフェースなど。

### docs/
プロジェクト全体のドキュメント。仕様書、設計書、運用マニュアルなど。

### tests/
統合テスト、E2Eテスト、パフォーマンステストを配置。

### configs/
環境設定、デプロイ設定、各種設定ファイルを集約。

### integration/
LangGraphによるエージェント統合、オーケストレーション関連。

### deployment/
本番環境へのデプロイスクリプト、Docker設定など。

### monitoring/
ログ収集、メトリクス、アラート設定。

### backups/
重要ファイルのバックアップ、スナップショット。

## 🔄 更新日時
- 作成日: 2025-08-17
- 最終更新: 2025-08-17