import { config } from '@/config'
import type { TeamPostRole, TeamPostSlot, TeamPostStatus } from '@/types'

export const STATUS_LABEL: Record<TeamPostStatus, string> = { open: 'Đang tìm', closed: 'Đã đóng', hidden: 'Đã ẩn' }

export const ROLE_LABEL: Record<TeamPostRole, string> = {
  research: 'Research & Data',
  finance: 'Finance Model',
  strategy: 'Chiến lược',
  slide: 'Storytelling & Slide',
  marketing: 'Marketing',
}

export const SLOT_LABEL: Record<TeamPostSlot, string> = { 'weekday-evening': 'Tối trong tuần', weekend: 'Cuối tuần', flexible: 'Linh hoạt' }

/** Mã lạ (máy chủ thêm vai / khung giờ mới) thì hiện nguyên mã */
export const roleLabel = (code: string) => ROLE_LABEL[code as TeamPostRole] ?? code
export const slotLabel = (code: string) => SLOT_LABEL[code as TeamPostSlot] ?? code

export const teamPostWebUrl = (id: string) => `${config.webUrl}/tim-dong-ga/${id}`
