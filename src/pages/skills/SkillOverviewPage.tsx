import { useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Radar, SearchX, UserRound } from 'lucide-react'
import { skillApi } from '@/api'
import {
  Button,
  Card,
  DataTable,
  Drawer,
  EmptyHero,
  EntityCell,
  ErrorState,
  FilterBar,
  PageHeader,
  Pagination,
  ResultCount,
  SearchBox,
  Select,
  type Column,
} from '@/components/ui'
import { useAuth } from '@/contexts/auth'
import { useDebounce } from '@/hooks/useDebounce'
import { isAdmin } from '@/hooks/useIsAdmin'
import { queryKeys } from '@/lib/queryClient'
import type { SkillOverviewQuery, SkillOverviewRow } from '@/types'
import { formatDateTime, formatRelative } from '@/utils/format'
import { UserSkillsPanel } from './UserSkillsPanel'

/** Ô điểm một kỹ năng: số + thanh nhỏ theo màu kỹ năng. */
function ScoreCell({ value, color }: { value: number; color: string }) {
  return (
    <span className="score-cell" title={`${value}/100`}>
      <span className="num">{value}</span>
      <span className="score-cell-track" aria-hidden>
        <span style={{ width: `${value}%`, background: color }} />
      </span>
    </span>
  )
}

/**
 * Kỹ năng người học: mỗi người một dòng, điểm từng kỹ năng sau các bài được chấm. Bấm một dòng để xem bản đồ kỹ năng
 * và lịch sử thay đổi của người đó.
 */
export function SkillOverviewPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('avg')
  const [pageSize, setPageSize] = useState(20)
  const debounced = useDebounce(search.trim(), 350)
  const filterKey = `${debounced}|${sort}|${pageSize}`
  const [pageState, setPageState] = useState({ key: filterKey, page: 1 })
  const page = pageState.key === filterKey ? pageState.page : 1
  const [viewing, setViewing] = useState<SkillOverviewRow | null>(null)

  const skills = useQuery({ queryKey: queryKeys.skills, queryFn: skillApi.list })
  const active = (skills.data ?? []).filter((s) => s.isActive)
  const query: SkillOverviewQuery = { page, pageSize, search: debounced || undefined, sort }
  const list = useQuery({
    queryKey: queryKeys.skillOverview(query),
    queryFn: ({ signal }) => skillApi.overview(query, signal),
    placeholderData: keepPreviousData,
  })
  const rows = list.data?.items ?? []
  const total = list.data?.total ?? 0

  const columns: Column<SkillOverviewRow>[] = [
    {
      key: 'user',
      header: 'Người học',
      main: true,
      skeleton: 'entity',
      render: (r) => (
        <EntityCell
          avatarName={r.user.fullName}
          avatarSrc={r.user.avatarUrl}
          title={r.user.fullName}
          subtitle={r.user.school ?? r.user.email}
        />
      ),
    },
    ...active.map<Column<SkillOverviewRow>>((s) => ({
      key: `skill-${s.code}`,
      header: (
        <span className="skill-name" title={s.name}>
          <span className="skill-dot" style={{ background: s.color }} aria-hidden />
          {s.name}
        </span>
      ),
      hideOnMobile: true,
      render: (r) => <ScoreCell value={r.values[s.code] ?? 0} color={s.color} />,
    })),
    { key: 'avg', header: 'Trung bình', className: 'is-num', render: (r) => <b className="num">{r.average}</b> },
    { key: 'graded', header: 'Bài chấm', className: 'is-num', hideOnMobile: true, render: (r) => <span className="num">{r.gradedCases}</span> },
    {
      key: 'last',
      header: 'Cập nhật',
      className: 'nowrap',
      hideOnMobile: true,
      render: (r) => (r.lastChangedAt ? <span title={formatDateTime(r.lastChangedAt)}>{formatRelative(r.lastChangedAt)}</span> : '-'),
    },
  ]

  const sortOptions = [
    { value: 'avg', label: 'Điểm trung bình cao nhất' },
    { value: 'graded', label: 'Nhiều bài được chấm nhất' },
    ...active.map((s) => ({ value: s.code, label: `${s.name} cao nhất` })),
  ]

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Nội dung' }]}
        title="Kỹ năng người học"
        subtitle="Tổng quan kỹ năng giải case của từng người, cập nhật sau mỗi bài được chấm. Chỉ hiện người đã có ít nhất một bài được chấm."
      />
      <Card>
        <FilterBar>
          <SearchBox value={search} onChange={setSearch} placeholder="Tìm tên, email hoặc trường" />
          <Select variant="chip" placeholder="Sắp xếp" value={sort} options={sortOptions} onChange={(v) => setSort(v || 'avg')} aria-label="Sắp xếp" />
          {list.data && <ResultCount>{`${total} người học`}</ResultCount>}
        </FilterBar>
        {list.isError && !list.data ? (
          <ErrorState error={list.error} onRetry={() => list.refetch()} />
        ) : !list.isPending && rows.length === 0 ? (
          debounced ? (
            <EmptyHero icon={SearchX} tone="gray" title="Không có người học phù hợp" message="Thử từ khoá khác." />
          ) : (
            <EmptyHero icon={Radar} title="Chưa có bản đồ kỹ năng" message="Người học có bài được mentor chấm sẽ hiện ở đây." />
          )
        ) : (
          <>
            <DataTable columns={columns} rows={rows} rowKey={(r) => r.user.id} loading={list.isFetching} onRowClick={setViewing} />
            {total > 0 && (
              <Pagination
                page={page}
                pageSize={pageSize}
                total={total}
                onPageChange={(p) => setPageState({ key: filterKey, page: p })}
                onPageSizeChange={setPageSize}
              />
            )}
          </>
        )}
      </Card>
      {viewing && (
        <Drawer
          open
          title={viewing.user.fullName}
          subtitle={`${viewing.gradedCases} bài được chấm · trung bình ${viewing.average}/100`}
          onClose={() => setViewing(null)}
          size="lg"
          footer={
            isAdmin(user) && (
            <Button icon={UserRound} onClick={() => navigate(`/users/${viewing.user.id}`)}>
              Xem tài khoản
            </Button>
            )
          }
        >
          <UserSkillsPanel userId={viewing.user.id} />
        </Drawer>
      )}
    </>
  )
}
