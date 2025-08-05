import { redirect } from 'next/navigation'
import { getUser } from '@/app/actions/auth'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  return <>{children}</>
}