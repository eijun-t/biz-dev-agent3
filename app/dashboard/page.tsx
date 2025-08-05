import { getUser } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default async function DashboardPage() {
  const user = await getUser()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">
            自律型アイディエーションエージェントAI
          </h1>
          <div className="flex items-center space-x-4">
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

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>ようこそ、{user?.name || user?.email}さん</CardTitle>
              <CardDescription>
                AIを使用して新しいビジネスアイデアを生成しましょう
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/sessions/new">
                <Button size="lg" className="w-full sm:w-auto">
                  新しいアイデア生成を開始
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>最近のセッション</CardTitle>
              <CardDescription>
                過去に生成したビジネスアイデアを確認できます
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                まだセッションがありません
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}