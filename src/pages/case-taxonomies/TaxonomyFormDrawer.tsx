import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { errorMessage, taxonomyApi } from '@/api'
import { Drawer, Field, FormCard, Input, Switch, Textarea } from '@/components/ui'
import { useToast } from '@/contexts/toast'
import { applyServerErrors } from '@/lib/forms'
import type { Taxonomy, TaxonomyType } from '@/types'
import { TAXONOMY_LABEL } from '../cases/caseLabels'

interface Props {
  open: boolean
  type: TaxonomyType
  /** null: thêm mới */
  taxonomy: Taxonomy | null
  /** Thứ tự gợi ý cho mục mới (cuối danh sách) */
  nextSortOrder: number
  onClose(): void
  onSaved(taxonomy: Taxonomy): void
}

const schema = z.object({
  name: z.string().trim().min(2, 'Nhập tên (tối thiểu 2 ký tự)').max(100, 'Tối đa 100 ký tự'),
  description: z.string().trim().max(500, 'Tối đa 500 ký tự'),
  sortOrder: z
    .string()
    .trim()
    .refine((v) => /^-?\d+$/.test(v), 'Nhập số nguyên'),
  isActive: z.boolean(),
})
type FormValues = z.infer<typeof schema>

const FIELDS = ['name', 'description', 'sortOrder', 'isActive'] as const

export function TaxonomyFormDrawer(props: Props) {
  if (!props.open) return null
  return <TaxonomyForm key={props.taxonomy?.id ?? `new-${props.type}`} {...props} />
}

function TaxonomyForm({ type, taxonomy, nextSortOrder, onClose, onSaved }: Props) {
  const toast = useToast()
  const isEdit = taxonomy !== null
  const label = TAXONOMY_LABEL[type]
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: taxonomy?.name ?? '',
      description: taxonomy?.description ?? '',
      sortOrder: String(taxonomy?.sortOrder ?? nextSortOrder),
      isActive: taxonomy?.isActive ?? true,
    },
  })

  const mutation = useMutation({
    mutationFn: (v: FormValues) => {
      const body = { name: v.name, description: v.description || null, sortOrder: Number(v.sortOrder), isActive: v.isActive }
      return isEdit ? taxonomyApi.update(taxonomy.id, body) : taxonomyApi.create({ type, ...body })
    },
    onSuccess: (saved) => {
      toast.success(isEdit ? `Đã lưu ${saved.name}` : `Đã thêm ${saved.name}`)
      onSaved(saved)
    },
    onError: (err) => {
      if (!applyServerErrors(err, setError, FIELDS)) toast.error(errorMessage(err))
    },
  })

  return (
    <Drawer
      open
      title={isEdit ? `Sửa ${label.toLowerCase()}` : `Thêm ${label.toLowerCase()}`}
      subtitle={isEdit ? <span className="mono">{taxonomy.slug}</span> : 'Đường dẫn tự tạo theo tên'}
      onClose={onClose}
      onSubmit={handleSubmit((v) => {
        if (isEdit && !isDirty) return onClose()
        mutation.mutate(v)
      })}
      submitLabel={isEdit ? 'Lưu thay đổi' : 'Thêm mới'}
      busy={mutation.isPending}
    >
      <FormCard title={`Thông tin ${label.toLowerCase()}`}>
        <Field label="Tên" htmlFor="t-name" required error={errors.name?.message}>
          <Input id="t-name" placeholder={type === 'level' ? 'Vd: Gà con' : type === 'field' ? 'Vd: Marketing' : 'Vd: Bán lẻ & FMCG'} invalid={Boolean(errors.name)} {...register('name')} />
        </Field>
        <Field label="Mô tả" htmlFor="t-desc" error={errors.description?.message}>
          <Textarea id="t-desc" rows={3} placeholder="Không bắt buộc" invalid={Boolean(errors.description)} {...register('description')} />
        </Field>
        <Field label="Thứ tự" htmlFor="t-sort" error={errors.sortOrder?.message} hint="Số nhỏ đứng trước trong bộ lọc và ô chọn">
          <Input id="t-sort" type="number" inputMode="numeric" step={1} style={{ maxWidth: 160 }} invalid={Boolean(errors.sortOrder)} {...register('sortOrder')} />
        </Field>
        <Controller
          control={control}
          name="isActive"
          render={({ field }) => (
            <Switch
              checked={field.value}
              onChange={field.onChange}
              label="Đang dùng"
              description="Tắt để ẩn khỏi bộ lọc trên web; case đã gắn vẫn giữ nguyên"
            />
          )}
        />
      </FormCard>
    </Drawer>
  )
}
