/**
 * Error Toast Component - Production Ready
 * 最優先実装: エラー通知システム
 */

import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

// エラーレベル定義
export enum ErrorLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
  SUCCESS = 'success'
}

// エラー通知インターフェース
export interface ErrorNotification {
  id: string;
  level: ErrorLevel;
  title: string;
  message: string;
  timestamp: Date;
  autoClose?: boolean;
  duration?: number;
  actions?: {
    label: string;
    onClick: () => void;
  }[];
  metadata?: {
    agent?: string;
    errorCode?: string;
    stack?: string;
  };
}

// グローバルエラーストア
class ErrorStore {
  private static instance: ErrorStore;
  private notifications: ErrorNotification[] = [];
  private listeners: Set<(notifications: ErrorNotification[]) => void> = new Set();
  private maxNotifications = 5;

  static getInstance() {
    if (!ErrorStore.instance) {
      ErrorStore.instance = new ErrorStore();
    }
    return ErrorStore.instance;
  }

  addNotification(notification: Omit<ErrorNotification, 'id' | 'timestamp'>) {
    const newNotification: ErrorNotification = {
      ...notification,
      id: `error-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      autoClose: notification.autoClose !== false,
      duration: notification.duration || (notification.level === ErrorLevel.ERROR ? 10000 : 5000)
    };

    this.notifications = [newNotification, ...this.notifications].slice(0, this.maxNotifications);
    this.notifyListeners();

    // 自動削除
    if (newNotification.autoClose) {
      setTimeout(() => {
        this.removeNotification(newNotification.id);
      }, newNotification.duration);
    }

    return newNotification.id;
  }

  removeNotification(id: string) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notifyListeners();
  }

  clearAll() {
    this.notifications = [];
    this.notifyListeners();
  }

  getNotifications() {
    return this.notifications;
  }

  subscribe(listener: (notifications: ErrorNotification[]) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.notifications));
  }
}

// エラーストアインスタンス
export const errorStore = ErrorStore.getInstance();

/**
 * 個別のトースト通知
 */
const ToastItem: React.FC<{ notification: ErrorNotification; onClose: () => void }> = ({ 
  notification, 
  onClose 
}) => {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (notification.autoClose) {
      const interval = setInterval(() => {
        setProgress(prev => Math.max(0, prev - (100 / (notification.duration! / 100))));
      }, 100);

      return () => clearInterval(interval);
    }
  }, [notification]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 300);
  };

  const getLevelStyles = () => {
    switch (notification.level) {
      case ErrorLevel.INFO:
        return 'bg-blue-500 border-blue-600';
      case ErrorLevel.WARNING:
        return 'bg-yellow-500 border-yellow-600';
      case ErrorLevel.ERROR:
        return 'bg-red-500 border-red-600';
      case ErrorLevel.CRITICAL:
        return 'bg-red-700 border-red-800 animate-pulse';
      case ErrorLevel.SUCCESS:
        return 'bg-green-500 border-green-600';
    }
  };

  const getIcon = () => {
    switch (notification.level) {
      case ErrorLevel.INFO:
        return '💡';
      case ErrorLevel.WARNING:
        return '⚠️';
      case ErrorLevel.ERROR:
        return '❌';
      case ErrorLevel.CRITICAL:
        return '🚨';
      case ErrorLevel.SUCCESS:
        return '✅';
    }
  };

  return (
    <div
      className={`
        relative overflow-hidden rounded-lg shadow-2xl border-l-4 p-4 mb-3
        transform transition-all duration-300 ease-out
        ${getLevelStyles()}
        ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
      `}
      style={{ minWidth: '320px', maxWidth: '420px' }}
    >
      {/* プログレスバー */}
      {notification.autoClose && (
        <div 
          className="absolute bottom-0 left-0 h-1 bg-white/30 transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      )}

      <div className="flex items-start text-white">
        <span className="text-2xl mr-3 flex-shrink-0">{getIcon()}</span>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-sm mb-1">{notification.title}</h4>
          <p className="text-sm opacity-90">{notification.message}</p>
          
          {notification.metadata && (
            <div className="mt-2 text-xs opacity-75">
              {notification.metadata.agent && (
                <div>Agent: {notification.metadata.agent}</div>
              )}
              {notification.metadata.errorCode && (
                <div>Code: {notification.metadata.errorCode}</div>
              )}
            </div>
          )}

          {notification.actions && notification.actions.length > 0 && (
            <div className="mt-3 flex gap-2">
              {notification.actions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    action.onClick();
                    handleClose();
                  }}
                  className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-medium transition-colors"
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleClose}
          className="ml-3 flex-shrink-0 hover:opacity-75 transition-opacity"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

/**
 * エラートーストコンテナ
 */
export const ErrorToastContainer: React.FC = () => {
  const [notifications, setNotifications] = useState<ErrorNotification[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const unsubscribe = errorStore.subscribe(setNotifications);
    return unsubscribe;
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed top-4 right-4 z-[9999]" style={{ pointerEvents: 'none' }}>
      <div style={{ pointerEvents: 'auto' }}>
        {notifications.map(notification => (
          <ToastItem
            key={notification.id}
            notification={notification}
            onClose={() => errorStore.removeNotification(notification.id)}
          />
        ))}
      </div>
    </div>,
    document.body
  );
};

/**
 * エラー通知フック
 */
export const useErrorNotification = () => {
  const showInfo = useCallback((title: string, message: string, options?: Partial<ErrorNotification>) => {
    return errorStore.addNotification({
      level: ErrorLevel.INFO,
      title,
      message,
      ...options
    });
  }, []);

  const showWarning = useCallback((title: string, message: string, options?: Partial<ErrorNotification>) => {
    return errorStore.addNotification({
      level: ErrorLevel.WARNING,
      title,
      message,
      ...options
    });
  }, []);

  const showError = useCallback((title: string, message: string, options?: Partial<ErrorNotification>) => {
    return errorStore.addNotification({
      level: ErrorLevel.ERROR,
      title,
      message,
      autoClose: false,
      ...options
    });
  }, []);

  const showCritical = useCallback((title: string, message: string, options?: Partial<ErrorNotification>) => {
    return errorStore.addNotification({
      level: ErrorLevel.CRITICAL,
      title,
      message,
      autoClose: false,
      duration: 0,
      ...options
    });
  }, []);

  const showSuccess = useCallback((title: string, message: string, options?: Partial<ErrorNotification>) => {
    return errorStore.addNotification({
      level: ErrorLevel.SUCCESS,
      title,
      message,
      ...options
    });
  }, []);

  const clearAll = useCallback(() => {
    errorStore.clearAll();
  }, []);

  return {
    showInfo,
    showWarning,
    showError,
    showCritical,
    showSuccess,
    clearAll
  };
};

// WebSocketエラー自動検出
export const useWebSocketErrorDetection = (wsClient: any) => {
  const { showError, showWarning, showInfo } = useErrorNotification();

  useEffect(() => {
    if (!wsClient) return;

    const handleError = (error: any) => {
      showError(
        'WebSocket接続エラー',
        error.message || '接続に失敗しました',
        {
          actions: [{
            label: '再接続',
            onClick: () => wsClient.reconnect()
          }],
          metadata: {
            errorCode: error.code,
            stack: error.stack
          }
        }
      );
    };

    const handleReconnecting = () => {
      showWarning('再接続中', 'WebSocketサーバーへの再接続を試みています...');
    };

    const handleConnected = () => {
      showSuccess('接続成功', 'WebSocketサーバーに接続しました');
    };

    wsClient.on('error', handleError);
    wsClient.on('reconnecting', handleReconnecting);
    wsClient.on('connected', handleConnected);

    return () => {
      wsClient.off('error', handleError);
      wsClient.off('reconnecting', handleReconnecting);
      wsClient.off('connected', handleConnected);
    };
  }, [wsClient, showError, showWarning, showInfo]);
};