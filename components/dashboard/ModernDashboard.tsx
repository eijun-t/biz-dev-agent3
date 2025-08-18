'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  TrendingUp, Users, FileText, Clock, Activity, 
  ArrowUp, ArrowDown, BarChart, PieChart, 
  Zap, Target, CheckCircle, AlertCircle,
  Brain, Sparkles, Rocket, Globe
} from 'lucide-react'

// KPIカードコンポーネント
const KPICard = ({ title, value, change, icon: Icon, color, trend }: any) => (
  <Card className="hover:shadow-lg transition-shadow duration-300">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-gray-600">
        {title}
      </CardTitle>
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="h-4 w-4 text-white" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <div className="flex items-center mt-2">
        {trend === 'up' ? (
          <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
        ) : (
          <ArrowDown className="h-4 w-4 text-red-500 mr-1" />
        )}
        <p className={`text-xs ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
          {change}% 前月比
        </p>
      </div>
    </CardContent>
  </Card>
)

// プログレスバー付きタスクカード
const TaskCard = ({ title, progress, status, deadline }: any) => (
  <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
    <div className="flex justify-between items-start mb-2">
      <div>
        <h4 className="font-medium">{title}</h4>
        <p className="text-sm text-gray-500">期限: {deadline}</p>
      </div>
      <Badge variant={status === 'active' ? 'default' : 'secondary'}>
        {status === 'active' ? '進行中' : '待機中'}
      </Badge>
    </div>
    <Progress value={progress} className="h-2 mt-3" />
    <p className="text-xs text-gray-500 mt-1">{progress}% 完了</p>
  </div>
)

// エージェント状態カード
const AgentStatusCard = ({ name, status, task, performance }: any) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardContent className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <Brain className="h-5 w-5 text-purple-500 mr-2" />
          <span className="font-medium">{name}</span>
        </div>
        <Badge variant={status === 'active' ? 'default' : status === 'idle' ? 'secondary' : 'outline'}>
          {status === 'active' ? '稼働中' : status === 'idle' ? '待機中' : '停止'}
        </Badge>
      </div>
      <p className="text-sm text-gray-600 mb-2">{task}</p>
      <div className="flex justify-between text-xs text-gray-500">
        <span>パフォーマンス</span>
        <span className="font-medium">{performance}%</span>
      </div>
      <Progress value={performance} className="h-1 mt-1" />
    </CardContent>
  </Card>
)

export default function ModernDashboard() {
  const [activeTab, setActiveTab] = useState('overview')

  // ダミーデータ
  const kpiData = [
    { title: '総レポート数', value: '127', change: 12, icon: FileText, color: 'bg-blue-500', trend: 'up' },
    { title: 'アクティブプロジェクト', value: '18', change: 5, icon: Target, color: 'bg-green-500', trend: 'up' },
    { title: 'エージェント稼働率', value: '92%', change: -3, icon: Activity, color: 'bg-purple-500', trend: 'down' },
    { title: '平均処理時間', value: '2.3分', change: 15, icon: Clock, color: 'bg-orange-500', trend: 'up' },
  ]

  const agents = [
    { name: 'Researcher Agent', status: 'active', task: 'Web検索による市場調査実行中', performance: 95 },
    { name: 'Ideator Agent', status: 'active', task: 'ビジネスアイデア生成中', performance: 88 },
    { name: 'Critic Agent', status: 'idle', task: '評価待ち', performance: 92 },
    { name: 'Analyst Agent', status: 'idle', task: '分析待機中', performance: 90 },
    { name: 'Writer Agent', status: 'idle', task: 'レポート作成準備中', performance: 94 },
  ]

  const recentProjects = [
    { title: 'ECサイト市場分析', progress: 75, status: 'active', deadline: '2024/01/20' },
    { title: 'スマートシティプロジェクト', progress: 45, status: 'active', deadline: '2024/01/25' },
    { title: 'ヘルスケアDX提案', progress: 30, status: 'waiting', deadline: '2024/02/01' },
  ]

  return (
    <div className="space-y-6">
      {/* ヘッダー部分 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            AI駆動型ダッシュボード
          </h1>
          <p className="text-gray-600 mt-1">
            プロジェクト概要とパフォーマンス分析
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <BarChart className="h-4 w-4 mr-1" />
            レポート出力
          </Button>
          <Button size="sm">
            <Sparkles className="h-4 w-4 mr-1" />
            新規プロジェクト
          </Button>
        </div>
      </div>

      {/* KPIカード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiData.map((kpi, index) => (
          <KPICard key={index} {...kpi} />
        ))}
      </div>

      {/* タブコンテンツ */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">概要</TabsTrigger>
          <TabsTrigger value="agents">エージェント</TabsTrigger>
          <TabsTrigger value="projects">プロジェクト</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 最近のアクティビティ */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-blue-500" />
                  最近のアクティビティ
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <div>
                      <p className="font-medium text-sm">レポート生成完了</p>
                      <p className="text-xs text-gray-500">ECサイト市場分析</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">2分前</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center">
                    <Brain className="h-4 w-4 text-purple-500 mr-2" />
                    <div>
                      <p className="font-medium text-sm">エージェント起動</p>
                      <p className="text-xs text-gray-500">Researcher Agent</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">15分前</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center">
                    <Rocket className="h-4 w-4 text-green-500 mr-2" />
                    <div>
                      <p className="font-medium text-sm">新規プロジェクト作成</p>
                      <p className="text-xs text-gray-500">ヘルスケアDX提案</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">1時間前</span>
                </div>
              </CardContent>
            </Card>

            {/* パフォーマンスメトリクス */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
                  パフォーマンスメトリクス
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">処理速度</span>
                    <span className="text-sm font-medium">95%</span>
                  </div>
                  <Progress value={95} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">精度</span>
                    <span className="text-sm font-medium">88%</span>
                  </div>
                  <Progress value={88} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">可用性</span>
                    <span className="text-sm font-medium">99.9%</span>
                  </div>
                  <Progress value={99.9} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">コスト効率</span>
                    <span className="text-sm font-medium">82%</span>
                  </div>
                  <Progress value={82} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent, index) => (
              <AgentStatusCard key={index} {...agent} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <div className="space-y-3">
            {recentProjects.map((project, index) => (
              <TaskCard key={index} {...project} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}