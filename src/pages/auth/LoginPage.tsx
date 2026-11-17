import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LogIn, Mail } from 'lucide-react'
import { errorMessage } from '@/api'
import { Button, ErrorBox, Field, Icon, Input, PasswordInput } from '@/components/ui'
import { useAuth } from '@/contexts/auth'
import { AuthShell } from './AuthShell'

const schema = z.object({
  email: z.string().trim().min(1, 'Nhập email').pipe(z.email('Email không hợp lệ')),
  password: z.string().min(1, 'Nhập mật khẩu'),
})
type FormValues = z.infer<typeof schema>

/** Tài khoản seed của cace-api, chỉ hiện khi chạy dev */
const DEMO_ACCOUNTS = [
  { email: 'admin@cace.local', password: 'Admin@123', label: 'Quản trị viên' },
  { email: 'mentor@cace.local', password: 'Mentor@123', label: 'Mentor' },
]

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } })

  const onSubmit = handleSubmit(async (values) => {
    setError('')
    try {
      await login(values)
      navigate(from, { replace: true })
    } catch (err) {
      setError(errorMessage(err))
    }
  })

  return (
    <AuthShell>
      <div className="auth-hello">Chào mừng trở lại</div>
      <h1>Đăng nhập quản trị</h1>
      <p className="auth-sub">Dành cho đội ngũ vận hành và mentor của CACE.</p>

      <form onSubmit={onSubmit} noValidate>
        <ErrorBox>{error}</ErrorBox>
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <span className="input-wrap with-icon">
            <Icon icon={Mail} className="input-icon" />
            <Input
              id="email"
              type="email"
              autoComplete="username"
              autoFocus
              placeholder="ban@cace.vn"
              invalid={Boolean(errors.email)}
              {...register('email')}
            />
          </span>
        </Field>
        <Field
          label="Mật khẩu"
          htmlFor="password"
          error={errors.password?.message}
        >
          <PasswordInput
            id="password"
            autoComplete="current-password"
            placeholder="Nhập mật khẩu"
            invalid={Boolean(errors.password)}
            {...register('password')}
          />
        </Field>
        <div className="auth-row">
          <span />
          <Link to="/forgot-password">Quên mật khẩu?</Link>
        </div>
        <Button variant="primary" type="submit" block icon={LogIn} loading={isSubmitting} className="auth-submit">
          {isSubmitting ? 'Đang đăng nhập' : 'Đăng nhập'}
        </Button>
      </form>

      {import.meta.env.DEV && (
        <div className="auth-demo">
          <div className="auth-demo-title">Tài khoản mẫu (chỉ hiện khi dev)</div>
          <div className="auth-demo-list">
            {DEMO_ACCOUNTS.map((a) => (
              <button
                key={a.email}
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  setValue('email', a.email, { shouldValidate: true })
                  setValue('password', a.password, { shouldValidate: true })
                  onSubmit()
                }}
              >
                <b>{a.label}</b>
                <small>{a.email}</small>
              </button>
            ))}
          </div>
        </div>
      )}
    </AuthShell>
  )
}
