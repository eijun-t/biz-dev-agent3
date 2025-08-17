# 自律型アイディエーションエージェントAI

三菱地所の新事業創出を加速する、多エージェント型AI支援システム

## 🎯 プロジェクト概要

本システムは、営業利益10億円規模の新事業案を継続的に生み出すための自律型AIシステムです。複数の専門エージェントが協調して「調査→アイディエーション→評価→選定→詳細リサーチ→資料化」のプロセスを自動実行します。

### 主要機能

- 🔍 **市場調査自動化**: Web検索APIを活用した包括的な市場動向分析
- 💡 **アイデア生成**: AI駆動の革新的ビジネスアイデア創出
- 📊 **評価・選定**: 定量的な評価指標による客観的なアイデア選定
- 📈 **詳細分析**: 選定されたアイデアの市場可能性深掘り
- 📝 **レポート自動生成**: 意思決定に必要な情報を構造化

## 🏗️ システムアーキテクチャ

```
┌─────────────────────────────────────────────────────────┐
│                     ユーザーインターフェース              │
│                    (Next.js 15 + React 19)               │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                  オーケストレーション層                   │
│                    (LangGraph 0.4.4)                     │
└────────────────────────┬────────────────────────────────┘
                         │
    ┌───────────────────┼────────────────────┐
    │                   │                    │
┌───▼────┐      ┌──────▼──────┐      ┌──────▼──────┐
│Researcher│      │   Ideator    │      │   Critic    │
│  Agent   │      │    Agent     │      │   Agent     │
└──────────┘      └──────────────┘      └─────────────┘
                         │
              ┌──────────┼──────────┐
              │                     │
       ┌──────▼──────┐       ┌──────▼──────┐
       │   Analyst   │       │   Writer    │
       │    Agent    │       │    Agent    │
       └─────────────┘       └─────────────┘
```

## 🤖 エージェント構成

### 1. Broad Researcher Agent
- **役割**: 市場調査・トレンド分析
- **技術**: Serper API, Web検索
- **出力**: 市場調査レポート

### 2. Ideator Agent
- **役割**: ビジネスアイデア生成
- **技術**: GPT-4o, プロンプトエンジニアリング
- **出力**: 5つの革新的ビジネスアイデア

### 3. Critic Agent
- **役割**: アイデア評価・選定
- **技術**: 多面的評価アルゴリズム
- **出力**: 評価スコアと推奨アイデア

### 4. Analyst Agent
- **役割**: 詳細市場分析
- **技術**: 統計分析, データビジュアライゼーション
- **出力**: 市場分析レポート

### 5. Writer Agent
- **役割**: レポート作成・構造化
- **技術**: 自然言語生成
- **出力**: 経営層向けレポート

## 🚀 クイックスタート

### 前提条件

- Node.js 18.0以上
- npm または yarn
- Supabase アカウント
- OpenAI API キー
- Serper API キー

### インストール

```bash
# リポジトリのクローン
git clone https://github.com/eijun-t/biz-dev-agent3.git
cd biz-dev-agent3

# Node.jsバージョン確認（18.0以上必須）
node --version

# 依存関係のインストール
npm install

# または yarn を使用
yarn install

# 型定義の生成
npm run db:types
```

#### インストール時の注意事項

- **メモリ不足エラーの場合**:
  ```bash
  NODE_OPTIONS="--max-old-space-size=4096" npm install
  ```

- **権限エラーの場合**:
  ```bash
  sudo npm install --unsafe-perm
  ```

- **キャッシュクリア**:
  ```bash
  npm cache clean --force
  rm -rf node_modules package-lock.json
  npm install
  ```

### 環境設定

#### 1. 環境変数ファイルの作成

```bash
# テンプレートからコピー
cp .env.example .env.local

# または新規作成
touch .env.local
```

#### 2. 必須環境変数の設定

`.env.local`ファイルに以下を設定：

```env
# ===== Supabase設定 =====
# Supabase Dashboard > Settings > API から取得
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ===== OpenAI設定 =====
# https://platform.openai.com/api-keys から取得
OPENAI_API_KEY=sk-...
# モデル設定（オプション）
OPENAI_MODEL=gpt-4o-mini  # デフォルト: gpt-4o-mini
OPENAI_MAX_TOKENS=4096     # デフォルト: 4096
OPENAI_TEMPERATURE=0.7     # デフォルト: 0.7

# ===== Serper API設定 =====
# https://serper.dev から取得
SERPER_API_KEY=...
# 検索設定（オプション）
SERPER_GL=jp               # 地域コード（デフォルト: jp）
SERPER_HL=ja               # 言語コード（デフォルト: ja）
SERPER_NUM=10              # 検索結果数（デフォルト: 10）

# ===== アプリケーション設定 =====
# 基本設定
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# エージェント設定
AGENT_TIMEOUT=30000        # タイムアウト（ミリ秒）
AGENT_MAX_RETRIES=3        # 最大リトライ数
AGENT_CACHE_TTL=3600       # キャッシュ有効期限（秒）

# ログ設定
LOG_LEVEL=info             # debug | info | warn | error
ENABLE_DEBUG_MODE=false    # デバッグモード
```

#### 3. 環境変数の取得方法

**Supabase**:
1. [Supabase Dashboard](https://supabase.com/dashboard)にログイン
2. プロジェクト選択 → Settings → API
3. Project URL, anon public, service_role をコピー

**OpenAI**:
1. [OpenAI Platform](https://platform.openai.com/)にログイン
2. API keys → Create new secret key
3. 生成されたキーをコピー（一度しか表示されません）

**Serper**:
1. [Serper.dev](https://serper.dev/)でアカウント作成
2. Dashboard → API Key
3. APIキーをコピー

#### 4. 環境変数の検証

```bash
# 環境変数が正しく設定されているか確認
npm run validate-env

# または手動で確認
node -e "console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓' : '✗')"
```

### 開発サーバー起動

#### 基本的な起動方法

```bash
# 開発サーバー起動
npm run dev

# または特定のポートで起動
PORT=3001 npm run dev

# デバッグモードで起動
DEBUG=* npm run dev
```

#### 初回起動時の確認事項

1. **データベース接続確認**:
   ```bash
   npm run db:check
   ```

2. **型定義の生成**:
   ```bash
   npm run db:types
   ```

3. **開発サーバー起動**:
   ```bash
   npm run dev
   ```

4. **ブラウザで確認**:
   - http://localhost:3000 を開く
   - コンソールにエラーがないか確認
   - Network タブで API 呼び出しを確認

#### 起動オプション

```bash
# Turbopackモード（高速）
npm run dev -- --turbo

# HTTPSモード
npm run dev -- --experimental-https

# 特定のホストにバインド
HOST=0.0.0.0 npm run dev
```

## 📁 プロジェクト構造

```
biz-dev-agent3/
├── .kiro/                 # 仕様管理
│   ├── specs/            # エージェント仕様書
│   └── steering/         # プロジェクト誘導文書
├── app/                  # Next.js アプリケーション
│   ├── api/             # APIルート
│   └── components/      # UIコンポーネント
├── lib/                  # ライブラリ・ユーティリティ
│   ├── agents/          # エージェント実装
│   ├── database/        # DB関連
│   └── types/           # TypeScript型定義
├── docs/                 # ドキュメント
│   └── agents/          # エージェント個別ドキュメント
└── tools/               # ツール・スクリプト
    └── ccc/             # エージェント通信システム
```

## 🔧 開発ガイド

### 仕様駆動開発（Kiro）

本プロジェクトは仕様駆動開発を採用しています：

1. **仕様作成**: `/kiro:spec-init`でエージェント仕様を初期化
2. **要件定義**: `/kiro:spec-requirements`で要件文書生成
3. **設計**: `/kiro:spec-design`で設計文書作成
4. **タスク生成**: `/kiro:spec-tasks`で実装タスク生成
5. **実装**: タスクに基づいて実装

### コマンド一覧

```bash
# 開発
npm run dev         # 開発サーバー起動
npm run build       # プロダクションビルド
npm run start       # プロダクションサーバー起動

# 品質管理
npm run lint        # ESLint実行
npm run type-check  # TypeScriptチェック
npm run format      # Prettier実行

# データベース
npm run db:types    # Supabase型生成
```

## 🛠️ 技術スタック

### フロントエンド
- **Next.js 15.4.5**: Reactフレームワーク
- **React 19.1.1**: UIライブラリ
- **TypeScript 5.9.2**: 型安全性
- **Tailwind CSS 4.1.11**: スタイリング

### バックエンド
- **LangChain 0.3.30**: LLMオーケストレーション
- **LangGraph 0.4.4**: エージェントワークフロー
- **OpenAI 5.12.0**: 言語モデル
- **Supabase**: データベース・認証

### インフラ
- **Vercel**: ホスティング（推奨）
- **Supabase Edge Functions**: サーバーレス関数

## 📚 ドキュメント

### プロジェクトドキュメント
- [エージェント仕様書](.kiro/specs/) - 各エージェントの詳細仕様
- [API仕様](workspace/docs/api/) - APIエンドポイント仕様
- [アーキテクチャ](workspace/docs/architecture/) - システム設計
- [セットアップガイド](workspace/docs/setup/) - 環境構築手順

### エージェントドキュメント
- [Researcher Agent](workspace/docs/agents/researcher-agent.md)
- [Ideator Agent](workspace/docs/agents/ideator-agent.md)
- [Critic Agent](workspace/docs/agents/critic-agent.md)
- [Analyst Agent](workspace/docs/agents/analyst-agent.md)
- [Writer Agent](workspace/docs/agents/writer-agent.md)

## 🔥 トラブルシューティング

### よくある問題と解決方法

#### 1. Supabase接続エラー

**症状**: `Error: Invalid Supabase URL`

**解決方法**:
```bash
# URLが正しいか確認
echo $NEXT_PUBLIC_SUPABASE_URL

# プロジェクトがアクティブか確認
curl -I $NEXT_PUBLIC_SUPABASE_URL

# 環境変数を再読み込み
source .env.local
```

#### 2. OpenAI APIエラー

**症状**: `Error: Invalid API key`

**解決方法**:
```bash
# APIキーの形式確認（sk-で始まる）
echo $OPENAI_API_KEY | head -c 7

# API残高確認
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# レート制限確認
npm run check-openai-limits
```

#### 3. ビルドエラー

**症状**: `Type error: Cannot find module`

**解決方法**:
```bash
# 型定義を再生成
npm run db:types

# TypeScriptキャッシュクリア
rm -rf .next
npm run type-check

# 依存関係の再インストール
rm -rf node_modules package-lock.json
npm install
```

#### 4. メモリ不足エラー

**症状**: `JavaScript heap out of memory`

**解決方法**:
```bash
# メモリ制限を増やす
export NODE_OPTIONS="--max-old-space-size=8192"
npm run dev

# または package.json のスクリプトを修正
"dev": "NODE_OPTIONS='--max-old-space-size=8192' next dev"
```

#### 5. ポート競合

**症状**: `Port 3000 is already in use`

**解決方法**:
```bash
# 使用中のプロセスを確認
lsof -i :3000

# プロセスを終了
kill -9 $(lsof -t -i:3000)

# または別のポートで起動
PORT=3001 npm run dev
```

### デバッグ方法

#### ログレベルの変更
```bash
# 詳細ログを有効化
LOG_LEVEL=debug npm run dev

# エージェントのデバッグ
DEBUG=agent:* npm run dev
```

#### ブラウザデバッグ
```javascript
// localStorage でデバッグモード有効化
localStorage.setItem('debug', 'true');

// コンソールで状態確認
console.log(window.__APP_STATE__);
```

#### APIデバッグ
```bash
# cURLでAPI直接テスト
curl -X POST http://localhost:3000/api/agents/researcher/execute \
  -H "Content-Type: application/json" \
  -d '{"topic": "test"}'
```

### パフォーマンス問題

#### 遅い起動時間
```bash
# Turbopackを使用
npm run dev -- --turbo

# SWCを有効化
npm install @swc/core
```

#### API応答が遅い
```bash
# タイムアウト設定を確認
echo $AGENT_TIMEOUT

# キャッシュを有効化
AGENT_CACHE_TTL=7200 npm run dev
```

### サポート

問題が解決しない場合：

1. **エラーログを収集**:
   ```bash
   npm run collect-logs
   ```

2. **Issue作成**:
   [GitHub Issues](https://github.com/eijun-t/biz-dev-agent3/issues/new)

3. **必要な情報**:
   - エラーメッセージ全文
   - 実行環境（OS, Node.jsバージョン）
   - 再現手順
   - .env.local（機密情報は除く）

## 🤝 貢献

プルリクエストを歓迎します。大きな変更の場合は、まずissueを開いて変更内容を説明してください。

## 📄 ライセンス

ISC License

## 👥 開発チーム

三菱地所 新事業創出プロジェクトチーム

## 📞 サポート

問題が発生した場合は、[GitHub Issues](https://github.com/eijun-t/biz-dev-agent3/issues)で報告してください。

---

⚡ Powered by Claude Code & LangChain