import type { UserStatus } from '@/types'

export const STATUS_LABEL: Record<UserStatus, string> = { active: 'Hoạt động', locked: 'Đã khoá' }

export const STATUS_OPTIONS = (Object.keys(STATUS_LABEL) as UserStatus[]).map((s) => ({ value: s, label: STATUS_LABEL[s] }))
