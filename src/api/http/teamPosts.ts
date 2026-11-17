import type { AdminTeamPost, TeamPostListQuery, TeamPostStatus } from '@/types'
import { request, requestPaged } from './client'

export const teamPostApi = {
  list: (q: TeamPostListQuery, signal?: AbortSignal) => requestPaged<AdminTeamPost>('/admin/team-posts', { query: { ...q }, signal }),
  /** Kiểm duyệt: ẩn / hiện lại / đóng tin */
  setStatus: (id: string, status: TeamPostStatus) =>
    request<{ id: string; status: TeamPostStatus }>(`/admin/team-posts/${id}`, { method: 'PATCH', body: { status } }),
}
