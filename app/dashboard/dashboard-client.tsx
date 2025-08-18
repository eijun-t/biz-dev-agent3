'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import ReportListDashboard from '@/components/dashboard/ReportListDashboard'
// import DashboardHome from '@/components/dashboard/DashboardHome'
// import DarkModeToggle from '@/components/DarkModeToggle'
// import dynamic from 'next/dynamic'

// // 動的インポートでエラー回避
// const ReportHistory = dynamic(
//   () => import('@/components/reports/ReportHistoryIntegrated'),
//   { ssr: false, loading: () => <div>履歴を読み込み中...</div> }
// )

interface DashboardClientProps {
  user: any
}

export default function DashboardClient({ user }: DashboardClientProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">
            自律型アイディエーションエージェントAI
          </h1>
          <div className="flex items-center space-x-4">
            {/* <DarkModeToggle /> */}
            <span className="text-sm text-muted-foreground">
              {user?.email}
            </span>
            <form action="/api/auth/signout" method="POST">
              <Button type="submit" variant="outline" size="sm">
                サインアウト
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main>
        {/* レポート一覧 */}
        <ReportListDashboard />
        
      </main>
    </div>
  )
}