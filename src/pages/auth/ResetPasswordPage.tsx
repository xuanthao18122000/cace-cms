import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { ArrowLeft, CircleCheck, KeyRound, LinkIcon } from 'lucide-react'
import { ApiError, authApi, errorMessage } from '@/api'
import { Button, ErrorBox, Field, Icon, IconTile, PasswordInput } from '@/components/ui'
import { applyServerErrors, passwordSchema } from '@/lib/forms'
import { AuthShell } from './AuthShell'

const schema = z
  .object({ password: passwordSchema, confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, { path: ['confirmPassword'], message: 'Nhập lại chưa khớp' })
type FormValues = z.infer<typeof schema>

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { password: '', confirmPassword: '' } })

  const mutation = useMutation({
    mutationFn: (password: string) => authApi.resetPassword(token, password),
    onError: (err) => applyServerErrors(err, setError, ['password']),
  })
  const expired = mutation.error instanceof ApiError && mutation.error.code === 'CACE_TOKEN_EXPIRED'

  if (!token || expired) {
    return (
      <AuthShell>
        <div className="auth-result">
          <IconTile icon={LinkIcon} tone="red" size="lg" />
          <h1>Liên kết không hợp lệ</h1>
          <p className="auth-sub">Liên kết đặt lại mật khẩu đã hết hạn, đã được dùng hoặc bị thiếu. Hãy yêu cầu liên kết mới.</p>
          <Link to="/forgot-password" className="btn btn-primary btn-block">
            Gửi lại liên kết
          </Link>
          <Link to="/login" className="auth-back">
            <Icon icon={ArrowLeft} /> Về trang đăng nhập
          </Link>
        </div>
      </AuthShell>
    )
  }

  if (mutation.isSuccess) {
    return (
      <AuthShell>
        <div className="auth-result">
          <IconTile icon={CircleCheck} tone="green" size="lg" />
          <h1>Đã đặt lại mật khẩu</h1>
          <p className="auth-sub">Mọi phiên đăng nhập cũ đã bị đăng xuất. Đăng nhập lại bằng mật khẩu mới.</p>
          <Link to="/login" className="btn btn-primary btn-block">
            Đăng nhập
          </Link>
        </div>
      </AuthShell>
    )
  }

  const serverError = mutation.isError && !Object.keys((mutation.error as ApiError).fieldErrors ?? {}).length ? errorMessage(mutation.error) : ''

  return (
    <AuthShell>
      <h1>Đặt mật khẩu mới</h1>
      <p className="auth-sub">Tối thiểu 8 ký tự, có cả chữ và số.</p>
      <form onSubmit={handleSubmit((v) => mutation.mutate(v.password))} noValidate>
        <ErrorBox>{serverError}</ErrorBox>
        <Field label="Mật khẩu mới" htmlFor="password" error={errors.password?.message}>
          <PasswordInput id="password" autoComplete="new-password" autoFocus invalid={Boolean(errors.password)} {...register('password')} />
        </Field>
        <Field label="Nhập lại mật khẩu" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
          <PasswordInput id="confirmPassword" autoComplete="new-password" invalid={Boolean(errors.confirmPassword)} {...register('confirmPassword')} />
        </Field>
        <Button variant="primary" type="submit" block icon={KeyRound} loading={mutation.isPending} className="auth-submit">
          Đặt lại mật khẩu
        </Button>
      </form>
      <Link to="/login" className="auth-back">
        <Icon icon={ArrowLeft} /> Về trang đăng nhập
      </Link>
    </AuthShell>
  )
}
