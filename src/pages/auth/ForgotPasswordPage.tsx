import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { ArrowLeft, MailCheck, Send } from 'lucide-react'
import { authApi, errorMessage } from '@/api'
import { Button, ErrorBox, Field, Icon, IconTile, Input } from '@/components/ui'
import { emailSchema } from '@/lib/forms'
import { AuthShell } from './AuthShell'

const schema = z.object({ email: emailSchema })
type FormValues = z.infer<typeof schema>

export function ForgotPasswordPage() {
  const mutation = useMutation({ mutationFn: (email: string) => authApi.forgotPassword(email) })
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: '' } })

  const onSubmit = handleSubmit((v) => mutation.mutate(v.email))

  if (mutation.isSuccess) {
    return (
      <AuthShell>
        <div className="auth-result">
          <IconTile icon={MailCheck} tone="green" size="lg" />
          <h1>Kiểm tra hộp thư</h1>
          <p className="auth-sub">
            Nếu <b>{getValues('email')}</b> thuộc một tài khoản quản trị, chúng tôi đã gửi liên kết đặt lại mật khẩu. Liên kết có hiệu lực trong thời gian ngắn.
          </p>
          <Link to="/login" className="auth-back">
            <Icon icon={ArrowLeft} /> Về trang đăng nhập
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <h1>Quên mật khẩu</h1>
      <p className="auth-sub">Nhập email tài khoản quản trị, chúng tôi sẽ gửi liên kết đặt lại mật khẩu.</p>
      <form onSubmit={onSubmit} noValidate>
        <ErrorBox>{mutation.isError && errorMessage(mutation.error)}</ErrorBox>
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" autoFocus placeholder="ban@cace.vn" invalid={Boolean(errors.email)} {...register('email')} />
        </Field>
        <Button variant="primary" type="submit" block icon={Send} loading={mutation.isPending} className="auth-submit">
          Gửi liên kết
        </Button>
      </form>
      <Link to="/login" className="auth-back">
        <Icon icon={ArrowLeft} /> Về trang đăng nhập
      </Link>
    </AuthShell>
  )
}
