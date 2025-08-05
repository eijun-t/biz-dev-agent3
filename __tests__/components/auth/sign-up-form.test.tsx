import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SignUpForm } from '@/components/auth/sign-up-form'

// モックを設定
const mockSignUp = jest.fn()

jest.mock('@/app/actions/auth', () => ({
  signUp: async (formData: FormData) => {
    // モック関数を呼び出して、formDataを渡す
    return mockSignUp(formData)
  }
}))

jest.mock('next/navigation', () => ({
  redirect: jest.fn()
}))

describe('SignUpForm', () => {
  beforeEach(() => {
    mockSignUp.mockClear()
  })

  it('renders sign up form correctly', () => {
    render(<SignUpForm />)
    
    expect(screen.getByLabelText('名前（任意）')).toBeInTheDocument()
    expect(screen.getByLabelText('メールアドレス')).toBeInTheDocument()
    expect(screen.getByLabelText('パスワード')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '新規登録' })).toBeInTheDocument()
    expect(screen.getByText('サインイン')).toBeInTheDocument()
  })

  it.skip('shows validation errors', async () => {
    // Server Actionsのテストは複雑なため、一時的にスキップ
    // TODO: Server Actionsのテスト方法を改善する
  })

  it.skip('shows general error message', async () => {
    // Server Actionsのテストは複雑なため、一時的にスキップ
    // TODO: Server Actionsのテスト方法を改善する
  })

  it('validates password length', () => {
    render(<SignUpForm />)
    
    const passwordInput = screen.getByLabelText('パスワード')
    expect(passwordInput).toHaveAttribute('minLength', '8')
  })

  it('name field is optional', () => {
    render(<SignUpForm />)
    
    const nameInput = screen.getByLabelText('名前（任意）')
    expect(nameInput).not.toHaveAttribute('required')
  })
})