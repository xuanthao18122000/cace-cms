import type { AdminLearnerProfile, LearnerProfileListQuery } from '@/types'
import { request, requestPaged } from './client'

export const learnerProfileApi = {
  list: (q: LearnerProfileListQuery, signal?: AbortSignal) =>
    requestPaged<AdminLearnerProfile>('/admin/learner-profiles', { query: { ...q }, signal }),
  approve: (userId: string) => request<AdminLearnerProfile>(`/admin/learner-profiles/${userId}/approve`, { method: 'POST' }),
  reject: (userId: string, reason: string) =>
    request<AdminLearnerProfile>(`/admin/learner-profiles/${userId}/reject`, { method: 'POST', body: { reason } }),
}
