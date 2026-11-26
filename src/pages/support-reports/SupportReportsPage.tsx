import { useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CircleCheck, Inbox, LifeBuoy, RotateCcw, SearchX } from 'lucide-react'
import { errorMessage, supportReportApi, type SupportReport, type SupportReportQuery, type SupportReportStatus, type SupportReportType } from '@/api'
import {
  Badge,
  Button,
  Card,
  DataTable,
  Drawer,
  EmptyHero,
  EntityCell,
  ErrorState,
  FilterBar,
  KeyValueGrid,
  PageHeader,
  Pagination,
  ResultCount,
  SearchBox,
  Select,
  type Column,
} from '@/components/ui'
import { useToast } from '@/contexts/toast'
import { useDebounce } from '@/hooks/useDebounce'
import { formatDateTime, formatNumber, formatRelative } from '@/utils/format'

const QUERY_KEY = ['admin', 'support-reports'] as const

/** Nhãn khớp lựa chọn trên web (cace-web profile-hub/lib/labels.ts) */
const CATEGORY_LABEL: Record<string, string> = {
  bug: 'Lỗi chức năng',
  ui: 'Lỗi hiển thị / giao diện',
  performance: 'Chậm / không tải được',
  account: 'Tài khoản & đăng nhập',
  content: 'Nội dung',
  payment: 'Thanh toán / Premium',
  new_feature: 'Tính năng mới',
  improve: 'Cải thiện tính năng',
  other: 'Khác',
}
const AREA_LABEL: Record<string, string> = {
  home: 'Trang chủ',
  practice: 'Rèn luyện',
  competition: 'Cuộc thi',
  teammate: 'Ghép Teammate',
  profile: 'Hồ sơ',
  other: 'Khác',
}
const TYPE_LABEL: Record<SupportReportType, string> = { report: 'Báo cáo vấn đề', feedback: 'Góp ý tính năng' }

const TABS: { status: SupportReportStatus | ''; label: string }[] = [
  { status: 'new', label: 'Chưa xử lý' },
  { status: 'done', label: 'Đã xử lý' },
  { status: '', label: 'Tất cả' },
]

/** Báo cáo vấn đề & góp ý tính năng từ web: xem chi tiết, đánh dấu đã xử lý */
export function SupportReportsPage() {
  const [status, setStatus] = useState<SupportReportStatus | ''>('new')
  const [type, setType] = useState<SupportReportType | ''>('')
  const [search, setSearch] = useState('')
  const [pageSize, setPageSize] = useState(20)
  const [viewing, setViewing] = useState<SupportReport | null>(null)
  const debounced = useDebounce(search.trim(), 350)

  const filterKey = `${status}|${type}|${debounced}|${pageSize}`
  const [pageState, setPageState] = useState({ key: filterKey, page: 1 })
  const page = pageState.key === filterKey ? pageState.page : 1
  const setPage = (p: number) => setPageState({ key: filterKey, page: p })

  const query: SupportReportQuery = { page, pageSize, status: status || undefined, type: type || undefined, search: debounced || undefined }
  const list = useQuery({
    queryKey: [...QUERY_KEY, 'list', query],
    queryFn: ({ signal }) => supportReportApi.list(query, signal),
    placeholderData: keepPreviousData,
  })
  const rows = list.data?.items ?? []
  const total = list.data?.total ?? 0
  const lastPage = Math.max(1, Math.ceil(total / pageSize))
  if (list.data && !list.isPlaceholderData && page > lastPage) setPage(lastPage)

  const columns: Column<SupportReport>[] = [
    {
      key: 'desc',
      header: 'Nội dung',
      main: true,
      skeleton: 'entity',
      render: (r) => (
        <EntityCell
          title={CATEGORY_LABEL[r.category] ?? r.category}
          subtitle={r.description.length > 90 ? `${r.description.slice(0, 90)}…` : r.description}
        />
      ),
    },
    {
      key: 'type',
      header: 'Loại',
      skeleton: 'badge',
      hideOnMobile: true,
      render: (r) => <Badge tone={r.type === 'report' ? 'orange' : 'purple'}>{TYPE_LABEL[r.type]}</Badge>,
    },
    { key: 'area', header: 'Xảy ra tại', hideOnMobile: true, render: (r) => (r.area ? (AREA_LABEL[r.area] ?? r.area) : '-') },
    { key: 'user', header: 'Người gửi', hideOnMobile: true, render: (r) => r.user?.fullName ?? r.email },
    {
      key: 'created',
      header: 'Gửi lúc',
      className: 'nowrap',
      render: (r) => <span title={formatDateTime(r.createdAt)}>{formatRelative(r.createdAt)}</span>,
    },
    {
      key: 'status',
      header: 'Trạng thái',
      skeleton: 'badge',
      render: (r) => (r.status === 'done' ? <Badge tone="green">Đã xử lý</Badge> : <Badge tone="yellow">Chưa xử lý</Badge>),
    },
  ]

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Nội dung' }]}
        title="Báo cáo & góp ý"
        subtitle="Người học gửi từ Hồ sơ → Cài đặt → Hỗ trợ & Báo cáo trên web. Phản hồi qua email người gửi để lại."
      />
      <Card>
        <div className="tabs" role="tablist" aria-label="Lọc theo trạng thái">
          {TABS.map((t) => (
            <button
              key={t.label}
              type="button"
              role="tab"
              aria-selected={t.status === status}
              className={t.status === status ? 'tab active' : 'tab'}
              onClick={() => setStatus(t.status)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <FilterBar>
          <SearchBox value={search} onChange={setSearch} placeholder="Tìm mô tả, email, tên người gửi" />
          <Select
            variant="chip"
            value={type}
            onChange={(v) => setType(v as SupportReportType | '')}
            placeholder="Mọi loại"
            aria-label="Loại"
            options={[
              { value: '', label: 'Mọi loại' },
              { value: 'report', label: TYPE_LABEL.report },
              { value: 'feedback', label: TYPE_LABEL.feedback },
            ]}
          />
          {list.data && <ResultCount>{`${formatNumber(total)} mục`}</ResultCount>}
        </FilterBar>
        {list.isError && !list.data ? (
          <ErrorState error={list.error} onRetry={() => list.refetch()} />
        ) : !list.isPending && rows.length === 0 ? (
          debounced || type ? (
            <EmptyHero
              icon={SearchX}
              tone="gray"
              title="Không có mục phù hợp"
              message="Thử từ khoá hoặc bộ lọc khác."
              actions={
                <Button
                  onClick={() => {
                    setSearch('')
                    setType('')
                  }}
                >
                  Xoá bộ lọc
                </Button>
              }
            />
          ) : status === 'new' ? (
            <EmptyHero icon={LifeBuoy} title="Không còn báo cáo chưa xử lý" message="Báo cáo / góp ý mới từ web sẽ hiện ở đây." />
          ) : (
            <EmptyHero icon={Inbox} tone="gray" title="Chưa có mục nào" message="Đổi sang tab khác để xem." />
          )
        ) : (
          <>
            <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} loading={list.isFetching} onRowClick={setViewing} />
            {total > 0 && <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={setPageSize} />}
          </>
        )}
      </Card>
      {viewing && <ReportDrawer key={viewing.id + viewing.status} item={viewing} onClose={() => setViewing(null)} onChanged={setViewing} />}
    </>
  )
}

function ReportDrawer({ item, onClose, onChanged }: { item: SupportReport; onClose(): void; onChanged(r: SupportReport): void }) {
  const toast = useToast()
  const queryClient = useQueryClient()
  const done = item.status === 'done'
  const setStatus = useMutation({
    mutationFn: (s: SupportReportStatus) => supportReportApi.setStatus(item.id, s),
    onSuccess: (r) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      onChanged(r)
      toast.success(r.status === 'done' ? 'Đã đánh dấu đã xử lý' : 'Đã mở lại')
    },
    onError: (err) => toast.error(errorMessage(err)),
  })

  return (
    <Drawer
      open
      title={TYPE_LABEL[item.type]}
      subtitle={done ? <Badge tone="green">Đã xử lý</Badge> : <Badge tone="yellow">Chưa xử lý</Badge>}
      onClose={onClose}
      size="lg"
      footer={
        done ? (
          <Button icon={RotateCcw} loading={setStatus.isPending} onClick={() => setStatus.mutate('new')}>
            Mở lại
          </Button>
        ) : (
          <Button variant="primary" icon={CircleCheck} loading={setStatus.isPending} onClick={() => setStatus.mutate('done')}>
            Đánh dấu đã xử lý
          </Button>
        )
      }
    >
      <KeyValueGrid
        columns={2}
        items={[
          { label: item.type === 'report' ? 'Loại vấn đề' : 'Nhóm góp ý', value: CATEGORY_LABEL[item.category] ?? item.category },
          ...(item.area ? [{ label: 'Xảy ra tại', value: AREA_LABEL[item.area] ?? item.area }] : []),
          { label: 'Email nhận phản hồi', value: <a href={`mailto:${item.email}`}>{item.email}</a> },
          { label: 'Người gửi', value: item.user ? `${item.user.fullName} (${item.user.email})` : '-' },
          { label: 'Gửi lúc', value: formatDateTime(item.createdAt) },
          ...(item.resolvedAt ? [{ label: 'Xử lý lúc', value: formatDateTime(item.resolvedAt) }] : []),
        ]}
      />
      <div className="mt16">
        <div className="form-card-title">Mô tả</div>
        <p className="proposal-note" style={{ whiteSpace: 'pre-wrap' }}>
          {item.description}
        </p>
      </div>
      {item.attachmentUrl && (
        <div className="mt16">
          <div className="form-card-title">Đính kèm</div>
          <a href={item.attachmentUrl} target="_blank" rel="noopener noreferrer">
            {item.attachmentName || 'Mở tệp đính kèm'}
          </a>
        </div>
      )}
    </Drawer>
  )
}
