import type { AdminStats } from '@/types'
import { request } from './client'

export const statsApi = {
  get: () => request<AdminStats>('/admin/stats'),
}
