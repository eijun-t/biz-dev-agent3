'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Mail, Lock, ArrowRight, Sparkles, 
  Github, Chrome, Eye, EyeOff, CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // ログイン処理のシミュレーション
    setTimeout(() => {
      // ログイン成功後、直接新規作成画面へ遷移
      window.location.href = '/create';
    }, 1500);
  };

  const features = [
    'AIが市場調査を自動実行',
    '革新的なビジネスアイデアを生成',
    '詳細な分析レポートを即座に作成',
  ];

  return (
    <div className="min-h-screen flex">
      {/* 左側: ログインフォーム */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-gray-900">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* ロゴ */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <Sparkles className="text-purple-600 dark:text-purple-400" size={32} />
            </motion.div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
              AI Agent Platform
            </h1>
          </div>

          {/* ウェルカムメッセージ */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold mb-2">おかえりなさい</h2>
            <p className="text-gray-600 dark:text-gray-400">
              アカウントにログインして、AIの力を解き放ちましょう
            </p>
          </div>

          {/* ログインフォーム */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* メールアドレス */}
            <div>
              <label className="block text-sm font-medium mb-2">
                メールアドレス
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 transition-all"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            {/* パスワード */}
            <div>
              <label className="block text-sm font-medium mb-2">
                パスワード
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 transition-all"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* オプション */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className="text-sm">ログイン状態を保持</span>
              </label>
              <a href="/forgot-password" className="text-sm text-purple-600 hover:text-purple-700">
                パスワードを忘れた？
              </a>
            </div>

            {/* ログインボタン */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className={cn(
                'w-full py-3 px-4 rounded-xl font-medium transition-all',
                'bg-gradient-to-r from-purple-600 to-blue-600 text-white',
                'hover:from-purple-700 hover:to-blue-700',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'flex items-center justify-center gap-2'
              )}
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles size={20} />
                </motion.div>
              ) : (
                <>
                  ログインして新規作成へ
                  <ArrowRight size={20} />
                </>
              )}
            </motion.button>

            {/* 区切り線 */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">
                  または
                </span>
              </div>
            </div>

            {/* ソーシャルログイン */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className="flex items-center justify-center gap-2 py-2 px-4 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
              >
                <Github size={20} />
                <span>GitHub</span>
              </button>
              <button
                type="button"
                className="flex items-center justify-center gap-2 py-2 px-4 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
              >
                <Chrome size={20} />
                <span>Google</span>
              </button>
            </div>
          </form>

          {/* サインアップリンク */}
          <p className="text-center mt-8 text-sm text-gray-600 dark:text-gray-400">
            アカウントをお持ちでない方は{' '}
            <a href="/signup" className="text-purple-600 hover:text-purple-700 font-medium">
              新規登録
            </a>
          </p>
        </motion.div>
      </div>

      {/* 右側: ビジュアル */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-8 bg-gradient-to-br from-purple-600 to-blue-600">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-md text-white"
        >
          <h2 className="text-4xl font-bold mb-6">
            ビジネスの未来を
            <br />
            AIと共に創造する
          </h2>
          
          <p className="text-lg mb-8 opacity-90">
            最先端のAIエージェントが、あなたのビジネスアイデアを
            現実に変えるお手伝いをします。
          </p>

          <div className="space-y-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <CheckCircle size={16} />
                </div>
                <span>{feature}</span>
              </motion.div>
            ))}
          </div>

          {/* 装飾的な要素 */}
          <div className="mt-12 relative">
            <motion.div
              animate={{ 
                y: [0, -10, 0],
                rotate: [0, 5, 0]
              }}
              transition={{ 
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              className="absolute -top-20 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"
            />
            <motion.div
              animate={{ 
                y: [0, 10, 0],
                rotate: [0, -5, 0]
              }}
              transition={{ 
                duration: 5,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;