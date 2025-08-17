# 🤝 コントリビューションガイド

自律型アイディエーションエージェントAIプロジェクトへの貢献を歓迎します！

## 📋 目次

- [行動規範](#行動規範)
- [貢献の方法](#貢献の方法)
- [開発環境のセットアップ](#開発環境のセットアップ)
- [開発フロー](#開発フロー)
- [コーディング規約](#コーディング規約)
- [コミットメッセージ](#コミットメッセージ)
- [プルリクエスト](#プルリクエスト)
- [Issue報告](#issue報告)

## 行動規範

### 基本原則

- **敬意**: すべての貢献者に敬意を払う
- **建設的**: 批判ではなく改善提案を
- **協力的**: チームとして問題解決に取り組む
- **透明性**: 決定プロセスをオープンに

## 貢献の方法

### 1. 🐛 バグ報告
- [Issue](https://github.com/eijun-t/biz-dev-agent3/issues/new?template=bug_report.md)を作成
- 再現手順を明確に記載
- 環境情報を含める

### 2. ✨ 機能提案
- [Feature Request](https://github.com/eijun-t/biz-dev-agent3/issues/new?template=feature_request.md)を作成
- ユースケースを説明
- 実装案があれば記載

### 3. 📝 ドキュメント改善
- 誤字脱字の修正
- 説明の改善
- 新しい例の追加

### 4. 💻 コード貢献
- バグ修正
- 新機能実装
- パフォーマンス改善
- テスト追加

## 開発環境のセットアップ

### 1. フォークとクローン

```bash
# リポジトリをフォーク（GitHubウェブサイトで）

# フォークしたリポジトリをクローン
git clone https://github.com/YOUR_USERNAME/biz-dev-agent3.git
cd biz-dev-agent3

# 上流リポジトリを追加
git remote add upstream https://github.com/eijun-t/biz-dev-agent3.git
```

### 2. ブランチ作成

```bash
# 最新のmainブランチを取得
git fetch upstream
git checkout main
git merge upstream/main

# 機能ブランチを作成
git checkout -b feature/your-feature-name
# または
git checkout -b fix/bug-description
```

### 3. 開発環境構築

```bash
# 依存関係インストール
npm install

# 環境変数設定
cp .env.example .env.local
# .env.localを編集

# 開発サーバー起動
npm run dev
```

## 開発フロー

### 1. 仕様作成（新機能の場合）

```bash
# Kiroコマンドで仕様書作成
/kiro:spec-init "新機能の詳細説明"
/kiro:spec-requirements [feature-name]
/kiro:spec-design [feature-name]
/kiro:spec-tasks [feature-name]
```

### 2. 実装

```bash
# コード実装
# テスト作成
# ドキュメント更新
```

### 3. テスト実行

```bash
# 型チェック
npm run type-check

# リント
npm run lint

# フォーマット
npm run format

# テスト実行
npm test

# 統合テスト
npm run test:integration
```

### 4. コミット

```bash
# 変更をステージング
git add .

# コミット（後述の規約に従う）
git commit -m "feat: add new feature"
```

### 5. プッシュとPR作成

```bash
# フォークにプッシュ
git push origin feature/your-feature-name

# GitHubでPRを作成
```

## コーディング規約

### TypeScript/JavaScript

```typescript
// ✅ Good: 明確な型定義
interface AgentInput {
  topic: string;
  scope: {
    industries: string[];
    regions: string[];
  };
}

// ❌ Bad: any型の使用
function processData(data: any) {
  // ...
}

// ✅ Good: エラーハンドリング
try {
  const result = await agent.execute(input);
  return { success: true, data: result };
} catch (error) {
  logger.error('Agent execution failed', error);
  return { success: false, error: error.message };
}

// ✅ Good: 早期リターン
function validateInput(input: AgentInput): boolean {
  if (!input.topic) return false;
  if (!input.scope) return false;
  if (input.scope.industries.length === 0) return false;
  
  return true;
}
```

### React/Next.js

```tsx
// ✅ Good: 関数コンポーネント + TypeScript
interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({ 
  onClick, 
  children, 
  variant = 'primary' 
}) => {
  return (
    <button
      className={`btn btn-${variant}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

// ✅ Good: カスタムフック
function useAgent(agentType: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const execute = useCallback(async (input: AgentInput) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await api.executeAgent(agentType, input);
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [agentType]);
  
  return { execute, loading, error };
}
```

### スタイルガイド

- **インデント**: スペース2つ
- **セミコロン**: 必須
- **クォート**: シングルクォート（JSX属性はダブル）
- **行の長さ**: 100文字以内
- **ファイル名**: kebab-case
- **コンポーネント名**: PascalCase
- **関数名**: camelCase
- **定数**: UPPER_SNAKE_CASE

## コミットメッセージ

### フォーマット

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type

- **feat**: 新機能
- **fix**: バグ修正
- **docs**: ドキュメント
- **style**: フォーマット変更
- **refactor**: リファクタリング
- **perf**: パフォーマンス改善
- **test**: テスト追加・修正
- **chore**: ビルドプロセスなど

### 例

```bash
# 新機能
git commit -m "feat(agent): add caching to researcher agent"

# バグ修正
git commit -m "fix(api): handle timeout errors properly"

# ドキュメント
git commit -m "docs(readme): update installation instructions"

# 複数行の場合
git commit -m "feat(ui): add dark mode support

- Add theme context provider
- Update all components to support themes
- Add theme toggle button in header

Closes #123"
```

## プルリクエスト

### PRテンプレート

```markdown
## 概要
変更の概要を記載

## 変更内容
- [ ] 変更点1
- [ ] 変更点2

## 変更の種類
- [ ] バグ修正
- [ ] 新機能
- [ ] Breaking Change
- [ ] ドキュメント更新

## テスト
- [ ] 既存のテストがパス
- [ ] 新しいテストを追加
- [ ] 手動でテスト済み

## チェックリスト
- [ ] コードがプロジェクトのスタイルガイドに従っている
- [ ] セルフレビュー実施済み
- [ ] ドキュメントを更新した
- [ ] 変更が破壊的でない（または適切に文書化されている）

## スクリーンショット（UIの変更がある場合）
変更前後のスクリーンショットを添付

## 関連Issue
Closes #(issue番号)
```

### PRのベストプラクティス

1. **小さく保つ**: 1つのPRで1つの機能/修正
2. **テストを含める**: 新機能には必ずテストを
3. **ドキュメント更新**: 必要に応じてREADMEやドキュメントを更新
4. **レビュー対応**: フィードバックに迅速に対応

## Issue報告

### バグ報告テンプレート

```markdown
## バグの説明
バグの明確で簡潔な説明

## 再現手順
1. '...'に移動
2. '...'をクリック
3. '...'までスクロール
4. エラーが表示される

## 期待される動作
期待される動作の説明

## スクリーンショット
該当する場合は、スクリーンショットを追加

## 環境
- OS: [例: macOS 13.0]
- ブラウザ: [例: Chrome 120]
- Node.js: [例: v18.17.0]
- npm: [例: 9.6.7]

## 追加情報
その他の関連情報
```

### 機能リクエストテンプレート

```markdown
## 機能の説明
提案する機能の明確で簡潔な説明

## 動機
なぜこの機能が必要か

## 提案する解決策
どのように実装すべきか

## 代替案
検討した代替案

## 追加情報
その他の関連情報やスクリーンショット
```

## レビュープロセス

### レビュアーガイドライン

1. **建設的なフィードバック**: 改善案を提示
2. **コードの動作確認**: 実際に動かしてテスト
3. **パフォーマンス考慮**: 大規模データでの動作確認
4. **セキュリティチェック**: 脆弱性がないか確認

### レビュー承認基準

- [ ] コードが正しく動作する
- [ ] テストが全てパス
- [ ] ドキュメントが更新されている
- [ ] コーディング規約に従っている
- [ ] パフォーマンスに問題がない
- [ ] セキュリティに問題がない

## リリースプロセス

1. **フィーチャーフリーズ**: リリース1週間前
2. **テスト期間**: 3日間の集中テスト
3. **ドキュメント更新**: リリースノート作成
4. **タグ付け**: セマンティックバージョニング
5. **デプロイ**: ステージング → 本番

## コミュニティ

### コミュニケーションチャンネル

- **GitHub Issues**: バグ報告・機能提案
- **GitHub Discussions**: 一般的な議論
- **Discord**: リアルタイムチャット（準備中）

### 定期イベント

- **月次ミーティング**: 第1火曜日 20:00 JST
- **コードレビュー会**: 毎週金曜日
- **ハッカソン**: 四半期ごと

## ライセンス

貢献されたコードは、プロジェクトと同じ[ISCライセンス](LICENSE)の下でリリースされます。

## 謝辞

すべての貢献者に感謝します！

[![Contributors](https://contrib.rocks/image?repo=eijun-t/biz-dev-agent3)](https://github.com/eijun-t/biz-dev-agent3/graphs/contributors)

---

質問がある場合は、[Issue](https://github.com/eijun-t/biz-dev-agent3/issues)を作成するか、メンテナーに連絡してください。

**Happy Contributing! 🎉**