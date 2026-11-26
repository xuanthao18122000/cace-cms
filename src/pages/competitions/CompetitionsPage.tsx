import { useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Inbox, Plus, SearchX, Trophy } from 'lucide-react'
import { competitionApi } from '@/api'
import {
  Badge,
  Button,
  Card,
  DataTable,
  EmptyHero,
  ErrorState,
  FilterBar,
  PageHeader,
  Pagination,
  ResultCount,
  RowActions,
  SearchBox,
  Select,
  type Column,
} from '@/components/ui'
import { useDebounce } from '@/hooks/useDebounce'
import { queryKeys } from '@/lib/queryClient'
import type { AdminCompetition, CompetitionListQuery, CompetitionPhase, CompetitionStatus } from '@/types'
import { formatNumber } from '@/utils/format'
import { FeaturedStar } from '../cases/caseBits'
import { CompetitionCell, CompetitionStatusBadge, PhaseBadge } from './competitionBits'
import { formatDeadline, PHASE_OPTIONS, STATUS_OPTIONS } from './competitionLabels'
import { CompetitionRowMenu } from './CompetitionRowMenu'
import { useCompetitionActions } from './useCompetitionActions'

type Source = boolean | ''

/** Lối tắt hay dùng khi duyệt đề xuất; ô chọn trạng thái vẫn có đủ 5 trạng thái */
const TABS: { key: string; label: string; status: CompetitionStatus | ''; proposed: Source }[] = [
  { key: 'all', label: 'Tất cả', status: '', proposed: '' },
  { key: 'pending', label: 'Chờ duyệt', status: 'pending', proposed: '' },
  { key: 'rejected', label: 'Đã từ chối', status: 'rejected', proposed: '' },
  { key: 'admin', label: 'Admin đăng', status: '', proposed: false },
]

export function CompetitionsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<CompetitionStatus | ''>('')
  const [phase, setPhase] = useState<CompetitionPhase | ''>('')
  const [proposed, setProposed] = useState<Source>('')
  const [pageSize, setPageSize] = useState(20)
  const debouncedSearch = useDebounce(search.trim(), 350)

  // Đổi bộ lọc thì về trang 1: trang gắn với khoá bộ lọc hiện tại
  const filterKey = `${debouncedSearch}|${status}|${phase}|${proposed}|${pageSize}`
  const [pageState, setPageState] = useState({ key: filterKey, page: 1 })
  const page = pageState.key === filterKey ? pageState.page : 1
  const setPage = (p: number) => setPageState({ key: filterKey, page: p })

  const query: CompetitionListQuery = { page, pageSize, search: debouncedSearch, status, phase, proposed }
  const competitions = useQuery({
    queryKey: queryKeys.competitionList(query),
    queryFn: ({ signal }) => competitionApi.list(query, signal),
    placeholderData: keepPreviousData,
  })
  // Số đề xuất chờ duyệt cho tab lối tắt
  const pendingQuery: CompetitionListQuery = { page: 1, pageSize: 1, status: 'pending' }
  const pendingCount = useQuery({ queryKey: queryKeys.competitionList(pendingQuery), queryFn: ({ signal }) => competitionApi.list(pendingQuery, signal) })
  const { actions, dialogs } = useCompetitionActions()

  // Tab "Admin đăng" giữ sáng khi lọc thêm trạng thái; các tab khác cần khớp đúng
  const activeTab = proposed === false ? 'admin' : TABS.find((t) => t.proposed === proposed && t.status === status)?.key
  const selectTab = (t: (typeof TABS)[number]) => {
    setStatus(t.status)
    setProposed(t.proposed)
  }

  const filtered = Boolean(debouncedSearch || status || phase || proposed !== '')
  const rows = competitions.data?.items ?? []
  const total = competitions.data?.total ?? 0
  // Tổng giảm (xoá / ẩn / duyệt mục cuối của trang cuối): đưa về trang cuối còn dữ liệu
  const lastPage = Math.max(1, Math.ceil(total / pageSize))
  if (competitions.data && !competitions.isPlaceholderData && page > lastPage) setPage(lastPage)

  const columns: Column<AdminCompetition>[] = [
    { key: 'competition', header: 'Cuộc thi', main: true, skeleton: 'entity', render: (c) => <CompetitionCell item={c} /> },
    {
      key: 'field',
      header: 'Lĩnh vực',
      hideOnMobile: true,
      skeleton: 'badge',
      render: (c) =>
        c.field ? (
          <Badge tone="blue" noDot>
            {c.field}
          </Badge>
        ) : (
          <span className="mo">-</span>
        ),
    },
    {
      key: 'deadline',
      header: 'Hạn đăng ký',
      className: 'nowrap',
      render: (c) => (
        <span className="badge-stack">
          <span className="num">{formatDeadline(c.registrationDeadline)}</span>
          <PhaseBadge phase={c.phase} />
        </span>
      ),
    },
    {
      key: 'event',
      header: 'Ngày thi',
      hideOnMobile: true,
      className: 'nowrap',
      render: (c) => (c.eventDate ? <span className="num">{formatDeadline(c.eventDate)}</span> : <span className="mo">-</span>),
    },
    { key: 'status', header: 'Trạng thái', skeleton: 'badge', render: (c) => <CompetitionStatusBadge status={c.status} /> },
    { key: 'featured', header: <span className="sr-only">Nổi bật</span>, skeleton: 'none', render: (c) => <FeaturedStar featured={c.isFeatured} /> },
    {
      key: 'actions',
      header: <span className="sr-only">Thao tác</span>,
      className: 'actions',
      skeleton: 'none',
      render: (c) => (
        <RowActions>
          <CompetitionRowMenu item={c} actions={actions} />
        </RowActions>
      ),
    },
  ]

  const resetFilters = () => {
    setSearch('')
    setStatus('')
    setPhase('')
    setProposed('')
  }

  const addButton = (
    <Button variant="primary" icon={Plus} onClick={() => navigate('/competitions/new')}>
      Thêm cuộc thi
    </Button>
  )

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Nội dung' }]}
        title="Cuộc thi"
        subtitle="Các cuộc thi case hiển thị cho người học trên web, gồm cả đề xuất người dùng gửi lên"
        actions={addButton}
      />

      <Card>
        <div className="tabs" role="tablist" aria-label="Lọc nhanh">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={t.key === activeTab}
              className={t.key === activeTab ? 'tab active' : 'tab'}
              onClick={() => selectTab(t)}
            >
              {t.label}
              {t.key === 'pending' && pendingCount.data && <span className="tab-count">{formatNumber(pendingCount.data.total)}</span>}
            </button>
          ))}
        </div>
        <FilterBar>
          <SearchBox value={search} onChange={setSearch} placeholder="Tìm tên cuộc thi, đơn vị tổ chức" />
          <Select
            variant="chip"
            value={status}
            onChange={(v) => setStatus(v as CompetitionStatus | '')}
            placeholder="Mọi trạng thái"
            aria-label="Lọc theo trạng thái"
            options={STATUS_OPTIONS}
          />
          <Select
            variant="chip"
            value={phase}
            onChange={(v) => setPhase(v as CompetitionPhase | '')}
            placeholder="Mọi giai đoạn"
            aria-label="Lọc theo giai đoạn đăng ký"
            options={PHASE_OPTIONS}
          />
          {competitions.data && <ResultCount>{`${formatNumber(total)} cuộc thi`}</ResultCount>}
        </FilterBar>

        {competitions.isError && !competitions.data ? (
          <ErrorState error={competitions.error} onRetry={() => competitions.refetch()} />
        ) : !competitions.isPending && rows.length === 0 ? (
          status === 'pending' && !debouncedSearch && !phase && proposed === '' ? (
            <EmptyHero icon={Inbox} tone="gray" title="Không có đề xuất chờ duyệt" message="Đề xuất cuộc thi người dùng gửi lên sẽ hiện ở đây." />
          ) : filtered ? (
            <EmptyHero
              icon={SearchX}
              tone="gray"
              title="Không có cuộc thi phù hợp"
              message="Thử từ khoá khác hoặc bỏ bớt bộ lọc."
              actions={<Button onClick={resetFilters}>Xoá bộ lọc</Button>}
            />
          ) : (
            <EmptyHero icon={Trophy} title="Chưa có cuộc thi" message="Thêm cuộc thi đầu tiên để người học đăng ký tham gia." actions={addButton} />
          )
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={rows}
              rowKey={(c) => c.id}
              loading={competitions.isFetching}
              onRowClick={(c) => navigate(`/competitions/${c.id}`)}
              isRowDimmed={(c) => c.status === 'hidden' || c.status === 'rejected'}
            />
            {total > 0 && <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={setPageSize} />}
          </>
        )}
      </Card>

      {dialogs}
    </>
  )
}
