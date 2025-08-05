import { signOut } from '@/app/actions/auth'

export async function POST() {
  await signOut()
  return new Response(null, { status: 200 })
}