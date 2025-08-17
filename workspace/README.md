# Workspace Directory

## 概要
このディレクトリは、チーム協業のための共有作業スペースです。
/workspace/へのアクセス権限がないため、プロジェクト内に代替ディレクトリとして作成しました。

## ディレクトリ構造
```
workspace/
├── shared/      # チーム共有ファイル・成果物
├── docs/        # プロジェクトドキュメント
├── tests/       # 統合テスト・E2Eテスト
└── configs/     # 共通設定ファイル
```

## 使用方法
全てのWorkerは、このディレクトリを共通の作業場所として使用してください。

### パス
- 絶対パス: `/Users/eijuntei/Desktop/workspace/biz-dev-agent3/workspace/`
- 相対パス: `./workspace/` (プロジェクトルートから)

## 注意事項
- 指示書の `/workspace/` は `./workspace/` として読み替えてください
- チーム間でのファイル共有はこのディレクトリ内で行います