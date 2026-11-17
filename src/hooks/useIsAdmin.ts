import { config } from '@/config'
import { useAuth } from '@/contexts/auth'
import type { User } from '@/types'

export const isAdmin = (user: User | null | undefined) => user?.role.code === config.adminRoleCode

/** Vai được quản lý nội dung: admin, mentor */
export const canManageContent = (user: User | null | undefined) => Boolean(user && config.contentRoleCodes.includes(user.role.code))

export function useIsAdmin() {
  return isAdmin(useAuth().user)
}

export function useCanManageContent() {
  return canManageContent(useAuth().user)
}
