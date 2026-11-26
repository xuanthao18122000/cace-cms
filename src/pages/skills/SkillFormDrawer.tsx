import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { errorMessage, skillApi } from '@/api'
import { Drawer, Field, FormCard, FormRow, Input, Select, Switch, Textarea } from '@/components/ui'
import { useToast } from '@/contexts/toast'
import { applyServerErrors } from '@/lib/forms'
import type { Skill } from '@/types'
import { ICON_OPTIONS } from './skillLabels'

interface Props {
  open: boolean
  /** null: thêm mới */
  skill: Skill | null
  nextSortOrder: number
  onClose(): void
  onSaved(skill: Skill): void
}

const schema = z.object({
  name: z.string().trim().min(2, 'Nhập tên (tối thiểu 2 ký tự)').max(80, 'Tối đa 80 ký tự'),
  nameEn: z.string().trim().max(80, 'Tối đa 80 ký tự'),
  code: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Chỉ chữ thường không dấu, số và dấu gạch ngang')
    .max(50, 'Tối đa 50 ký tự'),
  description: z.string().trim().max(300, 'Tối đa 300 ký tự'),
  icon: z.string(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Màu dạng #RRGGBB'),
  sortOrder: z
    .string()
    .trim()
    .refine((v) => /^\d+$/.test(v), 'Nhập số nguyên'),
  isActive: z.boolean(),
})
type FormValues = z.infer<typeof schema>

const FIELDS = ['name', 'nameEn', 'code', 'description', 'icon', 'color', 'sortOrder', 'isActive'] as const

/** Bỏ dấu tiếng Việt để gợi ý mã kỹ năng từ tên. */
const slugify = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)

export function SkillFormDrawer(props: Props) {
  if (!props.open) return null
  return <SkillForm key={props.skill?.id ?? 'new'} {...props} />
}

function SkillForm({ skill, nextSortOrder, onClose, onSaved }: Props) {
  const toast = useToast()
  const isEdit = skill !== null
  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    getValues,
    formState: { errors, isDirty, dirtyFields },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: skill?.name ?? '',
      nameEn: skill?.nameEn ?? '',
      code: skill?.code ?? '',
      description: skill?.description ?? '',
      icon: skill?.icon ?? 'sparkles',
      color: skill?.color ?? '#0038E6',
      sortOrder: String(skill?.sortOrder ?? nextSortOrder),
      isActive: skill?.isActive ?? true,
    },
  })
  const color = useWatch({ control, name: 'color' })

  const mutation = useMutation({
    mutationFn: (v: FormValues) => {
      const body = { ...v, nameEn: v.nameEn || null, description: v.description || null, sortOrder: Number(v.sortOrder) }
      return isEdit ? skillApi.update(skill.id, body) : skillApi.create(body)
    },
    onSuccess: (saved) => {
      toast.success(isEdit ? `Đã lưu ${saved.name}` : `Đã thêm ${saved.name}`)
      onSaved(saved)
    },
    onError: (err) => {
      if (!applyServerErrors(err, setError, FIELDS)) toast.error(errorMessage(err))
    },
  })

  const nameField = register('name')

  return (
    <Drawer
      open
      title={isEdit ? `Sửa kỹ năng` : 'Thêm kỹ năng'}
      subtitle="Hiện trên bản đồ kỹ năng của người học và trong form hồ sơ rèn luyện"
      onClose={onClose}
      onSubmit={handleSubmit((v) => {
        if (isEdit && !isDirty) return onClose()
        mutation.mutate(v)
      })}
      submitLabel={isEdit ? 'Lưu thay đổi' : 'Thêm mới'}
      busy={mutation.isPending}
    >
      <FormCard title="Thông tin kỹ năng">
        <Field label="Tên kỹ năng" htmlFor="s-name" required error={errors.name?.message}>
          <Input
            id="s-name"
            placeholder="Vd: Sáng tạo & Nội dung"
            invalid={Boolean(errors.name)}
            {...nameField}
            onChange={(e) => {
              void nameField.onChange(e)
              // Thêm mới: gợi ý mã theo tên cho tới khi admin tự sửa mã
              if (!isEdit && !dirtyFields.code) setValue('code', slugify(e.target.value), { shouldValidate: Boolean(getValues('code')) })
            }}
          />
        </Field>
        <Field label="Tên tiếng Anh" htmlFor="s-name-en" error={errors.nameEn?.message} hint="Hiện khi người xem chọn EN; để trống thì dùng tên tiếng Việt">
          <Input id="s-name-en" placeholder="Vd: Creativity & content" invalid={Boolean(errors.nameEn)} {...register('nameEn')} />
        </Field>
        <Field
          label="Mã"
          htmlFor="s-code"
          required
          error={errors.code?.message}
          hint={isEdit ? 'Đổi mã thì hồ sơ đã chọn kỹ năng này theo mã cũ sẽ không còn khớp' : 'Dùng nội bộ, không dấu'}
        >
          <Input id="s-code" className="mono" invalid={Boolean(errors.code)} {...register('code')} />
        </Field>
        <Field label="Mô tả" htmlFor="s-desc" error={errors.description?.message}>
          <Textarea id="s-desc" rows={2} placeholder="Kỹ năng này đo điều gì" invalid={Boolean(errors.description)} {...register('description')} />
        </Field>
        <FormRow>
          <Field label="Icon" htmlFor="s-icon" hint="Tên icon lucide.dev">
            <Controller
              control={control}
              name="icon"
              render={({ field }) => <Select id="s-icon" value={field.value} onChange={field.onChange} options={ICON_OPTIONS} searchable />}
            />
          </Field>
          <Field label="Màu" htmlFor="s-color" error={errors.color?.message}>
            <div className="skill-color-input">
              <input
                type="color"
                aria-label="Chọn màu"
                value={/^#[0-9a-fA-F]{6}$/.test(color) ? color : '#0038E6'}
                onChange={(e) => setValue('color', e.target.value, { shouldDirty: true, shouldValidate: true })}
              />
              <Input id="s-color" className="mono" invalid={Boolean(errors.color)} {...register('color')} />
            </div>
          </Field>
        </FormRow>
        <Field label="Thứ tự" htmlFor="s-sort" error={errors.sortOrder?.message} hint="Thứ tự các đỉnh trên biểu đồ kỹ năng">
          <Input id="s-sort" type="number" inputMode="numeric" min={0} step={1} style={{ maxWidth: 160 }} invalid={Boolean(errors.sortOrder)} {...register('sortOrder')} />
        </Field>
        <Controller
          control={control}
          name="isActive"
          render={({ field }) => (
            <Switch
              checked={field.value}
              onChange={field.onChange}
              label="Đang dùng"
              description="Tắt để ẩn khỏi bản đồ kỹ năng và form hồ sơ; điểm đã có vẫn giữ nguyên"
            />
          )}
        />
      </FormCard>
    </Drawer>
  )
}
