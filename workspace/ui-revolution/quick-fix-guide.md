# 🚨 クイックフィックスガイド（16:00デモ用）

## 即座対応可能な問題と解決策

### 1. 🔴 WebSocket接続エラー
**症状**: "WebSocket connection failed"
```javascript
// 即座の修正
const ws = new WebSocket('ws://localhost:3001/ws');
ws.onerror = () => {
  // フォールバック: モックデータ使用
  useIntegrationBridge().bridge.simulateData();
};
```

### 2. 🔴 API遅延（>100ms）
**症状**: レスポンスが遅い
```javascript
// キャッシュ強制利用
const forceCache = true;
const data = searchCache.get(key) || await fetchWithTimeout(url, 1000);
```

### 3. 🔴 データベース接続失敗
**症状**: "Database connection error"
```javascript
// ローカルストレージフォールバック
if (!supabase) {
  return JSON.parse(localStorage.getItem('mockReports') || '[]');
}
```

### 4. 🟡 UI表示崩れ
**症状**: コンポーネントが重なる
```javascript
// レイアウト再計算
flowEngine.autoLayout();
d3.select('svg').call(zoom.transform, d3.zoomIdentity);
```

### 5. 🟡 メモリ使用量増大
**症状**: ページが重い
```javascript
// キャッシュクリア
searchCache.clear();
queryClient.clear();
flowEngine.reset();
```

### 6. 🟡 アニメーション遅延
**症状**: 60fps未達成
```javascript
// アニメーション簡略化
const SIMPLE_MODE = true;
d3.transition().duration(SIMPLE_MODE ? 100 : 500);
```

## 緊急時コマンド集

### サーバー再起動
```bash
# 全サービス再起動
pkill node
npm run dev &
npm run mock-ws &
```

### キャッシュクリア
```bash
# ブラウザキャッシュ
rm -rf .next/cache
# ローカルストレージ
localStorage.clear()
```

### テストデータ投入
```bash
# サンプルデータ作成
node scripts/seed-demo-data.js
```

## デモ中の緊急対応

### Plan A: 通常フロー
1. IntegratedDashboard表示
2. AgentPipeline実行
3. ReportHistory検索
4. パフォーマンス表示

### Plan B: 障害時フロー
1. モックデータモード起動
2. ローカル動作のみデモ
3. 録画済み動画表示
4. スライドで補完

### Plan C: 最小構成
1. 静的なUIのみ表示
2. コンセプト説明
3. コード解説
4. 成果指標提示

## Worker別サポート

### Worker1サポート
```javascript
// ReportHistory統合エラー時
import ReportHistory from './ReportHistory'; // 旧版使用
// API接続をモックに切り替え
const mockAPI = true;
```

### Worker2サポート
```javascript
// SSEエラー時
const eventSource = new EventSource('/api/mock/stream');
// WebSocketフォールバック
const ws = new WebSocket('ws://localhost:3001/fallback');
```

## 最終チェックリスト（15:55）

### 必須確認
- [ ] localhost:3000 アクセス可能
- [ ] /api/reports/search 応答確認
- [ ] AgentPipeline表示確認
- [ ] エラーログなし

### 推奨確認
- [ ] Chrome DevTools閉じる
- [ ] 不要なタブ閉じる
- [ ] ネットワーク安定
- [ ] バッテリー充電

## トラブル時の連絡

### 技術的問題
→ Worker3が5秒以内に解決

### UI問題
→ Worker1と連携対応

### API問題
→ Worker2と連携対応

---

**Remember: 完璧でなくても、動くことが最優先！**

デモ成功を確信しています！ 🚀