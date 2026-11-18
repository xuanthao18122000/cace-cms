import { useEffect, useRef, type FormEvent } from 'react'
import clsx from 'clsx'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useBlocker, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, BookOpenText, CalendarClock, Check, ExternalLink, FileText, Image as ImageIcon, SearchX, Send, Trash2, UsersRound } from 'lucide-react'
import { ApiError, competitionApi, errorMessage } from '@/api'
import { RichTextEditor } from '@/components/editor/RichTextEditor'
import {
  Button,
  Card,
  ConfirmDialog,
  DateTimePicker,
  EmptyHero,
  ErrorState,
  Field,
  FormRow,
  Input,
  LinkButton,
  Loading,
  PageHeader,
  Select,
  Switch,
  Textarea,
  type SelectOption,
} from '@/components/ui'
import { useToast } from '@/contexts/toast'
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges'
import { applyServerErrors } from '@/lib/forms'
import { queryKeys } from '@/lib/queryClient'
import type { AdminCompetition, CompetitionInput } from '@/types'
import { formatDate, formatDateTime, formatRelative } from '@/utils/format'
import { toSlug } from '@/utils/text'
import { CoverUpload } from '../cases/CoverUpload'
import { CompetitionStatusBadge, PhaseBadge } from './competitionBits'
import { CompetitionProposalCard } from './CompetitionProposalCard'
import {
  COMPETITION_FIELDS,
  competitionSchema,
  SUMMARY_MAX,
  TEAM_MAX,
  TEAM_MIN,
  toCompetitionValues,
  type CompetitionFormValues,
} from './competitionForm'
import { isEditableStatus, isReviewStatus, isoToLocalInput, localInputToIso, STATUS_LABEL } from './competitionLabels'
import { useCompetitionActions } from './useCompetitionActions'

type FormValues = CompetitionFormValues

const STATUS_SELECT: SelectOption[] = [
  { value: 'draft', label: STATUS_LABEL.draft, description: 'Chỉ thấy trong trang quản trị' },
  { value: 'published', label: STATUS_LABEL.published, description: 'Hiện ở mục Cuộc thi trên web' },
  { value: 'hidden', label: STATUS_LABEL.hidden, description: 'Gỡ khỏi web, giữ nguyên dữ liệu' },
]

export function CompetitionEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const detail = useQuery({ queryKey: queryKeys.competition(id ?? ''), queryFn: () => competitionApi.get(id ?? ''), enabled: Boolean(id) })

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
            title="Không tìm thấy cuộc thi"
            message="Cuộc thi có thể đã bị xoá."
            actions={
              <Button icon={ArrowLeft} onClick={() => navigate('/competitions')}>
                Về danh sách cuộc thi
              </Button>
            }
          />
        ) : (
          <ErrorState error={detail.error} onRetry={() => detail.refetch()} />
        )}
      </Card>
    )
  }
  // Gắn key theo id: tạo xong chuyển sang /competitions/:id thì form nạp lại từ dữ liệu máy chủ
  return <CompetitionForm key={id ?? 'new'} item={detail.data ?? null} />
}

const textOrNull = (v: string) => v.trim() || null
const intOrNull = (v: string) => (v.trim() ? Number(v) : null)
/** Ô datetime-local chỉ đến phút: chưa sửa thì gửi lại đúng giá trị đã lưu (giữ giây, vd 23:59:59) */
const dateOut = (v: string, saved: string | null | undefined) => (saved && isoToLocalInput(saved) === v ? saved : localInputToIso(v))

function CompetitionForm({ item }: { item: AdminCompetition | null }) {
  const toast = useToast()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isNew = item === null
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
    trigger,
    formState: { errors, isDirty, isSubmitted },
  } = useForm<FormValues>({ resolver: zodResolver(competitionSchema), defaultValues: toCompetitionValues(item) })

  const [summary, status] = useWatch({ control, name: ['summary', 'status'] })

  const { actions, dialogs, reviewing } = useCompetitionActions({
    onDeleted: () => {
      allowLeave.current = true
      navigate('/competitions', { replace: true })
    },
    // Duyệt / từ chối xong: nạp trạng thái mới, giữ các ô đang sửa dở (vd từ chối khi chưa lưu)
    onReviewed: (saved) => reset(toCompetitionValues(saved, { content: getValues('content') }), { keepDirtyValues: true }),
  })

  const mutation = useMutation({
    mutationFn: (v: FormValues) => {
      const body: CompetitionInput = {
        name: v.name,
        organizer: v.organizer,
        summary: v.summary,
        field: textOrNull(v.field),
        content: v.content,
        coverUrl: v.coverUrl,
        // Đã kiểm tra ở schema: hạn đăng ký luôn có giá trị hợp lệ
        registrationDeadline: dateOut(v.registrationDeadline, item?.registrationDeadline) ?? '',
        registrationOpensAt: dateOut(v.registrationOpensAt, item?.registrationOpensAt),
        eventDate: dateOut(v.eventDate, item?.eventDate),
        teamMin: intOrNull(v.teamMin),
        teamMax: intOrNull(v.teamMax),
        location: textOrNull(v.location),
        prize: textOrNull(v.prize),
        registerUrl: textOrNull(v.registerUrl),
        // PATCH chỉ nhận draft/published/hidden: đề xuất chờ duyệt / đã từ chối thì không gửi trạng thái
        ...(isEditableStatus(v.status) ? { status: v.status } : {}),
        isFeatured: v.isFeatured,
        // Bỏ trống: máy chủ sinh từ tên (khi tạo) hoặc giữ đường dẫn cũ (khi sửa)
        ...(v.slug ? { slug: v.slug } : {}),
      }
      return isNew ? competitionApi.create(body) : competitionApi.update(item.id, body)
    },
    onSuccess: (saved, v) => {
      queryClient.setQueryData(queryKeys.competition(saved.id), saved)
      queryClient.invalidateQueries({ queryKey: queryKeys.competitions })
      // Giữ HTML đang soạn (máy chủ có thể chuẩn hoá lại) để form không bị coi là đã sửa
      reset(toCompetitionValues(saved, { content: v.content }))
      toast.success(isNew ? `Đã tạo cuộc thi ${saved.name}` : 'Đã lưu thay đổi')
      if (isNew) {
        allowLeave.current = true
        navigate(`/competitions/${saved.id}`, { replace: true })
      }
    },
    onError: (err) => {
      // Trùng đường dẫn: máy chủ trả 409 CACE_CONFLICT
      if (err instanceof ApiError && err.status === 409) {
        setError('slug', { type: 'server', message: 'Đường dẫn đã được cuộc thi khác dùng' }, { shouldFocus: true })
        return toast.error(errorMessage(err))
      }
      if (!applyServerErrors(err, setError, COMPETITION_FIELDS)) toast.error(errorMessage(err))
    },
  })

  // Đang lưu (kể cả lúc validate chưa xong): bỏ qua lần gọi sau, vd giữ Ctrl+S hoặc bấm liên tiếp
  const saving = useRef(false)
  const submit = handleSubmit(
    // Lỗi đã xử lý ở onError
    (v) => mutation.mutateAsync(v).then(() => undefined, () => undefined),
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

  // Đổi một mốc thì kiểm tra lại các mốc liên quan (lỗi chéo gắn trên ô khác)
  type Linked = 'registrationOpensAt' | 'registrationDeadline' | 'eventDate' | 'teamMin' | 'teamMax'
  const revalidate = (...names: Linked[]) => {
    const targets = isSubmitted ? names : names.filter((n) => getFieldState(n).invalid)
    if (targets.length) void trigger(targets)
  }

  const busy = mutation.isPending
  // Trạng thái theo máy chủ: chờ duyệt / đã từ chối thì chỉ đổi qua nút duyệt, từ chối
  const inReview = item !== null && isReviewStatus(item.status)

  /** Lưu thay đổi đang sửa trước khi duyệt; false nếu form lỗi hoặc lưu lỗi (đã báo lỗi) */
  const saveBeforeApprove = () =>
    new Promise<boolean>((resolve) => {
      void handleSubmit(
        (v) =>
          mutation.mutateAsync(v).then(
            () => resolve(true),
            () => resolve(false),
          ),
        () => {
          toast.error('Kiểm tra lại các trường được đánh dấu đỏ')
          resolve(false)
        },
      )()
    })
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
      {isNew ? 'Tạo cuộc thi' : 'Lưu'}
    </Button>
  )

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Nội dung' }, { label: 'Cuộc thi', to: '/competitions' }]}
        title={
          isNew ? (
            'Thêm cuộc thi'
          ) : (
            <>
              {item.name} <CompetitionStatusBadge status={item.status} /> <PhaseBadge phase={item.phase} />
            </>
          )
        }
        subtitle={isNew ? 'Nhập thông tin, thời gian đăng ký và thể thức cuộc thi' : item.organizer}
        actions={
          item?.registerUrl && (
            <Button icon={ExternalLink} onClick={() => window.open(item.registerUrl ?? '', '_blank', 'noopener,noreferrer')}>
              Mở link đăng ký
            </Button>
          )
        }
      />

      <form className="case-editor" onSubmit={onSubmit} noValidate autoComplete="off">
        <div className="case-main">
          <Card icon={FileText} title="Thông tin chung">
            <Field label="Tên cuộc thi" htmlFor="m-name" required error={errors.name?.message}>
              <Input
                id="m-name"
                className="input-lg"
                placeholder="Vd: Marketing Arena 2027"
                invalid={Boolean(errors.name)}
                {...register('name', {
                  onChange: (e) => {
                    // Đường dẫn tự sinh theo tên cho tới khi người dùng tự sửa (chỉ khi tạo mới)
                    if (isNew && !getFieldState('slug').isDirty) setValue('slug', toSlug(e.target.value, 140), { shouldValidate: Boolean(errors.slug) })
                  },
                })}
              />
            </Field>
            <FormRow>
              <Field label="Đơn vị tổ chức" htmlFor="m-organizer" required error={errors.organizer?.message}>
                <Input id="m-organizer" placeholder="Vd: CLB Marketing NEU" invalid={Boolean(errors.organizer)} {...register('organizer')} />
              </Field>
              <Field label="Lĩnh vực" htmlFor="m-field" error={errors.field?.message}>
                <Input id="m-field" placeholder="Vd: Marketing" invalid={Boolean(errors.field)} {...register('field')} />
              </Field>
            </FormRow>
            <Field label="Mô tả ngắn" htmlFor="m-summary" required error={errors.summary?.message}>
              <Textarea
                id="m-summary"
                rows={3}
                placeholder="Hai, ba câu giới thiệu cuộc thi, đối tượng và đề bài chính"
                invalid={Boolean(errors.summary)}
                {...register('summary')}
              />
              <div className={clsx('char-count', summaryLength > SUMMARY_MAX && 'over')}>
                {summaryLength}/{SUMMARY_MAX}
              </div>
            </Field>
            <Field
              label="Đường dẫn"
              htmlFor="m-slug"
              error={errors.slug?.message}
              hint={isNew ? 'Tự tạo theo tên cuộc thi, có thể sửa. Bỏ trống để máy chủ tự sinh.' : 'Đổi đường dẫn sẽ làm link cũ không mở được.'}
            >
              <Input
                id="m-slug"
                className="mono"
                spellCheck={false}
                placeholder="marketing-arena-2027"
                invalid={Boolean(errors.slug)}
                {...slugField}
                onChange={(e) => {
                  e.target.value = e.target.value.toLowerCase().replace(/\s+/g, '-')
                  return slugField.onChange(e)
                }}
              />
            </Field>
          </Card>

          <Card icon={CalendarClock} title="Thời gian" subtitle="Theo giờ máy của bạn. Bỏ trống ngày mở đăng ký nếu mở ngay.">
            <FormRow>
              <Field label="Mở đăng ký" htmlFor="m-opens" error={errors.registrationOpensAt?.message}>
                <Controller
                  control={control}
                  name="registrationOpensAt"
                  render={({ field }) => (
                    <DateTimePicker
                      id="m-opens"
                      value={field.value}
                      onBlur={field.onBlur}
                      onChange={(v) => {
                        field.onChange(v)
                        revalidate('registrationDeadline', 'eventDate')
                      }}
                      invalid={Boolean(errors.registrationOpensAt)}
                      clearable
                      placeholder="Mở ngay khi xuất bản"
                    />
                  )}
                />
              </Field>
              <Field label="Hạn đăng ký" htmlFor="m-deadline" required error={errors.registrationDeadline?.message}>
                <Controller
                  control={control}
                  name="registrationDeadline"
                  render={({ field }) => (
                    <DateTimePicker
                      id="m-deadline"
                      value={field.value}
                      onBlur={field.onBlur}
                      onChange={(v) => {
                        field.onChange(v)
                        revalidate('registrationOpensAt', 'eventDate')
                      }}
                      invalid={Boolean(errors.registrationDeadline)}
                      defaultTime="23:59"
                    />
                  )}
                />
              </Field>
            </FormRow>
            <FormRow>
              <Field label="Ngày thi" htmlFor="m-event" error={errors.eventDate?.message} hint="Không bắt buộc. Phải sau hạn đăng ký.">
                <Controller
                  control={control}
                  name="eventDate"
                  render={({ field }) => (
                    <DateTimePicker
                      id="m-event"
                      value={field.value}
                      onBlur={field.onBlur}
                      onChange={(v) => {
                        field.onChange(v)
                        revalidate('registrationDeadline')
                      }}
                      invalid={Boolean(errors.eventDate)}
                      clearable
                      placeholder="Chưa có ngày thi"
                    />
                  )}
                />
              </Field>
              <div />
            </FormRow>
          </Card>

          <Card icon={UsersRound} title="Thể thức">
            <FormRow>
              <Field label="Số người tối thiểu" htmlFor="m-team-min" error={errors.teamMin?.message}>
                <Input
                  id="m-team-min"
                  type="number"
                  inputMode="numeric"
                  min={TEAM_MIN}
                  max={TEAM_MAX}
                  suffix="người"
                  placeholder="1"
                  invalid={Boolean(errors.teamMin)}
                  {...register('teamMin', { onChange: () => revalidate('teamMax') })}
                />
              </Field>
              <Field label="Số người tối đa" htmlFor="m-team-max" error={errors.teamMax?.message}>
                <Input
                  id="m-team-max"
                  type="number"
                  inputMode="numeric"
                  min={TEAM_MIN}
                  max={TEAM_MAX}
                  suffix="người"
                  placeholder="5"
                  invalid={Boolean(errors.teamMax)}
                  {...register('teamMax', { onChange: () => revalidate('teamMin') })}
                />
              </Field>
            </FormRow>
            <FormRow>
              <Field label="Địa điểm" htmlFor="m-location" error={errors.location?.message}>
                <Input id="m-location" placeholder="Vd: Online, TP.HCM" invalid={Boolean(errors.location)} {...register('location')} />
              </Field>
              <Field label="Giải thưởng" htmlFor="m-prize" error={errors.prize?.message}>
                <Input id="m-prize" placeholder="Vd: 120.000.000đ" invalid={Boolean(errors.prize)} {...register('prize')} />
              </Field>
            </FormRow>
            <Field label="Link đăng ký" htmlFor="m-register" error={errors.registerUrl?.message} hint="Trang đăng ký của ban tổ chức (http:// hoặc https://)">
              <Input
                id="m-register"
                type="url"
                inputMode="url"
                spellCheck={false}
                placeholder="https://"
                invalid={Boolean(errors.registerUrl)}
                {...register('registerUrl')}
              />
            </Field>
          </Card>

          <Card icon={BookOpenText} title="Nội dung chi tiết" subtitle="Thể lệ, vòng thi, quyền lợi. Có thể chèn ảnh, bảng, liên kết.">
            <Controller
              control={control}
              name="content"
              render={({ field }) => (
                <RichTextEditor
                  id="m-content"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Viết nội dung chi tiết cuộc thi…"
                  invalid={Boolean(errors.content)}
                  disabled={busy}
                />
              )}
            />
            {errors.content && <div className="field-error">{errors.content.message}</div>}
          </Card>
        </div>

        <aside className="case-side">
          {item?.submittedBy && (
            <CompetitionProposalCard
              item={{ ...item, submittedBy: item.submittedBy }}
              busy={busy || reviewing}
              onApprove={() => actions.askApprove(item, isDirty ? { unsaved: true, prepare: saveBeforeApprove } : {})}
              onReject={() => actions.askReject(item)}
            />
          )}

          <Card icon={Send} title="Xuất bản">
            {inReview ? (
              <Field label="Trạng thái" hint="Duyệt hoặc từ chối ở khung Đề xuất từ người dùng">
                <div>
                  <CompetitionStatusBadge status={item.status} />
                </div>
              </Field>
            ) : (
              <Field label="Trạng thái" htmlFor="m-status" error={errors.status?.message}>
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => <Select id="m-status" value={field.value} onChange={field.onChange} options={STATUS_SELECT} />}
                />
              </Field>
            )}
            <Controller
              control={control}
              name="isFeatured"
              render={({ field }) => (
                <Switch checked={field.value} onChange={field.onChange} label="Nổi bật" description="Ưu tiên hiển thị ở đầu mục Cuộc thi" />
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
                    {item.createdByName && ` · ${item.createdByName}`}
                  </dd>
                </div>
              </dl>
            )}
            {item && (
              <div className="publish-danger">
                <LinkButton icon={Trash2} className="danger" onClick={() => actions.askDelete(item)}>
                  Xoá cuộc thi
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
        message="Các thay đổi chưa lưu của cuộc thi này sẽ mất."
        confirmLabel="Rời trang"
        cancelLabel="Ở lại"
        danger
        onConfirm={() => blocker.proceed?.()}
        onClose={() => blocker.reset?.()}
      />
    </>
  )
}
