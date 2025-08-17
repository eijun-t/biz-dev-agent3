# 🚀 5分でできる！初めてのエージェント起動

## 🎯 このチュートリアルで学べること

- エージェントシステムの基本的な動作確認
- Researcher Agentを使った簡単な市場調査
- 結果の確認方法

**所要時間**: 約5分
**前提条件**: セットアップ完了済み（[クイックスタート](../setup/quick-start.md)参照）

## 📋 ステップ1: 開発サーバーの起動（1分）

```bash
# プロジェクトディレクトリに移動
cd biz-dev-agent3

# 開発サーバーを起動
npm run dev
```

✅ **確認ポイント**: 
- ターミナルに `ready - started server on 0.0.0.0:3000` が表示される
- エラーが出ていない

## 🌐 ステップ2: ブラウザでアプリケーションを開く（30秒）

1. ブラウザを開く
2. アドレスバーに `http://localhost:3000` を入力
3. Enterキーを押す

✅ **確認ポイント**: 
- アプリケーションのホーム画面が表示される
- コンソールにエラーが出ていない（F12で開発者ツールを開いて確認）

## 🧪 ステップ3: エージェントの動作確認（1分）

### A. ヘルスチェック

画面右上の「**Test Agents**」ボタンをクリック

期待される結果:
```
✅ Researcher: Ready
✅ Ideator: Ready
✅ Critic: Ready
✅ Analyst: Ready
✅ Writer: Ready
✅ Orchestrator: Ready
```

### B. API疎通確認

開発者ツールのコンソールで以下を実行:
```javascript
fetch('/api/health')
  .then(res => res.json())
  .then(data => console.log(data));
```

期待される結果:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "services": {
    "database": "connected",
    "openai": "available",
    "serper": "available"
  }
}
```

## 🔍 ステップ4: 初めての市場調査を実行（2分）

### A. 新規プロジェクト作成

1. 「**新規プロジェクト作成**」ボタンをクリック
2. プロジェクト名: `初めての調査`
3. 調査テーマ: `AIアシスタント市場`

### B. Researcher Agent単体実行

```javascript
// コンソールで実行（または画面から操作）
const runResearch = async () => {
  const response = await fetch('/api/agents/researcher/run', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      topic: 'AIアシスタント市場',
      scope: {
        industries: ['テクノロジー'],
        regions: ['日本'],
        timeframe: '2024-2025'
      },
      depth: 'basic'
    })
  });
  
  const result = await response.json();
  console.log('調査結果:', result);
  return result;
};

runResearch();
```

### C. 結果の確認

15-30秒後に結果が表示されます:

```json
{
  "success": true,
  "data": {
    "summary": {
      "overview": "AIアシスタント市場は急成長中...",
      "keyFindings": [
        "市場規模は年率30%で成長",
        "主要プレイヤーはOpenAI, Google, Amazon"
      ],
      "opportunities": [
        "業界特化型AIアシスタント",
        "多言語対応ソリューション"
      ]
    }
  }
}
```

## 📊 ステップ5: 結果の可視化（30秒）

画面上で結果を確認:

1. **サマリータブ**: 市場概要
2. **詳細タブ**: 詳細な分析結果
3. **ソースタブ**: 参照した情報源

## 🎉 完了！

おめでとうございます！初めてのエージェント実行が成功しました。

### 次のステップ

1. **複数エージェントの連携**
   ```javascript
   // 全エージェントを実行
   fetch('/api/agents/execute', {
     method: 'POST',
     headers: {'Content-Type': 'application/json'},
     body: JSON.stringify({
       topic: 'AIアシスタント市場',
       config: {depth: 'comprehensive'}
     })
   });
   ```

2. **カスタマイズ**
   - 検索キーワードを追加
   - 分析の深さを調整
   - 地域や業界を変更

3. **本格的な活用**
   - [エージェント詳細ドキュメント](../agents/)を読む
   - [API仕様](../api/api-reference.md)を確認
   - 独自のワークフローを作成

## ❓ トラブルシューティング

### よくある問題

#### 1. 「Test Agents」で一部が Failed
**原因**: 環境変数が正しく設定されていない
**解決策**: 
```bash
# .env.localを確認
cat .env.local | grep API_KEY
```

#### 2. 調査結果が返ってこない
**原因**: Serper APIのレート制限
**解決策**: 
- 数分待ってから再試行
- API使用量を確認

#### 3. エラー: "Invalid API key"
**原因**: OpenAI APIキーが無効
**解決策**:
```bash
# APIキーをテスト
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

## 💡 Tips

### パフォーマンスを向上させる

1. **キャッシュを活用**
   ```javascript
   // 同じトピックの2回目以降は高速
   localStorage.setItem('cache_enabled', 'true');
   ```

2. **並列実行**
   ```javascript
   // 複数の調査を同時実行
   Promise.all([
     runResearch('トピック1'),
     runResearch('トピック2')
   ]);
   ```

3. **軽量モードで試す**
   ```javascript
   // depth: 'basic' で高速実行
   {depth: 'basic'} // 15秒
   {depth: 'standard'} // 30秒
   {depth: 'comprehensive'} // 60秒
   ```

## 📚 関連リソース

- [Researcher Agent詳細](../agents/researcher-agent.md)
- [API使用例](../api/examples.md)
- [よくある質問](../help/faq.md)

---

**困ったときは**: [GitHub Issues](https://github.com/eijun-t/biz-dev-agent3/issues)で質問してください！

⏰ **実行時間**: 約5分で完了！