# クイックスタートガイド

## 🚀 30分でシステムを起動する

### 前提条件チェックリスト

- [ ] Node.js 18.0以上がインストール済み
- [ ] GitHubアカウントを持っている
- [ ] Supabaseアカウントを作成済み
- [ ] OpenAI APIキーを取得済み
- [ ] Serper APIキーを取得済み

### Step 1: プロジェクトセットアップ（5分）

```bash
# リポジトリのクローン
git clone https://github.com/eijun-t/biz-dev-agent3.git
cd biz-dev-agent3

# 依存関係インストール
npm install
```

### Step 2: 環境変数設定（10分）

1. `.env.example`をコピーして`.env.local`を作成：
```bash
cp .env.example .env.local
```

2. `.env.local`を編集して必要なキーを設定：
```env
# Supabase（https://supabase.com/dashboard/projectより取得）
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OpenAI（https://platform.openai.com/api-keysより取得）
OPENAI_API_KEY=sk-...

# Serper（https://serper.devより取得）
SERPER_API_KEY=...
```

### Step 3: データベース初期化（5分）

```bash
# Supabase CLIでマイグレーション実行
npx supabase db push

# 型定義生成
npm run db:types
```

### Step 4: 開発サーバー起動（2分）

```bash
npm run dev
```

ブラウザで http://localhost:3000 を開く

### Step 5: 動作確認（8分）

1. **エージェント通信テスト**
   - 画面右上の「Test Agents」ボタンをクリック
   - 各エージェントのステータスが「✅ Ready」になることを確認

2. **サンプルワークフロー実行**
   - 「新規プロジェクト作成」をクリック
   - テーマに「スマートシティ」と入力
   - 「アイディエーション開始」をクリック

3. **結果確認**
   - 5-10分でアイディエーション結果が表示される
   - レポートダウンロードボタンでPDFエクスポート可能

## 🔧 トラブルシューティング

### よくある問題と解決方法

#### 1. npm installでエラー
```bash
# node_modulesをクリーンアップ
rm -rf node_modules package-lock.json
npm install
```

#### 2. Supabase接続エラー
- Supabase Dashboardでプロジェクトがアクティブか確認
- API キーが正しくコピーされているか確認
- ファイアウォール設定を確認

#### 3. OpenAI APIエラー
- API残高を確認（https://platform.openai.com/usage）
- レート制限に達していないか確認
- APIキーの権限を確認

#### 4. ポート3000が使用中
```bash
# 別のポートで起動
PORT=3001 npm run dev
```

## 📚 次のステップ

- [アーキテクチャ概要](../architecture/overview.md)
- [エージェント詳細](../agents/index.md)
- [API仕様](../api/reference.md)
- [本番環境デプロイ](deployment.md)

## 💬 サポート

問題が解決しない場合：
1. [GitHub Issues](https://github.com/eijun-t/biz-dev-agent3/issues)で検索
2. 新しいIssueを作成
3. Discordコミュニティで質問（準備中）