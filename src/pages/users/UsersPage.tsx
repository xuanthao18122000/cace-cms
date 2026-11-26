import { useEffect, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, SearchX, Users } from 'lucide-react'
import { userApi } from '@/api'
import {
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
  Select,
  type Column,
} from '@/components/ui'
import { useAuth } from '@/contexts/auth'
import { useDebounce } from '@/hooks/useDebounce'
import { useRolesQuery } from '@/hooks/queries'
import { queryKeys } from '@/lib/queryClient'
import type { User, UserListQuery, UserStatus } from '@/types'
import { formatDate, formatDateTime, formatNumber, formatRelative } from '@/utils/format'
import { PremiumBadge, RoleBadge, StatusBadge, VerifiedBadge } from './userBits'
import { STATUS_OPTIONS } from './userLabels'
import { UserRowMenu } from './UserRowMenu'
import { useUserActions } from './useUserActions'

export function UsersPage() {
  const { user: me } = useAuth()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [roleId, setRoleId] = useState('')
  const [status, setStatus] = useState<UserStatus | ''>('')
  const [pageSize, setPageSize] = useState(20)
  const debouncedSearch = useDebounce(search.trim(), 350)

  // Đổi bộ lọc thì về trang 1: trang gắn với khoá bộ lọc hiện tại
  const filterKey = `${debouncedSearch}|${roleId}|${status}|${pageSize}`
  const [pageState, setPageState] = useState({ key: filterKey, page: 1 })
  const page = pageState.key === filterKey ? pageState.page : 1
  const setPage = (p: number) => setPageState({ key: filterKey, page: p })

  const query: UserListQuery = { page, pageSize, search: debouncedSearch, roleId, status }
  const users = useQuery({
    queryKey: queryKeys.userList(query),
    queryFn: ({ signal }) => userApi.list(query, signal),
    placeholderData: keepPreviousData,
  })
  const roles = useRolesQuery()

  // Lối tắt từ dashboard: /users?new=1 mở sẵn drawer thêm mới
  const [startWithCreate] = useState(() => params.get('new') === '1')
  useEffect(() => {
    if (params.has('new')) setParams((p) => {
      p.delete('new')
      return p
    }, { replace: true })
  }, [params, setParams])

  const { actions, dialogs } = useUserActions({ initialCreate: startWithCreate, onCreated: (u) => navigate(`/users/${u.id}`) })

  const filtered = Boolean(debouncedSearch || roleId || status)
  const rows = users.data?.items ?? []
  const total = users.data?.total ?? 0
  // Tổng giảm (xoá / ẩn / duyệt mục cuối của trang cuối): đưa về trang cuối còn dữ liệu
  const lastPage = Math.max(1, Math.ceil(total / pageSize))
  if (users.data && !users.isPlaceholderData && page > lastPage) setPage(lastPage)

  const columns: Column<User>[] = [
    {
      key: 'name',
      header: 'Người dùng',
      main: true,
      skeleton: 'entity',
      render: (u) => (
        <EntityCell
          avatarName={u.fullName}
          avatarSrc={u.avatarUrl}
          title={
            <>
              <Link to={`/users/${u.id}`} onClick={(e) => e.stopPropagation()}>
                {u.fullName}
              </Link>
              {u.id === me?.id && <span className="mo"> (bạn)</span>}
              {u.isPremium && (
                <>
                  {' '}
                  <PremiumBadge user={u} />
                </>
              )}
            </>
          }
          subtitle={u.email}
        />
      ),
    },
    { key: 'role', header: 'Vai trò', skeleton: 'badge', render: (u) => <RoleBadge role={u.role} /> },
    { key: 'status', header: 'Trạng thái', skeleton: 'badge', render: (u) => <StatusBadge status={u.status} /> },
    { key: 'verified', header: 'Email', hideOnMobile: true, skeleton: 'badge', render: (u) => <VerifiedBadge verified={u.emailVerified} /> },
    {
      key: 'login',
      header: 'Đăng nhập gần nhất',
      hideOnMobile: true,
      className: 'nowrap',
      render: (u) =>
        u.lastLoginAt ? <span title={formatDateTime(u.lastLoginAt)}>{formatRelative(u.lastLoginAt)}</span> : <span className="mo">Chưa đăng nhập</span>,
    },
    { key: 'created', header: 'Ngày tạo', hideOnMobile: true, className: 'nowrap', render: (u) => formatDate(u.createdAt) },
    {
      key: 'actions',
      header: <span className="sr-only">Thao tác</span>,
      className: 'actions',
      skeleton: 'none',
      render: (u) => (
        <RowActions>
          <UserRowMenu user={u} isSelf={u.id === me?.id} actions={actions} />
        </RowActions>
      ),
    },
  ]

  const resetFilters = () => {
    setSearch('')
    setRoleId('')
    setStatus('')
  }

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Người dùng' }]}
        title="Người dùng"
        subtitle="Tài khoản người học, mentor và quản trị viên của CACE"
        actions={
          <Button variant="primary" icon={Plus} onClick={actions.openCreate}>
            Thêm người dùng
          </Button>
        }
      />

      <Card>
        <FilterBar>
          <SearchBox value={search} onChange={setSearch} placeholder="Tìm tên, email, số điện thoại" />
          <Select
            variant="chip"
            value={roleId}
            onChange={setRoleId}
            placeholder="Tất cả vai trò"
            aria-label="Lọc theo vai trò"
            options={(roles.data ?? []).map((r) => ({ value: r.id, label: r.name }))}
          />
          <Select
            variant="chip"
            value={status}
            onChange={(v) => setStatus(v as UserStatus | '')}
            placeholder="Mọi trạng thái"
            aria-label="Lọc theo trạng thái"
            options={STATUS_OPTIONS}
          />
          {users.data && <ResultCount>{`${formatNumber(total)} người dùng`}</ResultCount>}
        </FilterBar>

        {users.isError && !users.data ? (
          <ErrorState error={users.error} onRetry={() => users.refetch()} />
        ) : !users.isPending && rows.length === 0 ? (
          filtered ? (
            <EmptyHero
              icon={SearchX}
              tone="gray"
              title="Không có người dùng phù hợp"
              message="Thử từ khoá khác hoặc bỏ bớt bộ lọc."
              actions={<Button onClick={resetFilters}>Xoá bộ lọc</Button>}
            />
          ) : (
            <EmptyHero
              icon={Users}
              title="Chưa có người dùng"
              message="Tạo tài khoản đầu tiên cho đội ngũ vận hành hoặc mentor."
              actions={
                <Button variant="primary" icon={Plus} onClick={actions.openCreate}>
                  Thêm người dùng
                </Button>
              }
            />
          )
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={rows}
              rowKey={(u) => u.id}
              loading={users.isFetching}
              onRowClick={(u) => navigate(`/users/${u.id}`)}
              isRowDimmed={(u) => u.status === 'locked'}
            />
            {total > 0 && (
              <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={setPageSize} />
            )}
          </>
        )}
      </Card>

      {dialogs}
    </>
  )
}
