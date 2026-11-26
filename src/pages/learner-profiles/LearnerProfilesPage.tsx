import { useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { BadgeCheck, CircleX, Inbox, SearchX, UserRoundCheck } from 'lucide-react'
import { approvalApi, errorMessage, learnerProfileApi, skillApi } from '@/api'
import {
  Badge,
  Button,
  Card,
  DataTable,
  Dialog,
  Drawer,
  EmptyHero,
  EntityCell,
  ErrorState,
  Field,
  FilterBar,
  KeyValueGrid,
  PageHeader,
  Pagination,
  ResultCount,
  SearchBox,
  Textarea,
  type Column,
} from '@/components/ui'
import { useToast } from '@/contexts/toast'
import { useDebounce } from '@/hooks/useDebounce'
import { queryKeys } from '@/lib/queryClient'
import type { AdminLearnerProfile, LearnerProfileListQuery, LearnerReviewStatus } from '@/types'
import { formatDateTime, formatRelative } from '@/utils/format'
import { ApprovalProgress } from '../competitions/CompetitionProposalCard'
import { RoleChips } from '../team-posts/teamPostBits'
import { slotLabel } from '../team-posts/teamPostLabels'
import { GOAL_LABEL, LEARNER_TYPE_LABEL, REVIEW_LABEL, REVIEW_TONE } from './learnerLabels'

const TABS: { label: string; status: LearnerReviewStatus | '' }[] = [
  { label: 'Chờ duyệt', status: 'pending' },
  { label: 'Đã duyệt', status: 'approved' },
  { label: 'Từ chối', status: 'rejected' },
  { label: 'Tất cả', status: '' },
]

/**
 * Hồ sơ rèn luyện người học gửi từ Tìm đồng đội (mục tiêu + câu hỏi cơ bản). Duyệt xong hồ sơ hiện trong danh bạ
 * và mở khoá giải case nhóm. Có Cấu hình duyệt nhiều cấp thì chỉ người duyệt cấp hiện tại bấm được.
 */
export function LearnerProfilesPage() {
  const [params, setParams] = useSearchParams()
  const focusUser = params.get('user') ?? ''
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<LearnerReviewStatus | ''>(focusUser ? '' : 'pending')
  const [pageSize, setPageSize] = useState(20)
  const debounced = useDebounce(search.trim(), 350)
  const filterKey = `${debounced}|${status}|${pageSize}|${focusUser}`
  const [pageState, setPageState] = useState({ key: filterKey, page: 1 })
  const page = pageState.key === filterKey ? pageState.page : 1
  const setPage = (p: number) => setPageState({ key: filterKey, page: p })
  const [viewingId, setViewingId] = useState<string | null>(focusUser || null)

  const query: LearnerProfileListQuery = { page, pageSize, q: debounced, status, user: focusUser || undefined }
  const list = useQuery({
    queryKey: queryKeys.learnerProfileList(query),
    queryFn: ({ signal }) => learnerProfileApi.list(query, signal),
    placeholderData: keepPreviousData,
  })
  const rows = list.data?.items ?? []
  const total = list.data?.total ?? 0
  const viewing = rows.find((r) => r.user.id === viewingId) ?? null

  const columns: Column<AdminLearnerProfile>[] = [
    {
      key: 'user',
      header: 'Người học',
      main: true,
      skeleton: 'entity',
      render: (p) => (
        <EntityCell
          avatarName={p.user.fullName}
          avatarSrc={p.user.avatarUrl}
          title={p.user.fullName}
          subtitle={
            <>
              {p.email}
              {p.user.school && <> · {p.user.school}</>}
            </>
          }
        />
      ),
    },
    {
      key: 'goals',
      header: 'Mục tiêu',
      skeleton: 'badge',
      render: (p) => (
        <span className="chip-list">
          {p.goals.map((g) => (
            <Badge key={g} tone="blue" noDot>
              {GOAL_LABEL[g] ?? g}
            </Badge>
          ))}
        </span>
      ),
    },
    {
      key: 'who',
      header: 'Bạn đang là',
      hideOnMobile: true,
      render: (p) => (
        <span>
          {p.learnerType ? LEARNER_TYPE_LABEL[p.learnerType] : '-'}
          {p.major && <span className="entity-sub">{p.major}</span>}
        </span>
      ),
    },
    {
      key: 'submitted',
      header: 'Gửi lúc',
      hideOnMobile: true,
      className: 'nowrap',
      render: (p) => (p.submittedAt ? <span title={formatDateTime(p.submittedAt)}>{formatRelative(p.submittedAt)}</span> : '-'),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      skeleton: 'badge',
      render: (p) => <Badge tone={REVIEW_TONE[p.reviewStatus]}>{REVIEW_LABEL[p.reviewStatus]}</Badge>,
    },
  ]

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Nội dung' }]}
        title="Hồ sơ rèn luyện"
        subtitle="Người học chọn mục tiêu và trả lời câu hỏi cơ bản ở Tìm đồng đội. Duyệt xong hồ sơ hiện trong danh bạ và mở khoá giải case nhóm."
      />
      <Card>
        <div className="tabs" role="tablist" aria-label="Lọc theo trạng thái">
          {TABS.map((t) => (
            <button
              key={t.label}
              type="button"
              role="tab"
              aria-selected={t.status === status}
              className={t.status === status ? 'tab active' : 'tab'}
              onClick={() => {
                setStatus(t.status)
                if (focusUser) setParams({}, { replace: true })
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <FilterBar>
          <SearchBox value={search} onChange={setSearch} placeholder="Tìm tên, email hoặc trường" />
          {list.data && <ResultCount>{`${total} hồ sơ`}</ResultCount>}
        </FilterBar>
        {list.isError && !list.data ? (
          <ErrorState error={list.error} onRetry={() => list.refetch()} />
        ) : !list.isPending && rows.length === 0 ? (
          debounced ? (
            <EmptyHero icon={SearchX} tone="gray" title="Không có hồ sơ phù hợp" message="Thử từ khoá khác." />
          ) : status === 'pending' ? (
            <EmptyHero icon={UserRoundCheck} title="Không có hồ sơ chờ duyệt" message="Hồ sơ mới người học gửi ở Tìm đồng đội sẽ hiện ở đây." />
          ) : (
            <EmptyHero icon={Inbox} tone="gray" title="Chưa có hồ sơ" message="Đổi sang tab khác để xem." />
          )
        ) : (
          <>
            <DataTable columns={columns} rows={rows} rowKey={(p) => p.user.id} loading={list.isFetching} onRowClick={(p) => setViewingId(p.user.id)} />
            {total > 0 && <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={setPageSize} />}
          </>
        )}
      </Card>
      {viewing && <LearnerDrawer key={viewing.user.id + viewing.reviewStatus} item={viewing} onClose={() => setViewingId(null)} />}
    </>
  )
}

function LearnerDrawer({ item, onClose }: { item: AdminLearnerProfile; onClose(): void }) {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const skills = useQuery({ queryKey: queryKeys.skills, queryFn: skillApi.list })
  const progress = useQuery({
    queryKey: queryKeys.approvalProgress('learner_profile', item.user.id),
    queryFn: () => approvalApi.progress('learner_profile', item.user.id),
  })
  const flow = progress.data && progress.data.status !== 'cancelled' ? progress.data : null
  const pendingFlow = flow?.status === 'pending' ? flow : null
  const blocked = Boolean(pendingFlow && !pendingFlow.canAct)
  const lastLevel = pendingFlow ? pendingFlow.currentLevel >= pendingFlow.totalLevels : true

  const done = (msg: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.learnerProfiles })
    queryClient.invalidateQueries({ queryKey: queryKeys.approvalProgress('learner_profile', item.user.id) })
    toast.success(msg)
  }
  const approve = useMutation({
    mutationFn: () => learnerProfileApi.approve(item.user.id),
    onSuccess: (saved) => done(saved.reviewStatus === 'approved' ? `Đã duyệt hồ sơ ${saved.user.fullName}` : 'Đã duyệt cấp hiện tại, chuyển cấp tiếp theo'),
    onError: (err) => toast.error(errorMessage(err)),
  })
  const reject = useMutation({
    mutationFn: () => learnerProfileApi.reject(item.user.id, reason.trim()),
    onSuccess: () => {
      setRejecting(false)
      done('Đã từ chối hồ sơ')
    },
    onError: (err) => toast.error(errorMessage(err)),
  })

  const skillName = (code: string) => skills.data?.find((s) => s.code === code)?.name ?? code
  const busy = approve.isPending || reject.isPending

  return (
    <Drawer
      open
      title={item.user.fullName}
      subtitle={<Badge tone={REVIEW_TONE[item.reviewStatus]}>{REVIEW_LABEL[item.reviewStatus]}</Badge>}
      onClose={onClose}
      size="lg"
      footer={
        item.reviewStatus === 'pending' || item.reviewStatus === 'rejected' ? (
          <div className="grade-actions">
            {item.reviewStatus === 'pending' && (
              <Button variant="danger-outline" icon={CircleX} disabled={busy || blocked} onClick={() => setRejecting(true)}>
                Từ chối
              </Button>
            )}
            <Button variant="primary" icon={BadgeCheck} loading={approve.isPending} disabled={busy || blocked} onClick={() => approve.mutate()}>
              {pendingFlow && !lastLevel ? `Duyệt cấp ${pendingFlow.currentLevel}` : 'Duyệt hồ sơ'}
            </Button>
          </div>
        ) : undefined
      }
    >
      {blocked && pendingFlow && (
        <div className="field-hint">
          Đang chờ cấp {pendingFlow.currentLevel} ({pendingFlow.steps.find((s) => s.level === pendingFlow.currentLevel)?.name}). Bạn không nằm trong
          cấp duyệt này.
        </div>
      )}
      <KeyValueGrid
        columns={2}
        items={[
          { label: 'Email', value: <a href={`mailto:${item.email}`}>{item.email}</a> },
          { label: 'Trường', value: item.user.school ?? '-' },
          { label: 'Mục tiêu', value: item.goals.map((g) => GOAL_LABEL[g] ?? g).join(', ') || '-' },
          { label: 'Bạn đang là', value: item.learnerType ? LEARNER_TYPE_LABEL[item.learnerType] : '-' },
          { label: 'Ngành học', value: item.major ?? '-' },
          { label: 'Level', value: `Lv ${item.level} · ${item.casesSolved} case đã giải` },
          { label: 'Lĩnh vực quan tâm', value: item.interests.join(', ') || '-' },
          { label: 'Kỹ năng muốn tập trung', value: item.focusSkills.map(skillName).join(', ') || '-' },
          { label: 'Vai trò mạnh', value: item.roles.length ? <RoleChips roles={item.roles} /> : '-' },
          { label: 'Lịch rảnh', value: item.slots.map(slotLabel).join(', ') || '-' },
          { label: 'Gửi lúc', value: item.submittedAt ? formatDateTime(item.submittedAt) : '-' },
          ...(item.reviewedAt ? [{ label: 'Duyệt / từ chối lúc', value: formatDateTime(item.reviewedAt) }] : []),
          ...(item.reviewNote ? [{ label: 'Lý do từ chối', value: item.reviewNote, state: 'bad' as const }] : []),
        ]}
      />
      {item.bio && (
        <div className="mt16">
          <div className="form-card-title">Giới thiệu</div>
          <p className="proposal-note">{item.bio}</p>
        </div>
      )}
      {flow && <ApprovalProgress request={flow} />}

      <Dialog
        open={rejecting}
        title="Từ chối hồ sơ"
        description="Người học nhận thông báo kèm lý do và có thể sửa rồi gửi lại."
        onClose={() => setRejecting(false)}
        onSubmit={() => reason.trim().length >= 5 && reject.mutate()}
        submitLabel="Từ chối"
        danger
        busy={reject.isPending}
      >
        <Field label="Lý do" htmlFor="lp-reason" required hint="Tối thiểu 5 ký tự">
          <Textarea id="lp-reason" rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
      </Dialog>
    </Drawer>
  )
}
