'use client';

import React, { useEffect, useState } from 'react';

interface TaskProgress {
  id: string;
  name: string;
  agent: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number;
  startTime?: Date;
  endTime?: Date;
  estimatedTime?: number;
  subtasks?: TaskProgress[];
}

interface ProgressTrackerProps {
  tasks?: TaskProgress[];
  className?: string;
  showTimeline?: boolean;
  showDetails?: boolean;
  autoUpdate?: boolean;
}

/**
 * Progress Tracker Component
 * Displays detailed progress of agent tasks and subtasks
 */
export default function ProgressTracker({
  tasks = [],
  className = '',
  showTimeline = true,
  showDetails = true,
  autoUpdate = false
}: ProgressTrackerProps) {
  const [currentTasks, setCurrentTasks] = useState<TaskProgress[]>(tasks);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  // Generate sample tasks if none provided
  useEffect(() => {
    if (currentTasks.length === 0) {
      const sampleTasks: TaskProgress[] = [
        {
          id: 'task-1',
          name: 'Market Research',
          agent: 'researcher',
          status: 'completed',
          progress: 100,
          startTime: new Date(Date.now() - 3600000),
          endTime: new Date(Date.now() - 1800000),
          subtasks: [
            { id: 'sub-1-1', name: 'Collect industry data', agent: 'researcher', status: 'completed', progress: 100 },
            { id: 'sub-1-2', name: 'Analyze competitors', agent: 'researcher', status: 'completed', progress: 100 },
            { id: 'sub-1-3', name: 'Identify trends', agent: 'researcher', status: 'completed', progress: 100 }
          ]
        },
        {
          id: 'task-2',
          name: 'Idea Generation',
          agent: 'ideator',
          status: 'completed',
          progress: 100,
          startTime: new Date(Date.now() - 1800000),
          endTime: new Date(Date.now() - 900000),
          subtasks: [
            { id: 'sub-2-1', name: 'Brainstorm concepts', agent: 'ideator', status: 'completed', progress: 100 },
            { id: 'sub-2-2', name: 'Evaluate feasibility', agent: 'ideator', status: 'completed', progress: 100 }
          ]
        },
        {
          id: 'task-3',
          name: 'Critical Analysis',
          agent: 'critic',
          status: 'in_progress',
          progress: 65,
          startTime: new Date(Date.now() - 900000),
          estimatedTime: 1200000,
          subtasks: [
            { id: 'sub-3-1', name: 'Review ideas', agent: 'critic', status: 'completed', progress: 100 },
            { id: 'sub-3-2', name: 'Score viability', agent: 'critic', status: 'in_progress', progress: 30 },
            { id: 'sub-3-3', name: 'Provide feedback', agent: 'critic', status: 'pending', progress: 0 }
          ]
        },
        {
          id: 'task-4',
          name: 'Market Analysis',
          agent: 'analyst',
          status: 'pending',
          progress: 0,
          estimatedTime: 2400000,
          subtasks: [
            { id: 'sub-4-1', name: 'Market sizing', agent: 'analyst', status: 'pending', progress: 0 },
            { id: 'sub-4-2', name: 'Customer segments', agent: 'analyst', status: 'pending', progress: 0 },
            { id: 'sub-4-3', name: 'Revenue projections', agent: 'analyst', status: 'pending', progress: 0 }
          ]
        },
        {
          id: 'task-5',
          name: 'Report Writing',
          agent: 'writer',
          status: 'pending',
          progress: 0,
          estimatedTime: 1800000,
          subtasks: [
            { id: 'sub-5-1', name: 'Executive summary', agent: 'writer', status: 'pending', progress: 0 },
            { id: 'sub-5-2', name: 'Detailed findings', agent: 'writer', status: 'pending', progress: 0 },
            { id: 'sub-5-3', name: 'Recommendations', agent: 'writer', status: 'pending', progress: 0 }
          ]
        }
      ];
      setCurrentTasks(sampleTasks);
    }
  }, [currentTasks.length]);

  // Auto-update progress simulation
  useEffect(() => {
    if (!autoUpdate) return;

    const interval = setInterval(() => {
      setCurrentTasks(prevTasks => {
        return prevTasks.map(task => {
          if (task.status === 'in_progress' && task.progress < 100) {
            const newProgress = Math.min(100, task.progress + Math.random() * 5);
            return {
              ...task,
              progress: newProgress,
              status: newProgress >= 100 ? 'completed' : 'in_progress',
              endTime: newProgress >= 100 ? new Date() : undefined
            };
          }
          if (task.status === 'pending') {
            const shouldStart = Math.random() > 0.9;
            if (shouldStart) {
              return {
                ...task,
                status: 'in_progress',
                progress: Math.random() * 10,
                startTime: new Date()
              };
            }
          }
          return task;
        });
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [autoUpdate]);

  const getStatusColor = (status: TaskProgress['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: TaskProgress['status']) => {
    switch (status) {
      case 'completed': return '✅';
      case 'in_progress': return '🔄';
      case 'failed': return '❌';
      default: return '⏳';
    }
  };

  const getAgentColor = (agent: string) => {
    const colors = {
      researcher: 'border-blue-500',
      ideator: 'border-purple-500',
      critic: 'border-red-500',
      analyst: 'border-green-500',
      writer: 'border-orange-500'
    };
    return colors[agent] || 'border-gray-500';
  };

  const formatDuration = (start?: Date, end?: Date) => {
    if (!start) return '--';
    const endTime = end || new Date();
    const duration = endTime.getTime() - start.getTime();
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const toggleExpand = (taskId: string) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const overallProgress = currentTasks.length > 0
    ? currentTasks.reduce((sum, task) => sum + task.progress, 0) / currentTasks.length
    : 0;

  return (
    <div className={`progress-tracker ${className}`}>
      <div className="tracker-header mb-6">
        <h2 className="text-2xl font-bold mb-2">Task Progress Tracker</h2>
        
        {/* Overall Progress */}
        <div className="overall-progress mb-4">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
            <span className="text-sm font-medium text-gray-700">{overallProgress.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>

        {/* Status Summary */}
        <div className="status-summary grid grid-cols-4 gap-2 mb-4">
          {['pending', 'in_progress', 'completed', 'failed'].map(status => {
            const count = currentTasks.filter(t => t.status === status).length;
            return (
              <div key={status} className={`p-2 rounded-lg ${getStatusColor(status as TaskProgress['status'])}`}>
                <div className="text-xs opacity-75">{status.replace('_', ' ')}</div>
                <div className="text-xl font-bold">{count}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Task List */}
      <div className="task-list space-y-3">
        {currentTasks.map(task => (
          <div key={task.id} className={`task-card border-l-4 ${getAgentColor(task.agent)} bg-white rounded-lg shadow-sm`}>
            <div 
              className="task-header p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => toggleExpand(task.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getStatusIcon(task.status)}</span>
                  <div>
                    <h3 className="font-semibold text-lg">{task.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>Agent: <strong>{task.agent}</strong></span>
                      <span>Duration: {formatDuration(task.startTime, task.endTime)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-32">
                    <div className="text-right text-sm text-gray-600 mb-1">{task.progress.toFixed(0)}%</div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-gray-400">
                    {expandedTasks.has(task.id) ? '▼' : '▶'}
                  </span>
                </div>
              </div>
            </div>

            {/* Subtasks */}
            {expandedTasks.has(task.id) && task.subtasks && (
              <div className="subtasks border-t border-gray-200 p-4 bg-gray-50">
                <div className="space-y-2">
                  {task.subtasks.map(subtask => (
                    <div key={subtask.id} className="subtask flex items-center justify-between p-2 bg-white rounded">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{getStatusIcon(subtask.status)}</span>
                        <span className="text-sm">{subtask.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-20">
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div 
                              className="bg-blue-400 h-1.5 rounded-full"
                              style={{ width: `${subtask.progress}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-xs text-gray-600">{subtask.progress}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {showTimeline && (
        <div className="timeline mt-6 p-4 bg-gray-100 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Timeline View</h3>
          <div className="relative">
            {currentTasks.map((task, index) => (
              <div key={task.id} className="timeline-item flex items-center mb-4">
                <div className={`timeline-dot w-4 h-4 rounded-full ${
                  task.status === 'completed' ? 'bg-green-500' :
                  task.status === 'in_progress' ? 'bg-blue-500' :
                  'bg-gray-400'
                }`} />
                {index < currentTasks.length - 1 && (
                  <div className="absolute left-2 top-8 w-0.5 h-12 bg-gray-300" />
                )}
                <div className="ml-6">
                  <div className="font-medium">{task.name}</div>
                  <div className="text-sm text-gray-600">
                    {task.startTime ? task.startTime.toLocaleTimeString() : 'Not started'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {autoUpdate && (
        <div className="auto-update-indicator mt-4 p-2 bg-blue-100 rounded-lg text-center">
          <span className="text-blue-700 text-sm font-medium">
            🔄 Auto-updating progress every second
          </span>
        </div>
      )}
    </div>
  );
}