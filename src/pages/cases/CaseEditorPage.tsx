import { useEffect, useRef, useState, type FormEvent } from 'react'
import clsx from 'clsx'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useBlocker, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, BookOpenText, Check, ExternalLink, FileText, Image as ImageIcon, Lightbulb, SearchX, Send, Tags, Timer, Trash2 } from 'lucide-react'
import { ApiError, caseApi, errorMessage } from '@/api'
import { RichTextEditor } from '@/components/editor/RichTextEditor'
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyHero,
  CollapsibleCard,
  ErrorState,
  Field,
  FormRow,
  Input,
  LinkButton,
  Loading,
  OptionBox,
  PageHeader,
  Segmented,
  Select,
  Switch,
  Textarea,
  type SelectOption,
} from '@/components/ui'
import { useToast } from '@/contexts/toast'
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges'
import { useTaxonomiesQuery } from '@/hooks/queries'
import { applyServerErrors } from '@/lib/forms'
import { queryKeys } from '@/lib/queryClient'
import type { AdminCase, CaseInput, TaxonomyRef, TaxonomyType } from '@/types'
import { formatDate, formatDateTime, formatNumber, formatRelative } from '@/utils/format'
import { toSlug } from '@/utils/text'
import { CaseStatusBadge } from './caseBits'
import {
  CASE_FIELDS,
  CASE_SERVER_ALIAS,
  caseSchema,
  DEFAULT_MAX_ATTEMPTS,
  isValidMaxAttempts,
  sameCriteria,
  SUMMARY_MAX,
  toCaseValues,
  toCriteriaInput,
  type CaseFormValues,
} from './caseForm'
import { DIFFICULTY_OPTIONS, STATUS_LABEL } from './caseLabels'
import { CoverUpload } from './CoverUpload'
import { CriteriaEditor } from './CriteriaEditor'
import { PdfUpload } from './PdfUpload'
import { useCaseActions } from './useCaseActions'

const EMPTY_MESSAGE = 'Cần nội dung đề hoặc file PDF trước khi xuất bản'
const CRITERIA_CODES = new Set(['CACE_CRITERIA_INVALID', 'CACE_CRITERIA_LOCKED'])

type FormValues = CaseFormValues

const STATUS_SELECT: SelectOption[] = [
  { value: 'draft', label: STATUS_LABEL.draft, description: 'Chỉ thấy trong trang quản trị' },
  { value: 'published', label: STATUS_LABEL.published, description: 'Hiện ở mục Rèn luyện trên web' },
  { value: 'hidden', label: STATUS_LABEL.hidden, description: 'Gỡ khỏi web, giữ nguyên dữ liệu' },
]

export function CaseEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const detail = useQuery({ queryKey: queryKeys.case(id ?? ''), queryFn: () => caseApi.get(id ?? ''), enabled: Boolean(id) })

  if (id && detail.isPending) return <Loading />
  // Đã có dữ liệu mà tải lại nền lỗi: giữ form (và nội dung đang soạn), chỉ báo lỗi khi chưa có gì
  if (id && detail.isError && !detail.data) {
    const notFound = detail.error instanceof ApiError && detail.error.status === 404
    return (
      <Card>
        {notFound ? (
          <EmptyHero
            icon={SearchX}
            tone="gray"
            title="Không tìm thấy case"
            message="Case có thể đã bị xoá."
            actions={
              <Button icon={ArrowLeft} onClick={() => navigate('/cases')}>
                Về thư viện case
              </Button>
            }
          />
        ) : (
          <ErrorState error={detail.error} onRetry={() => detail.refetch()} />
        )}
      </Card>
    )
  }
  // Gắn key theo id: tạo xong chuyển sang /cases/:id thì form nạp lại từ dữ liệu máy chủ
  return <CaseForm key={id ?? 'new'} item={detail.data ?? null} />
}

/** Lựa chọn danh mục: mục đang dùng + mục đang ẩn mà case đã gắn */
function useTaxonomyOptions(type: TaxonomyType, current: TaxonomyRef | null | undefined): SelectOption[] {
  const list = useTaxonomiesQuery(type).data ?? []
  const options: SelectOption[] = [{ value: '', label: 'Không chọn' }]
  for (const t of list) {
    if (t.isActive || t.id === current?.id) options.push({ value: t.id, label: t.name, description: t.isActive ? undefined : 'Đang ẩn' })
  }
  if (current && !list.some((t) => t.id === current.id)) options.push({ value: current.id, label: current.name })
  return options
}

function CaseForm({ item }: { item: AdminCase | null }) {
  const toast = useToast()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isNew = item === null
  // Đã có bài nộp: tiêu chí chỉ xem, không gửi lên
  const criteriaLocked = (item?.submissionCount ?? 0) > 0
  const [criteriaError, setCriteriaError] = useState<string | null>(null)
  // Cho phép rời trang không hỏi (vừa tạo xong, vừa xoá)
  const allowLeave = useRef(false)

  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    reset,
    getValues,
    getFieldState,
    formState: { errors, isDirty },
  } = useForm<FormValues>({ resolver: zodResolver(caseSchema), defaultValues: toCaseValues(item) })

  const [summary, status, slug, unlimitedAttempts] = useWatch({ control, name: ['summary', 'status', 'slug', 'unlimitedAttempts'] })

  const fieldOptions = useTaxonomyOptions('field', item?.field)
  const industryOptions = useTaxonomyOptions('industry', item?.industry)
  const levelOptions = useTaxonomyOptions('level', item?.level)

  const { actions, dialogs } = useCaseActions({
    onDeleted: () => {
      allowLeave.current = true
      navigate('/cases', { replace: true })
    },
  })

  const mutation = useMutation({
    mutationFn: (v: FormValues) => {
      const body: CaseInput = {
        title: v.title,
        summary: v.summary,
        content: v.content,
        company: v.company || null,
        coverUrl: v.coverUrl,
        pdfUrl: v.pdf?.url ?? null,
        pdfName: v.pdf?.name ?? null,
        pdfSize: v.pdf?.size ?? null,
        difficulty: v.difficulty,
        estimatedMinutes: v.estimatedMinutes ? Number(v.estimatedMinutes) : null,
        fieldId: v.fieldId || null,
        industryId: v.industryId || null,
        levelId: v.levelId || null,
        status: v.status,
        isFeatured: v.isFeatured,
        maxAttempts: v.unlimitedAttempts ? null : Number(v.maxAttempts),
        editWindowMinutes: Number(v.editWindowMinutes),
        solutionContent: v.solutionContent,
        solutionPdfUrl: v.solutionPdf?.url ?? null,
        solutionPdfName: v.solutionPdf?.name ?? null,
        // Chỉ gửi tiêu chí khi đã sửa: gửi lại y nguyên vẫn bị CACE_CRITERIA_LOCKED nếu case đã có bài nộp
        ...(!criteriaLocked && !sameCriteria(v.criteria, toCaseValues(item).criteria) ? { criteria: toCriteriaInput(v.criteria) } : {}),
        // Bỏ trống: máy chủ sinh từ tiêu đề (khi tạo) hoặc giữ đường dẫn cũ (khi sửa)
        ...(v.slug ? { slug: v.slug } : {}),
      }
      return isNew ? caseApi.create(body) : caseApi.update(item.id, body)
    },
    onMutate: () => setCriteriaError(null),
    onSuccess: (saved, v) => {
      queryClient.setQueryData(queryKeys.case(saved.id), saved)
      queryClient.invalidateQueries({ queryKey: queryKeys.cases })
      // Số case của từng danh mục đổi theo
      queryClient.invalidateQueries({ queryKey: queryKeys.taxonomies })
      // Tiêu đề case, tiêu chí, dẫn giải hiện trong trang bài nộp
      queryClient.invalidateQueries({ queryKey: queryKeys.submissions })
      // Giữ HTML đang soạn (máy chủ có thể chuẩn hoá lại) để form không bị coi là đã sửa
      reset(toCaseValues(saved, { content: v.content, solutionContent: v.solutionContent }))
      toast.success(isNew ? `Đã tạo case ${saved.title}` : 'Đã lưu thay đổi')
      if (isNew) {
        allowLeave.current = true
        navigate(`/cases/${saved.id}`, { replace: true })
      }
    },
    onError: (err) => {
      if (err instanceof ApiError && err.code === 'CACE_CASE_EMPTY') return toast.error(EMPTY_MESSAGE)
      if (err instanceof ApiError && (CRITERIA_CODES.has(err.code) || Object.keys(err.fieldErrors).some((k) => k.startsWith('criteria')))) {
        // Lỗi theo từng ô (vd criteria.0.name) gắn thẳng vào ô đó
        const fieldEntries = Object.entries(err.fieldErrors).filter(([k]) => /^criteria\.\d+\.(name|description|weight|maxScore)$/.test(k))
        fieldEntries.forEach(([k, m]) => setError(k as `criteria.${number}.name`, { type: 'server', message: m }))
        const message = fieldEntries[0]?.[1] ?? errorMessage(err)
        setCriteriaError(message)
        toast.error(message)
        // Vừa có người nộp bài: tải lại để chuyển tiêu chí sang chế độ chỉ xem
        if (err.code === 'CACE_CRITERIA_LOCKED' && item) queryClient.invalidateQueries({ queryKey: queryKeys.case(item.id) })
        // Cùng phản hồi có thể kèm lỗi các ô khác (vd title, slug): gắn luôn
        applyServerErrors(err, setError, CASE_FIELDS, CASE_SERVER_ALIAS)
        return
      }
      if (!applyServerErrors(err, setError, CASE_FIELDS, CASE_SERVER_ALIAS)) toast.error(errorMessage(err))
    },
  })

  // Đang lưu (kể cả lúc validate chưa xong): bỏ qua lần gọi sau, vd giữ Ctrl+S hoặc bấm liên tiếp
  const saving = useRef(false)
  const submit = handleSubmit(
    async (v) => {
      if (v.status === 'published' && !v.content && !v.pdf) return void toast.error(EMPTY_MESSAGE)
      // Lỗi đã xử lý ở onError
      await mutation.mutateAsync(v).catch(() => undefined)
    },
    () => toast.error('Kiểm tra lại các trường được đánh dấu đỏ'),
  )
  const save = () => {
    if (saving.current || mutation.isPending) return
    saving.current = true
    void submit().finally(() => {
      saving.current = false
    })
  }
  const saveRef = useRef(save)
  useEffect(() => {
    saveRef.current = save
  })

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // Bỏ qua submit nổi bọt từ hộp thoại vẽ qua portal (vd hộp chèn liên kết)
    if (e.target !== e.currentTarget) return
    save()
  }

  // Ctrl/Cmd + S để lưu
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        saveRef.current()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  // Cảnh báo khi rời trang lúc còn thay đổi chưa lưu
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => isDirty && !allowLeave.current && currentLocation.pathname !== nextLocation.pathname,
  )
  useUnsavedChanges(isDirty)

  const busy = mutation.isPending
  const savedPublished = item?.status === 'published'
  const summaryLength = summary.trim().length
  const slugField = register('slug')

  const saveInfo = isDirty ? (
    <span className="save-state dirty">Có thay đổi chưa lưu</span>
  ) : item ? (
    <span className="save-state" title={formatDateTime(item.updatedAt)}>
      Đã lưu {formatRelative(item.updatedAt)}
    </span>
  ) : (
    <span className="save-state">Chưa lưu</span>
  )

  const saveButton = (
    <Button variant="primary" type="submit" icon={Check} loading={busy}>
      {isNew ? 'Tạo case' : 'Lưu'}
    </Button>
  )

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Nội dung' }, { label: 'Thư viện case', to: '/cases' }]}
        title={
          isNew ? (
            'Thêm case'
          ) : (
            <>
              {item.title} <CaseStatusBadge status={item.status} />
            </>
          )
        }
        subtitle={isNew ? 'Soạn đề, phân loại và xuất bản lên mục Rèn luyện' : <span className="mono">/ren-luyen/{item.slug}</span>}
        actions={
          savedPublished && (
            <Button icon={ExternalLink} onClick={() => actions.openOnWeb(item)}>
              Xem trên web
            </Button>
          )
        }
      />

      <form className="case-editor" onSubmit={onSubmit} noValidate autoComplete="off">
        <div className="case-main">
          <Card icon={FileText} title="Thông tin chung">
            <Field label="Tiêu đề" htmlFor="c-title" required error={errors.title?.message}>
              <Input
                id="c-title"
                className="input-lg"
                placeholder="Vd: VinFast USA Go-To-Market"
                invalid={Boolean(errors.title)}
                {...register('title', {
                  onChange: (e) => {
                    // Đường dẫn tự sinh theo tiêu đề cho tới khi người dùng tự sửa (chỉ khi tạo mới; xoá trắng thì tự sinh lại)
                    if (isNew && !getFieldState('slug').isDirty) setValue('slug', toSlug(e.target.value), { shouldValidate: Boolean(errors.slug) })
                  },
                })}
              />
            </Field>
            <Field
              label="Đường dẫn"
              htmlFor="c-slug"
              error={errors.slug?.message}
              hint={
                <>
                  {isNew ? 'Tự tạo theo tiêu đề, có thể sửa. ' : 'Đổi đường dẫn sẽ làm link cũ không mở được. '}
                  <span className="mono">/ren-luyen/{slug || '…'}</span>
                </>
              }
            >
              <Input
                id="c-slug"
                className="mono"
                spellCheck={false}
                placeholder="vinfast-usa-go-to-market"
                invalid={Boolean(errors.slug)}
                {...slugField}
                onChange={(e) => {
                  e.target.value = e.target.value.toLowerCase().replace(/\s+/g, '-')
                  return slugField.onChange(e)
                }}
              />
            </Field>
            <Field label="Tóm tắt" htmlFor="c-summary" required error={errors.summary?.message}>
              <Textarea
                id="c-summary"
                rows={3}
                placeholder="Hai, ba câu giới thiệu bối cảnh và câu hỏi chính của case"
                invalid={Boolean(errors.summary)}
                {...register('summary')}
              />
              <div className={clsx('char-count', summaryLength > SUMMARY_MAX && 'over')}>
                {summaryLength}/{SUMMARY_MAX}
              </div>
            </Field>
          </Card>

          <Card icon={BookOpenText} title="Nội dung đề" subtitle="Bối cảnh, số liệu, yêu cầu. Viết trực tiếp, tải PDF, hoặc cả hai.">
            <Controller
              control={control}
              name="content"
              render={({ field }) => (
                <RichTextEditor
                  id="c-content"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Viết nội dung đề… (hoặc chỉ tải đề PDF bên dưới)"
                  invalid={Boolean(errors.content)}
                  disabled={busy}
                />
              )}
            />
            {errors.content && <div className="field-error">{errors.content.message}</div>}
            <div className="content-pdf">
              <div className="content-pdf-label">Đề PDF</div>
              <Controller
                control={control}
                name="pdf"
                render={({ field }) => <PdfUpload value={field.value} onChange={(v) => field.onChange(v)} disabled={busy} />}
              />
              {errors.pdf && <div className="field-error">{errors.pdf.message}</div>}
            </div>
          </Card>

          <CriteriaEditor
            control={control}
            register={register}
            setValue={setValue}
            errors={errors}
            locked={criteriaLocked}
            savedCriteria={toCaseValues(item).criteria}
            serverError={criteriaError}
            disabled={busy}
          />

          <CollapsibleCard
            icon={Lightbulb}
            title="Dẫn giải mẫu"
            subtitle="Người học chỉ thấy sau khi bài nộp của họ đã khoá (hết thời gian rút bài)"
            defaultOpen={Boolean(item?.solutionContent || item?.solutionPdfUrl)}
            forceOpen={Boolean(errors.solutionContent || errors.solutionPdf)}
          >
            <Controller
              control={control}
              name="solutionContent"
              render={({ field }) => (
                <RichTextEditor
                  id="c-solution"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Hướng giải, khung phân tích, đáp án tham khảo…"
                  invalid={Boolean(errors.solutionContent)}
                  disabled={busy}
                />
              )}
            />
            {errors.solutionContent && <div className="field-error">{errors.solutionContent.message}</div>}
            <div className="solution-pdf">
              <Controller
                control={control}
                name="solutionPdf"
                render={({ field }) => (
                  <PdfUpload
                    value={field.value}
                    onChange={(v) => field.onChange(v)}
                    disabled={busy}
                    label="Tải PDF dẫn giải lên"
                    hint="Không bắt buộc. Tối đa 20 MB."
                  />
                )}
              />
              {errors.solutionPdf && <div className="field-error">{errors.solutionPdf.message}</div>}
            </div>
          </CollapsibleCard>
        </div>

        <aside className="case-side">
          <Card icon={Send} title="Xuất bản">
            <Field label="Trạng thái" htmlFor="c-status" error={errors.status?.message}>
              <Controller
                control={control}
                name="status"
                render={({ field }) => <Select id="c-status" value={field.value} onChange={field.onChange} options={STATUS_SELECT} />}
              />
            </Field>
            <Controller
              control={control}
              name="isFeatured"
              render={({ field }) => (
                <Switch checked={field.value} onChange={field.onChange} label="Nổi bật" description="Ưu tiên hiển thị ở đầu mục Rèn luyện" />
              )}
            />
            {item && (
              <dl className="meta-list">
                {item.publishedAt && (
                  <div>
                    <dt>Xuất bản</dt>
                    <dd>{formatDateTime(item.publishedAt)}</dd>
                  </div>
                )}
                <div>
                  <dt>Cập nhật</dt>
                  <dd>{formatDateTime(item.updatedAt)}</dd>
                </div>
                <div>
                  <dt>Tạo</dt>
                  <dd>
                    {formatDate(item.createdAt)}
                    {item.createdBy && ` · ${item.createdBy.fullName}`}
                  </dd>
                </div>
              </dl>
            )}
            {item && (
              <div className="publish-danger">
                <LinkButton icon={Trash2} className="danger" onClick={() => actions.askDelete(item)}>
                  Xoá case
                </LinkButton>
              </div>
            )}
          </Card>

          <Card icon={ImageIcon} title="Ảnh bìa">
            <Controller
              control={control}
              name="coverUrl"
              render={({ field }) => <CoverUpload value={field.value} onChange={(url) => field.onChange(url)} disabled={busy} />}
            />
            {errors.coverUrl && <div className="field-error">{errors.coverUrl.message}</div>}
          </Card>

          <Card icon={Tags} title="Phân loại">
            <Field label="Lĩnh vực" htmlFor="c-field" error={errors.fieldId?.message}>
              <Controller
                control={control}
                name="fieldId"
                render={({ field }) => <Select id="c-field" value={field.value} onChange={field.onChange} options={fieldOptions} placeholder="Chọn lĩnh vực" invalid={Boolean(errors.fieldId)} />}
              />
            </Field>
            <Field label="Ngành" htmlFor="c-industry" error={errors.industryId?.message}>
              <Controller
                control={control}
                name="industryId"
                render={({ field }) => (
                  <Select id="c-industry" value={field.value} onChange={field.onChange} options={industryOptions} placeholder="Chọn ngành" invalid={Boolean(errors.industryId)} />
                )}
              />
            </Field>
            <Field label="Level" htmlFor="c-level" error={errors.levelId?.message}>
              <Controller
                control={control}
                name="levelId"
                render={({ field }) => <Select id="c-level" value={field.value} onChange={field.onChange} options={levelOptions} placeholder="Chọn level" invalid={Boolean(errors.levelId)} />}
              />
            </Field>
            <Field label="Độ khó" required error={errors.difficulty?.message}>
              <Controller
                control={control}
                name="difficulty"
                render={({ field }) => <Segmented options={DIFFICULTY_OPTIONS} value={field.value} onChange={field.onChange} />}
              />
            </Field>
            <FormRow>
              <Field label="Thời gian làm" htmlFor="c-minutes" error={errors.estimatedMinutes?.message}>
                <Input
                  id="c-minutes"
                  type="number"
                  inputMode="numeric"
                  min={5}
                  max={600}
                  step={5}
                  suffix="phút"
                  placeholder="60"
                  invalid={Boolean(errors.estimatedMinutes)}
                  {...register('estimatedMinutes')}
                />
              </Field>
              <Field label="Công ty" htmlFor="c-company" error={errors.company?.message}>
                <Input id="c-company" placeholder="Vd: VinFast" invalid={Boolean(errors.company)} {...register('company')} />
              </Field>
            </FormRow>
          </Card>

          <Card icon={Timer} title="Làm bài">
            <Field label="Số lần làm tối đa" htmlFor="c-attempts" error={errors.maxAttempts?.message}>
              <Input
                id="c-attempts"
                type="number"
                inputMode="numeric"
                min={1}
                max={20}
                suffix="lần"
                disabled={unlimitedAttempts}
                invalid={Boolean(errors.maxAttempts)}
                {...register('maxAttempts')}
              />
            </Field>
            <div className="field">
              <Controller
                control={control}
                name="unlimitedAttempts"
                render={({ field }) => (
                  <OptionBox
                    checked={field.value}
                    onChange={(on) => {
                      field.onChange(on)
                      // Ô số bị khoá khi không giới hạn: đưa về giá trị hợp lệ để không chặn lưu
                      // (kiểm tra giá trị chứ không dựa vào getFieldState: chế độ onSubmit chưa validate thì invalid luôn false)
                      if (on && !isValidMaxAttempts(getValues('maxAttempts')))
                        setValue('maxAttempts', String(DEFAULT_MAX_ATTEMPTS), { shouldValidate: getFieldState('maxAttempts').invalid })
                    }}
                    label="Không giới hạn"
                    description="Người học tạo bài mới bao nhiêu lần cũng được"
                  />
                )}
              />
            </div>
            <Field label="Cho rút bài trong" htmlFor="c-window" error={errors.editWindowMinutes?.message} hint="0 = nộp xong khoá ngay">
              <Input
                id="c-window"
                type="number"
                inputMode="numeric"
                min={0}
                max={1440}
                suffix="phút"
                invalid={Boolean(errors.editWindowMinutes)}
                {...register('editWindowMinutes')}
              />
            </Field>
            {item && (
              <div className="attempt-link">
                {item.submissionCount > 0 ? (
                  <Link className="link-btn" to={`/submissions?caseId=${item.id}`}>
                    Xem {formatNumber(item.submissionCount)} bài nộp <ArrowRight className="i" aria-hidden="true" />
                  </Link>
                ) : (
                  <span className="mo">Chưa có bài nộp</span>
                )}
              </div>
            )}
          </Card>


        </aside>

        {/* Thanh lưu dính đáy: luôn trong tầm tay khi cuộn */}
        <div className="case-savebar">
          <div className="savebar-info">
            <span className="save-status">{STATUS_LABEL[status]}</span>
            {saveInfo}
          </div>
          <span className="savebar-hint">
            <kbd>Ctrl</kbd> <kbd>S</kbd> để lưu
          </span>
          {saveButton}
        </div>
      </form>

      {dialogs}
      <ConfirmDialog
        open={blocker.state === 'blocked'}
        title="Rời trang khi chưa lưu?"
        message="Các thay đổi chưa lưu của case này sẽ mất."
        confirmLabel="Rời trang"
        cancelLabel="Ở lại"
        danger
        onConfirm={() => blocker.proceed?.()}
        onClose={() => blocker.reset?.()}
      />
    </>
  )
}
