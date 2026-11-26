import { useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Lock, Pencil, Plus, SearchX, ShieldCheck, Trash2 } from 'lucide-react'
import { errorMessage, roleApi } from '@/api'
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
  ResultCount,
  RowActions,
  SearchBox,
  Tooltip,
  type Column,
} from '@/components/ui'
import { useToast } from '@/contexts/toast'
import { useDebounce } from '@/hooks/useDebounce'
import { queryKeys } from '@/lib/queryClient'
import type { Role } from '@/types'
import { formatNumber } from '@/utils/format'
import { RoleFormDrawer } from './RoleFormDrawer'

/** Lý do không xoá được, null nếu xoá được */
function deleteBlocker(r: Role) {
  if (r.isSystem) return 'Vai trò hệ thống, không thể xoá'
  if (r.userCount > 0) return `Còn ${formatNumber(r.userCount)} người dùng mang vai trò này`
  return null
}

export function RolesPage() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const debounced = useDebounce(search.trim(), 300)
  const [editing, setEditing] = useState<Role | null | undefined>(undefined)
  const [deleting, setDeleting] = useState<Role | null>(null)

  // Không tìm thì dùng chung cache với ô chọn vai trò
  const roles = useQuery({
    queryKey: debounced ? [...queryKeys.roles, 'search', debounced] : queryKeys.roles,
    queryFn: () => roleApi.list(debounced || undefined),
    placeholderData: keepPreviousData,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.roles })
    queryClient.invalidateQueries({ queryKey: queryKeys.stats })
    // Tên vai hiện trong danh sách người dùng
    queryClient.invalidateQueries({ queryKey: queryKeys.users })
  }

  const remove = useMutation({
    mutationFn: (r: Role) => roleApi.remove(r.id),
    onSuccess: (_, r) => {
      invalidate()
      setDeleting(null)
      toast.success(`Đã xoá vai trò ${r.name}`)
    },
    onError: (err) => toast.error(errorMessage(err)),
  })

  const rows = roles.data ?? []

  const columns: Column<Role>[] = [
    {
      key: 'name',
      header: 'Vai trò',
      main: true,
      skeleton: 'entity',
      render: (r) => <EntityCell icon={r.isSystem ? Lock : ShieldCheck} title={r.name} compact />,
    },
    { key: 'code', header: 'Mã', render: (r) => <span className="code-tag">{r.code}</span> },
    {
      key: 'desc',
      header: 'Mô tả',
      hideOnMobile: true,
      className: 'col-desc',
      render: (r) => r.description || <span className="mo">-</span>,
    },
    {
      key: 'system',
      header: 'Loại',
      skeleton: 'badge',
      render: (r) =>
        r.isSystem ? (
          <Badge tone="brand" icon={Lock}>
            Hệ thống
          </Badge>
        ) : (
          <Badge tone="gray" noDot>
            Tuỳ chỉnh
          </Badge>
        ),
    },
    {
      key: 'users',
      header: 'Người dùng',
      className: 'nowrap',
      render: (r) => <b className="num">{formatNumber(r.userCount)}</b>,
    },
    {
      key: 'actions',
      header: <span className="sr-only">Thao tác</span>,
      className: 'actions',
      skeleton: 'none',
      render: (r) => {
        const blocker = deleteBlocker(r)
        return (
          <RowActions>
            <IconButton icon={Pencil} label={`Sửa ${r.name}`} onClick={() => setEditing(r)} />
            <Tooltip text={blocker}>
              <IconButton icon={Trash2} label={blocker ?? `Xoá ${r.name}`} danger disabled={Boolean(blocker)} onClick={() => setDeleting(r)} />
            </Tooltip>
          </RowActions>
        )
      },
    },
  ]

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Người dùng' }]}
        title="Vai trò"
        subtitle="Nhóm người dùng theo vai trò. Chỉ Quản trị viên quản lý người dùng và vai trò."
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setEditing(null)}>
            Thêm vai trò
          </Button>
        }
      />

      <Card>
        <FilterBar>
          <SearchBox value={search} onChange={setSearch} placeholder="Tìm tên hoặc mã vai trò" />
          {roles.data && <ResultCount>{`${formatNumber(rows.length)} vai trò`}</ResultCount>}
        </FilterBar>
        {roles.isError && !roles.data ? (
          <ErrorState error={roles.error} onRetry={() => roles.refetch()} />
        ) : !roles.isPending && rows.length === 0 ? (
          debounced ? (
            <EmptyHero icon={SearchX} tone="gray" title="Không có vai trò phù hợp" message="Thử từ khoá khác." actions={<Button onClick={() => setSearch('')}>Xoá tìm kiếm</Button>} />
          ) : (
            <EmptyHero
              icon={ShieldCheck}
              title="Chưa có vai trò"
              actions={
                <Button variant="primary" icon={Plus} onClick={() => setEditing(null)}>
                  Thêm vai trò
                </Button>
              }
            />
          )
        ) : (
          <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} loading={roles.isFetching} skeletonRows={3} onRowClick={(r) => setEditing(r)} />
        )}
      </Card>

      <p className="page-note">
        <ShieldCheck className="i" aria-hidden="true" /> Phân quyền chi tiết sẽ có ở giai đoạn sau.
      </p>

      <RoleFormDrawer
        open={editing !== undefined}
        role={editing ?? null}
        onClose={() => setEditing(undefined)}
        onSaved={() => {
          invalidate()
          setEditing(undefined)
        }}
      />
      <ConfirmDialog
        open={deleting !== null}
        title="Xoá vai trò?"
        message={
          <>
            Xoá vai trò <b>{deleting?.name}</b> (<span className="mono">{deleting?.code}</span>). Thao tác này không hoàn tác được.
          </>
        }
        confirmLabel="Xoá vai trò"
        danger
        busy={remove.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting)}
      />
    </>
  )
}
