import type { Paged } from '@/types'
import { request, requestPaged } from './client'

export type CompetitionSuggestionStatus = 'new' | 'done'

/** Gợi ý cuộc thi khách gửi từ trang Cuộc thi trên web */
export interface CompetitionSuggestion {
  id: string
  email: string
  name: string
  url: string | null
  note: string | null
  userId: string | null
  userName: string | null
  status: CompetitionSuggestionStatus
  createdAt: string
}

export interface CompetitionSuggestionQuery {
  page: number
  pageSize: number
  status?: CompetitionSuggestionStatus | ''
  search?: string
}

export const competitionSuggestionApi = {
  list: (q: CompetitionSuggestionQuery, signal?: AbortSignal): Promise<Paged<CompetitionSuggestion>> =>
    requestPaged<CompetitionSuggestion>('/admin/competition-suggestions', {
      query: { page: q.page, pageSize: q.pageSize, ...(q.status ? { status: q.status } : {}), ...(q.search ? { search: q.search } : {}) },
      signal,
    }),
  setStatus: (id: string, status: CompetitionSuggestionStatus) =>
    request<CompetitionSuggestion>(`/admin/competition-suggestions/${id}`, { method: 'PATCH', body: { status } }),
  remove: (id: string) => request<null>(`/admin/competition-suggestions/${id}`, { method: 'DELETE' }),
}
