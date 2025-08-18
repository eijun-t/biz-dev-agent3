'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, Users, DollarSign, Activity,
  ArrowUp, ArrowDown, RefreshCw, Settings,
  Bell, Search, Menu, ChevronRight, Zap,
  Target, Brain, Sparkles, BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

// コンポーネントインポート
import { DarkModeToggle } from '@/components/DarkModeToggle';
import { KeyboardNavigation } from '@/components/KeyboardNavigation';
import { AccessibleButton } from '@/components/AccessibleButton';
import { MagicButton, ProgressButton, RippleButton } from '@/components/MicroInteractions';
import { DateRangeFilter } from '@/components/filters/DateRangeFilter';
import { ReportHistory } from './ReportHistory';

// チャートコンポーネント（React Recharts）
import { LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface KPIData {
  label: string;
  value: number | string;
  change: number;
  icon: React.ElementType;
  color: string;
  trend: 'up' | 'down' | 'neutral';
}

interface ChartData {
  name: string;
  value: number;
  growth?: number;
  target?: number;
}

export const DashboardHome: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [realTimeData, setRealTimeData] = useState<any>(null);
  const [showSidebar, setShowSidebar] = useState(true);

  // KPIデータ
  const kpiData: KPIData[] = [
    {
      label: '生成レポート数',
      value: 1247,
      change: 12.5,
      icon: FileText,
      color: 'text-blue-600',
      trend: 'up'
    },
    {
      label: '市場規模合計',
      value: '¥2.8B',
      change: 23.1,
      icon: DollarSign,
      color: 'text-green-600',
      trend: 'up'
    },
    {
      label: 'アクティブエージェント',
      value: 6,
      change: 0,
      icon: Brain,
      color: 'text-purple-600',
      trend: 'neutral'
    },
    {
      label: '成功率',
      value: '94.3%',
      change: 2.4,
      icon: Target,
      color: 'text-orange-600',
      trend: 'up'
    }
  ];

  // チャートデータ
  const chartData: ChartData[] = [
    { name: '月', value: 400, growth: 12, target: 380 },
    { name: '火', value: 300, growth: 8, target: 320 },
    { name: '水', value: 500, growth: 15, target: 450 },
    { name: '木', value: 280, growth: 5, target: 300 },
    { name: '金', value: 590, growth: 20, target: 550 },
    { name: '土', value: 320, growth: 10, target: 350 },
    { name: '日', value: 430, growth: 14, target: 400 }
  ];

  // 円グラフデータ
  const pieData = [
    { name: 'AI', value: 35, color: '#8b5cf6' },
    { name: 'ヘルスケア', value: 25, color: '#3b82f6' },
    { name: 'フィンテック', value: 20, color: '#10b981' },
    { name: 'エドテック', value: 15, color: '#f59e0b' },
    { name: 'その他', value: 5, color: '#6b7280' }
  ];

  // リアルタイムデータ更新（WebSocket）
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3001/ws/dashboard');
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setRealTimeData(data);
    };

    return () => ws.close();
  }, []);

  // KPIカードコンポーネント
  const KPICard: React.FC<{ data: KPIData; index: number }> = ({ data, index }) => {
    const Icon = data.icon;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
      >
        <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{data.label}</p>
                <motion.div
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  className="text-2xl font-bold"
                >
                  {data.value}
                </motion.div>
                <div className="flex items-center gap-2">
                  {data.trend === 'up' ? (
                    <ArrowUp className="h-4 w-4 text-green-600" />
                  ) : data.trend === 'down' ? (
                    <ArrowDown className="h-4 w-4 text-red-600" />
                  ) : null}
                  <span className={cn(
                    'text-sm font-medium',
                    data.trend === 'up' ? 'text-green-600' : 
                    data.trend === 'down' ? 'text-red-600' : 
                    'text-gray-600'
                  )}>
                    {data.trend !== 'neutral' && `${data.change > 0 ? '+' : ''}${data.change}%`}
                  </span>
                </div>
              </div>
              <div className={cn('p-3 rounded-lg bg-opacity-10', data.color)}>
                <Icon className={cn('h-6 w-6', data.color)} />
              </div>
            </div>
            
            {/* プログレスバー */}
            <div className="mt-4">
              <Progress 
                value={Math.min(100, Math.abs(data.change) * 5)} 
                className="h-2"
              />
            </div>
          </CardContent>
          
          {/* 装飾的な背景 */}
          <motion.div
            className="absolute -right-4 -bottom-4 opacity-5"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          >
            <Icon className="h-32 w-32" />
          </motion.div>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* キーボードナビゲーション */}
      <KeyboardNavigation />
      
      {/* ヘッダー */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSidebar(!showSidebar)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              
              <div className="flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-bold">AI Business Dashboard</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon">
                <Search className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-600 rounded-full" />
              </Button>
              <DarkModeToggle variant="compact" />
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* サイドバー */}
        <AnimatePresence>
          {showSidebar && (
            <motion.aside
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              className="w-64 border-r bg-card h-[calc(100vh-57px)] sticky top-[57px]"
            >
              <nav className="p-4 space-y-2">
                {[
                  { icon: Activity, label: 'ダッシュボード', active: true },
                  { icon: FileText, label: 'レポート履歴' },
                  { icon: Brain, label: 'エージェント管理' },
                  { icon: BarChart3, label: '分析' },
                  { icon: Settings, label: '設定' }
                ].map((item, index) => (
                  <RippleButton
                    key={item.label}
                    className={cn(
                      'w-full justify-start gap-3 px-3 py-2',
                      item.active && 'bg-primary text-primary-foreground'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </RippleButton>
                ))}
              </nav>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* メインコンテンツ */}
        <main className="flex-1 p-6">
          {/* 期間フィルター */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold">ビジネスインサイト</h2>
              <Badge variant="secondary" className="gap-1">
                <Zap className="h-3 w-3" />
                リアルタイム
              </Badge>
            </div>
            
            <div className="flex items-center gap-3">
              <DateRangeFilter onDateRangeChange={() => {}} />
              <ProgressButton onClick={async () => {
                await new Promise(resolve => setTimeout(resolve, 2000));
              }}>
                レポート生成
              </ProgressButton>
            </div>
          </div>

          {/* KPIカード */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {kpiData.map((kpi, index) => (
              <KPICard key={kpi.label} data={kpi} index={index} />
            ))}
          </div>

          {/* チャートセクション */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 折れ線グラフ */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>レポート生成トレンド</span>
                  <Badge variant="outline">週間</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#8b5cf6"
                      fillOpacity={1}
                      fill="url(#colorValue)"
                    />
                    <Line
                      type="monotone"
                      dataKey="target"
                      stroke="#10b981"
                      strokeDasharray="5 5"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* 円グラフ */}
            <Card>
              <CardHeader>
                <CardTitle>カテゴリー別分布</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* パフォーマンス指標 */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>エージェントパフォーマンス</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="efficiency" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="efficiency">効率性</TabsTrigger>
                    <TabsTrigger value="quality">品質</TabsTrigger>
                    <TabsTrigger value="speed">速度</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="efficiency" className="mt-4">
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="name" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip />
                        <Bar dataKey="growth" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </TabsContent>
                  
                  <TabsContent value="quality">
                    <div className="space-y-4">
                      {['Researcher', 'Ideator', 'Critic', 'Analyst'].map((agent, i) => (
                        <div key={agent} className="flex items-center justify-between">
                          <span className="text-sm font-medium">{agent}</span>
                          <div className="flex items-center gap-3">
                            <Progress value={85 + i * 3} className="w-32" />
                            <span className="text-sm text-muted-foreground">
                              {85 + i * 3}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="speed">
                    <div className="text-center py-8">
                      <div className="text-4xl font-bold text-primary">
                        {realTimeData?.avgResponseTime || '1.2'}s
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        平均レスポンス時間
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* AIアシスタントセクション */}
          <div className="mt-6">
            <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-purple-600/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      AI インサイト
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      過去7日間で最も成長率の高いカテゴリーは「AI」で、23%の増加を記録しています
                    </p>
                  </div>
                  <MagicButton onClick={() => console.log('AI提案')}>
                    提案を見る
                  </MagicButton>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

// ファイルアイコン定義（不足していたため追加）
const FileText = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

export default DashboardHome;