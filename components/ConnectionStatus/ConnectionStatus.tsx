/**
 * Connection Status Component
 * オンライン/オフライン状態表示
 */

import React, { useState, useEffect } from 'react';
import { WebSocketClient, ConnectionState } from '@/workspace/ui-revolution/lib/websocket-client';

interface ConnectionStatusProps {
  client?: WebSocketClient;
  className?: string;
  showDetails?: boolean;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  client,
  className = '',
  showDetails = false
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [metrics, setMetrics] = useState<any>({});

  useEffect(() => {
    // ネットワーク状態監視
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // WebSocket状態監視
    if (client) {
      const updateState = (state: ConnectionState) => {
        setConnectionState(state);
      };

      const updateMetrics = () => {
        setMetrics(client.getMetrics());
      };

      client.on('stateChange', updateState);
      
      // メトリクス更新
      const metricsInterval = setInterval(updateMetrics, 1000);

      return () => {
        client.off('stateChange', updateState);
        clearInterval(metricsInterval);
      };
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [client]);

  const getStatusColor = () => {
    if (!isOnline) return 'bg-gray-500';
    
    switch (connectionState) {
      case ConnectionState.CONNECTED:
        return 'bg-green-500';
      case ConnectionState.CONNECTING:
      case ConnectionState.RECONNECTING:
        return 'bg-yellow-500';
      case ConnectionState.ERROR:
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    if (!isOnline) return 'オフライン';
    
    switch (connectionState) {
      case ConnectionState.CONNECTED:
        return 'オンライン';
      case ConnectionState.CONNECTING:
        return '接続中...';
      case ConnectionState.RECONNECTING:
        return '再接続中...';
      case ConnectionState.ERROR:
        return 'エラー';
      case ConnectionState.DISCONNECTED:
        return '未接続';
      default:
        return '不明';
    }
  };

  const getLatencyIndicator = () => {
    const latency = metrics.averageLatency || 0;
    if (latency === 0) return 'bg-gray-400';
    if (latency < 50) return 'bg-green-400';
    if (latency < 100) return 'bg-yellow-400';
    return 'bg-red-400';
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* ステータスインジケーター */}
      <div className="relative">
        <div className={`w-3 h-3 rounded-full ${getStatusColor()}`}>
          {connectionState === ConnectionState.CONNECTED && (
            <div className="absolute inset-0 rounded-full animate-ping opacity-75 bg-green-400" />
          )}
        </div>
      </div>

      {/* ステータステキスト */}
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {getStatusText()}
      </span>

      {/* 詳細情報 */}
      {showDetails && connectionState === ConnectionState.CONNECTED && (
        <>
          {/* レイテンシ */}
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${getLatencyIndicator()}`} />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {metrics.averageLatency?.toFixed(0) || 0}ms
            </span>
          </div>

          {/* メッセージ数 */}
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {metrics.messagesSent || 0} msgs
          </span>
        </>
      )}
    </div>
  );
};

/**
 * 接続状態バー（画面上部固定）
 */
export const ConnectionBar: React.FC<{ client?: WebSocketClient }> = ({ client }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'info' | 'warning' | 'error'>('info');

  useEffect(() => {
    if (!client) return;

    const handleStateChange = (state: ConnectionState) => {
      switch (state) {
        case ConnectionState.RECONNECTING:
          setMessage('接続が失われました。再接続を試みています...');
          setType('warning');
          setIsVisible(true);
          break;
        case ConnectionState.ERROR:
          setMessage('接続エラーが発生しました');
          setType('error');
          setIsVisible(true);
          break;
        case ConnectionState.CONNECTED:
          if (isVisible) {
            setMessage('接続が回復しました');
            setType('info');
            setTimeout(() => setIsVisible(false), 3000);
          }
          break;
      }
    };

    client.on('stateChange', handleStateChange);

    return () => {
      client.off('stateChange', handleStateChange);
    };
  }, [client, isVisible]);

  if (!isVisible) return null;

  const bgColor = {
    info: 'bg-blue-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500'
  }[type];

  return (
    <div className={`fixed top-0 left-0 right-0 ${bgColor} text-white py-2 px-4 z-50 shadow-lg`}>
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <span className="text-sm font-medium">{message}</span>
        <button
          onClick={() => setIsVisible(false)}
          className="text-white hover:text-gray-200"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

/**
 * ネットワーク品質インジケーター
 */
export const NetworkQualityIndicator: React.FC<{ latency: number }> = ({ latency }) => {
  const getQuality = () => {
    if (latency < 50) return { text: '優良', color: 'text-green-500', bars: 4 };
    if (latency < 100) return { text: '良好', color: 'text-yellow-500', bars: 3 };
    if (latency < 200) return { text: '普通', color: 'text-orange-500', bars: 2 };
    return { text: '不良', color: 'text-red-500', bars: 1 };
  };

  const quality = getQuality();

  return (
    <div className="flex items-center space-x-2">
      <div className="flex space-x-1">
        {[1, 2, 3, 4].map(bar => (
          <div
            key={bar}
            className={`w-1 bg-gray-300 dark:bg-gray-600 transition-all ${
              bar <= quality.bars ? quality.color.replace('text', 'bg') : ''
            }`}
            style={{ height: `${bar * 4}px` }}
          />
        ))}
      </div>
      <span className={`text-xs font-medium ${quality.color}`}>
        {quality.text}
      </span>
    </div>
  );
};