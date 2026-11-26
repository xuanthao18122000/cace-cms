import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Loading } from '@/components/ui'
import { useAuth } from '@/contexts/auth'
import { canManageContent, isAdmin } from '@/hooks/useIsAdmin'
import { SessionExpiredDialog } from './SessionExpiredDialog'

export function RequireAuth() {
  const { user, initializing } = useAuth()
  const location = useLocation()
  if (initializing) return <Loading full label="Đang kiểm tra đăng nhập" />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  return (
    <>
      <Outlet />
      <SessionExpiredDialog />
    </>
  )
}

export function GuestOnly() {
  const { user, initializing } = useAuth()
  if (initializing) return <Loading full label="Đang kiểm tra đăng nhập" />
  if (user) return <Navigate to="/" replace />
  return <Outlet />
}

/** Trang chỉ dành cho vai admin */
export function RequireAdmin() {
  const { user } = useAuth()
  if (!isAdmin(user)) return <Navigate to="/" replace />
  return <Outlet />
}

/** Trang nội dung (rèn luyện): vai admin hoặc mentor */
export function RequireContentAccess() {
  const { user } = useAuth()
  if (!canManageContent(user)) return <Navigate to="/" replace />
  return <Outlet />
}
