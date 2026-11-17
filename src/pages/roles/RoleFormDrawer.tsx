import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { errorMessage, roleApi } from '@/api'
import { Drawer, Field, FormCard, InfoBox, Input, Textarea } from '@/components/ui'
import { useToast } from '@/contexts/toast'
import { applyServerErrors } from '@/lib/forms'
import type { Role } from '@/types'
import { slugify } from '@/utils/text'

interface Props {
  open: boolean
  /** null: thêm mới */
  role: Role | null
  onClose(): void
  onSaved(role: Role): void
}

const schema = z.object({
  name: z.string().trim().min(2, 'Nhập tên vai trò (tối thiểu 2 ký tự)').max(80, 'Tối đa 80 ký tự'),
  code: z
    .string()
    .trim()
    .min(2, 'Tối thiểu 2 ký tự')
    .max(50, 'Tối đa 50 ký tự')
    .regex(/^[a-z0-9_-]+$/, 'Chỉ gồm chữ thường không dấu, số, gạch ngang hoặc gạch dưới'),
  description: z.string().trim().max(500, 'Tối đa 500 ký tự'),
})
type FormValues = z.infer<typeof schema>

export function RoleFormDrawer(props: Props) {
  if (!props.open) return null
  return <RoleForm key={props.role?.id ?? 'new'} {...props} />
}

function RoleForm({ role, onClose, onSaved }: Props) {
  const toast = useToast()
  const isEdit = role !== null
  const {
    register,
    handleSubmit,
    setValue,
    getFieldState,
    setError,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: role?.name ?? '', code: role?.code ?? '', description: role?.description ?? '' },
  })

  const mutation = useMutation({
    mutationFn: (v: FormValues) => {
      const description = v.description || null
      return isEdit ? roleApi.update(role.id, { name: v.name, description }) : roleApi.create({ code: v.code, name: v.name, description })
    },
    onSuccess: (saved) => {
      toast.success(isEdit ? `Đã lưu vai trò ${saved.name}` : `Đã tạo vai trò ${saved.name}`)
      onSaved(saved)
    },
    onError: (err) => {
      if (!applyServerErrors(err, setError, ['name', 'code', 'description'])) toast.error(errorMessage(err))
    },
  })

  const codeField = register('code')

  return (
    <Drawer
      open
      title={isEdit ? 'Sửa vai trò' : 'Thêm vai trò'}
      subtitle={isEdit ? `Mã: ${role.code}` : 'Nhóm người dùng có cùng quyền truy cập'}
      onClose={onClose}
      onSubmit={handleSubmit((v) => {
        if (isEdit && !isDirty) return onClose()
        mutation.mutate(v)
      })}
      submitLabel={isEdit ? 'Lưu thay đổi' : 'Tạo vai trò'}
      busy={mutation.isPending}
    >
      <FormCard title="Thông tin vai trò">
        <Field label="Tên vai trò" htmlFor="r-name" required error={errors.name?.message}>
          <Input
            id="r-name"
            placeholder="Vd: Ban giám khảo"
            invalid={Boolean(errors.name)}
            {...register('name', {
              onChange: (e) => {
                // Mã tự sinh theo tên cho tới khi người dùng tự sửa mã
                if (!isEdit && !getFieldState('code').isDirty) setValue('code', slugify(e.target.value), { shouldValidate: Boolean(errors.code) })
              },
            })}
          />
        </Field>
        <Field
          label="Mã vai trò"
          htmlFor="r-code"
          required={!isEdit}
          error={errors.code?.message}
          hint={isEdit ? 'Mã không đổi được sau khi tạo' : 'Tự tạo theo tên, có thể sửa. Chỉ gồm a-z, 0-9, - và _'}
        >
          <Input
            id="r-code"
            className="mono"
            disabled={isEdit}
            spellCheck={false}
            placeholder="ban-giam-khao"
            invalid={Boolean(errors.code)}
            {...codeField}
            onChange={(e) => {
              e.target.value = e.target.value.toLowerCase()
              return codeField.onChange(e)
            }}
          />
        </Field>
        <Field label="Mô tả" htmlFor="r-desc" error={errors.description?.message}>
          <Textarea id="r-desc" rows={3} placeholder="Vai trò này dùng cho ai, làm gì" invalid={Boolean(errors.description)} {...register('description')} />
        </Field>
      </FormCard>
      {isEdit && role.isSystem && <InfoBox>Vai trò hệ thống: đổi được tên và mô tả, không xoá được.</InfoBox>}
      <div className="info-box subtle">Phân quyền chi tiết sẽ có ở giai đoạn sau.</div>
    </Drawer>
  )
}
