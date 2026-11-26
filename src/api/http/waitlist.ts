import type { Paged } from '@/types'
import { request, requestPaged } from './client'

/** Một người trong danh sách chờ dùng thử Case Coach */
export interface CoachWaitlistEntry {
  id: string
  email: string
  name: string | null
  school: string | null
  note: string | null
  /** Tài khoản liên kết, hoặc tài khoản đăng ký sau bằng cùng email */
  userId: string | null
  isRegistered: boolean
  createdAt: string
}

export interface CoachWaitlistQuery {
  page: number
  pageSize: number
  q?: string
}

/** Kích thước trang tối đa API cho phép - dùng khi xuất CSV */
export const WAITLIST_MAX_PAGE_SIZE = 100

export const waitlistApi = {
  listCoach: (q: CoachWaitlistQuery, signal?: AbortSignal): Promise<Paged<CoachWaitlistEntry>> =>
    requestPaged<CoachWaitlistEntry>('/admin/waitlist/coach', { query: { ...q }, signal }),
  removeCoach: (id: string) => request<null>(`/admin/waitlist/coach/${id}`, { method: 'DELETE' }),
  /** Lấy hết mọi trang theo bộ lọc hiện tại (xuất CSV) */
  async listAllCoach(q?: string, signal?: AbortSignal): Promise<CoachWaitlistEntry[]> {
    const all: CoachWaitlistEntry[] = []
    for (let page = 1; ; page++) {
      const res = await waitlistApi.listCoach({ page, pageSize: WAITLIST_MAX_PAGE_SIZE, q }, signal)
      all.push(...res.items)
      if (res.items.length === 0 || page * WAITLIST_MAX_PAGE_SIZE >= res.total) return all
    }
  },
}
