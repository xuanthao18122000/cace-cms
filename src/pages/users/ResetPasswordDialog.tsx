import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { Sparkles } from 'lucide-react'
import { errorMessage, userApi } from '@/api'
import { Dialog, Field, LinkButton, PasswordInput } from '@/components/ui'
import { useToast } from '@/contexts/toast'
import { applyServerErrors, passwordSchema } from '@/lib/forms'
import type { User } from '@/types'

const schema = z.object({ password: passwordSchema })
type FormValues = z.infer<typeof schema>

/** Mật khẩu ngẫu nhiên 12 ký tự, luôn có chữ và số */
function randomPassword() {
  const letters = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ'
  const digits = '23456789'
  const all = letters + digits
  const bytes = crypto.getRandomValues(new Uint32Array(12))
  const chars = Array.from(bytes, (b) => all[b % all.length])
  chars[0] = letters[bytes[0] % letters.length]
  chars[11] = digits[bytes[11] % digits.length]
  return chars.join('')
}

export function ResetPasswordDialog({ user, onClose }: { user: User; onClose(): void }) {
  const toast = useToast()
  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { password: '' } })

  const mutation = useMutation({
    mutationFn: (password: string) => userApi.resetPassword(user.id, password),
    onSuccess: () => {
      toast.success(`Đã đặt lại mật khẩu cho ${user.fullName}`)
      onClose()
    },
    onError: (err) => {
      if (!applyServerErrors(err, setError, ['password'])) toast.error(errorMessage(err))
    },
  })

  return (
    <Dialog
      open
      title="Đặt lại mật khẩu"
      description={
        <>
          Đặt mật khẩu mới cho <b>{user.fullName}</b>. Mọi phiên đăng nhập của người này sẽ bị đăng xuất.
        </>
      }
      submitLabel="Đặt lại mật khẩu"
      busy={mutation.isPending}
      onClose={onClose}
      onSubmit={handleSubmit((v) => mutation.mutate(v.password))}
    >
      <Field
        label="Mật khẩu mới"
        htmlFor="rp-password"
        required
        error={errors.password?.message}
        hint={
          <LinkButton icon={Sparkles} onClick={() => setValue('password', randomPassword(), { shouldValidate: true })}>
            Tạo mật khẩu ngẫu nhiên
          </LinkButton>
        }
      >
        <PasswordInput id="rp-password" autoComplete="new-password" invalid={Boolean(errors.password)} {...register('password')} />
      </Field>
    </Dialog>
  )
}
