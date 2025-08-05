'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { signUp } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import Link from 'next/link'

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Spinner size="sm" className="mr-2" />
          登録中...
        </>
      ) : (
        '新規登録'
      )}
    </Button>
  )
}

interface FieldErrors {
  email?: string[]
  password?: string[]
  name?: string[]
  general?: string[]
}

export function SignUpForm() {
  const [errors, setErrors] = useState<FieldErrors>({})

  async function handleSubmit(formData: FormData) {
    setErrors({})
    const result = await signUp(formData)
    
    if (result?.error) {
      setErrors(result.error)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>新規登録</CardTitle>
        <CardDescription>
          新しいアカウントを作成します
        </CardDescription>
      </CardHeader>
      <form action={handleSubmit}>
        <CardContent className="space-y-4">
          {errors.general && (
            <Alert variant="destructive">
              {errors.general[0]}
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="name">名前（任意）</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="山田 太郎"
              autoComplete="name"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name[0]}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email[0]}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">パスワード</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
              minLength={8}
            />
            <p className="text-xs text-muted-foreground">
              8文字以上のパスワードを入力してください
            </p>
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password[0]}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <SubmitButton />
          <p className="text-sm text-center text-muted-foreground">
            すでにアカウントをお持ちの方は{' '}
            <Link href="/auth/signin" className="text-primary underline">
              サインイン
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}