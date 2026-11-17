import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { FolderTree, LibraryBig, ShieldCheck, Sparkles, UserCheck, UserLock, UserPlus, UserRound, Users } from 'lucide-react'
import { statsApi } from '@/api'
import {
  ActionRow,
  Avatar,
  Button,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  ProgressBar,
  Skeleton,
  StatCard,
  type Tone,
} from '@/components/ui'
import { useAuth } from '@/contexts/auth'
import { canManageContent, useIsAdmin } from '@/hooks/useIsAdmin'
import { queryKeys } from '@/lib/queryClient'
import { formatNumber, formatToday } from '@/utils/format'

const BAR_TONES: Tone[] = ['brand', 'purple', 'green', 'orange', 'blue', 'gray']

export function DashboardPage() {
  const { user } = useAuth()
  const admin = useIsAdmin()
  if (!user) return null
  const firstName = user.fullName.trim().split(/\s+/).pop()

  return (
    <>
      <PageHeader title={`Xin chào, ${firstName}`} subtitle={formatToday()} />
      {admin ? <AdminDashboard /> : <StaffWelcome />}
    </>
  )
}

function AdminDashboard() {
  const navigate = useNavigate()
  const stats = useQuery({ queryKey: queryKeys.stats, queryFn: statsApi.get })

  if (stats.isError) {
    return (
      <Card>
        <ErrorState error={stats.error} onRetry={() => stats.refetch()} />
      </Card>
    )
  }

  const s = stats.data
  const loading = stats.isPending
  const pct = (n: number) => (s && s.totalUsers > 0 ? Math.round((n / s.totalUsers) * 100) : 0)
  const byRole = [...(s?.usersByRole ?? [])].sort((a, b) => b.count - a.count)

  return (
    <>
      <div className="grid g5 mb16">
        <StatCard label="Tổng người dùng" value={s && formatNumber(s.totalUsers)} sub="Mọi vai trò" icon={Users} loading={loading} />
        <StatCard
          label="Đang hoạt động"
          value={s && formatNumber(s.activeUsers)}
          sub={s && `${pct(s.activeUsers)}% tổng số`}
          icon={UserCheck}
          tone="green"
          loading={loading}
        />
        <StatCard label="Đã khoá" value={s && formatNumber(s.lockedUsers)} sub={s && `${pct(s.lockedUsers)}% tổng số`} icon={UserLock} tone="red" loading={loading} />
        <StatCard label="Mới trong 7 ngày" value={s && formatNumber(s.newUsersLast7Days)} sub="Tài khoản đăng ký" icon={UserPlus} tone="blue" loading={loading} />
        <StatCard label="Vai trò" value={s && formatNumber(s.totalRoles)} sub="Gồm vai hệ thống" icon={ShieldCheck} tone="purple" loading={loading} />
      </div>

      <div className="grid g21 top">
        <Card title="Người dùng theo vai trò" subtitle="Tỉ lệ trên tổng số tài khoản">
          {loading ? (
            <div className="bar-list">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="bar-item">
                  <Skeleton width={120} />
                  <Skeleton height={8} width="100%" />
                </div>
              ))}
            </div>
          ) : byRole.length === 0 ? (
            <EmptyState>Chưa có dữ liệu</EmptyState>
          ) : (
            <div className="bar-list">
              {byRole.map((r, i) => (
                <div key={r.roleId} className="bar-item">
                  <div className="bar-head">
                    <span>{r.name}</span>
                    <b className="num">
                      {formatNumber(r.count)} <span className="mo">· {pct(r.count)}%</span>
                    </b>
                  </div>
                  <ProgressBar value={pct(r.count)} tone={BAR_TONES[i % BAR_TONES.length]} />
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Lối tắt">
          <div className="action-list">
            <ActionRow icon={UserPlus} title="Thêm người dùng" subtitle="Tạo tài khoản mentor, quản trị viên" onClick={() => navigate('/users?new=1')} />
            <ActionRow icon={Users} tone="blue" title="Quản lý người dùng" subtitle="Tìm, khoá, đặt lại mật khẩu" onClick={() => navigate('/users')} />
            <ActionRow icon={ShieldCheck} tone="purple" title="Vai trò" subtitle="Nhóm người dùng theo vai" onClick={() => navigate('/roles')} />
            <ActionRow icon={LibraryBig} tone="green" title="Thư viện case" subtitle="Soạn, xuất bản đề luyện tập" onClick={() => navigate('/cases')} />
            <ActionRow icon={UserRound} tone="gray" title="Hồ sơ của tôi" subtitle="Thông tin cá nhân, mật khẩu" onClick={() => navigate('/profile')} />
          </div>
        </Card>
      </div>
    </>
  )
}

function StaffWelcome() {
  const { user } = useAuth()
  const navigate = useNavigate()
  if (!user) return null
  const content = canManageContent(user)
  return (
    <div className="grid g21 top">
      <Card highlight>
        <div className="welcome">
          <Avatar name={user.fullName} src={user.avatarUrl} size="lg" />
          <div className="min-w-0">
            <div className="welcome-eyebrow">
              <Sparkles className="i" aria-hidden="true" /> {user.role.name}
            </div>
            <h2>Chào mừng bạn đến với CACE CMS</h2>
            {content ? (
              <>
                <p>
                  Bạn có thể soạn và xuất bản case luyện tập trong <b>Thư viện case</b>. Công cụ chấm bài và cuộc thi sẽ lần lượt xuất hiện ở đây.
                </p>
                <div className="page-actions welcome-actions">
                  <Button variant="primary" icon={LibraryBig} onClick={() => navigate('/cases')}>
                    Mở thư viện case
                  </Button>
                </div>
              </>
            ) : (
              <p>
                Các công cụ dành cho vai <b>{user.role.name}</b> (chấm bài, quản lý case, cuộc thi) sẽ lần lượt xuất hiện ở đây. Hiện bạn có thể
                cập nhật hồ sơ và mật khẩu.
              </p>
            )}
          </div>
        </div>
      </Card>
      <Card title="Lối tắt">
        <div className="action-list">
          {content && (
            <>
              <ActionRow icon={LibraryBig} tone="green" title="Thư viện case" subtitle="Soạn, xuất bản đề luyện tập" onClick={() => navigate('/cases')} />
              <ActionRow icon={FolderTree} tone="blue" title="Danh mục case" subtitle="Lĩnh vực, ngành, level" onClick={() => navigate('/case-taxonomies')} />
            </>
          )}
          <ActionRow icon={UserRound} title="Hồ sơ của tôi" subtitle="Thông tin cá nhân, ảnh đại diện, mật khẩu" onClick={() => navigate('/profile')} />
        </div>
      </Card>
    </div>
  )
}
