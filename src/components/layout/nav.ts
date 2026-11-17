import { Bot, FileCheck2, FolderTree, LayoutDashboard, LibraryBig, ShieldCheck, Trophy, Users, UsersRound } from 'lucide-react'
import type { IconType } from '@/components/ui'

export interface NavItem {
  to: string
  label: string
  icon: IconType
  /** Chỉ sáng khi đúng đường dẫn (trang chủ) */
  end?: boolean
}

export interface NavGroup {
  label: string
  /** admin: chỉ vai admin; content: admin hoặc mentor (chưa có RBAC) */
  access?: 'admin' | 'content'
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  { label: 'Tổng quan', items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true }] },
  {
    label: 'Nội dung',
    access: 'content',
    items: [
      { to: '/cases', label: 'Thư viện case', icon: LibraryBig },
      { to: '/case-taxonomies', label: 'Danh mục case', icon: FolderTree },
      { to: '/submissions', label: 'Bài nộp', icon: FileCheck2 },
      { to: '/competitions', label: 'Cuộc thi', icon: Trophy },
      { to: '/team-posts', label: 'Tìm Đồng Gà', icon: UsersRound },
    ],
  },
  {
    label: 'Người dùng',
    access: 'admin',
    items: [
      { to: '/users', label: 'Người dùng', icon: Users },
      { to: '/roles', label: 'Vai trò', icon: ShieldCheck },
      { to: '/waitlist/coach', label: 'Danh sách chờ Coach', icon: Bot },
    ],
  },
]

/** Tiêu đề trên topbar theo đường dẫn */
export function pageTitle(pathname: string): string {
  if (pathname === '/') return 'Dashboard'
  if (pathname === '/users') return 'Người dùng'
  if (pathname.startsWith('/users/')) return 'Chi tiết người dùng'
  if (pathname === '/roles') return 'Vai trò'
  if (pathname === '/waitlist/coach') return 'Danh sách chờ Coach'
  if (pathname === '/cases') return 'Thư viện case'
  if (pathname === '/cases/new') return 'Thêm case'
  if (pathname.startsWith('/cases/')) return 'Sửa case'
  if (pathname === '/case-taxonomies') return 'Danh mục case'
  if (pathname === '/submissions') return 'Bài nộp'
  if (pathname.startsWith('/submissions/')) return 'Chi tiết bài nộp'
  if (pathname === '/competitions') return 'Cuộc thi'
  if (pathname === '/competitions/new') return 'Thêm cuộc thi'
  if (pathname.startsWith('/competitions/')) return 'Sửa cuộc thi'
  if (pathname === '/team-posts') return 'Tìm Đồng Gà'
  if (pathname === '/profile') return 'Hồ sơ của tôi'
  return 'Không tìm thấy trang'
}
