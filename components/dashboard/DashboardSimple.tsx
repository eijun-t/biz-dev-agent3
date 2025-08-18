'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, FileText, Clock } from 'lucide-react';

export default function DashboardSimple() {
  const kpiData = [
    { title: '総レポート数', value: '127', change: 12, icon: FileText, color: 'bg-blue-500' },
    { title: 'アクティブプロジェクト', value: '18', change: 5, icon: TrendingUp, color: 'bg-green-500' },
    { title: 'エージェント稼働', value: '5', change: -3, icon: Users, color: 'bg-purple-500' },
    { title: '成功率', value: '92%', change: 3, icon: Clock, color: 'bg-orange-500' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">ダッシュボード</h2>
        <p className="text-gray-600">プロジェクトの概要とパフォーマンス</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiData.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {kpi.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
                <p className="text-xs text-muted-foreground">
                  {kpi.change > 0 ? '+' : ''}{kpi.change}% 前月比
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>最近のアクティビティ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">新規レポート生成</p>
                <p className="text-sm text-gray-600">ECサイト市場分析</p>
              </div>
              <span className="text-sm text-gray-500">2分前</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">分析完了</p>
                <p className="text-sm text-gray-600">スマートシティプロジェクト</p>
              </div>
              <span className="text-sm text-gray-500">15分前</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">エージェント実行</p>
                <p className="text-sm text-gray-600">Researcher Agent 起動</p>
              </div>
              <span className="text-sm text-gray-500">1時間前</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}