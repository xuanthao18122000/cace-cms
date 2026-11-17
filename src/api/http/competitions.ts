import type { AdminCompetition, CompetitionInput, CompetitionListQuery } from '@/types'
import { request, requestPaged } from './client'

export const competitionApi = {
  list: (q: CompetitionListQuery, signal?: AbortSignal) => requestPaged<AdminCompetition>('/admin/competitions', { query: { ...q }, signal }),
  get: (id: string) => request<AdminCompetition>(`/admin/competitions/${id}`),
  create: (input: CompetitionInput) => request<AdminCompetition>('/admin/competitions', { method: 'POST', body: input }),
  update: (id: string, input: Partial<CompetitionInput>) => request<AdminCompetition>(`/admin/competitions/${id}`, { method: 'PATCH', body: input }),
  remove: (id: string) => request<null>(`/admin/competitions/${id}`, { method: 'DELETE' }),
  /** Duyệt đề xuất (pending/rejected) → published, gửi email cho người gửi */
  approve: (id: string) => request<AdminCompetition>(`/admin/competitions/${id}/approve`, { method: 'POST' }),
  /** Từ chối đề xuất đang chờ duyệt, gửi email kèm lý do */
  reject: (id: string, reason: string) => request<AdminCompetition>(`/admin/competitions/${id}/reject`, { method: 'POST', body: { reason } }),
}
