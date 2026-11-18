import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { FolderTree, Pencil, Plus, Trash2 } from 'lucide-react'
import { errorMessage, taxonomyApi } from '@/api'
import {
  Button,
  Card,
  ConfirmDialog,
  DataTable,
  EmptyHero,
  ErrorState,
  IconButton,
  PageHeader,
  RowActions,
  Switch,
  Tooltip,
  type Column,
} from '@/components/ui'
import { useToast } from '@/contexts/toast'
import { useTaxonomiesQuery } from '@/hooks/queries'
import { queryKeys } from '@/lib/queryClient'
import type { Taxonomy, TaxonomyType } from '@/types'
import { formatNumber } from '@/utils/format'
import { TAXONOMY_LABEL, TAXONOMY_TYPES } from '../cases/caseLabels'
import { TaxonomyFormDrawer } from './TaxonomyFormDrawer'

const isType = (v: string | null): v is TaxonomyType => TAXONOMY_TYPES.includes(v as TaxonomyType)

export function TaxonomiesPage() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [params, setParams] = useSearchParams()
  const raw = params.get('type')
  const type: TaxonomyType = isType(raw) ? raw : 'field'
  const label = TAXONOMY_LABEL[type]

  // Tải cả ba loại để hiện số lượng trên tab (cũng là cache cho bộ lọc case)
  const lists = { field: useTaxonomiesQuery('field'), industry: useTaxonomiesQuery('industry'), level: useTaxonomiesQuery('level') }
  const list = lists[type]
  const rows = list.data ?? []

  // undefined: đóng; null: thêm mới
  const [editing, setEditing] = useState<Taxonomy | null | undefined>(undefined)
  const [deleting, setDeleting] = useState<Taxonomy | null>(null)

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.taxonomies })
    // Tên danh mục hiện trong danh sách case
    queryClient.invalidateQueries({ queryKey: queryKeys.cases })
  }

  const toggle = useMutation({
    mutationFn: (t: Taxonomy) => taxonomyApi.update(t.id, { isActive: !t.isActive }),
    onSuccess: (saved) => {
      queryClient.setQueryData<Taxonomy[]>(queryKeys.taxonomyList(saved.type), (old) => old?.map((t) => (t.id === saved.id ? saved : t)))
      invalidate()
      toast.success(saved.isActive ? `Đã bật ${saved.name}` : `Đã ẩn ${saved.name} khỏi bộ lọc web`)
    },
    onError: (err) => toast.error(errorMessage(err)),
  })

  const remove = useMutation({
    mutationFn: (t: Taxonomy) => taxonomyApi.remove(t.id),
    onSuccess: (_, t) => {
      invalidate()
      setDeleting(null)
      toast.success(`Đã xoá ${t.name}`)
    },
    onError: (err) => {
      setDeleting(null)
      toast.error(errorMessage(err))
    },
  })

  const setType = (t: TaxonomyType) => setParams({ type: t }, { replace: true })

  const columns: Column<Taxonomy>[] = [
    {
      key: 'name',
      header: 'Tên',
      main: true,
      render: (t) => <span className="entity-title">{t.name}</span>,
    },
    { key: 'slug', header: 'Đường dẫn', hideOnMobile: true, render: (t) => <span className="code-tag">{t.slug}</span> },
    {
      key: 'desc',
      header: 'Mô tả',
      hideOnMobile: true,
      className: 'col-desc',
      render: (t) => t.description || <span className="mo">—</span>,
    },
    { key: 'sort', header: 'Thứ tự', hideOnMobile: true, className: 'is-num', render: (t) => <span className="num">{t.sortOrder}</span> },
    {
      key: 'active',
      header: 'Đang dùng',
      skeleton: 'badge',
      render: (t) => (
        <RowActions>
          <Switch
            checked={t.isActive}
            onChange={() => toggle.mutate(t)}
            disabled={toggle.isPending && toggle.variables?.id === t.id}
            aria-label={t.isActive ? `Ẩn ${t.name}` : `Bật ${t.name}`}
          />
        </RowActions>
      ),
    },
    {
      key: 'count',
      header: 'Số case',
      className: 'is-num',
      render: (t) => <b className="num">{formatNumber(t.caseCount)}</b>,
    },
    {
      key: 'actions',
      header: <span className="sr-only">Thao tác</span>,
      className: 'actions',
      skeleton: 'none',
      render: (t) => {
        const blocker = t.caseCount > 0 ? `Còn ${formatNumber(t.caseCount)} case dùng mục này` : null
        return (
          <RowActions>
            <IconButton icon={Pencil} label={`Sửa ${t.name}`} onClick={() => setEditing(t)} />
            <Tooltip text={blocker}>
              <IconButton icon={Trash2} label={blocker ?? `Xoá ${t.name}`} danger disabled={Boolean(blocker)} onClick={() => setDeleting(t)} />
            </Tooltip>
          </RowActions>
        )
      },
    },
  ]

  const nextSortOrder = rows.length ? Math.max(...rows.map((t) => t.sortOrder)) + 1 : 0

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Nội dung' }]}
        title="Danh mục case"
        subtitle="Lĩnh vực, ngành và level dùng để phân loại và lọc case"
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setEditing(null)}>
            Thêm {label.toLowerCase()}
          </Button>
        }
      />

      <Card>
        <div className="tabs" role="tablist" aria-label="Loại danh mục">
          {TAXONOMY_TYPES.map((t) => (
            <button key={t} type="button" role="tab" aria-selected={t === type} className={t === type ? 'tab active' : 'tab'} onClick={() => setType(t)}>
              {TAXONOMY_LABEL[t]}
              {lists[t].data && <span className="tab-count">{lists[t].data.length}</span>}
            </button>
          ))}
        </div>
        {list.isError && !list.data ? (
          <ErrorState error={list.error} onRetry={() => list.refetch()} />
        ) : !list.isPending && rows.length === 0 ? (
          <EmptyHero
            icon={FolderTree}
            title={`Chưa có ${label.toLowerCase()}`}
            actions={
              <Button variant="primary" icon={Plus} onClick={() => setEditing(null)}>
                Thêm {label.toLowerCase()}
              </Button>
            }
          />
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(t) => t.id}
            loading={list.isFetching}
            skeletonRows={4}
            onRowClick={(t) => setEditing(t)}
            isRowDimmed={(t) => !t.isActive}
          />
        )}
      </Card>

      <TaxonomyFormDrawer
        open={editing !== undefined}
        type={type}
        taxonomy={editing ?? null}
        nextSortOrder={nextSortOrder}
        onClose={() => setEditing(undefined)}
        onSaved={() => {
          invalidate()
          setEditing(undefined)
        }}
      />
      <ConfirmDialog
        open={deleting !== null}
        title={`Xoá ${label.toLowerCase()}?`}
        message={
          <>
            Xoá <b>{deleting?.name}</b> khỏi danh mục {label.toLowerCase()}. Thao tác này không hoàn tác được.
          </>
        }
        confirmLabel="Xoá"
        danger
        busy={remove.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting)}
      />
    </>
  )
}
