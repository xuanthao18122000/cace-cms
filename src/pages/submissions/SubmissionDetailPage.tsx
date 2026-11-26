import { useMemo, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Download, FileText, FileX, Gauge, LibraryBig, Lightbulb, Paperclip, PenLine, UserRound } from 'lucide-react'
import { ApiError, submissionApi } from '@/api'
import {
  Avatar,
  Button,
  Card,
  CollapsibleCard,
  DataTable,
  EmptyHero,
  EmptyState,
  ErrorState,
  Icon,
  PageHeader,
  Skeleton,
  type Column,
} from '@/components/ui'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { queryKeys } from '@/lib/queryClient'
import type { AdminSubmissionDetail, Criterion, SelfAssessmentItem } from '@/types'
import { formatBytes, formatDateTime, formatNumber, formatRelative } from '@/utils/format'
import { GradePanel } from './GradePanel'
import { SubmissionStatusBadge } from './submissionBits'
import { formatGrade, formatScore } from './submissionLabels'
// Kiểu chữ bài viết dùng chung với trình soạn thảo
import '@/components/editor/editor.css'

type AssessmentRow = Criterion & { self: SelfAssessmentItem | undefined }

const assessmentColumns: Column<AssessmentRow>[] = [
  {
    key: 'name',
    header: 'Tiêu chí',
    main: true,
    render: (r) => (
      <div className="min-w-0">
        <div className="entity-title">{r.name}</div>
        {r.description && <div className="entity-sub">{r.description}</div>}
      </div>
    ),
  },
  { key: 'weight', header: 'Trọng số', className: 'is-num', render: (r) => <span className="num">{r.weight}%</span> },
  {
    key: 'score',
    header: 'Tự chấm',
    className: 'is-num nowrap',
    render: (r) =>
      r.self ? (
        <span className="num">
          <b className="ink">{formatScore(r.self.score)}</b> / {r.maxScore}
        </span>
      ) : (
        <span className="mo">-</span>
      ),
  },
  { key: 'note', header: 'Ghi chú', render: (r) => (r.self?.note ? <div className="cell-note">{r.self.note}</div> : <span className="mo">-</span>) },
]

/** Liên kết tải file: url tương đối /uploads/... đi qua proxy cùng origin */
function FileLink({ url, name, meta }: { url: string; name: string; meta: string }) {
  return (
    <div className="file-row">
      <span className="file-icon">
        <Icon icon={FileText} />
      </span>
      <div className="min-w-0 grow">
        <a className="file-name" href={url} target="_blank" rel="noreferrer" title={name}>
          {name}
        </a>
        <div className="mo">{meta}</div>
      </div>
      <a className="icon-btn plain" href={url} download={name} aria-label={`Tải ${name}`} title="Tải xuống">
        <Icon icon={Download} />
      </a>
    </div>
  )
}

const fileKind = (mime: string, name: string) => {
  const ext = name.split('.').pop()?.toUpperCase()
  if (mime === 'application/pdf') return 'PDF'
  return ext && ext.length <= 5 ? ext : 'Tệp'
}

export function SubmissionDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const query = useQuery({ queryKey: queryKeys.submission(id), queryFn: () => submissionApi.get(id) })

  const crumbs = [{ label: 'Nội dung' }, { label: 'Bài nộp', to: '/submissions' }]
  const back = (
    <Button icon={ArrowLeft} onClick={() => navigate('/submissions')}>
      Danh sách
    </Button>
  )

  if (query.isPending) {
    return (
      <>
        <PageHeader crumbs={crumbs} title={<Skeleton width={260} height={26} />} />
        <div className="grid g21 top">
          <Card>
            <div className="stack">
              {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={i} height={18} width={i === 4 ? '60%' : '100%'} />
              ))}
            </div>
          </Card>
          <Card>
            <div className="stack">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} height={16} width="100%" />
              ))}
            </div>
          </Card>
        </div>
      </>
    )
  }

  // Đã có dữ liệu mà tải lại nền lỗi: giữ trang (và điểm đang chấm dở)
  if (query.isError && !query.data) {
    const notFound = query.error instanceof ApiError && query.error.status === 404
    return (
      <>
        <PageHeader crumbs={crumbs} title="Chi tiết bài nộp" actions={back} />
        <Card>
          {notFound ? (
            <EmptyHero icon={FileX} tone="gray" title="Không tìm thấy bài nộp" message="Bài nháp có thể đã bị người học xoá." actions={back} />
          ) : (
            <ErrorState error={query.error} onRetry={() => query.refetch()} />
          )}
        </Card>
      </>
    )
  }

  if (!query.data) return null
  return <SubmissionView s={query.data} back={back} crumbs={crumbs} />
}

function SubmissionView({ s, back, crumbs }: { s: AdminSubmissionDetail; back: ReactNode; crumbs: { label: string; to?: string }[] }) {
  const admin = useIsAdmin()
  const navigate = useNavigate()
  const criteria = useMemo(() => [...s.criteria].sort((a, b) => a.sortOrder - b.sortOrder), [s.criteria])
  const rows: AssessmentRow[] = criteria.map((c) => ({ ...c, self: s.selfAssessment?.find((x) => x.criterionId === c.id) }))
  const solution = s.solution

  return (
    <>
      <PageHeader
        crumbs={crumbs}
        title={
          <>
            Bài của {s.user.fullName} <SubmissionStatusBadge status={s.status} />
          </>
        }
        subtitle={
          <>
            {s.case.title} · Lần #{s.attemptNo}
          </>
        }
        actions={
          <>
            {back}
            <Button icon={LibraryBig} onClick={() => navigate(`/cases/${s.case.id}`)}>
              Mở case
            </Button>
          </>
        }
      />

      <div className="grid g21 top">
        <div className="stack">
          <Card icon={PenLine} title="Bài làm" subtitle={`${formatNumber(s.wordCount)} chữ`}>
            {s.content ? (
              <div className="rte-content rte-readonly" dangerouslySetInnerHTML={{ __html: s.content }} />
            ) : (
              <EmptyState>Không có phần viết trên web{s.attachments.length > 0 ? ' - xem file đính kèm' : ''}.</EmptyState>
            )}
          </Card>

          <Card icon={Paperclip} title="File đính kèm" subtitle={s.attachments.length ? `${s.attachments.length} file` : undefined}>
            {s.attachments.length ? (
              <div className="sub-files">
                {s.attachments.map((a) => (
                  <FileLink key={a.url} url={a.url} name={a.name} meta={`${fileKind(a.mimeType, a.name)} · ${formatBytes(a.size)}`} />
                ))}
              </div>
            ) : (
              <EmptyState>Không có file đính kèm.</EmptyState>
            )}
          </Card>

          <Card icon={Gauge} title="Tự đánh giá" subtitle="Người học tự chấm theo tiêu chí của case sau khi nộp">
            {s.selfAssessment ? (
              <>
                <DataTable columns={assessmentColumns} rows={rows} rowKey={(r) => r.id} />
                {s.selfScore !== null && (
                  <div className="score-total">
                    Điểm tự đánh giá theo trọng số <strong>{formatScore(s.selfScore)}</strong>/10
                  </div>
                )}
              </>
            ) : (
              <EmptyState>Người học chưa tự đánh giá.</EmptyState>
            )}
          </Card>

          <CollapsibleCard icon={Lightbulb} title="Dẫn giải mẫu" subtitle="Để đối chiếu khi đọc bài">
            {solution && (solution.content || solution.pdfUrl) ? (
              <>
                {solution.content && <div className="rte-content rte-readonly" dangerouslySetInnerHTML={{ __html: solution.content }} />}
                {solution.pdfUrl && (
                  <div className="solution-pdf">
                    <FileLink url={solution.pdfUrl} name={solution.pdfName || 'dan-giai.pdf'} meta="PDF dẫn giải" />
                  </div>
                )}
              </>
            ) : (
              <EmptyState>
                Case chưa có dẫn giải mẫu. <Link to={`/cases/${s.case.id}`}>Thêm ở trang sửa case</Link>
              </EmptyState>
            )}
          </CollapsibleCard>
        </div>

        <aside className="stack">
          {/* Cạnh bài làm để vừa đọc vừa chấm */}
          <GradePanel key={s.id} s={s} criteria={criteria} />

          <Card icon={UserRound} title="Người làm">
            <div className="entity">
              <Avatar name={s.user.fullName} src={s.user.avatarUrl} size="lg" />
              <div className="min-w-0">
                <div className="entity-title">{admin ? <Link to={`/users/${s.user.id}`}>{s.user.fullName}</Link> : s.user.fullName}</div>
                <div className="entity-sub">{s.user.email}</div>
              </div>
            </div>
            <dl className="meta-list">
              <div>
                <dt>Trạng thái</dt>
                <dd>
                  <SubmissionStatusBadge status={s.status} />
                </dd>
              </div>
              {s.score !== null && (
                <div>
                  <dt>Điểm chấm</dt>
                  <dd className="num">{formatGrade(s.score)}/10</dd>
                </div>
              )}
              <div>
                <dt>Lần làm</dt>
                <dd>#{s.attemptNo}</dd>
              </div>
              <div>
                <dt>Tạo lúc</dt>
                <dd>{formatDateTime(s.createdAt)}</dd>
              </div>
              <div>
                <dt>Nộp lúc</dt>
                <dd>{formatDateTime(s.submittedAt)}</dd>
              </div>
              <div>
                <dt>Được rút bài tới</dt>
                <dd title={s.editableUntil ? formatRelative(s.editableUntil) : undefined}>{formatDateTime(s.editableUntil)}</dd>
              </div>
              <div>
                <dt>Cập nhật</dt>
                <dd>{formatDateTime(s.updatedAt)}</dd>
              </div>
            </dl>
          </Card>

        </aside>
      </div>
    </>
  )
}
