/**
 * WebSocket with Toast Notifications
 * エラー通知を統合したWebSocketフック
 */

import { useEffect, useCallback } from 'react';
import { useToast } from '@/components/Toast/Toast';
import { WebSocketClient, ConnectionState, MessageType } from '@/workspace/ui-revolution/lib/websocket-client';

interface UseWebSocketWithToastOptions {
  autoConnect?: boolean;
  showConnectionStatus?: boolean;
  showErrors?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

export const useWebSocketWithToast = (options: UseWebSocketWithToastOptions = {}) => {
  const { showSuccess, showError, showWarning, showInfo } = useToast();
  const {
    autoConnect = true,
    showConnectionStatus = true,
    showErrors = true
  } = options;

  // WebSocketクライアント初期化
  const client = useCallback(() => {
    const ws = new WebSocketClient({
      autoReconnect: true,
      reconnectInterval: 2000,
      maxReconnectAttempts: 5
    });

    // 接続イベント
    ws.on('connect', () => {
      if (showConnectionStatus) {
        showSuccess('接続成功', 'WebSocketサーバーに接続しました');
      }
      options.onConnect?.();
    });

    // 切断イベント
    ws.on('disconnect', () => {
      if (showConnectionStatus) {
        showWarning('接続切断', 'WebSocketサーバーから切断されました');
      }
      options.onDisconnect?.();
    });

    // 再接続イベント
    ws.on('reconnecting', (data: any) => {
      if (showConnectionStatus) {
        showInfo(
          '再接続中',
          `接続を再試行しています (${data.attempt}/${data.maxAttempts})`
        );
      }
    });

    // エラーイベント
    ws.on('error', (error: Error) => {
      if (showErrors) {
        showError(
          'WebSocketエラー',
          error.message,
          {
            label: '再接続',
            onClick: () => ws.connect()
          }
        );
      }
      options.onError?.(error);
    });

    // エージェントエラー
    ws.on('message', (message: any) => {
      if (message.type === MessageType.AGENT_ERROR) {
        showError(
          `エージェントエラー: ${message.agent}`,
          message.data.error
        );
      }
      
      // システムエラー
      if (message.type === MessageType.SYSTEM_ERROR) {
        showError(
          'システムエラー',
          message.data.error,
          {
            label: '詳細を見る',
            onClick: () => console.error('Error details:', message.data)
          }
        );
      }
    });

    return ws;
  }, [showSuccess, showError, showWarning, showInfo, showConnectionStatus, showErrors, options]);

  useEffect(() => {
    const ws = client();
    
    if (autoConnect) {
      ws.connect().catch(error => {
        showError(
          '接続失敗',
          'WebSocketサーバーに接続できませんでした',
          {
            label: '再試行',
            onClick: () => ws.connect()
          }
        );
      });
    }

    return () => {
      ws.disconnect();
    };
  }, [client, autoConnect, showError]);

  return client();
};

/**
 * エラー監視コンポーネント
 */
export const WebSocketErrorMonitor: React.FC = () => {
  const { showError, showWarning, showInfo } = useToast();

  useEffect(() => {
    // グローバルエラーハンドラー
    const handleError = (event: ErrorEvent) => {
      if (event.message.includes('WebSocket')) {
        showError('WebSocket接続エラー', event.message);
      }
    };

    // ネットワーク状態監視
    const handleOnline = () => {
      showSuccess('オンライン', 'インターネット接続が復旧しました');
    };

    const handleOffline = () => {
      showWarning('オフライン', 'インターネット接続が切断されました');
    };

    window.addEventListener('error', handleError);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showError, showWarning, showInfo]);

  return null;
};

/**
 * エラー統計表示
 */
interface ErrorStats {
  total: number;
  byType: Record<string, number>;
  lastError?: {
    message: string;
    timestamp: Date;
  };
}

export const useErrorStats = () => {
  const [stats, setStats] = useState<ErrorStats>({
    total: 0,
    byType: {}
  });

  const recordError = useCallback((type: string, message: string) => {
    setStats(prev => ({
      total: prev.total + 1,
      byType: {
        ...prev.byType,
        [type]: (prev.byType[type] || 0) + 1
      },
      lastError: {
        message,
        timestamp: new Date()
      }
    }));
  }, []);

  const resetStats = useCallback(() => {
    setStats({
      total: 0,
      byType: {}
    });
  }, []);

  return { stats, recordError, resetStats };
};