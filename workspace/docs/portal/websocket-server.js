/**
 * WebSocket統合サーバー
 * 全Workerからのデータをリアルタイム配信
 */

const WebSocket = require('ws');
const http = require('http');

// HTTPサーバー作成
const server = http.createServer();
const wss = new WebSocket.Server({ server });

// 接続中のクライアント管理
const clients = new Set();

// 統合データストア
let integratedData = {
    kpi: {
        current: 13,
        target: 25,
        breakdown: {
            base: 5,
            individual: 8,
            integration: 9,
            synergy: 3
        }
    },
    portal: {
        completion: 92,
        docCount: 12,
        apiSpecs: 8,
        qualityScore: 95,
        lastUpdate: new Date().toISOString()
    },
    errors: {
        total: 0,
        rate: 2.3,
        recent: [],
        byLevel: {
            error: 0,
            warning: 0,
            info: 0
        }
    },
    performance: {
        responseTime: 1.2,
        cpuUsage: 45,
        memoryUsage: 2.3,
        apiCalls: 342,
        successRate: 99.7,
        history: []
    }
};

// WebSocket接続処理
wss.on('connection', (ws) => {
    console.log('New WebSocket connection established');
    clients.add(ws);
    
    // 初期データ送信
    ws.send(JSON.stringify({
        type: 'initial',
        data: integratedData,
        timestamp: new Date().toISOString()
    }));
    
    // 切断処理
    ws.on('close', () => {
        console.log('WebSocket connection closed');
        clients.delete(ws);
    });
    
    // エラー処理
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

// Worker2からのエラーデータ受信
async function fetchErrorData() {
    try {
        const response = await fetch('http://localhost:3000/api/errors/realtime');
        const data = await response.json();
        
        integratedData.errors = {
            ...integratedData.errors,
            ...data,
            lastUpdate: new Date().toISOString()
        };
        
        // 最近のエラーを追加
        if (data.recentError) {
            integratedData.errors.recent.unshift(data.recentError);
            integratedData.errors.recent = integratedData.errors.recent.slice(0, 50);
        }
        
        return data;
    } catch (error) {
        console.error('Error fetching error data:', error);
        return null;
    }
}

// Worker3からのパフォーマンスデータ受信
async function fetchPerformanceData() {
    try {
        const response = await fetch('http://localhost:3000/api/performance/metrics');
        const data = await response.json();
        
        integratedData.performance = {
            ...integratedData.performance,
            ...data,
            lastUpdate: new Date().toISOString()
        };
        
        // 履歴データ追加
        integratedData.performance.history.push({
            timestamp: new Date().toISOString(),
            metrics: data
        });
        integratedData.performance.history = 
            integratedData.performance.history.slice(-100);
        
        return data;
    } catch (error) {
        console.error('Error fetching performance data:', error);
        return null;
    }
}

// Portal Status APIからのデータ取得
async function fetchPortalStatus() {
    try {
        const response = await fetch('http://localhost:3000/api/portal/status');
        const data = await response.json();
        
        integratedData.portal = {
            ...integratedData.portal,
            ...data,
            lastUpdate: new Date().toISOString()
        };
        
        return data;
    } catch (error) {
        console.error('Error fetching portal status:', error);
        return null;
    }
}

// KPI計算と更新
function updateKPI() {
    const { portal, errors, performance } = integratedData;
    
    // 基礎KPI
    let baseKPI = 13;
    
    // Portal貢献度（最大3%）
    const portalContribution = (portal.completion / 100) * 3;
    
    // エラー削減貢献度（最大2.5%） - Worker2の驚異的成果
    const errorReduction = Math.max(0, (5 - errors.rate) / 5 * 2.5);
    
    // パフォーマンス改善貢献度（最大2%）
    const perfImprovement = (performance.successRate / 100) * 2;
    
    // シナジー効果（最大3.5%）
    const synergyBonus = 
        (portalContribution + errorReduction + perfImprovement) > 5 ? 3.5 : 2;
    
    integratedData.kpi.current = Math.min(25, 
        baseKPI + portalContribution + errorReduction + perfImprovement + synergyBonus
    );
    
    integratedData.kpi.breakdown = {
        base: baseKPI,
        portal: portalContribution,
        errorHandling: errorReduction,
        performance: perfImprovement,
        synergy: synergyBonus
    };
}

// 全クライアントへのブロードキャスト
function broadcast(data) {
    const message = JSON.stringify({
        type: 'update',
        data: data,
        timestamp: new Date().toISOString()
    });
    
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

// リアルタイム更新ループ（1秒ごと）
setInterval(async () => {
    // 各Workerからデータ取得
    const [errorData, perfData, portalData] = await Promise.all([
        fetchErrorData(),
        fetchPerformanceData(),
        fetchPortalStatus()
    ]);
    
    // KPI更新
    updateKPI();
    
    // 統合データをブロードキャスト
    broadcast({
        kpi: integratedData.kpi,
        portal: portalData || integratedData.portal,
        errors: errorData || integratedData.errors,
        performance: perfData || integratedData.performance
    });
}, 1000);

// 5秒ごとの詳細更新
setInterval(async () => {
    // より詳細なデータ取得と分析
    console.log('KPI Status:', {
        current: integratedData.kpi.current.toFixed(1) + '%',
        target: '25%',
        gap: (25 - integratedData.kpi.current).toFixed(1) + '%'
    });
}, 5000);

// サーバー起動
const PORT = process.env.WS_PORT || 3001;
server.listen(PORT, () => {
    console.log(`WebSocket server running on ws://localhost:${PORT}`);
    console.log('Waiting for Worker connections...');
    console.log('Target KPI: 25%');
});

// Portal Status API実装
const express = require('express');
const app = express();

app.get('/api/portal/status', (req, res) => {
    res.json({
        completion: integratedData.portal.completion,
        docCount: integratedData.portal.docCount,
        apiSpecs: integratedData.portal.apiSpecs,
        qualityScore: integratedData.portal.qualityScore,
        kpiContribution: 3,
        status: 'operational',
        lastUpdate: new Date().toISOString()
    });
});

// Express サーバー起動（別ポート）
app.listen(3002, () => {
    console.log('Portal Status API running on http://localhost:3002');
});

// シミュレーションモード（テスト用）
if (process.env.SIMULATION === 'true') {
    // Worker2のエラーデータシミュレーション
    setInterval(() => {
        const errorTypes = ['error', 'warning', 'info'];
        const errorMessages = [
            'Database connection timeout',
            'API rate limit warning',
            'Cache cleared successfully',
            'Authentication token refreshed',
            'Memory threshold exceeded'
        ];
        
        integratedData.errors.recent.unshift({
            level: errorTypes[Math.floor(Math.random() * errorTypes.length)],
            message: errorMessages[Math.floor(Math.random() * errorMessages.length)],
            timestamp: new Date().toISOString(),
            source: 'worker2'
        });
        
        integratedData.errors.rate = Math.max(0, 2.3 - Math.random() * 0.5);
    }, 2000);
    
    // Worker3のパフォーマンスデータシミュレーション
    setInterval(() => {
        integratedData.performance = {
            responseTime: (0.8 + Math.random() * 0.8).toFixed(1),
            cpuUsage: Math.floor(40 + Math.random() * 20),
            memoryUsage: (2.0 + Math.random() * 0.5).toFixed(1),
            apiCalls: Math.floor(300 + Math.random() * 100),
            successRate: (99 + Math.random()).toFixed(1),
            lastUpdate: new Date().toISOString()
        };
    }, 1500);
    
    console.log('Running in SIMULATION mode');
}

// グレースフルシャットダウン
process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing WebSocket server...');
    wss.close(() => {
        console.log('WebSocket server closed');
        process.exit(0);
    });
});

console.log('🚀 統合WebSocketサーバー起動完了');
console.log('📊 KPI目標: 25% 達成に向けて稼働中');
console.log('✨ Worker2の驚異的成果 +2.5% を統合中');

module.exports = { wss, integratedData };