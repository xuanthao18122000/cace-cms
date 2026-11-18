import { useMemo, useState } from 'react'
import clsx from 'clsx'
import { format, parseISO } from 'date-fns'
import { useForm, useWatch, type Path } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useBlocker } from 'react-router-dom'
import { Bot, Check, ClipboardCheck, Save, Send } from 'lucide-react'
import { ApiError, errorMessage, submissionApi } from '@/api'
import { Badge, Button, Card, ConfirmDialog, ErrorBox, Field, Icon, InfoBox, Input, Textarea } from '@/components/ui'
import { useToast } from '@/contexts/toast'
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges'
import { applyServerErrors } from '@/lib/forms'
import { queryKeys } from '@/lib/queryClient'
import type { AdminSubmissionDetail, Criterion } from '@/types'
import { formatGrade, formatScore } from './submissionLabels'
import { computeTotal, FEEDBACK_MAX, gradeSchema, parseScore, toGradeValues, type GradeFormValues } from './gradeForm'

/** dd/MM/yyyy HH:mm theo giờ máy */
const formatStamp = (iso: string | null | undefined) => (iso ? format(parseISO(iso), 'dd/MM/yyyy HH:mm') : '—')

interface Props {
  s: AdminSubmissionDetail
  /** Tiêu chí đã sắp theo sortOrder */
  criteria: Criterion[]
}

/** Khung chấm bài thủ công: điểm từng tiêu chí, nhận xét, lưu nháp hoặc trả kết quả */
export function GradePanel({ s, criteria }: Props) {
  const toast = useToast()
  const queryClient = useQueryClient()
  const schema = useMemo(() => gradeSchema(criteria), [criteria])
  const [confirm, setConfirm] = useState<'publish' | 'unpublish' | null>(null)

  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isDirty },
  } = useForm<GradeFormValues>({ resolver: zodResolver(schema), defaultValues: toGradeValues(s, criteria) })

  const [items, feedback] = useWatch({ control, name: ['items', 'feedback'] })
  const total = computeTotal(criteria, items)

  const serverFields = useMemo(
    () => ['items', 'feedback', ...criteria.flatMap((_, i) => [`items.${i}.score`, `items.${i}.comment`])] as Path<GradeFormValues>[],
    [criteria],
  )

  const mutation = useMutation({
    mutationFn: ({ v, publish }: { v: GradeFormValues; publish: boolean }) =>
      submissionApi.grade(s.id, {
        items: v.items.map((it) => ({ criterionId: it.criterionId, score: parseScore(it.score) ?? 0, comment: it.comment.trim() || null })),
        // Giữ xuống dòng; bỏ khoảng trắng thừa hai đầu
        feedback: v.feedback.trim() || null,
        publish,
      }),
    onSuccess: (saved, { publish }) => {
      queryClient.setQueryData(queryKeys.submission(saved.id), saved)
      // Danh sách (điểm, trạng thái) và thống kê đổi theo
      queryClient.invalidateQueries({ queryKey: queryKeys.submissions })
      queryClient.invalidateQueries({ queryKey: queryKeys.stats })
      reset(toGradeValues(saved, criteria))
      setConfirm(null)
      toast.success(publish ? 'Đã trả kết quả cho người học' : 'Đã lưu bản nháp chấm bài')
    },
    onError: (err) => {
      setConfirm(null)
      if (err instanceof ApiError && err.code === 'CACE_SUBMISSION_LOCKED') {
        // Tải lại để cập nhật canGrade / hạn rút bài
        queryClient.invalidateQueries({ queryKey: queryKeys.submission(s.id) })
        return toast.error(errorMessage(err))
      }
      if (!applyServerErrors(err, setError, serverFields)) toast.error(errorMessage(err))
    },
  })

  const invalid = () => toast.error('Kiểm tra lại các trường được đánh dấu đỏ')
  const saveDraft = handleSubmit((v) => mutation.mutate({ v, publish: false }), invalid)
  const publish = handleSubmit((v) => mutation.mutate({ v, publish: true }), invalid)
  // Kiểm tra form trước, hợp lệ mới hỏi xác nhận
  const askPublish = handleSubmit(() => setConfirm('publish'), invalid)
  const askDraft = handleSubmit((v) => (s.status === 'graded' ? setConfirm('unpublish') : mutation.mutate({ v, publish: false })), invalid)

  // Cảnh báo khi rời trang lúc còn điểm chưa lưu
  const blocker = useBlocker(({ currentLocation, nextLocation }) => isDirty && currentLocation.pathname !== nextLocation.pathname)
  useUnsavedChanges(isDirty)

  const grade = s.grade
  const released = s.status === 'graded' && Boolean(grade?.gradedAt)
  const locked = !s.canGrade
  const disabled = locked || mutation.isPending
  const itemsError = errors.items?.message ?? errors.items?.root?.message
  const feedbackLength = feedback.trim().length

  const headerActions = (
    <>
      {/* TODO(AI chấm bài): hiển thị gợi ý điểm AI để mentor duyệt */}
      {grade?.source === 'ai' && (
        <Badge tone="purple" icon={Bot}>
          AI chấm
        </Badge>
      )}
      {isDirty && <span className="save-state dirty">Chưa lưu</span>}
    </>
  )

  return (
    <Card icon={ClipboardCheck} title="Chấm bài" subtitle="Điểm từng tiêu chí theo thang của case" actions={headerActions}>
      {locked ? (
        <InfoBox>
          {s.status === 'draft' ? (
            'Bài còn là nháp — người học chưa nộp nên chưa chấm được.'
          ) : (
            <>
              Người học vẫn được rút bài tới <b>{formatStamp(s.editableUntil)}</b>. Có thể chấm sau thời điểm này.
            </>
          )}
        </InfoBox>
      ) : grade && released ? (
        <div className="grade-status">
          <span className="check-on">
            <Icon icon={Check} />
          </span>
          <span>
            Đã trả kết quả lúc {formatStamp(grade.gradedAt)}
            {grade.grader && <> bởi {grade.grader.fullName}</>}
          </span>
        </div>
      ) : grade ? (
        <InfoBox>
          Bản nháp — người học chưa thấy
          {grade.grader && <> · {grade.grader.fullName}</>}
        </InfoBox>
      ) : null}

      <div className="criteria-list">
        {criteria.map((c, i) => {
          const err = errors.items?.[i]
          const self = s.selfAssessment?.find((x) => x.criterionId === c.id)
          return (
            <div key={c.id} className="criterion grade-criterion">
              <div className="criterion-body">
                <div className="grade-head">
                  <span className="entity-title">
                    {i + 1}. {c.name}
                  </span>
                  <span className="mo num">{c.weight}%</span>
                </div>
                {c.description && <div className="field-hint grade-hint">{c.description}</div>}
                <Field label="Điểm" htmlFor={`gr-score-${i}`} required error={err?.score?.message}>
                  <Input
                    id={`gr-score-${i}`}
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={c.maxScore}
                    step={0.5}
                    suffix={`/ ${c.maxScore}`}
                    placeholder="0"
                    invalid={Boolean(err?.score)}
                    disabled={disabled}
                    {...register(`items.${i}.score`)}
                  />
                </Field>
                {self && (
                  <div className="grade-self">
                    Người học tự chấm{' '}
                    <b className="num">
                      {formatScore(self.score)}/{c.maxScore}
                    </b>
                    {self.note && <> — {self.note}</>}
                  </div>
                )}
                <Field label="Nhận xét" htmlFor={`gr-comment-${i}`} error={err?.comment?.message}>
                  <Textarea
                    id={`gr-comment-${i}`}
                    rows={2}
                    placeholder="Không bắt buộc"
                    invalid={Boolean(err?.comment)}
                    disabled={disabled}
                    {...register(`items.${i}.comment`)}
                  />
                </Field>
              </div>
            </div>
          )
        })}
      </div>

      {itemsError && (
        <div className="criteria-error">
          <ErrorBox>{itemsError}</ErrorBox>
        </div>
      )}

      <div className="mt16">
        <Field label="Nhận xét chung" htmlFor="gr-feedback" error={errors.feedback?.message}>
          <Textarea
            id="gr-feedback"
            rows={5}
            placeholder="Điểm mạnh, điểm cần cải thiện, gợi ý cho lần sau"
            invalid={Boolean(errors.feedback)}
            disabled={disabled}
            {...register('feedback')}
          />
          <div className={clsx('char-count', feedbackLength > FEEDBACK_MAX && 'over')}>
            {feedbackLength}/{FEEDBACK_MAX}
          </div>
        </Field>
      </div>

      <div className="score-total" title="Σ (điểm / thang) × trọng số, quy về thang 10">
        Tổng theo trọng số <strong>{total === null ? '—' : formatGrade(total)}</strong>/10
      </div>

      <div className="grade-actions">
        <Button icon={Save} disabled={disabled} loading={mutation.isPending && !mutation.variables?.publish} onClick={askDraft}>
          Lưu nháp
        </Button>
        <Button variant="primary" icon={Send} disabled={disabled} loading={mutation.isPending && mutation.variables?.publish} onClick={askPublish}>
          Trả kết quả
        </Button>
      </div>

      <ConfirmDialog
        open={confirm === 'publish'}
        title="Trả kết quả cho người học?"
        message={
          released
            ? 'Người học sẽ thấy điểm và nhận xét đã cập nhật.'
            : 'Người học sẽ thấy điểm và nhận email thông báo.'
        }
        confirmLabel="Trả kết quả"
        busy={mutation.isPending}
        onConfirm={() => publish()}
        onClose={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === 'unpublish'}
        title="Thu hồi kết quả để lưu nháp?"
        message="Bài đã trả kết quả. Lưu nháp sẽ ẩn điểm khỏi người học và chuyển bài về Đang chấm cho tới khi trả kết quả lại."
        confirmLabel="Lưu nháp"
        danger
        busy={mutation.isPending}
        onConfirm={() => saveDraft()}
        onClose={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={blocker.state === 'blocked'}
        title="Rời trang khi chưa lưu?"
        message="Điểm và nhận xét chưa lưu của bài này sẽ mất."
        confirmLabel="Rời trang"
        cancelLabel="Ở lại"
        danger
        onConfirm={() => blocker.proceed?.()}
        onClose={() => blocker.reset?.()}
      />
    </Card>
  )
}
