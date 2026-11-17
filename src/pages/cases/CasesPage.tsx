import { useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { LibraryBig, Plus, SearchX } from 'lucide-react'
import { caseApi } from '@/api'
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
import { useTaxonomiesQuery } from '@/hooks/queries'
import { queryKeys } from '@/lib/queryClient'
import type { AdminCaseItem, CaseListQuery, CaseStatus, Difficulty, Taxonomy } from '@/types'
import { formatDate, formatDateTime, formatNumber } from '@/utils/format'
import { CaseCell, CaseStatusBadge, DifficultyBadge, FeaturedStar } from './caseBits'
import { DIFFICULTY_OPTIONS, STATUS_OPTIONS } from './caseLabels'
import { CaseRowMenu } from './CaseRowMenu'
import { useCaseActions } from './useCaseActions'

const toOptions = (list: Taxonomy[] | undefined) =>
  (list ?? []).map((t) => ({ value: t.id, label: t.name, description: t.isActive ? undefined : 'Đang ẩn' }))

export function CasesPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<CaseStatus | ''>('')
  const [fieldId, setFieldId] = useState('')
  const [levelId, setLevelId] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty | ''>('')
  const [pageSize, setPageSize] = useState(20)
  const debouncedSearch = useDebounce(search.trim(), 350)

  // Đổi bộ lọc thì về trang 1: trang gắn với khoá bộ lọc hiện tại
  const filterKey = `${debouncedSearch}|${status}|${fieldId}|${levelId}|${difficulty}|${pageSize}`
  const [pageState, setPageState] = useState({ key: filterKey, page: 1 })
  const page = pageState.key === filterKey ? pageState.page : 1
  const setPage = (p: number) => setPageState({ key: filterKey, page: p })

  const query: CaseListQuery = { page, pageSize, search: debouncedSearch, status, fieldId, levelId, difficulty }
  const cases = useQuery({
    queryKey: queryKeys.caseList(query),
    queryFn: ({ signal }) => caseApi.list(query, signal),
    placeholderData: keepPreviousData,
  })
  const fields = useTaxonomiesQuery('field')
  const levels = useTaxonomiesQuery('level')
  const { actions, dialogs } = useCaseActions()

  const filtered = Boolean(debouncedSearch || status || fieldId || levelId || difficulty)
  const rows = cases.data?.items ?? []
  const total = cases.data?.total ?? 0
  // Tổng giảm (xoá / ẩn / duyệt mục cuối của trang cuối): đưa về trang cuối còn dữ liệu
  const lastPage = Math.max(1, Math.ceil(total / pageSize))
  if (cases.data && !cases.isPlaceholderData && page > lastPage) setPage(lastPage)

  const columns: Column<AdminCaseItem>[] = [
    { key: 'case', header: 'Case', main: true, skeleton: 'entity', render: (c) => <CaseCell item={c} /> },
    { key: 'company', header: 'Công ty', hideOnMobile: true, render: (c) => c.company || <span className="mo">—</span> },
    {
      key: 'taxonomy',
      header: 'Phân loại',
      hideOnMobile: true,
      skeleton: 'badge',
      render: (c) =>
        c.field || c.level ? (
          <span className="badge-stack">
            {c.field && (
              <Badge tone="blue" noDot>
                {c.field.name}
              </Badge>
            )}
            {c.level && (
              <Badge tone="purple" noDot>
                {c.level.name}
              </Badge>
            )}
          </span>
        ) : (
          <span className="mo">—</span>
        ),
    },
    { key: 'difficulty', header: 'Độ khó', skeleton: 'badge', render: (c) => <DifficultyBadge difficulty={c.difficulty} /> },
    { key: 'status', header: 'Trạng thái', skeleton: 'badge', render: (c) => <CaseStatusBadge status={c.status} /> },
    { key: 'featured', header: <span className="sr-only">Nổi bật</span>, skeleton: 'none', render: (c) => <FeaturedStar featured={c.isFeatured} /> },
    { key: 'views', header: 'Lượt xem', hideOnMobile: true, className: 'is-num', render: (c) => <span className="num">{formatNumber(c.viewCount)}</span> },
    {
      key: 'updated',
      header: 'Cập nhật',
      hideOnMobile: true,
      className: 'nowrap',
      render: (c) => <span title={formatDateTime(c.updatedAt)}>{formatDate(c.updatedAt)}</span>,
    },
    {
      key: 'actions',
      header: <span className="sr-only">Thao tác</span>,
      className: 'actions',
      skeleton: 'none',
      render: (c) => (
        <RowActions>
          <CaseRowMenu item={c} actions={actions} />
        </RowActions>
      ),
    },
  ]

  const resetFilters = () => {
    setSearch('')
    setStatus('')
    setFieldId('')
    setLevelId('')
    setDifficulty('')
  }

  const addButton = (
    <Button variant="primary" icon={Plus} onClick={() => navigate('/cases/new')}>
      Thêm case
    </Button>
  )

  return (
    <>
      <PageHeader crumbs={[{ label: 'Nội dung' }]} title="Thư viện case" subtitle="Ngân hàng đề luyện tập hiển thị ở mục Rèn luyện trên web" actions={addButton} />

      <Card>
        <FilterBar>
          <SearchBox value={search} onChange={setSearch} placeholder="Tìm tiêu đề, tóm tắt, công ty" />
          <Select variant="chip" value={status} onChange={(v) => setStatus(v as CaseStatus | '')} placeholder="Mọi trạng thái" aria-label="Lọc theo trạng thái" options={STATUS_OPTIONS} />
          <Select variant="chip" value={fieldId} onChange={setFieldId} placeholder="Mọi lĩnh vực" aria-label="Lọc theo lĩnh vực" options={toOptions(fields.data)} />
          <Select variant="chip" value={levelId} onChange={setLevelId} placeholder="Mọi level" aria-label="Lọc theo level" options={toOptions(levels.data)} />
          <Select
            variant="chip"
            value={difficulty}
            onChange={(v) => setDifficulty(v as Difficulty | '')}
            placeholder="Mọi độ khó"
            aria-label="Lọc theo độ khó"
            options={DIFFICULTY_OPTIONS}
          />
          {cases.data && <ResultCount>{`${formatNumber(total)} case`}</ResultCount>}
        </FilterBar>

        {cases.isError && !cases.data ? (
          <ErrorState error={cases.error} onRetry={() => cases.refetch()} />
        ) : !cases.isPending && rows.length === 0 ? (
          filtered ? (
            <EmptyHero
              icon={SearchX}
              tone="gray"
              title="Không có case phù hợp"
              message="Thử từ khoá khác hoặc bỏ bớt bộ lọc."
              actions={<Button onClick={resetFilters}>Xoá bộ lọc</Button>}
            />
          ) : (
            <EmptyHero icon={LibraryBig} title="Chưa có case" message="Soạn đề đầu tiên cho thư viện luyện tập." actions={addButton} />
          )
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={rows}
              rowKey={(c) => c.id}
              loading={cases.isFetching}
              onRowClick={(c) => navigate(`/cases/${c.id}`)}
              isRowDimmed={(c) => c.status === 'hidden'}
            />
            {total > 0 && <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={setPageSize} />}
          </>
        )}
      </Card>

      {dialogs}
    </>
  )
}
