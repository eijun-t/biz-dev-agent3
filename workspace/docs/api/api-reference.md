# API リファレンス

## 🌐 API概要

### ベースURL
```
Development: http://localhost:3000/api
Staging: https://staging.example.com/api
Production: https://api.example.com/api
```

### 認証
```http
Authorization: Bearer {token}
Content-Type: application/json
```

### レート制限
- 開発環境: 無制限
- 本番環境: 1000 req/hour per IP
- 認証済み: 10000 req/hour per user

## 📍 エンドポイント一覧

### 1. エージェント実行API

#### 全エージェント実行
```http
POST /api/agents/execute
```

**リクエスト:**
```json
{
  "projectId": "uuid",
  "topic": "スマートシティ市場調査",
  "config": {
    "depth": "comprehensive",
    "timeout": 90000,
    "streaming": true
  }
}
```

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "projectId": "uuid",
    "status": "completed",
    "results": {
      "research": {...},
      "ideas": [...],
      "selectedIdeas": [...],
      "analysis": {...},
      "report": {...}
    },
    "executionTime": 87500,
    "timestamp": "2025-01-17T10:00:00Z"
  }
}
```

**エラーレスポンス:**
```json
{
  "success": false,
  "error": {
    "code": "AGENT_TIMEOUT",
    "message": "Agent execution timed out",
    "details": {
      "agent": "researcher",
      "timeout": 30000
    }
  }
}
```

### 2. 個別エージェントAPI

#### Researcher Agent
```http
POST /api/agents/researcher/run
```

**リクエスト:**
```json
{
  "topic": "スマートシティ市場",
  "scope": {
    "industries": ["IoT", "インフラ"],
    "regions": ["日本", "アジア"],
    "timeframe": "2024-2030"
  },
  "depth": "standard",
  "keywords": ["デジタルツイン", "5G"]
}
```

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "overview": "市場概要...",
      "keyFindings": ["発見1", "発見2"],
      "opportunities": ["機会1", "機会2"]
    },
    "marketAnalysis": {
      "size": 5000000000,
      "growth": 15.5,
      "trends": [...]
    },
    "sources": [
      {
        "title": "記事タイトル",
        "url": "https://...",
        "snippet": "要約..."
      }
    ]
  }
}
```

#### Ideator Agent
```http
POST /api/agents/ideator/run
```

**リクエスト:**
```json
{
  "researchData": {
    "summary": "...",
    "marketAnalysis": {...},
    "opportunities": [...]
  },
  "constraints": {
    "budget": "10億円",
    "timeline": "3年",
    "resources": "50名"
  },
  "preferences": {
    "riskLevel": "medium",
    "innovationLevel": "high"
  }
}
```

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "ideas": [
      {
        "id": "idea-001",
        "title": "スマートビルディング管理プラットフォーム",
        "description": "詳細説明...",
        "targetMarket": "商業不動産オーナー",
        "problemSolved": "エネルギー効率化",
        "valueProposition": "30%のコスト削減",
        "revenueModel": "SaaS月額課金",
        "estimatedRevenue": 1000000000,
        "feasibilityScore": 0.85
      }
    ]
  }
}
```

#### Critic Agent
```http
POST /api/agents/critic/run
```

**リクエスト:**
```json
{
  "ideas": [...],
  "criteria": {
    "marketPotential": 0.3,
    "feasibility": 0.25,
    "innovation": 0.2,
    "competitiveAdvantage": 0.15,
    "riskLevel": 0.1
  },
  "threshold": 0.7
}
```

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "evaluations": [
      {
        "ideaId": "idea-001",
        "scores": {
          "marketPotential": 0.85,
          "feasibility": 0.75,
          "innovation": 0.90,
          "competitiveAdvantage": 0.70,
          "riskLevel": 0.80
        },
        "totalScore": 0.81,
        "recommendation": "highly_recommended",
        "feedback": "強み: 革新性が高い..."
      }
    ],
    "selectedIdeas": ["idea-001", "idea-003"],
    "summary": "2つのアイデアを推奨..."
  }
}
```

#### Analyst Agent
```http
POST /api/agents/analyst/run
```

**リクエスト:**
```json
{
  "selectedIdeas": [...],
  "analysisDepth": "comprehensive",
  "focusAreas": [
    "market_sizing",
    "competitor_analysis",
    "financial_projection",
    "risk_assessment"
  ]
}
```

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "analyses": {
      "idea-001": {
        "marketSizing": {
          "tam": 50000000000,
          "sam": 10000000000,
          "som": 1000000000
        },
        "competitors": [...],
        "financials": {
          "year1": {...},
          "year3": {...},
          "year5": {...}
        },
        "risks": [...]
      }
    }
  }
}
```

#### Writer Agent
```http
POST /api/agents/writer/run
```

**リクエスト:**
```json
{
  "criticOutput": {...},
  "analystOutput": {...},
  "format": "executive_summary",
  "language": "ja",
  "sections": [
    "overview",
    "recommendations",
    "financial_analysis",
    "next_steps"
  ]
}
```

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "report": {
      "title": "新事業提案書",
      "executiveSummary": "...",
      "sections": {
        "overview": "...",
        "recommendations": "...",
        "financialAnalysis": "...",
        "nextSteps": "..."
      },
      "appendix": [...],
      "metadata": {
        "wordCount": 5000,
        "generatedAt": "2025-01-17T10:00:00Z"
      }
    },
    "formats": {
      "markdown": "...",
      "html": "...",
      "pdf": "base64..."
    }
  }
}
```

### 3. プロジェクト管理API

#### プロジェクト作成
```http
POST /api/projects
```

**リクエスト:**
```json
{
  "name": "スマートシティ調査2025",
  "description": "次世代都市開発の市場調査",
  "tags": ["IoT", "インフラ"],
  "config": {
    "autoSave": true,
    "notifications": true
  }
}
```

#### プロジェクト取得
```http
GET /api/projects/{projectId}
```

#### プロジェクト一覧
```http
GET /api/projects?page=1&limit=10&status=active
```

#### プロジェクト更新
```http
PUT /api/projects/{projectId}
```

#### プロジェクト削除
```http
DELETE /api/projects/{projectId}
```

### 4. レポート管理API

#### レポート生成
```http
POST /api/reports/generate
```

**リクエスト:**
```json
{
  "projectId": "uuid",
  "format": "pdf",
  "template": "executive",
  "includeAppendix": true
}
```

#### レポートダウンロード
```http
GET /api/reports/{reportId}/download
```

**レスポンス:**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="report-2025-01-17.pdf"
```

### 5. ステータスAPI

#### ヘルスチェック
```http
GET /api/health
```

**レスポンス:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime": 86400,
  "services": {
    "database": "connected",
    "openai": "available",
    "serper": "available"
  }
}
```

#### エージェントステータス
```http
GET /api/agents/status
```

**レスポンス:**
```json
{
  "agents": {
    "researcher": {
      "status": "ready",
      "lastRun": "2025-01-17T09:30:00Z",
      "avgExecutionTime": 25000
    },
    "ideator": {
      "status": "ready",
      "lastRun": "2025-01-17T09:35:00Z",
      "avgExecutionTime": 15000
    }
  }
}
```

## 🔐 認証とセキュリティ

### JWT トークン形式
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "admin",
  "iat": 1737108000,
  "exp": 1737194400
}
```

### APIキー管理
```http
POST /api/auth/api-keys
GET /api/auth/api-keys
DELETE /api/auth/api-keys/{keyId}
```

## ⚡ WebSocket API

### リアルタイム実行状況
```javascript
const ws = new WebSocket('wss://api.example.com/ws');

ws.send(JSON.stringify({
  type: 'subscribe',
  projectId: 'uuid'
}));

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // {
  //   type: 'agent_update',
  //   agent: 'researcher',
  //   status: 'running',
  //   progress: 0.5
  // }
};
```

## 🔄 エラーコード

| コード | 説明 | 対処法 |
|-------|------|--------|
| `AGENT_TIMEOUT` | エージェントタイムアウト | timeout値を増やす |
| `RATE_LIMIT_EXCEEDED` | レート制限超過 | リトライまたは待機 |
| `INVALID_API_KEY` | 無効なAPIキー | APIキーを確認 |
| `INSUFFICIENT_CREDITS` | クレジット不足 | クレジット追加 |
| `AGENT_ERROR` | エージェント内部エラー | ログ確認、再試行 |
| `VALIDATION_ERROR` | 入力検証エラー | パラメータ修正 |

## 📝 使用例

### cURL
```bash
curl -X POST https://api.example.com/api/agents/execute \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "スマートシティ",
    "config": {"depth": "standard"}
  }'
```

### JavaScript/TypeScript
```typescript
const response = await fetch('/api/agents/execute', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    topic: 'スマートシティ',
    config: { depth: 'standard' }
  })
});

const data = await response.json();
```

### Python
```python
import requests

response = requests.post(
    'https://api.example.com/api/agents/execute',
    headers={
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    },
    json={
        'topic': 'スマートシティ',
        'config': {'depth': 'standard'}
    }
)

data = response.json()
```

## 📊 レスポンスコード

| コード | 意味 | 説明 |
|-------|------|------|
| 200 | OK | リクエスト成功 |
| 201 | Created | リソース作成成功 |
| 202 | Accepted | 非同期処理開始 |
| 400 | Bad Request | リクエスト不正 |
| 401 | Unauthorized | 認証失敗 |
| 403 | Forbidden | アクセス拒否 |
| 404 | Not Found | リソース不在 |
| 429 | Too Many Requests | レート制限 |
| 500 | Internal Server Error | サーバーエラー |
| 503 | Service Unavailable | サービス利用不可 |

---

最終更新: 2025-01-17
APIバージョン: v1.0.0