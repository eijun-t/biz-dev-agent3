import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { getUser } from '@/app/actions/auth'

export default async function Home() {
  const user = await getUser()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="max-w-4xl text-center space-y-8">
        <h1 className="text-4xl font-bold mb-4">自律型アイディエーションエージェントAI</h1>
        <p className="text-xl text-muted-foreground mb-8">
          三菱地所の新事業創出を加速するAIシステム
        </p>
        
        <div className="space-y-4">
          <p className="text-lg">
            AIを活用して、10億円規模のビジネスアイデアを10分以内に生成します
          </p>
          
          <div className="flex gap-4 justify-center mt-8">
            {user ? (
              <Link href="/dashboard">
                <Button size="lg">
                  ダッシュボードへ
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/auth/signin">
                  <Button size="lg">
                    サインイン
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="lg" variant="outline">
                    新規登録
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}