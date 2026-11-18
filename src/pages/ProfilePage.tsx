import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, KeyRound, UserRound } from 'lucide-react'
import { authApi, errorMessage } from '@/api'
import { AvatarUpload } from '@/components/AvatarUpload'
import { Avatar, Button, Card, Field, FormRow, Input, KeyValueGrid, PageHeader, PasswordInput } from '@/components/ui'
import { useAuth } from '@/contexts/auth'
import { useToast } from '@/contexts/toast'
import { applyServerErrors, passwordSchema, phoneSchema } from '@/lib/forms'
import { queryKeys } from '@/lib/queryClient'
import type { User } from '@/types'
import { formatDate, formatDateTime } from '@/utils/format'
import { RoleBadge, VerifiedBadge } from './users/userBits'

export function ProfilePage() {
  const { user } = useAuth()
  if (!user) return null

  return (
    <>
      <PageHeader crumbs={[{ label: 'Tài khoản' }]} title="Hồ sơ của tôi" subtitle="Thông tin cá nhân và mật khẩu đăng nhập" />
      <div className="grid g12 top">
        <Card>
          <div className="profile-head">
            <Avatar name={user.fullName} src={user.avatarUrl} size="xl" />
            <div className="card-title">{user.fullName}</div>
            <RoleBadge role={user.role} />
          </div>
          <KeyValueGrid
            columns={1}
            items={[
              { label: 'Email', value: user.email },
              { label: 'Xác minh email', value: <VerifiedBadge verified={user.emailVerified} /> },
              { label: 'Ngày tạo', value: formatDate(user.createdAt) },
              { label: 'Đăng nhập gần nhất', value: formatDateTime(user.lastLoginAt) },
            ]}
          />
        </Card>

        <div className="stack">
          {/* Không gắn key theo updatedAt: đổi mật khẩu cũng đổi updatedAt và làm mất các ô đang sửa */}
          <ProfileForm user={user} />
          <PasswordForm />
        </div>
      </div>
    </>
  )
}

const profileSchema = z.object({
  fullName: z.string().trim().min(2, 'Nhập họ tên (tối thiểu 2 ký tự)').max(100, 'Tối đa 100 ký tự'),
  phone: phoneSchema,
  avatarUrl: z.string().nullable(),
})
type ProfileValues = z.infer<typeof profileSchema>

function ProfileForm({ user }: { user: User }) {
  const { setUser } = useAuth()
  const toast = useToast()
  const queryClient = useQueryClient()
  const defaults: ProfileValues = { fullName: user.fullName, phone: user.phone ?? '', avatarUrl: user.avatarUrl }
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<ProfileValues>({ resolver: zodResolver(profileSchema), defaultValues: defaults })
  const name = useWatch({ control, name: 'fullName' })

  const mutation = useMutation({
    mutationFn: (v: ProfileValues) => authApi.updateProfile({ fullName: v.fullName, phone: v.phone.trim() || null, avatarUrl: v.avatarUrl }),
    onSuccess: (saved) => {
      setUser(saved)
      reset({ fullName: saved.fullName, phone: saved.phone ?? '', avatarUrl: saved.avatarUrl })
      queryClient.invalidateQueries({ queryKey: queryKeys.users })
      toast.success('Đã lưu thông tin cá nhân')
    },
    onError: (err) => {
      if (!applyServerErrors(err, setError, ['fullName', 'phone', 'avatarUrl'])) toast.error(errorMessage(err))
    },
  })

  return (
    <Card icon={UserRound} title="Thông tin cá nhân" subtitle="Hiện trong trang quản trị và trên nền tảng CACE">
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate>
        <Controller
          control={control}
          name="avatarUrl"
          render={({ field }) => <AvatarUpload name={name} value={field.value} onChange={(url) => field.onChange(url)} disabled={mutation.isPending} />}
        />
        <FormRow>
          <Field label="Họ và tên" htmlFor="p-name" required error={errors.fullName?.message}>
            <Input id="p-name" invalid={Boolean(errors.fullName)} {...register('fullName')} />
          </Field>
          <Field label="Số điện thoại" htmlFor="p-phone" error={errors.phone?.message}>
            <Input id="p-phone" type="tel" inputMode="tel" invalid={Boolean(errors.phone)} {...register('phone')} />
          </Field>
        </FormRow>
        <Field label="Email" htmlFor="p-email" hint="Liên hệ quản trị viên nếu cần đổi email">
          <Input id="p-email" value={user.email} disabled readOnly />
        </Field>
        <div className="card-actions">
          <Button disabled={!isDirty || mutation.isPending} onClick={() => reset(defaults)}>
            Hoàn tác
          </Button>
          <Button variant="primary" type="submit" icon={Check} disabled={!isDirty} loading={mutation.isPending}>
            Lưu thay đổi
          </Button>
        </div>
      </form>
    </Card>
  )
}

const passwordFormSchema = z
  .object({ currentPassword: z.string().min(1, 'Nhập mật khẩu hiện tại'), newPassword: passwordSchema, confirmPassword: z.string() })
  .refine((v) => v.newPassword !== v.currentPassword, { path: ['newPassword'], message: 'Phải khác mật khẩu hiện tại' })
  .refine((v) => v.confirmPassword === v.newPassword, { path: ['confirmPassword'], message: 'Nhập lại chưa khớp' })
type PasswordValues = z.infer<typeof passwordFormSchema>

const EMPTY_PASSWORD: PasswordValues = { currentPassword: '', newPassword: '', confirmPassword: '' }

function PasswordForm() {
  const { setUser } = useAuth()
  const toast = useToast()
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<PasswordValues>({ resolver: zodResolver(passwordFormSchema), defaultValues: EMPTY_PASSWORD })

  const mutation = useMutation({
    // authApi.changePassword tự thay access token bằng token mới máy chủ trả về
    mutationFn: (v: PasswordValues) => authApi.changePassword({ currentPassword: v.currentPassword, newPassword: v.newPassword }),
    onSuccess: (saved) => {
      setUser(saved)
      reset(EMPTY_PASSWORD)
      toast.success('Đã đổi mật khẩu. Các phiên đăng nhập khác đã bị đăng xuất.')
    },
    onError: (err) => {
      const applied = applyServerErrors(err, setError, ['currentPassword', 'newPassword', 'confirmPassword'], { password: 'newPassword' })
      if (!applied) toast.error(errorMessage(err))
    },
  })

  return (
    <Card icon={KeyRound} title="Đổi mật khẩu" subtitle="Tối thiểu 8 ký tự, có cả chữ và số">
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate>
        <Field label="Mật khẩu hiện tại" htmlFor="currentPassword" required error={errors.currentPassword?.message}>
          <PasswordInput id="currentPassword" autoComplete="current-password" invalid={Boolean(errors.currentPassword)} {...register('currentPassword')} />
        </Field>
        <FormRow>
          <Field label="Mật khẩu mới" htmlFor="newPassword" required error={errors.newPassword?.message}>
            <PasswordInput id="newPassword" autoComplete="new-password" invalid={Boolean(errors.newPassword)} {...register('newPassword')} />
          </Field>
          <Field label="Nhập lại mật khẩu mới" htmlFor="confirmPassword" required error={errors.confirmPassword?.message}>
            <PasswordInput id="confirmPassword" autoComplete="new-password" invalid={Boolean(errors.confirmPassword)} {...register('confirmPassword')} />
          </Field>
        </FormRow>
        <div className="card-actions">
          <Button variant="primary" type="submit" icon={KeyRound} loading={mutation.isPending}>
            Đổi mật khẩu
          </Button>
        </div>
      </form>
    </Card>
  )
}
