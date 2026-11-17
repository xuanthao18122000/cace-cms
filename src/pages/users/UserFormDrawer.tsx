import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { errorMessage, userApi } from '@/api'
import { AvatarUpload } from '@/components/AvatarUpload'
import { Drawer, Field, FormCard, FormRow, InfoBox, Input, PasswordInput, Segmented, Select } from '@/components/ui'
import { useToast } from '@/contexts/toast'
import { useRolesQuery } from '@/hooks/queries'
import { applyServerErrors, emailSchema, passwordSchema, phoneSchema } from '@/lib/forms'
import type { User } from '@/types'
import { STATUS_OPTIONS } from './userLabels'

interface Props {
  open: boolean
  /** null: thêm mới */
  user: User | null
  /** Đang sửa chính mình: không tự đổi vai / khoá */
  isSelf?: boolean
  onClose(): void
  onSaved(user: User, created: boolean): void
}

const base = {
  fullName: z.string().trim().min(2, 'Nhập họ tên (tối thiểu 2 ký tự)').max(100, 'Tối đa 100 ký tự'),
  phone: phoneSchema,
  roleId: z.string().min(1, 'Chọn vai trò'),
  status: z.enum(['active', 'locked']),
  avatarUrl: z.string().nullable(),
}
const createSchema = z.object({ ...base, email: emailSchema, password: passwordSchema })
const editSchema = z.object({ ...base, email: z.string(), password: z.string() })
type FormValues = z.infer<typeof createSchema>

const FIELDS = ['fullName', 'email', 'phone', 'roleId', 'status', 'password', 'avatarUrl'] as const

export function UserFormDrawer(props: Props) {
  if (!props.open) return null
  return <UserForm key={props.user?.id ?? 'new'} {...props} />
}

function UserForm({ user, isSelf, onClose, onSaved }: Props) {
  const toast = useToast()
  const isEdit = user !== null
  const roles = useRolesQuery()

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(isEdit ? editSchema : createSchema),
    defaultValues: {
      fullName: user?.fullName ?? '',
      email: user?.email ?? '',
      phone: user?.phone ?? '',
      roleId: user?.role.id ?? '',
      status: user?.status ?? 'active',
      avatarUrl: user?.avatarUrl ?? null,
      password: '',
    },
  })

  const mutation = useMutation({
    mutationFn: (v: FormValues) => {
      const phone = v.phone.trim()
      if (isEdit) {
        return userApi.update(user.id, {
          fullName: v.fullName,
          phone: phone || null,
          avatarUrl: v.avatarUrl,
          // Không gửi vai / trạng thái của chính mình (máy chủ trả 422)
          ...(isSelf ? {} : { roleId: v.roleId, status: v.status }),
        })
      }
      // Một request duy nhất (kể cả ảnh đại diện): tránh trạng thái tạo xong nhưng gắn ảnh lỗi
      return userApi.create({
        email: v.email,
        fullName: v.fullName,
        password: v.password,
        roleId: v.roleId,
        status: v.status,
        ...(phone ? { phone } : {}),
        ...(v.avatarUrl ? { avatarUrl: v.avatarUrl } : {}),
      })
    },
    onSuccess: (saved) => {
      toast.success(isEdit ? `Đã lưu ${saved.fullName}` : `Đã tạo tài khoản ${saved.email}`)
      onSaved(saved, !isEdit)
    },
    onError: (err) => {
      if (!applyServerErrors(err, setError, FIELDS)) toast.error(errorMessage(err))
    },
  })

  const roleOptions = (roles.data ?? []).map((r) => ({ value: r.id, label: r.name, description: r.description ?? r.code }))
  const busy = mutation.isPending
  const name = useWatch({ control, name: 'fullName' })

  return (
    <Drawer
      open
      title={isEdit ? 'Sửa người dùng' : 'Thêm người dùng'}
      subtitle={isEdit ? user.email : 'Tài khoản tạo ở đây coi như đã xác minh email'}
      onClose={onClose}
      onSubmit={handleSubmit((v) => {
        if (isEdit && !isDirty) return onClose()
        mutation.mutate(v)
      })}
      submitLabel={isEdit ? 'Lưu thay đổi' : 'Tạo tài khoản'}
      busy={busy}
    >
      <FormCard title="Hồ sơ">
        <Controller
          control={control}
          name="avatarUrl"
          render={({ field }) => <AvatarUpload name={name} value={field.value} onChange={(url) => field.onChange(url)} disabled={busy} />}
        />
        <Field label="Họ và tên" htmlFor="u-name" required error={errors.fullName?.message}>
          <Input id="u-name" autoComplete="off" invalid={Boolean(errors.fullName)} {...register('fullName')} />
        </Field>
        <FormRow>
          <Field label="Email" htmlFor="u-email" required={!isEdit} error={errors.email?.message} hint={isEdit ? 'Không đổi được email' : undefined}>
            <Input id="u-email" type="email" disabled={isEdit} invalid={Boolean(errors.email)} {...register('email')} />
          </Field>
          <Field label="Điện thoại" htmlFor="u-phone" error={errors.phone?.message}>
            <Input id="u-phone" type="tel" inputMode="tel" placeholder="Không bắt buộc" invalid={Boolean(errors.phone)} {...register('phone')} />
          </Field>
        </FormRow>
      </FormCard>

      <FormCard title="Quyền truy cập">
        <Field
          label="Vai trò"
          htmlFor="u-role"
          required
          error={errors.roleId?.message}
          hint={isSelf ? 'Không tự đổi vai trò của chính mình' : 'Vai khác "Người học" đăng nhập được trang quản trị'}
        >
          <Controller
            control={control}
            name="roleId"
            render={({ field }) => (
              <Select
                id="u-role"
                value={field.value}
                onChange={field.onChange}
                options={roleOptions}
                placeholder={roles.isLoading ? 'Đang tải vai trò' : 'Chọn vai trò'}
                disabled={isSelf || roles.isLoading}
                invalid={Boolean(errors.roleId)}
              />
            )}
          />
        </Field>
        <Field label="Trạng thái" error={errors.status?.message} hint={isSelf ? 'Không tự khoá tài khoản của chính mình' : undefined}>
          <Controller
            control={control}
            name="status"
            render={({ field }) => <Segmented options={STATUS_OPTIONS} value={field.value} onChange={field.onChange} disabled={isSelf} />}
          />
        </Field>
      </FormCard>

      {!isEdit && (
        <FormCard title="Mật khẩu">
          <Field label="Mật khẩu ban đầu" htmlFor="u-password" required error={errors.password?.message} hint="Tối thiểu 8 ký tự, có cả chữ và số">
            <PasswordInput id="u-password" autoComplete="new-password" invalid={Boolean(errors.password)} {...register('password')} />
          </Field>
        </FormCard>
      )}
      {!isEdit && <InfoBox>Gửi mật khẩu ban đầu cho người dùng qua kênh riêng; họ có thể đổi lại trong trang hồ sơ.</InfoBox>}
    </Drawer>
  )
}
