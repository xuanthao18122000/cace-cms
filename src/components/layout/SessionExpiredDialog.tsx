import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { errorMessage, UNAUTHORIZED_EVENT } from '@/api'
import { Dialog, ErrorBox, Field, Input, LinkButton, PasswordInput } from '@/components/ui'
import { useAuth } from '@/contexts/auth'
import { useToast } from '@/contexts/toast'

const schema = z.object({ password: z.string().min(1, 'Nhập mật khẩu') })
type FormValues = z.infer<typeof schema>

/**
 * Phiên hết hạn khi còn thay đổi chưa lưu: hỏi đăng nhập lại ngay trên trang đang mở,
 * trang sửa vẫn giữ nguyên nội dung để lưu lại sau khi đăng nhập.
 */
export function SessionExpiredDialog() {
  const { user, sessionExpired, login, logout } = useAuth()
  const toast = useToast()
  // Đóng tạm để chép nội dung ra ngoài; request 401 kế tiếp sẽ mở lại
  const [dismissed, setDismissed] = useState(false)
  const [error, setError] = useState('')
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { password: '' } })

  useEffect(() => {
    const onUnauthorized = () => setDismissed(false)
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
  }, [])

  if (!user) return null
  const email = user.email

  const onSubmit = handleSubmit(async ({ password }) => {
    setError('')
    try {
      await login({ email, password })
      reset()
      toast.success('Đã đăng nhập lại. Hãy lưu lại thay đổi của bạn.')
    } catch (err) {
      setError(errorMessage(err))
    }
  })

  return (
    <Dialog
      open={sessionExpired && !dismissed}
      title="Phiên đăng nhập đã hết hạn"
      description="Thay đổi chưa lưu vẫn còn trên trang. Đăng nhập lại để tiếp tục lưu."
      submitLabel="Đăng nhập lại"
      busy={isSubmitting}
      onClose={() => setDismissed(true)}
      onSubmit={() => void onSubmit()}
    >
      <ErrorBox>{error}</ErrorBox>
      <Field label="Email" htmlFor="se-email">
        <Input id="se-email" type="email" value={email} readOnly disabled />
      </Field>
      <Field
        label="Mật khẩu"
        htmlFor="se-password"
        required
        error={errors.password?.message}
        hint={
          <LinkButton className="danger" onClick={() => void logout()}>
            Đăng xuất (bỏ thay đổi chưa lưu)
          </LinkButton>
        }
      >
        <PasswordInput id="se-password" autoComplete="current-password" invalid={Boolean(errors.password)} {...register('password')} />
      </Field>
    </Dialog>
  )
}
