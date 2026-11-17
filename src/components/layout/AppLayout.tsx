import { Suspense, useEffect, useState } from 'react'
import clsx from 'clsx'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ChevronDown, LogOut, Menu, PanelLeftClose, PanelLeftOpen, UserRound } from 'lucide-react'
import {
  Avatar,
  ConfirmDialog,
  DropdownMenu,
  Icon,
  IconButton,
  Loading,
  BrandLogo,
  LogoMark,
  MenuDivider,
  MenuHeader,
  MenuItem,
} from '@/components/ui'
import { config } from '@/config'
import { useAuth } from '@/contexts/auth'
import { canManageContent, isAdmin } from '@/hooks/useIsAdmin'
import { formatToday } from '@/utils/format'
import { NAV_GROUPS, pageTitle } from './nav'

const COLLAPSE_KEY = 'cace.cms.sidebar-collapsed'

const readCollapsed = () => {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === '1'
  } catch {
    return false
  }
}

export function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(readCollapsed)
  // Mở menu điện thoại gắn với trang hiện tại: chuyển trang là tự đóng
  const [navOpenAt, setNavOpenAt] = useState<string | null>(null)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const navOpen = navOpenAt === location.pathname
  const title = pageTitle(location.pathname)

  useEffect(() => {
    document.title = `${title} · ${config.appName}`
  }, [title])

  if (!user) return null

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, c ? '0' : '1')
      } catch {
        // bỏ qua
      }
      return !c
    })
  }

  const groups = NAV_GROUPS.filter((g) => (g.access === 'admin' ? isAdmin(user) : g.access === 'content' ? canManageContent(user) : true))

  return (
    <div className={clsx('app', collapsed && 'collapsed', navOpen && 'nav-open')}>
      <aside className="sidebar">
        <Link to="/" className="sidebar-logo" title={config.appName}>
          <LogoMark className="logo-mark sidebar-logo-icon" />
          <div className="sidebar-brand">
            <BrandLogo className="sidebar-wordmark" />
          </div>
        </Link>
        <nav className="sidebar-nav" aria-label="Điều hướng chính">
          {groups.map((group) => (
            <div key={group.label}>
              <div className="nav-group">{group.label}</div>
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className="nav-link"
                  title={collapsed ? item.label : undefined}
                  onClick={() => setNavOpenAt(null)}
                >
                  <Icon icon={item.icon} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-foot">
          <button type="button" className="sidebar-collapse" onClick={toggleCollapsed} title={collapsed ? 'Mở rộng menu' : undefined}>
            <Icon icon={collapsed ? PanelLeftOpen : PanelLeftClose} />
            <span>Thu gọn menu</span>
          </button>
        </div>
      </aside>
      <div className="sidebar-scrim" onClick={() => setNavOpenAt(null)} aria-hidden="true" />

      <div className="main">
        <header className="topbar">
          <IconButton className="menu-toggle" icon={Menu} label="Mở menu" onClick={() => setNavOpenAt(location.pathname)} />
          <div className="topbar-title">{title}</div>
          <div className="topbar-right">
            <span className="topbar-date">{formatToday()}</span>
            <DropdownMenu
              label="Tài khoản"
              trigger={({ open, toggle }) => (
                <button type="button" className="account-btn" aria-haspopup="menu" aria-expanded={open} onClick={toggle}>
                  <Avatar name={user.fullName} src={user.avatarUrl} size="sm" />
                  <span className="account-meta">
                    <b>{user.fullName}</b>
                    <small>{user.role.name}</small>
                  </span>
                  <Icon icon={ChevronDown} />
                </button>
              )}
            >
              <MenuHeader title={user.fullName} subtitle={user.email} />
              <MenuItem icon={UserRound} onSelect={() => navigate('/profile')}>
                Hồ sơ
              </MenuItem>
              <MenuDivider />
              <MenuItem icon={LogOut} danger onSelect={() => setConfirmLogout(true)}>
                Đăng xuất
              </MenuItem>
            </DropdownMenu>
          </div>
        </header>
        <main className="page">
          <Suspense fallback={<Loading />}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      <ConfirmDialog
        open={confirmLogout}
        title="Đăng xuất?"
        message="Bạn sẽ cần đăng nhập lại để vào trang quản trị."
        confirmLabel="Đăng xuất"
        busy={loggingOut}
        onClose={() => setConfirmLogout(false)}
        onConfirm={async () => {
          setLoggingOut(true)
          await logout()
          navigate('/login', { replace: true })
        }}
      />
    </div>
  )
}
