'use server'

import { createClient } from '@/lib/supabase/server'
import { createUserSchema } from '@/lib/validations/user'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export async function signUp(formData: FormData) {
  const supabase = await createClient()

  // バリデーション
  const validatedFields = createUserSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    name: formData.get('name')
  })

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors
    }
  }

  const { email, password, name } = validatedFields.data

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name || null
      }
    }
  })

  if (error) {
    return {
      error: {
        general: [error.message]
      }
    }
  }

  redirect('/dashboard')
}

export async function signIn(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return {
      error: {
        general: ['メールアドレスとパスワードを入力してください']
      }
    }
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) {
    return {
      error: {
        general: ['メールアドレスまたはパスワードが正しくありません']
      }
    }
  }

  redirect('/dashboard')
}

export async function signOut() {
  const supabase = await createClient()
  
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    return {
      error: error.message
    }
  }

  redirect('/')
}

export async function getUser() {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }

  // ユーザープロファイルを取得
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile
}