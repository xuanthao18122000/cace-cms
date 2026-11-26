import { useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CircleCheck, ExternalLink, Lightbulb, RotateCcw, SearchX, Trash2 } from 'lucide-react'
import { errorMessage } from '@/api'
import {
  competitionSuggestionApi,
  type CompetitionSuggestion,
  type CompetitionSuggestionQuery,
  type CompetitionSuggestionStatus,
} from '@/api/http/competitionSuggestions'
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  DataTable,
  EmptyHero,
  EntityCell,
  ErrorState,
  FilterBar,
  IconButton,
  PageHeader,
  Pagination,
  ResultCount,
  RowActions,
  SearchBox,
  Select,
  type Column,
} from '@/components/ui'
import { useToast } from '@/contexts/toast'
import { useDebounce } from '@/hooks/useDebounce'
import { formatDate, formatDateTime, formatNumber } from '@/utils/format'

const QUERY_KEY = ['admin', 'competition-suggestions'] as const
const STATUS_OPTIONS = [
  { value: 'new', label: 'Mới' },
  { value: 'done', label: 'Đã xử lý' },
]

/** Gợi ý cuộc thi khách gửi từ nút "Gợi ý cuộc thi" trên web: xem, đánh dấu đã xử lý, xoá */
export function CompetitionSuggestionsPage() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<CompetitionSuggestionStatus | ''>('new')
  const [pageSize, setPageSize] = useState(20)
  const [removing, setRemoving] = useState<CompetitionSuggestion | null>(null)
  const debouncedSearch = useDebounce(search.trim(), 350)

  const filterKey = `${debouncedSearch}|${status}|${pageSize}`
  const [pageState, setPageState] = useState({ key: filterKey, page: 1 })
  const page = pageState.key === filterKey ? pageState.page : 1
  const setPage = (p: number) => setPageState({ key: filterKey, page: p })

  const query: CompetitionSuggestionQuery = { page, pageSize, status, search: debouncedSearch }
  const list = useQuery({
    queryKey: [...QUERY_KEY, 'list', query],
    queryFn: ({ signal }) => competitionSuggestionApi.list(query, signal),
    placeholderData: keepPreviousData,
  })

  const rows = list.data?.items ?? []
  const total = list.data?.total ?? 0
  const lastPage = Math.max(1, Math.ceil(total / pageSize))
  if (list.data && !list.isPlaceholderData && page > lastPage) setPage(lastPage)

  const mark = useMutation({
    mutationFn: ({ item, next }: { item: CompetitionSuggestion; next: CompetitionSuggestionStatus }) => competitionSuggestionApi.setStatus(item.id, next),
    onSuccess: (_, { item, next }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      toast.success(next === 'done' ? `Đã xử lý “${item.name}”` : `Đã chuyển “${item.name}” về Mới`)
    },
    onError: (err) => toast.error(errorMessage(err)),
  })

  const remove = useMutation({
    mutationFn: (item: CompetitionSuggestion) => competitionSuggestionApi.remove(item.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      setRemoving(null)
      toast.success('Đã xoá gợi ý')
    },
    onError: (err) => toast.error(errorMessage(err)),
  })

  const columns: Column<CompetitionSuggestion>[] = [
    {
      key: 'name',
      header: 'Cuộc thi',
      main: true,
      skeleton: 'entity',
      render: (r) => (
        <EntityCell
          icon={Lightbulb}
          title={r.name}
          subtitle={
            r.url ? (
              <a href={r.url} target="_blank" rel="noopener noreferrer" className="team-post-email">
                {r.url} <ExternalLink size={12} aria-hidden />
              </a>
            ) : (
              <span className="mo">Không có link</span>
            )
          }
        />
      ),
    },
    {
      key: 'from',
      header: 'Người gửi',
      hideOnMobile: true,
      render: (r) => (
        <div>
          <a href={`mailto:${r.email}`}>{r.email}</a>
          <div className="mo">{r.userName ? `Tài khoản: ${r.userName}` : 'Khách'}</div>
        </div>
      ),
    },
    { key: 'note', header: 'Ghi chú', hideOnMobile: true, render: (r) => <span className="proposal-note">{r.note || '-'}</span> },
    {
      key: 'created',
      header: 'Ngày gửi',
      className: 'nowrap',
      render: (r) => <span title={formatDateTime(r.createdAt)}>{formatDate(r.createdAt)}</span>,
    },
    {
      key: 'status',
      header: 'Trạng thái',
      skeleton: 'badge',
      render: (r) => (r.status === 'done' ? <Badge tone="green">Đã xử lý</Badge> : <Badge tone="brand">Mới</Badge>),
    },
    {
      key: 'actions',
      header: <span className="sr-only">Thao tác</span>,
      className: 'actions',
      skeleton: 'none',
      render: (r) => (
        <RowActions>
          {r.status === 'new' ? (
            <IconButton icon={CircleCheck} label="Đánh dấu đã xử lý" disabled={mark.isPending} onClick={() => mark.mutate({ item: r, next: 'done' })} />
          ) : (
            <IconButton icon={RotateCcw} label="Chuyển về Mới" disabled={mark.isPending} onClick={() => mark.mutate({ item: r, next: 'new' })} />
          )}
          <IconButton icon={Trash2} label="Xoá gợi ý" danger onClick={() => setRemoving(r)} />
        </RowActions>
      ),
    },
  ]

  const filtered = Boolean(debouncedSearch || status)

  return (
    <>
      <PageHeader crumbs={[{ label: 'Nội dung' }, { label: 'Cuộc thi' }]} title="Gợi ý cuộc thi" subtitle="Cuộc thi người dùng gợi ý từ trang Cuộc thi trên web" />

      <Card>
        <FilterBar>
          <SearchBox value={search} onChange={setSearch} placeholder="Tìm tên cuộc thi, email hoặc link" />
          <Select
            variant="chip"
            value={status}
            onChange={(v) => setStatus(v as CompetitionSuggestionStatus | '')}
            placeholder="Mọi trạng thái"
            aria-label="Lọc theo trạng thái"
            options={STATUS_OPTIONS}
          />
          {list.data && <ResultCount>{`${formatNumber(total)} gợi ý`}</ResultCount>}
        </FilterBar>

        {list.isError && !list.data ? (
          <ErrorState error={list.error} onRetry={() => list.refetch()} />
        ) : !list.isPending && rows.length === 0 ? (
          filtered ? (
            <EmptyHero
              icon={SearchX}
              tone="gray"
              title="Không có gợi ý phù hợp"
              message={status === 'new' && !debouncedSearch ? 'Đã xử lý hết gợi ý mới.' : 'Thử bộ lọc khác.'}
              actions={
                <Button
                  onClick={() => {
                    setSearch('')
                    setStatus('')
                  }}
                >
                  Xem tất cả
                </Button>
              }
            />
          ) : (
            <EmptyHero icon={Lightbulb} title="Chưa có gợi ý nào" message="Người dùng bấm “Gợi ý cuộc thi” trên web sẽ hiện ở đây." />
          )
        ) : (
          <>
            <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} loading={list.isFetching} />
            {total > 0 && <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={setPageSize} />}
          </>
        )}
      </Card>

      <ConfirmDialog
        open={removing !== null}
        title="Xoá gợi ý?"
        message={
          <>
            Gợi ý <b>{removing?.name}</b> sẽ bị xoá. Không hoàn tác được.
          </>
        }
        confirmLabel="Xoá"
        danger
        busy={remove.isPending}
        onClose={() => setRemoving(null)}
        onConfirm={() => removing && remove.mutate(removing)}
      />
    </>
  )
}
