import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { Pencil, Plus, Radar, Trash2 } from 'lucide-react'
import { errorMessage, skillApi } from '@/api'
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
  type Column,
} from '@/components/ui'
import { useToast } from '@/contexts/toast'
import { queryKeys } from '@/lib/queryClient'
import type { Skill } from '@/types'
import { GrowthSettings } from './GrowthSettings'
import { RoadmapSettings } from './RoadmapSettings'
import { SkillFormDrawer } from './SkillFormDrawer'

const TABS = [
  { key: 'skills', label: 'Kỹ năng' },
  { key: 'growth', label: 'Tăng / giảm điểm' },
  { key: 'roadmap', label: 'Lộ trình đề xuất' },
] as const
type TabKey = (typeof TABS)[number]['key']

/**
 * Kỹ năng & lộ trình: danh sách kỹ năng trên bản đồ năng lực, tham số tăng / giảm điểm sau mỗi bài được chấm,
 * và mẫu lộ trình phát triển theo từng mục tiêu.
 */
export function SkillsPage() {
  const [params, setParams] = useSearchParams()
  const raw = params.get('tab')
  const tab: TabKey = TABS.some((t) => t.key === raw) ? (raw as TabKey) : 'skills'

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Hệ thống' }]}
        title="Kỹ năng & lộ trình"
        subtitle="Bản đồ kỹ năng của người học cập nhật sau mỗi bài được chấm, theo trọng số kỹ năng của từng case và cấu hình bên dưới."
      />
      <Card>
        <div className="tabs" role="tablist" aria-label="Mục cấu hình">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={t.key === tab}
              className={t.key === tab ? 'tab active' : 'tab'}
              onClick={() => setParams({ tab: t.key }, { replace: true })}
            >
              {t.label}
            </button>
          ))}
        </div>
        {tab === 'skills' ? <SkillsTab /> : tab === 'growth' ? <GrowthSettings /> : <RoadmapSettings />}
      </Card>
    </>
  )
}

function SkillsTab() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const list = useQuery({ queryKey: queryKeys.skills, queryFn: skillApi.list })
  const rows = list.data ?? []
  const [editing, setEditing] = useState<Skill | null | undefined>(undefined)
  const [deleting, setDeleting] = useState<Skill | null>(null)
  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.skills })

  const toggle = useMutation({
    mutationFn: (s: Skill) => skillApi.update(s.id, { isActive: !s.isActive }),
    onSuccess: (saved) => {
      invalidate()
      toast.success(saved.isActive ? `Đã bật ${saved.name}` : `Đã ẩn ${saved.name}`)
    },
    onError: (err) => toast.error(errorMessage(err)),
  })
  const remove = useMutation({
    mutationFn: (s: Skill) => skillApi.remove(s.id),
    onSuccess: (_, s) => {
      invalidate()
      setDeleting(null)
      toast.success(`Đã xoá ${s.name}`)
    },
    onError: (err) => {
      setDeleting(null)
      toast.error(errorMessage(err))
    },
  })

  const columns: Column<Skill>[] = [
    {
      key: 'name',
      header: 'Kỹ năng',
      main: true,
      render: (s) => (
        <span className="skill-name">
          <span className="skill-dot" style={{ background: s.color }} aria-hidden />
          <span>
            <span className="entity-title">{s.name}</span>
            {s.description && <span className="entity-sub">{s.description}</span>}
          </span>
        </span>
      ),
    },
    { key: 'code', header: 'Mã', hideOnMobile: true, render: (s) => <span className="code-tag">{s.code}</span> },
    { key: 'icon', header: 'Icon', hideOnMobile: true, render: (s) => <span className="mono">{s.icon}</span> },
    { key: 'sort', header: 'Thứ tự', hideOnMobile: true, className: 'is-num', render: (s) => <span className="num">{s.sortOrder}</span> },
    {
      key: 'active',
      header: 'Đang dùng',
      skeleton: 'badge',
      render: (s) => (
        <RowActions>
          <Switch
            checked={s.isActive}
            onChange={() => toggle.mutate(s)}
            disabled={toggle.isPending && toggle.variables?.id === s.id}
            aria-label={s.isActive ? `Ẩn ${s.name}` : `Bật ${s.name}`}
          />
        </RowActions>
      ),
    },
    {
      key: 'actions',
      header: <span className="sr-only">Thao tác</span>,
      className: 'actions',
      skeleton: 'none',
      render: (s) => (
        <RowActions>
          <IconButton icon={Pencil} label={`Sửa ${s.name}`} onClick={() => setEditing(s)} />
          <IconButton icon={Trash2} label={`Xoá ${s.name}`} danger onClick={() => setDeleting(s)} />
        </RowActions>
      ),
    },
  ]

  const nextSortOrder = rows.length ? Math.max(...rows.map((s) => s.sortOrder)) + 1 : 0

  return (
    <>
      <div className="skills-toolbar">
        <p className="mo">Nên giữ 4-8 kỹ năng để biểu đồ dễ đọc. Gán kỹ năng cho từng case ở trang sửa case (mục "Kỹ năng rèn luyện").</p>
        <Button variant="primary" icon={Plus} onClick={() => setEditing(null)}>
          Thêm kỹ năng
        </Button>
      </div>
      {list.isError && !list.data ? (
        <ErrorState error={list.error} onRetry={() => list.refetch()} />
      ) : !list.isPending && rows.length === 0 ? (
        <EmptyHero
          icon={Radar}
          title="Chưa có kỹ năng"
          message="Thêm các kỹ năng (vd: Tư duy chiến lược, Kỹ năng mềm) để vẽ bản đồ năng lực của người học."
          actions={
            <Button variant="primary" icon={Plus} onClick={() => setEditing(null)}>
              Thêm kỹ năng
            </Button>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(s) => s.id}
          loading={list.isFetching}
          skeletonRows={5}
          onRowClick={(s) => setEditing(s)}
          isRowDimmed={(s) => !s.isActive}
        />
      )}

      <SkillFormDrawer
        open={editing !== undefined}
        skill={editing ?? null}
        nextSortOrder={nextSortOrder}
        onClose={() => setEditing(undefined)}
        onSaved={() => {
          invalidate()
          setEditing(undefined)
        }}
      />
      <ConfirmDialog
        open={deleting !== null}
        title="Xoá kỹ năng?"
        message={
          <>
            Xoá <b>{deleting?.name}</b> sẽ xoá luôn trọng số của kỹ năng này trên các case, điểm và lịch sử của người học. Muốn giữ dữ liệu thì
            tắt "Đang dùng" thay vì xoá.
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
