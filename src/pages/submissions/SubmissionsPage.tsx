import { useMemo, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Check, FileCheck2, Paperclip, SearchX } from 'lucide-react'
import { caseApi, submissionApi } from '@/api'
import {
  Button,
  Card,
  DataTable,
  EmptyHero,
  EntityCell,
  ErrorState,
  FilterBar,
  Icon,
  PageHeader,
  Pagination,
  ResultCount,
  SearchBox,
  Select,
  type Column,
  type SelectOption,
} from '@/components/ui'
import { useDebounce } from '@/hooks/useDebounce'
import { queryKeys } from '@/lib/queryClient'
import type { AdminSubmission, SubmissionListQuery, SubmissionStatus } from '@/types'
import { formatDateTime, formatNumber } from '@/utils/format'
import { SubmissionStatusBadge } from './submissionBits'
import { formatGrade, formatScore, SUBMISSION_STATUS_LABEL, SUBMISSION_STATUS_OPTIONS } from './submissionLabels'

/** Lối tắt trạng thái hay dùng khi chấm; ô chọn trạng thái vẫn có đủ 4 trạng thái */
const STATUS_TABS: { value: SubmissionStatus | ''; label: string }[] = [
  { value: '', label: 'Tất cả' },
  { value: 'submitted', label: 'Chờ chấm' },
  { value: 'grading', label: SUBMISSION_STATUS_LABEL.grading },
  { value: 'graded', label: SUBMISSION_STATUS_LABEL.graded },
]

const columns: Column<AdminSubmission>[] = [
  {
    key: 'user',
    header: 'Người làm',
    main: true,
    skeleton: 'entity',
    render: (s) => <EntityCell avatarName={s.user.fullName} avatarSrc={s.user.avatarUrl} title={s.user.fullName} subtitle={s.user.email} />,
  },
  {
    key: 'case',
    header: 'Case',
    render: (s) => (
      <div className="min-w-0">
        <div className="sub-case-title" title={s.case.title}>
          {s.case.title}
        </div>
        <div className="mo">Lần #{s.attemptNo}</div>
      </div>
    ),
  },
  { key: 'status', header: 'Trạng thái', skeleton: 'badge', render: (s) => <SubmissionStatusBadge status={s.status} /> },
  { key: 'words', header: 'Số chữ', hideOnMobile: true, className: 'is-num', render: (s) => <span className="num">{formatNumber(s.wordCount)}</span> },
  {
    key: 'files',
    header: 'File',
    hideOnMobile: true,
    className: 'is-num',
    render: (s) =>
      s.attachmentCount > 0 ? (
        <span className="inline-icon num" title={`${s.attachmentCount} file đính kèm`}>
          <Icon icon={Paperclip} />
          {s.attachmentCount}
        </span>
      ) : (
        <span className="mo">—</span>
      ),
  },
  {
    key: 'self',
    header: 'Tự đánh giá',
    hideOnMobile: true,
    skeleton: 'none',
    render: (s) =>
      s.selfAssessed ? (
        <span className="inline-icon num" title="Đã tự đánh giá (điểm theo trọng số, thang 10)">
          <span className="check-on">
            <Icon icon={Check} />
          </span>
          <span className="sr-only">Đã tự đánh giá</span>
          {s.selfScore !== null && `${formatScore(s.selfScore)}/10`}
        </span>
      ) : (
        <span className="mo">—</span>
      ),
  },
  {
    key: 'score',
    header: 'Điểm',
    className: 'is-num nowrap',
    render: (s) =>
      s.score !== null ? (
        <span className="num" title={s.status === 'grading' ? 'Điểm nháp — người học chưa thấy' : 'Điểm theo trọng số, thang 10'}>
          <b className="ink">{formatGrade(s.score)}</b>
          {s.status === 'grading' && <span className="mo"> · nháp</span>}
        </span>
      ) : (
        <span className="mo">—</span>
      ),
  },
  {
    key: 'submitted',
    header: 'Nộp lúc',
    className: 'nowrap',
    render: (s) => (s.submittedAt ? formatDateTime(s.submittedAt) : <span className="mo">—</span>),
  },
]

export function SubmissionsPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const caseId = params.get('caseId') ?? ''
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<SubmissionStatus | ''>('')
  const [pageSize, setPageSize] = useState(20)
  const debouncedSearch = useDebounce(search.trim(), 350)

  // Đổi bộ lọc thì về trang 1: trang gắn với khoá bộ lọc hiện tại
  const filterKey = `${debouncedSearch}|${status}|${caseId}|${pageSize}`
  const [pageState, setPageState] = useState({ key: filterKey, page: 1 })
  const page = pageState.key === filterKey ? pageState.page : 1
  const setPage = (p: number) => setPageState({ key: filterKey, page: p })

  const query: SubmissionListQuery = { page, pageSize, search: debouncedSearch, status, caseId }
  const list = useQuery({
    queryKey: queryKeys.submissionList(query),
    queryFn: ({ signal }) => submissionApi.list(query, signal),
    placeholderData: keepPreviousData,
  })
  // Số bài chờ chấm (đã nộp, chưa ai chấm) cho tab lối tắt
  const pendingQuery: SubmissionListQuery = { page: 1, pageSize: 1, status: 'submitted', caseId }
  const pending = useQuery({ queryKey: queryKeys.submissionList(pendingQuery), queryFn: ({ signal }) => submissionApi.list(pendingQuery, signal) })
  // Ô chọn case: 100 case mới nhất, tìm được ngay trong ô
  const cases = useQuery({ queryKey: queryKeys.caseOptions, queryFn: () => caseApi.list({ page: 1, pageSize: 100 }) })

  const rows = list.data?.items ?? []
  const total = list.data?.total ?? 0
  // Tổng giảm (xoá / ẩn / duyệt mục cuối của trang cuối): đưa về trang cuối còn dữ liệu
  const lastPage = Math.max(1, Math.ceil(total / pageSize))
  if (list.data && !list.isPlaceholderData && page > lastPage) setPage(lastPage)
  const filtered = Boolean(debouncedSearch || status || caseId)

  const caseOptions = useMemo<SelectOption[]>(() => {
    const options = (cases.data?.items ?? []).map((c) => ({ value: c.id, label: c.title, description: c.company ?? undefined }))
    // Case đang lọc nằm ngoài 100 case đầu (mở từ trang sửa case): lấy tên từ bài nộp
    if (caseId && !options.some((o) => o.value === caseId)) {
      const fromRows = list.data?.items.find((s) => s.case.id === caseId)?.case.title
      options.unshift({ value: caseId, label: fromRows ?? 'Case đang chọn', description: undefined })
    }
    return options
  }, [cases.data, caseId, list.data])

  const setCaseId = (id: string) => {
    const next = new URLSearchParams(params)
    if (id) next.set('caseId', id)
    else next.delete('caseId')
    setParams(next, { replace: true })
  }

  const resetFilters = () => {
    setSearch('')
    setStatus('')
    setCaseId('')
  }

  return (
    <>
      <PageHeader crumbs={[{ label: 'Nội dung' }]} title="Bài nộp" subtitle="Bài giải case của người học. Mở bài để chấm theo tiêu chí và trả kết quả." />

      <div className="tabs" role="tablist" aria-label="Lọc nhanh theo trạng thái">
        {STATUS_TABS.map((t) => (
          <button
            key={t.value || 'all'}
            type="button"
            role="tab"
            aria-selected={t.value === status}
            className={t.value === status ? 'tab active' : 'tab'}
            onClick={() => setStatus(t.value)}
          >
            {t.label}
            {t.value === 'submitted' && pending.data && <span className="tab-count">{formatNumber(pending.data.total)}</span>}
          </button>
        ))}
      </div>

      <Card>
        <FilterBar>
          <SearchBox value={search} onChange={setSearch} placeholder="Tìm tên, email người làm, tiêu đề case" />
          <Select
            variant="chip"
            value={status}
            onChange={(v) => setStatus(v as SubmissionStatus | '')}
            placeholder="Tất cả trừ nháp"
            aria-label="Lọc theo trạng thái"
            options={SUBMISSION_STATUS_OPTIONS}
          />
          <Select variant="chip" searchable value={caseId} onChange={setCaseId} placeholder="Mọi case" aria-label="Lọc theo case" options={caseOptions} />
          {list.data && <ResultCount>{`${formatNumber(total)} bài`}</ResultCount>}
        </FilterBar>

        {list.isError && !list.data ? (
          <ErrorState error={list.error} onRetry={() => list.refetch()} />
        ) : !list.isPending && rows.length === 0 ? (
          filtered ? (
            <EmptyHero
              icon={SearchX}
              tone="gray"
              title="Không có bài nộp phù hợp"
              message="Thử từ khoá khác hoặc bỏ bớt bộ lọc."
              actions={<Button onClick={resetFilters}>Xoá bộ lọc</Button>}
            />
          ) : (
            <EmptyHero icon={FileCheck2} title="Chưa có bài nộp" message="Bài của người học sẽ hiện ở đây sau khi nộp." />
          )
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={rows}
              rowKey={(s) => s.id}
              loading={list.isFetching}
              onRowClick={(s) => navigate(`/submissions/${s.id}`)}
              isRowDimmed={(s) => s.status === 'draft'}
            />
            {total > 0 && <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={setPageSize} />}
          </>
        )}
      </Card>
    </>
  )
}
