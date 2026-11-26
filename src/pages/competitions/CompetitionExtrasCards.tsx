import { Controller, useFieldArray, type Control, type FieldErrors, type UseFormRegister } from 'react-hook-form'
import { Flag, Gift, Plus, Tags, Trash2, UserRoundCog } from 'lucide-react'
import { Button, Card, DateTimePicker, Field, FormRow, IconButton, Input, Select, Textarea } from '@/components/ui'
import { emptyRound, type CompetitionFormValues } from './competitionForm'
import {
  AUDIENCE_OPTIONS,
  CONTACT_ROLES,
  FORMAT_OPTIONS,
  formatVnd,
  PARTICIPATION_OPTIONS,
  ROUND_FORMATS,
  SCALE_OPTIONS,
} from './competitionLabels'

interface Props {
  control: Control<CompetitionFormValues>
  register: UseFormRegister<CompetitionFormValues>
  errors: FieldErrors<CompetitionFormValues>
  /** Tổng giải để hiện gợi ý */
  prizeTotal: number | null
}

const ROUND_FORMAT_OPTIONS = ROUND_FORMATS.map((f) => ({ value: f, label: f }))
const ROLE_OPTIONS = CONTACT_ROLES.map((r) => ({ value: r, label: r }))

/** Các khối mới ở trang sửa cuộc thi: phân loại (bộ lọc web), vòng thi, giải thưởng, liên hệ BTC */
export function CompetitionExtrasCards({ control, register, errors, prizeTotal }: Props) {
  const rounds = useFieldArray({ control, name: 'rounds' })

  return (
    <>
      <Card icon={Tags} title="Phân loại" subtitle="Dùng cho bộ lọc ở trang Cuộc thi trên web">
        <FormRow>
          <Field label="Đối tượng" htmlFor="m-audience" error={errors.audience?.message}>
            <Controller
              control={control}
              name="audience"
              render={({ field }) => <Select id="m-audience" value={field.value} onChange={field.onChange} options={AUDIENCE_OPTIONS} />}
            />
          </Field>
          <Field label="Hình thức tổ chức" htmlFor="m-format" error={errors.format?.message}>
            <Controller
              control={control}
              name="format"
              render={({ field }) => <Select id="m-format" value={field.value} onChange={field.onChange} options={FORMAT_OPTIONS} />}
            />
          </Field>
        </FormRow>
        <FormRow>
          <Field label="Hình thức tham gia" htmlFor="m-participation" error={errors.participation?.message} hint="Nhóm / cả hai: web hiện nút Tìm đồng đội">
            <Controller
              control={control}
              name="participation"
              render={({ field }) => <Select id="m-participation" value={field.value} onChange={field.onChange} options={PARTICIPATION_OPTIONS} />}
            />
          </Field>
          <Field label="Quy mô" htmlFor="m-scale" error={errors.scale?.message}>
            <Controller
              control={control}
              name="scale"
              render={({ field }) => <Select id="m-scale" value={field.value} onChange={field.onChange} options={SCALE_OPTIONS} />}
            />
          </Field>
        </FormRow>
      </Card>

      <Card
        icon={Flag}
        title="Các vòng thi"
        subtitle="Hiện ở tab Timeline trên trang chi tiết"
        actions={
          rounds.fields.length < 10 ? (
            <Button size="sm" icon={Plus} onClick={() => rounds.append({ ...emptyRound })}>
              Thêm vòng thi
            </Button>
          ) : undefined
        }
      >
        {rounds.fields.length === 0 ? (
          <div className="field-hint">Chưa có vòng thi nào.</div>
        ) : (
          rounds.fields.map((r, i) => {
            const e = errors.rounds?.[i]
            return (
              <div key={r.id} className="form-card">
                <div className="form-card-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Vòng {i + 1}</span>
                  <IconButton icon={Trash2} label={`Xoá vòng ${i + 1}`} danger onClick={() => rounds.remove(i)} />
                </div>
                <FormRow>
                  <Field label="Tên vòng thi" htmlFor={`m-round-${i}-name`} required error={e?.name?.message}>
                    <Input id={`m-round-${i}-name`} placeholder="Vd: Vòng 1: Case Analysis" invalid={Boolean(e?.name)} {...register(`rounds.${i}.name`)} />
                  </Field>
                  <Field label="Hình thức" htmlFor={`m-round-${i}-format`} required error={e?.format?.message}>
                    <Controller
                      control={control}
                      name={`rounds.${i}.format`}
                      render={({ field }) => (
                        <Select
                          id={`m-round-${i}-format`}
                          value={field.value}
                          onChange={field.onChange}
                          options={
                            field.value && !ROUND_FORMATS.includes(field.value)
                              ? [{ value: field.value, label: field.value }, ...ROUND_FORMAT_OPTIONS]
                              : ROUND_FORMAT_OPTIONS
                          }
                          invalid={Boolean(e?.format)}
                        />
                      )}
                    />
                  </Field>
                </FormRow>
                <FormRow>
                  <Field label="Bắt đầu" htmlFor={`m-round-${i}-start`} required error={e?.startDate?.message}>
                    <Controller
                      control={control}
                      name={`rounds.${i}.startDate`}
                      render={({ field }) => (
                        <DateTimePicker id={`m-round-${i}-start`} value={field.value} onChange={field.onChange} onBlur={field.onBlur} invalid={Boolean(e?.startDate)} defaultTime="08:00" />
                      )}
                    />
                  </Field>
                  <Field label="Kết thúc" htmlFor={`m-round-${i}-end`} required error={e?.endDate?.message}>
                    <Controller
                      control={control}
                      name={`rounds.${i}.endDate`}
                      render={({ field }) => (
                        <DateTimePicker id={`m-round-${i}-end`} value={field.value} onChange={field.onChange} onBlur={field.onBlur} invalid={Boolean(e?.endDate)} defaultTime="23:59" />
                      )}
                    />
                  </Field>
                </FormRow>
                <Field label="Mô tả" htmlFor={`m-round-${i}-desc`} error={e?.description?.message}>
                  <Textarea id={`m-round-${i}-desc`} rows={2} placeholder="Vd: Phân tích case và đề xuất giải pháp." {...register(`rounds.${i}.description`)} />
                </Field>
              </div>
            )
          })
        )}
        {errors.rounds?.message && <div className="field-error">{errors.rounds.message}</div>}
      </Card>

      <Card icon={Gift} title="Giải thưởng" subtitle="Cơ cấu 3 giải (VND). Bỏ trống cả ba nếu chưa có.">
        <FormRow>
          <Field label="Giải Nhất" htmlFor="m-prize-1" error={errors.prizeFirst?.message}>
            <Input id="m-prize-1" inputMode="numeric" suffix="VND" placeholder="30000000" invalid={Boolean(errors.prizeFirst)} {...register('prizeFirst')} />
          </Field>
          <Field label="Giải Nhì" htmlFor="m-prize-2" error={errors.prizeSecond?.message}>
            <Input id="m-prize-2" inputMode="numeric" suffix="VND" placeholder="20000000" invalid={Boolean(errors.prizeSecond)} {...register('prizeSecond')} />
          </Field>
        </FormRow>
        <FormRow>
          <Field label="Giải Ba" htmlFor="m-prize-3" error={errors.prizeThird?.message}>
            <Input id="m-prize-3" inputMode="numeric" suffix="VND" placeholder="10000000" invalid={Boolean(errors.prizeThird)} {...register('prizeThird')} />
          </Field>
          <Field label="Ghi chú giải thưởng" htmlFor="m-prize-note" error={errors.prizeNote?.message} hint={prizeTotal ? `Tổng: ${formatVnd(prizeTotal)}` : undefined}>
            <Input id="m-prize-note" placeholder="Vd: Kèm giải phụ, hiện vật" invalid={Boolean(errors.prizeNote)} {...register('prizeNote')} />
          </Field>
        </FormRow>
      </Card>

      <Card icon={UserRoundCog} title="Liên hệ ban tổ chức" subtitle="Hiện cho thí sinh và đối tác khi cần liên hệ">
        <FormRow>
          <Field label="Họ tên người liên hệ" htmlFor="m-contact-name" error={errors.contactName?.message}>
            <Input id="m-contact-name" invalid={Boolean(errors.contactName)} {...register('contactName')} />
          </Field>
          <Field label="Chức vụ" htmlFor="m-contact-role" error={errors.contactRole?.message}>
            <Controller
              control={control}
              name="contactRole"
              render={({ field }) => (
                <Select
                  id="m-contact-role"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Chọn chức vụ"
                  options={field.value && !CONTACT_ROLES.includes(field.value) ? [{ value: field.value, label: field.value }, ...ROLE_OPTIONS] : ROLE_OPTIONS}
                  invalid={Boolean(errors.contactRole)}
                />
              )}
            />
          </Field>
        </FormRow>
        <FormRow>
          <Field label="Số điện thoại" htmlFor="m-contact-phone" error={errors.contactPhone?.message}>
            <Input id="m-contact-phone" type="tel" invalid={Boolean(errors.contactPhone)} {...register('contactPhone')} />
          </Field>
          <Field label="Email liên hệ" htmlFor="m-contact-email" error={errors.contactEmail?.message}>
            <Input id="m-contact-email" type="email" invalid={Boolean(errors.contactEmail)} {...register('contactEmail')} />
          </Field>
        </FormRow>
        <Field label="Địa chỉ BTC" htmlFor="m-contact-address" error={errors.contactAddress?.message}>
          <Input id="m-contact-address" invalid={Boolean(errors.contactAddress)} {...register('contactAddress')} />
        </Field>
        <Field label="Link fanpage" htmlFor="m-fanpage" error={errors.fanpageUrl?.message} hint="http:// hoặc https://">
          <Input id="m-fanpage" type="url" inputMode="url" spellCheck={false} placeholder="https://facebook.com/..." invalid={Boolean(errors.fanpageUrl)} {...register('fanpageUrl')} />
        </Field>
      </Card>
    </>
  )
}
