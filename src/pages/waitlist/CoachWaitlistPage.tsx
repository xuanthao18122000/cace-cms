import { useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bot, Download, SearchX, Trash2 } from 'lucide-react'
import { errorMessage, waitlistApi, type CoachWaitlistEntry, type CoachWaitlistQuery } from '@/api'
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
  type Column,
} from '@/components/ui'
import { useToast } from '@/contexts/toast'
import { useDebounce } from '@/hooks/useDebounce'
import { formatDate, formatDateTime, formatNumber } from '@/utils/format'
import { downloadCsv, toCsv } from './csv'

const QUERY_KEY = ['admin', 'waitlist', 'coach'] as const

/** Danh sách chờ dùng thử Case Coach: tìm, xoá, xuất CSV theo bộ lọc hiện tại */
export function CoachWaitlistPage() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [pageSize, setPageSize] = useState(20)
  const [removing, setRemoving] = useState<CoachWaitlistEntry | null>(null)
  const [exporting, setExporting] = useState(false)
  const debouncedSearch = useDebounce(search.trim(), 350)

  // Đổi bộ lọc thì về trang 1
  const filterKey = `${debouncedSearch}|${pageSize}`
  const [pageState, setPageState] = useState({ key: filterKey, page: 1 })
  const page = pageState.key === filterKey ? pageState.page : 1
  const setPage = (p: number) => setPageState({ key: filterKey, page: p })

  const query: CoachWaitlistQuery = { page, pageSize, q: debouncedSearch }
  const list = useQuery({
    queryKey: [...QUERY_KEY, 'list', query],
    queryFn: ({ signal }) => waitlistApi.listCoach(query, signal),
    placeholderData: keepPreviousData,
  })

  const rows = list.data?.items ?? []
  const total = list.data?.total ?? 0
  const lastPage = Math.max(1, Math.ceil(total / pageSize))
  if (list.data && !list.isPlaceholderData && page > lastPage) setPage(lastPage)

  const remove = useMutation({
    mutationFn: (item: CoachWaitlistEntry) => waitlistApi.removeCoach(item.id),
    onSuccess: (_, item) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      setRemoving(null)
      toast.success(`Đã xoá ${item.email} khỏi danh sách chờ`)
    },
    onError: (err) => toast.error(errorMessage(err)),
  })

  const exportCsv = async () => {
    setExporting(true)
    try {
      const all = await waitlistApi.listAllCoach(debouncedSearch || undefined)
      const csv = toCsv(
        ['Email', 'Họ tên', 'Trường', 'Ghi chú', 'Đã có tài khoản', 'Ngày đăng ký'],
        all.map((r) => [r.email, r.name, r.school, r.note, r.isRegistered ? 'Có' : 'Không', formatDateTime(r.createdAt, '')]),
      )
      const stamp = new Date().toISOString().slice(0, 10)
      downloadCsv(`danh-sach-cho-coach-${stamp}.csv`, csv)
      toast.success(`Đã xuất ${formatNumber(all.length)} dòng`)
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setExporting(false)
    }
  }

  const columns: Column<CoachWaitlistEntry>[] = [
    {
      key: 'person',
      header: 'Người đăng ký',
      main: true,
      skeleton: 'entity',
      render: (r) => <EntityCell avatarName={r.name || r.email} title={r.name || '-'} subtitle={<span className="team-post-email">{r.email}</span>} />,
    },
    { key: 'school', header: 'Trường', hideOnMobile: true, render: (r) => r.school || '-' },
    {
      key: 'created',
      header: 'Ngày đăng ký',
      className: 'nowrap',
      render: (r) => <span title={formatDateTime(r.createdAt)}>{formatDate(r.createdAt)}</span>,
    },
    {
      key: 'registered',
      header: 'Tài khoản',
      skeleton: 'badge',
      render: (r) =>
        r.isRegistered ? (
          <Badge tone="green">Đã có tài khoản</Badge>
        ) : (
          <Badge tone="gray">Khách</Badge>
        ),
    },
    {
      key: 'actions',
      header: <span className="sr-only">Thao tác</span>,
      className: 'actions',
      skeleton: 'none',
      render: (r) => (
        <RowActions>
          <IconButton icon={Trash2} label="Xoá khỏi danh sách chờ" danger onClick={() => setRemoving(r)} />
        </RowActions>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Người dùng' }]}
        title="Danh sách chờ Coach"
        subtitle="Người đăng ký dùng thử Case Coach từ trang chủ web"
        actions={
          <Button icon={Download} onClick={exportCsv} loading={exporting} disabled={total === 0}>
            Xuất CSV
          </Button>
        }
      />

      <Card>
        <FilterBar>
          <SearchBox value={search} onChange={setSearch} placeholder="Tìm email, họ tên hoặc trường" />
          {list.data && <ResultCount>{`${formatNumber(total)} người`}</ResultCount>}
        </FilterBar>

        {list.isError && !list.data ? (
          <ErrorState error={list.error} onRetry={() => list.refetch()} />
        ) : !list.isPending && rows.length === 0 ? (
          debouncedSearch ? (
            <EmptyHero
              icon={SearchX}
              tone="gray"
              title="Không có ai phù hợp"
              message="Thử từ khoá khác."
              actions={<Button onClick={() => setSearch('')}>Xoá bộ lọc</Button>}
            />
          ) : (
            <EmptyHero icon={Bot} title="Chưa có ai đăng ký" message="Người bấm “Đăng ký dùng thử” Case Coach trên web sẽ hiện ở đây." />
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
        title="Xoá khỏi danh sách chờ?"
        message={
          <>
            <b>{removing?.email}</b> sẽ không nhận lời mời dùng thử Case Coach. Không hoàn tác được.
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
