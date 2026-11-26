import clsx from 'clsx'
import { useFieldArray, useWatch, type Control, type FieldErrors, type UseFormRegister, type UseFormSetValue } from 'react-hook-form'
import { ArrowDown, ArrowUp, ListChecks, Plus, RotateCcw, Scale, Trash2 } from 'lucide-react'
import { Button, Card, DataTable, ErrorBox, IconButton, InfoBox, Input, Textarea, type Column } from '@/components/ui'
import {
  CRITERIA_MAX,
  CRITERIA_MIN,
  DEFAULT_CRITERIA,
  emptyCriterion,
  evenWeights,
  sumWeights,
  type CaseFormValues,
  type CriterionValues,
} from './caseForm'

interface Props {
  control: Control<CaseFormValues>
  register: UseFormRegister<CaseFormValues>
  setValue: UseFormSetValue<CaseFormValues>
  errors: FieldErrors<CaseFormValues>
  /** Case đã có bài nộp: chỉ xem */
  locked: boolean
  /** Tiêu chí đã lưu trên máy chủ: bảng chỉ xem hiện bản này, không phải bản đang soạn */
  savedCriteria: CriterionValues[]
  /** Lỗi máy chủ CACE_CRITERIA_INVALID / CACE_CRITERIA_LOCKED */
  serverError: string | null
  disabled?: boolean
}

const readonlyColumns: Column<CriterionValues & { no: number }>[] = [
  {
    key: 'name',
    header: 'Tiêu chí',
    main: true,
    render: (c) => (
      <div className="min-w-0">
        <div className="entity-title">
          {c.no}. {c.name}
        </div>
        {c.description && <div className="entity-sub">{c.description}</div>}
      </div>
    ),
  },
  { key: 'weight', header: 'Trọng số', className: 'is-num', render: (c) => <span className="num">{c.weight}%</span> },
  { key: 'max', header: 'Thang điểm', className: 'is-num', render: (c) => <span className="num">{c.maxScore}</span> },
]

/** Danh sách tiêu chí chấm: thêm/xoá, đổi thứ tự, tổng trọng số phải bằng 100 */
export function CriteriaEditor({ control, register, setValue, errors, locked, savedCriteria, serverError, disabled }: Props) {
  const { fields, append, remove, move, replace } = useFieldArray({ control, name: 'criteria' })
  const values = useWatch({ control, name: 'criteria' })
  const total = sumWeights(locked ? savedCriteria : (values ?? []))
  const totalOk = total === 100
  const listError = errors.criteria?.root?.message ?? errors.criteria?.message

  const indicator = (
    <span className={clsx('weight-total', !totalOk && 'bad')} title="Tổng trọng số phải bằng 100%">
      Tổng {total}%
    </span>
  )

  if (locked) {
    return (
      <Card icon={ListChecks} title="Tiêu chí chấm" subtitle="Người học tự đánh giá và mentor chấm theo các tiêu chí này" actions={indicator}>
        <InfoBox>Đã có bài nộp - không đổi tiêu chí được.</InfoBox>
        <div className="mt16">
          <DataTable columns={readonlyColumns} rows={savedCriteria.map((c, i) => ({ ...c, no: i + 1 }))} rowKey={(c) => String(c.no)} />
        </div>
      </Card>
    )
  }

  const splitEvenly = () => {
    evenWeights(fields.length).forEach((w, i) => setValue(`criteria.${i}.weight`, String(w), { shouldDirty: true, shouldValidate: true }))
  }

  return (
    <Card icon={ListChecks} title="Tiêu chí chấm" subtitle="Người học tự đánh giá và mentor chấm theo các tiêu chí này" actions={indicator}>
      <div className="criteria-list">
        <div className="criteria-head" aria-hidden="true">
          <span>#</span>
          <span>
            Tên tiêu chí <i className="req">*</i>
          </span>
          <span>
            Trọng số <i className="req">*</i>
          </span>
          <span>
            Thang điểm <i className="req">*</i>
          </span>
          <span />
        </div>
        {fields.map((f, i) => {
          const err = errors.criteria?.[i]
          const rowErrors = [
            err?.name && { id: `cr-name-${i}-error`, msg: err.name.message },
            err?.weight && { id: `cr-weight-${i}-error`, msg: err.weight.message },
            err?.maxScore && { id: `cr-max-${i}-error`, msg: err.maxScore.message },
            err?.description && { id: `cr-desc-${i}-error`, msg: err.description.message },
          ].filter(Boolean) as { id: string; msg?: string }[]
          return (
            <div key={f.id} className="criterion">
              <span className="criterion-no" aria-hidden="true">
                {i + 1}
              </span>
              <Input
                id={`cr-name-${i}`}
                aria-label={`Tên tiêu chí ${i + 1}`}
                placeholder="Vd: Logic"
                invalid={Boolean(err?.name)}
                disabled={disabled}
                {...register(`criteria.${i}.name`)}
              />
              <Input
                id={`cr-weight-${i}`}
                aria-label={`Trọng số tiêu chí ${i + 1}`}
                type="number"
                inputMode="numeric"
                min={1}
                max={100}
                suffix="%"
                invalid={Boolean(err?.weight)}
                disabled={disabled}
                {...register(`criteria.${i}.weight`)}
              />
              <Input
                id={`cr-max-${i}`}
                aria-label={`Thang điểm tiêu chí ${i + 1}`}
                type="number"
                inputMode="numeric"
                min={1}
                max={100}
                invalid={Boolean(err?.maxScore)}
                disabled={disabled}
                {...register(`criteria.${i}.maxScore`)}
              />
              <div className="criterion-tools">
                <IconButton icon={ArrowUp} label="Chuyển lên" plain disabled={disabled || i === 0} onClick={() => move(i, i - 1)} />
                <IconButton icon={ArrowDown} label="Chuyển xuống" plain disabled={disabled || i === fields.length - 1} onClick={() => move(i, i + 1)} />
                <IconButton icon={Trash2} label="Xoá tiêu chí" plain danger disabled={disabled || fields.length <= CRITERIA_MIN} onClick={() => remove(i)} />
              </div>
              <Textarea
                id={`cr-desc-${i}`}
                aria-label={`Mô tả tiêu chí ${i + 1}`}
                className="criterion-desc"
                rows={1}
                placeholder="Mô tả: người chấm nhìn vào đâu để cho điểm (không bắt buộc)"
                invalid={Boolean(err?.description)}
                disabled={disabled}
                {...register(`criteria.${i}.description`)}
              />
              {rowErrors.length > 0 && (
                <div className="criterion-errors">
                  {rowErrors.map((e) => (
                    <div key={e.id} id={e.id} className="field-error">
                      {e.msg}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="criteria-actions">
        <Button size="sm" icon={Plus} disabled={disabled || fields.length >= CRITERIA_MAX} onClick={() => append(emptyCriterion())}>
          Thêm tiêu chí
        </Button>
        <Button size="sm" icon={Scale} disabled={disabled} onClick={splitEvenly}>
          Chia đều trọng số
        </Button>
        <Button size="sm" variant="ghost" icon={RotateCcw} disabled={disabled} onClick={() => replace(DEFAULT_CRITERIA)}>
          Dùng 4 tiêu chí mặc định
        </Button>
      </div>

      {(serverError || listError) && (
        <div className="criteria-error">
          <ErrorBox>{serverError || listError}</ErrorBox>
        </div>
      )}
    </Card>
  )
}
