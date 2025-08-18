'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Lightbulb, Target, TrendingUp, Brain,
  CheckCircle, Clock, AlertCircle, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

// エージェントステップ
const agentSteps = [
  { 
    id: 'researcher',
    name: 'Researcher',
    icon: Search,
    description: '市場調査・競合分析中...',
    duration: 2000
  },
  { 
    id: 'ideator',
    name: 'Ideator', 
    icon: Lightbulb,
    description: '革新的アイデア生成中...',
    duration: 2500
  },
  { 
    id: 'critic',
    name: 'Critic',
    icon: Target,
    description: '実現性評価中...',
    duration: 1500
  },
  { 
    id: 'analyst',
    name: 'Analyst',
    icon: TrendingUp,
    description: '詳細分析・戦略立案中...',
    duration: 3000
  },
  { 
    id: 'writer',
    name: 'Writer',
    icon: Brain,
    description: 'レポート作成中...',
    duration: 2000
  }
];

interface GenerationProgressProps {
  onComplete?: () => void;
  autoStart?: boolean;
}

export const GenerationProgress: React.FC<GenerationProgressProps> = ({
  onComplete,
  autoStart = true
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    if (!autoStart) return;

    const totalDuration = agentSteps.reduce((acc, step) => acc + step.duration, 0);
    let elapsed = 0;

    const interval = setInterval(() => {
      elapsed += 100;
      
      // 現在のステップを計算
      let stepElapsed = elapsed;
      let currentStepIndex = 0;
      
      for (let i = 0; i < agentSteps.length; i++) {
        if (stepElapsed <= agentSteps[i].duration) {
          currentStepIndex = i;
          break;
        }
        stepElapsed -= agentSteps[i].duration;
        currentStepIndex = i + 1;
      }

      if (currentStepIndex >= agentSteps.length) {
        setIsComplete(true);
        clearInterval(interval);
        if (onComplete) onComplete();
        return;
      }

      setCurrentStep(currentStepIndex);
      setStepProgress((stepElapsed / agentSteps[currentStepIndex].duration) * 100);
      setOverallProgress((elapsed / totalDuration) * 100);

      // ログ追加
      if (stepElapsed === 100) {
        setLogs(prev => [...prev, `${agentSteps[currentStepIndex].name}が処理を開始しました`]);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [autoStart, onComplete]);

  const CurrentIcon = agentSteps[currentStep]?.icon || Sparkles;

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-4xl">
        {/* メインカード */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8"
        >
          {/* ヘッダー */}
          <div className="text-center mb-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="inline-block mb-4"
            >
              <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                <CurrentIcon size={40} className="text-white" />
              </div>
            </motion.div>
            
            <h1 className="text-3xl font-bold mb-2">
              AIエージェントが分析中
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {!isComplete ? agentSteps[currentStep]?.description : '分析完了！レポートを生成しました'}
            </p>
          </div>

          {/* プログレスバー */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">全体進捗</span>
              <span className="text-sm font-medium">{Math.round(overallProgress)}%</span>
            </div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-600 to-blue-600"
                animate={{ width: `${overallProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* エージェントステップ */}
          <div className="space-y-4 mb-8">
            {agentSteps.map((step, index) => {
              const isActive = index === currentStep;
              const isCompleted = index < currentStep || isComplete;

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    'flex items-center gap-4 p-4 rounded-lg border-2 transition-all',
                    isActive && 'border-purple-500 bg-purple-50 dark:bg-purple-900/20',
                    isCompleted && !isActive && 'border-green-500 bg-green-50 dark:bg-green-900/20',
                    !isActive && !isCompleted && 'border-gray-200 dark:border-gray-700'
                  )}
                >
                  {/* アイコン */}
                  <div className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center',
                    isActive && 'bg-gradient-to-r from-purple-600 to-blue-600',
                    isCompleted && !isActive && 'bg-green-500',
                    !isActive && !isCompleted && 'bg-gray-300 dark:bg-gray-700'
                  )}>
                    {isCompleted && !isActive ? (
                      <CheckCircle size={24} className="text-white" />
                    ) : isActive ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        <step.icon size={24} className="text-white" />
                      </motion.div>
                    ) : (
                      <step.icon size={24} className="text-gray-500" />
                    )}
                  </div>

                  {/* 情報 */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn(
                        'font-medium',
                        (isActive || isCompleted) && 'text-purple-700 dark:text-purple-300'
                      )}>
                        {step.name}
                      </span>
                      {isActive && (
                        <span className="text-sm text-purple-600">
                          {Math.round(stepProgress)}%
                        </span>
                      )}
                      {isCompleted && !isActive && (
                        <span className="text-sm text-green-600">完了</span>
                      )}
                    </div>
                    
                    {/* ステッププログレス */}
                    {isActive && (
                      <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-purple-600 to-blue-600"
                          animate={{ width: `${stepProgress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* ログエリア */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 max-h-32 overflow-y-auto">
            <div className="text-xs font-mono space-y-1">
              {logs.map((log, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-gray-600 dark:text-gray-400"
                >
                  [{new Date().toLocaleTimeString()}] {log}
                </motion.div>
              ))}
              {!isComplete && (
                <motion.span
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  ▊
                </motion.span>
              )}
            </div>
          </div>

          {/* 完了時のアクション */}
          <AnimatePresence>
            {isComplete && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 flex justify-center"
              >
                <button className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all">
                  レポートを見る
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ヒント */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400"
        >
          💡 ヒント: 分析中は別のタブで作業を続けることができます
        </motion.div>
      </div>
    </div>
  );
};

export default GenerationProgress;