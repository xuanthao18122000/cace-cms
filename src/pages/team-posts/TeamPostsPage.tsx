import { useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Inbox, SearchX, UsersRound } from 'lucide-react'
import { teamPostApi } from '@/api'
import {
  Badge,
  Button,
  Card,
  DataTable,
  EmptyHero,
  EntityCell,
  ErrorState,
  FilterBar,
  PageHeader,
  Pagination,
  ResultCount,
  RowActions,
  SearchBox,
  type Column,
} from '@/components/ui'
import { useDebounce } from '@/hooks/useDebounce'
import { queryKeys } from '@/lib/queryClient'
import type { AdminTeamPost, TeamPostListQuery, TeamPostStatus } from '@/types'
import { formatDate, formatDateTime, formatNumber } from '@/utils/format'
import { RoleChips, TeamPostCell, TeamPostStatusBadge } from './teamPostBits'
import { slotLabel } from './teamPostLabels'
import { TeamPostRowMenu } from './TeamPostRowMenu'
import { useTeamPostActions } from './useTeamPostActions'

const TABS: { key: string; label: string; status: TeamPostStatus | '' }[] = [
  { key: 'all', label: 'Tất cả', status: '' },
  { key: 'open', label: 'Đang tìm', status: 'open' },
  { key: 'paused', label: 'Tạm dừng', status: 'paused' },
  { key: 'closed', label: 'Đã đóng', status: 'closed' },
  { key: 'hidden', label: 'Đã ẩn', status: 'hidden' },
]

const EMPTY_BY_STATUS: Record<TeamPostStatus, string> = {
  open: 'Không có tin nào đang tìm đồng đội',
  closed: 'Chưa có tin nào đã đóng',
  paused: 'Chưa có tin nào đang tạm dừng',
  hidden: 'Chưa có tin nào bị ẩn',
}

export function TeamPostsPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<TeamPostStatus | ''>('')
  const [pageSize, setPageSize] = useState(20)
  const debouncedSearch = useDebounce(search.trim(), 350)

  // Đổi bộ lọc thì về trang 1: trang gắn với khoá bộ lọc hiện tại
  const filterKey = `${debouncedSearch}|${status}|${pageSize}`
  const [pageState, setPageState] = useState({ key: filterKey, page: 1 })
  const page = pageState.key === filterKey ? pageState.page : 1
  const setPage = (p: number) => setPageState({ key: filterKey, page: p })

  const query: TeamPostListQuery = { page, pageSize, q: debouncedSearch, status }
  const posts = useQuery({
    queryKey: queryKeys.teamPostList(query),
    queryFn: ({ signal }) => teamPostApi.list(query, signal),
    placeholderData: keepPreviousData,
  })
  const { actions, dialogs } = useTeamPostActions()

  const rows = posts.data?.items ?? []
  const total = posts.data?.total ?? 0
  // Tổng giảm (xoá / ẩn / duyệt mục cuối của trang cuối): đưa về trang cuối còn dữ liệu
  const lastPage = Math.max(1, Math.ceil(total / pageSize))
  if (posts.data && !posts.isPlaceholderData && page > lastPage) setPage(lastPage)

  const columns: Column<AdminTeamPost>[] = [
    { key: 'post', header: 'Tin tìm đồng đội', main: true, skeleton: 'text', render: (p) => <TeamPostCell item={p} /> },
    {
      key: 'competition',
      header: 'Cuộc thi',
      hideOnMobile: true,
      render: (p) =>
        p.competition ? (
          <span className="team-post-comp">{p.competition.name}</span>
        ) : (
          <Badge tone="purple" noDot>
            Luyện case
          </Badge>
        ),
    },
    {
      key: 'owner',
      header: 'Chủ tin',
      skeleton: 'entity',
      render: (p) => (
        <EntityCell
          avatarName={p.owner.fullName}
          avatarSrc={p.owner.avatarUrl}
          title={p.owner.fullName}
          subtitle={
            <>
              <span className="team-post-email">{p.ownerEmail}</span>
              {p.owner.school && <span className="team-post-school">{p.owner.school}</span>}
            </>
          }
        />
      ),
    },
    { key: 'roles', header: 'Vai trò cần', hideOnMobile: true, skeleton: 'badge', render: (p) => <RoleChips roles={p.rolesNeeded} /> },
    {
      key: 'members',
      header: 'Thành viên',
      className: 'nowrap',
      render: (p) => (
        <span title={p.slots.length ? `Lịch họp: ${p.slots.map(slotLabel).join(', ')}` : undefined}>
          <span className="num">
            {formatNumber(p.memberCount)}/{formatNumber(p.teamSize)}
          </span>
          {p.slots.length > 0 && <span className="entity-sub team-post-slots">{p.slots.map(slotLabel).join(', ')}</span>}
        </span>
      ),
    },
    { key: 'status', header: 'Trạng thái', skeleton: 'badge', render: (p) => <TeamPostStatusBadge status={p.status} /> },
    {
      key: 'created',
      header: 'Ngày đăng',
      hideOnMobile: true,
      className: 'nowrap',
      render: (p) => <span title={formatDateTime(p.createdAt)}>{formatDate(p.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: <span className="sr-only">Thao tác</span>,
      className: 'actions',
      skeleton: 'none',
      render: (p) => (
        <RowActions>
          <TeamPostRowMenu item={p} actions={actions} />
        </RowActions>
      ),
    },
  ]

  const resetFilters = () => {
    setSearch('')
    setStatus('')
  }

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Nội dung' }]}
        title="Tìm Đồng Gà"
        subtitle="Tin tìm đồng đội người học đăng trên web: ẩn tin vi phạm, đóng tin đã đủ người"
      />

      <Card>
        <div className="tabs" role="tablist" aria-label="Lọc theo trạng thái">
          {TABS.map((t) => (
            <button
              key={t.key}
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
          <SearchBox value={search} onChange={setSearch} placeholder="Tìm tiêu đề, tên hoặc email chủ tin" />
          {posts.data && <ResultCount>{`${formatNumber(total)} tin`}</ResultCount>}
        </FilterBar>

        {posts.isError && !posts.data ? (
          <ErrorState error={posts.error} onRetry={() => posts.refetch()} />
        ) : !posts.isPending && rows.length === 0 ? (
          debouncedSearch ? (
            <EmptyHero
              icon={SearchX}
              tone="gray"
              title="Không có tin phù hợp"
              message="Thử từ khoá khác hoặc bỏ bớt bộ lọc."
              actions={<Button onClick={resetFilters}>Xoá bộ lọc</Button>}
            />
          ) : status ? (
            <EmptyHero icon={Inbox} tone="gray" title={EMPTY_BY_STATUS[status]} message="Đổi sang tab khác để xem các tin còn lại." />
          ) : (
            <EmptyHero icon={UsersRound} title="Chưa có tin tìm đồng đội" message="Tin người học đăng ở mục Tìm Đồng Gà trên web sẽ hiện ở đây." />
          )
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={rows}
              rowKey={(p) => p.id}
              loading={posts.isFetching}
              isRowDimmed={(p) => p.status === 'hidden'}
            />
            {total > 0 && <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={setPageSize} />}
          </>
        )}
      </Card>

      {dialogs}
    </>
  )
}
