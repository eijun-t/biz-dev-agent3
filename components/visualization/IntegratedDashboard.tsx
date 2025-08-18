'use client';

import React, { useEffect, useState } from 'react';
import AgentPipeline from './AgentPipeline';
import DataFlow from './DataFlow';
import ProgressTracker from './ProgressTracker';
import PerformanceChart from '../charts/PerformanceChart';
import { useIntegrationBridge } from '@/lib/visualization/integration-bridge';

interface IntegratedDashboardProps {
  websocketUrl?: string;
  className?: string;
  layout?: 'grid' | 'tabs' | 'scroll';
}

/**
 * Integrated Dashboard Component
 * Combines all visualization components with Worker1 UI and Worker2 WebSocket
 */
export default function IntegratedDashboard({
  websocketUrl = 'ws://localhost:3001/ws',
  className = '',
  layout = 'grid'
}: IntegratedDashboardProps) {
  const [activeTab, setActiveTab] = useState('pipeline');
  const [isConnected, setIsConnected] = useState(false);
  const [realtimeData, setRealtimeData] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  
  const { 
    bridge, 
    connectWebSocket, 
    bridgeUIEvent,
    sendMessage,
    getBuffer
  } = useIntegrationBridge();

  // Setup WebSocket connection and event listeners
  useEffect(() => {
    // Connect to WebSocket
    connectWebSocket(websocketUrl);

    // Setup event listeners
    const handleConnected = () => setIsConnected(true);
    const handleDisconnected = () => setIsConnected(false);
    
    const handleDataReceived = (data: any) => {
      if (data.type === 'websocket_data') {
        setRealtimeData(prev => [...prev.slice(-99), data]);
      }
    };
    
    const handleMetricsUpdate = (newMetrics: any) => {
      setMetrics(prev => [...prev.slice(-59), {
        timestamp: new Date(),
        ...newMetrics
      }]);
    };
    
    const handleProgressUpdate = (progress: any) => {
      setTasks(prev => prev.map(task => 
        task.id === progress.taskId 
          ? { ...task, ...progress }
          : task
      ));
    };

    bridge.on('websocket-connected', handleConnected);
    bridge.on('websocket-disconnected', handleDisconnected);
    bridge.on('data-received', handleDataReceived);
    bridge.on('metrics-update', handleMetricsUpdate);
    bridge.on('progress-update', handleProgressUpdate);

    // Cleanup
    return () => {
      bridge.off('websocket-connected', handleConnected);
      bridge.off('websocket-disconnected', handleDisconnected);
      bridge.off('data-received', handleDataReceived);
      bridge.off('metrics-update', handleMetricsUpdate);
      bridge.off('progress-update', handleProgressUpdate);
    };
  }, [bridge, connectWebSocket, websocketUrl]);

  // Handle UI interactions
  const handleAgentClick = (agentId: string) => {
    bridgeUIEvent('dashboard', 'agent_click', { agentId });
    sendMessage({
      type: 'agent_status',
      agentId,
      payload: { action: 'start' }
    });
  };

  const handleRefresh = () => {
    bridgeUIEvent('dashboard', 'refresh', { timestamp: new Date() });
    window.location.reload();
  };

  const handleExportData = () => {
    const dataBuffer = getBuffer();
    const blob = new Blob([JSON.stringify(dataBuffer, null, 2)], 
      { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-data-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Render tabs layout
  if (layout === 'tabs') {
    return (
      <div className={`integrated-dashboard ${className}`}>
        {/* Header */}
        <div className="dashboard-header bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-lg">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">AI Agent Dashboard</h1>
              <p className="text-blue-100 mt-1">Integrated Visualization System</p>
            </div>
            <div className="flex items-center gap-4">
              <div className={`connection-status flex items-center gap-2 px-3 py-1 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-200 animate-pulse' : 'bg-red-200'
                }`} />
                <span className="text-sm font-medium">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50"
              >
                🔄 Refresh
              </button>
              <button
                onClick={handleExportData}
                className="px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-purple-50"
              >
                📥 Export
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="tab-nav flex border-b bg-gray-50">
          {[
            { id: 'pipeline', label: '🔀 Pipeline', icon: '🔀' },
            { id: 'dataflow', label: '📊 Data Flow', icon: '📊' },
            { id: 'progress', label: '📈 Progress', icon: '📈' },
            { id: 'performance', label: '⚡ Performance', icon: '⚡' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="tab-content p-6 bg-white rounded-b-lg">
          {activeTab === 'pipeline' && (
            <AgentPipeline 
              interactive={true}
              autoPlay={false}
              showMetrics={true}
            />
          )}
          {activeTab === 'dataflow' && (
            <DataFlow 
              dataPoints={realtimeData}
              realtime={true}
              animationSpeed={1000}
            />
          )}
          {activeTab === 'progress' && (
            <ProgressTracker
              tasks={tasks}
              showTimeline={true}
              showDetails={true}
              autoUpdate={true}
            />
          )}
          {activeTab === 'performance' && (
            <PerformanceChart
              metrics={metrics}
              timeRange="1h"
              metricType="latency"
              realtime={true}
            />
          )}
        </div>
      </div>
    );
  }

  // Render grid layout (default)
  return (
    <div className={`integrated-dashboard ${className}`}>
      {/* Header */}
      <div className="dashboard-header bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">AI Agent Dashboard</h1>
            <p className="text-blue-100 mt-1">Real-time Monitoring & Visualization</p>
          </div>
          <div className="flex items-center gap-4">
            <div className={`connection-status flex items-center gap-2 px-3 py-1 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-200 animate-pulse' : 'bg-red-200'
              }`} />
              <span className="text-sm font-medium">
                {isConnected ? 'Live' : 'Offline'}
              </span>
            </div>
            <button
              onClick={handleExportData}
              className="px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-purple-50"
            >
              Export Data
            </button>
          </div>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="dashboard-grid grid grid-cols-2 gap-6">
        {/* Agent Pipeline - Top Left */}
        <div className="dashboard-panel bg-white rounded-lg shadow-lg p-6">
          <AgentPipeline 
            interactive={true}
            autoPlay={false}
            showMetrics={true}
          />
        </div>

        {/* Data Flow - Top Right */}
        <div className="dashboard-panel bg-white rounded-lg shadow-lg p-6">
          <DataFlow 
            dataPoints={realtimeData}
            realtime={true}
            animationSpeed={1000}
          />
        </div>

        {/* Progress Tracker - Bottom Left */}
        <div className="dashboard-panel bg-white rounded-lg shadow-lg p-6">
          <ProgressTracker
            tasks={tasks}
            showTimeline={true}
            showDetails={false}
            autoUpdate={true}
          />
        </div>

        {/* Performance Chart - Bottom Right */}
        <div className="dashboard-panel bg-white rounded-lg shadow-lg p-6">
          <PerformanceChart
            metrics={metrics}
            timeRange="1h"
            metricType="latency"
            realtime={true}
          />
        </div>
      </div>

      {/* Stats Bar */}
      <div className="stats-bar mt-6 grid grid-cols-5 gap-4">
        <div className="stat-card bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg">
          <div className="text-sm opacity-90">Total Agents</div>
          <div className="text-2xl font-bold">5</div>
        </div>
        <div className="stat-card bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg">
          <div className="text-sm opacity-90">Active Tasks</div>
          <div className="text-2xl font-bold">{tasks.filter(t => t.status === 'in_progress').length}</div>
        </div>
        <div className="stat-card bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg">
          <div className="text-sm opacity-90">Data Points</div>
          <div className="text-2xl font-bold">{realtimeData.length}</div>
        </div>
        <div className="stat-card bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-lg">
          <div className="text-sm opacity-90">Avg Latency</div>
          <div className="text-2xl font-bold">
            {metrics.length > 0 ? `${metrics[metrics.length - 1].p95?.toFixed(0) || '--'}ms` : '--'}
          </div>
        </div>
        <div className="stat-card bg-gradient-to-r from-red-500 to-red-600 text-white p-4 rounded-lg">
          <div className="text-sm opacity-90">Error Rate</div>
          <div className="text-2xl font-bold">
            {metrics.length > 0 ? `${(metrics[metrics.length - 1].errorRate * 100)?.toFixed(2) || '0'}%` : '0%'}
          </div>
        </div>
      </div>
    </div>
  );
}