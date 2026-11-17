import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, KeyRound, Lock, LockOpen, Pencil, Trash2, UserX } from 'lucide-react'
import { ApiError, userApi } from '@/api'
import {
  Avatar,
  Button,
  Card,
  EmptyHero,
  ErrorState,
  KeyValueGrid,
  PageHeader,
  Skeleton,
  Tooltip,
} from '@/components/ui'
import { useAuth } from '@/contexts/auth'
import { queryKeys } from '@/lib/queryClient'
import { formatDateTime, formatRelative } from '@/utils/format'
import { RoleBadge, StatusBadge, VerifiedBadge } from './userBits'
import { useUserActions } from './useUserActions'

const SELF_HINT = 'Không thể thao tác trên tài khoản của chính bạn'

export function UserDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { user: me } = useAuth()
  const query = useQuery({ queryKey: queryKeys.user(id), queryFn: () => userApi.get(id) })
  const { actions, dialogs, statusPending } = useUserActions({ onDeleted: () => navigate('/users', { replace: true }) })

  const crumbs = [{ label: 'Người dùng', to: '/users' }, { label: 'Chi tiết' }]
  const back = (
    <Button icon={ArrowLeft} onClick={() => navigate('/users')}>
      Danh sách
    </Button>
  )

  if (query.isPending) {
    return (
      <>
        <PageHeader crumbs={crumbs} title={<Skeleton width={220} height={26} />} />
        <div className="grid g12 top">
          <Card>
            <div className="profile-head">
              <Skeleton width={96} height={96} round />
              <Skeleton width={160} height={18} />
              <Skeleton width={200} />
            </div>
          </Card>
          <Card>
            <div className="stack">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} height={44} width="100%" />
              ))}
            </div>
          </Card>
        </div>
      </>
    )
  }

  // Đã có dữ liệu mà tải lại nền lỗi: giữ trang đang xem
  if (query.isError && !query.data) {
    const notFound = query.error instanceof ApiError && query.error.status === 404
    return (
      <>
        <PageHeader crumbs={crumbs} title="Chi tiết người dùng" actions={back} />
        <Card>
          {notFound ? (
            <EmptyHero icon={UserX} tone="gray" title="Không tìm thấy người dùng" message="Tài khoản có thể đã bị xoá." actions={back} />
          ) : (
            <ErrorState error={query.error} onRetry={() => query.refetch()} />
          )}
        </Card>
      </>
    )
  }

  const u = query.data
  if (!u) return null
  const isSelf = u.id === me?.id
  const locked = u.status === 'locked'

  return (
    <>
      <PageHeader
        crumbs={crumbs}
        title={u.fullName}
        subtitle={u.email}
        actions={
          <>
            {back}
            <Button icon={Pencil} variant="primary" onClick={() => actions.openEdit(u)}>
              Sửa
            </Button>
          </>
        }
      />

      <div className="grid g12 top">
        <Card>
          <div className="profile-head">
            <Avatar name={u.fullName} src={u.avatarUrl} size="xl" />
            <div className="card-title">
              {u.fullName}
              {isSelf && <span className="mo"> (bạn)</span>}
            </div>
            <div className="row center">
              <RoleBadge role={u.role} />
              <StatusBadge status={u.status} />
            </div>
          </div>
          <div className="detail-actions">
            <Button icon={KeyRound} block onClick={() => actions.openReset(u)}>
              Đặt lại mật khẩu
            </Button>
            <Tooltip text={isSelf ? SELF_HINT : null} block>
              <Button icon={locked ? LockOpen : Lock} block disabled={isSelf} loading={statusPending} onClick={() => actions.toggleLock(u)}>
                {locked ? 'Mở khoá tài khoản' : 'Khoá tài khoản'}
              </Button>
            </Tooltip>
            <Tooltip text={isSelf ? SELF_HINT : null} block>
              <Button icon={Trash2} variant="danger-outline" block disabled={isSelf} onClick={() => actions.askDelete(u)}>
                Xoá người dùng
              </Button>
            </Tooltip>
          </div>
        </Card>

        <div className="stack">
          <Card title="Thông tin tài khoản">
            <KeyValueGrid
              columns={2}
              items={[
                { label: 'Họ và tên', value: u.fullName },
                { label: 'Email', value: u.email },
                { label: 'Điện thoại', value: u.phone || <span className="mo">Chưa có</span> },
                { label: 'Xác minh email', value: <VerifiedBadge verified={u.emailVerified} /> },
                { label: 'Vai trò', value: <RoleBadge role={u.role} /> },
                { label: 'Truy cập trang quản trị', value: u.isStaff ? 'Có' : 'Không' },
              ]}
            />
          </Card>
          <Card title="Hoạt động">
            <KeyValueGrid
              columns={2}
              items={[
                {
                  label: 'Đăng nhập gần nhất',
                  value: u.lastLoginAt ? `${formatDateTime(u.lastLoginAt)} · ${formatRelative(u.lastLoginAt)}` : 'Chưa đăng nhập',
                },
                { label: 'Trạng thái', value: <StatusBadge status={u.status} /> },
                { label: 'Ngày tạo', value: formatDateTime(u.createdAt) },
                { label: 'Cập nhật lần cuối', value: formatDateTime(u.updatedAt) },
                { label: 'Mã người dùng', value: <span className="code-tag">{u.id}</span> },
              ]}
            />
          </Card>
        </div>
      </div>

      {dialogs}
    </>
  )
}
