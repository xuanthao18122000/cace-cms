import clsx from 'clsx'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, Field, Textarea } from '@/components/ui'
import { REJECT_REASON_MAX, REJECT_REASON_MIN, REJECT_REASONS } from './competitionLabels'

const schema = z.object({
  reason: z
    .string()
    .trim()
    .min(REJECT_REASON_MIN, `Lý do tối thiểu ${REJECT_REASON_MIN} ký tự`)
    .max(REJECT_REASON_MAX, `Tối đa ${REJECT_REASON_MAX} ký tự`),
})
type FormValues = z.infer<typeof schema>

/** Hộp thoại từ chối đề xuất: lý do bắt buộc, gửi kèm email cho người đề xuất */
export function RejectCompetitionDialog({
  name,
  busy,
  onClose,
  onSubmit,
}: {
  name: string
  busy: boolean
  onClose(): void
  onSubmit(reason: string): void
}) {
  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { reason: '' } })
  const reason = useWatch({ control, name: 'reason' })
  const length = reason.trim().length

  return (
    <Dialog
      open
      title="Từ chối đề xuất?"
      description={
        <>
          Đề xuất <b>{name}</b> sẽ không hiện trên web. Người gửi nhận email kèm lý do và có thể sửa rồi gửi lại.
        </>
      }
      submitLabel="Từ chối"
      danger
      busy={busy}
      onClose={onClose}
      onSubmit={handleSubmit((v) => onSubmit(v.reason))}
    >
      <Field label="Lý do từ chối" htmlFor="rj-reason" required error={errors.reason?.message}>
        <Textarea
          id="rj-reason"
          rows={4}
          autoFocus
          placeholder="Người gửi sẽ đọc lý do này trong email"
          invalid={Boolean(errors.reason)}
          {...register('reason')}
        />
        <div className={clsx('char-count', length > REJECT_REASON_MAX && 'over')}>
          {length}/{REJECT_REASON_MAX}
        </div>
        <div className="quick-picks" role="group" aria-label="Lý do chọn nhanh">
          {REJECT_REASONS.map((r) => (
            <button
              key={r}
              type="button"
              className={clsx(reason.trim() === r && 'active')}
              onClick={() => setValue('reason', r, { shouldValidate: Boolean(errors.reason), shouldDirty: true })}
            >
              {r}
            </button>
          ))}
        </div>
      </Field>
    </Dialog>
  )
}
